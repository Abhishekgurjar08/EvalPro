const Evaluation = require('../models/Evaluation');
const AnswerCopy = require('../models/AnswerCopy');
const Examination = require('../models/Examination');
const AIEvaluation = require('../models/AIEvaluation');
const aiEvaluationService = require('../services/aiEvaluationService');
const { calculateAndSaveResult } = require('../services/resultService');
const { logAudit } = require('../services/auditService');
const { createNotification } = require('../services/notificationService');

exports.saveDraftEvaluation = async (req, res, next) => {
  try {
    const { answerCopyId, evaluationMode, questionEvaluations, overallComments } = req.body;

    const copy = await AnswerCopy.findById(answerCopyId).populate('examination');
    if (!copy) {
      return res.status(404).json({ success: false, message: 'Answer copy not found' });
    }

    // Role check
    if (req.user.role === 'EVALUATOR' && copy.assignedEvaluator?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You are not authorized to evaluate this copy.' });
    }

    // Validate marks non-negative and <= maxMarks, and normalize question references
    let calculatedTotal = 0;
    let maxPossible = 0;
    const normalizedQuestionEvals = [];

    for (const qe of questionEvaluations || []) {
      const qNum = Number(qe.questionNumber);
      const matchedAns = copy.answers?.find(
        (a) => (a.question?._id || a.question)?.toString() === (qe.question?._id || qe.question || qe.questionId)?.toString() || a.questionNumber === qNum
      );
      const qId = qe.question || qe.questionId || (matchedAns && (matchedAns.question?._id || matchedAns.question)) || undefined;
      const maxM = Number(qe.maxMarks || (matchedAns && matchedAns.maxMarks) || 10);
      const awarded = Number(qe.marksAwarded ?? qe.finalMarks ?? 0);

      if (awarded < 0 || awarded > maxM) {
        return res.status(400).json({
          success: false,
          message: `Marks for Question ${qNum} (${awarded}) must be between 0 and ${maxM}.`
        });
      }
      calculatedTotal += awarded;
      maxPossible += maxM;

      normalizedQuestionEvals.push({
        ...qe,
        question: qId,
        questionNumber: qNum,
        maxMarks: maxM,
        marksAwarded: awarded
      });
    }

    let evaluation = await Evaluation.findOne({ answerCopy: copy._id });

    if (evaluation) {
      evaluation.questionEvaluations = normalizedQuestionEvals;
      evaluation.evaluationMode = copy.examination?.evaluationMode || evaluationMode || copy.evaluationMode || 'MANUAL';
      evaluation.totalMarks = calculatedTotal;
      evaluation.maxPossibleMarks = maxPossible;
      evaluation.percentage = maxPossible > 0 ? Math.round((calculatedTotal / maxPossible) * 100 * 10) / 10 : 0;
      evaluation.overallComments = overallComments || evaluation.overallComments;
      evaluation.isDraft = true;
      await evaluation.save();
    } else {
      evaluation = await Evaluation.create({
        answerCopy: copy._id,
        examination: copy.examination._id,
        evaluator: req.user._id,
        evaluationMode: copy.examination?.evaluationMode || evaluationMode || copy.evaluationMode || 'MANUAL',
        isDraft: true,
        questionEvaluations: normalizedQuestionEvals,
        totalMarks: calculatedTotal,
        maxPossibleMarks: maxPossible,
        percentage: maxPossible > 0 ? Math.round((calculatedTotal / maxPossible) * 100 * 10) / 10 : 0,
        overallComments: overallComments || ''
      });
    }

    // Update student answers if edited by evaluator
    if (Array.isArray(req.body.studentAnswers)) {
      for (const sa of req.body.studentAnswers) {
        const target = copy.answers?.find((a) => a.questionNumber === Number(sa.questionNumber));
        if (target && sa.studentAnswer !== undefined) {
          target.studentAnswer = sa.studentAnswer;
        }
      }
    }

    // Update copy status to IN_PROGRESS
    if (copy.evaluationStatus !== 'COMPLETED' && copy.evaluationStatus !== 'AI_APPROVED') {
      copy.evaluationStatus = 'IN_PROGRESS';
      copy.status = 'EVALUATION_IN_PROGRESS';
      await copy.save();
    } else {
      await copy.save();
    }

    res.status(200).json({
      success: true,
      message: 'Evaluation draft saved successfully',
      evaluation
    });
  } catch (error) {
    next(error);
  }
};

exports.submitFinalEvaluation = async (req, res, next) => {
  try {
    const { answerCopyId, evaluationMode, questionEvaluations, overallComments } = req.body;

    const copy = await AnswerCopy.findById(answerCopyId).populate('examination');
    if (!copy) {
      return res.status(404).json({ success: false, message: 'Answer copy not found' });
    }

    if (req.user.role === 'EVALUATOR' && copy.assignedEvaluator?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You are not authorized to evaluate this copy.' });
    }

    // Strict validation and normalization
    let calculatedTotal = 0;
    let maxPossible = 0;
    const normalizedQuestionEvals = [];

    for (const qe of questionEvaluations || []) {
      const qNum = Number(qe.questionNumber);
      const matchedAns = copy.answers?.find(
        (a) => (a.question?._id || a.question)?.toString() === (qe.question?._id || qe.question || qe.questionId)?.toString() || a.questionNumber === qNum
      );
      const qId = qe.question || qe.questionId || (matchedAns && (matchedAns.question?._id || matchedAns.question)) || undefined;
      const maxM = Number(qe.maxMarks || (matchedAns && matchedAns.maxMarks) || 10);
      const awarded = Number(qe.marksAwarded ?? qe.finalMarks ?? 0);

      if (isNaN(awarded) || awarded < 0 || awarded > maxM) {
        return res.status(400).json({
          success: false,
          message: `Validation failed: Marks for Question ${qNum} (${awarded}) must be between 0 and ${maxM}.`
        });
      }
      calculatedTotal += awarded;
      maxPossible += maxM;

      normalizedQuestionEvals.push({
        ...qe,
        question: qId,
        questionNumber: qNum,
        maxMarks: maxM,
        marksAwarded: awarded
      });
    }

    let evaluation = await Evaluation.findOne({ answerCopy: copy._id });

    if (evaluation) {
      evaluation.questionEvaluations = normalizedQuestionEvals;
      evaluation.evaluationMode = 'MANUAL';
      evaluation.totalMarks = calculatedTotal;
      evaluation.maxPossibleMarks = maxPossible;
      evaluation.percentage = maxPossible > 0 ? Math.round((calculatedTotal / maxPossible) * 100 * 10) / 10 : 0;
      evaluation.overallComments = overallComments || '';
      evaluation.isDraft = false;
      evaluation.submittedAt = new Date();
      await evaluation.save();
    } else {
      evaluation = await Evaluation.create({
        answerCopy: copy._id,
        examination: copy.examination._id,
        evaluator: req.user._id,
        evaluationMode: 'MANUAL',
        isDraft: false,
        questionEvaluations: normalizedQuestionEvals,
        totalMarks: calculatedTotal,
        maxPossibleMarks: maxPossible,
        percentage: maxPossible > 0 ? Math.round((calculatedTotal / maxPossible) * 100 * 10) / 10 : 0,
        overallComments: overallComments || '',
        submittedAt: new Date()
      });
    }

    // Update copy answers and status
    for (const qe of normalizedQuestionEvals) {
      const qId = qe.question?._id || qe.question;
      const targetAns = copy.answers.find(a => (a.question?._id || a.question)?.toString() === qId?.toString() || a.questionNumber === qe.questionNumber);
      if (targetAns) {
        targetAns.marksAwarded = Number(qe.marksAwarded);
        targetAns.finalMarks = Number(qe.marksAwarded);
        targetAns.evaluatorRemarks = qe.comments || targetAns.evaluatorRemarks;
      }
    }

    if (Array.isArray(req.body.studentAnswers)) {
      for (const sa of req.body.studentAnswers) {
        const target = copy.answers?.find((a) => a.questionNumber === Number(sa.questionNumber));
        if (target && sa.studentAnswer !== undefined) {
          target.studentAnswer = sa.studentAnswer;
        }
      }
    }

    copy.status = 'EVALUATED';
    copy.evaluationStatus = 'COMPLETED';
    copy.evaluationMode = 'MANUAL';
    copy.finalTotal = calculatedTotal;
    copy.totalAwardedMarks = calculatedTotal;
    copy.totalMaxMarks = maxPossible;
    copy.percentage = maxPossible > 0 ? Math.round((calculatedTotal / maxPossible) * 100 * 10) / 10 : 0;
    copy.evaluatedAt = new Date();
    await copy.save();

    // Calculate Result and update AnswerCopy status
    const result = await calculateAndSaveResult(copy._id, evaluation);

    await logAudit({
      req,
      action: 'EVALUATION_COMPLETED',
      entity: 'Evaluation',
      entityId: evaluation._id,
      details: {
        copyId: copy.copyId,
        evaluator: req.user.name,
        totalMarks: calculatedTotal,
        maxMarks: maxPossible,
        mode: evaluation.evaluationMode
      }
    });

    await createNotification({
      targetRole: 'ADMIN',
      title: 'Answer Copy Evaluated',
      message: `Evaluator ${req.user.name} completed evaluation for copy ${copy.copyId} (${calculatedTotal}/${maxPossible}).`,
      type: 'SUCCESS',
      link: '/admin/results'
    });

    res.status(200).json({
      success: true,
      message: 'Evaluation submitted successfully! Result computed.',
      evaluation,
      result
    });
  } catch (error) {
    next(error);
  }
};

// Evaluator: Approve AI-Assisted Evaluation (Section 9 & 10)
exports.approveAiEvaluation = async (req, res, next) => {
  try {
    const { answerCopyId, overallComments } = req.body;

    const copy = await AnswerCopy.findById(answerCopyId)
      .populate('examination')
      .populate({
        path: 'answers.question',
        populate: { path: 'rubric' }
      });

    if (!copy) {
      return res.status(404).json({ success: false, message: 'Answer copy not found' });
    }

    if (req.user.role === 'EVALUATOR' && copy.assignedEvaluator?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You are not authorized to evaluate this copy.' });
    }

    const questionEvaluations = [];
    let calculatedTotal = 0;
    let maxPossible = 0;

    for (const ansItem of copy.answers) {
      const q = ansItem.question;
      const qId = q?._id || q;
      const qNum = ansItem.questionNumber;
      const maxM = ansItem.maxMarks || q?.marks || 10;

      let aiDoc = await AIEvaluation.findOne({ answerCopy: copy._id, question: qId });
      let suggestedMarks = aiDoc ? aiDoc.aiSuggestedMarks : null;
      let feedback = aiDoc ? aiDoc.overallFeedback : '';
      let criteriaBreakdown = aiDoc ? aiDoc.criteriaEvaluation : [];

      if (suggestedMarks === null || suggestedMarks === undefined) {
        const aiRes = await aiEvaluationService.evaluateAnswer({
          questionText: q?.questionText || 'Question',
          studentAnswer: ansItem.studentAnswer || '',
          referenceAnswer: q?.expectedAnswer || '',
          maxMarks: maxM,
          rubricCriteria: q?.rubric ? q.rubric.criteria : []
        });

        suggestedMarks = aiRes.suggestedMarks;
        feedback = aiRes.overallFeedback;
        criteriaBreakdown = aiRes.criteriaEvaluation || [];

        aiDoc = await AIEvaluation.findOneAndUpdate(
          { answerCopy: copy._id, question: qId },
          {
            answerCopy: copy._id,
            question: qId,
            studentAnswer: ansItem.studentAnswer || '',
            referenceAnswer: q?.expectedAnswer || '',
            maxMarks: maxM,
            aiSuggestedMarks: suggestedMarks,
            overallFeedback: feedback,
            evaluatorAction: 'ACCEPTED',
            evaluatorFinalMarks: suggestedMarks
          },
          { upsert: true, new: true }
        );
      } else {
        if (aiDoc) {
          aiDoc.evaluatorAction = 'ACCEPTED';
          aiDoc.evaluatorFinalMarks = suggestedMarks;
          await aiDoc.save();
        }
      }

      ansItem.aiSuggestedMarks = suggestedMarks;
      ansItem.aiAnalysis = feedback;
      ansItem.isAiApproved = true;
      ansItem.marksAwarded = suggestedMarks;

      calculatedTotal += suggestedMarks;
      maxPossible += maxM;

      const mappedCriteria = (criteriaBreakdown || []).map((crit) => ({
        criterion: crit.criterion || crit.name || 'Criterion',
        maxMarks: Number(crit.maxMarks) || 1,
        marksAwarded: Number(crit.marksAwarded ?? crit.marks ?? 0),
        feedback: crit.feedback || ''
      }));

      questionEvaluations.push({
        question: qId,
        questionNumber: qNum,
        maxMarks: maxM,
        marksAwarded: suggestedMarks,
        comments: feedback,
        aiSuggestedMarks: suggestedMarks,
        aiFeedback: feedback,
        wasAiAccepted: true,
        criteriaBreakdown: mappedCriteria
      });
    }

    // Save final Evaluation document
    let evaluation = await Evaluation.findOne({ answerCopy: copy._id });
    if (evaluation) {
      evaluation.questionEvaluations = questionEvaluations;
      evaluation.evaluationMode = 'AI_ASSISTED';
      evaluation.totalMarks = calculatedTotal;
      evaluation.maxPossibleMarks = maxPossible;
      evaluation.percentage = maxPossible > 0 ? Math.round((calculatedTotal / maxPossible) * 100 * 10) / 10 : 0;
      evaluation.overallComments = overallComments || 'AI-assisted evaluation reviewed and approved by examiner.';
      evaluation.isDraft = false;
      evaluation.submittedAt = new Date();
      await evaluation.save();
    } else {
      evaluation = await Evaluation.create({
        answerCopy: copy._id,
        examination: copy.examination._id,
        evaluator: req.user._id,
        evaluationMode: 'AI_ASSISTED',
        isDraft: false,
        questionEvaluations,
        totalMarks: calculatedTotal,
        maxPossibleMarks: maxPossible,
        percentage: maxPossible > 0 ? Math.round((calculatedTotal / maxPossible) * 100 * 10) / 10 : 0,
        overallComments: overallComments || 'AI-assisted evaluation reviewed and approved by examiner.',
        submittedAt: new Date()
      });
    }

    // Update copy status
    copy.totalAwardedMarks = calculatedTotal;
    copy.totalMaxMarks = maxPossible;
    copy.percentage = maxPossible > 0 ? Math.round((calculatedTotal / maxPossible) * 100 * 10) / 10 : 0;
    copy.evaluationStatus = 'COMPLETED';
    copy.status = 'EVALUATED';
    copy.evaluatedAt = new Date();
    copy.aiEvaluationSummary = {
      suggestedTotalMarks: calculatedTotal,
      overallFeedback: overallComments || 'AI-assisted evaluation approved.',
      isApproved: true,
      approvedAt: new Date()
    };
    await copy.save();

    const result = await calculateAndSaveResult(copy._id, evaluation);

    await logAudit({
      req,
      action: 'AI_EVALUATION_APPROVED',
      entity: 'Evaluation',
      entityId: evaluation._id,
      details: {
        copyId: copy.copyId,
        evaluator: req.user.name,
        totalMarks: calculatedTotal,
        maxMarks: maxPossible
      }
    });

    await createNotification({
      targetRole: 'ADMIN',
      title: 'AI Evaluation Approved',
      message: `Evaluator ${req.user.name} reviewed and approved AI evaluation for copy ${copy.copyId} (${calculatedTotal}/${maxPossible}).`,
      type: 'SUCCESS',
      link: '/admin/results'
    });

    res.status(200).json({
      success: true,
      message: 'AI evaluation reviewed and approved successfully! Marks finalized.',
      evaluation,
      result
    });
  } catch (error) {
    next(error);
  }
};

exports.getEvaluationHistory = async (req, res, next) => {
  try {
    const query = {};
    if (req.user.role === 'EVALUATOR') {
      query.evaluator = req.user._id;
    }

    const evaluations = await Evaluation.find(query)
      .populate('answerCopy', 'copyId subject student candidateRollNo bookletNumber')
      .populate('examination', 'name code subject')
      .populate('evaluator', 'name email')
      .sort({ updatedAt: -1 });

    res.status(200).json({ success: true, count: evaluations.length, evaluations });
  } catch (error) {
    next(error);
  }
};
