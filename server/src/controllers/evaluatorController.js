const EvaluatorProfile = require('../models/EvaluatorProfile');
const EvaluatorAssignment = require('../models/EvaluatorAssignment');
const User = require('../models/User');
const AnswerCopy = require('../models/AnswerCopy');
const Examination = require('../models/Examination');
const { logAudit } = require('../services/auditService');
const { createNotification } = require('../services/notificationService');

exports.getEvaluators = async (req, res, next) => {
  try {
    const { subject, status } = req.query;
    const query = {};
    if (subject) query.subjects = { $in: [new RegExp(subject, 'i')] };
    if (status) query.status = status;

    const profiles = await EvaluatorProfile.find(query).populate('user', 'name email status').sort({ createdAt: -1 });

    // Enrich with workload stats
    const enriched = [];
    for (const prof of profiles) {
      const assignedCount = await AnswerCopy.countDocuments({
        assignedEvaluator: prof.user._id,
        evaluationStatus: { $in: ['ASSIGNED', 'IN_PROGRESS'] }
      });
      const completedCount = await AnswerCopy.countDocuments({
        assignedEvaluator: prof.user._id,
        evaluationStatus: 'COMPLETED'
      });

      enriched.push({
        ...prof.toObject(),
        workload: {
          activeAssigned: assignedCount,
          completed: completedCount,
          maxWorkload: prof.maxWorkload || 50,
          utilizationPercentage: Math.round((assignedCount / (prof.maxWorkload || 50)) * 100)
        }
      });
    }

    res.status(200).json({ success: true, count: enriched.length, evaluators: enriched });
  } catch (error) {
    next(error);
  }
};

exports.createEvaluator = async (req, res, next) => {
  try {
    const { name, email, employeeId, department, subjects, maxWorkload, password } = req.body;

    if (!name || !email || !employeeId) {
      return res.status(400).json({ success: false, message: 'Name, email, and employee ID are required.' });
    }

    let user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      user = await User.create({
        name,
        email: email.toLowerCase().trim(),
        password: password || 'Evaluator@123',
        role: 'EVALUATOR',
        department: department || 'Computer Science & Engineering',
        employeeId
      });
    } else {
      user.role = 'EVALUATOR';
      await user.save();
    }

    const existingProfile = await EvaluatorProfile.findOne({ user: user._id });
    if (existingProfile) {
      return res.status(400).json({ success: false, message: 'Evaluator profile already exists for this user.' });
    }

    const profile = await EvaluatorProfile.create({
      user: user._id,
      name,
      email: user.email,
      employeeId,
      department: department || user.department,
      subjects: subjects || ['Computer Networks'],
      maxWorkload: maxWorkload || 50,
      status: 'ACTIVE'
    });

    await logAudit({
      req,
      action: 'EVALUATOR_CREATED',
      entity: 'EvaluatorProfile',
      entityId: profile._id,
      details: { name, email, subjects }
    });

    res.status(201).json({ success: true, message: 'Evaluator profile created successfully', evaluator: profile });
  } catch (error) {
    next(error);
  }
};

exports.updateEvaluator = async (req, res, next) => {
  try {
    const profile = await EvaluatorProfile.findById(req.params.id);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Evaluator profile not found' });
    }

    const updated = await EvaluatorProfile.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ success: true, message: 'Evaluator updated successfully', evaluator: updated });
  } catch (error) {
    next(error);
  }
};

// Copy Assignment Workflow (Admin assigns selected copies to Evaluator)
exports.assignCopiesToEvaluator = async (req, res, next) => {
  try {
    const { examinationId, evaluatorId, copyIds } = req.body;

    if (!examinationId || !evaluatorId || !Array.isArray(copyIds) || copyIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Examination ID, Evaluator ID, and an array of Copy IDs are required.'
      });
    }

    const exam = await Examination.findById(examinationId);
    if (!exam) return res.status(404).json({ success: false, message: 'Examination not found' });

    const evaluatorUser = await User.findById(evaluatorId);
    if (!evaluatorUser || evaluatorUser.role !== 'EVALUATOR') {
      return res.status(400).json({ success: false, message: 'Invalid evaluator selected.' });
    }

    // Check Evaluator Profile for Subject validation
    const profile = await EvaluatorProfile.findOne({ user: evaluatorUser._id });
    if (profile && profile.subjects.length > 0) {
      const canEvaluateSubject = profile.subjects.some(
        (s) => s.toLowerCase().trim() === exam.subject.toLowerCase().trim()
      );
      if (!canEvaluateSubject) {
        return res.status(400).json({
          success: false,
          message: `Evaluator ${profile.name} is not assigned to evaluate subject "${exam.subject}". Allowed subjects: ${profile.subjects.join(', ')}`
        });
      }
    }

    // Update Answer Copies
    const updatedCopies = [];
    for (const cId of copyIds) {
      const copy = await AnswerCopy.findById(cId);
      if (copy) {
        // Prevent assigning if already completed
        if (copy.evaluationStatus === 'COMPLETED') {
          continue;
        }

        copy.assignedEvaluator = evaluatorUser._id;
        copy.assignedAt = new Date();
        copy.evaluationStatus = 'ASSIGNED';
        copy.evaluationMode = 'MANUAL';
        await copy.save();
        updatedCopies.push(copy._id);
      }
    }

    // Create Evaluator Assignment Record for history
    const assignmentRecord = await EvaluatorAssignment.create({
      evaluator: evaluatorUser._id,
      examination: exam._id,
      subject: exam.subject,
      answerCopies: updatedCopies,
      assignedBy: req.user._id,
      assignedAt: new Date(),
      status: 'ASSIGNED'
    });

    // Notify Evaluator
    await createNotification({
      recipient: evaluatorUser._id,
      title: 'New Answer Copies Assigned',
      message: `${updatedCopies.length} answer copies for "${exam.name} - ${exam.subject}" have been assigned to you.`,
      type: 'ACTION_REQUIRED',
      link: '/evaluator/assigned-copies'
    });

    await logAudit({
      req,
      action: 'ANSWER_COPIES_ASSIGNED',
      entity: 'EvaluatorAssignment',
      entityId: assignmentRecord._id,
      details: {
        evaluator: evaluatorUser.name,
        exam: exam.name,
        subject: exam.subject,
        copyCount: updatedCopies.length
      }
    });

    res.status(200).json({
      success: true,
      message: `Successfully assigned ${updatedCopies.length} copies to ${evaluatorUser.name}.`,
      assignedCount: updatedCopies.length
    });
  } catch (error) {
    next(error);
  }
};
