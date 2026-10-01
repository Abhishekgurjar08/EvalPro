const fetch = globalThis.fetch;

async function testFlow() {
  try {
    console.log('1. Logging in as Admin...');
    const loginRes = await fetch('http://127.0.0.1:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@example.com', password: 'Admin@123' })
    });
    const loginData = await loginRes.json();
    if (!loginData.success) {
      console.error('Login failed:', loginData);
      process.exit(1);
    }
    const token = loginData.token;
    console.log('Admin logged in successfully!');

    // 2. Fetch answer copies
    console.log('2. Fetching answer copies...');
    const copiesRes = await fetch('http://127.0.0.1:5000/api/answer-copies?limit=10', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const copiesData = await copiesRes.json();
    console.log(`Found ${copiesData.total} total answer copies. Examination:`, copiesData.examination?.name);
    
    if (copiesData.answerCopies.length === 0) {
      console.error('No copies found!');
      process.exit(1);
    }

    const firstCopy = copiesData.answerCopies[0];
    console.log(`Testing copy ${firstCopy.copyId} (_id: ${firstCopy._id}, status: ${firstCopy.evaluationStatus})`);

    // 3. Test evaluate single copy with AI
    console.log('3. Running AI evaluation on copy...');
    const aiRes = await fetch(`http://127.0.0.1:5000/api/answer-copies/${firstCopy._id}/ai-evaluate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ force: true })
    });
    const aiData = await aiRes.json();
    console.log('AI Evaluation response:', aiData.success, aiData.message);
    if (!aiData.success) {
      console.error('AI Eval failed:', aiData);
      process.exit(1);
    }

    console.log('AI Total:', aiData.answerCopy.aiTotal, 'Final Total:', aiData.answerCopy.finalTotal);
    console.log('Questions evaluated:', aiData.answerCopy.answers.length);
    aiData.answerCopy.answers.forEach(a => {
      console.log(`  Q${a.questionNumber}: maxMarks=${a.maxMarks}, aiMarks=${a.aiMarks}, finalMarks=${a.finalMarks}, aiFeedback="${(a.aiFeedback||'').slice(0, 40)}..."`);
    });

    // 4. Test Admin editing Final Marks
    console.log('4. Admin modifying finalMarks (changing Q1 marks)...');
    const q1 = aiData.answerCopy.answers[0];
    const originalAiMarks = q1.aiMarks;
    const modifiedMarks = Math.min(q1.maxMarks, originalAiMarks + 1);

    const questionMarksPayload = aiData.answerCopy.answers.map(a => ({
      questionId: a.question?._id || a.question,
      questionNumber: a.questionNumber,
      finalMarks: a.questionNumber === q1.questionNumber ? modifiedMarks : a.finalMarks,
      comments: a.questionNumber === q1.questionNumber ? 'Admin adjusted mark for clarity' : ''
    }));

    const saveRes = await fetch(`http://127.0.0.1:5000/api/answer-copies/${firstCopy._id}/admin-save-marks`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        questionMarks: questionMarksPayload,
        overallComments: 'Admin reviewed and confirmed marks.'
      })
    });

    const saveData = await saveRes.json();
    console.log('Admin Save Marks response:', saveData.success, saveData.message);
    if (!saveData.success) {
      console.error('Save marks failed:', saveData);
      process.exit(1);
    }

    const updatedQ1 = saveData.answerCopy.answers[0];
    console.log(`VERIFICATION of Q1:`);
    console.log(`- Original AI Marks (must be unchanged): ${updatedQ1.aiMarks} (was ${originalAiMarks})`);
    console.log(`- Final Marks (must be modified value): ${updatedQ1.finalMarks} (expected ${modifiedMarks})`);
    console.log(`- Status (must be REVIEWED): ${saveData.answerCopy.evaluationStatus}`);
    console.log(`- Final Total: ${saveData.answerCopy.finalTotal} / ${saveData.answerCopy.totalMaxMarks}`);
    console.log(`- AI Total: ${saveData.answerCopy.aiTotal} / ${saveData.answerCopy.totalMaxMarks}`);

    if (updatedQ1.aiMarks === originalAiMarks && updatedQ1.finalMarks === modifiedMarks && saveData.answerCopy.evaluationStatus === 'REVIEWED') {
      console.log('\n>>> SUCCESS: All backend requirements verified! Original aiMarks preserved, finalMarks modified, status updated to REVIEWED. <<<');
    } else {
      console.error('Mismatch detected in verified values!');
      process.exit(1);
    }

  } catch (err) {
    console.error('Test error:', err);
    process.exit(1);
  }
}

testFlow();
