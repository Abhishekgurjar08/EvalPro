const mongoose = require('mongoose');

const criteriaBreakdownSchema = new mongoose.Schema({
  criterion: { type: String, required: true },
  maxMarks: { type: Number, required: true },
  marksAwarded: { type: Number, required: true },
  feedback: { type: String, default: '' }
});

const questionEvaluationSchema = new mongoose.Schema({
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: false
  },
  questionNumber: {
    type: Number,
    required: true
  },
  maxMarks: {
    type: Number,
    required: true
  },
  marksAwarded: {
    type: Number,
    required: true,
    min: 0
  },
  comments: {
    type: String,
    default: ''
  },
  criteriaBreakdown: [criteriaBreakdownSchema],
  aiMarks: {
    type: Number,
    default: null
  },
  finalMarks: {
    type: Number,
    default: null
  },
  aiSuggestedMarks: {
    type: Number,
    default: null
  },
  aiFeedback: {
    type: String,
    default: ''
  },
  wasAiAccepted: {
    type: Boolean,
    default: null
  }
});

const evaluationSchema = new mongoose.Schema(
  {
    answerCopy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AnswerCopy',
      required: true
    },
    examination: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Examination',
      required: true
    },
    evaluator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      default: null
    },
    evaluationMode: {
      type: String,
      enum: ['MANUAL', 'DIGITAL', 'AI_ASSISTED', 'AI_CHECKING', 'AI_EVALUATION', 'AI'],
      required: true
    },
    isDraft: {
      type: Boolean,
      default: false
    },
    questionEvaluations: [questionEvaluationSchema],
    aiTotal: {
      type: Number,
      default: null
    },
    finalTotal: {
      type: Number,
      default: null
    },
    totalMarks: {
      type: Number,
      required: true,
      default: 0
    },
    maxPossibleMarks: {
      type: Number,
      required: true,
      default: 0
    },
    percentage: {
      type: Number,
      default: 0
    },
    overallComments: {
      type: String,
      default: ''
    },
    submittedAt: {
      type: Date,
      default: null
    },
    reviewedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Evaluation', evaluationSchema);
