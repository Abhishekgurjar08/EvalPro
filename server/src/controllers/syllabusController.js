const Syllabus = require('../models/Syllabus');
const Examination = require('../models/Examination');
const { logAudit } = require('../services/auditService');

exports.getSyllabusByExam = async (req, res, next) => {
  try {
    const { examId } = req.params;
    let syllabus = await Syllabus.findOne({ examination: examId }).populate('createdBy', 'name email');
    if (!syllabus) {
      // Find examination to check if exam exists
      const exam = await Examination.findById(examId);
      if (!exam) return res.status(404).json({ success: false, message: 'Examination not found' });
      return res.status(200).json({ success: true, syllabus: null, message: 'No syllabus created yet for this exam.' });
    }
    res.status(200).json({ success: true, syllabus });
  } catch (error) {
    next(error);
  }
};

exports.createOrUpdateSyllabus = async (req, res, next) => {
  try {
    const { examinationId, subject, units } = req.body;

    if (!examinationId || !subject) {
      return res.status(400).json({ success: false, message: 'Examination ID and subject are required.' });
    }

    let syllabus = await Syllabus.findOne({ examination: examinationId });

    if (syllabus) {
      syllabus.subject = subject;
      syllabus.units = units || [];
      await syllabus.save();
    } else {
      syllabus = await Syllabus.create({
        examination: examinationId,
        subject,
        units: units || [],
        createdBy: req.user._id
      });
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
