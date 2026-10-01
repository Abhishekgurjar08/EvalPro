require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Examination = require('../models/Examination');
const ExamSetterAssignment = require('../models/ExamSetterAssignment');
const EvaluatorProfile = require('../models/EvaluatorProfile');
const EvaluatorAssignment = require('../models/EvaluatorAssignment');
const Syllabus = require('../models/Syllabus');
const Question = require('../models/Question');
const QuestionRubric = require('../models/QuestionRubric');
const MarksBlueprint = require('../models/MarksBlueprint');
const QuestionPaper = require('../models/QuestionPaper');
const ExamAttempt = require('../models/ExamAttempt');
const AnswerCopy = require('../models/AnswerCopy');
const Evaluation = require('../models/Evaluation');
const AIEvaluation = require('../models/AIEvaluation');
const Result = require('../models/Result');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/exam_eval_system';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for database seeding...');

    // Clear existing records
    await Promise.all([
      User.deleteMany({}),
      Examination.deleteMany({}),
      ExamSetterAssignment.deleteMany({}),
      EvaluatorProfile.deleteMany({}),
      EvaluatorAssignment.deleteMany({}),
      Syllabus.deleteMany({}),
      Question.deleteMany({}),
      QuestionRubric.deleteMany({}),
      MarksBlueprint.deleteMany({}),
      QuestionPaper.deleteMany({}),
      ExamAttempt.deleteMany({}),
      AnswerCopy.deleteMany({}),
      Evaluation.deleteMany({}),
      AIEvaluation.deleteMany({}),
      Result.deleteMany({}),
      AuditLog.deleteMany({}),
      Notification.deleteMany({})
    ]);

    console.log('Cleared existing collections.');

    // 1. Create Core Users
    const admin = await User.create({
      name: 'System Administrator',
      email: 'admin@example.com',
      password: 'Admin@123',
      role: 'ADMIN',
      department: 'Examination Control Division',
      employeeId: 'ADM-001'
    });

    const setter = await User.create({
      name: 'Prof. Alan Turing',
      email: 'setter@example.com',
      password: 'Setter@123',
      role: 'EXAM_SETTER',
      department: 'Department of Computer Science',
      employeeId: 'FAC-SET-101'
    });

    const evaluator = await User.create({
      name: 'Dr. Rahul Sharma',
      email: 'evaluator@example.com',
      password: 'Evaluator@123',
      role: 'EVALUATOR',
      department: 'Department of Computer Science',
      employeeId: 'FAC-EVAL-202'
    });

    const evaluator2 = await User.create({
      name: 'Dr. Priya Patel',
      email: 'priya@example.com',
      password: 'Evaluator@123',
      role: 'EVALUATOR',
      department: 'Department of Information Technology',
      employeeId: 'FAC-EVAL-203'
    });

    const student1 = await User.create({
      name: 'Aarav Gupta',
      email: 'student@example.com',
      password: 'Student@123',
      role: 'EVALUATOR',
      department: 'Computer Science & Engineering',
      employeeId: 'CS2023-042'
    });

    const student2 = await User.create({
      name: 'Rohan Mehra',
      email: 'rohan@example.com',
      password: 'Student@123',
      role: 'EVALUATOR',
      department: 'Computer Science & Engineering',
      employeeId: 'CS2023-089'
    });

    console.log('Seeded Users: Admin, Setter, Evaluators.');

    // 2. Evaluator Profiles
    const evalProfile = await EvaluatorProfile.create({
      user: evaluator._id,
      name: evaluator.name,
      email: evaluator.email,
      employeeId: evaluator.employeeId,
      department: evaluator.department,
      subjects: ['Computer Networks', 'Operating Systems', 'Cloud Computing'],
      maxWorkload: 50,
      status: 'ACTIVE'
    });

    await EvaluatorProfile.create({
      user: evaluator2._id,
      name: evaluator2.name,
      email: evaluator2.email,
      employeeId: evaluator2.employeeId,
      department: evaluator2.department,
      subjects: ['Computer Networks', 'Database Management'],
      maxWorkload: 40,
      status: 'ACTIVE'
    });

    // 3. Create Examination
    const examination = await Examination.create({
      name: 'B.Tech Semester VI Final Examination',
      code: 'CS-CN-601',
      session: '2025-2026',
      course: 'B.Tech',
      semester: 6,
      subject: 'Computer Networks',
      examDate: new Date(),
      startTime: '10:00 AM',
      durationMinutes: 120,
      maxMarks: 50,
      passingMarks: 20,
      description: 'Comprehensive evaluation covering OSI Architecture, IP Subnetting, TCP/UDP transport protocols, and routing algorithms.',
      instructions: [
        'Attempt all 5 questions. Each question carries 10 marks.',
        'Draw clear architectural and timing diagrams wherever requested.',
        'Use appropriate technical terminology and provide structured answers.'
      ],
      status: 'EVALUATION',
      evaluationMode: 'AI_ASSISTED',
      assignedSetter: setter._id,
      setterAssignmentDate: new Date(Date.now() - 7 * 86400000),
      setterResponseDate: new Date(Date.now() - 6 * 86400000),
      createdBy: admin._id
    });

    // Exam Setter Assignment Record
    await ExamSetterAssignment.create({
      examination: examination._id,
      setter: setter._id,
      status: 'ACCEPTED',
      assignedBy: admin._id,
      assignedAt: new Date(Date.now() - 7 * 86400000),
      respondedAt: new Date(Date.now() - 6 * 86400000)
    });

    // 4. Syllabus
    await Syllabus.create({
      examination: examination._id,
      subject: 'Computer Networks',
      units: [
        {
          unitNumber: 1,
          title: 'Physical & Data Link Layers',
          description: 'Network topologies, transmission media, framing, error and flow control.',
          topics: [
            { topicNumber: 1, title: 'Framing & HDLC', description: 'Bit/Byte stuffing and protocol mechanisms' },
            { topicNumber: 2, title: 'Error Detection & Correction', description: 'CRC, Parity, Hamming Code' }
          ]
        },
        {
          unitNumber: 2,
          title: 'Network Layer & Routing',
          description: 'IP addressing, subnetting, CIDR, and interior/exterior routing protocols.',
          topics: [
            { topicNumber: 1, title: 'IPv4 Addressing & CIDR', description: 'Classless addressing and subnet mask calculations' },
            { topicNumber: 2, title: 'Distance Vector & Link State', description: 'Bellman-Ford, Dijkstra, OSPF, and BGP' }
          ]
        },
        {
          unitNumber: 3,
          title: 'Transport Layer Protocols',
          description: 'End-to-end transport, port numbers, TCP state machine, UDP.',
          topics: [
            { topicNumber: 1, title: 'TCP vs UDP', description: 'Connection-oriented vs connectionless design' },
            { topicNumber: 2, title: 'TCP Three-Way Handshake', description: 'Connection establishment, termination, sequence sync' }
          ]
        },
        {
          unitNumber: 4,
          title: 'Application Layer & Network Architecture',
          description: 'OSI Reference Model, TCP/IP Suite, DNS, HTTP, HTTPS.',
          topics: [
            { topicNumber: 1, title: 'OSI Reference Model', description: '7-Layer abstraction, encapsulation, and protocol services' },
            { topicNumber: 2, title: 'Application Protocols', description: 'DNS resolution, HTTP request-response pipeline' }
          ]
        }
      ],
      createdBy: setter._id
    });

    // 5. Questions with Rubrics
    // Q1: OSI Model
    const q1 = await Question.create({
      subject: 'Computer Networks',
      examination: examination._id,
      unit: 'Unit 4',
      topic: 'OSI Reference Model',
      questionText: 'Explain the OSI Reference Model with all 7 layers, their primary functions, and data units.',
      questionType: 'DESCRIPTIVE',
      marks: 10,
      difficulty: 'MEDIUM',
      expectedAnswer: 'The Open Systems Interconnection (OSI) model is a conceptual 7-layer framework developed by ISO for network communication. The seven layers in order from bottom to top are: 1. Physical Layer (Bits, electrical signals, cable standards), 2. Data Link Layer (Frames, MAC addressing, error detection via CRC, switch operations), 3. Network Layer (Packets, logical IP addressing, routing across subnets), 4. Transport Layer (Segments, end-to-end reliability, TCP/UDP, flow and congestion control), 5. Session Layer (Dialog control, session establishment and checkpoints), 6. Presentation Layer (Data formatting, encryption/decryption, SSL/TLS, compression), 7. Application Layer (User interface, HTTP, FTP, SMTP, DNS). In conclusion, encapsulation adds layer-specific headers as data traverses downward and de-encapsulation strips them on reception.',
      explanation: 'Covers layered abstraction, protocols, PDU at each layer.',
      createdBy: setter._id
    });

    const r1 = await QuestionRubric.create({
      question: q1._id,
      maxMarks: 10,
      criteria: [
        {
          name: 'Introduction & Overview',
          description: 'Definition of OSI, ISO standards, and the concept of layered modular architecture.',
          maxMarks: 1,
          keywords: ['ISO', 'conceptual framework', 'layered architecture', 'encapsulation']
        },
        {
          name: 'Seven Layers Identification',
          description: 'Accurate naming and hierarchical sequence of all 7 layers (Physical to Application).',
          maxMarks: 5,
          keywords: ['Physical', 'Data Link', 'Network', 'Transport', 'Session', 'Presentation', 'Application']
        },
        {
          name: 'Functions & Data Units (PDUs)',
          description: 'Clear description of key responsibilities and PDUs (bits, frames, packets, segments).',
          maxMarks: 2,
          keywords: ['MAC addressing', 'IP routing', 'end-to-end', 'PDU', 'packets', 'frames', 'segments']
        },
        {
          name: 'Real-world Examples & Protocols',
          description: 'Protocols mapped to corresponding layers (e.g. Ethernet, IP, TCP/UDP, HTTP).',
          maxMarks: 1,
          keywords: ['Ethernet', 'IP', 'TCP', 'HTTP']
        },
        {
          name: 'Conclusion & Clarity',
          description: 'Summary of encapsulation/de-encapsulation process and overall structure.',
          maxMarks: 1,
          keywords: ['encapsulation', 'headers', 'traversal']
        }
      ],
      createdBy: setter._id
    });
    q1.rubric = r1._id;
    await q1.save();

    // Q2: TCP vs UDP
    const q2 = await Question.create({
      subject: 'Computer Networks',
      examination: examination._id,
      unit: 'Unit 3',
      topic: 'TCP vs UDP',
      questionText: 'Differentiate between TCP and UDP protocols in detail. Provide real-world application examples where each protocol is preferred.',
      questionType: 'DESCRIPTIVE',
      marks: 10,
      difficulty: 'MEDIUM',
      expectedAnswer: 'TCP (Transmission Control Protocol) is a connection-oriented, reliable, byte-stream protocol that provides flow control (sliding window), congestion control, and ordered packet delivery via positive ACKs and retransmissions. UDP (User Datagram Protocol) is connectionless, lightweight, and unreliable without acknowledgments or packet ordering, resulting in minimal overhead and low latency. TCP is preferred where accuracy and integrity are critical: web browsing (HTTP/HTTPS), file transfer (FTP), and email (SMTP). UDP is preferred for real-time services where slight packet loss is tolerable over latency delays: video streaming (VoIP, Zoom), online gaming, and DNS lookups.',
      explanation: 'Examines reliability, connection state, overhead, and practical use cases.',
      createdBy: setter._id
    });

    const r2 = await QuestionRubric.create({
      question: q2._id,
      maxMarks: 10,
      criteria: [
        {
          name: 'Core Architectural Differences',
          description: 'Connection-oriented vs connectionless, header size (20-60 bytes vs 8 bytes).',
          maxMarks: 4,
          keywords: ['connection-oriented', 'connectionless', 'header', 'overhead', 'byte-stream', 'datagram']
        },
        {
          name: 'Reliability & Order Mechanism',
          description: 'Acknowledgements, sequence numbers, retransmission, and packet ordering.',
          maxMarks: 3,
          keywords: ['acknowledgment', 'ACK', 'sequence numbers', 'retransmission', 'ordered delivery']
        },
        {
          name: 'Flow & Congestion Control',
          description: 'Sliding window mechanism, slow start, congestion window.',
          maxMarks: 2,
          keywords: ['sliding window', 'flow control', 'congestion control', 'throughput']
        },
        {
          name: 'Real-world Protocol Examples',
          description: 'Specific application protocol examples for both TCP (HTTP, FTP) and UDP (VoIP, DNS).',
          maxMarks: 1,
          keywords: ['HTTP', 'FTP', 'DNS', 'VoIP', 'streaming', 'gaming']
        }
      ],
      createdBy: setter._id
    });
    q2.rubric = r2._id;
    await q2.save();

    // Q3: CIDR Subnetting
    const q3 = await Question.create({
      subject: 'Computer Networks',
      examination: examination._id,
      unit: 'Unit 2',
      topic: 'IPv4 Addressing & CIDR',
      questionText: 'Explain Classless Inter-Domain Routing (CIDR) and subnetting. Solve: For IP block 192.168.10.0/24, create 4 equal subnets and find subnet mask, network ID, and usable host range for each.',
      questionType: 'DESCRIPTIVE',
      marks: 10,
      difficulty: 'HARD',
      expectedAnswer: 'CIDR eliminates rigid Class A, B, and C address boundaries by using variable-length subnet masking (VLSM) denoted with /slash notation. To create 4 equal subnets from 192.168.10.0/24, we need 2 additional bits (2^2 = 4). New prefix length is /26 (Subnet mask: 255.255.255.192). Block size is 256 / 4 = 64 addresses per subnet. Subnet 1: NetID 192.168.10.0/26, Usable Hosts 192.168.10.1 - 192.168.10.62, Broadcast 192.168.10.63. Subnet 2: NetID 192.168.10.64/26, Usable Hosts 192.168.10.65 - 192.168.10.126, Broadcast 192.168.10.127. Subnet 3: NetID 192.168.10.128/26, Usable Hosts 192.168.10.129 - 192.168.10.190, Broadcast 192.168.10.191. Subnet 4: NetID 192.168.10.192/26, Usable Hosts 192.168.10.193 - 192.168.10.254, Broadcast 192.168.10.255.',
      explanation: 'Numerical subnet calculation with boundary host validation.',
      createdBy: setter._id
    });

    const r3 = await QuestionRubric.create({
      question: q3._id,
      maxMarks: 10,
      criteria: [
        {
          name: 'CIDR Concept & VLSM Definition',
          description: 'Explanation of classless addressing, address exhaustion mitigation, and prefix notation.',
          maxMarks: 3,
          keywords: ['CIDR', 'classless', 'prefix', 'VLSM', 'subnet mask']
        },
        {
          name: 'Subnet Mask Calculation',
          description: 'Correct derivation of borrowed bits (/26) and new subnet mask 255.255.255.192.',
          maxMarks: 3,
          keywords: ['255.255.255.192', '/26', 'borrowed bits', 'block size 64']
        },
        {
          name: 'Four Subnet Ranges & Host Allocation',
          description: 'Network IDs, first/last usable host addresses, and broadcast IPs for all 4 subnets.',
          maxMarks: 4,
          keywords: ['192.168.10.0', '192.168.10.64', '192.168.10.128', '192.168.10.192', 'broadcast', 'usable hosts']
        }
      ],
      createdBy: setter._id
    });
    q3.rubric = r3._id;
    await q3.save();

    // Q4: Distance Vector Routing
    const q4 = await Question.create({
      subject: 'Computer Networks',
      examination: examination._id,
      unit: 'Unit 2',
      topic: 'Routing Algorithms',
      questionText: 'Explain the working principle of Distance Vector Routing algorithm. Discuss the Count-to-Infinity problem and techniques to mitigate it.',
      questionType: 'DESCRIPTIVE',
      marks: 10,
      difficulty: 'HARD',
      expectedAnswer: 'Distance Vector Routing operates on the Bellman-Ford algorithm where each router periodically distributes its routing table vector (destination, cost, next-hop) to directly connected neighbors. The Count-to-Infinity problem occurs when a link breaks; neighbors exchange obsolete circular updates leading to slow convergence and metric increments approaching infinity (16 in RIP). Solutions include: 1. Defining a maximum hop limit (e.g. 15 hops in RIP), 2. Split Horizon (a router never advertises a route back out the interface it learned it from), 3. Poison Reverse (explicitly advertising broken routes with infinity metric), and 4. Holddown Timers.',
      explanation: 'Bellman-Ford vector updates and routing loop prevention.',
      createdBy: setter._id
    });

    const r4 = await QuestionRubric.create({
      question: q4._id,
      maxMarks: 10,
      criteria: [
        {
          name: 'Algorithm Operation & Bellman-Ford',
          description: 'Periodic vector exchange, distance estimation, and local routing table update formula.',
          maxMarks: 4,
          keywords: ['Bellman-Ford', 'vector', 'cost', 'next-hop', 'neighbor', 'periodic']
        },
        {
          name: 'Count-to-Infinity Problem Analysis',
          description: 'Cause of routing loops, slow convergence, and propagation of false paths.',
          maxMarks: 3,
          keywords: ['routing loop', 'slow convergence', 'infinity', 'broken link', 'metric']
        },
        {
          name: 'Mitigation Techniques',
          description: 'Split Horizon, Poison Reverse, Maximum Hop Limit, and Holddown timers.',
          maxMarks: 3,
          keywords: ['Split Horizon', 'Poison Reverse', 'Holddown timer', 'hop count limit']
        }
      ],
      createdBy: setter._id
    });
    q4.rubric = r4._id;
    await q4.save();

    // Q5: TCP 3-Way Handshake
    const q5 = await Question.create({
      subject: 'Computer Networks',
      examination: examination._id,
      unit: 'Unit 3',
      topic: 'TCP Three-Way Handshake',
      questionText: 'Explain the TCP Three-Way Handshake for connection establishment and Four-Way Wave for connection termination. State the significance of sequence numbers and flags.',
      questionType: 'DESCRIPTIVE',
      marks: 10,
      difficulty: 'MEDIUM',
      expectedAnswer: 'TCP connection establishment uses a 3-way handshake: Step 1: Client sends SYN packet with Initial Sequence Number (ISN_c). Step 2: Server responds with SYN-ACK packet containing its own ISN_s and ACK = ISN_c + 1. Step 3: Client replies with ACK packet (ACK = ISN_s + 1). Connection termination utilizes a 4-way handshake (FIN, ACK, FIN, ACK) allowing graceful teardown and half-close states. Control flags include SYN (synchronize), ACK (acknowledge), FIN (finish), RST (reset), and PSH (push). Sequence numbers ensure data reconstruction, duplicate prevention, and flow tracking.',
      explanation: 'Detailed state transitions during TCP session lifecycle.',
      createdBy: setter._id
    });

    const r5 = await QuestionRubric.create({
      question: q5._id,
      maxMarks: 10,
      criteria: [
        {
          name: 'Three-Way Handshake Mechanics',
          description: 'Detailed steps: SYN, SYN-ACK, ACK with sequence and acknowledgment numbers.',
          maxMarks: 4,
          keywords: ['SYN', 'SYN-ACK', 'ACK', 'initial sequence number', 'handshake']
        },
        {
          name: 'Connection Teardown (Four-Way Wave)',
          description: 'FIN, ACK, FIN, ACK exchange, half-close state, and TIME_WAIT interval.',
          maxMarks: 3,
          keywords: ['FIN', 'TIME_WAIT', 'termination', 'teardown', 'half-close']
        },
        {
          name: 'Control Flags & Reliability Significance',
          description: 'Roles of SYN, ACK, FIN, RST, and sequence synchronization for reliability.',
          maxMarks: 3,
          keywords: ['flags', 'SYN', 'ACK', 'FIN', 'RST', 'sequence sync', 'duplicate detection']
        }
      ],
      createdBy: setter._id
    });
    q5.rubric = r5._id;
    await q5.save();

    console.log('Seeded 5 Questions and Rubrics.');

    // 6. Marks Blueprint
    await MarksBlueprint.create({
      examination: examination._id,
      totalMarks: 50,
      unitDistribution: [
        { unit: 'Unit 1: Physical & Data Link', marks: 0, questionsCount: 0 },
        { unit: 'Unit 2: Network Layer & Routing', marks: 20, questionsCount: 2 },
        { unit: 'Unit 3: Transport Layer Protocols', marks: 20, questionsCount: 2 },
        { unit: 'Unit 4: Application Layer & OSI', marks: 10, questionsCount: 1 }
      ],
      difficultyDistribution: { easy: 0, medium: 60, hard: 40 },
      questionTypeDistribution: { mcq: 0, shortAnswer: 0, longAnswer: 40, descriptive: 60 },
      createdBy: setter._id
    });

    // 7. Question Paper (Approved)
    const questionPaper = await QuestionPaper.create({
      examination: examination._id,
      paperTitle: 'B.Tech Semester VI Computer Networks Examination Paper',
      totalMarks: 50,
      instructions: [
        'All five questions are mandatory. Each question carries 10 marks.',
        'Use appropriate technical nomenclature, protocols, and network diagrams.',
        'Answers should be structured, concise, and technically accurate.'
      ],
      questions: [
        { question: q1._id, questionNumber: 1, marks: 10, customInstruction: 'Explain all 7 layers.' },
        { question: q2._id, questionNumber: 2, marks: 10, customInstruction: 'Provide comparison table and examples.' },
        { question: q3._id, questionNumber: 3, marks: 10, customInstruction: 'Provide complete calculations for 4 subnets.' },
        { question: q4._id, questionNumber: 4, marks: 10, customInstruction: 'Explain Count-to-Infinity and remedies.' },
        { question: q5._id, questionNumber: 5, marks: 10, customInstruction: 'Detail 3-way handshake and 4-way termination.' }
      ],
      status: 'APPROVED',
      submittedBy: setter._id,
      submittedAt: new Date(Date.now() - 5 * 86400000),
      reviewedBy: admin._id,
      reviewedAt: new Date(Date.now() - 4 * 86400000),
      approvalHistory: [
        { action: 'SUBMITTED', performedBy: setter._id, date: new Date(Date.now() - 5 * 86400000), comments: 'Paper submitted with full rubric coverage.' },
        { action: 'APPROVED', performedBy: admin._id, date: new Date(Date.now() - 4 * 86400000), comments: 'Reviewed syllabus alignment and approved.' }
      ]
    });

    examination.approvedQuestionPaper = questionPaper._id;
    await examination.save();

    // 8. Student 1 Exam Attempt & Answer Copy (Ready for evaluation by Evaluator)
    const attempt1 = await ExamAttempt.create({
      student: student1._id,
      examination: examination._id,
      questionPaper: questionPaper._id,
      startedAt: new Date(Date.now() - 2 * 86400000),
      submittedAt: new Date(Date.now() - 2 * 86400000 + 7200000),
      status: 'SUBMITTED',
      answersDraft: []
    });

    const copy1 = await AnswerCopy.create({
      copyId: 'COPY-CN601-AARAV',
      student: student1._id,
      examination: examination._id,
      subject: 'Computer Networks',
      attempt: attempt1._id,
      answers: [
        {
          question: q1._id,
          questionNumber: 1,
          maxMarks: 10,
          studentAnswer: 'The OSI (Open Systems Interconnection) model created by ISO consists of seven architectural layers: 1. Physical Layer: transmits raw bits over physical cable/fiber mediums. 2. Data Link Layer: handles node-to-node frame delivery, MAC addressing, and CRC error checking. 3. Network Layer: performs logical IP addressing and packet routing across subnets. 4. Transport Layer: provides host-to-host segment delivery with TCP flow control and error recovery. 5. Session Layer: establishes and maintains synchronization checkpoints. 6. Presentation Layer: manages data compression, syntax conversion, and SSL encryption. 7. Application Layer: provides user-facing network services such as HTTP, DNS, and SMTP. As data moves down the stack, each layer adds its header through encapsulation.',
          submittedAt: new Date(Date.now() - 2 * 86400000 + 1200000)
        },
        {
          question: q2._id,
          questionNumber: 2,
          maxMarks: 10,
          studentAnswer: 'TCP and UDP represent two contrasting transport protocols. TCP is connection-oriented and relies on a 3-way handshake before transmitting data. It guarantees in-order segment delivery using ACKs, sequence numbers, and sliding window flow control. However, its 20-byte header and retransmissions introduce latency. UDP is connectionless with a minimal 8-byte header and no transmission guarantees or acknowledgments. Because of this, TCP is used where zero data loss is necessary such as HTTP web browsing and file transfer. UDP is ideal for low-latency multimedia like live video streaming, voice calls, and DNS queries.',
          submittedAt: new Date(Date.now() - 2 * 86400000 + 2400000)
        },
        {
          question: q3._id,
          questionNumber: 3,
          maxMarks: 10,
          studentAnswer: 'CIDR (Classless Inter-Domain Routing) replaces legacy classful IP allocation by appending prefix notation to denote network bits. For 192.168.10.0/24 divided into 4 subnets, we borrow 2 bits, yielding a /26 prefix and subnet mask 255.255.255.192. Block size is 256 / 4 = 64.\nSubnet 1: Network ID 192.168.10.0/26, Usable Hosts: 192.168.10.1 to 192.168.10.62, Broadcast: 192.168.10.63.\nSubnet 2: Network ID 192.168.10.64/26, Usable Hosts: 192.168.10.65 to 192.168.10.126, Broadcast: 192.168.10.127.\nSubnet 3: Network ID 192.168.10.128/26, Usable Hosts: 192.168.10.129 to 192.168.10.190, Broadcast: 192.168.10.191.\nSubnet 4: Network ID 192.168.10.192/26, Usable Hosts: 192.168.10.193 to 192.168.10.254, Broadcast: 192.168.10.255.',
          submittedAt: new Date(Date.now() - 2 * 86400000 + 3600000)
        },
        {
          question: q4._id,
          questionNumber: 4,
          maxMarks: 10,
          studentAnswer: 'Distance Vector routing uses the Bellman-Ford algorithm where each router periodically advertises its distance vector (destination and hop count) to immediate neighbors. The Count-to-Infinity problem occurs when an active link fails, and adjacent routers exchange stale routing information in a loop, incrementing hop count step by step toward infinity. To solve this, protocols implement: 1. Split Horizon: never advertise a route back to the interface from which it was learned. 2. Poison Reverse: advertising the unreachable route with an infinity metric (16 in RIP). 3. Holddown timers.',
          submittedAt: new Date(Date.now() - 2 * 86400000 + 4800000)
        },
        {
          question: q5._id,
          questionNumber: 5,
          maxMarks: 10,
          studentAnswer: 'The TCP 3-way handshake establishes a reliable full-duplex session:\n1. Client -> Server: SYN (with client initial sequence number ISN_c).\n2. Server -> Client: SYN-ACK (with server ISN_s and ACK = ISN_c + 1).\n3. Client -> Server: ACK (with ACK = ISN_s + 1).\nConnection termination uses a 4-way handshake: Client sends FIN, Server responds with ACK (half-close), Server finishes pending data and sends FIN, Client acknowledges with ACK and enters TIME_WAIT. Sequence numbers guarantee proper ordering and prevent duplicates.',
          submittedAt: new Date(Date.now() - 2 * 86400000 + 6000000)
        }
      ],
      evaluationMode: 'AI_ASSISTED',
      assignedEvaluator: evaluator._id,
      assignedAt: new Date(Date.now() - 1 * 86400000),
      evaluationStatus: 'ASSIGNED',
      totalMaxMarks: 50
    });

    // Assignment history
    await EvaluatorAssignment.create({
      evaluator: evaluator._id,
      examination: examination._id,
      subject: 'Computer Networks',
      answerCopies: [copy1._id],
      assignedBy: admin._id,
      assignedAt: new Date(Date.now() - 1 * 86400000),
      status: 'ASSIGNED'
    });

    // 9. Student 2 Exam Attempt & Already Completed Evaluation + Published Result
    // (Provides instant rich analytics and AI vs Evaluator report charts!)
    const attempt2 = await ExamAttempt.create({
      student: student2._id,
      examination: examination._id,
      questionPaper: questionPaper._id,
      startedAt: new Date(Date.now() - 3 * 86400000),
      submittedAt: new Date(Date.now() - 3 * 86400000 + 6800000),
      status: 'SUBMITTED',
      answersDraft: []
    });

    const copy2 = await AnswerCopy.create({
      copyId: 'COPY-CN601-ROHAN',
      student: student2._id,
      examination: examination._id,
      subject: 'Computer Networks',
      attempt: attempt2._id,
      answers: [
        {
          question: q1._id,
          questionNumber: 1,
          maxMarks: 10,
          studentAnswer: 'OSI model has 7 layers: Physical, Data Link, Network, Transport, Session, Presentation, Application. Physical handles bits, Data link uses MAC frames, Network uses IP packets, Transport uses TCP segments. Application runs HTTP and DNS.',
          submittedAt: new Date()
        },
        {
          question: q2._id,
          questionNumber: 2,
          maxMarks: 10,
          studentAnswer: 'TCP is reliable and connection-oriented with ACKs. UDP is connectionless and fast without ACKs. TCP is for web and file download, UDP is for audio and video calls.',
          submittedAt: new Date()
        },
        {
          question: q3._id,
          questionNumber: 3,
          maxMarks: 10,
          studentAnswer: 'CIDR uses slash notation like /24. For 4 subnets we use /26 mask 255.255.255.192. Subnets are 0-63, 64-127, 128-191, 192-255.',
          submittedAt: new Date()
        },
        {
          question: q4._id,
          questionNumber: 4,
          maxMarks: 10,
          studentAnswer: 'Distance vector routing calculates shortest distance using Bellman Ford. Count to infinity happens when links fail and hop counts loop up to 16. Fixed by split horizon and poison reverse.',
          submittedAt: new Date()
        },
        {
          question: q5._id,
          questionNumber: 5,
          maxMarks: 10,
          studentAnswer: 'Handshake steps are SYN, SYN-ACK, and ACK. Teardown uses FIN and ACK packets. Flags control connection state and sequence numbers prevent duplicate packets.',
          submittedAt: new Date()
        }
      ],
      evaluationMode: 'AI_ASSISTED',
      assignedEvaluator: evaluator._id,
      assignedAt: new Date(Date.now() - 2 * 86400000),
      evaluationStatus: 'COMPLETED',
      totalAwardedMarks: 41,
      totalMaxMarks: 50,
      percentage: 82,
      evaluatedAt: new Date(Date.now() - 1 * 86400000)
    });

    // Completed Evaluation doc for Student 2
    const evaluation2 = await Evaluation.create({
      answerCopy: copy2._id,
      examination: examination._id,
      evaluator: evaluator._id,
      evaluationMode: 'AI_ASSISTED',
      isDraft: false,
      questionEvaluations: [
        {
          question: q1._id,
          questionNumber: 1,
          maxMarks: 10,
          marksAwarded: 8,
          comments: 'Clear listing of 7 layers and functions, but brief introduction.',
          aiSuggestedMarks: 8,
          aiFeedback: 'Covers all 7 layers accurately. Encapsulation summary present.',
          wasAiAccepted: true,
          criteriaBreakdown: [
            { criterion: 'Introduction & Overview', maxMarks: 1, marksAwarded: 0.5, feedback: 'Brief' },
            { criterion: 'Seven Layers Identification', maxMarks: 5, marksAwarded: 5, feedback: 'All 7 layers correct' },
            { criterion: 'Functions & Data Units (PDUs)', maxMarks: 2, marksAwarded: 1.5, feedback: 'Good PDU coverage' },
            { criterion: 'Real-world Examples & Protocols', maxMarks: 1, marksAwarded: 1, feedback: 'HTTP & DNS listed' },
            { criterion: 'Conclusion & Clarity', maxMarks: 1, marksAwarded: 0, feedback: 'No formal conclusion' }
          ]
        },
        {
          question: q2._id,
          questionNumber: 2,
          maxMarks: 10,
          marksAwarded: 8,
          comments: 'Accurate contrast between TCP and UDP.',
          aiSuggestedMarks: 7.5,
          aiFeedback: 'Sound explanation of reliability and protocol use cases.',
          wasAiAccepted: false,
          criteriaBreakdown: [
            { criterion: 'Core Architectural Differences', maxMarks: 4, marksAwarded: 3.5, feedback: 'Accurate' },
            { criterion: 'Reliability & Order Mechanism', maxMarks: 3, marksAwarded: 2.5, feedback: 'ACK mechanism noted' },
            { criterion: 'Flow & Congestion Control', maxMarks: 2, marksAwarded: 1, feedback: 'Sliding window briefly omitted' },
            { criterion: 'Real-world Protocol Examples', maxMarks: 1, marksAwarded: 1, feedback: 'Web and streaming mentioned' }
          ]
        },
        {
          question: q3._id,
          questionNumber: 3,
          maxMarks: 10,
          marksAwarded: 9,
          comments: 'Subnet calculations are spot on.',
          aiSuggestedMarks: 9,
          aiFeedback: 'Derived /26 mask and block sizes correctly.',
          wasAiAccepted: true,
          criteriaBreakdown: [
            { criterion: 'CIDR Concept & VLSM Definition', maxMarks: 3, marksAwarded: 2.5, feedback: 'Clear' },
            { criterion: 'Subnet Mask Calculation', maxMarks: 3, marksAwarded: 3, feedback: '255.255.255.192 derived' },
            { criterion: 'Four Subnet Ranges & Host Allocation', maxMarks: 4, marksAwarded: 3.5, feedback: 'Block boundaries correct' }
          ]
        },
        {
          question: q4._id,
          questionNumber: 4,
          maxMarks: 10,
          marksAwarded: 8,
          comments: 'Good understanding of Split Horizon and Bellman-Ford.',
          aiSuggestedMarks: 8.5,
          aiFeedback: 'Explains Bellman-Ford, infinity metric (16), and Split Horizon.',
          wasAiAccepted: false,
          criteriaBreakdown: [
            { criterion: 'Algorithm Operation & Bellman-Ford', maxMarks: 4, marksAwarded: 3.5, feedback: 'Accurate' },
            { criterion: 'Count-to-Infinity Problem Analysis', maxMarks: 3, marksAwarded: 2.5, feedback: 'Clear loops explanation' },
            { criterion: 'Mitigation Techniques', maxMarks: 3, marksAwarded: 2, feedback: 'Split horizon & poison reverse' }
          ]
        },
        {
          question: q5._id,
          questionNumber: 5,
          maxMarks: 10,
          marksAwarded: 8,
          comments: '3-way handshake and 4-way teardown well explained.',
          aiSuggestedMarks: 8,
          aiFeedback: 'SYN/ACK packet flow correctly specified.',
          wasAiAccepted: true,
          criteriaBreakdown: [
            { criterion: 'Three-Way Handshake Mechanics', maxMarks: 4, marksAwarded: 3.5, feedback: 'Correct step sequence' },
            { criterion: 'Connection Teardown (Four-Way Wave)', maxMarks: 3, marksAwarded: 2.5, feedback: 'FIN and ACK noted' },
            { criterion: 'Control Flags & Reliability Significance', maxMarks: 3, marksAwarded: 2, feedback: 'Flags and sequencing covered' }
          ]
        }
      ],
      totalMarks: 41,
      maxPossibleMarks: 50,
      percentage: 82,
      overallComments: 'Overall strong performance across all 5 descriptive questions.',
      submittedAt: new Date(Date.now() - 1 * 86400000)
    });

    // Seed AIEvaluation logs for comparison reporting
    await AIEvaluation.create({
      answerCopy: copy2._id,
      question: q1._id,
      studentAnswer: copy2.answers[0].studentAnswer,
      referenceAnswer: q1.expectedAnswer,
      maxMarks: 10,
      aiSuggestedMarks: 8,
      evaluatorFinalMarks: 8,
      evaluatorAction: 'ACCEPTED',
      modelUsed: 'smart_heuristic',
      overallFeedback: 'Covers all 7 layers accurately. Encapsulation summary present.'
    });

    await AIEvaluation.create({
      answerCopy: copy2._id,
      question: q2._id,
      studentAnswer: copy2.answers[1].studentAnswer,
      referenceAnswer: q2.expectedAnswer,
      maxMarks: 10,
      aiSuggestedMarks: 7.5,
      evaluatorFinalMarks: 8,
      evaluatorAction: 'MODIFIED',
      modelUsed: 'smart_heuristic',
      overallFeedback: 'Sound explanation of reliability and protocol use cases.'
    });

    await AIEvaluation.create({
      answerCopy: copy2._id,
      question: q3._id,
      studentAnswer: copy2.answers[2].studentAnswer,
      referenceAnswer: q3.expectedAnswer,
      maxMarks: 10,
      aiSuggestedMarks: 9,
      evaluatorFinalMarks: 9,
      evaluatorAction: 'ACCEPTED',
      modelUsed: 'smart_heuristic',
      overallFeedback: 'Derived /26 mask and block sizes correctly.'
    });

    // Published Result for Student 2
    await Result.create({
      examination: examination._id,
      student: student2._id,
      answerCopy: copy2._id,
      totalMarks: 41,
      maxMarks: 50,
      percentage: 82,
      grade: 'A',
      passed: true,
      published: true,
      publishedAt: new Date(Date.now() - 12 * 3600000),
      publishedBy: admin._id
    });

    // Seed Notifications
    await Notification.create({
      recipient: evaluator._id,
      targetRole: 'EVALUATOR',
      title: 'Answer Copy Assigned for Evaluation',
      message: `Answer copy ${copy1.copyId} for ${examination.name} (${examination.subject}) has been assigned to you.`,
      type: 'ACTION_REQUIRED',
      link: '/evaluator/assigned-copies'
    });

    await Notification.create({
      targetRole: 'ADMIN',
      title: 'Exam Submissions Ready for Evaluation',
      message: `Examination ${examination.name} has pending student answer copies awaiting evaluation.`,
      type: 'INFO',
      link: '/admin/answer-copies'
    });

    // Seed Audit Logs
    await AuditLog.create({
      user: admin._id,
      userName: admin.name,
      userRole: 'ADMIN',
      action: 'EXAM_CREATED',
      entity: 'Examination',
      entityId: examination._id.toString(),
      details: { name: examination.name, code: examination.code, subject: examination.subject }
    });

    await AuditLog.create({
      user: admin._id,
      userName: admin.name,
      userRole: 'ADMIN',
      action: 'QUESTION_PAPER_APPROVED',
      entity: 'QuestionPaper',
      entityId: questionPaper._id.toString(),
      details: { paperTitle: questionPaper.paperTitle, totalMarks: 50 }
    });

    console.log('Database seeded successfully!');
    console.log('----------------------------------------------------');
    console.log('DEMO CREDENTIALS:');
    console.log('Admin:     admin@example.com     / Admin@123');
    console.log('Setter:    setter@example.com    / Setter@123');
    console.log('Evaluator: evaluator@example.com / Evaluator@123');
    console.log('----------------------------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();
