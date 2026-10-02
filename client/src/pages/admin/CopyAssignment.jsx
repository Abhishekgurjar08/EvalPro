import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import { useToast } from '../../context/ToastContext';
import {
  FolderKanban,
  CheckSquare,
  Square,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Bot,
  RefreshCw,
  Edit3,
  Check,
  BookOpen,
  HelpCircle,
  Info,
  Clock,
  ExternalLink
} from 'lucide-react';

const CopyAssignment = () => {
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [evaluators, setEvaluators] = useState([]);
  const [selectedEvaluatorId, setSelectedEvaluatorId] = useState('');
  const [copies, setCopies] = useState([]);
  const [selectedCopyIds, setSelectedCopyIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);

  // Evaluation Flow Mode: 'MANUAL' | 'AI'
  const [evaluationMode, setEvaluationMode] = useState('MANUAL');

  // AI Evaluation Process States
  const [confirmAiModal, setConfirmAiModal] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);

  // Admin Review Modal States
  const [reviewModalCopy, setReviewModalCopy] = useState(null);
  const [reviewForm, setReviewForm] = useState({});
  const [reviewOverallComment, setReviewOverallComment] = useState('');
  const [savingFinalMarks, setSavingFinalMarks] = useState(false);

  // Bulk Random Selection State
  const [customRandomCount, setCustomRandomCount] = useState('');

  const { showToast } = useToast();

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [examsRes, evalRes] = await Promise.all([
        api.get('/examinations'),
        api.get('/evaluators')
      ]);

      if (examsRes.data.success) {
        const loadedExams = examsRes.data.examinations || [];
        setExams(loadedExams);
        if (loadedExams.length > 0) {
          setSelectedExamId(loadedExams[0]._id);
        }
      }
      if (evalRes.data.success) {
        setEvaluators(evalRes.data.evaluators || []);
      }
    } catch (err) {
      showToast('Failed to load initial assignment data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedExamId) {
      fetchCopiesForExam(selectedExamId);
    }
  }, [selectedExamId]);

  const fetchCopiesForExam = async (examId) => {
    try {
      const res = await api.get(`/answer-copies?examinationId=${examId}&limit=200`);
      if (res.data.success) {
        setCopies(res.data.answerCopies || []);
        setSelectedCopyIds([]);
      }
    } catch (err) {
      showToast('Error loading answer copies for selected exam', 'error');
    }
  };

  const selectedExam = exams.find((e) => e._id === selectedExamId);
  const selectedEvaluator = evaluators.find(
    (ev) => ev.user?._id === selectedEvaluatorId || ev._id === selectedEvaluatorId
  );

  // Subject matching validation rule: Evaluator must have subject
  const isSubjectMatch =
    !selectedEvaluator ||
    !selectedExam ||
    selectedEvaluator.subjects?.some(
      (s) => s.toLowerCase().trim() === selectedExam.subject.toLowerCase().trim()
    );

  const toggleSelectCopy = (id) => {
    setSelectedCopyIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Helper to get eligible/unprocessed copies based on current evaluation flow
  const getEligibleCopies = () => {
    return copies.filter((copy) => {
      // Never select already completed or finalized copies
      const isAlreadyCompleted =
        ['COMPLETED', 'FINALIZED', 'ADMIN_REVIEWED', 'EVALUATED'].includes(copy.evaluationStatus) ||
        ['COMPLETED', 'FINALIZED', 'EVALUATED'].includes(copy.status);
      if (isAlreadyCompleted) return false;

      if (evaluationMode === 'MANUAL') {
        // For Manual Check: eligible copies must be unassigned
        return !copy.assignedEvaluator;
      } else {
        // For AI Check: eligible copies must not already be in AI processing or evaluated
        return !['AI_PROCESSING', 'PROCESSING', 'AI_EVALUATED'].includes(copy.evaluationStatus);
      }
    });
  };

  const eligibleCopies = getEligibleCopies();

  // Bulk Random Copy Selection (10, 20, 50, 100 or custom count)
  const handleSelectRandomCopies = (count) => {
    const eligible = getEligibleCopies();
    const availableCount = eligible.length;

    if (availableCount === 0) {
      showToast(
        `No eligible unprocessed copies available for ${
          evaluationMode === 'MANUAL' ? 'Manual Check' : 'AI Check'
        }.`,
        'warning'
      );
      return;
    }

    const requestedCount = Number(count) || 10;
    if (requestedCount <= 0) {
      showToast('Please enter a valid copy count.', 'warning');
      return;
    }

    const selectCount = Math.min(requestedCount, availableCount);

    // Fisher-Yates random shuffle to guarantee random selection
    const shuffled = [...eligible];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const selected = shuffled.slice(0, selectCount);
    setSelectedCopyIds(selected.map((c) => c._id));

    if (availableCount < requestedCount) {
      showToast(
        `Requested ${requestedCount} copies, but only ${availableCount} eligible copies are available. Selected all ${availableCount} random copies.`,
        'info'
      );
    } else {
      showToast(
        `Successfully selected ${selectCount} random copies for ${
          evaluationMode === 'MANUAL' ? 'Manual Check' : 'Check with AI'
        }!`,
        'success'
      );
    }
  };

  const selectAllUnassigned = () => {
    const eligible = getEligibleCopies();
    setSelectedCopyIds(eligible.map((c) => c._id));
    showToast(`Selected all ${eligible.length} eligible copies.`, 'info');
  };


  // MANUAL FLOW: Assign Selected Copies to Evaluator
  const handleAssignCopies = async () => {
    if (!selectedExamId || !selectedEvaluatorId) {
      showToast('Please select both an Examination and an Evaluator.', 'error');
      return;
    }

    if (selectedCopyIds.length === 0) {
      showToast('Please select at least one answer copy to assign.', 'error');
      return;
    }

    if (!isSubjectMatch) {
      showToast(
        `Subject mismatch! Evaluator ${selectedEvaluator.name} is not authorized for ${selectedExam.subject}.`,
        'error'
      );
      return;
    }

    try {
      setAssigning(true);
      const res = await api.post('/evaluators/assign-copies', {
        examinationId: selectedExamId,
        evaluatorId: selectedEvaluator.user?._id || selectedEvaluator.user || selectedEvaluator._id,
        copyIds: selectedCopyIds
      });

      if (res.data.success) {
        showToast(
          `Successfully assigned ${res.data.assignedCount} copies to ${selectedEvaluator.name}!`,
          'success'
        );
        fetchCopiesForExam(selectedExamId);
        // Refresh evaluator workload
        const evalRes = await api.get('/evaluators');
        if (evalRes.data.success) setEvaluators(evalRes.data.evaluators || []);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error assigning answer copies', 'error');
    } finally {
      setAssigning(false);
    }
  };

  // AI FLOW: Triggered after Confirmation Modal
  const handleStartAiEvaluation = async () => {
    if (selectedCopyIds.length === 0) {
      showToast('Please select at least one answer copy to check with AI.', 'error');
      return;
    }

    try {
      setAiProcessing(true);
      let evaluatedCopyForReview = null;

      if (selectedCopyIds.length === 1) {
        const copyId = selectedCopyIds[0];
        const res = await api.post(`/answer-copies/${copyId}/ai-evaluate`, { force: true });
        if (res.data.success) {
          showToast(res.data.message || 'AI evaluation completed successfully!', 'success');
          evaluatedCopyForReview = res.data.answerCopy;
        }
      } else {
        const res = await api.post(`/answer-copies/${selectedExamId}/start-ai-evaluation`, {
          copyIds: selectedCopyIds,
          force: true
        });
        if (res.data.success) {
          showToast(
            res.data.message || `AI evaluation completed for ${selectedCopyIds.length} copies!`,
            'success'
          );
        }
      }

      setConfirmAiModal(false);
      await fetchCopiesForExam(selectedExamId);

      // If single copy was evaluated, open AI review modal right away
      if (selectedCopyIds.length === 1 && evaluatedCopyForReview) {
        openAiReviewModal(evaluatedCopyForReview);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error during AI evaluation', 'error');
    } finally {
      setAiProcessing(false);
    }
  };

  // Retry AI on a single failed copy
  const handleRetrySingleCopyAi = async (copyId) => {
    try {
      setAiProcessing(true);
      const res = await api.post(`/answer-copies/${copyId}/ai-evaluate`, { force: true });
      if (res.data.success) {
        showToast(res.data.message || 'AI evaluation completed!', 'success');
        await fetchCopiesForExam(selectedExamId);
        if (res.data.answerCopy) {
          openAiReviewModal(res.data.answerCopy);
        }
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Retry AI evaluation failed', 'error');
    } finally {
      setAiProcessing(false);
    }
  };

  // Open AI Review Modal for an evaluated copy
  const openAiReviewModal = async (copy) => {
    try {
      const res = await api.get(`/answer-copies/${copy._id}`);
      if (res.data.success) {
        const loadedCopy = res.data.answerCopy;
        const initialForm = {};
        if (Array.isArray(loadedCopy.answers)) {
          for (const ans of loadedCopy.answers) {
            const qId = (ans.question?._id || ans.question)?.toString() || String(ans.questionNumber);
            const aiScore = ans.aiMarks !== null && ans.aiMarks !== undefined ? ans.aiMarks : (ans.aiSuggestedMarks ?? ans.marksAwarded ?? 0);
            const finalScore = ans.finalMarks !== null && ans.finalMarks !== undefined ? ans.finalMarks : aiScore;
            initialForm[qId] = {
              finalMarks: finalScore,
              comments: ans.adminComment || ans.evaluatorRemarks || ''
            };
          }
        }
        setReviewForm(initialForm);
        setReviewOverallComment(loadedCopy.aiEvaluationSummary?.overallFeedback || '');
        setReviewModalCopy(loadedCopy);
      }
    } catch (err) {
      showToast('Failed to load copy details for AI review', 'error');
    }
  };

  // Handle Mark Change in Admin Review Modal
  const handleReviewMarkChange = (qId, val, maxMarks) => {
    if (val === '') {
      setReviewForm((prev) => ({
        ...prev,
        [qId]: { ...prev[qId], finalMarks: '' }
      }));
      return;
    }
    const num = Number(val);
    if (num < 0 || num > maxMarks) {
      showToast(`Marks must be between 0 and maximum marks (${maxMarks}).`, 'warning');
      return;
    }
    setReviewForm((prev) => ({
      ...prev,
      [qId]: { ...prev[qId], finalMarks: num }
    }));
  };

  const handleReviewCommentChange = (qId, comment) => {
    setReviewForm((prev) => ({
      ...prev,
      [qId]: { ...prev[qId], comments: comment }
    }));
  };

  // Save Final Marks & Finalize Evaluation
  const handleSaveFinalMarks = async () => {
    if (!reviewModalCopy) return;

    // Validate all question marks
    for (const ans of reviewModalCopy.answers || []) {
      const qId = (ans.question?._id || ans.question)?.toString() || String(ans.questionNumber);
      const val = Number(reviewForm[qId]?.finalMarks);
      if (isNaN(val) || val < 0 || val > ans.maxMarks) {
        showToast(
          `Invalid marks for Question ${ans.questionNumber}. Must be between 0 and ${ans.maxMarks}.`,
          'error'
        );
        return;
      }
    }

    try {
      setSavingFinalMarks(true);
      const questionMarksPayload = (reviewModalCopy.answers || []).map((ans) => {
        const qId = (ans.question?._id || ans.question)?.toString() || String(ans.questionNumber);
        const entry = reviewForm[qId] || {};
        return {
          questionId: qId,
          questionNumber: ans.questionNumber,
          finalMarks: Number(entry.finalMarks),
          comments: entry.comments || ''
        };
      });

      const res = await api.put(`/answer-copies/${reviewModalCopy._id}/admin-save-marks`, {
        questionMarks: questionMarksPayload,
        overallComments: reviewOverallComment || 'Admin reviewed and finalized marks.'
      });

      if (res.data.success) {
        showToast(res.data.message || 'Evaluation finalized successfully! Status updated to FINALIZED.', 'success');
        setReviewModalCopy(null);
        await fetchCopiesForExam(selectedExamId);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error saving final marks', 'error');
    } finally {
      setSavingFinalMarks(false);
    }
  };

  // Helper to calculate total final score in real-time inside review modal
  const calculateModalFinalTotal = () => {
    if (!reviewModalCopy?.answers) return 0;
    return reviewModalCopy.answers.reduce((acc, ans) => {
      const qId = (ans.question?._id || ans.question)?.toString() || String(ans.questionNumber);
      const val = Number(reviewForm[qId]?.finalMarks);
      return acc + (isNaN(val) ? 0 : val);
    }, 0);
  };

  return (
    <div>
      <PageHeader
        title="Answer Copy Allocation & Evaluator Assignment"
        subtitle="Match student answer copies with qualified faculty evaluators based on subject expertise and workload limits."
        breadcrumb="Manual & Digital Evaluation"
      />

      {loading ? (
        <LoadingSpinner fullPage text="Loading assignment control panel..." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Exam, Mode Selection & Assignment/AI Controls */}
          <div className="lg:col-span-1 space-y-6">
            {/* Step 1: Select Exam */}
            <div className="surface-card p-5 rounded-xl border border-slate-800">
              <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3 flex items-center space-x-2">
                <span className="w-5 h-5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs flex items-center justify-center font-bold">
                  1
                </span>
                <span>Select Examination</span>
              </h4>

              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                {exams.map((ex) => (
                  <option key={ex._id} value={ex._id}>
                    {ex.code} - {ex.name} ({ex.subject})
                  </option>
                ))}
              </select>

              {selectedExam && (
                <div className="mt-3 p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Subject:</span>
                    <span className="font-semibold text-indigo-400">{selectedExam.subject}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Marks:</span>
                    <span className="text-slate-200 font-mono">{selectedExam.maxMarks}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Evaluation Flow Option (Manual Check vs Check with AI) */}
            <div className="surface-card p-5 rounded-xl border border-slate-800">
              <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3 flex items-center space-x-2">
                <span className="w-5 h-5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs flex items-center justify-center font-bold">
                  2
                </span>
                <span>Evaluation Option</span>
              </h4>

              <div className="grid grid-cols-2 gap-2.5">
                {/* Option 1: Manual Check */}
                <button
                  type="button"
                  onClick={() => setEvaluationMode('MANUAL')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    evaluationMode === 'MANUAL'
                      ? 'bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500 text-white shadow-sm'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <UserCheck className={`w-4 h-4 ${evaluationMode === 'MANUAL' ? 'text-indigo-400' : 'text-slate-400'}`} />
                    <span className="text-xs font-bold">Manual Check</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Assign to subject-expert faculty evaluator for manual marking
                  </p>
                </button>

                {/* Option 2: Check with AI */}
                <button
                  type="button"
                  onClick={() => setEvaluationMode('AI')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    evaluationMode === 'AI'
                      ? 'bg-amber-950/30 border-amber-500 ring-1 ring-amber-500 text-white shadow-sm'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <Sparkles className={`w-4 h-4 ${evaluationMode === 'AI' ? 'text-amber-400' : 'text-slate-400'}`} />
                    <span className="text-xs font-bold">Check with AI</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Automated Gemini AI rubric grading + Admin review
                  </p>
                </button>
              </div>
            </div>

            {/* FLOW 1: MANUAL CHECK CONTROLS */}
            {evaluationMode === 'MANUAL' && (
              <>
                {/* Step 3: Select Evaluator */}
                <div className="surface-card p-5 rounded-xl border border-slate-800">
                  <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3 flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs flex items-center justify-center font-bold">
                      3
                    </span>
                    <span>Select Faculty Evaluator</span>
                  </h4>

                  <select
                    value={selectedEvaluatorId}
                    onChange={(e) => setSelectedEvaluatorId(e.target.value)}
                    className="w-full bg-slate-900/90 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">-- Choose Evaluator --</option>
                    {evaluators.map((ev) => (
                      <option key={ev._id} value={ev._id}>
                        {ev.name} ({ev.department})
                      </option>
                    ))}
                  </select>

                  {selectedEvaluator && (
                    <div className="mt-4 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Evaluator:</span>
                        <span className="font-semibold text-white">{selectedEvaluator.name}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-1">Subjects:</span>
                        <div className="flex flex-wrap gap-1">
                          {selectedEvaluator.subjects?.map((s, i) => (
                            <span
                              key={i}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${
                                selectedExam && s.toLowerCase().trim() === selectedExam.subject.toLowerCase().trim()
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold'
                                  : 'bg-slate-800 border-slate-700 text-slate-300'
                              }`}
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Subject Match Indicator */}
                      {!isSubjectMatch ? (
                        <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] flex items-center space-x-1.5">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>Warning: Not authorized for {selectedExam?.subject}</span>
                        </div>
                      ) : (
                        <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] flex items-center space-x-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span>Subject Matched: Authorized</span>
                        </div>
                      )}

                      <div className="pt-2 border-t border-slate-800">
                        <div className="flex justify-between text-[11px] text-slate-400">
                          <span>Current Workload:</span>
                          <span className="font-mono text-white">
                            {selectedEvaluator.workload?.activeAssigned || 0} / {selectedEvaluator.maxWorkload || 50} copies
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Manual Action Card */}
                <div className="surface-card p-5 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between mb-3 text-xs">
                    <span className="text-slate-400">Selected for Assignment:</span>
                    <span className="font-mono font-bold text-indigo-400 text-sm">
                      {selectedCopyIds.length} copies
                    </span>
                  </div>
                  <Button
                    variant="primary"
                    size="lg"
                    icon={UserCheck}
                    loading={assigning}
                    disabled={selectedCopyIds.length === 0 || !selectedEvaluatorId || !isSubjectMatch}
                    onClick={handleAssignCopies}
                    className="w-full"
                  >
                    Assign Selected Copies
                  </Button>
                </div>
              </>
            )}

            {/* FLOW 2: AI CHECK CONTROLS */}
            {evaluationMode === 'AI' && (
              <>
                {/* AI Configuration Info */}
                <div className="surface-card p-5 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center space-x-2 text-amber-400 font-semibold text-xs">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Gemini AI Evaluation Engine</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Evaluates scanned answer copies against question paper, marking rubrics, and reference points directly using multimodal Google Gemini AI.
                  </p>
                  <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1.5 text-[11px] text-slate-300">
                    <div className="flex items-center space-x-1.5 text-emerald-400">
                      <Check className="w-3.5 h-3.5" />
                      <span>No human evaluator assignment required</span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-emerald-400">
                      <Check className="w-3.5 h-3.5" />
                      <span>Independent question-wise marks & feedback</span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-emerald-400">
                      <Check className="w-3.5 h-3.5" />
                      <span>Admin mark review & override before finalization</span>
                    </div>
                  </div>
                </div>

                {/* AI Action Card */}
                <div className="surface-card p-5 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between mb-3 text-xs">
                    <span className="text-slate-400">Selected for AI Check:</span>
                    <span className="font-mono font-bold text-amber-400 text-sm">
                      {selectedCopyIds.length} copies
                    </span>
                  </div>

                  <Button
                    variant="primary"
                    size="lg"
                    icon={Sparkles}
                    loading={aiProcessing}
                    disabled={selectedCopyIds.length === 0 || aiProcessing}
                    onClick={() => setConfirmAiModal(true)}
                    className="w-full bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 text-white shadow-md font-semibold"
                  >
                    🤖 Check with AI
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* Right Column: Copies List & Checkbox Selection */}
          <div className="lg:col-span-2">
            <div className="surface-card rounded-xl border border-slate-800 overflow-hidden">
              <div className="p-4 border-b border-slate-800 bg-slate-900/50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-100 tracking-tight">Available Answer Copies</h4>
                    <p className="text-xs text-slate-400">
                      Showing submissions for {selectedExam?.name} ({copies.length} total)
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={selectAllUnassigned}>
                      Select All Unassigned
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedCopyIds([])}
                      disabled={selectedCopyIds.length === 0}
                    >
                      Clear Selection
                    </Button>
                  </div>
                </div>

                {/* BULK RANDOM COPY SELECTION BAR */}
                <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center space-x-2.5">
                    <span className="text-slate-400">
                      Available Copies:{' '}
                      <strong className="text-white font-mono font-bold text-xs">
                        {eligibleCopies.length}
                      </strong>
                    </span>
                    {selectedCopyIds.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                        {selectedCopyIds.length} Selected
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-slate-400 text-[11px] font-medium">Select Copies:</span>
                    {[10, 20, 50, 100].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => handleSelectRandomCopies(num)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-indigo-600/30 hover:border-indigo-500/60 border border-slate-700 text-slate-200 font-mono font-bold text-xs transition-colors shadow-sm"
                      >
                        [ {num} ]
                      </button>
                    ))}

                    <span className="text-slate-500 text-[11px]">or</span>

                    <div className="flex items-center space-x-1.5">
                      <input
                        type="number"
                        min="1"
                        max={copies.length}
                        placeholder="Qty"
                        value={customRandomCount}
                        onChange={(e) => setCustomRandomCount(e.target.value)}
                        className="w-16 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-center text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSelectRandomCopies(customRandomCount || 10)}
                        className="text-xs font-semibold"
                      >
                        Select Random Copies
                      </Button>
                    </div>
                  </div>
                </div>
              </div>


              {copies.length === 0 ? (
                <EmptyState
                  title="No answer copies found"
                  message="There are no student submissions registered yet for this examination."
                />
              ) : (
                <div className="divide-y divide-slate-800/60 max-h-[600px] overflow-y-auto">
                  {copies.map((copy) => {
                    const isSelected = selectedCopyIds.includes(copy._id);
                    const isCompleted = ['COMPLETED', 'FINALIZED', 'ADMIN_REVIEWED'].includes(copy.evaluationStatus);
                    const isAiProcessed = ['AI_EVALUATED', 'AI_REVIEWED', 'ADMIN_REVIEW', 'FINALIZED', 'ADMIN_REVIEWED'].includes(copy.evaluationStatus);
                    const isAiFailed = ['AI_FAILED', 'FAILED'].includes(copy.evaluationStatus);
                    const isAiRunning = ['AI_PROCESSING', 'PROCESSING'].includes(copy.evaluationStatus);

                    return (
                      <div
                        key={copy._id}
                        onClick={() => toggleSelectCopy(copy._id)}
                        className={`p-4 flex items-center justify-between transition-colors ${
                          isSelected
                            ? 'bg-indigo-600/10 border-l-4 border-indigo-500'
                            : 'hover:bg-slate-800/30'
                        } cursor-pointer`}
                      >
                        <div className="flex items-center space-x-3.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSelectCopy(copy._id);
                            }}
                            className="text-slate-400 hover:text-indigo-400"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-5 h-5 text-indigo-400" />
                            ) : (
                              <Square className="w-5 h-5 text-slate-600" />
                            )}
                          </button>

                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-mono font-bold text-sm text-white">{copy.copyId}</span>
                              <Badge status={copy.evaluationStatus}>{copy.evaluationStatus}</Badge>
                              {copy.bookletNumber && (
                                <span className="text-[10px] text-slate-400 font-mono">
                                  [{copy.bookletNumber}]
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                              Student:{' '}
                              <span className="text-slate-200 font-medium">
                                {copy.candidateName || copy.student?.name || 'Candidate'}
                              </span>{' '}
                              ({copy.candidateRollNo || copy.student?.studentRollNo || 'N/A'})
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 text-right text-xs">
                          <div>
                            {copy.evaluationMode === 'AI' || copy.evaluationMode === 'AI_EVALUATION' || isAiProcessed ? (
                              <span className="text-emerald-400 font-medium text-[11px] flex items-center space-x-1 justify-end">
                                <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                                <span>AI System (No Evaluator)</span>
                              </span>
                            ) : copy.assignedEvaluator ? (
                              <div>
                                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                                  Assigned To
                                </span>
                                <span className="font-semibold text-slate-200">
                                  {copy.assignedEvaluator.name}
                                </span>
                              </div>
                            ) : (
                              <span className="text-amber-400/80 font-medium italic">Unassigned</span>
                            )}

                            {/* Score Display */}
                            {copy.totalAwardedMarks !== null && copy.totalAwardedMarks !== undefined ? (
                              <div className="text-[11px] font-mono text-emerald-400 font-bold mt-1">
                                Final: {copy.finalTotal ?? copy.totalAwardedMarks} / {copy.totalMaxMarks} ({copy.percentage}%)
                              </div>
                            ) : copy.aiTotal !== null && copy.aiTotal !== undefined ? (
                              <div className="text-[10px] font-mono text-amber-400/90 mt-1">
                                AI: {copy.aiTotal} / {copy.totalMaxMarks}
                              </div>
                            ) : null}
                          </div>

                          {/* Quick Action Buttons on Item */}
                          {isAiProcessed && (
                            <Button
                              size="sm"
                              variant="outline"
                              icon={Edit3}
                              onClick={(e) => {
                                e.stopPropagation();
                                openAiReviewModal(copy);
                              }}
                              className="text-[11px] text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/10 shrink-0"
                            >
                              Review AI Evaluation
                            </Button>

                          )}

                          {isAiFailed && (
                            <Button
                              size="sm"
                              variant="outline"
                              icon={RefreshCw}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRetrySingleCopyAi(copy._id);
                              }}
                              className="text-[11px] text-rose-300 border-rose-500/40 hover:bg-rose-500/10 shrink-0"
                            >
                              Retry AI
                            </Button>
                          )}

                          {isAiRunning && (
                            <span className="text-amber-400 text-xs flex items-center space-x-1 animate-pulse shrink-0">
                              <RefreshCw className="w-3 h-3 animate-spin" />
                              <span>AI Evaluating...</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI EVALUATION CONFIRMATION MODAL */}
      <Modal
        isOpen={confirmAiModal}
        onClose={() => !aiProcessing && setConfirmAiModal(false)}
        title="Evaluate Scanned Copy with AI?"
      >
        <div className="space-y-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center space-x-2 text-amber-400 font-semibold text-sm">
              <Sparkles className="w-4 h-4" />
              <span>Gemini AI Evaluation Confirmation</span>
            </div>
            <p className="leading-relaxed text-slate-300">
              This answer copy will be automatically evaluated using the configured AI evaluation system.
            </p>
            <p className="leading-relaxed text-slate-400 text-[11px]">
              The generated marks and feedback can be reviewed and modified by the Admin after evaluation.
            </p>
            <div className="pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between">
              <span>
                Selected Copies: <strong className="text-white">{selectedCopyIds.length}</strong>
              </span>
              <span>
                Subject: <strong className="text-indigo-400">{selectedExam?.subject}</strong>
              </span>
            </div>
          </div>

          {aiProcessing && (
            <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center space-x-2 animate-pulse">
              <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
              <span>AI is evaluating the answer copy... Please wait.</span>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              disabled={aiProcessing}
              onClick={() => setConfirmAiModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Sparkles}
              loading={aiProcessing}
              onClick={handleStartAiEvaluation}
              className="bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 text-white font-medium"
            >
              Check with AI
            </Button>
          </div>
        </div>
      </Modal>

      {/* ADMIN AI REVIEW & MODIFICATION MODAL */}
      <Modal
        isOpen={!!reviewModalCopy}
        onClose={() => !savingFinalMarks && setReviewModalCopy(null)}
        title={`AI Evaluation Review: ${reviewModalCopy?.copyId}`}
        maxWidth="max-w-3xl"
      >
        <div className="space-y-4 text-xs max-h-[75vh] overflow-y-auto pr-1">
          {/* Header Summary */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-3 gap-3">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Candidate</span>
              <span className="font-semibold text-slate-100">
                {reviewModalCopy?.candidateName || reviewModalCopy?.student?.name || 'Candidate'}
              </span>
              <span className="text-[10px] text-slate-400 block font-mono">
                Roll: {reviewModalCopy?.candidateRollNo || reviewModalCopy?.student?.studentRollNo || 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Subject & Booklet</span>
              <span className="font-semibold text-indigo-400">{selectedExam?.subject}</span>
              <span className="text-[10px] text-slate-400 block font-mono">
                Booklet: {reviewModalCopy?.bookletNumber || 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Evaluation Status</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 inline-block mt-0.5">
                {reviewModalCopy?.evaluationStatus}
              </span>
            </div>
          </div>

          {/* Question-wise AI Marks and Final Marks Review Table */}
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
            <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
              <span className="font-bold text-white uppercase text-[11px] tracking-wider">
                Question-Wise AI Marks & Feedback
              </span>
              <span className="text-[11px] text-slate-400">
                Modify final marks if required. Original AI marks remain preserved.
              </span>
            </div>

            <div className="divide-y divide-slate-800/80">
              {(reviewModalCopy?.answers || []).map((ans) => {
                const qId = (ans.question?._id || ans.question)?.toString() || String(ans.questionNumber);
                const maxMarks = ans.maxMarks || 10;
                const aiScore = ans.aiMarks !== null && ans.aiMarks !== undefined ? ans.aiMarks : (ans.aiSuggestedMarks ?? ans.marksAwarded ?? 0);
                const currentFinal = reviewForm[qId]?.finalMarks !== undefined ? reviewForm[qId].finalMarks : (ans.finalMarks ?? aiScore);
                const currentComment = reviewForm[qId]?.comments !== undefined ? reviewForm[qId].comments : (ans.adminComment || '');
                const isModified = Number(currentFinal) !== Number(aiScore);

                return (
                  <div key={qId} className="p-4 space-y-3 hover:bg-slate-900/30 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-indigo-400 text-xs">
                            Q{ans.questionNumber}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            (Max: {maxMarks} marks)
                          </span>
                          {isModified && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                              Modified by Admin
                            </span>
                          )}
                        </div>
                        {ans.question?.questionText && (
                          <p className="text-xs text-slate-300 font-medium leading-relaxed">
                            {ans.question.questionText}
                          </p>
                        )}
                      </div>

                      {/* Marks Awarded Column: AI Marks vs Final Marks Input */}
                      <div className="flex items-center space-x-3 shrink-0 bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                        <div className="text-center">
                          <span className="text-[10px] text-slate-400 block font-sans">AI Marks</span>
                          <span className="font-mono font-bold text-amber-400 text-xs">
                            {aiScore} / {maxMarks}
                          </span>
                        </div>

                        <div className="h-6 w-px bg-slate-800" />

                        <div>
                          <label className="text-[10px] text-slate-400 block font-sans">
                            Final Marks
                          </label>
                          <input
                            type="number"
                            min="0"
                            max={maxMarks}
                            step="0.5"
                            value={currentFinal}
                            onChange={(e) => handleReviewMarkChange(qId, e.target.value, maxMarks)}
                            className="w-16 bg-slate-950 border border-indigo-500/50 rounded px-2 py-1 text-xs font-mono font-bold text-white text-center focus:outline-none focus:border-indigo-400"
                          />
                        </div>
                      </div>
                    </div>

                    {/* AI Feedback */}
                    {ans.aiFeedback && (
                      <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-300">
                        <span className="font-semibold text-amber-400/90 mr-1.5">AI Feedback:</span>
                        <span>{ans.aiFeedback}</span>
                      </div>
                    )}

                    {/* Admin Comment Input */}
                    <div>
                      <input
                        type="text"
                        placeholder="Admin Comment (e.g. Additional marks awarded for thorough architectural clarity)"
                        value={currentComment}
                        onChange={(e) => handleReviewCommentChange(qId, e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-[11px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Overall Comments */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1 text-xs">
              Overall Review Comment
            </label>
            <textarea
              rows="2"
              value={reviewOverallComment}
              onChange={(e) => setReviewOverallComment(e.target.value)}
              placeholder="Admin remarks on overall answer copy..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Totals Summary Footer */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono">
            <div>
              <span className="text-slate-400 block text-[10px]">Original AI Total</span>
              <span className="font-bold text-amber-400 text-sm">
                {reviewModalCopy?.aiTotal ?? 0} / {reviewModalCopy?.totalMaxMarks ?? selectedExam?.maxMarks ?? 100}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px]">Final Total (Calculated)</span>
              <span className="font-bold text-emerald-400 text-sm">
                {calculateModalFinalTotal()} / {reviewModalCopy?.totalMaxMarks ?? selectedExam?.maxMarks ?? 100}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                disabled={savingFinalMarks}
                onClick={() => setReviewModalCopy(null)}
              >
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={CheckCircle2}
                loading={savingFinalMarks}
                onClick={handleSaveFinalMarks}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold"
              >
                Finalize Evaluation
              </Button>

            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CopyAssignment;
