const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema(
  {
    examination: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Examination',
      required: true
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    answerCopy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AnswerCopy',
      required: true
    },
    totalMarks: {
      type: Number,
      required: true
    },
    maxMarks: {
      type: Number,
      required: true
    },
    percentage: {
      type: Number,
      required: true
    },
    grade: {
      type: String,
      default: 'A'
    },
    passed: {
      type: Boolean,
      default: true
    },
    published: {
      type: Boolean,
      default: false
    },
    publishedAt: {
      type: Date,
      default: null
    },
    publishedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { timestamps: true }
);

// Unique student per examination result
resultSchema.index({ examination: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('Result', resultSchema);
