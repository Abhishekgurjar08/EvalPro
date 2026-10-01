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
    const { examinationId, unitDistribution, difficultyDistribution, questionTypeDistribution } = req.body;

    const exam = await Examination.findById(examinationId);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Examination not found' });
    }

    const unitTotal = (unitDistribution || []).reduce((sum, item) => sum + (Number(item.marks) || 0), 0);

    if (unitTotal !== exam.maxMarks) {
      return res.status(400).json({
        success: false,
        message: `Sum of unit marks (${unitTotal}) must exactly equal examination maximum marks (${exam.maxMarks}).`
      });
    }

    let blueprint = await MarksBlueprint.findOne({ examination: examinationId });

    if (blueprint) {
      blueprint.totalMarks = exam.maxMarks;
      blueprint.unitDistribution = unitDistribution;
      if (difficultyDistribution) blueprint.difficultyDistribution = difficultyDistribution;
      if (questionTypeDistribution) blueprint.questionTypeDistribution = questionTypeDistribution;
      await blueprint.save();
    } else {
      blueprint = await MarksBlueprint.create({
        examination: examinationId,
        totalMarks: exam.maxMarks,
        unitDistribution,
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
      details: { examinationId, totalMarks: exam.maxMarks }
    });

    res.status(200).json({
      success: true,
      message: 'Marks blueprint saved successfully',
      blueprint
    });
  } catch (error) {
    next(error);
  }
};
