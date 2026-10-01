const Examination = require('../models/Examination');
const QuestionPaper = require('../models/QuestionPaper');
const ExamAttempt = require('../models/ExamAttempt');
const AnswerCopy = require('../models/AnswerCopy');
const { logAudit } = require('../services/auditService');
const { createNotification } = require('../services/notificationService');

exports.getAvailableExams = async (req, res, next) => {
  try {
    // Show exams that are scheduled, live, or paper approved (ready for test)
    const exams = await Examination.find({
      status: { $in: ['PAPER_APPROVED', 'SCHEDULED', 'LIVE', 'COMPLETED', 'EVALUATION', 'RESULT_PUBLISHED'] }
    })
      .populate('approvedQuestionPaper', 'paperTitle totalMarks')
      .sort({ examDate: -1 });

    // Attach student attempt status for each exam
    const examList = [];
    for (const exam of exams) {
      const attempt = await ExamAttempt.findOne({
        examination: exam._id,
        student: req.user._id
      });

      const copy = await AnswerCopy.findOne({
        examination: exam._id,
        student: req.user._id
      });

      examList.push({
        ...exam.toObject(),
        myAttempt: attempt
          ? {
              id: attempt._id,
              status: attempt.status,
              startedAt: attempt.startedAt,
              submittedAt: attempt.submittedAt
            }
          : null,
        myCopyStatus: copy ? copy.evaluationStatus : null
      });
    }

    res.status(200).json({ success: true, count: examList.length, examinations: examList });
  } catch (error) {
    next(error);
  }
};

exports.startExam = async (req, res, next) => {
  try {
    const exam = await Examination.findById(req.params.id).populate('approvedQuestionPaper');

    if (!exam) {
      return res.status(404).json({ success: false, message: 'Examination not found' });
    }

    if (!exam.approvedQuestionPaper) {
      return res.status(400).json({
        success: false,
        message: 'This examination does not have an approved question paper yet.'
      });
    }

    // Check if student already submitted this exam
    let attempt = await ExamAttempt.findOne({
      examination: exam._id,
      student: req.user._id
    });

    if (attempt && attempt.status === 'SUBMITTED') {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted this examination. Re-attempts are not permitted.'
      });
    }

    if (!attempt) {
      const durationSeconds = (exam.durationMinutes || 180) * 60;
      attempt = await ExamAttempt.create({
        student: req.user._id,
        examination: exam._id,
        questionPaper: exam.approvedQuestionPaper._id,
        startedAt: new Date(),
        timeRemainingSeconds: durationSeconds,
        status: 'IN_PROGRESS',
        ipAddress: req.ip || '127.0.0.1'
      });

      await logAudit({
        req,
        action: 'EXAM_ATTEMPT_STARTED',
        entity: 'ExamAttempt',
        entityId: attempt._id,
        details: { examination: exam.name, student: req.user.name }
      });
    }

    // Load full question paper and strip answers/rubrics for security
    const fullPaper = await QuestionPaper.findById(exam.approvedQuestionPaper._id).populate({
      path: 'questions.question',
      select: 'questionText questionType options marks difficulty unit topic' // Exclude expectedAnswer & rubric!
    });

    res.status(200).json({
      success: true,
      message: 'Examination session initialized',
      attempt: {
        id: attempt._id,
        startedAt: attempt.startedAt,
        status: attempt.status,
        answersDraft: attempt.answersDraft || []
      },
      examination: {
        id: exam._id,
        name: exam.name,
        code: exam.code,
        subject: exam.subject,
        durationMinutes: exam.durationMinutes,
        maxMarks: exam.maxMarks,
        instructions: exam.instructions
      },
      questionPaper: {
        id: fullPaper._id,
        paperTitle: fullPaper.paperTitle,
        totalMarks: fullPaper.totalMarks,
        instructions: fullPaper.instructions,
        questions: fullPaper.questions
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.saveDraftAnswers = async (req, res, next) => {
  try {
    const { attemptId, answers } = req.body;
    const attempt = await ExamAttempt.findOne({ _id: attemptId, student: req.user._id });

    if (!attempt) {
      return res.status(404).json({ success: false, message: 'Active attempt not found' });
    }

    if (attempt.status === 'SUBMITTED') {
      return res.status(400).json({ success: false, message: 'Cannot update answers for already submitted exam.' });
    }

    attempt.answersDraft = answers;
    await attempt.save();

    res.status(200).json({ success: true, message: 'Draft answers saved' });
  } catch (error) {
    next(error);
  }
};

exports.submitExam = async (req, res, next) => {
  try {
    const { attemptId, answers } = req.body;
    const attempt = await ExamAttempt.findOne({ _id: attemptId, student: req.user._id }).populate('examination');

    if (!attempt) {
      return res.status(404).json({ success: false, message: 'Attempt not found' });
    }

    if (attempt.status === 'SUBMITTED') {
      return res.status(400).json({ success: false, message: 'Exam has already been submitted.' });
    }

    attempt.status = 'SUBMITTED';
    attempt.submittedAt = new Date();
    if (answers && Array.isArray(answers)) {
      attempt.answersDraft = answers;
    }
    await attempt.save();

    const exam = await Examination.findById(attempt.examination._id);
    const paper = await QuestionPaper.findById(attempt.questionPaper).populate('questions.question');

    // Build structured answers for AnswerCopy
    const answerList = [];
    let totalMaxMarks = 0;

    for (const qItem of paper.questions) {
      const qId = qItem.question._id.toString();
      const submittedAnswer = (answers || []).find((a) => a.questionId === qId || a.questionNumber === qItem.questionNumber);
      const marksVal = Number(qItem.marks) || Number(qItem.question.marks) || 10;
      totalMaxMarks += marksVal;

      answerList.push({
        question: qItem.question._id,
        questionNumber: qItem.questionNumber,
        maxMarks: marksVal,
        studentAnswer: submittedAnswer ? submittedAnswer.answerText : '',
        submittedAt: new Date()
      });
    }

    // Generate unique copyId e.g. COPY-CS601-A1B2
    const shortHash = Math.random().toString(36).substring(2, 6).toUpperCase();
    const copyId = `COPY-${exam.code}-${shortHash}`;

    // Create AnswerCopy
    const answerCopy = await AnswerCopy.create({
      copyId,
      student: req.user._id,
      examination: exam._id,
      subject: exam.subject,
      attempt: attempt._id,
      answers: answerList,
      evaluationMode: exam.evaluationMode || 'MANUAL',
      evaluationStatus: 'PENDING',
      totalMaxMarks
    });

    // Advance exam status to EVALUATION if it's currently LIVE / SCHEDULED / PAPER_APPROVED
    if (['PAPER_APPROVED', 'SCHEDULED', 'LIVE'].includes(exam.status)) {
      exam.status = 'EVALUATION';
      await exam.save();
    }

    await createNotification({
      targetRole: 'ADMIN',
      title: 'New Exam Submission Received',
      message: `Student ${req.user.name} submitted answer copy ${copyId} for ${exam.name}.`,
      type: 'INFO',
      link: '/admin/answer-copies'
    });

    await logAudit({
      req,
      action: 'EXAM_SUBMITTED',
      entity: 'AnswerCopy',
      entityId: answerCopy._id,
      details: { copyId, student: req.user.name, examName: exam.name }
    });

    res.status(200).json({
      success: true,
      message: 'Examination submitted successfully! Your digital answer copy has been generated.',
      answerCopy: {
        id: answerCopy._id,
        copyId: answerCopy.copyId,
        evaluationStatus: answerCopy.evaluationStatus
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getMyAttempts = async (req, res, next) => {
  try {
    const attempts = await ExamAttempt.find({ student: req.user._id })
      .populate('examination', 'name code subject maxMarks status')
      .sort({ createdAt: -1 });

    const results = [];
    for (const att of attempts) {
      const copy = await AnswerCopy.findOne({ attempt: att._id });
      results.push({
        ...att.toObject(),
        copy: copy
          ? {
              id: copy._id,
              copyId: copy.copyId,
              evaluationStatus: copy.evaluationStatus,
              totalAwardedMarks: copy.totalAwardedMarks,
              percentage: copy.percentage
            }
          : null
      });
    }

    res.status(200).json({ success: true, count: results.length, attempts: results });
  } catch (error) {
    next(error);
  }
};
