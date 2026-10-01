const mongoose = require('mongoose');

const examAttemptSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    examination: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Examination',
      required: true
    },
    questionPaper: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'QuestionPaper',
      required: true
    },
    startedAt: {
      type: Date,
      default: Date.now
    },
    submittedAt: {
      type: Date
    },
    timeRemainingSeconds: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['IN_PROGRESS', 'SUBMITTED', 'TIMED_OUT'],
      default: 'IN_PROGRESS'
    },
    answersDraft: [
      {
        questionId: String,
        questionNumber: Number,
        answerText: String,
        updatedAt: { type: Date, default: Date.now }
      }
    ],
    ipAddress: {
      type: String,
      default: '127.0.0.1'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('ExamAttempt', examAttemptSchema);
