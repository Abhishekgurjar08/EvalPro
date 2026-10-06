require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const examRoutes = require('./routes/examRoutes');
const syllabusRoutes = require('./routes/syllabusRoutes');
const questionRoutes = require('./routes/questionRoutes');
const rubricRoutes = require('./routes/rubricRoutes');
const blueprintRoutes = require('./routes/blueprintRoutes');
const questionPaperRoutes = require('./routes/questionPaperRoutes');
const answerCopyRoutes = require('./routes/answerCopyRoutes');
const evaluatorRoutes = require('./routes/evaluatorRoutes');
const evaluationRoutes = require('./routes/evaluationRoutes');
const aiRoutes = require('./routes/aiRoutes');
const resultRoutes = require('./routes/resultRoutes');
const reportRoutes = require('./routes/reportRoutes');
const scannerRoutes = require('./routes/scannerRoutes');
const auditRoutes = require('./routes/auditRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const annotationRoutes = require('./routes/annotationRoutes');

const app = express();

// Database Connection
connectDB();

// Middlewares
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'Examination Management & Evaluation System API',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/examinations', examRoutes);
app.use('/api/syllabus', syllabusRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/rubrics', rubricRoutes);
app.use('/api/blueprints', blueprintRoutes);
app.use('/api/question-papers', questionPaperRoutes);
app.use('/api/answer-copies', answerCopyRoutes);
app.use('/api/annotations', annotationRoutes);
app.use('/api/evaluators', evaluatorRoutes);
app.use('/api/evaluations', evaluationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/scanner', scannerRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/notifications', notificationRoutes);

// Error Handling Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});
