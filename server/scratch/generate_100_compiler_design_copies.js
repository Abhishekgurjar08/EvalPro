const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const User = require('../src/models/User');
const Examination = require('../src/models/Examination');
const Syllabus = require('../src/models/Syllabus');
const Question = require('../src/models/Question');
const QuestionRubric = require('../src/models/QuestionRubric');
const QuestionPaper = require('../src/models/QuestionPaper');
const AnswerCopy = require('../src/models/AnswerCopy');

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

const answerTemplates = {
  q1: [
    `A compiler translates source code written in a high-level language into machine-readable target code through six fundamental phases:
1. Lexical Analysis (Scanner): Converts the raw character stream into a sequence of meaningful tokens (e.g. identifiers, operators, keywords). Whitespace and comments are stripped.
2. Syntax Analysis (Parser): Imposes hierarchical grammatical structure on the token stream by building a Parse Tree or Abstract Syntax Tree (AST) according to Context-Free Grammar rules.
3. Semantic Analysis: Checks for semantic consistency, type checking, scope validation, and type coercion (e.g., converting integer 60 into real 60.0).
4. Intermediate Code Generation (ICG): Generates an explicit, machine-independent low-level intermediate representation like Three-Address Code (TAC).
5. Code Optimization: Transforms the TAC to improve execution speed and reduce memory consumption (e.g., eliminating redundant calculations).
6. Target Code Generation: Maps the optimized intermediate representation into machine assembly instructions, utilizing hardware registers efficiently.

Example Trace for 'position = initial + rate * 60':
- Lexical: <id, 1> <=> <id, 2> <+> <id, 3> <*> <num, 60>
- Syntax: AST with root '=' having 'position' on left and '+' tree on right.
- Semantic: IntToFloat(60) inserted since rate is floating-point.
- ICG:
  t1 = inttofloat(60)
  t2 = id3 * t1
  t3 = id2 + t2
  id1 = t3
- Optimization: Precomputes constant expressions and minimizes temporary variable allocations.
- Target: Loads into registers R1, R2, performs MULTF and ADDF, and stores back to memory.
All phases communicate continuously with the Symbol Table Manager and Error Handling routines.`,

    `Compilation is structured into two main parts: Analysis (Front-End) and Synthesis (Back-End).
Front-End consists of:
- Lexical Analyzer: Reads source characters and outputs tokens: [id(position)], [assign_op], [id(initial)], [add_op], [id(rate)], [mul_op], [int_const(60)].
- Syntax Analyzer: Verifies syntax against CFG rules, detecting mismatched parentheses or missing operators, producing a Parse Tree.
- Semantic Analyzer: Validates data types and operand compatibilities. Converts 60 to floating-point 60.0 to match rate's type.
- Intermediate Code Generator: Produces Three-Address Code using temporaries:
  t1 = inttoreal(60)
  t2 = rate * t1
  t3 = initial + t2
  position = t3
Back-End consists of:
- Code Optimizer: Applies constant propagation and loop-invariant code motion.
- Code Generator: Assigns hardware registers (e.g., R0, R1) and generates assembly (LDF, MULF, ADDF, STF).
The Symbol Table stores identifier attributes (types, scopes, memory offsets), while the Error Handler reports syntactic and type errors with line numbers.`,

    `The six phases of compiler design are:
1. Lexical Analysis: Scans characters, generates tokens, inserts identifier entries into the symbol table.
2. Syntax Analysis: Groups tokens into grammatical phrases using context-free grammars, producing an Abstract Syntax Tree.
3. Semantic Analysis: Performs static type checking, array bound checks, and parameter matching. In 'position = initial + rate * 60', it inserts a widening conversion for 60 -> 60.0.
4. Intermediate Code Generation: Creates linear three-address code:
   t1 = inttofloat(60)
   t2 = id3 * t1
   t3 = id2 + t2
   id1 = t3
5. Code Optimization: Machine-independent transformation to reduce instructions and execution time.
6. Target Code Generation: Generates relocatable machine code or assembly with register allocation.
The Symbol Table Manager manages identifier bindings across all phases, and the Error Handler catches lexical, syntactical, and semantic discrepancies.`
  ],

  q2: [
    `Lexical Analysis (Scanning) forms the first phase of compilation. Its primary functions include:
- Reading source characters and grouping them into lexemes.
- Producing tokens of the form <token-name, attribute-value>.
- Stripping whitespaces, comments, and line breaks.
- Tracking source line numbers for precise error reporting.
- Interacting directly with the symbol table to store identifiers.

Converting Regular Expressions to DFA via NFA:
1. Regular Expression to NFA (Thompson's Construction):
   - Base cases: Epsilon transition for empty string, single state transition for any alphabet symbol 'a'.
   - Union (r1 | r2): Introduces a new initial and final state with epsilon transitions to both sub-automata.
   - Concatenation (r1 . r2): Merges final state of r1 with start state of r2.
   - Kleene Closure (r1*): Creates a loopback epsilon transition and a forward bypass epsilon transition.
2. NFA to DFA (Subset Construction Algorithm):
   - Computes ε-closure of starting state s0.
   - For each DFA state and each alphabet symbol 'a', computes ε-closure(Move(T, a)).
   - Newly discovered subsets form the distinct states of the DFA.
   - Any state containing an NFA accepting state becomes an accepting state in the DFA.
3. DFA Minimization (Hopcroft's Algorithm):
   - Partitions DFA states into accepting (F) and non-accepting (S - F) groups.
   - Iteratively splits groups based on distinguishable transitions until no further partitions can be made.`,

    `The Lexical Analyzer reads the source character buffer using two-pointer techniques (lexemeBegin and forward).
Definitions:
- Token: An abstract category (e.g., IF, IDENTIFIER, NUMBER).
- Pattern: The descriptive rule defining a token (e.g., [a-zA-Z][a-zA-Z0-9]*).
- Lexeme: The concrete character sequence in source code matching the pattern (e.g., 'totalSum').

Steps to convert Regular Expression to DFA:
Step 1: Thompson's Construction creates an equivalent Non-Deterministic Finite Automata (NFA) containing epsilon-moves. This ensures modular composition for operations like union (+), concatenation (.), and repetition (*).
Step 2: Subset Construction algorithm converts the ε-NFA to a Deterministic Finite Automata (DFA):
- ε-closure(s): Set of all NFA states reachable from state s on epsilon transitions alone.
- Transition: DTran[State_U, symbol_a] = ε-closure(move(State_U, symbol_a)).
- Marked states track processed subsets.
Step 3: Minimization combines equivalent states by checking 1-equivalence, 2-equivalence, leading to the minimal state DFA required for high-speed lexical scanning.`,

    `Role of Lexical Analysis:
The scanner simplifies the parser's task by translating variable-length character streams into fixed-length integer or enumerated token codes.
Conversion of RE to DFA:
1. Thompson's Construction:
   - For 'a': (0) --a--> (1)
   - For 'a|b': Fork with ε transitions into two parallel paths, reuniting at a common accepting state.
   - For 'a*': Loop with ε transitions allowing 0 or more repetitions.
2. Subset Construction:
   - Start state = ε-closure(start_NFA).
   - Construct transition table by evaluating all reachable state sets on inputs 'a' and 'b'.
   - Resulting deterministic state table has no ambiguous choices or ε-transitions.
3. State Minimization:
   - Eliminates redundant dead or equivalent states using equivalence partitioning, optimizing runtime lookup speed during lexical tokenization.`
  ],

  q3: [
    `Comparison: Top-Down vs Bottom-Up Parsing:
1. Top-Down Parsing:
   - Starts from the Start Symbol (S) and attempts to derive the input string by applying leftmost derivations.
   - Examples: Recursive Descent, Predictive LL(1) parsing.
   - Limitations: Cannot handle left recursion, requires left-factoring.
2. Bottom-Up Parsing:
   - Starts from the input token string and reduces it back to the Start Symbol using rightmost derivations in reverse (handle pruning).
   - Examples: Shift-Reduce, Operator Precedence, LR(0), SLR(1), LALR(1), CLR(1).
   - Capability: Handles a much wider class of grammars without requiring grammar transformations.

LL(1) Parsing Table Construction:
1. FIRST(α): Set of terminals that begin strings derived from α. If α =>* ε, then ε ∈ FIRST(α).
2. FOLLOW(A): Set of terminals that can appear immediately to the right of non-terminal A in any sentential form. Always place $ in FOLLOW(S).
3. Table Construction Rules:
   - For each production A -> α in the grammar:
     - For each terminal 'a' in FIRST(α), add A -> α to M[A, a].
     - If ε ∈ FIRST(α), then for each terminal 'b' in FOLLOW(A) (including $), add A -> α to M[A, b].
4. Condition for LL(1):
   A grammar is LL(1) if and only if for every production A -> α | β:
   - FIRST(α) ∩ FIRST(β) = ∅
   - At most one of α and β can derive ε.
   - If β =>* ε, then FIRST(α) ∩ FOLLOW(A) = ∅.
   If any cell in M[A, a] contains more than one production, the grammar is NOT LL(1) (conflict/ambiguity).`,

    `Top-Down vs Bottom-Up Parsing:
- Direction: Top-down expands from root to leaves (Leftmost Derivation); Bottom-up reduces leaves to root (Rightmost Derivation in reverse).
- Conflict Handling: Top-down suffers from backtrack dilemmas and left-recursion traps; Bottom-up uses shift-reduce and reduce-reduce state tables.
- Power: LR parsing (Bottom-up) is strictly more powerful than LL parsing (Top-down).

LL(1) Parser Design:
1. Calculate FIRST sets:
   - If X is terminal, FIRST(X) = {X}.
   - If X -> ε is production, ε ∈ FIRST(X).
   - If X is non-terminal, add FIRST of RHS symbols until a non-nullable symbol is reached.
2. Calculate FOLLOW sets:
   - Add $ to FOLLOW(StartSymbol).
   - If A -> αBβ, add (FIRST(β) - {ε}) to FOLLOW(B).
   - If A -> αB or A -> αBβ where β =>* ε, add FOLLOW(A) to FOLLOW(B).
3. LL(1) Parsing Table:
   Row indices are Non-Terminals, column indices are Terminals (and $).
   - Entry M[A, a] = A -> α for all a ∈ FIRST(α).
   - Entry M[A, b] = A -> α if ε ∈ FIRST(α) for all b ∈ FOLLOW(A).
If any entry contains multiple productions, the table has an LL(1) conflict, proving grammar ambiguity.`,

    `Parsing Techniques:
Top-Down parses from Start symbol S -> w using recursive predictive parsing. Bottom-up parses w -> S using stack-based shift-reduce actions.
LL(1) Table Creation:
- First 'L': Left-to-right scan of the input.
- Second 'L': Leftmost derivation.
- '1': One lookahead symbol.
Algorithm:
1. Compute FIRST sets for all grammar symbols.
2. Compute FOLLOW sets for all non-terminals.
3. Fill table M:
   - A -> α placed in M[A, a] for each a in FIRST(α).
   - If α is nullable, A -> α placed in M[A, b] for each b in FOLLOW(A).
Conditions for LL(1) compliance:
- No left-recursive rules (must be eliminated: A -> Aα | β becomes A -> βA', A' -> αA' | ε).
- Must be left-factored to prevent non-deterministic branch selection.
- All M[A, a] cells must contain exactly at most one production rule.`
  ],

  q4: [
    `Syntax-Directed Translation (SDT) is a formal mechanism that augments Context-Free Grammar productions with semantic actions and attributes, allowing intermediate code generation, type checking, and symbol table management during parsing.

Attributes are categorized into two types:
1. Synthesized Attributes:
   - Value is computed from the attribute values of its children in the parse tree.
   - S-Attributed definitions rely exclusively on synthesized attributes.
   - Can be naturally evaluated during bottom-up parsing using a post-order traversal or directly during LR parsing on the parse stack.
2. Inherited Attributes:
   - Value is computed from the attribute values of its parents or siblings.
   - L-Attributed definitions allow inherited attributes, with the restriction that attributes can only depend on inherited attributes of the parent or attributes of symbols to the left in the production.

Three-Address Code (TAC) for 'a = b * -c + b * -c':
1. TAC linear representation:
   t1 = uminus c
   t2 = b * t1
   t3 = uminus c
   t4 = b * t3
   t5 = t2 + t4
   a = t5

2. Quadruple Representation: (Operator, Argument 1, Argument 2, Result)
   (0) uminus, c, -, t1
   (1) *, b, t1, t2
   (2) uminus, c, -, t3
   (3) *, b, t3, t4
   (4) +, t2, t4, t5
   (5) =, t5, -, a

3. Triple Representation: (Operator, Argument 1, Argument 2) using instruction index references:
   (0) uminus, c, -
   (1) *, b, (0)
   (2) uminus, c, -
   (3) *, b, (2)
   (4) +, (1), (3)
   (5) =, a, (4)`,

    `Syntax-Directed Translation (SDT) binds semantic actions { code } to CFG production rules:
Example: E -> E1 + T { E.val = E1.val + T.val }

Classification:
- S-Attributed SDD: Contains only synthesized attributes. Can be evaluated during bottom-up shift-reduce parsing without additional traversals.
- L-Attributed SDD: Allows both synthesized and inherited attributes, provided dependencies flow strictly from left to right (parent or left siblings). Evaluated in a single depth-first, left-to-right pass.

Three-Address Code Generation for: a = b * -c + b * -c
TAC:
t1 = minus c
t2 = b * t1
t3 = minus c
t4 = b * t3
t5 = t2 + t4
a = t5

Quadruples Table:
| Index | Op | Arg1 | Arg2 | Result |
| (0) | uminus | c | | t1 |
| (1) | * | b | t1 | t2 |
| (2) | uminus | c | | t3 |
| (3) | * | b | t3 | t4 |
| (4) | + | t2 | t4 | t5 |
| (5) | assign | t5 | | a |

Triples Table:
| Index | Op | Arg1 | Arg2 |
| (0) | uminus | c | |
| (1) | * | b | (0) |
| (2) | uminus | c | |
| (3) | * | b | (2) |
| (4) | + | (1) | (3) |
| (5) | assign | a | (4) |`,

    `Syntax-Directed Translation couples syntactic grammar with semantic evaluation.
S-Attributed Definitions:
- Evaluated bottom-up.
- Nodes calculate their attributes purely from child node attributes.
L-Attributed Definitions:
- Evaluated top-down and left-to-right.
- Enables inherited attributes for type propagation across variable declarations.

Three-Address Code for a = b * -c + b * -c:
t1 = - c
t2 = b * t1
t3 = - c
t4 = b * t3
t5 = t2 + t4
a = t5

Quadruple representation stores explicit temporary names:
[0] uminus, c, null, t1
[1] mult, b, t1, t2
[2] uminus, c, null, t3
[3] mult, b, t3, t4
[4] add, t2, t4, t5
[5] copy, t5, null, a

Triple representation avoids temporaries by referencing array indices:
[0] uminus, c, null
[1] mult, b, (0)
[2] uminus, c, null
[3] mult, b, (2)
[4] add, (1), (3)
[5] assign, a, (4)`
  ],

  q5: [
    `Code Optimization is the compiler phase that improves intermediate code so that the resulting machine code runs faster, uses fewer memory resources, and consumes less energy, without altering program semantics.

1. Basic Blocks and Flow Graphs:
   - A Basic Block is a sequence of consecutive Three-Address statements where control enters strictly at the beginning and leaves strictly at the end without halting or branching except at the final statement.
   - Determining Leaders: First statement, target of any conditional/unconditional jump, and statement immediately following a jump.
   - Flow Graph connects basic blocks with directed edges representing runtime control flow.

2. Machine-Independent Optimization Techniques:
   a. Common Subexpression Elimination (CSE):
      If an expression E was previously computed and values of variables in E have not changed since, the previous result is reused.
      Example:
      t1 = 4 * i; x = a[t1]; t2 = 4 * i; y = b[t2]
      Optimized:
      t1 = 4 * i; x = a[t1]; y = b[t1]  (eliminates recalculation of 4 * i).
   b. Loop Invariant Code Motion:
      Statements inside a loop whose operands never change during loop iterations are hoisted out of the loop header.
      Example:
      while (i < n) { x = y + z; a[i] = x * i; i++; }
      Optimized:
      temp = y + z; while (i < n) { a[i] = temp * i; i++; }
   c. Dead Code Elimination:
      Removes statements whose computed results are never referenced or used anywhere in the subsequent program execution.
      Example:
      debug = 0; if (debug) { printStats(); } -> removed completely.
   d. Strength Reduction:
      Replaces computationally expensive operations with cheaper ones, such as replacing 'x = i * 4' in a loop with cumulative addition 'x = x + 4'.`,

    `The goal of code optimization is to preserve program semantics while maximizing runtime performance.
Basic Blocks:
Statements are partitioned into maximal sequences of linear instructions with single-entry and single-exit properties. A Control Flow Graph (CFG) links these blocks.

Major Optimizations:
1. Common Subexpression Elimination:
   Identifies duplicate computations within a basic block (Local CSE) or across multiple blocks (Global CSE using available expressions data-flow analysis).
   Before:
   t1 = x + y
   t2 = z * 2
   t3 = x + y  --> Replace t3 with t1.
2. Loop Optimization:
   - Code Motion: Moves invariant calculations outside the loop pre-header.
   - Induction Variable Elimination & Strength Reduction: Replaces multiplication with incremental addition within iterative counters.
3. Dead Code Elimination:
   Detects unreachable basic blocks or dead assignments where variable values are never live in any successor block.
4. Constant Folding & Propagation:
   Replaces constant expressions at compile-time (e.g., radius = 2 * 3.1415 * r becomes radius = 6.283 * r).`,

    `Code optimization transforms intermediate representation to improve resource efficiency.
Key Machine-Independent Optimizations:
1. Basic Block Formation:
   - Leaders: Statement 1, any target of GOTO/IF, and statement following GOTO/IF.
   - A block extends from a leader up to the statement preceding the next leader.
2. Common Subexpression Elimination:
   Reuses previously computed values instead of recalculating identical expressions whose operands have remained unchanged.
3. Loop-Invariant Code Hoisting:
   Computations that evaluate to the same value on every loop iteration are hoisted before the loop entry.
4. Dead Code Elimination:
   Statements that compute variables that are never read or reachable blocks are safely pruned.
5. Algebraic Transformations & Strength Reduction:
   Replaces expensive multiplication/division with shift operations or repeated addition (e.g. x * 2 -> x << 1).`
  ]
};

async function generate100CompilerDesignCopies() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/exam_eval_system';
  console.log(`Connecting to MongoDB at: ${mongoUri}...`);
  await mongoose.connect(mongoUri);

  // 1. Locate or verify Examination for Compiler Design
  let exam = await Examination.findOne({
    $or: [{ code: 'CS 802' }, { subject: /compiler design/i }]
  });

  const adminUser = await User.findOne({ role: 'ADMIN' });
  const setterUser = await User.findOne({ role: 'EXAM_SETTER' }) || adminUser;

  if (!exam) {
    console.log('Compiler Design exam not found, creating new Examination record...');
    exam = await Examination.create({
      name: 'B.Tech Semester VIII Final Examination',
      code: 'CS 802',
      session: '2025-2026',
      course: 'B.Tech',
      semester: 8,
      subject: 'Compiler Design',
      examDate: new Date(),
      startTime: '10:00 AM',
      durationMinutes: 120,
      maxMarks: 50,
      passingMarks: 20,
      description: 'Comprehensive examination covering Phases of Compilers, Lexical Analysis, Top-Down/Bottom-Up Parsing, SDT, Intermediate Code Generation, and Code Optimization.',
      instructions: [
        'Attempt all 5 questions. Each question carries 10 marks.',
        'Draw clear block diagrams, automata state diagrams, and derivation trees where requested.',
        'Use standard Three-Address Code and parsing table notation.'
      ],
      status: 'SCANNING_COMPLETED',
      scanningStatus: 'SCANNING_COMPLETED',
      totalExpectedCopies: 100,
      evaluationMode: 'AI_EVALUATION',
      assignedSetter: setterUser._id,
      createdBy: adminUser._id
    });
  } else {
    console.log(`Found existing exam: ${exam.name} (${exam.code}) - ${exam.subject}`);
    exam.maxMarks = 50;
    exam.passingMarks = 20;
    exam.totalExpectedCopies = 100;
    exam.scanningStatus = 'SCANNING_COMPLETED';
    exam.evaluationMode = 'AI_EVALUATION';
    if (['DRAFT', 'SETTER_ASSIGNED', 'PAPER_APPROVED', 'SCHEDULED', 'NOT_STARTED'].includes(exam.status)) {
      exam.status = 'SCANNING_COMPLETED';
    }
    await exam.save();
  }

  // 2. Ensure Syllabus exists
  let syllabus = await Syllabus.findOne({ examination: exam._id });
  if (!syllabus) {
    syllabus = await Syllabus.create({
      examination: exam._id,
      subject: 'Compiler Design',
      units: [
        {
          unitNumber: 1,
          title: 'Introduction to Compilers & Lexical Analysis',
          description: 'Phases of compilation, scanner buffering, regular expressions, and finite automata.',
          topics: [
            { topicNumber: 1, title: 'Phases of a Compiler', description: 'Analysis and synthesis models, symbol table management' },
            { topicNumber: 2, title: 'Lexical Analysis & Automata', description: 'Tokens, Thompson construction, and subset construction' }
          ]
        },
        {
          unitNumber: 2,
          title: 'Syntax Analysis & Parsing',
          description: 'Context-free grammars, top-down predictive parsing, bottom-up shift-reduce parsing.',
          topics: [
            { topicNumber: 1, title: 'Top-Down Parsing & LL(1)', description: 'FIRST/FOLLOW sets, predictive parsing tables' },
            { topicNumber: 2, title: 'Bottom-Up Parsing & LR Parsers', description: 'Shift-reduce conflicts, SLR, LALR, and CLR parsers' }
          ]
        },
        {
          unitNumber: 3,
          title: 'Semantic Analysis & Intermediate Code Generation',
          description: 'Syntax-directed definitions, attribute grammars, three-address representations.',
          topics: [
            { topicNumber: 1, title: 'Syntax-Directed Translation', description: 'S-attributed and L-attributed definitions' },
            { topicNumber: 2, title: 'Three-Address Code', description: 'Quadruples, triples, and indirect triples' }
          ]
        },
        {
          unitNumber: 4,
          title: 'Code Optimization & Generation',
          description: 'Basic blocks, flow graphs, machine-independent optimizations, target code generation.',
          topics: [
            { topicNumber: 1, title: 'Basic Blocks & Flow Graphs', description: 'Leader identification and control flow analysis' },
            { topicNumber: 2, title: 'Principal Sources of Optimization', description: 'Common subexpressions, loop motion, dead code elimination' }
          ]
        }
      ],
      createdBy: setterUser._id
    });
    console.log('Created comprehensive Syllabus for Compiler Design.');
  }

  // 3. Ensure 5 Questions with Rubrics exist (10 marks each = 50 total marks)
  let questions = await Question.find({ examination: exam._id, subject: exam.subject });
  if (questions.length < 5) {
    console.log('Creating 5 standard Questions and Marking Rubrics for Compiler Design...');
    await Question.deleteMany({ examination: exam._id });

    // Q1
    const q1 = await Question.create({
      subject: exam.subject,
      examination: exam._id,
      unit: 'Unit 1',
      topic: 'Phases of a Compiler',
      questionText: 'Explain the various phases of a compiler with a neat block diagram. Illustrate how each phase processes the statement: position = initial + rate * 60.',
      questionType: 'DESCRIPTIVE',
      marks: 10,
      difficulty: 'MEDIUM',
      expectedAnswer: 'A compiler translates high-level code to target machine instructions through 6 sequential phases: Lexical Analysis, Syntax Analysis, Semantic Analysis, Intermediate Code Generation, Code Optimization, and Target Code Generation. For position = initial + rate * 60, Lexical produces token stream; Syntax generates Parse/AST tree; Semantic checks types and coerces 60 to 60.0; ICG produces TAC with temporaries t1, t2, t3; Optimization reduces redundant computations; and Target Code Gen maps TAC to machine assembly instructions with register allocation.',
      createdBy: setterUser._id
    });
    const r1 = await QuestionRubric.create({
      question: q1._id,
      maxMarks: 10,
      criteria: [
        { name: 'Phase Identification & Architecture', description: 'Accurate description of all 6 phases and roles of Symbol Table and Error Handler.', maxMarks: 4, keywords: ['Lexical', 'Syntax', 'Semantic', 'Intermediate', 'Optimization', 'Code Generation', 'Symbol Table'] },
        { name: 'Expression Trace (Step-by-Step)', description: 'Correct trace of tokens, AST, type coercion, and TAC for position = initial + rate * 60.', maxMarks: 4, keywords: ['tokens', 'Parse Tree', '60.0', 't1', 't2', 't3', 'Three-Address Code'] },
        { name: 'Technical Clarity & Structure', description: 'Neat formatting, correct technical terminology, and diagrammatic clarity.', maxMarks: 2, keywords: ['diagram', 'front-end', 'back-end'] }
      ],
      createdBy: setterUser._id
    });
    q1.rubric = r1._id;
    await q1.save();

    // Q2
    const q2 = await Question.create({
      subject: exam.subject,
      examination: exam._id,
      unit: 'Unit 1',
      topic: 'Lexical Analysis & Automata',
      questionText: 'Discuss the role of Lexical Analysis. Explain the conversion of Regular Expression to Deterministic Finite Automata (DFA) via NFA using Thomson construction and subset construction.',
      questionType: 'DESCRIPTIVE',
      marks: 10,
      difficulty: 'MEDIUM',
      expectedAnswer: 'Lexical analysis scans characters into tokens, strips whitespace/comments, and populates the symbol table. Conversion from RE to DFA follows two steps: 1. Thompson construction generates an equivalent ε-NFA for union, concatenation, and closure. 2. Subset construction computes ε-closure and transition tables over input symbols to eliminate non-determinism, yielding a deterministic DFA. Finally, DFA minimization merges equivalent states.',
      createdBy: setterUser._id
    });
    const r2 = await QuestionRubric.create({
      question: q2._id,
      maxMarks: 10,
      criteria: [
        { name: 'Role of Lexical Analyzer & Token Concepts', description: 'Explanation of token, pattern, lexeme, and buffer management.', maxMarks: 3, keywords: ['token', 'lexeme', 'pattern', 'buffering', 'symbol table'] },
        { name: 'Thompson Construction (RE to NFA)', description: 'Rules for base symbol, union (|), concatenation (.), and Kleene closure (*).', maxMarks: 3, keywords: ['Thompson', 'epsilon', 'NFA', 'transitions'] },
        { name: 'Subset Construction & Minimization', description: 'Mathematical definition of ε-closure, DTran calculation, and state minimization.', maxMarks: 4, keywords: ['subset construction', 'epsilon-closure', 'DFA', 'minimization', 'Hopcroft'] }
      ],
      createdBy: setterUser._id
    });
    q2.rubric = r2._id;
    await q2.save();

    // Q3
    const q3 = await Question.create({
      subject: exam.subject,
      examination: exam._id,
      unit: 'Unit 2',
      topic: 'Top-Down Parsing & LL(1)',
      questionText: 'Differentiate between Top-Down and Bottom-Up parsing techniques. Explain the construction of an LL(1) parsing table and conditions for a grammar to be LL(1).',
      questionType: 'DESCRIPTIVE',
      marks: 10,
      difficulty: 'HARD',
      expectedAnswer: 'Top-down parsing constructs parse trees from root to leaves using leftmost derivation, while bottom-up parsing reduces leaves to root using rightmost derivation in reverse (shift-reduce). An LL(1) parser uses 1 lookahead symbol. Table construction uses FIRST and FOLLOW sets. A grammar is LL(1) if for every A -> α | β: FIRST(α) and FIRST(β) are disjoint, at most one derives ε, and if β derives ε, FIRST(α) and FOLLOW(A) are disjoint.',
      createdBy: setterUser._id
    });
    const r3 = await QuestionRubric.create({
      question: q3._id,
      maxMarks: 10,
      criteria: [
        { name: 'Top-Down vs Bottom-Up Comparison', description: 'Clear tabular comparison of derivation direction, power, and conflict types.', maxMarks: 3, keywords: ['leftmost', 'rightmost', 'shift-reduce', 'backtracking'] },
        { name: 'FIRST & FOLLOW Set Computation', description: 'Precise definitions and algorithmic rules for computing FIRST and FOLLOW.', maxMarks: 3, keywords: ['FIRST', 'FOLLOW', 'nullable', 'end-marker $'] },
        { name: 'LL(1) Table Construction & Disjoint Conditions', description: 'M[A, a] population rules and conflict-free criteria.', maxMarks: 4, keywords: ['LL(1) table', 'disjoint', 'no multiple entries', 'left-recursion elimination'] }
      ],
      createdBy: setterUser._id
    });
    q3.rubric = r3._id;
    await q3.save();

    // Q4
    const q4 = await Question.create({
      subject: exam.subject,
      examination: exam._id,
      unit: 'Unit 3',
      topic: 'Syntax-Directed Translation',
      questionText: 'What is Syntax-Directed Translation (SDT)? Differentiate between S-attributed and L-attributed definitions. Generate Three-Address Code (Quadruples and Triples) for: a = b * -c + b * -c.',
      questionType: 'DESCRIPTIVE',
      marks: 10,
      difficulty: 'MEDIUM',
      expectedAnswer: 'Syntax-Directed Translation associates semantic actions with grammar productions. S-attributed definitions use only synthesized attributes evaluated bottom-up. L-attributed definitions permit inherited attributes evaluated in a left-to-right depth-first pass. For a = b * -c + b * -c, TAC: t1 = -c, t2 = b * t1, t3 = -c, t4 = b * t3, t5 = t2 + t4, a = t5. Quadruples use (op, arg1, arg2, result) and Triples use (op, arg1, arg2) with index references.',
      createdBy: setterUser._id
    });
    const r4 = await QuestionRubric.create({
      question: q4._id,
      maxMarks: 10,
      criteria: [
        { name: 'SDT Concept & S-Attributed vs L-Attributed', description: 'Synthesized vs inherited attributes and parse tree evaluation order.', maxMarks: 3, keywords: ['synthesized', 'inherited', 'S-attributed', 'L-attributed', 'bottom-up'] },
        { name: 'Three-Address Code Generation', description: 'Correct TAC sequence with temporaries for the given arithmetic expression.', maxMarks: 3, keywords: ['t1', 't2', 't3', 'uminus', 'Three-Address Code'] },
        { name: 'Quadruples & Triples Representation', description: 'Correct tabular representation of Quadruples (with result) and Triples (with pointer indices).', maxMarks: 4, keywords: ['quadruples', 'triples', 'op', 'arg1', 'arg2', 'result'] }
      ],
      createdBy: setterUser._id
    });
    q4.rubric = r4._id;
    await q4.save();

    // Q5
    const q5 = await Question.create({
      subject: exam.subject,
      examination: exam._id,
      unit: 'Unit 4',
      topic: 'Code Optimization',
      questionText: 'Explain the principal sources of Code Optimization. Describe machine-independent optimizations including Common Subexpression Elimination, Loop Invariant Code Motion, and Dead Code Elimination with examples.',
      questionType: 'DESCRIPTIVE',
      marks: 10,
      difficulty: 'MEDIUM',
      expectedAnswer: 'Code optimization enhances performance without altering semantic correctness. Basic blocks are maximal sequences of instructions with single entry and exit. Machine-independent optimizations include: 1. Common Subexpression Elimination: avoiding redundant re-evaluations. 2. Loop Invariant Code Motion: hoisting loop-invariant computations out of loop bodies. 3. Dead Code Elimination: removing unreachable or unused statements. 4. Strength Reduction: replacing expensive operations like multiplication with additions.',
      createdBy: setterUser._id
    });
    const r5 = await QuestionRubric.create({
      question: q5._id,
      maxMarks: 10,
      criteria: [
        { name: 'Basic Blocks & Flow Graph Concepts', description: 'Leader identification rules and control flow graph construction.', maxMarks: 3, keywords: ['Basic Block', 'Leader', 'Control Flow Graph', 'Edges'] },
        { name: 'Machine-Independent Optimization Techniques', description: 'Detailed explanation of CSE, Loop Invariant Motion, and Dead Code Elimination.', maxMarks: 4, keywords: ['Common Subexpression', 'Loop Invariant', 'Code Motion', 'Dead Code'] },
        { name: 'Concrete Code Examples & Strength Reduction', description: 'Before and after transformation examples with clarity.', maxMarks: 3, keywords: ['strength reduction', 'constant folding', 'propagation'] }
      ],
      createdBy: setterUser._id
    });
    q5.rubric = r5._id;
    await q5.save();

    questions = [q1, q2, q3, q4, q5];
  }

  // 4. Ensure Approved QuestionPaper exists
  let paper = await QuestionPaper.findOne({ examination: exam._id, status: 'APPROVED' });
  if (!paper) {
    paper = await QuestionPaper.create({
      examination: exam._id,
      paperTitle: 'B.Tech CS 802 - Compiler Design End Semester Examination',
      totalMarks: 50,
      instructions: [
        'Attempt all 5 questions. Each question carries 10 marks.',
        'Draw clear block diagrams, automata state diagrams, and derivation trees where requested.',
        'Use standard Three-Address Code and parsing table notation.'
      ],
      questions: questions.map((q, idx) => ({
        question: q._id,
        questionNumber: idx + 1,
        marks: q.marks || 10,
        customInstruction: ''
      })),
      status: 'APPROVED',
      submittedBy: setterUser._id,
      submittedAt: new Date(Date.now() - 48 * 3600000),
      reviewedBy: adminUser._id,
      reviewedAt: new Date(Date.now() - 24 * 3600000),
      approvalHistory: [
        {
          action: 'APPROVED',
          performedBy: adminUser._id,
          date: new Date(Date.now() - 24 * 3600000),
          comments: 'Paper structure and rubrics verified and approved.'
        }
      ]
    });
    console.log('Created and Approved QuestionPaper for Compiler Design.');
  }

  exam.approvedQuestionPaper = paper._id;
  await exam.save();

  // 5. Generate exactly 100 Scanned Answer Copies
  // Clear any existing copies for Compiler Design to ensure a clean 100-copy batch
  const delRes = await AnswerCopy.deleteMany({ examination: exam._id });
  console.log(`Cleared ${delRes.deletedCount} prior copies for Compiler Design.`);

  const copiesToInsert = [];
  const now = Date.now();

  for (let i = 1; i <= 100; i++) {
    const padIndex = String(i).padStart(3, '0');
    const copyId = `SCAN-CD-${padIndex}`;
    const candidateRollNo = `2026-CS-CD-${padIndex}`;
    const firstName = firstNames[(i - 1) % firstNames.length];
    const lastName = lastNames[(i - 1) % lastNames.length];
    const candidateName = `${firstName} ${lastName}`;
    const bookletNumber = `BK-CD-${80000 + i}`;

    const answers = questions.map((qObj, qIdx) => {
      const qNum = qIdx + 1;
      const qKey = `q${qNum}`;
      const templateList = answerTemplates[qKey] || answerTemplates.q1;
      const selectedTemplate = templateList[(i + qIdx) % templateList.length];

      return {
        question: qObj._id,
        questionNumber: qNum,
        maxMarks: qObj.marks || 10,
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
        fileName: `CS802_Compiler_Design_${padIndex}_${candidateName.replace(/\s+/g, '_')}.pdf`,
        fileUrl: `/uploads/scanned/CS802_CD_${padIndex}.pdf`,
        fileType: 'application/pdf',
        fileSize: 2280000 + (i * 7400),
        scannedPages: [
          {
            pageNumber: 1,
            pageUrl: `/uploads/scanned/pages/CS802_${padIndex}_p1.jpg`,
            ocrText: `Examination: B.Tech CS 802 (Compiler Design)\nCandidate: ${candidateName} (${candidateRollNo})\nBooklet No: ${bookletNumber}\n\nQ1. Explain the various phases of a compiler with a block diagram...\nCandidate Response:\n${answers[0]?.studentAnswer}\n\nQ2. Role of Lexical Analysis and RE to DFA conversion...\nCandidate Response:\n${answers[1]?.studentAnswer}`
          },
          {
            pageNumber: 2,
            pageUrl: `/uploads/scanned/pages/CS802_${padIndex}_p2.jpg`,
            ocrText: `Q3. Differentiate between Top-Down and Bottom-Up parsing & LL(1) Table...\nCandidate Response:\n${answers[2]?.studentAnswer}\n\nQ4. Syntax-Directed Translation & Three-Address Code generation...\nCandidate Response:\n${answers[3]?.studentAnswer}`
          },
          {
            pageNumber: 3,
            pageUrl: `/uploads/scanned/pages/CS802_${padIndex}_p3.jpg`,
            ocrText: `Q5. Principal sources of Code Optimization & Basic Blocks...\nCandidate Response:\n${answers[4]?.studentAnswer}`
          }
        ]
      },
      status: 'SCANNED',
      scanStatus: 'PROCESSED',
      scannedAt: new Date(now - (100 - i) * 90000), // staggered realistic scan times
      answers,
      totalMaxMarks: exam.maxMarks || 50,
      evaluationStatus: 'SCANNED',
      evaluationMode: 'AI_EVALUATION'
    });
  }

  console.log(`Inserting 100 scanned answer copies for Compiler Design...`);
  const inserted = await AnswerCopy.insertMany(copiesToInsert);
  console.log(` Successfully inserted ${inserted.length} scanned answer copies!`);

  // Update Exam metadata
  exam.totalExpectedCopies = 100;
  exam.scanningStatus = 'SCANNING_COMPLETED';
  if (['DRAFT', 'SETTER_ASSIGNED', 'PAPER_APPROVED', 'SCHEDULED', 'NOT_STARTED'].includes(exam.status)) {
    exam.status = 'SCANNING_COMPLETED';
  }
  await exam.save();

  console.log(` Examination '${exam.name}' (${exam.code}) updated:`);
  console.log(`   - Status: ${exam.status}`);
  console.log(`   - Scanning Status: ${exam.scanningStatus}`);
  console.log(`   - Total Expected Copies: ${exam.totalExpectedCopies}`);
  console.log(`   - Total Inserted Copies: ${inserted.length}`);

  process.exit(0);
}

generate100CompilerDesignCopies().catch((err) => {
  console.error(' Error generating Compiler Design copies:', err);
  process.exit(1);
});
