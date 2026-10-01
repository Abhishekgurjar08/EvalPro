const mongoose = require('mongoose');

const rubricCriterionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Criterion name is required'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  maxMarks: {
    type: Number,
    required: [true, 'Max marks for criterion is required'],
    min: 0.5
  },
  keywords: {
    type: [String],
    default: []
  }
});

const questionRubricSchema = new mongoose.Schema(
  {
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true
    },
    maxMarks: {
      type: Number,
      required: true
    },
    criteria: {
      type: [rubricCriterionSchema],
      validate: {
        validator: function (criteriaList) {
          if (!criteriaList || criteriaList.length === 0) return true;
          const sum = criteriaList.reduce((acc, curr) => acc + (Number(curr.maxMarks) || 0), 0);
          return sum <= this.maxMarks;
        },
        message: 'Sum of rubric criteria marks cannot exceed the question maximum marks'
      }
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('QuestionRubric', questionRubricSchema);
