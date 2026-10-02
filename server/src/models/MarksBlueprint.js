const mongoose = require('mongoose');

const unitDistributionSchema = new mongoose.Schema({
  unit: { type: String, required: true },
  marks: { type: Number, required: true, min: 0 },
  questionsCount: { type: Number, default: 1, min: 0 }
});

const subQuestionSchema = new mongoose.Schema({
  subLabel: { type: String, default: 'A' },
  marks: { type: Number, default: 2, min: 0 },
  description: { type: String, default: '' }
});

const questionConfigSchema = new mongoose.Schema({
  questionNumber: { type: Number, required: true },
  label: { type: String, default: '' },
  marks: { type: Number, required: true, min: 0 },
  unit: { type: String, default: '' },
  subQuestions: [subQuestionSchema]
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
    totalQuestions: {
      type: Number,
      default: 0
    },
    questionPattern: {
      type: String,
      enum: ['SIMPLE', 'SUB_QUESTION', 'ABC', 'MIXED'],
      default: 'SIMPLE'
    },
    numberOfSets: {
      type: Number,
      default: 1,
      min: 1,
      max: 10
    },
    unitDistribution: [unitDistributionSchema],
    questionsConfig: [questionConfigSchema],
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
