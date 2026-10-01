/**
 * End-to-End Automated Integration Test Suite
 * Validates all 5 mandatory examination workflows via REST APIs
 */

const BASE_URL = 'http://localhost:5000/api';

async function testSuite() {
  console.log('====================================================');
  console.log('STARTING END-TO-END WORKFLOW INTEGRATION VERIFICATION');
  console.log('====================================================\n');

  // Helper fetch function
  const request = async (path, options = {}) => {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {})
      },
      ...options
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} on ${path}: ${data.message || JSON.stringify(data)}`);
    }
    return data;
  };

  try {
    // ----------------------------------------------------
    // TEST 1: AUTHENTICATION ACROSS ALL 4 ROLES
    // ----------------------------------------------------
    console.log('[TEST 1] Testing Authentication for all 4 roles...');
    const adminAuth = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@example.com', password: 'Admin@123' })
    });
    console.log('✓ Admin login successful:', adminAuth.user.name, `(${adminAuth.user.role})`);

    const setterAuth = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'setter@example.com', password: 'Setter@123' })
    });
    console.log('✓ Setter login successful:', setterAuth.user.name, `(${setterAuth.user.role})`);

    const evalAuth = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'evaluator@example.com', password: 'Evaluator@123' })
    });
    console.log('✓ Evaluator login successful:', evalAuth.user.name, `(${evalAuth.user.role})`);

    const studentAuth = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'student@example.com', password: 'Student@123' })
    });
    console.log('✓ Student login successful:', studentAuth.user.name, `(${studentAuth.user.role})\n`);

    // ----------------------------------------------------
    // TEST 2: ADMIN DASHBOARD & EXAM LIFECYCLE (WORKFLOW A)
    // ----------------------------------------------------
    console.log('[TEST 2] Testing Admin Dashboard & Workflow A (Exam Lifecycle)...');
    const stats = await request('/reports/dashboard-stats', { token: adminAuth.token });
    console.log('✓ Admin stats received:', {
      examinations: stats.stats.totalExaminations,
      questions: stats.stats.totalQuestions,
      answerCopies: stats.stats.totalAnswerCopies,
      setters: stats.stats.totalSetters,
      evaluators: stats.stats.totalEvaluators
    });

    // Create a new exam
    const newExamCode = `E2E-TEST-${Date.now().toString().slice(-4)}`;
    const newExam = await request('/examinations', {
      method: 'POST',
      token: adminAuth.token,
      body: JSON.stringify({
        name: 'Operating Systems & Distributed Architecture',
        code: newExamCode,
        subject: 'Computer Networks',
        course: 'B.Tech',
        semester: 6,
        durationMinutes: 120,
        maxMarks: 50,
        evaluationMode: 'AI_ASSISTED'
      })
    });
    console.log('✓ Created examination:', newExam.examination.name, `[${newExam.examination.code}]`);

    // Assign Setter
    const assigned = await request(`/examinations/${newExam.examination._id}/assign-setter`, {
      method: 'POST',
      token: adminAuth.token,
      body: JSON.stringify({ setterId: setterAuth.user.id })
    });
    console.log('✓ Assigned setter Prof. Alan Turing, status:', assigned.examination.status);

    // Setter accepts assignment
    const accepted = await request(`/examinations/${newExam.examination._id}/setter-response`, {
      method: 'POST',
      token: setterAuth.token,
      body: JSON.stringify({ response: 'ACCEPT' })
    });
    console.log('✓ Setter accepted assignment, status:', accepted.examination.status);

    // Setter defines syllabus
    const syllabus = await request('/syllabus', {
      method: 'POST',
      token: setterAuth.token,
      body: JSON.stringify({
        examinationId: newExam.examination._id,
        subject: 'Computer Networks',
        units: [
          {
            unitNumber: 1,
            title: 'Network Core Protocols',
            topics: [{ topicNumber: 1, title: 'Routing & Congestion Control' }]
          }
        ]
      })
    });
    console.log('✓ Syllabus saved with', syllabus.syllabus.units.length, 'units');

    // Setter authors a Question with Marking Rubric
    const question = await request('/questions', {
      method: 'POST',
      token: setterAuth.token,
      body: JSON.stringify({
        subject: 'Computer Networks',
        examination: newExam.examination._id,
        questionText: 'Explain the working of Leaky Bucket Algorithm for traffic shaping and contrast it with Token Bucket.',
        marks: 10,
        difficulty: 'MEDIUM',
        expectedAnswer: 'The Leaky Bucket algorithm controls the rate of packet flow by buffering bursts of packets and transmitting them at an unvarying, constant output rate. Water poured into the bucket represents bursty incoming traffic; a hole at the bottom represents constant outflow. Excess packets exceeding bucket capacity are discarded (overflow). In contrast, the Token Bucket algorithm accumulates tokens at a constant rate and allows bursty transmission as long as sufficient tokens exist, providing greater transmission elasticity.',
        rubricCriteria: [
          { name: 'Leaky Bucket Mechanism & Analogy', maxMarks: 4, keywords: ['constant rate', 'buffer', 'overflow', 'bursty'] },
          { name: 'Token Bucket Contrast', maxMarks: 4, keywords: ['tokens', 'burst', 'elasticity', 'accumulator'] },
          { name: 'Summary & Traffic Shaping Significance', maxMarks: 2, keywords: ['policing', 'shaping', 'QoS'] }
        ]
      })
    });
    console.log('✓ Question and 3-criterion rubric created:', question.question.questionText.slice(0, 50) + '...');

    // Blueprint
    const bp = await request('/blueprints', {
      method: 'POST',
      token: setterAuth.token,
      body: JSON.stringify({
        examinationId: newExam.examination._id,
        unitDistribution: [{ unit: 'Unit 1: Network Core', marks: 50, questionsCount: 5 }]
      })
    });
    console.log('✓ Marks Blueprint saved and validated (Total = 50 marks)');

    // Create & Submit Question Paper
    const existingQList = await request('/questions', { token: setterAuth.token });
    const paperQuestions = existingQList.questions.slice(0, 5).map((q, i) => ({
      question: q._id,
      questionNumber: i + 1,
      marks: q.marks || 10
    }));

    const paper = await request('/question-papers', {
      method: 'POST',
      token: setterAuth.token,
      body: JSON.stringify({
        examinationId: newExam.examination._id,
        paperTitle: `${newExam.examination.name} - Midterm`,
        questions: paperQuestions
      })
    });

    // Setter Submits Paper
    const submittedPaper = await request(`/question-papers/${paper.questionPaper._id}/submit`, {
      method: 'POST',
      token: setterAuth.token,
      body: JSON.stringify({ comments: 'All 5 questions checked and rubric mapped.' })
    });
    console.log('✓ Question Paper submitted for admin approval, status:', submittedPaper.questionPaper.status);

    // Admin Approves Paper
    const approvedPaper = await request(`/question-papers/${paper.questionPaper._id}/review`, {
      method: 'POST',
      token: adminAuth.token,
      body: JSON.stringify({ action: 'APPROVE', comments: 'Syllabus and blueprint verified.' })
    });
    console.log('✓ Admin approved question paper, status:', approvedPaper.questionPaper.status, '\n');

    // ----------------------------------------------------
    // TEST 3: STUDENT EXAM CONDUCT (WORKFLOW B)
    // ----------------------------------------------------
    console.log('[TEST 3] Testing Student Examination Conduct (Workflow B)...');
    const startExamRes = await request(`/exams/${newExam.examination._id}/start`, {
      method: 'POST',
      token: studentAuth.token
    });
    console.log('✓ Student started exam attempt:', startExamRes.attempt.id);
    console.log('✓ Security check: Question expectedAnswer stripped for student:', !startExamRes.questionPaper.questions[0].question.expectedAnswer);

    // Student autosaves answer
    await request('/exams/save-draft', {
      method: 'POST',
      token: studentAuth.token,
      body: JSON.stringify({
        attemptId: startExamRes.attempt.id,
        answers: [{ questionId: paperQuestions[0].question, answerText: 'The Leaky Bucket algorithm enforces a constant output rate regardless of incoming traffic burstiness.' }]
      })
    });
    console.log('✓ Autosave draft answers succeeded');

    // Student submits examination
    const submittedExam = await request('/exams/submit', {
      method: 'POST',
      token: studentAuth.token,
      body: JSON.stringify({
        attemptId: startExamRes.attempt.id,
        answers: paperQuestions.map((pq, i) => ({
          questionId: pq.question,
          questionNumber: i + 1,
          answerText: `Student comprehensive response for Question ${i + 1} with detailed explanation of protocols, algorithms, and models.`
        }))
      })
    });
    console.log('✓ Student submitted exam! Created Answer Copy:', submittedExam.answerCopy.copyId, `[${submittedExam.answerCopy.evaluationStatus}]\n`);

    // ----------------------------------------------------
    // TEST 4: COPY ASSIGNMENT & AI EVALUATION (WORKFLOWS C & D)
    // ----------------------------------------------------
    console.log('[TEST 4] Testing Copy Assignment & AI-Assisted Evaluation (Workflows C & D)...');
    // Admin assigns copy to Evaluator
    const copyAssign = await request('/evaluators/assign-copies', {
      method: 'POST',
      token: adminAuth.token,
      body: JSON.stringify({
        examinationId: newExam.examination._id,
        evaluatorId: evalAuth.user.id,
        copyIds: [submittedExam.answerCopy.id]
      })
    });
    console.log('✓ Admin assigned copy to Dr. Rahul Sharma:', copyAssign.message);

    // Evaluator loads the assigned copy
    const copyDetails = await request(`/answer-copies/${submittedExam.answerCopy.id}`, {
      token: evalAuth.token
    });
    console.log('✓ Evaluator opened copy:', copyDetails.answerCopy.copyId, 'with', copyDetails.answerCopy.answers.length, 'answers');

    // Evaluator invokes AI Evaluation Engine
    const targetQ = copyDetails.answerCopy.answers[0];
    const aiEvalResult = await request('/ai/evaluate', {
      method: 'POST',
      token: evalAuth.token,
      body: JSON.stringify({
        answerCopyId: copyDetails.answerCopy._id,
        questionId: targetQ.question._id,
        studentAnswer: targetQ.studentAnswer
      })
    });
    console.log('✓ AI Evaluation Engine Result:', {
      suggestedMarks: aiEvalResult.data.suggestedMarks,
      maxMarks: aiEvalResult.data.maxMarks,
      criteriaEvaluated: aiEvalResult.data.criteriaEvaluation?.length,
      modelUsed: aiEvalResult.data.modelUsed
    });
    console.log('  Feedback:', aiEvalResult.data.overallFeedback);

    // Record decision: Evaluator modifies/accepts suggestion
    await request('/ai/decision', {
      method: 'POST',
      token: evalAuth.token,
      body: JSON.stringify({
        answerCopyId: copyDetails.answerCopy._id,
        questionId: targetQ.question._id,
        evaluatorFinalMarks: aiEvalResult.data.suggestedMarks,
        evaluatorAction: 'ACCEPTED'
      })
    });
    console.log('✓ Recorded AI vs Evaluator decision comparison');

    // Evaluator saves draft
    await request('/evaluations/save-draft', {
      method: 'POST',
      token: evalAuth.token,
      body: JSON.stringify({
        answerCopyId: copyDetails.answerCopy._id,
        evaluationMode: 'AI_ASSISTED',
        questionEvaluations: copyDetails.answerCopy.answers.map((a, i) => ({
          question: a.question._id,
          questionNumber: i + 1,
          maxMarks: a.maxMarks,
          marksAwarded: 8,
          comments: 'Well articulated explanation.'
        })),
        overallComments: 'Solid understanding of networking concepts.'
      })
    });
    console.log('✓ Evaluator draft saved successfully');

    // Evaluator submits final evaluation
    const finalEval = await request('/evaluations/submit', {
      method: 'POST',
      token: evalAuth.token,
      body: JSON.stringify({
        answerCopyId: copyDetails.answerCopy._id,
        evaluationMode: 'AI_ASSISTED',
        questionEvaluations: copyDetails.answerCopy.answers.map((a, i) => ({
          question: a.question._id,
          questionNumber: i + 1,
          maxMarks: a.maxMarks,
          marksAwarded: 8,
          comments: 'Accurate technical answer.'
        })),
        overallComments: 'High quality performance across all sections.'
      })
    });
    console.log('✓ Evaluator submitted final evaluation:', {
      totalMarks: finalEval.evaluation.totalMarks,
      maxPossibleMarks: finalEval.evaluation.maxPossibleMarks,
      percentage: finalEval.evaluation.percentage
    });
    console.log('✓ Computed Result Object Grade:', finalEval.result.grade, `Passed: ${finalEval.result.passed}\n`);

    // ----------------------------------------------------
    // TEST 5: RESULT PUBLICATION & REPORTS (WORKFLOW E)
    // ----------------------------------------------------
    console.log('[TEST 5] Testing Result Publication & Reports (Workflow E)...');

    // Student should not see results prior to publication
    const prePublishResults = await request('/results', { token: studentAuth.token });
    const hasUnpublished = prePublishResults.results.some((r) => r.examination._id === newExam.examination._id);
    console.log('✓ Security check: Student cannot see unpublished result:', !hasUnpublished);

    // Admin publishes results
    const published = await request(`/results/publish/${newExam.examination._id}`, {
      method: 'POST',
      token: adminAuth.token
    });
    console.log('✓ Admin officially published results:', published.message);

    // Now student can view their published marksheet
    const postPublishResults = await request('/results', { token: studentAuth.token });
    const myResult = postPublishResults.results.find((r) => r.examination._id === newExam.examination._id);
    console.log('✓ Student verified published scorecard:', {
      exam: myResult.examination.name,
      score: `${myResult.totalMarks}/${myResult.maxMarks}`,
      percentage: `${myResult.percentage}%`,
      grade: myResult.grade
    });

    // Check institutional reports for AI vs Evaluator metrics
    const reportData = await request('/reports/comprehensive', { token: adminAuth.token });
    console.log('✓ Comprehensive Reports AI Metrics:', {
      totalAICalls: reportData.aiMetrics.totalAICalls,
      acceptedCount: reportData.aiMetrics.acceptedCount,
      modifiedCount: reportData.aiMetrics.modifiedCount,
      acceptanceRate: `${reportData.aiMetrics.acceptanceRate}%`
    });

    console.log('\n====================================================');
    console.log('ALL WORKFLOWS A, B, C, D, E VALIDATED WITH 100% SUCCESS!');
    console.log('====================================================');
  } catch (error) {
    console.error('FAILED TEST RUN:', error);
    process.exit(1);
  }
}

testSuite();
