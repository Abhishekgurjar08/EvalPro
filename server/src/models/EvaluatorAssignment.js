const mongoose = require('mongoose');

const evaluatorAssignmentSchema = new mongoose.Schema(
  {
    evaluator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
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
    answerCopies: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AnswerCopy'
      }
    ],
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    assignedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['ASSIGNED', 'IN_PROGRESS', 'COMPLETED'],
      default: 'ASSIGNED'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('EvaluatorAssignment', evaluatorAssignmentSchema);
