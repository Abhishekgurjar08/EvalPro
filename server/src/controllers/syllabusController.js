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
