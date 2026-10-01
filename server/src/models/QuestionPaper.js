const mongoose = require('mongoose');

const paperQuestionSchema = new mongoose.Schema({
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  },
  questionNumber: {
    type: Number,
    required: true
  },
  marks: {
    type: Number,
    required: true
  },
  customInstruction: {
    type: String,
    default: ''
  }
});

const approvalHistorySchema = new mongoose.Schema({
  action: {
    type: String,
    enum: ['SUBMITTED', 'APPROVED', 'REJECTED', 'RESUBMITTED'],
    required: true
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  date: {
    type: Date,
    default: Date.now
  },
  comments: {
    type: String,
    default: ''
  }
});

const questionPaperSchema = new mongoose.Schema(
  {
    examination: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Examination',
      required: true
    },
    paperTitle: {
      type: String,
      required: true,
      trim: true
    },
    totalMarks: {
      type: Number,
      required: true
    },
    instructions: {
      type: [String],
      default: [
        'All questions are compulsory.',
        'Write concise, well-structured, point-wise answers.',
        'Use appropriate technical diagrams/examples wherever relevant.'
      ]
    },
    questions: [paperQuestionSchema],
    status: {
      type: String,
      enum: ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'],
      default: 'DRAFT'
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    submittedAt: {
      type: Date
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: {
      type: Date
    },
    rejectionReason: {
      type: String,
      default: ''
    },
    approvalHistory: [approvalHistorySchema]
  },
  { timestamps: true }
);

module.exports = mongoose.model('QuestionPaper', questionPaperSchema);
