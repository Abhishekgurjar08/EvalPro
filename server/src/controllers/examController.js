const Examination = require('../models/Examination');
const ExamSetterAssignment = require('../models/ExamSetterAssignment');
const User = require('../models/User');
const { logAudit } = require('../services/auditService');
const { createNotification } = require('../services/notificationService');

exports.getExaminations = async (req, res, next) => {
  try {
    const { status, subject, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (subject) query.subject = { $regex: subject, $options: 'i' };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } }
      ];
    }

    // Role-specific filtering
    if (req.user.role === 'EXAM_SETTER') {
      query.assignedSetter = req.user._id;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Examination.countDocuments(query);
    const examinations = await Examination.find(query)
      .populate('assignedSetter', 'name email employeeId department')
      .populate('approvedQuestionPaper', 'paperTitle totalMarks')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      examinations
    });
  } catch (error) {
    next(error);
  }
};

exports.getExaminationById = async (req, res, next) => {
  try {
    const exam = await Examination.findById(req.params.id)
      .populate('assignedSetter', 'name email employeeId department')
      .populate('approvedQuestionPaper')
      .populate('createdBy', 'name email');

    if (!exam) {
      return res.status(404).json({ success: false, message: 'Examination not found' });
    }

    // Setter security: setter can only view assigned exams
    if (req.user.role === 'EXAM_SETTER') {
      if (!exam.assignedSetter || exam.assignedSetter._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Access denied. You are not assigned to this examination.' });
      }
    }

    // Fetch assignment history
    const assignmentHistory = await ExamSetterAssignment.find({ examination: exam._id })
      .populate('setter', 'name email')
      .populate('assignedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      examination: exam,
      assignmentHistory
    });
  } catch (error) {
    next(error);
  }
};

exports.createExamination = async (req, res, next) => {
  try {
    const {
      name,
      code,
      session,
      course,
      semester,
      subject,
      examDate,
      startTime,
      durationMinutes,
      maxMarks,
      passingMarks,
      description,
      instructions
    } = req.body;

    if (!name || !code || !subject || !maxMarks || !durationMinutes) {
      return res.status(400).json({
        success: false,
        message: 'Name, code, subject, maxMarks and duration are required.'
      });
    }

    if (maxMarks <= 0) {
      return res.status(400).json({ success: false, message: 'Maximum marks must be greater than zero.' });
    }

    if (durationMinutes < 15) {
      return res.status(400).json({ success: false, message: 'Duration must be at least 15 minutes.' });
    }

    const existing = await Examination.findOne({ code: code.toUpperCase().trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: `Exam code '${code}' already exists.` });
    }

    const examination = await Examination.create({
      name,
      code: code.toUpperCase().trim(),
      session: session || '2025-2026',
      course: course || 'B.Tech',
      semester: semester || 6,
      subject,
      examDate: examDate || new Date(),
      startTime: startTime || '10:00 AM',
      durationMinutes,
      maxMarks,
      passingMarks: passingMarks || Math.round(maxMarks * 0.4),
      description: description || '',
      instructions: instructions || [
        'Attempt all questions in sequence.',
        'Read each question carefully before answering.',
        'Maintain academic integrity.'
      ],
      status: 'DRAFT',
      createdBy: req.user._id
    });

    await logAudit({
      req,
      action: 'EXAM_CREATED',
      entity: 'Examination',
      entityId: examination._id,
      details: { name, code, subject }
    });

    res.status(201).json({
      success: true,
      message: 'Examination created successfully',
      examination
    });
  } catch (error) {
    next(error);
  }
};

exports.updateExamination = async (req, res, next) => {
  try {
    let exam = await Examination.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Examination not found' });
    }

    const updated = await Examination.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    await logAudit({
      req,
      action: 'EXAM_UPDATED',
      entity: 'Examination',
      entityId: updated._id,
      details: req.body
    });

    res.status(200).json({ success: true, message: 'Examination updated', examination: updated });
  } catch (error) {
    next(error);
  }
};

exports.deleteExamination = async (req, res, next) => {
  try {
    const exam = await Examination.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Examination not found' });
    }

    if (exam.status !== 'DRAFT') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete an examination that has progressed beyond DRAFT state.'
      });
    }

    await Examination.findByIdAndDelete(req.params.id);
    await logAudit({
      req,
      action: 'EXAM_DELETED',
      entity: 'Examination',
      entityId: req.params.id,
      details: { name: exam.name, code: exam.code }
    });

    res.status(200).json({ success: true, message: 'Examination deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Assign Exam Setter
exports.assignSetter = async (req, res, next) => {
  try {
    const { setterId } = req.body;
    const exam = await Examination.findById(req.params.id);

    if (!exam) {
      return res.status(404).json({ success: false, message: 'Examination not found' });
    }

    const setter = await User.findById(setterId);
    if (!setter || setter.role !== 'EXAM_SETTER') {
      return res.status(400).json({ success: false, message: 'Invalid setter user selected.' });
    }

    exam.assignedSetter = setter._id;
    exam.setterAssignmentDate = new Date();
    exam.status = 'SETTER_ASSIGNED';
    await exam.save();

    // Create history record
    await ExamSetterAssignment.create({
      examination: exam._id,
      setter: setter._id,
      status: 'PENDING',
      assignedBy: req.user._id,
      assignedAt: new Date()
    });

    // Notify setter
    await createNotification({
      recipient: setter._id,
      title: 'New Examination Assigned',
      message: `You have been assigned as the exam setter for ${exam.name} (${exam.subject}). Please review and respond.`,
      type: 'ACTION_REQUIRED',
      link: '/setter/examinations'
    });

    await logAudit({
      req,
      action: 'SETTER_ASSIGNED',
      entity: 'Examination',
      entityId: exam._id,
      details: { setterName: setter.name, setterEmail: setter.email }
    });

    res.status(200).json({
      success: true,
      message: `Exam setter ${setter.name} assigned successfully.`,
      examination: exam
    });
  } catch (error) {
    next(error);
  }
};

// Setter Response (Accept / Reject)
exports.setterResponse = async (req, res, next) => {
  try {
    const { response, reason } = req.body; // 'ACCEPT' or 'REJECT'
    const exam = await Examination.findById(req.params.id);

    if (!exam) {
      return res.status(404).json({ success: false, message: 'Examination not found' });
    }

    if (!exam.assignedSetter || exam.assignedSetter.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You are not the assigned setter for this exam.' });
    }

    if (response === 'REJECT' && (!reason || reason.trim() === '')) {
      return res.status(400).json({ success: false, message: 'A reason is mandatory when rejecting assignment.' });
    }

    const assignmentRecord = await ExamSetterAssignment.findOne({
      examination: exam._id,
      setter: req.user._id,
      status: 'PENDING'
    }).sort({ createdAt: -1 });

    if (response === 'ACCEPT') {
      exam.status = 'SETTER_ACCEPTED';
      exam.setterResponseDate = new Date();
      if (assignmentRecord) {
        assignmentRecord.status = 'ACCEPTED';
        assignmentRecord.respondedAt = new Date();
        await assignmentRecord.save();
      }

      await createNotification({
        targetRole: 'ADMIN',
        title: 'Setter Accepted Assignment',
        message: `${req.user.name} accepted the setter assignment for ${exam.name}.`,
        type: 'SUCCESS',
        link: `/admin/examinations/${exam._id}`
      });
    } else {
      exam.status = 'SETTER_REJECTED';
      exam.setterResponseDate = new Date();
      exam.setterRejectionReason = reason;
      if (assignmentRecord) {
        assignmentRecord.status = 'REJECTED';
        assignmentRecord.rejectionReason = reason;
        assignmentRecord.respondedAt = new Date();
        await assignmentRecord.save();
      }

      await createNotification({
        targetRole: 'ADMIN',
        title: 'Setter Rejected Assignment',
        message: `${req.user.name} rejected assignment for ${exam.name}. Reason: ${reason}`,
        type: 'WARNING',
        link: `/admin/examinations/${exam._id}`
      });
    }

    await exam.save();

    await logAudit({
      req,
      action: response === 'ACCEPT' ? 'SETTER_ACCEPTED' : 'SETTER_REJECTED',
      entity: 'Examination',
      entityId: exam._id,
      details: { response, reason: reason || 'None' }
    });

    res.status(200).json({
      success: true,
      message: `Assignment ${response === 'ACCEPT' ? 'accepted' : 'rejected'} successfully.`,
      examination: exam
    });
  } catch (error) {
    next(error);
  }
};

