const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true
    },
    examination: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Examination',
      default: null
    },
    unit: {
      type: String,
      default: 'Unit 1'
    },
    topic: {
      type: String,
      default: 'General'
    },
    questionText: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true
    },
    questionType: {
      type: String,
      enum: ['MCQ', 'SHORT_ANSWER', 'LONG_ANSWER', 'DESCRIPTIVE'],
      default: 'DESCRIPTIVE'
    },
    options: [
      {
        text: String,
        isCorrect: { type: Boolean, default: false }
      }
    ],
    marks: {
      type: Number,
      required: [true, 'Marks value is required'],
      min: 1
    },
    difficulty: {
      type: String,
      enum: ['EASY', 'MEDIUM', 'HARD'],
      default: 'MEDIUM'
    },
    expectedAnswer: {
      type: String,
      required: [true, 'Reference/Expected answer is required for evaluation and AI rubrics'],
      trim: true
    },
    explanation: {
      type: String,
      default: ''
    },
    rubric: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'QuestionRubric',
      default: null
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'ARCHIVED'],
      default: 'ACTIVE'
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { timestamps: true }
);

// Search indexes
questionSchema.index({ subject: 1, questionText: 'text' });

module.exports = mongoose.model('Question', questionSchema);
