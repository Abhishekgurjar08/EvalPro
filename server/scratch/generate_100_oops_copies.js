const mongoose = require('mongoose');
require('dotenv').config();

const firstNames = [
  'Aarav', 'Aditi', 'Advait', 'Akash', 'Amara', 'Amit', 'Ananya', 'Aniket', 'Anushka', 'Arjun',
  'Aryan', 'Ayush', 'Bhavna', 'Chetan', 'Devansh', 'Dhruv', 'Diya', 'Divyansh', 'Gaurav', 'Gayatri',
  'Harsh', 'Isha', 'Ishaan', 'Jaya', 'Kabir', 'Kavya', 'Khushi', 'Kiran', 'Kunal', 'Lakshay',
  'Madhav', 'Manish', 'Meera', 'Mohit', 'Nakul', 'Neha', 'Nikhil', 'Nisha', 'Nitin', 'Om',
  'Palak', 'Parth', 'Pooja', 'Pranav', 'Pranay', 'Prateek', 'Priya', 'Priyanshu', 'Rahul', 'Rajat',
  'Rajesh', 'Ramesh', 'Rhea', 'Riddhima', 'Rishabh', 'Rohan', 'Rohit', 'Sakshi', 'Sameer', 'Sanjay',
  'Sanjana', 'Sarthak', 'Saurabh', 'Shashank', 'Shikha', 'Shivam', 'Shreya', 'Shruti', 'Siddharth', 'Simran',
  'Sneha', 'Sourabh', 'Suhani', 'Sumit', 'Sunil', 'Suraj', 'Suresh', 'Swati', 'Tanmay', 'Tanvi',
  'Tanya', 'Tarun', 'Tejas', 'Uday', 'Utkarsh', 'Vaibhav', 'Varun', 'Vedant', 'Vidya', 'Vikas',
  'Vikram', 'Vinay', 'Vishal', 'Vivek', 'Yash', 'Yashika', 'Yogesh', 'Zoya', 'Alok', 'Deepak'
];

const lastNames = [
  'Sharma', 'Verma', 'Gupta', 'Singh', 'Patel', 'Kumar', 'Mishra', 'Yadav', 'Joshi', 'Chauhan',
  'Mehta', 'Bhatia', 'Saxena', 'Tiwari', 'Nair', 'Iyer', 'Reddy', 'Agarwal', 'Malhotra', 'Kapoor'
];

// Diverse sample student responses for the 5 questions
const answerTemplates = {
  q1: [
    `Layered Abstraction is a fundamental architectural paradigm in object-oriented design that organizes software into distinct hierarchical layers. Each layer encapsulates specific responsibilities and interacts only with adjacent layers through well-defined interfaces.
In OOP, modularity is enhanced because high-level modules depend on abstractions rather than low-level concrete implementations (following the Dependency Inversion Principle).
Protocols and interfaces decouple clients from service providers, ensuring that internal algorithmic changes do not propagate across layer boundaries. Security is fortified by restricting direct access to raw memory or internal state through strict encapsulation and access specifiers (private/protected).`,
    `In modern object-oriented software engineering, Layered Abstraction decouples presentation, domain logic, and data storage. System modularity is attained by separating concerns: each class operates as a self-contained autonomous unit.
Introduction of protocol interfaces (such as Java interfaces or C++ pure virtual base classes) enforces standard contracts. Security is maintained through encapsulation—internal data representations are shielded from unauthorized external mutation, allowing security validation logic to execute consistently within accessor boundaries.`,
    `Layered Abstraction simplifies complex systems by breaking them into manageable abstraction tiers: User Interface, Business Service Layer, and Persistence Layer.
OOP patterns such as Factory and Facade leverage this layered abstraction to supply clean API boundaries. System modularity allows individual components to be unit tested and refactored independently. System security is achieved by enforcing authorization protocols at layer gateways, ensuring only authenticated service objects handle sensitive domain models.`
  ],
  q2: [
    `Protocols define formal contracts of communication and behavior in OOP systems without dictating concrete implementation details. They specify method signatures, return types, and operational preconditions.
Key challenges during protocol implementation include:
1. Interface Bloat: Accumulating too many responsibilities into a single protocol.
2. Versioning & Fragility: Updating protocol methods without breaking existing client implementations.
Mitigation strategies include adopting the Interface Segregation Principle (ISP)—decomposing monolithic interfaces into role-specific micro-protocols—and employing Default Adapter Patterns to allow backward compatibility.`,
    `A Protocol represents a standard specification that implementing classes must satisfy. In Java, this maps to interfaces; in Swift/Objective-C, to protocols; in C++, to abstract classes with pure virtual functions.
Challenges:
- Tight Coupling through static bindings if protocols are not properly decoupled.
- Performance overhead from dynamic dispatch (vtable lookups).
Mitigations:
- Using Dependency Injection to dynamically supply protocol implementations.
- Keeping protocol definitions lean, focused, and cohesive.`,
    `Protocols govern component interactions. The main challenge in enterprise architectures is managing evolutionary changes across distributed services where interfaces evolve asynchronously.
Mitigation strategies:
1. Versioned protocols (e.g., ProtocolV1, ProtocolV2 or schema evolution).
2. Implementing the Facade or Adapter Pattern to wrap evolving protocols behind stable endpoints.
3. Strict unit contract testing against reference mock models.`
  ],
  q3: [
    `Topic 1 / System Architecture in OOPS guarantees scalability, fault tolerance, and maintainability through:
1. Scalability: High cohesion and low coupling allow stateless service objects to be horizontally scaled across worker pools. Microservice boundaries can be aligned with OOP aggregate roots.
2. Fault Tolerance: Encapsulated error handling, defensive programming with robust exception hierarchies, and graceful degradation via Null Object or Circuit Breaker patterns.
3. Maintainability: The Single Responsibility Principle ensures that changes to business rules require modifications only to localized classes, drastically minimizing regression risk and cognitive overhead.`,
    `OOPS architectural principles provide direct mechanisms for resilience and maintainability:
- Scalability: Polymorphic abstractions enable dynamic loading of specialized worker threads and asynchronous task executors.
- Fault Tolerance: Exception handling strategies isolate component failures so that an uncaught error in a child object does not bring down the entire application runtime.
- Maintainability: Design patterns like Strategy and Observer promote open/closed architectures where new features are added via extension rather than modification of existing classes.`,
    `Scalability in object-oriented design is achieved through modular decomposition and interface-driven programming.
Fault tolerance relies on defensive encapsulation—validating invariant states in constructors and mutators so corrupt data cannot propagate.
Maintainability is maximized by clean class hierarchies, detailed API documentation, and separation between interfaces and implementations, making codebase navigation straightforward for large engineering teams.`
  ],
  q4: [
    `In the context of Inheritance and Polymorphism, the object lifecycle encompasses instantiation (constructor chaining), dynamic binding, message dispatch via virtual method tables (vtables), and eventual destruction/garbage collection.
Key interactions:
- Subclasses inherit attributes and behavior from base classes, overriding virtual methods to provide specialized behavior.
- Polymorphism allows a base class reference to transparently invoke the derived class implementation at runtime (late binding).
Constraints:
- Adherence to the Liskov Substitution Principle (LSP): derived classes must remain substitutable for their base types without altering program correctness.
- Fragile Base Class problem: alterations to superclass internals can unintentionally break derived classes.`,
    `Inheritance models 'IS-A' relationships and establishes class hierarchies. When an object is instantiated, base class constructors execute first in sequence before the derived class constructor initializes its fields.
Polymorphism operates through dynamic dispatch. Constraints include:
1. Avoiding deep inheritance trees which create rigid coupling.
2. Favoring composition over inheritance where behavior needs to vary dynamically at runtime.
3. Proper cleanup of resources using virtual destructors in languages with manual memory management.`,
    `The lifecycle of polymorphic objects involves memory allocation, initialization through inherited constructors, runtime method resolution via dispatch tables, and teardown.
Interactions between superclasses and subclasses must respect access specifiers: protected members facilitate controlled inheritance, while private members prevent derived classes from tampering with core invariants.
Constraints include LSP adherence and preventing object slicing when passing polymorphic types by value.`
  ],
  q5: [
    `Encapsulation, Abstraction, Objects, and Classes form the core pillars of Object-Oriented Programming:
- A Class is a blueprint defining structure and behavior; an Object is a concrete runtime instance possessing identity, state, and behavior.
- Encapsulation binds data and the methods operating on that data together, restricting direct access via access modifiers (private, protected, public) to protect state integrity.
- Abstraction exposes only essential conceptual features to the user while suppressing underlying mechanical complexity.
Lifecycle & Constraints:
- Objects transition from unallocated -> instantiated/initialized -> active reference -> unreachable -> collected.
- Constraints require maintaining class invariants, preventing exposure of internal mutable references, and validating inputs inside mutator methods.`,
    `The lifecycle of an object begins when memory is allocated on the heap via 'new' and the constructor initializes its internal fields.
Encapsulation guarantees that the object's internal state can only be mutated through validated public methods, enforcing data integrity and hiding algorithmic details.
Abstraction presents a clean, coherent conceptual model to calling code.
Constraints include preventing leaky abstractions, ensuring immutability where applicable, and avoiding cyclic references that prevent efficient memory reclamation.`,
    `Classes define templates containing instance variables and member functions. When an object is instantiated, constructor chaining initializes the object graph.
Encapsulation protects fields using private specifiers, providing getters/setters with validation rules.
Abstraction allows high-level software layers to interact with objects using declarative method calls without understanding complex internal computations.
The primary constraint is maintaining state consistency across concurrent multi-threaded operations through synchronized or atomic access.`
  ]
};

async function generate100Copies() {
  await mongoose.connect(process.env.MONGO_URI);
  const Examination = require('../src/models/Examination');
  const Question = require('../src/models/Question');
  const QuestionPaper = require('../src/models/QuestionPaper');
  const AnswerCopy = require('../src/models/AnswerCopy');

  const exam = await Examination.findOne({ code: 'CS 305' });
  if (!exam) {
    console.error('Exam CS 305 not found!');
    process.exit(1);
  }

  const paper = await QuestionPaper.findById(exam.approvedQuestionPaper).populate('questions.question');
  if (!paper) {
    console.error('Approved question paper not found for CS 305!');
    process.exit(1);
  }

  console.log(`Found exam: ${exam.name} (${exam.code}) - ${exam.subject}`);
  console.log(`Approved paper: ${paper.paperTitle} with ${paper.questions.length} questions.`);

  // Remove any existing copies for CS 305 to ensure fresh clean batch of exactly 100
  const deleted = await AnswerCopy.deleteMany({ examination: exam._id });
  console.log(`Cleared ${deleted.deletedCount} previous copies for CS 305.`);

  const copiesToInsert = [];

  for (let i = 1; i <= 100; i++) {
    const padIndex = String(i).padStart(3, '0');
    const copyId = `SCAN-OOPS-${padIndex}`;
    const candidateRollNo = `2026-CS-OOPS-${padIndex}`;
    const firstName = firstNames[(i - 1) % firstNames.length];
    const lastName = lastNames[(i - 1) % lastNames.length];
    const candidateName = `${firstName} ${lastName}`;
    const bookletNumber = `BK-OOPS-${90000 + i}`;

    const answers = paper.questions.map((qItem, qIdx) => {
      const qNum = qItem.questionNumber || qIdx + 1;
      const qKey = `q${qNum}`;
      const templateList = answerTemplates[qKey] || answerTemplates.q1;
      const selectedTemplate = templateList[(i + qIdx) % templateList.length];

      return {
        question: qItem.question?._id || qItem.question,
        questionNumber: qNum,
        maxMarks: qItem.marks || 14,
        studentAnswer: selectedTemplate,
        evaluationStatus: 'PENDING'
      };
    });

    copiesToInsert.push({
      copyId,
      examination: exam._id,
      subject: exam.subject,
      candidateRollNo,
      candidateName,
      bookletNumber,
      scannedDocument: {
        fileName: `CS305_OOPS_${padIndex}_${candidateName.replace(/\s+/g, '_')}.pdf`,
        fileUrl: `/uploads/scanned/CS305_OOPS_${padIndex}.pdf`,
        fileType: 'application/pdf',
        fileSize: 2450000 + (i * 8500),
        scannedPages: [
          {
            pageNumber: 1,
            pageUrl: `/uploads/scanned/pages/CS305_${padIndex}_p1.jpg`,
            ocrText: `Examination: B.Tech CS 305 (OOPS)\nCandidate: ${candidateName} (${candidateRollNo})\nBooklet No: ${bookletNumber}\n\nQ1. Provide an in-depth evaluation of Layered Abstraction...\nAnswer:\n${answers[0]?.studentAnswer}`
          },
          {
            pageNumber: 2,
            pageUrl: `/uploads/scanned/pages/CS305_${padIndex}_p2.jpg`,
            ocrText: `Q2. Define Introduction and Protocols...\nAnswer:\n${answers[1]?.studentAnswer}\n\nQ3. Elaborate on Topic 1 scalability...\nAnswer:\n${answers[2]?.studentAnswer}`
          },
          {
            pageNumber: 3,
            pageUrl: `/uploads/scanned/pages/CS305_${padIndex}_p3.jpg`,
            ocrText: `Q4. Inheritance & Polymorphism lifecycle...\nAnswer:\n${answers[3]?.studentAnswer}\n\nQ5. Encapsulation & Abstraction pillars...\nAnswer:\n${answers[4]?.studentAnswer}`
          }
        ]
      },
      status: 'SCANNED',
      scanStatus: 'PROCESSED',
      scannedAt: new Date(Date.now() - (100 - i) * 120000), // staggered realistic timestamps
      answers,
      totalMaxMarks: exam.maxMarks || 70,
      evaluationStatus: 'SCANNED',
      evaluationMode: exam.evaluationMode || 'AI_EVALUATION'
    });
  }

  console.log(`Inserting 100 scanned copies into database...`);
  const inserted = await AnswerCopy.insertMany(copiesToInsert);
  console.log(`Successfully created ${inserted.length} scanned answer copies for OOPS!`);

  // Update Examination metadata
  exam.totalExpectedCopies = 100;
  exam.scanningStatus = 'SCANNING_COMPLETED';
  if (['DRAFT', 'SETTER_ASSIGNED', 'PAPER_APPROVED', 'SCHEDULED'].includes(exam.status)) {
    exam.status = 'SCANNING_COMPLETED';
  }
  await exam.save();
  console.log(`Updated Examination CS 305 status to: ${exam.status}, scanningStatus: ${exam.scanningStatus}, totalExpectedCopies: ${exam.totalExpectedCopies}`);

  process.exit(0);
}

generate100Copies().catch(err => {
  console.error('Error generating copies:', err);
  process.exit(1);
});
