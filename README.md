# Pariksha AI - Complete MERN Examination Management & Answer Evaluation System

A scalable, production-grade **Examination Management and Answer Evaluation System** built strictly on the **MERN (MongoDB, Express.js, React.js, Node.js)** stack.

Pariksha AI provides a complete digital academic lifecycle: from examination scheduling and setter appointments, through syllabus, question bank, and rubric creation, to live online test conduct, manual/digital evaluation, and **AI-assisted question-wise grading with human evaluator oversight**.

---

## 1. Core Architectural Highlights

- **Complete MERN Stack**: Strictly MongoDB, Express.js, React.js (Vite), and Node.js.
- **Strict Role-Based Authorization (RBAC)**: Distinct permissions and isolated interfaces for `ADMIN`, `EXAM_SETTER`, `EVALUATOR`, and `STUDENT`.
- **4-Tier Backend Architecture**: `Routes → Controllers → Services → Models` with validation, centralized error handling, and audit logging.
- **Question-Specific Marking Rubrics**: Strict schema validation ensuring rubric criteria sum does not exceed the question's maximum marks.
- **Dual-Mode AI Evaluation Engine**: Provider abstraction supporting Google Gemini / OpenAI APIs with a built-in semantic heuristic rubric engine for local offline execution.
- **Separation of AI Suggestions & Evaluator Final Marks**: AI assists the human evaluator rather than blindly replacing them. AI recommendations and human overrides are stored separately for institutional auditing.
- **Official Result Publication Flow**: Results remain hidden from students until authorized and released by the examination administration.

---

## 2. Mandatory User Roles

| Role | Primary Responsibilities | Default Credentials |
| :--- | :--- | :--- |
| **ADMIN** | Overall system administration, exam creation, setter assignment, paper approvals, copy assignment, result publishing, audit logs, and reports. | `admin@example.com` / `Admin@123` |
| **EXAM_SETTER** | Syllabus creation (Units & Topics), Question bank curation, Question-specific rubrics, Marks blueprint, Question paper generation and submission. | `setter@example.com` / `Setter@123` |
| **EVALUATOR** | Subject-specialized answer copy checking, question-wise manual / digital / AI-assisted grading, rubric scoring, draft saving, and final evaluation. | `evaluator@example.com` / `Evaluator@123` |
| **STUDENT** | Browsing scheduled exams, distraction-free testing session with live countdown and autosave, submission tracking, and marksheet inspection. | `student@example.com` / `Student@123` |

---

## 3. End-to-End Supported Workflows

```
ADMIN
  ↓
Create Examination
  ↓
Assign Exam Setter
  ↓
EXAM SETTER
  ↓
Accept Assignment
  ↓
Create Syllabus (Units & Topics)
  ↓
Create Question Bank & Marking Rubrics
  ↓
Create Marks Blueprint (Validates sum == Max Marks)
  ↓
Create Question Paper & Arrange Questions
  ↓
Submit Question Paper for Approval
  ↓
ADMIN
  ↓
Review Question Paper (Approve / Reject with Reason)
  ↓
STUDENT
  ↓
Start Live Examination (Timer, Autosave, Question Palette)
  ↓
Submit Examination → Digital Answer Copy Created
  ↓
ADMIN
  ↓
Allocate Answer Copies to Qualified Subject Evaluator
  ↓
EVALUATOR
  ↓
Open Answer Copy (Manual / Digital / AI-Assisted Mode)
  ↓
[AI-ASSISTED]: Run AI Evaluation → Receive Suggested Score + Criteria Feedback
  ↓
Evaluator Review → Accept Suggestion OR Override with Final Marks
  ↓
Save Draft / Submit Final Evaluation
  ↓
RESULT GENERATION (Backend computes total marks, percentage, grade)
  ↓
ADMIN REVIEW & OFFICIAL PUBLICATION
  ↓
STUDENT VIEWS PUBLISHED MARKSHEET & EXAMINER REMARKS
```

---

## 4. Directory Structure

```text
Hackathon Project/
│
├── client/                     # React.js Frontend (Vite + Tailwind CSS)
│   ├── src/
│   │   ├── components/         # Reusable UI (Navbar, Sidebar, Modal, Badge, StatCard, etc.)
│   │   ├── context/            # AuthContext, ToastContext
│   │   ├── layouts/            # DashboardLayout, ProtectedRoute
│   │   ├── pages/
│   │   │   ├── auth/           # Login with quick role switcher
│   │   │   ├── admin/          # Dashboard, Exams, Setters, Evaluators, Copy Assignment, Papers, Results, Reports, Audit
│   │   │   ├── setter/         # Dashboard, MyExams, Syllabus, QuestionBank, PaperBuilder
│   │   │   ├── evaluator/      # Dashboard, AssignedCopies, EvaluationWorkspace, History
│   │   │   └── student/        # Dashboard, AvailableExams, LiveExamSession, MyAttempts, Results
│   │   ├── routes/             # AppRoutes, ProtectedRoute
│   │   ├── services/           # api.js (Axios instance with Bearer interceptor)
│   │   ├── App.jsx
│   │   ├── index.css           # Glassmorphism, Tailwind, Dark mode
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── server/                     # Node.js + Express.js Backend
│   ├── src/
│   │   ├── config/             # db.js (Mongoose connection)
│   │   ├── controllers/        # Controllers for all resources
│   │   ├── middleware/         # authMiddleware (JWT + RBAC), errorHandler
│   │   ├── models/             # 17 Mongoose Schemas (User, Examination, Question, Rubric, etc.)
│   │   ├── routes/             # RESTful API routes
│   │   ├── services/           # aiEvaluationService, resultService, auditService, notificationService
│   │   ├── utils/              # seedData.js
│   │   └── index.js            # Express server entry point
│   ├── testWorkflow.js         # Automated end-to-end integration test suite
│   ├── package.json
│   └── .env                    # Environment configuration
│
├── README.md
└── .env.example
```

---

## 5. Technology Stack

### Backend
- **Node.js**: v26 runtime
- **Express.js**: v4 REST API framework
- **MongoDB & Mongoose**: v8 ODM with schema validations and indexes
- **JSON Web Tokens (JWT)**: Stateless authentication with bearer header tokens
- **bcryptjs**: Password hashing (salt rounds: 10)
- **CORS**: Cross-Origin Resource Sharing configuration

### Frontend
- **React.js**: v18.3 functional components & hooks
- **Vite**: Ultra-fast bundler with Hot Module Replacement
- **Tailwind CSS**: Modern custom utility styling with curated dark palette
- **React Router**: v6 declarative routing with protected role gates
- **Axios**: HTTP client with request and response interceptors
- **Lucide React**: Clean enterprise iconography

---

## 6. Setup & Execution Instructions

### Prerequisites
1. **Node.js** (v18+) and **npm**
2. **MongoDB** service running locally on `mongodb://127.0.0.1:27017`

### 1. Backend Setup
```bash
cd server
npm install
```

Configure `server/.env` (or copy from `.env.example`):
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/exam_eval_system
JWT_SECRET=super_secret_production_jwt_key_exam_eval_2026
AI_PROVIDER=smart_heuristic
AI_API_KEY=
AI_MODEL=gemini-1.5-pro
CLIENT_URL=http://localhost:5173
```

### 2. Seed the Database
Populate realistic examinations, syllabi, questions with rubrics, exam papers, answer copies, and evaluations:
```bash
npm run seed
```

### 3. Start the Backend Server
```bash
npm start
# Server runs on http://localhost:5000
```

### 4. Client Setup & Launch
In a new terminal:
```bash
cd client
npm install
npm run dev
# Vite runs on http://localhost:5173
```

### 5. Automated End-to-End Test Suite
To execute the automated script testing all 5 core workflows:
```bash
cd server
node testWorkflow.js
```

---

## 7. Google Gemini AI Integration

Pariksha AI integrates the official **Google Gemini AI** SDK (`@google/generative-ai`) inside a dedicated service layer (`server/src/services/geminiService.js`) for two major examination capabilities:

### 1. AI Question Paper Generation from Syllabus
* **Workflow**: After the Paper Setter saves the Syllabus (Units & Topics), the system provides two clear paths:
  * `Create Paper Manually`
  * `Generate Paper with AI`
* **Intelligent Configuration Ingestion**: When "Generate Paper with AI" is chosen, Gemini receives the full academic context:
  * Examination name, subject code, and subject title
  * Complete Syllabus units and topics
  * Configured total marks and total question count
  * Existing blueprint/structure (marks per question, difficulty distribution)
* **Strict Academic Generation Rules**: Strictly confines questions to the provided syllabus units/topics without hallucinating external topics.
* **Paper Setter Review & Approval**: Generated papers are never auto-finalized. The setter has full control to:
  * View and inline-edit any question title, marks, unit, topic, or difficulty
  * Regenerate individual questions with AI if unsatisfied with a specific question
  * Delete questions
  * Add custom manual questions
  * Verify total marks alignment
  * Save draft or finalize for Admin approval

### 2. AI Evaluation of Scanned Answer Copies
* **Evaluation Modes**: Exactly `Manual Evaluation` and `AI Evaluation`.
* **Multimodal Answer Analysis**: If a scanned copy (PDF, JPEG, PNG) is uploaded, Gemini directly analyzes the scanned handwriting/content via base64 inline media buffer, complemented by OCR text.
* **Question-Wise Marking**: Evaluates every question separately against:
  * Question text and maximum marks
  * Reference answer and marking rubric criteria
  * Student answer text and multimodal scan
* **Backend Calculated Aggregation**: Total obtained marks, maximum marks, and percentage are computed strictly by the backend.
* **Admin Override & Audit Trail**:
  * Original `aiMarks` and AI feedback/criteria breakdown are permanently preserved for audit compliance.
  * Admin/evaluator edits are recorded as `finalMarks`, flagged with `adminModified: true`, and stored with `adminComment`.
* **Resilient Evaluation States & Per-Question Retry**:
  * States: `PENDING` → `PROCESSING` → `AI_EVALUATED` → `ADMIN_REVIEWED` (or `FAILED`)
  * Isolated question-level try/catch: a timeout on one question flags only that question as `FAILED` without discarding successfully evaluated questions, allowing granular one-click AI retry (`POST /api/answer-copies/:id/retry-question-ai`).

### Configuration (.env)
Add to `server/.env`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
AI_PROVIDER=gemini
AI_MODEL=gemini-1.5-pro
```

> **Security Note**: `GEMINI_API_KEY` is loaded exclusively in the backend runtime. It is never exposed in API responses or sent to client bundles. Both root and server `.gitignore` protect `.env` files.

---

## 8. Automated End-to-End Verification
To verify the complete Gemini integration and schemas:
```bash
node server/scratch/verify_gemini_integration.js
```

---

## 9. License & Standards
Developed for high-stakes academic and institutional examination administration adhering to clean code standards, security principles, and strict accessibility.

