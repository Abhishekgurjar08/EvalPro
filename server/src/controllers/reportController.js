const Examination = require('../models/Examination');
const AnswerCopy = require('../models/AnswerCopy');
const Evaluation = require('../models/Evaluation');
const EvaluatorProfile = require('../models/EvaluatorProfile');
const AIEvaluation = require('../models/AIEvaluation');
const Question = require('../models/Question');
const Result = require('../models/Result');
const User = require('../models/User');

exports.getAdminDashboardStats = async (req, res, next) => {
  try {
    const totalExaminations = await Examination.countDocuments();
    const activeExaminations = await Examination.countDocuments({
      status: { $in: ['LIVE', 'SCHEDULED', 'EVALUATION'] }
    });
    const completedExaminations = await Examination.countDocuments({
      status: { $in: ['COMPLETED', 'RESULT_PUBLISHED'] }
    });

    const totalSetters = await User.countDocuments({ role: 'EXAM_SETTER', status: 'ACTIVE' });
    const totalEvaluators = await User.countDocuments({ role: 'EVALUATOR', status: 'ACTIVE' });
    const totalQuestions = await Question.countDocuments({ status: 'ACTIVE' });

    const totalAnswerCopies = await AnswerCopy.countDocuments();
    const pendingEvaluations = await AnswerCopy.countDocuments({
      evaluationStatus: { $in: ['PENDING', 'ASSIGNED', 'IN_PROGRESS'] }
    });
    const completedEvaluations = await AnswerCopy.countDocuments({
      evaluationStatus: 'COMPLETED'
    });

    const pendingPaperApprovals = await Examination.countDocuments({
      status: 'PAPER_SUBMITTED'
    });

    const recentExaminations = await Examination.find()
      .populate('assignedSetter', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      stats: {
        totalExaminations,
        activeExaminations,
        completedExaminations,
        totalSetters,
        totalEvaluators,
        totalQuestions,
        totalAnswerCopies,
        pendingEvaluations,
        completedEvaluations,
        pendingPaperApprovals
      },
      recentExaminations
    });
  } catch (error) {
    next(error);
  }
};

exports.getComprehensiveReports = async (req, res, next) => {
  try {
    // 1. Examination Summary
    const exams = await Examination.find().sort({ createdAt: -1 });
    const examReports = [];

    for (const ex of exams) {
      const totalCopies = await AnswerCopy.countDocuments({ examination: ex._id });
      const completedCopies = await AnswerCopy.countDocuments({ examination: ex._id, evaluationStatus: 'COMPLETED' });
      const pendingCopies = totalCopies - completedCopies;
      const resultsCount = await Result.countDocuments({ examination: ex._id });
      const passedCount = await Result.countDocuments({ examination: ex._id, passed: true });

      examReports.push({
        id: ex._id,
        name: ex.name,
        code: ex.code,
        subject: ex.subject,
        status: ex.status,
        maxMarks: ex.maxMarks,
        totalCopies,
        completedCopies,
        pendingCopies,
        resultsCount,
        passPercentage: resultsCount > 0 ? Math.round((passedCount / resultsCount) * 100) : 0
      });
    }

    // 2. Evaluator Workloads
    const evaluators = await EvaluatorProfile.find().populate('user', 'name email');
    const evaluatorReports = [];

    for (const ev of evaluators) {
      const assigned = await AnswerCopy.countDocuments({ assignedEvaluator: ev.user._id });
      const completed = await AnswerCopy.countDocuments({
        assignedEvaluator: ev.user._id,
        evaluationStatus: 'COMPLETED'
      });
      const pending = assigned - completed;

      evaluatorReports.push({
        id: ev._id,
        name: ev.name,
        email: ev.email,
        department: ev.department,
        subjects: ev.subjects,
        maxWorkload: ev.maxWorkload || 50,
        assigned,
        completed,
        pending,
        completionRate: assigned > 0 ? Math.round((completed / assigned) * 100) : 100
      });
    }

    // 3. AI Evaluation Comparison Metrics
    const aiRecords = await AIEvaluation.find().populate('question', 'questionText marks');
    let totalAICalls = aiRecords.length;
    let acceptedCount = 0;
    let modifiedCount = 0;
    let rejectedCount = 0;
    let totalDiff = 0;
    let evaluatedComparisons = 0;

    const detailedComparisons = aiRecords.map((rec) => {
      const hasFinal = rec.evaluatorFinalMarks !== null && rec.evaluatorFinalMarks !== undefined;
      let diff = 0;
      if (hasFinal) {
        evaluatedComparisons++;
        diff = Math.round(Math.abs(rec.evaluatorFinalMarks - rec.aiSuggestedMarks) * 10) / 10;
        totalDiff += diff;
        if (rec.evaluatorAction === 'ACCEPTED') acceptedCount++;
        else if (rec.evaluatorAction === 'MODIFIED') modifiedCount++;
        else if (rec.evaluatorAction === 'REJECTED') rejectedCount++;
      }

      return {
        id: rec._id,
        questionText: rec.question ? rec.question.questionText : 'Question',
        maxMarks: rec.maxMarks,
        aiSuggestedMarks: rec.aiSuggestedMarks,
        evaluatorFinalMarks: rec.evaluatorFinalMarks,
        difference: diff,
        evaluatorAction: rec.evaluatorAction,
        modelUsed: rec.modelUsed,
        createdAt: rec.createdAt
      };
    });

    const aiMetrics = {
      totalAICalls,
      evaluatedComparisons,
      acceptedCount,
      modifiedCount,
      rejectedCount,
      acceptanceRate: evaluatedComparisons > 0 ? Math.round((acceptedCount / evaluatedComparisons) * 100) : 0,
      averageMarkDifference: evaluatedComparisons > 0 ? Math.round((totalDiff / evaluatedComparisons) * 10) / 10 : 0,
      comparisons: detailedComparisons.slice(0, 15) // Recent 15 comparisons
    };

    res.status(200).json({
      success: true,
      examReports,
      evaluatorReports,
      aiMetrics
    });
  } catch (error) {
    next(error);
  }
};
