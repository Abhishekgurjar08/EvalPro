const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    targetRole: {
      type: String,
      enum: ['ALL', 'ADMIN', 'EXAM_SETTER', 'EVALUATOR'],
      default: 'ALL'
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['INFO', 'SUCCESS', 'WARNING', 'ACTION_REQUIRED'],
      default: 'INFO'
    },
    link: {
      type: String,
      default: ''
    },
    read: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
