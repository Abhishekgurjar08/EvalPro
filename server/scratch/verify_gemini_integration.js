const geminiService = require('../src/services/geminiService');
const aiEvaluationService = require('../src/services/aiEvaluationService');
const AnswerCopy = require('../src/models/AnswerCopy');
const Examination = require('../src/models/Examination');
const QuestionPaper = require('../src/models/QuestionPaper');
const Syllabus = require('../src/models/Syllabus');
const mongoose = require('mongoose');

console.log('--- Verifying Gemini AI Integration ---');

// 1. Check Service loading
console.log('1. Checking geminiService...');
if (typeof geminiService.generateQuestionPaper === 'function' &&
    typeof geminiService.evaluateQuestionAnswer === 'function' &&
    typeof geminiService.regenerateQuestion === 'function') {
  console.log('   ✓ geminiService methods exist.');
} else {
  console.error('   ✗ geminiService missing required methods.');
  process.exit(1);
}

// 2. Check Missing API Key error handling
console.log('2. Checking missing API Key error handling...');
const originalKey = process.env.GEMINI_API_KEY;
const originalAiKey = process.env.AI_API_KEY;
delete process.env.GEMINI_API_KEY;
delete process.env.AI_API_KEY;

try {
  geminiService.getApiKey();
  console.error('   ✗ Expected error when API key is missing, but none thrown.');
  process.exit(1);
} catch (err) {
  if (err.message.includes('Gemini API key is not configured')) {
    console.log('   ✓ Missing API key handled with clear message:', err.message);
  } else {
    console.error('   ✗ Unexpected error message:', err.message);
    process.exit(1);
  }
}

// Restore keys
if (originalKey) process.env.GEMINI_API_KEY = originalKey;
if (originalAiKey) process.env.AI_API_KEY = originalAiKey;

// 3. Test JSON cleaning and parsing
console.log('3. Checking JSON cleaning and parsing...');
const rawFencedJson = '```json\n{"title": "Test Exam", "total_marks": 50, "questions": []}\n```';
const parsed = geminiService.cleanAndParseJson(rawFencedJson);
if (parsed.title === 'Test Exam' && parsed.total_marks === 50) {
  console.log('   ✓ Cleaned and parsed fenced JSON successfully.');
} else {
  console.error('   ✗ JSON cleaning failed:', parsed);
  process.exit(1);
}

// 4. Test Model Schemas
console.log('4. Checking Database Schemas...');
const answerCopyFields = AnswerCopy.schema.paths;
const studentAnswerFields = AnswerCopy.schema.path('answers').schema.paths;

if (studentAnswerFields['adminModified'] && studentAnswerFields['adminComment']) {
  console.log('   ✓ AnswerCopy.answers includes adminModified and adminComment.');
} else {
  console.error('   ✗ AnswerCopy.answers missing adminModified or adminComment.');
  process.exit(1);
}

const statusEnum = AnswerCopy.schema.path('status').enumValues;
const evalStatusEnum = AnswerCopy.schema.path('evaluationStatus').enumValues;

if (statusEnum.includes('AI_EVALUATED') && statusEnum.includes('ADMIN_REVIEWED') &&
    evalStatusEnum.includes('AI_EVALUATED') && evalStatusEnum.includes('ADMIN_REVIEWED')) {
  console.log('   ✓ AnswerCopy enums include AI_EVALUATED and ADMIN_REVIEWED.');
} else {
  console.error('   ✗ AnswerCopy enums missing AI_EVALUATED or ADMIN_REVIEWED:', { statusEnum, evalStatusEnum });
  process.exit(1);
}

console.log('\n--- All Unit Checks Passed Successfully! ---');
process.exit(0);
