const mongoose = require('mongoose');

const studentAnswerSchema = new mongoose.Schema({
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  },
  questionNumber: {
    type: Number,
    required: true
  },
  maxMarks: {
    type: Number,
    required: true
  },
  studentAnswer: {
    type: String,
    default: ''
  },
  aiMarks: {
    type: Number,
    default: null
  },
  finalMarks: {
    type: Number,
    default: null
  },
  aiFeedback: {
    type: String,
    default: ''
  },
  aiSuggestedMarks: {
    type: Number,
    default: null
  },
  aiAnalysis: {
    type: String,
    default: ''
  },
  isAiApproved: {
    type: Boolean,
    default: false
  },
  marksAwarded: {
    type: Number,
    default: null
  },
  evaluatorRemarks: {
    type: String,
    default: ''
  },
  adminModified: {
    type: Boolean,
    default: false
  },
  adminComment: {
    type: String,
    default: ''
  },
  evaluationStatus: {
    type: String,
    enum: ['PENDING', 'PROCESSING', 'AI_EVALUATED', 'EVALUATED', 'FAILED'],
    default: 'PENDING'
  },
  evaluationError: {
    type: String,
    default: ''
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
});

const answerCopySchema = new mongoose.Schema(
  {
    copyId: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      default: null
    },
    candidateRollNo: {
      type: String,
      default: ''
    },
    candidateName: {
      type: String,
      default: ''
    },
    bookletNumber: {
      type: String,
      default: ''
    },
    scannedDocument: {
      fileName: { type: String, default: '' },
      fileUrl: { type: String, default: '' },
      fileType: { type: String, default: '' },
      fileSize: { type: Number, default: 0 },
      scannedPages: [
        {
          pageNumber: Number,
          pageUrl: String,
          ocrText: String
        }
      ]
    },
    status: {
      type: String,
      enum: [
        'SCANNED',
        'UNASSIGNED',
        'ASSIGNED',
        'MANUAL_ASSIGNED',
        'UNDER_EVALUATION',
        'PROCESSING',
        'AI_PENDING',
        'AI_PROCESSING',
        'AI_EVALUATED',
        'AI_REVIEWED',
        'ADMIN_REVIEW',
        'AI_FAILED',
        'EVALUATION_IN_PROGRESS',
        'ADMIN_REVIEWED',
        'EVALUATED',
        'REVIEWED',
        'FAILED',
        'AI_REVIEW_PENDING',
        'AI_APPROVED',
        'FINALIZED',
        'COMPLETED'
      ],
      default: 'UNASSIGNED'
    },
    scanStatus: {
      type: String,
      enum: ['UPLOADED', 'PROCESSED', 'FAILED'],
      default: 'PROCESSED'
    },
    scannedAt: {
      type: Date,
      default: Date.now
    },
    examination: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Examination',
      required: true
    },
    subject: {
      type: String,
      required: true
    },
    attempt: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExamAttempt'
    },
    answers: [studentAnswerSchema],
    evaluationMode: {
      type: String,
      enum: ['MANUAL', 'AI_EVALUATION', 'AI', 'AI_ASSISTED', 'AI_CHECKING'],
      default: 'MANUAL'
    },
    assignedEvaluator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    assignedAt: {
      type: Date,
      default: null
    },
    evaluationStatus: {
      type: String,
      enum: [
        'SCANNED',
        'PENDING',
        'PROCESSING',
        'AI_PENDING',
        'AI_PROCESSING',
        'AI_EVALUATED',
        'AI_REVIEWED',
        'ADMIN_REVIEW',
        'AI_FAILED',
        'ADMIN_REVIEWED',
        'ASSIGNED',
        'MANUAL_ASSIGNED',
        'UNDER_EVALUATION',
        'IN_PROGRESS',
        'EVALUATED',
        'REVIEWED',
        'FAILED',
        'AI_REVIEW_PENDING',
        'AI_APPROVED',
        'FINALIZED',
        'COMPLETED',
        'REVIEW_REQUIRED'
      ],
      default: 'PENDING'
    },
    aiTotal: {
      type: Number,
      default: null
    },
    finalTotal: {
      type: Number,
      default: null
    },
    totalAwardedMarks: {
      type: Number,
      default: null
    },
    totalMaxMarks: {
      type: Number,
      default: 0
    },
    percentage: {
      type: Number,
      default: null
    },
    evaluatedAt: {
      type: Date,
      default: null
    },
    reviewedAt: {
      type: Date,
      default: null
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    errorMessage: {
      type: String,
      default: ''
    },
    aiEvaluationSummary: {
      suggestedTotalMarks: { type: Number, default: null },
      overallFeedback: { type: String, default: '' },
      isApproved: { type: Boolean, default: false },
      approvedAt: { type: Date, default: null }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('AnswerCopy', answerCopySchema);
