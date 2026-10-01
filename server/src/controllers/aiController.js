const aiEvaluationService = require('../services/aiEvaluationService');
const geminiService = require('../services/geminiService');
const Question = require('../models/Question');
const QuestionRubric = require('../models/QuestionRubric');
const AIEvaluation = require('../models/AIEvaluation');
const Examination = require('../models/Examination');
const Syllabus = require('../models/Syllabus');
const MarksBlueprint = require('../models/MarksBlueprint');
const QuestionPaper = require('../models/QuestionPaper');
const { logAudit } = require('../services/auditService');

/**
 * FEATURE 1: AI Question Paper Generation from Syllabus
 * Flow: Paper Setter -> Add Syllabus -> Save Syllabus -> Generate Paper with AI
 */
exports.generatePaperFromSyllabus = async (req, res, next) => {
  try {
    const { examinationId, targetTotalMarks, targetQuestionCount } = req.body;

    if (!examinationId) {
      return res.status(400).json({ success: false, message: 'Examination ID is required.' });
    }

    const exam = await Examination.findById(examinationId);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Examination not found.' });
    }

    // Retrieve saved syllabus strictly from existing system
    const syllabus = await Syllabus.findOne({ examination: examinationId });
    if (!syllabus || !Array.isArray(syllabus.units) || syllabus.units.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No syllabus found for this examination. Please add and save the syllabus first before generating a paper with AI.'
      });
    }

    // Retrieve blueprint/marking scheme if configured
    const blueprint = await MarksBlueprint.findOne({ examination: examinationId });

    // Call Gemini Service
    const generatedPaper = await geminiService.generateQuestionPaper({
      examination: exam,
      syllabus,
      blueprint,
      targetTotalMarks: targetTotalMarks || exam.maxMarks,
      targetQuestionCount
    });

    await logAudit({
      req,
      action: 'AI_QUESTION_PAPER_GENERATED',
      entity: 'Examination',
      entityId: exam._id,
      details: {
        examinationName: exam.name,
        subject: exam.subject,
        questionCount: generatedPaper.questionCount,
        totalMarks: generatedPaper.total_marks
      }
    });

    res.status(200).json({
      success: true,
      message: 'Question paper generated strictly from syllabus using Gemini AI.',
      data: generatedPaper
    });
  } catch (error) {
    next(error);
  }
};

/**
 * FEATURE 1 HELPER: Regenerate a single question with AI
 * Allows Paper Setter to replace or refresh an individual question
 */
exports.regenerateSingleQuestion = async (req, res, next) => {
  try {
    const { subject, unit, topic, marks, difficulty, questionType, existingQuestions } = req.body;

    const newQuestion = await geminiService.regenerateQuestion({
      subject,
      unit,
      topic,
      marks: Number(marks) || 10,
      difficulty,
      questionType,
      existingQuestions: Array.isArray(existingQuestions) ? existingQuestions : []
    });

    res.status(200).json({
      success: true,
      message: 'Question regenerated successfully using Gemini AI.',
      question: newQuestion
    });
  } catch (error) {
    next(error);
  }
};

/**
 * FEATURE 1 APPROVAL: Save AI-generated and Paper Setter-reviewed paper
 */
exports.saveGeneratedPaper = async (req, res, next) => {
  try {
    const { examinationId, paperTitle, instructions, questions } = req.body;

    const exam = await Examination.findById(examinationId);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Examination not found.' });
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one question is required.' });
    }

    // Persist questions in Question collection so they belong to the bank and have valid IDs
    const paperQuestions = [];
    let calculatedTotal = 0;

    for (let i = 0; i < questions.length; i++) {
      const qData = questions[i];
      let questionDoc;

      if (qData.questionId && qData.questionId.match(/^[0-9a-fA-F]{24}$/)) {
        questionDoc = await Question.findById(qData.questionId);
      }

      if (!questionDoc) {
        questionDoc = await Question.create({
          subject: exam.subject,
          examination: exam._id,
          unit: qData.unit || `Unit 1`,
          topic: qData.topic || `General`,
          questionText: qData.questionText || qData.question,
          questionType: qData.questionType || 'DESCRIPTIVE',
          marks: Number(qData.marks) || 10,
          difficulty: (qData.difficulty || 'MEDIUM').toUpperCase(),
          expectedAnswer: qData.expectedAnswer || 'Model answer and key points.',
          options: qData.options || [],
          createdBy: req.user._id
        });
      }

      const qMarks = Number(qData.marks) || questionDoc.marks;
      calculatedTotal += qMarks;

      paperQuestions.push({
        question: questionDoc._id,
        questionNumber: i + 1,
        marks: qMarks,
        customInstruction: qData.customInstruction || ''
      });
    }

    // Find or create QuestionPaper in DRAFT status
    let paper = await QuestionPaper.findOne({ examination: exam._id });
    if (paper) {
      if (paper.status === 'APPROVED') {
        return res.status(400).json({
          success: false,
          message: 'Cannot overwrite an approved paper. Revision must be requested by Admin.'
        });
      }
      paper.paperTitle = paperTitle || paper.paperTitle;
      paper.instructions = instructions || paper.instructions;
      paper.questions = paperQuestions;
      paper.totalMarks = calculatedTotal;
      paper.status = 'DRAFT';
      await paper.save();
    } else {
      paper = await QuestionPaper.create({
        examination: exam._id,
        paperTitle: paperTitle || `${exam.name} - Question Paper`,
        instructions: instructions || [
          'All questions are compulsory.',
          'Write concise, well-structured, point-wise answers.',
          'Draw diagrams wherever relevant.'
        ],
        questions: paperQuestions,
        totalMarks: calculatedTotal,
        status: 'DRAFT',
        submittedBy: req.user._id
      });
    }

    await logAudit({
      req,
      action: 'QUESTION_PAPER_SAVED_FROM_AI',
      entity: 'QuestionPaper',
      entityId: paper._id,
      details: {
        examination: exam.name,
        questionCount: paperQuestions.length,
        totalMarks: calculatedTotal
      }
    });

    res.status(200).json({
      success: true,
      message: 'Question paper saved successfully as DRAFT. Ready for final review and submission.',
      questionPaper: paper
    });
  } catch (error) {
    next(error);
  }
};

/**
 * FEATURE 2: Evaluate Single Question Answer (called individually or by workspace)
 */
exports.evaluateQuestionAnswer = async (req, res, next) => {
  try {
    const { answerCopyId, questionId, studentAnswer, scannedMedia } = req.body;

    const question = await Question.findById(questionId).populate('rubric');
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    const rubricCriteria = question.rubric ? question.rubric.criteria : [];

    const aiResult = await aiEvaluationService.evaluateAnswer({
      questionText: question.questionText,
      studentAnswer: studentAnswer || '',
      referenceAnswer: question.expectedAnswer,
      maxMarks: question.marks,
      rubricCriteria,
      unit: question.unit,
      topic: question.topic,
      scannedMedia
    });

    // Create or update AIEvaluation tracking entry
    let aiEvaluationDoc;
    if (answerCopyId) {
      aiEvaluationDoc = await AIEvaluation.findOneAndUpdate(
        { answerCopy: answerCopyId, question: question._id },
        {
          answerCopy: answerCopyId,
          question: question._id,
          studentAnswer: studentAnswer || '',
          referenceAnswer: question.expectedAnswer,
          maxMarks: question.marks,
          rubric: rubricCriteria,
          aiSuggestedMarks: aiResult.suggestedMarks,
          criteriaEvaluation: aiResult.criteriaEvaluation,
          overallFeedback: aiResult.overallFeedback,
          modelUsed: aiResult.modelUsed || 'gemini-1.5-pro',
          evaluatorAction: 'PENDING'
        },
        { upsert: true, new: true }
      );
    }

    await logAudit({
      req,
      action: 'AI_EVALUATION_REQUESTED',
      entity: 'AIEvaluation',
      entityId: aiEvaluationDoc ? aiEvaluationDoc._id : question._id,
      details: {
        questionId: question._id,
        suggestedMarks: aiResult.suggestedMarks,
        maxMarks: question.marks
      }
    });

    res.status(200).json({
      success: true,
      data: {
        ...aiResult,
        aiEvaluationId: aiEvaluationDoc ? aiEvaluationDoc._id : null
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Evaluator / Admin Decision Recording
 */
exports.recordEvaluatorDecision = async (req, res, next) => {
  try {
    const { aiEvaluationId, answerCopyId, questionId, evaluatorFinalMarks, evaluatorAction, evaluatorNotes } = req.body;

    let query = {};
    if (aiEvaluationId) {
      query._id = aiEvaluationId;
    } else if (answerCopyId && questionId) {
      query = { answerCopy: answerCopyId, question: questionId };
    }

    const doc = await AIEvaluation.findOne(query);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'AI evaluation record not found' });
    }

    doc.evaluatorFinalMarks = Number(evaluatorFinalMarks);
    doc.evaluatorAction = evaluatorAction || (evaluatorFinalMarks === doc.aiSuggestedMarks ? 'ACCEPTED' : 'MODIFIED');
    doc.evaluatorNotes = evaluatorNotes || '';
    await doc.save();

    await logAudit({
      req,
      action: 'AI_EVALUATION_DECISION_RECORDED',
      entity: 'AIEvaluation',
      entityId: doc._id,
      details: {
        aiSuggested: doc.aiSuggestedMarks,
        evaluatorFinal: doc.evaluatorFinalMarks,
        action: doc.evaluatorAction
      }
    });

    res.status(200).json({
      success: true,
      message: 'Decision recorded',
      aiEvaluation: doc
    });
  } catch (error) {
    next(error);
  }
};
