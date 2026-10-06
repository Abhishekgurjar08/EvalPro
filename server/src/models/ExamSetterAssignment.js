const mongoose = require('mongoose');

const examSetterAssignmentSchema = new mongoose.Schema(
  {
    examination: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Examination',
      required: true
    },
    setter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    syllabus: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Syllabus',
      default: null
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'REJECTED'],
      default: 'PENDING'
    },
    rejectionReason: {
      type: String,
      default: ''
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    assignedAt: {
      type: Date,
      default: Date.now
    },
    respondedAt: {
      type: Date
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('ExamSetterAssignment', examSetterAssignmentSchema);
