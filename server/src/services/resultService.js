const Result = require('../models/Result');
const AnswerCopy = require('../models/AnswerCopy');
const Examination = require('../models/Examination');

const calculateAndSaveResult = async (answerCopyId, evaluation) => {
  try {
    const answerCopy = await AnswerCopy.findById(answerCopyId).populate('examination');
    if (!answerCopy) {
      throw new Error('Answer copy not found for result calculation');
    }

    const exam = answerCopy.examination;
    const totalMarks = evaluation.totalMarks;
    const maxMarks = evaluation.maxPossibleMarks || exam.maxMarks || 100;
    const percentage = Math.round((totalMarks / maxMarks) * 100 * 10) / 10;

    let grade = 'F';
    if (percentage >= 90) grade = 'A+';
    else if (percentage >= 80) grade = 'A';
    else if (percentage >= 70) grade = 'B+';
    else if (percentage >= 60) grade = 'B';
    else if (percentage >= 50) grade = 'C';
    else if (percentage >= 40) grade = 'D';

    const passingMarks = exam.passingMarks || Math.round(maxMarks * 0.4);
    const passed = totalMarks >= passingMarks;

    const result = await Result.findOneAndUpdate(
      { examination: exam._id, student: answerCopy.student },
      {
        examination: exam._id,
        student: answerCopy.student,
        answerCopy: answerCopy._id,
        totalMarks,
        maxMarks,
        percentage,
        grade,
        passed,
        published: false
      },
      { upsert: true, new: true }
    );

    // Update answer copy marks and percentage
    answerCopy.totalAwardedMarks = totalMarks;
    answerCopy.totalMaxMarks = maxMarks;
    answerCopy.percentage = percentage;
    answerCopy.evaluatedAt = new Date();
    if (answerCopy.evaluationStatus !== 'REVIEWED') {
      answerCopy.evaluationStatus = 'COMPLETED';
    }
    await answerCopy.save();

    return result;
  } catch (error) {
    console.error('Result calculation error:', error);
    throw error;
  }
};

module.exports = { calculateAndSaveResult };
