const Result = require('../models/Result');
const Examination = require('../models/Examination');
const Evaluation = require('../models/Evaluation');
const { logAudit } = require('../services/auditService');
const { createNotification } = require('../services/notificationService');

exports.getResults = async (req, res, next) => {
  try {
    const { examinationId, published } = req.query;
    const query = {};

    if (examinationId) query.examination = examinationId;
    if (published !== undefined) query.published = published === 'true';

    const results = await Result.find(query)
      .populate('student', 'name email department')
      .populate('examination', 'name code subject maxMarks passingMarks session')
      .populate('answerCopy', 'copyId evaluatedAt')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: results.length, results });
  } catch (error) {
    next(error);
  }
};

exports.publishResults = async (req, res, next) => {
  try {
    const { examinationId } = req.params;

    const exam = await Examination.findById(examinationId);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Examination not found' });
    }

    // Update all results for this examination to published
    const updated = await Result.updateMany(
      { examination: exam._id },
      {
        published: true,
        publishedAt: new Date(),
        publishedBy: req.user._id
      }
    );

    exam.status = 'RESULT_PUBLISHED';
    await exam.save();

    await logAudit({
      req,
      action: 'RESULTS_PUBLISHED',
      entity: 'Examination',
      entityId: exam._id,
      details: { examination: exam.name, count: updated.modifiedCount }
    });

    await createNotification({
      targetRole: 'ALL',
      title: 'Examination Results Published',
      message: `Results for ${exam.name} (${exam.subject}) have been officially published.`,
      type: 'SUCCESS',
      link: '/admin/results'
    });

    res.status(200).json({
      success: true,
      message: `Results published for ${updated.modifiedCount} candidates.`,
      publishedCount: updated.modifiedCount
    });
  } catch (error) {
    next(error);
  }
};

exports.getStudentResultDetails = async (req, res, next) => {
  try {
    const result = await Result.findById(req.params.id)
      .populate('examination')
      .populate('student', 'name email department')
      .populate('answerCopy');

    if (!result) {
      return res.status(404).json({ success: false, message: 'Result not found' });
    }

    const evaluation = await Evaluation.findOne({ answerCopy: result.answerCopy._id }).populate({
      path: 'questionEvaluations.question',
      select: 'questionText marks topic unit'
    });

    res.status(200).json({
      success: true,
      result,
      evaluation
    });
  } catch (error) {
    next(error);
  }
};
