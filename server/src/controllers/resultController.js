const Result = require('../models/Result');
const Examination = require('../models/Examination');
const Evaluation = require('../models/Evaluation');
const AnswerCopy = require('../models/AnswerCopy');
const { logAudit } = require('../services/auditService');
const { createNotification } = require('../services/notificationService');

exports.getResults = async (req, res, next) => {
  try {
    const { examinationId, published } = req.query;
    const query = {};

    if (examinationId) query.examination = examinationId;
    if (published !== undefined) query.published = published === 'true';

    const results = await Result.find(query)
      .populate('student', 'name email department studentRollNo')
      .populate('examination', 'name code subject maxMarks passingMarks session')
      .populate('answerCopy', 'copyId evaluatedAt candidateName candidateRollNo evaluationStatus evaluationMode totalAwardedMarks finalTotal totalMaxMarks')
      .sort({ createdAt: -1 });

    // Also fetch all evaluated answer copies (both Manual and AI evaluated) for this examination
    let evaluatedCopies = [];
    if (examinationId) {
      evaluatedCopies = await AnswerCopy.find({
        examination: examinationId,
        $or: [
          { status: { $in: ['EVALUATED', 'FINALIZED', 'COMPLETED', 'ADMIN_REVIEWED'] } },
          { evaluationStatus: { $in: ['EVALUATED', 'FINALIZED', 'COMPLETED', 'ADMIN_REVIEWED'] } }
        ]
      })
      .populate('student', 'name email department studentRollNo')
      .populate('examination', 'name code subject maxMarks passingMarks')
      .populate('assignedEvaluator', 'name email')
      .sort({ copyId: 1 });
    }

    res.status(200).json({
      success: true,
      count: results.length,
      results,
      evaluatedCopiesCount: evaluatedCopies.length,
      evaluatedCopies
    });
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

    // 1. Fetch all evaluated answer copies for this exam (both Manual & AI)
    const evaluatedCopies = await AnswerCopy.find({
      examination: exam._id,
      $or: [
        { status: { $in: ['EVALUATED', 'FINALIZED', 'COMPLETED', 'ADMIN_REVIEWED'] } },
        { evaluationStatus: { $in: ['EVALUATED', 'FINALIZED', 'COMPLETED', 'ADMIN_REVIEWED'] } }
      ]
    }).populate('student', 'name email studentRollNo');

    // 2. Ensure each evaluated copy has an updated published Result record
    for (const copy of evaluatedCopies) {
      const totalMarks = copy.finalTotal ?? copy.totalAwardedMarks ?? 0;
      const maxMarks = copy.totalMaxMarks || exam.maxMarks || 100;
      const percentage = maxMarks > 0 ? Math.round((totalMarks / maxMarks) * 100 * 10) / 10 : 0;
      const passingMarks = exam.passingMarks || Math.round(maxMarks * 0.4);
      const passed = totalMarks >= passingMarks;

      let grade = 'F';
      if (percentage >= 90) grade = 'A+';
      else if (percentage >= 80) grade = 'A';
      else if (percentage >= 70) grade = 'B+';
      else if (percentage >= 60) grade = 'B';
      else if (percentage >= 50) grade = 'C';
      else if (percentage >= 40) grade = 'D';

      const resQuery = copy.student 
        ? { examination: exam._id, student: copy.student }
        : { examination: exam._id, answerCopy: copy._id };

      await Result.findOneAndUpdate(
        resQuery,
        {
          examination: exam._id,
          student: copy.student || null,
          answerCopy: copy._id,
          copyId: copy.copyId || '',
          candidateName: copy.candidateName || copy.student?.name || '',
          candidateRollNo: copy.candidateRollNo || copy.student?.studentRollNo || '',
          totalMarks,
          maxMarks,
          percentage,
          grade,
          passed,
          published: true,
          publishedAt: new Date(),
          publishedBy: req.user._id
        },
        { upsert: true, new: true }
      );
    }

    // 3. Update all existing results for this examination to published
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
      details: { examination: exam.name, count: evaluatedCopies.length }
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
      message: `Results published for ${evaluatedCopies.length} candidates.`,
      publishedCount: evaluatedCopies.length
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
