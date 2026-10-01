const QuestionPaper = require('../models/QuestionPaper');
const Examination = require('../models/Examination');
const Question = require('../models/Question');
const { logAudit } = require('../services/auditService');
const { createNotification } = require('../services/notificationService');

exports.getQuestionPapers = async (req, res, next) => {
  try {
    const { examinationId, status } = req.query;
    const query = {};
    if (examinationId) query.examination = examinationId;
    if (status) query.status = status;

    const papers = await QuestionPaper.find(query)
      .populate('examination', 'name code subject maxMarks status')
      .populate('submittedBy', 'name email')
      .populate('reviewedBy', 'name email')
      .populate('questions.question')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: papers.length, questionPapers: papers });
  } catch (error) {
    next(error);
  }
};

exports.getQuestionPaperById = async (req, res, next) => {
  try {
    const paper = await QuestionPaper.findById(req.params.id)
      .populate('examination')
      .populate('submittedBy', 'name email')
      .populate('reviewedBy', 'name email')
      .populate({
        path: 'questions.question',
        populate: { path: 'rubric' }
      });

    if (!paper) {
      return res.status(404).json({ success: false, message: 'Question paper not found' });
    }

    res.status(200).json({ success: true, questionPaper: paper });
  } catch (error) {
    next(error);
  }
};

exports.createOrUpdateQuestionPaper = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { examinationId, paperTitle, instructions, questions } = req.body;

    const exam = await Examination.findById(examinationId || (req.body.examination && req.body.examination._id));
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Associated examination not found' });
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one question is required.' });
    }

    // Calculate total marks of questions
    const totalMarks = questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0);

    let paper;
    if (id) {
      paper = await QuestionPaper.findById(id);
      if (!paper) return res.status(404).json({ success: false, message: 'Paper not found' });

      if (paper.status === 'APPROVED') {
        return res.status(400).json({
          success: false,
          message: 'Cannot modify an approved question paper unless a revision is requested.'
        });
      }

      paper.paperTitle = paperTitle || paper.paperTitle;
      paper.instructions = instructions || paper.instructions;
      paper.questions = questions;
      paper.totalMarks = totalMarks;
      await paper.save();
    } else {
      paper = await QuestionPaper.create({
        examination: exam._id,
        paperTitle: paperTitle || `${exam.name} - Question Paper`,
        instructions: instructions || [
          'Attempt all questions in order.',
          'Answer thoroughly with relevant examples where applicable.'
        ],
        questions,
        totalMarks,
        status: 'DRAFT',
        submittedBy: req.user._id
      });
    }

    await logAudit({
      req,
      action: id ? 'QUESTION_PAPER_UPDATED' : 'QUESTION_PAPER_CREATED',
      entity: 'QuestionPaper',
      entityId: paper._id,
      details: { totalMarks, questionCount: questions.length }
    });

    res.status(200).json({
      success: true,
      message: 'Question paper saved',
      questionPaper: paper
    });
  } catch (error) {
    next(error);
  }
};

// Submit question paper for Admin review
exports.submitQuestionPaper = async (req, res, next) => {
  try {
    const paper = await QuestionPaper.findById(req.params.id).populate('examination');
    if (!paper) {
      return res.status(404).json({ success: false, message: 'Question paper not found' });
    }

    if (paper.totalMarks !== paper.examination.maxMarks) {
      return res.status(400).json({
        success: false,
        message: `Paper total marks (${paper.totalMarks}) must match exam max marks (${paper.examination.maxMarks}) before submission.`
      });
    }

    paper.status = 'SUBMITTED';
    paper.submittedBy = req.user._id;
    paper.submittedAt = new Date();
    paper.approvalHistory.push({
      action: paper.approvalHistory.some((h) => h.action === 'REJECTED') ? 'RESUBMITTED' : 'SUBMITTED',
      performedBy: req.user._id,
      comments: req.body.comments || 'Submitted for administrative approval'
    });
    await paper.save();

    // Update Examination status
    await Examination.findByIdAndUpdate(paper.examination._id, {
      status: 'PAPER_SUBMITTED'
    });

    // Notify Admins
    await createNotification({
      targetRole: 'ADMIN',
      title: 'Question Paper Submitted for Approval',
      message: `Exam setter submitted question paper for "${paper.examination.name}". Please review and approve.`,
      type: 'ACTION_REQUIRED',
      link: '/admin/question-papers'
    });

    await logAudit({
      req,
      action: 'QUESTION_PAPER_SUBMITTED',
      entity: 'QuestionPaper',
      entityId: paper._id,
      details: { examination: paper.examination.name, totalMarks: paper.totalMarks }
    });

    res.status(200).json({
      success: true,
      message: 'Question paper submitted for approval successfully',
      questionPaper: paper
    });
  } catch (error) {
    next(error);
  }
};

// Admin Approve or Reject Question Paper
exports.reviewQuestionPaper = async (req, res, next) => {
  try {
    const { action, comments, scheduledDate } = req.body; // 'APPROVE' or 'REJECT'
    const paper = await QuestionPaper.findById(req.params.id).populate('examination').populate('submittedBy');

    if (!paper) {
      return res.status(404).json({ success: false, message: 'Question paper not found' });
    }

    if (action === 'REJECT') {
      if (!comments || comments.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Rejection reason / comments are mandatory when rejecting a question paper.'
        });
      }

      paper.status = 'REJECTED';
      paper.reviewedBy = req.user._id;
      paper.reviewedAt = new Date();
      paper.rejectionReason = comments;
      paper.approvalHistory.push({
        action: 'REJECTED',
        performedBy: req.user._id,
        comments
      });
      await paper.save();

      await Examination.findByIdAndUpdate(paper.examination._id, {
        status: 'PAPER_REJECTED'
      });

      if (paper.submittedBy) {
        await createNotification({
          recipient: paper.submittedBy._id,
          title: 'Question Paper Revision Required',
          message: `Your question paper for "${paper.examination.name}" was rejected. Feedback: ${comments}`,
          type: 'WARNING',
          link: '/setter/question-papers'
        });
      }
    } else if (action === 'APPROVE') {
      paper.status = 'APPROVED';
      paper.reviewedBy = req.user._id;
      paper.reviewedAt = new Date();
      paper.rejectionReason = '';
      paper.approvalHistory.push({
        action: 'APPROVED',
        performedBy: req.user._id,
        comments: comments || 'Approved without modifications'
      });
      await paper.save();

      // Update exam to PAPER_APPROVED or SCHEDULED
      await Examination.findByIdAndUpdate(paper.examination._id, {
        status: scheduledDate ? 'SCHEDULED' : 'PAPER_APPROVED',
        approvedQuestionPaper: paper._id
      });

      if (paper.submittedBy) {
        await createNotification({
          recipient: paper.submittedBy._id,
          title: 'Question Paper Approved',
          message: `Your question paper for "${paper.examination.name}" has been approved!`,
          type: 'SUCCESS',
          link: '/setter/question-papers'
        });
      }
    } else {
      return res.status(400).json({ success: false, message: 'Invalid review action. Must be APPROVE or REJECT.' });
    }

    await logAudit({
      req,
      action: `QUESTION_PAPER_${action}D`,
      entity: 'QuestionPaper',
      entityId: paper._id,
      details: { action, comments }
    });

    res.status(200).json({
      success: true,
      message: `Question paper ${action === 'APPROVE' ? 'approved' : 'rejected'} successfully`,
      questionPaper: paper
    });
  } catch (error) {
    next(error);
  }
};
