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

    const resQuery = answerCopy.student
      ? { examination: exam._id, student: answerCopy.student }
      : { examination: exam._id, answerCopy: answerCopy._id };

    const result = await Result.findOneAndUpdate(
      resQuery,
      {
        examination: exam._id,
        student: answerCopy.student || null,
        answerCopy: answerCopy._id,
        copyId: answerCopy.copyId || '',
        candidateName: answerCopy.candidateName || answerCopy.student?.name || '',
        candidateRollNo: answerCopy.candidateRollNo || answerCopy.student?.studentRollNo || '',
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
    answerCopy.finalTotal = totalMarks;
    answerCopy.totalAwardedMarks = totalMarks;
    answerCopy.totalMaxMarks = maxMarks;
    answerCopy.percentage = percentage;
    answerCopy.evaluatedAt = new Date();
    if (!['FINALIZED', 'REVIEWED'].includes(answerCopy.evaluationStatus)) {
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
