const MarksBlueprint = require('../models/MarksBlueprint');
const Examination = require('../models/Examination');
const { logAudit } = require('../services/auditService');

exports.getBlueprintByExam = async (req, res, next) => {
  try {
    const { examId } = req.params;
    const blueprint = await MarksBlueprint.findOne({ examination: examId }).populate('createdBy', 'name email');
    res.status(200).json({ success: true, blueprint });
  } catch (error) {
    next(error);
  }
};

exports.createOrUpdateBlueprint = async (req, res, next) => {
  try {
    const examinationId = req.body.examinationId || req.body.examination || req.body.examId;
    const {
      totalQuestions: inputTotalQuestions,
      totalMarks: inputTotalMarks,
      questionPattern,
      numberOfSets,
      unitDistribution,
      questionsConfig,
      difficultyDistribution,
      questionTypeDistribution
    } = req.body;

    const exam = await Examination.findById(examinationId);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Examination not found' });
    }

    const units = Array.isArray(unitDistribution) ? unitDistribution : [];

    // Calculate sums from units
    const sumUnitQuestions = units.reduce((sum, item) => sum + (Number(item.questionsCount) || 0), 0);
    const sumUnitMarks = units.reduce((sum, item) => sum + (Number(item.marks) || 0), 0);

    const totalQuestions = Number(inputTotalQuestions) || sumUnitQuestions;
    const totalMarks = Number(inputTotalMarks) || sumUnitMarks || exam.maxMarks;

    // VALIDATION 1: Sum of unit question counts must equal total questions
    if (units.length > 0 && sumUnitQuestions !== totalQuestions) {
      return res.status(400).json({
        success: false,
        message: `Sum of unit question counts (${sumUnitQuestions}) must equal total questions (${totalQuestions}).`
      });
    }

    // VALIDATION 2: Sum of unit marks must equal total marks
    if (units.length > 0 && sumUnitMarks !== totalMarks) {
      return res.status(400).json({
        success: false,
        message: `Sum of unit marks (${sumUnitMarks}) must equal total marks (${totalMarks}).`
      });
    }

    // VALIDATION 3: Check exam maxMarks match
    if (exam.maxMarks && totalMarks !== exam.maxMarks) {
      return res.status(400).json({
        success: false,
        message: `Total marks (${totalMarks}) must match examination maximum marks (${exam.maxMarks}).`
      });
    }

    // VALIDATION 4: Validate question config if provided
    if (Array.isArray(questionsConfig) && questionsConfig.length > 0) {
      const qNums = new Set();
      for (const q of questionsConfig) {
        if (!q.questionNumber) {
          return res.status(400).json({ success: false, message: 'Every question must have a valid question number.' });
        }
        if (qNums.has(q.questionNumber)) {
          return res.status(400).json({ success: false, message: `Duplicate question number found: Q${q.questionNumber}.` });
        }
        qNums.add(q.questionNumber);

        if (!q.marks || Number(q.marks) <= 0) {
          return res.status(400).json({ success: false, message: `Question Q${q.questionNumber} must have positive marks.` });
        }

        // Check sub-questions if present
        if (Array.isArray(q.subQuestions) && q.subQuestions.length > 0) {
          const subMarksSum = q.subQuestions.reduce((s, sq) => s + (Number(sq.marks) || 0), 0);
          if (subMarksSum !== Number(q.marks)) {
            return res.status(400).json({
              success: false,
              message: `Sub-questions marks sum (${subMarksSum}) for Q${q.questionNumber} must equal question marks (${q.marks}).`
            });
          }
        }
      }

      if (questionsConfig.length !== totalQuestions) {
        return res.status(400).json({
          success: false,
          message: `Number of configured questions (${questionsConfig.length}) must equal total questions (${totalQuestions}).`
        });
      }

      const sumAllQuestionMarks = questionsConfig.reduce((s, q) => s + (Number(q.marks) || 0), 0);
      if (sumAllQuestionMarks !== totalMarks) {
        return res.status(400).json({
          success: false,
          message: `Sum of question marks (${sumAllQuestionMarks}) must equal total marks (${totalMarks}).`
        });
      }
    }

    let blueprint = await MarksBlueprint.findOne({ examination: examinationId });

    if (blueprint) {
      blueprint.totalMarks = totalMarks;
      blueprint.totalQuestions = totalQuestions;
      if (questionPattern) blueprint.questionPattern = questionPattern;
      if (numberOfSets) blueprint.numberOfSets = Number(numberOfSets) || 1;
      blueprint.unitDistribution = units;
      if (questionsConfig) blueprint.questionsConfig = questionsConfig;
      if (difficultyDistribution) blueprint.difficultyDistribution = difficultyDistribution;
      if (questionTypeDistribution) blueprint.questionTypeDistribution = questionTypeDistribution;
      await blueprint.save();
    } else {
      blueprint = await MarksBlueprint.create({
        examination: examinationId,
        totalMarks,
        totalQuestions,
        questionPattern: questionPattern || 'SIMPLE',
        numberOfSets: Number(numberOfSets) || 1,
        unitDistribution: units,
        questionsConfig: questionsConfig || [],
        difficultyDistribution: difficultyDistribution || { easy: 30, medium: 50, hard: 20 },
        questionTypeDistribution: questionTypeDistribution || { mcq: 0, shortAnswer: 20, longAnswer: 40, descriptive: 40 },
        createdBy: req.user._id
      });
    }

    await logAudit({
      req,
      action: 'BLUEPRINT_SAVED',
      entity: 'MarksBlueprint',
      entityId: blueprint._id,
      details: { examinationId, totalMarks, totalQuestions, questionPattern: blueprint.questionPattern }
    });

    res.status(200).json({
      success: true,
      message: 'Paper scheme saved successfully',
      blueprint
    });
  } catch (error) {
    next(error);
  }
};
