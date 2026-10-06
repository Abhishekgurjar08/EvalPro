const Syllabus = require('../models/Syllabus');
const Examination = require('../models/Examination');
const ExamSetterAssignment = require('../models/ExamSetterAssignment');
const { logAudit } = require('../services/auditService');

exports.getSyllabi = async (req, res, next) => {
  try {
    const { subject } = req.query;
    const query = {};
    if (subject) query.subject = { $regex: subject, $options: 'i' };

    const syllabi = await Syllabus.find(query)
      .populate('examination', 'name code subject')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: syllabi.length,
      syllabi
    });
  } catch (error) {
    next(error);
  }
};

exports.getSyllabusByExam = async (req, res, next) => {
  try {
    const { examId } = req.params;
    const exam = await Examination.findById(examId).populate('assignedSyllabus');
    if (!exam) return res.status(404).json({ success: false, message: 'Examination not found' });

    let syllabus = null;

    // 1. Direct assigned syllabus on examination
    if (exam.assignedSyllabus) {
      syllabus = await Syllabus.findById(exam.assignedSyllabus).populate('createdBy', 'name email');
    }

    // 2. Syllabus linked by examination field
    if (!syllabus) {
      syllabus = await Syllabus.findOne({ examination: examId }).populate('createdBy', 'name email');
    }

    // 3. Fallback: check latest assignment record
    if (!syllabus) {
      const assignment = await ExamSetterAssignment.findOne({ examination: examId, syllabus: { $ne: null } })
        .sort({ createdAt: -1 })
        .populate('syllabus');
      if (assignment && assignment.syllabus) {
        syllabus = assignment.syllabus;
      }
    }

    if (!syllabus) {
      return res.status(200).json({ success: true, syllabus: null, message: 'No syllabus assigned yet for this exam.' });
    }
    res.status(200).json({ success: true, syllabus });
  } catch (error) {
    next(error);
  }
};

exports.createOrUpdateSyllabus = async (req, res, next) => {
  try {
    const examinationId = req.body.examinationId || req.body.examination || req.body.examId;
    const { subject, units } = req.body;

    if (!examinationId || !subject) {
      return res.status(400).json({ success: false, message: 'Examination ID and subject are required.' });
    }

    let syllabus = await Syllabus.findOne({ examination: examinationId });

    const normalizedUnits = (units || []).map((u, uIdx) => ({
      unitNumber: Number(u.unitNumber) || (uIdx + 1),
      title: u.title || `Unit ${uIdx + 1}`,
      description: u.description || '',
      topics: (u.topics || []).map((t, tIdx) => {
        if (typeof t === 'string') {
          return { topicNumber: tIdx + 1, title: t, description: '' };
        }
        return {
          topicNumber: Number(t.topicNumber) || (tIdx + 1),
          title: t.title || t.name || `Topic ${tIdx + 1}`,
          description: t.description || ''
        };
      })
    }));

    if (syllabus) {
      syllabus.subject = subject;
      syllabus.units = normalizedUnits;
      await syllabus.save();
    } else {
      syllabus = await Syllabus.create({
        examination: examinationId,
        subject,
        units: normalizedUnits,
        createdBy: req.user._id
      });
    }

    // Ensure examination has assignedSyllabus set
    if (examinationId) {
      await Examination.findByIdAndUpdate(examinationId, { assignedSyllabus: syllabus._id });
    }

    await logAudit({
      req,
      action: 'SYLLABUS_SAVED',
      entity: 'Syllabus',
      entityId: syllabus._id,
      details: { subject, unitCount: units ? units.length : 0 }
    });

    res.status(200).json({
      success: true,
      message: 'Syllabus saved successfully',
      syllabus
    });
  } catch (error) {
    next(error);
  }
};
