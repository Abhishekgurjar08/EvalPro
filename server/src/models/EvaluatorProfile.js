const mongoose = require('mongoose');

const evaluatorProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    employeeId: {
      type: String,
      required: true,
      unique: true
    },
    department: {
      type: String,
      default: 'Computer Science & Engineering'
    },
    subjects: {
      type: [String],
      default: ['Computer Networks']
    },
    maxWorkload: {
      type: Number,
      default: 50
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('EvaluatorProfile', evaluatorProfileSchema);
