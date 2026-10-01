const mongoose = require('mongoose');

const unitDistributionSchema = new mongoose.Schema({
  unit: { type: String, required: true },
  marks: { type: Number, required: true, min: 0 },
  questionsCount: { type: Number, default: 1, min: 0 }
});

const marksBlueprintSchema = new mongoose.Schema(
  {
    examination: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Examination',
      required: true,
      unique: true
    },
    totalMarks: {
      type: Number,
      required: true,
      min: 1
    },
    unitDistribution: [unitDistributionSchema],
    difficultyDistribution: {
      easy: { type: Number, default: 30 },
      medium: { type: Number, default: 50 },
      hard: { type: Number, default: 20 }
    },
    questionTypeDistribution: {
      mcq: { type: Number, default: 0 },
      shortAnswer: { type: Number, default: 20 },
      longAnswer: { type: Number, default: 40 },
      descriptive: { type: Number, default: 40 }
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('MarksBlueprint', marksBlueprintSchema);
