const mongoose = require('mongoose');

const examinationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Examination name is required'],
      trim: true
    },
    code: {
      type: String,
      required: [true, 'Examination code is required'],
      unique: true,
      trim: true,
      uppercase: true
    },
    session: {
      type: String,
      required: true,
      default: '2025-2026'
    },
    course: {
      type: String,
      required: true,
      default: 'B.Tech'
    },
    semester: {
      type: Number,
      required: true,
      min: 1,
      max: 12
    },
    subject: {
      type: String,
      required: true,
      trim: true
    },
    examDate: {
      type: Date,
      default: Date.now
    },
    startTime: {
      type: String,
      default: '10:00 AM'
    },
    durationMinutes: {
      type: Number,
      required: true,
      default: 180,
      min: 15
    },
    maxMarks: {
      type: Number,
      required: true,
      default: 100,
      min: 1
    },
    passingMarks: {
      type: Number,
      default: 40
    },
    description: {
      type: String,
      default: ''
    },
    instructions: {
      type: [String],
      default: [
        'Attempt all questions in sequence.',
        'Read each question carefully before answering.',
        'Do not refresh or switch tabs excessively during online test conduct.'
      ]
    },
    status: {
      type: String,
      enum: [
        'DRAFT',
        'SETTER_ASSIGNED',
        'SETTER_ACCEPTED',
        'SETTER_REJECTED',
        'CONTENT_IN_PROGRESS',
        'PAPER_SUBMITTED',
        'PAPER_APPROVED',
        'PAPER_REJECTED',
        'SCHEDULED',
        'LIVE',
        'COMPLETED',
        'SCANNING_IN_PROGRESS',
        'SCANNING_COMPLETED',
        'EVALUATION',
        'RESULT_PUBLISHED'
      ],
      default: 'DRAFT'
    },
    scanningStatus: {
      type: String,
      enum: ['NOT_STARTED', 'SCANNING_IN_PROGRESS', 'SCANNING_COMPLETED'],
      default: 'NOT_STARTED'
    },
    totalExpectedCopies: {
      type: Number,
      default: 0
    },
    evaluationMode: {
      type: String,
      enum: ['MANUAL', 'AI_EVALUATION', 'AI_ASSISTED', 'AI', null],
      default: null
    },
    evaluationModeLocked: {
      type: Boolean,
      default: false
    },
    evaluationModeLockedAt: {
      type: Date,
      default: null
    },
    assignedSetter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    setterAssignmentDate: {
      type: Date
    },
    setterResponseDate: {
      type: Date
    },
    setterRejectionReason: {
      type: String,
      default: ''
    },
    approvedQuestionPaper: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'QuestionPaper',
      default: null
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Examination', examinationSchema);
