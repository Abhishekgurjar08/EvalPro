require('dotenv').config();

// Fix Node.js DNS resolution for MongoDB Atlas SRV connection
const dns = require('dns');
dns.setServers(['1.1.1.1', '8.8.8.8']);

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
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'https://eval-pro-five.vercel.app',
  ...(process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(',').map((u) => u.trim().replace(/\/+$/, ''))
    : [])
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      const cleanOrigin = origin.replace(/\/+$/, '');
      if (
        allowedOrigins.includes(cleanOrigin) ||
        allowedOrigins.includes('*')
      ) {
        return callback(null, true);
      }

      try {
        const hostname = new URL(origin).hostname;
        if (hostname === 'eval-pro-five.vercel.app' || hostname.endsWith('.vercel.app')) {
          return callback(null, true);
        }
      } catch (e) {
        // Continue to fallback
      }

      // Allow request
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

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

// Server
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(
    'Server running in ' +
    (process.env.NODE_ENV || 'development') +
    ' mode on port ' +
    PORT
  );
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection: ' + err.message);
  server.close(() => process.exit(1));
});