require('dotenv').config();
const mongoose = require('mongoose');
const Examination = require('../src/models/Examination');
const AnswerCopy = require('../src/models/AnswerCopy');
require('../src/models/Question');
const QuestionPaper = require('../src/models/QuestionPaper');

const studentNames = [
  'Aarav Sharma', 'Priya Patel', 'Rohan Gupta', 'Ananya Iyer', 'Vikram Singh',
  'Sneha Reddy', 'Aditya Joshi', 'Kavita Nair', 'Rahul Verma', 'Pooja Bhatia',
  'Siddharth Malhotra', 'Ishita Sen', 'Amitabh Roy', 'Neha Choudhury', 'Karan Mehra',
  'Deepika Pillai', 'Manoj Kumar', 'Sunita Deshmukh', 'Rajesh Rao', 'Divya Menon',
  'Varun Aggarwal', 'Tanvi Kapoor', 'Arjun Saxena', 'Ritu Saxena', 'Kunal Mukherjee',
  'Swati Bose', 'Naveen Mishra', 'Preeti Tiwari', 'Suresh Pandey', 'Meera Nambiar',
  'Devendra Soni', 'Shreya Singhania', 'Gaurav Chawla', 'Bhavna Kulkarni', 'Harish Rawat',
  'Simran Kaur', 'Kartik Awasthi', 'Rashmi Goyal', 'Nitin Sethi', 'Pallavi Sen',
  'Yashvardhan Rathore', 'Anjali Trivedi', 'Mohit Bansal', 'Megha Jain', 'Pranav Hegde',
  'Ritika Chauhan', 'Abhishek Lodhi', 'Deepak Yadav', 'Tarun Mittal', 'Jyoti Sharma'
];

const answerVariations = [
  // High quality
  [
    'Software Architecture design principles establish high-level structural constraints. Introduction and Protocols ensure standardized communication across distributed nodes through TCP/IP and HTTP REST APIs, enforcing clear interface boundaries and state management.',
    'Layered abstraction decouples concerns across UI, business logic, domain services, and database persistence. It facilitates maintainability and unit testing, though it incurs minor latency overhead during sequential layer traversal.',
    'Standard architectural patterns like Model-View-Controller (MVC) and Microservices contrast in deployment coupling. MVC is simpler for monolithic cohesion whereas Microservices maximize autonomous team deployment and resilience.',
    'Structural components include architectural connectors, filters, service registries, and message queues. The workflow routes client requests through an API Gateway to dedicated service nodes.',
    'Scalability is achieved via stateless horizontal pod auto-scaling and event-driven asynchronous messaging (Kafka/RabbitMQ). Circuit breakers guarantee fault isolation.',
    'Implementation challenges center on distributed transactions and eventual consistency (CAP theorem). We mitigate these via Sagas and outbox patterns.',
    'Reference models and formal protocols establish standardized behavioral contracts, enabling robust subsystem decoupling, automated auditing, and zero-trust security policies.'
  ],
  // Medium quality
  [
    'The principles define how modules communicate. Protocols like HTTP and WebSockets allow data exchange between clients and servers in software architecture.',
    'Layered abstraction divides code into layers like presentation, logic, and data. It helps in organized development and reduces direct dependency between database and UI.',
    'Different patterns like Client-Server and Monolith have different trade-offs. Client-server is easier to scale the web tier, but network latency must be monitored.',
    'Components are the building blocks like database controllers and routers. Requests pass from client through routers to database queries.',
    'Scalability is handled by adding more server instances behind load balancers. Fault tolerance is supported through database replicas and retries.',
    'Challenges include handling database deadlocks and network timeouts. We use connection pools and timeout settings to mitigate.',
    'Reference models provide guidelines for building enterprise systems. They improve modularity by defining clear roles for each system component.'
  ],
  // Developing quality
  [
    'Architecture principles are rules for writing software. Protocols are rules for data transfer between computer networks.',
    'Layered architecture means writing presentation, business and database code separately so that one change does not break everything.',
    'Client server architecture has client and server. Microservices have many small services connected together using APIs.',
    'Components in software are classes, functions, and database tables. Workflow is the flow of execution from main to functions.',
    'We can scale the system by increasing RAM and CPU. For fault tolerance we keep backup servers.',
    'The main challenges are software bugs and slow response times. Testing and debugging are needed to fix them.',
    'Reference models help programmers understand the architecture structure and make code easy to read and maintain.'
  ]
];

async function seed50SoftwareArchitectureCopies() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/exam_eval_system';
  console.log(`Connecting to MongoDB at ${uri}...`);
  await mongoose.connect(uri);
  console.log('✓ Connected to MongoDB');

  // Find Software Architecture Examination
  let exam = await Examination.findOne({
    $or: [
      { _id: '6abdf4aacad9c5fb9a314739' },
      { subject: /Software Architecture/i }
    ]
  });

  if (!exam) {
    console.error('❌ Software Architecture examination not found!');
    process.exit(1);
  }

  console.log(`Found Target Examination: "${exam.name}" (${exam.code}) - ID: ${exam._id}`);

  // Fetch approved question paper
  const qp = await QuestionPaper.findOne({ examination: exam._id, status: 'APPROVED' }).populate('questions.question');
  if (!qp || !qp.questions || qp.questions.length === 0) {
    console.error('❌ Approved Question Paper not found for Software Architecture exam!');
    process.exit(1);
  }

  console.log(`Found Question Paper with ${qp.questions.length} questions. Total Marks: ${exam.maxMarks}`);

  // Update Examination status to SCANNING_COMPLETED so copies are ready for evaluation
  exam.status = 'COMPLETED';
  exam.scanningStatus = 'SCANNING_COMPLETED';
  exam.totalExpectedCopies = 50;
  exam.evaluationMode = null; // Unlocked so Admin can choose AI Evaluation or Manual Evaluation
  exam.evaluationModeLocked = false;
  await exam.save();
  console.log('✓ Examination status updated to COMPLETED / SCANNING_COMPLETED');

  // Remove existing answer copies for this exam to ensure exactly 50 clean copies
  const deleted = await AnswerCopy.deleteMany({ examination: exam._id });
  console.log(`Removed ${deleted.deletedCount} existing copies for this examination.`);

  console.log('Generating exactly 50 Scanned Answer Copies for Software Architecture...');

  const copies = [];
  const samplePages = [
    'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800',
    'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=800',
    'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800',
    'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800'
  ];

  for (let i = 1; i <= 50; i++) {
    const padNum = String(i).padStart(3, '0');
    const rollNo = `0801CS221${padNum}`;
    const copyId = `SA-COPY-${padNum}`;
    const bookletNumber = `BK-SA-701-${padNum}`;
    const candidateName = studentNames[i - 1];
    const answerProfile = answerVariations[(i - 1) % answerVariations.length];

    // Build question answers from question paper
    const studentAnswers = qp.questions.map((qItem, qIdx) => {
      const qObj = qItem.question;
      const ansText = answerProfile[qIdx % answerProfile.length] ||
        `Descriptive answer by student for question ${qItem.questionNumber} regarding ${qObj?.topic || 'Software Architecture'}.`;

      return {
        question: qObj?._id || qItem.question,
        questionNumber: qItem.questionNumber || qIdx + 1,
        maxMarks: qItem.marks || qObj?.marks || 10,
        studentAnswer: ansText,
        aiMarks: null,
        finalMarks: null,
        aiFeedback: '',
        marksAwarded: null,
        adminModified: false,
        adminComment: '',
        evaluationStatus: 'PENDING'
      };
    });

    copies.push({
      copyId,
      candidateRollNo: rollNo,
      candidateName,
      bookletNumber,
      scannedDocument: {
        fileName: `scanned_software_architecture_${padNum}.pdf`,
        fileUrl: samplePages[i % samplePages.length],
        fileType: 'application/pdf',
        fileSize: 2200000 + (i * 1250),
        scannedPages: [
          { pageNumber: 1, pageUrl: samplePages[0], ocrText: studentAnswers[0]?.studentAnswer },
          { pageNumber: 2, pageUrl: samplePages[1], ocrText: studentAnswers[1]?.studentAnswer },
          { pageNumber: 3, pageUrl: samplePages[2], ocrText: studentAnswers[2]?.studentAnswer },
          { pageNumber: 4, pageUrl: samplePages[3], ocrText: studentAnswers[3]?.studentAnswer }
        ]
      },
      status: 'UNASSIGNED',
      scanStatus: 'PROCESSED',
      scannedAt: new Date(Date.now() - (50 - i) * 120000), // staggered timestamps
      examination: exam._id,
      subject: exam.subject,
      answers: studentAnswers,
      totalMaxMarks: exam.maxMarks || 70,
      evaluationStatus: 'PENDING',
      evaluationMode: 'MANUAL',
      assignedEvaluator: null,
      assignedAt: null
    });
  }

  await AnswerCopy.insertMany(copies);

  const finalCount = await AnswerCopy.countDocuments({ examination: exam._id });

  console.log('\n=============================================================');
  console.log(`✓ SUCCESSFULLY SEEDED EXACTLY 50 SCANNED COPIES FOR SOFTWARE ARCHITECTURE!`);
  console.log(`Examination: "${exam.name}" (${exam.code})`);
  console.log(`Subject:     ${exam.subject}`);
  console.log(`Exam ID:     ${exam._id}`);
  console.log(`Total Copies: ${finalCount}`);
  console.log(`Copy IDs:    SA-COPY-001 -> SA-COPY-050`);
  console.log(`Roll Nos:    0801CS221001 -> 0801CS221050`);
  console.log(`Status:      UNASSIGNED (Ready for AI Evaluation or Manual Evaluation)`);
  console.log(`Scanned Copies URL: http://localhost:5173/admin/examinations/${exam._id}/scanned-copies`);
  console.log('=============================================================\n');

  await mongoose.disconnect();
}

seed50SoftwareArchitectureCopies().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
