const Question = require('../models/Question');
const QuestionRubric = require('../models/QuestionRubric');
const Examination = require('../models/Examination');
const { logAudit } = require('../services/auditService');

exports.getSubjects = async (req, res, next) => {
  try {
    const questionSubjects = await Question.distinct('subject');
    const examSubjects = await Examination.distinct('subject');

    const allSubjectNames = Array.from(
      new Set(
        [...questionSubjects, ...examSubjects]
          .filter((s) => s && typeof s === 'string' && s.trim().length > 0)
          .map((s) => s.trim())
      )
    ).sort();

    const subjects = await Promise.all(
      allSubjectNames.map(async (name) => {
        const count = await Question.countDocuments({
          subject: { $regex: `^${name.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}$`, $options: 'i' },
          status: 'ACTIVE'
        });
        return {
          name,
          questionCount: count
        };
      })
    );

    res.status(200).json({ success: true, subjects });
  } catch (error) {
    next(error);
  }
};

exports.getQuestions = async (req, res, next) => {
  try {
    const { subject, difficulty, questionType, unit, search, page = 1, limit = 50 } = req.query;
    const query = { status: 'ACTIVE' };

    if (subject) {
      if (req.query.exact === 'true') {
        query.subject = { $regex: `^${subject.trim().replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}$`, $options: 'i' };
      } else {
        query.subject = { $regex: subject, $options: 'i' };
      }
    }
    if (difficulty) query.difficulty = difficulty;
    if (questionType) query.questionType = questionType;
    if (unit) query.unit = unit;
    if (search) {
      query.$or = [
        { questionText: { $regex: search, $options: 'i' } },
        { topic: { $regex: search, $options: 'i' } },
        { expectedAnswer: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Question.countDocuments(query);
    const questions = await Question.find(query)
      .populate('rubric')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      questions
    });
  } catch (error) {
    next(error);
  }
};

exports.getQuestionById = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id)
      .populate('rubric')
      .populate('createdBy', 'name email');

    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    res.status(200).json({ success: true, question });
  } catch (error) {
    next(error);
  }
};

exports.createQuestion = async (req, res, next) => {
  try {
    const {
      subject,
      examination,
      unit,
      topic,
      questionText,
      questionType,
      options,
      difficulty,
      explanation
    } = req.body;

    const marks = Number(req.body.marks || req.body.maxMarks);
    const expectedAnswer = (req.body.expectedAnswer || req.body.referenceAnswer || req.body.modelAnswer || '').trim();
    const rawRubric = req.body.rubricCriteria || req.body.rubric;
    const rubricCriteria = Array.isArray(rawRubric) ? rawRubric.map(r => ({
      name: r.name || r.criteria || 'Criterion',
      description: r.description || '',
      maxMarks: Number(r.maxMarks || r.marks || 1),
      keywords: Array.isArray(r.keywords) ? r.keywords : []
    })) : null;

    if (!subject || !questionText || !marks || !expectedAnswer) {
      return res.status(400).json({
        success: false,
        message: 'Subject, question text, marks, and reference/expected answer are required.'
      });
    }

    if (Number(marks) <= 0) {
      return res.status(400).json({ success: false, message: 'Marks must be greater than zero.' });
    }

    const question = await Question.create({
      subject,
      examination: examination || null,
      unit: unit || 'Unit 1',
      topic: topic || 'General',
      questionText,
      questionType: questionType || 'DESCRIPTIVE',
      options: options || [],
      marks: Number(marks),
      difficulty: difficulty || 'MEDIUM',
      expectedAnswer,
      explanation: explanation || '',
      createdBy: req.user._id
    });

    // If rubric criteria are provided, validate and create linked rubric
    if (rubricCriteria && Array.isArray(rubricCriteria) && rubricCriteria.length > 0) {
      const criteriaSum = rubricCriteria.reduce((acc, curr) => acc + (Number(curr.maxMarks) || 0), 0);
      if (criteriaSum > Number(marks)) {
        // Rollback created question
        await Question.findByIdAndDelete(question._id);
        return res.status(400).json({
          success: false,
          message: `Sum of rubric criteria marks (${criteriaSum}) exceeds question max marks (${marks}).`
        });
      }

      const rubric = await QuestionRubric.create({
        question: question._id,
        maxMarks: Number(marks),
        criteria: rubricCriteria,
        createdBy: req.user._id
      });

      question.rubric = rubric._id;
      await question.save();
    }

    await logAudit({
      req,
      action: 'QUESTION_CREATED',
      entity: 'Question',
      entityId: question._id,
      details: { subject, marks, questionType: question.questionType }
    });

    const populated = await Question.findById(question._id).populate('rubric');
    res.status(201).json({ success: true, message: 'Question created successfully', question: populated });
  } catch (error) {
    next(error);
  }
};

exports.updateQuestion = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    const { rubricCriteria, ...rest } = req.body;
    Object.assign(question, rest, { updatedBy: req.user._id });

    if (rubricCriteria && Array.isArray(rubricCriteria)) {
      const criteriaSum = rubricCriteria.reduce((acc, curr) => acc + (Number(curr.maxMarks) || 0), 0);
      if (criteriaSum > question.marks) {
        return res.status(400).json({
          success: false,
          message: `Sum of rubric criteria marks (${criteriaSum}) exceeds question marks (${question.marks}).`
        });
      }

      let rubric = await QuestionRubric.findOne({ question: question._id });
      if (rubric) {
        rubric.maxMarks = question.marks;
        rubric.criteria = rubricCriteria;
        await rubric.save();
      } else {
        rubric = await QuestionRubric.create({
          question: question._id,
          maxMarks: question.marks,
          criteria: rubricCriteria,
          createdBy: req.user._id
        });
        question.rubric = rubric._id;
      }
    }

    await question.save();

    await logAudit({
      req,
      action: 'QUESTION_UPDATED',
      entity: 'Question',
      entityId: question._id,
      details: rest
    });

    const populated = await Question.findById(question._id).populate('rubric');
    res.status(200).json({ success: true, message: 'Question updated successfully', question: populated });
  } catch (error) {
    next(error);
  }
};

exports.deleteQuestion = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    question.status = 'ARCHIVED';
    await question.save();

    await logAudit({
      req,
      action: 'QUESTION_ARCHIVED',
      entity: 'Question',
      entityId: question._id,
      details: { questionText: question.questionText }
    });

    res.status(200).json({ success: true, message: 'Question archived successfully' });
  } catch (error) {
    next(error);
  }
};
