const fs = require('fs');
const path = require('path');
const AnswerCopy = require('../models/AnswerCopy');
const Evaluation = require('../models/Evaluation');
const Question = require('../models/Question');
const QuestionRubric = require('../models/QuestionRubric');
const Examination = require('../models/Examination');
const QuestionPaper = require('../models/QuestionPaper');
const User = require('../models/User');
const Annotation = require('../models/Annotation');
const { logAudit } = require('../services/auditService');
const { createNotification } = require('../services/notificationService');
const aiEvaluationService = require('../services/aiEvaluationService');
const { calculateAndSaveResult } = require('../services/resultService');

exports.getAnswerCopies = async (req, res, next) => {
  try {
    const examFilterId = req.query.examinationId || req.query.examination;
    const { status, assigned, search, page = 1, limit = 200, excludeFinalized } = req.query;
    const query = {};

    if (examFilterId) query.examination = examFilterId;
    if (status) {
      query.status = status;
    } else if (excludeFinalized === 'true') {
      query.evaluationStatus = { $nin: ['FINALIZED', 'ADMIN_REVIEWED', 'COMPLETED', 'REVIEWED'] };
      query.status = { $nin: ['FINALIZED', 'COMPLETED', 'REVIEWED'] };
    }

    if (assigned === 'true') {
      query.assignedEvaluator = { $ne: null };
    } else if (assigned === 'false') {
      query.assignedEvaluator = null;
    }

    if (search) {
      query.$or = [
        { copyId: { $regex: search, $options: 'i' } },
        { candidateRollNo: { $regex: search, $options: 'i' } },
        { candidateName: { $regex: search, $options: 'i' } },
        { bookletNumber: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } }
      ];
    }

    // Role security: Evaluator only sees their own assigned copies
    if (req.user.role === 'EVALUATOR') {
      query.assignedEvaluator = req.user._id;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await AnswerCopy.countDocuments(query);
    const copies = await AnswerCopy.find(query)
      .populate('student', 'name email')
      .populate('examination', 'name code subject maxMarks scanningStatus evaluationMode evaluationModeLocked evaluationModeLockedAt status')
      .populate('assignedEvaluator', 'name email employeeId')
      .sort({ copyId: 1 })
      .skip(skip)
      .limit(Number(limit));

    // Also get exam metadata if examFilterId is passed
    let examination = null;
    if (examFilterId) {
      examination = await Examination.findById(examFilterId)
        .select('name code subject maxMarks scanningStatus evaluationMode evaluationModeLocked evaluationModeLockedAt status examDate totalExpectedCopies');
    }

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      examination,
      answerCopies: copies
    });
  } catch (error) {
    next(error);
  }
};

exports.getAnswerCopyById = async (req, res, next) => {
  try {
    const copy = await AnswerCopy.findById(req.params.id)
      .populate('student', 'name email department')
      .populate('examination')
      .populate('assignedEvaluator', 'name email employeeId')
      .populate({
        path: 'answers.question',
        populate: { path: 'rubric' }
      });

    if (!copy) {
      return res.status(404).json({ success: false, message: 'Answer copy not found' });
    }

    // Security check: Evaluator must be assigned to this copy (unless ADMIN)
    if (req.user.role === 'EVALUATOR') {
      if (!copy.assignedEvaluator || copy.assignedEvaluator._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You are not assigned to evaluate this answer copy.'
        });
      }
    }

    // Check if an existing draft/final evaluation exists for this copy
    const existingEvaluation = await Evaluation.findOne({ answerCopy: copy._id }).populate('evaluator', 'name');

    // Retrieve saved annotations for this answer copy
    const annotations = await Annotation.find({ answerCopy: copy._id })
      .populate('evaluator', 'name email')
      .sort({ pageNumber: 1, createdAt: 1 });

    res.status(200).json({
      success: true,
      answerCopy: copy,
      existingEvaluation,
      annotations
    });
  } catch (error) {
    next(error);
  }
};

exports.getMyAssignedCopies = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = { assignedEvaluator: req.user._id };
    if (status) query.evaluationStatus = status;

    const copies = await AnswerCopy.find(query)
      .populate('student', 'name email')
      .populate('examination', 'name code subject maxMarks evaluationMode evaluationModeLocked')
      .sort({ createdAt: -1 });

    const pendingCount = await AnswerCopy.countDocuments({
      assignedEvaluator: req.user._id,
      evaluationStatus: { $in: ['PENDING', 'ASSIGNED', 'AI_REVIEW_PENDING'] }
    });
    const inProgressCount = await AnswerCopy.countDocuments({
      assignedEvaluator: req.user._id,
      evaluationStatus: 'IN_PROGRESS'
    });
    const completedCount = await AnswerCopy.countDocuments({
      assignedEvaluator: req.user._id,
      evaluationStatus: { $in: ['COMPLETED', 'AI_APPROVED'] }
    });

    res.status(200).json({
      success: true,
      stats: {
        total: copies.length,
        pending: pendingCount,
        inProgress: inProgressCount,
        completed: completedCount
      },
      answerCopies: copies
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Select Evaluation Mode (MANUAL or AI_EVALUATION)
exports.selectEvaluationMode = async (req, res, next) => {
  try {
    const { examinationId } = req.params;
    const evaluationMode = req.body.evaluationMode || req.body.mode;

    const isAi = ['AI_EVALUATION', 'AI', 'AI_ASSISTED'].includes(evaluationMode);
    const isManual = evaluationMode === 'MANUAL';

    if (!isAi && !isManual) {
      return res.status(400).json({
        success: false,
        message: 'Invalid evaluation method. Choose strictly Manual Evaluation or AI Evaluation.'
      });
    }

    const normalizedMode = isAi ? 'AI_EVALUATION' : 'MANUAL';

    const exam = await Examination.findById(examinationId);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Examination not found' });
    }

    // Backend security: Reject casual change if mode is already locked!
    if (exam.evaluationModeLocked) {
      return res.status(400).json({
        success: false,
        message: `Evaluation mode is LOCKED (${exam.evaluationMode}) and cannot be changed.`
      });
    }

    exam.evaluationMode = normalizedMode;
    await exam.save();

    // In AI Evaluation mode, copies MUST NOT have evaluator assignments!
    if (normalizedMode === 'AI_EVALUATION') {
      await AnswerCopy.updateMany(
        { examination: exam._id, evaluationStatus: { $in: ['PENDING', 'UNASSIGNED', 'ASSIGNED', 'AI_PENDING'] } },
        { evaluationMode: 'AI_EVALUATION', assignedEvaluator: null, assignedAt: null, status: 'UNASSIGNED' }
      );
    } else {
      await AnswerCopy.updateMany(
        { examination: exam._id, evaluationStatus: { $in: ['PENDING', 'UNASSIGNED', 'AI_PENDING'] } },
        { evaluationMode: 'MANUAL' }
      );
    }

    await logAudit({
      req,
      action: 'EVALUATION_MODE_SELECTED',
      entity: 'Examination',
      entityId: exam._id,
      details: { evaluationMode: normalizedMode }
    });

    res.status(200).json({
      success: true,
      message: `Evaluation mode set to ${normalizedMode === 'AI_EVALUATION' ? 'AI Evaluation' : 'Manual Evaluation'}. Click 'Lock Evaluation Mode' to permanently lock this workflow.`,
      examination: exam
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Permanently Lock Evaluation Mode
exports.lockEvaluationMode = async (req, res, next) => {
  try {
    const { examinationId } = req.params;
    const rawMode = req.body ? (req.body.evaluationMode || req.body.mode) : undefined;

    const exam = await Examination.findById(examinationId);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Examination not found' });
    }

    if (exam.evaluationModeLocked) {
      return res.status(200).json({
        success: true,
        message: `Evaluation mode is already locked to ${exam.evaluationMode}.`,
        examination: exam
      });
    }

    const rawTarget = rawMode || exam.evaluationMode || 'MANUAL';
    const isAi = ['AI_EVALUATION', 'AI', 'AI_ASSISTED'].includes(rawTarget);
    const targetMode = isAi ? 'AI_EVALUATION' : 'MANUAL';

    exam.evaluationMode = targetMode;
    exam.evaluationModeLocked = true;
    exam.evaluationModeLockedAt = new Date();
    exam.status = 'EVALUATION';
    await exam.save();

    // Propagate locked mode to all existing answer copies of this exam
    // Strict rule: AI mode copies must NOT have evaluator assignments!
    if (targetMode === 'AI_EVALUATION') {
      await AnswerCopy.updateMany(
        { examination: exam._id },
        { evaluationMode: 'AI_EVALUATION', assignedEvaluator: null, assignedAt: null }
      );
    } else {
      await AnswerCopy.updateMany(
        { examination: exam._id },
        { evaluationMode: 'MANUAL' }
      );
    }

    await logAudit({
      req,
      action: 'EVALUATION_MODE_LOCKED',
      entity: 'Examination',
      entityId: exam._id,
      details: { evaluationMode: targetMode }
    });

    res.status(200).json({
      success: true,
      message: `Evaluation mode has been permanently LOCKED to ${targetMode === 'AI_EVALUATION' ? 'AI Evaluation' : 'Manual Evaluation'}.`,
      examination: exam
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Assign Scanned Copies to Evaluator (MANUAL EVALUATION ONLY)
exports.assignCopiesToEvaluator = async (req, res, next) => {
  try {
    const { examinationId } = req.params;
    const { copyIds, evaluatorId } = req.body;

    if (!Array.isArray(copyIds) || copyIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Please select at least one copy to assign.' });
    }
    if (!evaluatorId) {
      return res.status(400).json({ success: false, message: 'Please select an evaluator.' });
    }

    const exam = await Examination.findById(examinationId);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Examination not found' });
    }

    // STRICT REQUIREMENT: When examination is configured for AI Evaluation, copies MUST NOT be assigned to human evaluators!
    const isAiMode = ['AI_EVALUATION', 'AI', 'AI_ASSISTED'].includes(exam.evaluationMode);
    if (isAiMode) {
      return res.status(400).json({
        success: false,
        message: 'This examination is configured for AI Evaluation. Scanned answer copies in AI Evaluation mode cannot be assigned to human evaluators.'
      });
    }

    const evaluator = await User.findById(evaluatorId);
    if (!evaluator || evaluator.role !== 'EVALUATOR') {
      return res.status(404).json({ success: false, message: 'Evaluator not found or user is not an evaluator.' });
    }

    // Manual evaluation assignment
    const updatedCopies = [];

    for (const cId of copyIds) {
      const copy = await AnswerCopy.findById(cId);
      if (copy && copy.examination.toString() === exam._id.toString()) {
        if (copy.evaluationStatus === 'COMPLETED' || copy.evaluationStatus === 'AI_APPROVED') {
          continue; // Do not overwrite completed copies
        }

        copy.assignedEvaluator = evaluator._id;
        copy.assignedAt = new Date();
        copy.status = 'ASSIGNED';
        copy.evaluationStatus = 'ASSIGNED';
        copy.evaluationMode = 'MANUAL';
        await copy.save();
        updatedCopies.push(copy._id);
      }
    }

    // Notify Evaluator
    await createNotification({
      recipient: evaluator._id,
      title: 'Scanned Answer Copies Assigned',
      message: `${updatedCopies.length} scanned copies for "${exam.name}" have been assigned to you under MANUAL evaluation mode.`,
      type: 'ACTION_REQUIRED',
      link: '/evaluator/assigned-copies'
    });

    await logAudit({
      req,
      action: 'ANSWER_COPIES_ASSIGNED',
      entity: 'AnswerCopy',
      entityId: exam._id,
      details: {
        evaluatorId: evaluator._id,
        evaluatorName: evaluator.name,
        assignedCount: updatedCopies.length,
        evaluationMode: 'MANUAL'
      }
    });

    res.status(200).json({
      success: true,
      message: `Successfully assigned ${updatedCopies.length} answer copies to ${evaluator.name}.`,
      assignedCount: updatedCopies.length
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Reassign a single copy to a different evaluator
exports.reassignCopy = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { evaluatorId } = req.body;

    const copy = await AnswerCopy.findById(id).populate('examination');
    if (!copy) {
      return res.status(404).json({ success: false, message: 'Answer copy not found.' });
    }

    if (copy.evaluationStatus === 'COMPLETED' || copy.evaluationStatus === 'AI_APPROVED') {
      return res.status(400).json({ success: false, message: 'Cannot reassign a copy that has already completed evaluation.' });
    }

    const evaluator = await User.findById(evaluatorId);
    if (!evaluator || evaluator.role !== 'EVALUATOR') {
      return res.status(404).json({ success: false, message: 'Target evaluator not found.' });
    }

    const prevEvaluator = copy.assignedEvaluator;
    copy.assignedEvaluator = evaluator._id;
    copy.assignedAt = new Date();
    copy.status = 'ASSIGNED';
    copy.evaluationMode = copy.examination.evaluationMode || copy.evaluationMode || 'MANUAL';
    copy.evaluationStatus = copy.evaluationMode === 'AI_ASSISTED' ? 'AI_REVIEW_PENDING' : 'ASSIGNED';
    await copy.save();

    await logAudit({
      req,
      action: 'ANSWER_COPY_REASSIGNED',
      entity: 'AnswerCopy',
      entityId: copy._id,
      details: {
        copyId: copy.copyId,
        from: prevEvaluator,
        to: evaluator._id
      }
    });

    res.status(200).json({
      success: true,
      message: `Copy ${copy.copyId} reassigned to ${evaluator.name}.`,
      answerCopy: copy
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Set Evaluation Method (compatibility endpoint)
exports.setEvaluationMethod = async (req, res, next) => {
  try {
    const { examinationId } = req.params;
    const { evaluationMode } = req.body;

    if (!['MANUAL', 'AI_ASSISTED'].includes(evaluationMode)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid evaluation method. Choose either MANUAL or AI_ASSISTED.'
      });
    }

    const exam = await Examination.findById(examinationId);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Examination not found' });
    }

    if (exam.evaluationModeLocked) {
      return res.status(400).json({
        success: false,
        message: `Evaluation mode is LOCKED (${exam.evaluationMode}) and cannot be changed.`
      });
    }

    exam.evaluationMode = evaluationMode;
    exam.evaluationModeLocked = true;
    exam.evaluationModeLockedAt = new Date();
    exam.status = 'EVALUATION';
    await exam.save();

    await AnswerCopy.updateMany(
      { examination: exam._id },
      { evaluationMode }
    );

    await logAudit({
      req,
      action: 'EVALUATION_METHOD_SELECTED',
      entity: 'Examination',
      entityId: exam._id,
      details: { evaluationMode }
    });

    res.status(200).json({
      success: true,
      message: `Evaluation method locked to ${evaluationMode}. Examination is now ready for copy evaluation.`,
      examination: exam
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Upload and process scanned physical copies
exports.uploadScannedCopies = async (req, res, next) => {
  try {
    const { examinationId } = req.params;
    const { copies } = req.body;

    const exam = await Examination.findById(examinationId).populate('approvedQuestionPaper');
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Examination not found' });
    }

    if (!Array.isArray(copies) || copies.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide at least one answer copy to upload.' });
    }

    let paperQuestions = [];
    if (exam.approvedQuestionPaper) {
      const qp = await QuestionPaper.findById(exam.approvedQuestionPaper._id || exam.approvedQuestionPaper).populate('questions.question');
      if (qp && qp.questions) {
        paperQuestions = qp.questions;
      }
    } else {
      const qp = await QuestionPaper.findOne({ examination: exam._id, status: 'APPROVED' }).populate('questions.question');
      if (qp && qp.questions) {
        paperQuestions = qp.questions;
      }
    }

    if (paperQuestions.length === 0) {
      const fallbackQuestions = await Question.find({ subject: exam.subject, status: 'ACTIVE' }).limit(10);
      paperQuestions = fallbackQuestions.map((fq, idx) => ({
        question: fq,
        questionNumber: idx + 1,
        marks: fq.marks
      }));
    }

    const createdCopies = [];
    for (const copyData of copies) {
      const copyId = (copyData.copyId || `COPY-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 1000)}`).toUpperCase().trim();

      const existing = await AnswerCopy.findOne({ copyId, examination: exam._id });
      if (existing) {
        continue;
      }

      const answers = paperQuestions.map((pq, idx) => {
        const qNumber = pq.questionNumber || idx + 1;
        const qObj = pq.question?._id ? pq.question._id : pq.question;
        const qMarks = pq.marks || pq.question?.marks || 10;
        const matchedExtract = copyData.extractedAnswers?.find((ea) => ea.questionNumber === qNumber);

        return {
          question: qObj,
          questionNumber: qNumber,
          maxMarks: qMarks,
          studentAnswer: matchedExtract ? matchedExtract.studentAnswer : (copyData.studentAnswer || '')
        };
      });

      const newCopy = await AnswerCopy.create({
        copyId,
        examination: exam._id,
        subject: exam.subject,
        candidateRollNo: copyData.candidateRollNo || '',
        candidateName: copyData.candidateName || '',
        bookletNumber: copyData.bookletNumber || '',
        scannedDocument: {
          fileName: copyData.scannedDocument?.fileName || copyData.fileName || 'scanned_booklet.pdf',
          fileUrl: copyData.scannedDocument?.fileUrl || copyData.fileUrl || '',
          fileType: copyData.scannedDocument?.fileType || copyData.fileType || 'application/pdf',
          fileSize: copyData.scannedDocument?.fileSize || copyData.fileSize || 0,
          scannedPages: copyData.scannedDocument?.scannedPages || copyData.scannedPages || []
        },
        status: 'UNASSIGNED',
        scanStatus: 'PROCESSED',
        scannedAt: new Date(),
        answers,
        totalMaxMarks: exam.maxMarks || 50,
        evaluationStatus: 'PENDING',
        evaluationMode: exam.evaluationMode || 'MANUAL'
      });

      createdCopies.push(newCopy);
    }

    if (exam.scanningStatus !== 'SCANNING_COMPLETED') {
      exam.scanningStatus = 'SCANNING_IN_PROGRESS';
      if (['COMPLETED', 'LIVE', 'SCHEDULED'].includes(exam.status)) {
        exam.status = 'SCANNING_IN_PROGRESS';
      }
      await exam.save();
    }

    await logAudit({
      req,
      action: 'ANSWER_COPIES_SCANNED_UPLOADED',
      entity: 'AnswerCopy',
      entityId: exam._id,
      details: { examination: exam.name, uploadedCount: createdCopies.length }
    });

    res.status(201).json({
      success: true,
      message: `Successfully uploaded and processed ${createdCopies.length} physical answer copies.`,
      count: createdCopies.length,
      answerCopies: createdCopies
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Mark scanning as completed
exports.markScanningCompleted = async (req, res, next) => {
  try {
    const { examinationId } = req.params;
    const exam = await Examination.findById(examinationId);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Examination not found' });
    }

    const copyCount = await AnswerCopy.countDocuments({ examination: exam._id });
    if (copyCount === 0) {
      return res.status(400).json({
        success: false,
        message: 'No answer copies uploaded for this examination. Please upload scanned copies before completing scanning.'
      });
    }

    exam.scanningStatus = 'SCANNING_COMPLETED';
    exam.status = 'SCANNING_COMPLETED';
    await exam.save();

    await logAudit({
      req,
      action: 'SCANNING_COMPLETED',
      entity: 'Examination',
      entityId: exam._id,
      details: { totalCopies: copyCount }
    });

    res.status(200).json({
      success: true,
      message: 'Answer copy scanning marked as completed. You can now select the evaluation method.',
      examination: exam,
      copyCount
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Delete single answer copy
exports.deleteAnswerCopy = async (req, res, next) => {
  try {
    const copy = await AnswerCopy.findById(req.params.id);
    if (!copy) {
      return res.status(404).json({ success: false, message: 'Answer copy not found' });
    }

    if (copy.evaluationStatus === 'COMPLETED' || copy.evaluationStatus === 'AI_APPROVED') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete an answer copy that has already completed evaluation.'
      });
    }

    await AnswerCopy.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Answer copy deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * Helper to evaluate all questions in a single copy using AI
 */
async function processCopyAiEvaluation(copy) {
  await copy.populate({
    path: 'answers.question',
    populate: { path: 'rubric' }
  });

  // Prepare scanned media if local file exists
  let scannedMedia = null;
  if (copy.scannedDocument?.fileUrl) {
    try {
      const candidatePath = path.isAbsolute(copy.scannedDocument.fileUrl)
        ? copy.scannedDocument.fileUrl
        : path.join(__dirname, '../../', copy.scannedDocument.fileUrl);
      if (fs.existsSync(candidatePath)) {
        const ext = path.extname(candidatePath).toLowerCase();
        const mimeMap = {
          '.pdf': 'application/pdf',
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.png': 'image/png'
        };
        const mimeType = mimeMap[ext] || 'application/pdf';
        const fileBuf = fs.readFileSync(candidatePath);
        if (fileBuf.length < 15 * 1024 * 1024) {
          scannedMedia = {
            mimeType,
            data: fileBuf.toString('base64')
          };
        }
      }
    } catch (mErr) {
      // Continue without media
    }
  }

  let calculatedAiTotal = 0;
  let hasFailedQuestions = false;
  const questionEvaluations = [];

  for (const ansItem of copy.answers) {
    const q = ansItem.question;
    const qId = q?._id || q;
    const qNum = ansItem.questionNumber;
    const maxM = Number(ansItem.maxMarks || q?.marks || 10);

    try {
      ansItem.evaluationStatus = 'PROCESSING';
      const aiRes = await aiEvaluationService.evaluateAnswer({
        questionText: q?.questionText || `Question ${qNum}`,
        studentAnswer: ansItem.studentAnswer || '',
        referenceAnswer: q?.expectedAnswer || '',
        maxMarks: maxM,
        rubricCriteria: q?.rubric ? q.rubric.criteria : [],
        unit: q?.unit || '',
        topic: q?.topic || '',
        scannedMedia
      });

      const marks = Math.max(0, Math.min(maxM, Number(aiRes.suggestedMarks ?? aiRes.marksAwarded ?? 0)));
      const feedback = aiRes.feedback || aiRes.overallFeedback || 'Evaluated successfully.';

      ansItem.aiMarks = marks;
      ansItem.finalMarks = marks; // Default finalMarks = aiMarks
      ansItem.aiFeedback = feedback;
      ansItem.aiSuggestedMarks = marks;
      ansItem.marksAwarded = marks;
      ansItem.aiAnalysis = feedback;
      ansItem.isAiApproved = true;
      ansItem.adminModified = false;
      ansItem.adminComment = '';
      ansItem.evaluationStatus = 'AI_EVALUATED';
      ansItem.evaluationError = '';

      calculatedAiTotal += marks;

      const mappedCriteria = (aiRes.criteriaEvaluation || []).map((crit) => ({
        criterion: crit.criterion || crit.name || 'Criterion',
        maxMarks: Number(crit.maxMarks) || 1,
        marksAwarded: Number(crit.marksAwarded ?? crit.marks ?? 0),
        feedback: crit.feedback || ''
      }));

      questionEvaluations.push({
        question: qId,
        questionNumber: qNum,
        maxMarks: maxM,
        marksAwarded: marks,
        aiMarks: marks,
        finalMarks: marks,
        comments: feedback,
        aiSuggestedMarks: marks,
        aiFeedback: feedback,
        wasAiAccepted: true,
        criteriaBreakdown: mappedCriteria
      });
    } catch (qErr) {
      console.warn(`Evaluation failed for question ${qNum} in copy ${copy.copyId}:`, qErr.message);
      hasFailedQuestions = true;
      ansItem.evaluationStatus = 'FAILED';
      ansItem.evaluationError = qErr.message || 'AI evaluation failed for this question';

      const currentScore = ansItem.aiMarks ?? 0;
      calculatedAiTotal += currentScore;
      questionEvaluations.push({
        question: qId,
        questionNumber: qNum,
        maxMarks: maxM,
        marksAwarded: currentScore,
        aiMarks: currentScore,
        finalMarks: currentScore,
        comments: `AI Evaluation Error: ${ansItem.evaluationError}`,
        aiSuggestedMarks: currentScore,
        aiFeedback: ansItem.evaluationError,
        wasAiAccepted: false,
        criteriaBreakdown: []
      });
    }
  }

  const maxPossible = copy.totalMaxMarks || copy.answers.reduce((acc, a) => acc + (a.maxMarks || 10), 0);

  copy.aiTotal = calculatedAiTotal;
  copy.finalTotal = calculatedAiTotal;
  copy.totalAwardedMarks = calculatedAiTotal;
  copy.totalMaxMarks = maxPossible;
  copy.percentage = maxPossible > 0 ? Math.round((calculatedAiTotal / maxPossible) * 100 * 10) / 10 : 0;
  copy.evaluationMode = 'AI_EVALUATION';
  copy.assignedEvaluator = null; // Strict rule: AI copies are NEVER assigned to human evaluators
  copy.assignedAt = null;
  copy.evaluationStatus = hasFailedQuestions ? 'AI_FAILED' : 'AI_EVALUATED';
  copy.status = hasFailedQuestions ? 'AI_FAILED' : 'AI_EVALUATED';
  copy.evaluatedAt = new Date();
  copy.errorMessage = hasFailedQuestions ? 'One or more questions failed evaluation and can be retried.' : '';
  copy.aiEvaluationSummary = {
    suggestedTotalMarks: calculatedAiTotal,
    overallFeedback: `AI evaluation completed. Suggested score: ${calculatedAiTotal}/${maxPossible}.`,
    isApproved: false
  };

  await copy.save();

  // Create or update Evaluation record
  let evaluation = await Evaluation.findOne({ answerCopy: copy._id });
  if (evaluation) {
    evaluation.questionEvaluations = questionEvaluations;
    evaluation.evaluationMode = 'AI_EVALUATION';
    evaluation.totalMarks = calculatedAiTotal;
    evaluation.maxPossibleMarks = maxPossible;
    evaluation.aiTotal = calculatedAiTotal;
    evaluation.finalTotal = calculatedAiTotal;
    evaluation.percentage = copy.percentage;
    evaluation.overallComments = copy.aiEvaluationSummary.overallFeedback;
    evaluation.isDraft = false;
    evaluation.submittedAt = new Date();
    await evaluation.save();
  } else {
    evaluation = await Evaluation.create({
      answerCopy: copy._id,
      examination: copy.examination._id || copy.examination,
      evaluationMode: 'AI_EVALUATION',
      isDraft: false,
      questionEvaluations,
      totalMarks: calculatedAiTotal,
      maxPossibleMarks: maxPossible,
      aiTotal: calculatedAiTotal,
      finalTotal: calculatedAiTotal,
      percentage: copy.percentage,
      overallComments: copy.aiEvaluationSummary.overallFeedback,
      submittedAt: new Date()
    });
  }

  // AI evaluation is now complete in AI_EVALUATED state.
  // Result is NOT finalized here — it awaits Admin Review and Finalize action.
  return { copy, evaluation };
}

// Admin: Start AI Evaluation for an examination's scanned copies (Batch: 50 to 100 copies supported)
exports.startAiEvaluation = async (req, res, next) => {
  try {
    const { examinationId } = req.params;
    const { copyIds, force = false, batchSize, limit } = req.body;

    const exam = await Examination.findById(examinationId);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Examination not found' });
    }

    // Set exam evaluation mode to AI_EVALUATION
    exam.evaluationMode = 'AI_EVALUATION';
    if (!exam.evaluationModeLocked) {
      exam.evaluationModeLocked = true;
      exam.evaluationModeLockedAt = new Date();
    }
    exam.status = 'EVALUATION';
    await exam.save();

    let query = { examination: exam._id };
    if (Array.isArray(copyIds) && copyIds.length > 0) {
      query._id = { $in: copyIds };
    } else if (!force) {
      // Prioritize pending / un-evaluated copies
      query.evaluationStatus = { $nin: ['AI_EVALUATED', 'ADMIN_REVIEWED', 'FINALIZED', 'COMPLETED', 'REVIEWED'] };
    }

    let copyQuery = AnswerCopy.find(query);
    const requestedCount = Number(batchSize || limit || req.body.count);
    if (requestedCount && requestedCount > 0) {
      copyQuery = copyQuery.limit(requestedCount);
    }

    let copies = await copyQuery;
    if (copies.length === 0 && (!Array.isArray(copyIds) || copyIds.length === 0)) {
      // Fallback: load available copies up to requestedCount or 100
      copies = await AnswerCopy.find({ examination: exam._id }).limit(requestedCount || 100);
    }

    if (copies.length === 0) {
      return res.status(400).json({ success: false, message: 'No answer copies found to evaluate.' });
    }

    let processedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    // Process in concurrent chunks of 5 for high performance and no timeouts
    const CHUNK_SIZE = 5;
    for (let i = 0; i < copies.length; i += CHUNK_SIZE) {
      const chunk = copies.slice(i, i + CHUNK_SIZE);
      await Promise.all(
        chunk.map(async (copy) => {
          // If not force, skip already completed copies
          if (!force && ['AI_PROCESSING', 'AI_EVALUATED', 'ADMIN_REVIEWED', 'FINALIZED', 'COMPLETED', 'REVIEWED'].includes(copy.evaluationStatus)) {
            skippedCount++;
            return;
          }

          copy.evaluationStatus = 'AI_PROCESSING';
          copy.status = 'AI_PROCESSING';
          copy.evaluationMode = 'AI_EVALUATION';
          copy.assignedEvaluator = null;
          copy.assignedAt = null;
          await copy.save();

          try {
            await processCopyAiEvaluation(copy);
            processedCount++;
          } catch (err) {
            console.error(`AI Evaluation failed for copy ${copy.copyId}:`, err);
            copy.evaluationStatus = 'AI_FAILED';
            copy.status = 'AI_FAILED';
            copy.errorMessage = err.message || 'AI evaluation processing failed';
            await copy.save();
            failedCount++;
          }
        })
      );
    }

    await logAudit({
      req,
      action: 'AI_EVALUATION_BATCH_STARTED',
      entity: 'Examination',
      entityId: exam._id,
      details: {
        totalTargeted: copies.length,
        processedCount,
        skippedCount,
        failedCount,
        batchSize: requestedCount || copies.length
      }
    });

    res.status(200).json({
      success: true,
      message: `AI Evaluation completed. Processed: ${processedCount}, Skipped: ${skippedCount}, Failed: ${failedCount}.`,
      stats: {
        total: copies.length,
        processed: processedCount,
        skipped: skippedCount,
        failed: failedCount
      }
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Run AI evaluation on a single copy
exports.evaluateSingleCopyAi = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { force = false } = req.body;

    const copy = await AnswerCopy.findById(id).populate('examination');
    if (!copy) {
      return res.status(404).json({ success: false, message: 'Answer copy not found' });
    }

    // Duplicate check
    if (!force && ['AI_PROCESSING', 'AI_EVALUATED', 'ADMIN_REVIEWED', 'PROCESSING', 'EVALUATED', 'REVIEWED'].includes(copy.evaluationStatus)) {
      return res.status(400).json({
        success: false,
        message: `This copy has already been evaluated (Status: ${copy.evaluationStatus}). Duplicate AI evaluation avoided.`
      });
    }

    copy.evaluationStatus = 'AI_PROCESSING';
    copy.status = 'AI_PROCESSING';
    copy.evaluationMode = 'AI_EVALUATION';
    copy.assignedEvaluator = null;
    copy.assignedAt = null;
    await copy.save();

    try {
      const { copy: updatedCopy, evaluation } = await processCopyAiEvaluation(copy);
      res.status(200).json({
        success: true,
        message: `AI Evaluation completed for copy ${copy.copyId}.`,
        answerCopy: updatedCopy,
        evaluation
      });
    } catch (err) {
      copy.evaluationStatus = 'AI_FAILED';
      copy.status = 'AI_FAILED';
      copy.errorMessage = err.message || 'AI evaluation processing failed';
      await copy.save();

      return res.status(500).json({
        success: false,
        message: `AI Evaluation failed: ${err.message}`,
        answerCopy: copy
      });
    }
  } catch (error) {
    next(error);
  }
};

// Admin: Save Admin-edited Final Marks
exports.saveAdminFinalMarks = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { questionMarks, overallComments } = req.body;

    if (!Array.isArray(questionMarks) || questionMarks.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide questionMarks array containing question marks.'
      });
    }

    const copy = await AnswerCopy.findById(id)
      .populate('examination')
      .populate({
        path: 'answers.question',
        populate: { path: 'rubric' }
      });

    if (!copy) {
      return res.status(404).json({ success: false, message: 'Answer copy not found' });
    }

    // Admin can edit marks after evaluation or during evaluation review
    if (!copy.answers || copy.answers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'This answer copy has no question items recorded.'
      });
    }

    // 1. Validate all question marks
    for (const qm of questionMarks) {
      const qIdStr = (qm.questionId || qm.question?._id || qm.question)?.toString();
      const qNum = Number(qm.questionNumber);

      const targetAns = copy.answers.find(
        (a) => (a.question?._id || a.question)?.toString() === qIdStr || a.questionNumber === qNum
      );

      if (!targetAns) {
        return res.status(400).json({
          success: false,
          message: `Question identifier (ID: ${qIdStr}, No: ${qNum}) does not exist on this answer copy.`
        });
      }

      const rawVal = qm.finalMarks ?? qm.marksAwarded ?? qm.marks ?? qm.awardedMarks;
      const finalVal = Number(rawVal);
      if (isNaN(finalVal) || finalVal < 0 || finalVal > targetAns.maxMarks) {
        return res.status(400).json({
          success: false,
          message: `Invalid marks for Question ${targetAns.questionNumber}. Marks (${rawVal}) must be between 0 and maximum marks (${targetAns.maxMarks}).`
        });
      }
      qm.finalMarks = finalVal;
    }

    // 2. Save Admin-modified finalMarks, keep aiMarks unchanged, recalculate totals
    let recalculatedFinalTotal = 0;
    let recalculatedAiTotal = 0;
    const updatedQuestionEvaluations = [];

    for (const ansItem of copy.answers) {
      const qIdStr = (ansItem.question?._id || ansItem.question)?.toString();
      const matchedInput = questionMarks.find(
        (qm) => (qm.questionId || qm.question?._id || qm.question)?.toString() === qIdStr || qm.questionNumber === ansItem.questionNumber
      );

      if (matchedInput !== undefined && matchedInput.finalMarks !== undefined && matchedInput.finalMarks !== null && matchedInput.finalMarks !== '') {
        ansItem.finalMarks = Number(matchedInput.finalMarks);
      } else if (ansItem.finalMarks === null || ansItem.finalMarks === undefined) {
        // If Admin does not modify, finalMarks = aiMarks
        ansItem.finalMarks = ansItem.aiMarks ?? ansItem.marksAwarded ?? 0;
      }

      // Keep original aiMarks unchanged!
      if (ansItem.aiMarks === null || ansItem.aiMarks === undefined) {
        ansItem.aiMarks = ansItem.aiSuggestedMarks ?? ansItem.finalMarks;
      }

      const isModified = ansItem.aiMarks !== null && Number(ansItem.finalMarks) !== Number(ansItem.aiMarks);
      ansItem.adminModified = isModified;
      ansItem.adminComment = matchedInput?.comments || matchedInput?.adminComment || ansItem.evaluatorRemarks || '';
      ansItem.marksAwarded = ansItem.finalMarks;
      if (matchedInput?.comments) {
        ansItem.evaluatorRemarks = matchedInput.comments;
      }

      recalculatedFinalTotal += ansItem.finalMarks;
      recalculatedAiTotal += (ansItem.aiMarks ?? ansItem.finalMarks);

      updatedQuestionEvaluations.push({
        question: ansItem.question?._id || ansItem.question,
        questionNumber: ansItem.questionNumber,
        maxMarks: ansItem.maxMarks,
        aiMarks: ansItem.aiMarks,
        finalMarks: ansItem.finalMarks,
        marksAwarded: ansItem.finalMarks,
        comments: ansItem.evaluatorRemarks || ansItem.aiFeedback || '',
        aiSuggestedMarks: ansItem.aiMarks,
        aiFeedback: ansItem.aiFeedback || '',
        wasAiAccepted: ansItem.finalMarks === ansItem.aiMarks
      });
    }

    const totalMax = copy.totalMaxMarks || copy.answers.reduce((acc, a) => acc + (a.maxMarks || 10), 0);

    copy.finalTotal = recalculatedFinalTotal;
    copy.aiTotal = recalculatedAiTotal;
    copy.totalAwardedMarks = recalculatedFinalTotal;
    copy.totalMaxMarks = totalMax;
    copy.evaluationStatus = 'FINALIZED';
    copy.status = 'FINALIZED';
    copy.reviewedAt = new Date();
    copy.reviewedBy = req.user._id;
    await copy.save();

    // 3. Update Evaluation document and recalculate result
    let evaluation = await Evaluation.findOne({ answerCopy: copy._id });
    if (evaluation) {
      evaluation.questionEvaluations = updatedQuestionEvaluations;
      evaluation.totalMarks = recalculatedFinalTotal;
      evaluation.finalTotal = recalculatedFinalTotal;
      evaluation.aiTotal = recalculatedAiTotal;
      evaluation.maxPossibleMarks = totalMax;
      evaluation.percentage = copy.percentage;
      if (overallComments) evaluation.overallComments = overallComments;
      evaluation.reviewedAt = new Date();
      evaluation.isDraft = false;
      await evaluation.save();
    } else {
      evaluation = await Evaluation.create({
        answerCopy: copy._id,
        examination: copy.examination._id || copy.examination,
        evaluator: req.user._id,
        evaluationMode: copy.evaluationMode || 'AI_ASSISTED',
        isDraft: false,
        questionEvaluations: updatedQuestionEvaluations,
        totalMarks: recalculatedFinalTotal,
        finalTotal: recalculatedFinalTotal,
        aiTotal: recalculatedAiTotal,
        maxPossibleMarks: totalMax,
        percentage: copy.percentage,
        overallComments: overallComments || 'Admin reviewed and finalized marks.',
        submittedAt: new Date(),
        reviewedAt: new Date()
      });
    }

    const result = await calculateAndSaveResult(copy._id, evaluation);

    await logAudit({
      req,
      action: 'ADMIN_SAVED_FINAL_MARKS',
      entity: 'AnswerCopy',
      entityId: copy._id,
      details: {
        copyId: copy.copyId,
        aiTotal: recalculatedAiTotal,
        finalTotal: recalculatedFinalTotal,
        maxMarks: totalMax
      }
    });

    res.status(200).json({
      success: true,
      message: `Final marks successfully saved! Final total: ${recalculatedFinalTotal} / ${totalMax} marks.`,
      answerCopy: copy,
      evaluation,
      result
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Retry AI Evaluation for a single question on an answer copy
exports.retryQuestionAi = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { questionId } = req.body;

    const copy = await AnswerCopy.findById(id).populate({
      path: 'answers.question',
      populate: { path: 'rubric' }
    });

    if (!copy) {
      return res.status(404).json({ success: false, message: 'Answer copy not found' });
    }

    const targetAns = copy.answers.find(
      (a) => (a.question?._id || a.question)?.toString() === questionId?.toString()
    );

    if (!targetAns) {
      return res.status(404).json({ success: false, message: 'Question not found on this copy' });
    }

    targetAns.evaluationStatus = 'PROCESSING';
    await copy.save();

    const q = targetAns.question;
    const maxM = Number(targetAns.maxMarks || q?.marks || 10);

    const aiRes = await aiEvaluationService.evaluateAnswer({
      questionText: q?.questionText || `Question ${targetAns.questionNumber}`,
      studentAnswer: targetAns.studentAnswer || '',
      referenceAnswer: q?.expectedAnswer || '',
      maxMarks: maxM,
      rubricCriteria: q?.rubric ? q.rubric.criteria : [],
      unit: q?.unit || '',
      topic: q?.topic || ''
    });

    const marks = Math.max(0, Math.min(maxM, Number(aiRes.suggestedMarks ?? aiRes.marksAwarded ?? 0)));
    const feedback = aiRes.feedback || aiRes.overallFeedback || 'Evaluated successfully.';

    targetAns.aiMarks = marks;
    targetAns.finalMarks = marks;
    targetAns.aiFeedback = feedback;
    targetAns.aiSuggestedMarks = marks;
    targetAns.marksAwarded = marks;
    targetAns.aiAnalysis = feedback;
    targetAns.isAiApproved = true;
    targetAns.adminModified = false;
    targetAns.evaluationStatus = 'AI_EVALUATED';
    targetAns.evaluationError = '';

    // Recalculate totals
    let newAiTotal = 0;
    let newFinalTotal = 0;
    let anyFailed = false;

    for (const a of copy.answers) {
      newAiTotal += (a.aiMarks ?? 0);
      newFinalTotal += (a.finalMarks ?? a.aiMarks ?? 0);
      if (a.evaluationStatus === 'FAILED') anyFailed = true;
    }

    const totalMax = copy.totalMaxMarks || copy.answers.reduce((acc, a) => acc + (a.maxMarks || 10), 0);
    copy.aiTotal = newAiTotal;
    copy.finalTotal = newFinalTotal;
    copy.totalAwardedMarks = newFinalTotal;
    copy.totalMaxMarks = totalMax;
    copy.percentage = totalMax > 0 ? Math.round((newFinalTotal / totalMax) * 100 * 10) / 10 : 0;
    copy.evaluationStatus = anyFailed ? 'PROCESSING' : 'AI_EVALUATED';
    copy.status = anyFailed ? 'PROCESSING' : 'AI_EVALUATED';
    copy.errorMessage = anyFailed ? 'One or more questions failed evaluation and can be retried.' : '';
    await copy.save();

    await logAudit({
      req,
      action: 'QUESTION_AI_EVALUATION_RETRIED',
      entity: 'AnswerCopy',
      entityId: copy._id,
      details: { questionId, copyId: copy.copyId, marks }
    });

    res.status(200).json({
      success: true,
      message: `Question ${targetAns.questionNumber} re-evaluated successfully. Awarded: ${marks}/${maxM}.`,
      answerCopy: copy,
      targetAnswer: targetAns
    });
  } catch (err) {
    next(err);
  }
};
