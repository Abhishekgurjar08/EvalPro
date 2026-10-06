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
  'Swati Bose', 'Naveen Mishra', 'Preeti Tiwari', 'Suresh Pandey', 'Meera Nambiar',
  'Harsh Vardhan', 'Ankita Das', 'Gaurav Kulkarni', 'Simran Kaur', 'Akash Tripathi',
  'Ritika Agarwal', 'Manish Pandey', 'Shreya Ghosh', 'Vikas Dubey', 'Megha Jain'
];

const chemistryQuestionsData = [
  {
    questionText: 'Explain the Molecular Orbital Theory (MOT) and draw the energy level diagram for O2 and N2 molecules. Calculate their bond orders and explain magnetic properties.',
    topic: 'Chemical Bonding and Molecular Structure',
    unit: 1,
    marks: 20,
    expectedAnswer: 'MOT postulates, linear combination of atomic orbitals (LCAO), bonding and antibonding orbitals, energy level diagram for N2 (s-p mixing) and O2 (no s-p mixing). Bond order calculation formula: 1/2(Nb - Na). O2 is paramagnetic due to unpaired electrons in pi*2px and pi*2py.',
    studentAnswers: [
      'Molecular Orbital Theory explains chemical bonding based on wave mechanics where atomic orbitals combine linearly (LCAO) to form bonding and anti-bonding molecular orbitals. For O2 molecule, electronic configuration is sigma 1s2 sigma* 1s2 sigma 2s2 sigma* 2s2 sigma 2pz2 pi 2px2 = pi 2py2 pi* 2px1 = pi* 2py1. Bond Order = (10 - 6)/2 = 2. Presence of 2 unpaired electrons in pi* antibonding orbitals confirms paramagnetism.',
      'According to MOT, atomic orbitals combine to form molecular orbitals of lower (bonding) and higher (antibonding) energy. For N2 (14 electrons), configuration is sigma 1s2 sigma* 1s2 sigma 2s2 sigma* 2s2 pi 2px2 = pi 2py2 sigma 2pz2. Bond order is (10-4)/2 = 3. All electrons paired, hence diamagnetic.',
      'In MOT, electrons reside in molecular orbitals delocalized over the entire molecule. O2 has bond order 2 with two unpaired electrons making it paramagnetic, while N2 has triple bond (bond order 3) and is diamagnetic.'
    ]
  },
  {
    questionText: 'Derive the integrated rate equation for a first-order reaction. Define half-life and show that the half-life of a first-order reaction is independent of initial concentration.',
    topic: 'Chemical Kinetics',
    unit: 2,
    marks: 20,
    expectedAnswer: 'Rate = -d[A]/dt = k[A]. Integrating gives ln([A]0/[A]) = kt or k = (2.303/t) * log([A]0/[A]). Half-life t1/2 = ln(2)/k = 0.693/k, which has no concentration term [A]0.',
    studentAnswers: [
      'For reaction A -> Products, rate equation is -d[A]/dt = k[A]. Rearranging: d[A]/[A] = -k dt. Integrating both sides from [A]0 to [A] gives ln([A]/[A]0) = -kt, which simplifies to k = (2.303/t) * log([A]0/[A]). At t = t1/2, [A] = [A]0/2, substituting gives t1/2 = 0.693/k. This clearly proves half-life is independent of the initial reactant concentration.',
      'Derivation: -d[A]/dt = k[A] => integral d[A]/[A] = -k integral dt. ln[A] - ln[A]0 = -kt. Thus k = (1/t) ln([A]0/[A]). Half life period t1/2 occurs when [A] = [A]0/2. t1/2 = ln(2)/k = 0.693/k. Hence t1/2 depends only on rate constant k.',
      'First order kinetics rate law: -d[R]/dt = k[R]. Integrating: [R] = [R]0 * e^(-kt). Half-life t1/2 = 0.693/k. No [R]0 term is present in the final expression, proving independence of concentration.'
    ]
  },
  {
    questionText: 'State and explain the First and Second Laws of Thermodynamics. Derive the relationship between Gibbs free energy change (delta G), enthalpy change (delta H), and entropy change (delta S).',
    topic: 'Chemical Thermodynamics',
    unit: 3,
    marks: 20,
    expectedAnswer: 'First Law: Energy conservation delta U = q + w. Second Law: Total entropy of isolated system increases for spontaneous process (delta S_total > 0). Gibbs energy definition G = H - TS, at constant T, delta G = delta H - T*delta S. Spontaneity condition: delta G < 0.',
    studentAnswers: [
      'First law of thermodynamics states energy can neither be created nor destroyed: delta U = q + w. Second law states entropy of the universe increases in any spontaneous process (delta S_univ > 0). Gibbs free energy G = H - TS. For a process at constant T and P: delta G = delta H - T*delta S. Spontaneous when delta G is negative, at equilibrium when delta G = 0.',
      '1st Law: delta U = q + w. 2nd Law: delta S_total >= 0. G is defined as H - TS. Taking differentials: dG = dH - TdS - SdT. At isothermal conditions (dT = 0), delta G = delta H - T delta S. Negative delta G indicates spontaneity.',
      'Thermodynamic laws: Conservation of energy (1st law) and entropy increase of universe (2nd law). G = H - TS leads to Gibbs-Helmholtz relation delta G = delta H - T delta S. Delta G < 0 indicates feasible spontaneous reaction.'
    ]
  },
  {
    questionText: 'Explain the working principle and construction of the Standard Hydrogen Electrode (SHE) and Daniel Galvanic Cell. Write cell reactions and Nernst equation for the cell.',
    topic: 'Electrochemistry',
    unit: 4,
    marks: 20,
    expectedAnswer: 'SHE: Pt foil coated with Pt black in 1M H+ solution with H2 gas at 1 atm. Potential assigned 0.00V. Daniel Cell: Zn|Zn2+(1M) || Cu2+(1M)|Cu. Anode: Zn -> Zn2+ + 2e-, Cathode: Cu2+ + 2e- -> Cu. Nernst equation: E_cell = E0_cell - (0.0591/n) * log([Zn2+]/[Cu2+]).',
    studentAnswers: [
      'SHE consists of platinum electrode coated with platinum black dipping into 1 M HCl solution with pure H2 gas bubbled at 1 bar pressure. Reference potential = 0.00 V. Daniel cell consists of Zn anode in ZnSO4 and Cu cathode in CuSO4 separated by salt bridge. Anode: Zn -> Zn2+ + 2e-, Cathode: Cu2+ + 2e- -> Cu. Overall: Zn + Cu2+ -> Zn2+ + Cu. Nernst equation: E_cell = E0_cell - (0.0591/2) * log([Zn2+]/[Cu2+]). Standard EMF = 1.10 V.',
      'Standard Hydrogen Electrode is primary reference electrode with E0 = 0V. Daniel Cell produces electrical energy from redox reaction. Zn oxidizes at anode, Cu2+ reduces at cathode. E_cell = E0_cell - (RT/2F)*ln([Zn2+]/[Cu2+]) = 1.10 - (0.0591/2)*log([Zn2+]/[Cu2+]).',
      'Construction of SHE with Pt wire and H2 gas at 1 atm. Daniel cell combines Zn/Zn2+ and Cu/Cu2+ half cells. Salt bridge maintains electrical neutrality. Nernst equation calculates cell potential under non-standard concentrations: E = E0 - (0.0591/n)log Q.'
    ]
  },
  {
    questionText: 'Discuss SN1 and SN2 reaction mechanisms in alkyl halides with energy profile diagrams, stereochemistry (inversion vs racemization), and factors affecting reactivity.',
    topic: 'Organic Chemistry & Reaction Mechanisms',
    unit: 5,
    marks: 20,
    expectedAnswer: 'SN1: Unimolecular, two-step, carbocation intermediate, racemization with partial inversion, favored by 3 > 2 > 1 alkyl halides and polar protic solvents. SN2: Bimolecular, single-step, backside nucleophilic attack, Walden inversion, favored by 1 > 2 > 3 alkyl halides and polar aprotic solvents.',
    studentAnswers: [
      'SN1 mechanism is a two-step unimolecular substitution. Step 1: slow ionization forming planar carbocation (rate determining). Step 2: rapid nucleophilic attack from either side leading to racemization. Reactivity: 3deg > 2deg > 1deg. SN2 is a single step concerted bimolecular mechanism with transition state and backside attack resulting in 100% Walden inversion. Reactivity: 1deg > 2deg > 3deg due to steric hindrance.',
      'Comparison: SN1 is first order rate = k[R-X], goes via carbocation, forms racemic mixture, favored in polar protic solvents (H2O, EtOH). SN2 is second order rate = k[R-X][Nu-], concerted transition state, complete inversion of configuration, favored in polar aprotic solvents (DMSO, Acetone).',
      'SN1 involves carbocation intermediate with 2 transition states and racemization. SN2 involves penta-coordinate transition state with single activation barrier and Walden inversion of stereocenters.'
    ]
  }
];

async function seedChemistry100Copies() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/exam_eval_system';
  console.log(`Connecting to MongoDB at ${uri}...`);
  await mongoose.connect(uri);
  console.log('✓ Connected to MongoDB');

  // 1. Get or create Admin user for association
  let adminUser = await User.findOne({ role: 'ADMIN' });
  if (!adminUser) {
    adminUser = await User.findOne();
  }

  // 2. Find or create Chemistry CS 101 Examination
  // Look for exam with code 'CS-101', 'CS 101', 'CHEM-101', 'CS101' or subject 'Chemistry'
  let exam = await Examination.findOne({
    $or: [
      { code: 'CS-101' },
      { code: 'CS 101' },
      { code: 'CS101' },
      { code: 'CHEM-CS101' },
      { subject: { $regex: /^chemistry$/i } }
    ]
  });

  if (!exam) {
    exam = await Examination.create({
      name: 'Chemistry (CS 101)',
      code: 'CS-101',
      subject: 'Chemistry',
      course: 'B.Tech',
      semester: 1,
      session: '2025-2026',
      durationMinutes: 180,
      maxMarks: 100,
      passingMarks: 40,
      description: 'End Semester Theory Examination for Engineering Chemistry (Course Code: CS 101)',
      instructions: [
        'Attempt all 5 questions. Each question carries 20 marks.',
        'Draw neat and labeled molecular diagrams and chemical equations wherever necessary.',
        'Use of standard scientific calculator is permitted.'
      ],
      status: 'COMPLETED',
      scanningStatus: 'SCANNING_COMPLETED',
      totalExpectedCopies: 100,
      evaluationMode: null,
      evaluationModeLocked: false,
      createdBy: adminUser?._id
    });
    console.log(`✓ Created Examination: "${exam.name}" (Code: ${exam.code}, ID: ${exam._id})`);
  } else {
    exam.name = 'Chemistry (CS 101)';
    exam.code = 'CS-101';
    exam.subject = 'Chemistry';
    exam.status = 'COMPLETED';
    exam.scanningStatus = 'SCANNING_COMPLETED';
    exam.totalExpectedCopies = 100;
    await exam.save();
    console.log(`✓ Updated Examination: "${exam.name}" (Code: ${exam.code}, ID: ${exam._id})`);
  }

  // 3. Create or find Questions for Chemistry
  const createdQuestionDocs = [];
  for (let idx = 0; idx < chemistryQuestionsData.length; idx++) {
    const qData = chemistryQuestionsData[idx];
    let qDoc = await Question.findOne({
      subject: 'Chemistry',
      topic: qData.topic
    });

    if (!qDoc) {
      qDoc = await Question.create({
        questionText: qData.questionText,
        subject: 'Chemistry',
        unit: qData.unit,
        topic: qData.topic,
        marks: qData.marks,
        expectedAnswer: qData.expectedAnswer,
        createdBy: adminUser?._id
      });
    }
    createdQuestionDocs.push({
      doc: qDoc,
      questionData: qData
    });
  }
  console.log(`✓ Prepared ${createdQuestionDocs.length} Chemistry questions`);

  // 4. Create or update Question Paper
  let qp = await QuestionPaper.findOne({ examination: exam._id });
  if (!qp) {
    qp = await QuestionPaper.create({
      paperCode: 'QP-CHEM-CS101',
      title: 'Engineering Chemistry Question Paper - CS 101',
      examination: exam._id,
      subject: 'Chemistry',
      totalMarks: 100,
      durationMinutes: 180,
      status: 'APPROVED',
      approvedBy: adminUser?._id,
      approvedAt: new Date(),
      questions: createdQuestionDocs.map((item, idx) => ({
        question: item.doc._id,
        questionNumber: idx + 1,
        marks: item.doc.marks || 20
      }))
    });
    exam.approvedQuestionPaper = qp._id;
    await exam.save();
    console.log(`✓ Created Approved Question Paper: ${qp.paperCode}`);
  }

  // 5. Remove any old answer copies for this exam to ensure exactly 100 fresh, clean copies
  const del = await AnswerCopy.deleteMany({ examination: exam._id });
  console.log(`✓ Cleared ${del.deletedCount} existing answer copies for Chemistry CS 101`);

  // 6. Generate exactly 100 Scanned Answer Copies
  console.log('Generating exactly 100 Scanned Answer Copies for Chemistry CS 101...');

  const copiesToInsert = [];
  const scannedPdfUrls = [
    'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800',
    'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800',
    'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=800',
    'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800'
  ];

  for (let i = 1; i <= 100; i++) {
    const padNum = String(i).padStart(3, '0');
    const padTwo = String(i).padStart(2, '0');
    const copyId = `COPY-CHEM-${padNum}`;
    const candidateRollNo = `CS101-2026-${padNum}`;
    const bookletNumber = `BK-CHEM-${padNum}`;
    const candidateName = sampleStudentNames[(i - 1) % sampleStudentNames.length] + (i > sampleStudentNames.length ? ` (${i})` : '');
    const fileName = `chemistry_cs101_booklet_${padTwo}.pdf`;

    // Map the 5 questions with realistic student answers
    const answers = createdQuestionDocs.map((qItem, qIdx) => {
      const answersPool = qItem.questionData.studentAnswers;
      const answerText = answersPool[(i + qIdx) % answersPool.length];
      return {
        question: qItem.doc._id,
        questionNumber: qIdx + 1,
        maxMarks: qItem.doc.marks || 20,
        studentAnswer: answerText,
        evaluationStatus: 'PENDING',
        aiMarks: null,
        finalMarks: null,
        marksAwarded: null
      };
    });

    copiesToInsert.push({
      copyId,
      candidateRollNo,
      candidateName,
      bookletNumber,
      scannedDocument: {
        fileName,
        fileUrl: scannedPdfUrls[(i - 1) % scannedPdfUrls.length],
        fileType: 'application/pdf',
        fileSize: 2450000 + (i * 1234),
        scannedPages: [
          {
            pageNumber: 1,
            pageUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800',
            ocrText: `Chemistry CS 101 Examination Booklet - Roll No: ${candidateRollNo} - Section A & B Responses`
          },
          {
            pageNumber: 2,
            pageUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800',
            ocrText: `Molecular orbital diagrams, rate constant integrations, and thermodynamics derivations.`
          },
          {
            pageNumber: 3,
            pageUrl: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=800',
            ocrText: `Electrochemical cell reactions, Nernst equation derivations, and organic substitution mechanisms.`
          }
        ]
      },
      status: 'UNASSIGNED',
      scanStatus: 'PROCESSED',
      scannedAt: new Date(Date.now() - (101 - i) * 45000), // staggered scan times
      examination: exam._id,
      subject: 'Chemistry',
      answers,
      totalMaxMarks: 100,
      evaluationStatus: 'PENDING',
      evaluationMode: 'MANUAL',
      assignedEvaluator: null,
      assignedAt: null
    });
  }

  await AnswerCopy.insertMany(copiesToInsert);

  const totalCopies = await AnswerCopy.countDocuments({ examination: exam._id });

  console.log('\n================================================================');
  console.log('✓ SUCCESS: 100 SCANNED COPIES OF CHEMISTRY CS 101 CREATED!');
  console.log('================================================================');
  console.log(`Examination Name:     ${exam.name}`);
  console.log(`Subject:              ${exam.subject}`);
  console.log(`Course Code:          ${exam.code}`);
  console.log(`Examination ID:       ${exam._id}`);
  console.log(`Total Scanned Copies: ${totalCopies}`);
  console.log(`Copy ID Range:        COPY-CHEM-001  -->  COPY-CHEM-100`);
  console.log(`Roll Number Range:    CS101-2026-001 -->  CS101-2026-100`);
  console.log(`Booklet Range:        BK-CHEM-001    -->  BK-CHEM-100`);
  console.log(`Status of All Copies: UNASSIGNED (Ready for evaluation)`);
  console.log(`Admin Scanned View:   http://localhost:5173/admin/examinations/${exam._id}/scanned-copies`);
  console.log('================================================================\n');

  await mongoose.disconnect();
}

seedChemistry100Copies().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
