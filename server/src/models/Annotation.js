const mongoose = require('mongoose');

const annotationSchema = new mongoose.Schema(
  {
    answerCopy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AnswerCopy',
      required: true,
      index: true
    },
    answerCopyId: {
      type: String,
      default: ''
    },
    pageNumber: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      default: 1
    },
    evaluator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      default: null
    },
    evaluatorId: {
      type: String,
      default: ''
    },
    type: {
      type: String,
      required: true,
      enum: ['PEN', 'HIGHLIGHT', 'TEXT', 'pen', 'highlight', 'text']
    },
    content: {
      type: String,
      default: ''
    },
    coordinates: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({})
    },
    styling: {
      color: { type: String, default: '#ef4444' },
      strokeWidth: { type: Number, default: 3 },
      opacity: { type: Number, default: 1 },
      fontSize: { type: Number, default: 14 }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Annotation', annotationSchema);
