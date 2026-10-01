require('dotenv').config();
const mongoose = require('mongoose');
const Examination = require('./src/models/Examination');
const AnswerCopy = require('./src/models/AnswerCopy');
const Question = require('./src/models/Question');
const QuestionPaper = require('./src/models/QuestionPaper');
const User = require('./src/models/User');

const sampleStudentNames = [
  'Aarav Sharma', 'Priya Patel', 'Rohan Gupta', 'Ananya Iyer', 'Vikram Singh',
  'Sneha Reddy', 'Aditya Joshi', 'Kavita Nair', 'Rahul Verma', 'Pooja Bhatia',
  'Siddharth Malhotra', 'Ishita Sen', 'Amitabh Roy', 'Neha Choudhury', 'Karan Mehra',
  'Deepika Pillai', 'Manoj Kumar', 'Sunita Deshmukh', 'Rajesh Rao', 'Divya Menon',
  'Varun Aggarwal', 'Tanvi Kapoor', 'Arjun Saxena', 'Ritu Saxena', 'Kunal Mukherjee',
  'Swati Bose', 'Naveen Mishra', 'Preeti Tiwari', 'Suresh Pandey', 'Meera Nambiar'
];

async function seed100Copies() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/exam_eval_system';
  console.log(`Connecting to MongoDB at ${uri}...`);
  await mongoose.connect(uri);
  console.log('✓ Connected to MongoDB');

  // Find or pick a target examination
  let exam = await Examination.findOne({ code: 'OS-EXAM-2026' });

  if (!exam) {
    // Look for any existing examination
    exam = await Examination.findOne().sort({ createdAt: -1 });
  }

  // If still no exam exists, create a dedicated one for the demo
  if (!exam) {
    const adminUser = await User.findOne({ role: 'ADMIN' });
    exam = await Examination.create({
      name: 'Operating System Examination',
      code: 'OS-EXAM-2026',
      subject: 'Operating Systems',
      course: 'B.Tech',
      semester: 6,
      session: '2025-2026',
      durationMinutes: 180,
      maxMarks: 100,
      passingMarks: 40,
      status: 'COMPLETED',
      scanningStatus: 'SCANNING_COMPLETED',
      totalExpectedCopies: 100,
      evaluationMode: null,
      evaluationModeLocked: false,
      createdBy: adminUser?._id
    });
    console.log(`Created new examination: ${exam.name} (${exam.code})`);
  } else {
    // Ensure examination is in COMPLETED and SCANNING_COMPLETED state
    exam.status = 'COMPLETED';
    exam.scanningStatus = 'SCANNING_COMPLETED';
    exam.totalExpectedCopies = 100;
    await exam.save();
    console.log(`Using existing examination: "${exam.name}" (${exam.code}, ID: ${exam._id})`);
  }

  // Resolve questions for the answer copies
  let questions = [];
  const qp = await QuestionPaper.findOne({ examination: exam._id, status: 'APPROVED' }).populate('questions.question');
  if (qp?.questions?.length > 0) {
    questions = qp.questions.map((q, idx) => ({
      question: q.question?._id || q.question,
      questionNumber: q.questionNumber || idx + 1,
      maxMarks: q.marks || q.question?.marks || 10,
      studentAnswer: 'Candidate descriptive answer transcribed from scanned physical answer booklet.'
    }));
  }

  if (questions.length === 0) {
    const fallbackQ = await Question.find({ subject: exam.subject }).limit(5);
    if (fallbackQ.length > 0) {
      questions = fallbackQ.map((fq, idx) => ({
        question: fq._id,
        questionNumber: idx + 1,
        maxMarks: fq.marks || 10,
        studentAnswer: 'Candidate descriptive answer transcribed from scanned physical answer booklet.'
      }));
    } else {
      // Create minimal demo question so answers schema validates
      const newQ = await Question.create({
        questionText: 'Explain process state transition diagrams and CPU scheduling algorithms.',
        subject: exam.subject,
        unit: 1,
        topic: 'Process Management',
        marks: 20,
        expectedAnswer: 'Process transitions between New, Ready, Running, Waiting, and Terminated states with scheduling dispatch.'
      });
      questions = [{
        question: newQ._id,
        questionNumber: 1,
        maxMarks: 20,
        studentAnswer: 'Process transitions between states based on OS kernel dispatch and interrupt handlers.'
      }];
    }
  }

  // Remove existing answer copies for this examination to guarantee exactly 100 clean copies
  const deleteRes = await AnswerCopy.deleteMany({ examination: exam._id });
  console.log(`Cleared ${deleteRes.deletedCount} existing copies for exam ${exam.name}`);

  console.log('Generating exactly 100 Scanned Answer Copies (COPY-001 to COPY-100)...');

  const copiesToInsert = [];
  for (let i = 1; i <= 100; i++) {
    const padNum = String(i).padStart(3, '0');
    const padTwo = String(i).padStart(2, '0');
    const copyId = `COPY-${padNum}`;
    const candidateId = `CAND-${padNum}`;
    const bookletNumber = `BK-${padNum}`;
    const candidateName = sampleStudentNames[(i - 1) % sampleStudentNames.length] + (i > 30 ? ` (${i})` : '');
    const fileName = `scanned-answer-${padTwo}.pdf`;

    copiesToInsert.push({
      copyId,
      candidateRollNo: candidateId,
      candidateName,
      bookletNumber,
      scannedDocument: {
        fileName,
        fileUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800',
        fileType: 'application/pdf',
        fileSize: 2150000 + (i * 1024),
        scannedPages: [
          { pageNumber: 1, fileUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800' },
          { pageNumber: 2, fileUrl: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=800' }
        ]
      },
      status: 'UNASSIGNED',
      scanStatus: 'PROCESSED',
      scannedAt: new Date(Date.now() - (100 - i) * 60000), // staggered scanning timestamps
      examination: exam._id,
      subject: exam.subject,
      answers: questions,
      totalMaxMarks: exam.maxMarks || 100,
      evaluationStatus: 'PENDING',
      evaluationMode: exam.evaluationMode || 'MANUAL',
      assignedEvaluator: null,
      assignedAt: null
    });
  }

  await AnswerCopy.insertMany(copiesToInsert);

  const finalCount = await AnswerCopy.countDocuments({ examination: exam._id });

  console.log('\n=============================================================');
  console.log(`SUCCESSFULLY SEEDED EXACTLY 100 SCANNED COPIES!`);
  console.log(`Examination: "${exam.name}" (${exam.code})`);
  console.log(`Examination ID: ${exam._id}`);
  console.log(`Total Scanned Copies in DB: ${finalCount}`);
  console.log(`Copy Number Range: COPY-001 -> COPY-100`);
  console.log(`Candidate Range:   CAND-001 -> CAND-100`);
  console.log(`File Names:        scanned-answer-01.pdf -> scanned-answer-100.pdf`);
  console.log(`Status of All:     UNASSIGNED (Ready for manual Admin assignment)`);
  console.log(`Scanned Copies URL: http://localhost:5173/admin/examinations/${exam._id}/scanned-copies`);
  console.log('=============================================================\n');

  await mongoose.disconnect();
}

seed100Copies().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
