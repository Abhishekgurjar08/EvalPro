const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema({
  topicNumber: { type: Number, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' }
});

const unitSchema = new mongoose.Schema({
  unitNumber: { type: Number, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  topics: [topicSchema]
});

const syllabusSchema = new mongoose.Schema(
  {
    examination: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Examination',
      required: true
    },
    subject: {
      type: String,
      required: true
    },
    units: [unitSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Syllabus', syllabusSchema);
