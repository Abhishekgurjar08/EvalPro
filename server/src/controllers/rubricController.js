const QuestionRubric = require('../models/QuestionRubric');
const Question = require('../models/Question');
const { logAudit } = require('../services/auditService');

exports.getRubricByQuestion = async (req, res, next) => {
  try {
    const { questionId } = req.params;
    const rubric = await QuestionRubric.findOne({ question: questionId }).populate('question');
    if (!rubric) {
      return res.status(200).json({ success: true, rubric: null, message: 'No rubric defined yet for this question' });
    }
    res.status(200).json({ success: true, rubric });
  } catch (error) {
    next(error);
  }
};

exports.createOrUpdateRubric = async (req, res, next) => {
  try {
    const { questionId, criteria } = req.body;

    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    if (!Array.isArray(criteria) || criteria.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one rubric criterion is required.' });
    }

    const totalCriteriaMarks = criteria.reduce((sum, item) => sum + (Number(item.maxMarks) || 0), 0);
    if (totalCriteriaMarks > question.marks) {
      return res.status(400).json({
        success: false,
        message: `Sum of criteria marks (${totalCriteriaMarks}) cannot exceed question max marks (${question.marks}).`
      });
    }

    let rubric = await QuestionRubric.findOne({ question: questionId });

    if (rubric) {
      rubric.maxMarks = question.marks;
      rubric.criteria = criteria;
      await rubric.save();
    } else {
      rubric = await QuestionRubric.create({
        question: questionId,
        maxMarks: question.marks,
        criteria,
        createdBy: req.user._id
      });
      question.rubric = rubric._id;
      await question.save();
    }

    await logAudit({
      req,
      action: 'RUBRIC_SAVED',
      entity: 'QuestionRubric',
      entityId: rubric._id,
      details: { questionId, criteriaCount: criteria.length, totalCriteriaMarks }
    });

    res.status(200).json({
      success: true,
      message: 'Marking rubric saved successfully',
      rubric
    });
  } catch (error) {
    next(error);
  }
};
