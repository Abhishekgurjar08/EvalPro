const mongoose = require('mongoose');

const aiEvaluationSchema = new mongoose.Schema(
  {
    answerCopy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AnswerCopy',
      required: true
    },
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true
    },
    studentAnswer: {
      type: String,
      default: ''
    },
    referenceAnswer: {
      type: String,
      default: ''
    },
    maxMarks: {
      type: Number,
      required: true
    },
    rubric: {
      type: Array,
      default: []
    },
    aiSuggestedMarks: {
      type: Number,
      required: true
    },
    criteriaEvaluation: [
      {
        criterion: String,
        marks: Number,
        maxMarks: Number,
        feedback: String
      }
    ],
    overallFeedback: {
      type: String,
      default: ''
    },
    modelUsed: {
      type: String,
      default: 'gemini-1.5-pro'
    },
    evaluatorFinalMarks: {
      type: Number,
      default: null
    },
    evaluatorAction: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'MODIFIED', 'REJECTED'],
      default: 'PENDING'
    },
    evaluatorNotes: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('AIEvaluation', aiEvaluationSchema);
