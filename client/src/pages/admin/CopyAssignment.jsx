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
  ExternalLink,
  X,
  Trash2,
  Plus
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

  // Track recently AI-evaluated copy IDs to prioritize at the very top of the list
  const [recentlyEvaluatedIds, setRecentlyEvaluatedIds] = useState([]);

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
      const res = await api.get(`/answer-copies?examinationId=${examId}&limit=200&excludeFinalized=true`);
      if (res.data.success) {
        // Automatically exclude finalized/completed copies from the copy assignment list
        const unfinalizedCopies = (res.data.answerCopies || []).filter((copy) => {
          const isFinalized =
            ['FINALIZED', 'ADMIN_REVIEWED', 'COMPLETED', 'REVIEWED'].includes(copy.evaluationStatus) ||
            ['FINALIZED', 'COMPLETED', 'REVIEWED'].includes(copy.status);
          return !isFinalized;
        });
        setCopies(unfinalizedCopies);
        setSelectedCopyIds((prev) => prev.filter((id) => unfinalizedCopies.some((c) => c._id === id)));
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
        ['COMPLETED', 'FINALIZED', 'ADMIN_REVIEWED', 'REVIEWED', 'EVALUATED'].includes(copy.evaluationStatus) ||
        ['COMPLETED', 'FINALIZED', 'REVIEWED', 'EVALUATED'].includes(copy.status);
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
  const selectedCopies = copies.filter((c) => selectedCopyIds.includes(c._id));
  const availableCopiesList = copies.filter((c) => {
    const isFinalized =
      ['FINALIZED', 'ADMIN_REVIEWED', 'COMPLETED', 'REVIEWED'].includes(c.evaluationStatus) ||
      ['FINALIZED', 'COMPLETED', 'REVIEWED'].includes(c.status);
    return !selectedCopyIds.includes(c._id) && !isFinalized;
  });
  const eligibleUnselectedCopies = eligibleCopies.filter((c) => !selectedCopyIds.includes(c._id));

  // Sort copies so that recently AI-evaluated copies and AI-evaluated copies requiring review are right at the very top!
  const sortedAvailableCopies = [...availableCopiesList].sort((a, b) => {
    // Priority 1: Copies evaluated in the current batch/session
    const aRecentIdx = recentlyEvaluatedIds.indexOf(a._id);
    const bRecentIdx = recentlyEvaluatedIds.indexOf(b._id);
    if (aRecentIdx !== -1 && bRecentIdx !== -1) {
      return aRecentIdx - bRecentIdx;
    }
    if (aRecentIdx !== -1) return -1;
    if (bRecentIdx !== -1) return 1;

    // Priority 2: Copies checked by AI needing Admin Review
    const aIsAiEvaluated = ['AI_EVALUATED', 'AI_REVIEW_PENDING', 'ADMIN_REVIEW'].includes(a.evaluationStatus);
    const bIsAiEvaluated = ['AI_EVALUATED', 'AI_REVIEW_PENDING', 'ADMIN_REVIEW'].includes(b.evaluationStatus);
    if (aIsAiEvaluated && !bIsAiEvaluated) return -1;
    if (!aIsAiEvaluated && bIsAiEvaluated) return 1;

    // Priority 3: Copies currently processing AI
    const aIsProcessing = ['AI_PROCESSING', 'PROCESSING'].includes(a.evaluationStatus);
    const bIsProcessing = ['AI_PROCESSING', 'PROCESSING'].includes(b.evaluationStatus);
    if (aIsProcessing && !bIsProcessing) return -1;
    if (!aIsProcessing && bIsProcessing) return 1;

    // Priority 4: Finalized copies
    const aIsFinalized = ['FINALIZED', 'ADMIN_REVIEWED', 'COMPLETED'].includes(a.evaluationStatus);
    const bIsFinalized = ['FINALIZED', 'ADMIN_REVIEWED', 'COMPLETED'].includes(b.evaluationStatus);
    if (aIsFinalized && !bIsFinalized) return -1;
    if (!aIsFinalized && bIsFinalized) return 1;

    // Priority 5: AI Failed copies
    const aIsFailed = ['AI_FAILED', 'FAILED'].includes(a.evaluationStatus);
    const bIsFailed = ['AI_FAILED', 'FAILED'].includes(b.evaluationStatus);
    if (aIsFailed && !bIsFailed) return -1;
    if (!aIsFailed && bIsFailed) return 1;

    // Priority 6: Newest evaluated / created first
    if (a.evaluatedAt && b.evaluatedAt) {
      return new Date(b.evaluatedAt) - new Date(a.evaluatedAt);
    }
    if (a.evaluatedAt) return -1;
    if (b.evaluatedAt) return 1;

    return (a.copyId || '').localeCompare(b.copyId || '', undefined, { numeric: true, sensitivity: 'base' });
  });

  // Bulk Random Copy Selection (10, 20, 50, 100 or custom count)
  const handleSelectRandomCopies = (count) => {
    const eligibleUnselected = getEligibleCopies().filter(
      (c) => !selectedCopyIds.includes(c._id)
    );
    const availableCount = eligibleUnselected.length;

    if (availableCount === 0) {
      showToast(
        `All eligible copies are already selected for assignment.`,
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
    const shuffled = [...eligibleUnselected];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const newlySelected = shuffled.slice(0, selectCount);
    const newlySelectedIds = newlySelected.map((c) => c._id);
    setSelectedCopyIds((prev) => [...prev, ...newlySelectedIds]);

    showToast(
      `Selected ${selectCount} copies (${selectedCopyIds.length + selectCount} total). Removed from available list.`,
      'success'
    );
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

    const idsBeingEvaluated = [...selectedCopyIds];

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

      // Add evaluated copies to recentlyEvaluatedIds so they immediately show at top of the list!
      setRecentlyEvaluatedIds((prev) => [
        ...idsBeingEvaluated,
        ...prev.filter((id) => !idsBeingEvaluated.includes(id))
      ]);

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
        setRecentlyEvaluatedIds((prev) => [copyId, ...prev.filter((id) => id !== copyId)]);
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
      const rawVal = reviewForm[qId]?.finalMarks;
      const val = rawVal !== undefined && rawVal !== '' ? Number(rawVal) : (ans.finalMarks ?? ans.aiMarks ?? ans.marksAwarded ?? 0);
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
        const rawVal = entry.finalMarks;
        const finalVal = rawVal !== undefined && rawVal !== '' ? Number(rawVal) : (ans.finalMarks ?? ans.aiMarks ?? ans.marksAwarded ?? 0);
        return {
          questionId: qId,
          questionNumber: ans.questionNumber,
          finalMarks: finalVal,
          comments: entry.comments || ''
        };
      });

      const res = await api.put(`/answer-copies/${reviewModalCopy._id}/admin-save-marks`, {
        questionMarks: questionMarksPayload,
        overallComments: reviewOverallComment || 'Admin reviewed and finalized marks.'
      });

      if (res.data.success) {
        showToast(res.data.message || 'Evaluation finalized successfully! Status updated to FINALIZED.', 'success');
        const finalizedId = reviewModalCopy._id;
        setSelectedCopyIds((prev) => prev.filter((id) => id !== finalizedId));
        setRecentlyEvaluatedIds((prev) => prev.filter((id) => id !== finalizedId));
        setCopies((prev) => prev.filter((c) => c._id !== finalizedId));
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
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3 flex items-center space-x-2">
                <span className="w-5 h-5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs flex items-center justify-center font-bold">
                  1
                </span>
                <span>Select Examination</span>
              </h4>

              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-600"
              >
                {exams.map((ex) => (
                  <option key={ex._id} value={ex._id}>
                    {ex.code} - {ex.name} ({ex.subject})
                  </option>
                ))}
              </select>

              {selectedExam && (
                <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Subject:</span>
                    <span className="font-semibold text-indigo-600">{selectedExam.subject}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Marks:</span>
                    <span className="text-slate-800 font-mono font-bold">{selectedExam.maxMarks}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Evaluation Flow Option (Manual Check vs Check with AI) */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3 flex items-center space-x-2">
                <span className="w-5 h-5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs flex items-center justify-center font-bold">
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
                      ? 'bg-indigo-50/80 border-indigo-500 ring-1 ring-indigo-500 text-slate-900 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <UserCheck className={`w-4 h-4 ${evaluationMode === 'MANUAL' ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span className="text-xs font-bold">Manual Check</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    Assign to subject-expert faculty evaluator for manual marking
                  </p>
                </button>

                {/* Option 2: Check with AI */}
                <button
                  type="button"
                  onClick={() => setEvaluationMode('AI')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    evaluationMode === 'AI'
                      ? 'bg-amber-50/80 border-amber-500 ring-1 ring-amber-500 text-slate-900 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <Sparkles className={`w-4 h-4 ${evaluationMode === 'AI' ? 'text-amber-600' : 'text-slate-400'}`} />
                    <span className="text-xs font-bold">Check with AI</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    Automated Gemini AI rubric grading + Admin review
                  </p>
                </button>
              </div>
            </div>

            {/* FLOW 1: MANUAL CHECK CONTROLS */}
            {evaluationMode === 'MANUAL' && (
              <>
                {/* Step 3: Select Evaluator */}
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3 flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs flex items-center justify-center font-bold">
                      3
                    </span>
                    <span>Select Faculty Evaluator</span>
                  </h4>

                  <select
                    value={selectedEvaluatorId}
                    onChange={(e) => setSelectedEvaluatorId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-600"
                  >
                    <option value="">-- Choose Evaluator --</option>
                    {evaluators.map((ev) => (
                      <option key={ev._id} value={ev._id}>
                        {ev.name} ({ev.department})
                      </option>
                    ))}
                  </select>

                  {selectedEvaluator && (
                    <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Evaluator:</span>
                        <span className="font-semibold text-slate-800">{selectedEvaluator.name}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block mb-1">Subjects:</span>
                        <div className="flex flex-wrap gap-1">
                          {selectedEvaluator.subjects?.map((s, i) => (
                            <span
                              key={i}
                              className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                                selectedExam && s.toLowerCase().trim() === selectedExam.subject.toLowerCase().trim()
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-bold'
                                  : 'bg-slate-100 border-slate-200 text-slate-600'
                              }`}
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Subject Match Indicator */}
                      {!isSubjectMatch ? (
                        <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[11px] flex items-center space-x-1.5">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>Warning: Not authorized for {selectedExam?.subject}</span>
                        </div>
                      ) : (
                        <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] flex items-center space-x-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span>Subject Matched: Authorized</span>
                        </div>
                      )}

                      <div className="pt-2 border-t border-slate-200">
                        <div className="flex justify-between text-[11px] text-slate-500">
                          <span>Current Workload:</span>
                          <span className="font-mono font-semibold text-slate-800">
                            {selectedEvaluator.workload?.activeAssigned || 0} / {selectedEvaluator.maxWorkload || 50} copies
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Manual Action Card */}
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-3 text-xs">
                    <span className="text-slate-500">Selected for Assignment:</span>
                    <span className="font-mono font-bold text-indigo-600 text-sm">
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
                    className="w-full shadow-sm"
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
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center space-x-2 text-amber-600 font-semibold text-xs">
                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>Gemini AI Evaluation Engine</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Evaluates scanned answer copies against question paper, marking rubrics, and reference points directly using multimodal Google Gemini AI.
                  </p>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-[11px] text-slate-700">
                    <div className="flex items-center space-x-1.5 text-emerald-700 font-medium">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>No human evaluator assignment required</span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-emerald-700 font-medium">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Independent question-wise marks & feedback</span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-emerald-700 font-medium">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Admin mark review & override before finalization</span>
                    </div>
                  </div>
                </div>

                {/* AI Action Card */}
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-3 text-xs">
                    <span className="text-slate-500">Selected for AI Check:</span>
                    <span className="font-mono font-bold text-amber-600 text-sm">
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
                    className="w-full bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 text-white shadow-sm font-semibold border-none"
                  >
                    🤖 Check with AI
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* Right Column: Staged Selected Copies & Available (Unselected) Copies */}
          <div className="lg:col-span-2 space-y-4">
            {/* STAGED SELECTED COPIES SECTION */}
            {selectedCopyIds.length > 0 && (
              <div className="bg-white rounded-2xl border border-indigo-200 shadow-md overflow-hidden transition-all duration-300">
                <div className="p-4 bg-indigo-50/70 border-b border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-bold text-slate-900 tracking-tight">
                          Selected for Assignment
                        </h4>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-indigo-600 text-white shadow-xs">
                          {selectedCopyIds.length} copies
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        These copies are selected for assignment and removed from the available list below.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedCopyIds([])}
                      className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 shrink-0"
                    >
                      <X className="w-3.5 h-3.5 mr-1" />
                      Clear Selection
                    </Button>
                  </div>
                </div>

                {/* List of selected copies with remove action */}
                <div className="p-2.5 max-h-56 overflow-y-auto divide-y divide-slate-100 bg-white">
                  {selectedCopies.map((copy, index) => (
                    <div
                      key={copy._id}
                      className="py-2.5 px-3 flex items-center justify-between hover:bg-slate-50 rounded-xl transition-colors group"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-xs font-mono text-indigo-600 font-bold w-6">
                          #{index + 1}
                        </span>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-bold text-xs text-slate-900">
                              {copy.copyId}
                            </span>
                            {copy.bookletNumber && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                [{copy.bookletNumber}]
                              </span>
                            )}
                            <Badge status={copy.evaluationStatus}>{copy.evaluationStatus}</Badge>
                          </div>
                          <p className="text-[11px] text-slate-500">
                            {copy.candidateName || copy.student?.name || 'Candidate'} (
                            {copy.candidateRollNo || copy.student?.studentRollNo || 'N/A'})
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleSelectCopy(copy._id)}
                        className="px-2 py-1 rounded-md text-xs font-medium text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all flex items-center space-x-1"
                        title="Remove from selection and return to available list"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Deselect</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AVAILABLE ANSWER COPIES (Unselected Copies) */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-100 bg-white">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 tracking-tight">Available Answer Copies</h4>
                    <p className="text-xs text-slate-500">
                      Showing {availableCopiesList.length} unselected copies for {selectedExam?.name} ({copies.length} total)
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={selectAllUnassigned}
                      disabled={eligibleUnselectedCopies.length === 0}
                    >
                      Select All Unassigned
                    </Button>
                    {selectedCopyIds.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedCopyIds([])}
                      >
                        Clear Selection
                      </Button>
                    )}
                  </div>
                </div>

                {/* BULK RANDOM COPY SELECTION BAR */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center space-x-2.5">
                    <span className="text-slate-500">
                      Available Copies:{' '}
                      <strong className="text-slate-900 font-mono font-bold text-xs">
                        {eligibleUnselectedCopies.length}
                      </strong>
                    </span>
                    {selectedCopyIds.length > 0 && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 font-mono">
                        {selectedCopyIds.length} Selected
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-slate-500 text-[11px] font-medium">Select Copies:</span>
                    {[10, 20, 50, 100].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => handleSelectRandomCopies(num)}
                        disabled={eligibleUnselectedCopies.length === 0}
                        className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-200 text-slate-700 font-mono font-bold text-xs transition-colors shadow-xs"
                      >
                        [ {num} ]
                      </button>
                    ))}

                    <span className="text-slate-400 text-[11px]">or</span>

                    <div className="flex items-center space-x-1.5">
                      <input
                        type="number"
                        min="1"
                        max={eligibleUnselectedCopies.length || 1}
                        placeholder="Qty"
                        value={customRandomCount}
                        onChange={(e) => setCustomRandomCount(e.target.value)}
                        className="w-16 bg-white border border-slate-200 rounded-lg px-2 py-1 text-center text-xs font-mono text-slate-900 focus:outline-none focus:border-indigo-600"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSelectRandomCopies(customRandomCount || 10)}
                        disabled={eligibleUnselectedCopies.length === 0}
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
              ) : availableCopiesList.length === 0 ? (
                <div className="p-8 text-center bg-slate-50">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h5 className="text-sm font-bold text-slate-900">All Copies Selected</h5>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    All {copies.length} copies are currently selected and staged for assignment in the section above.
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedCopyIds([])}
                    className="mt-4 text-xs text-indigo-600 hover:text-indigo-700"
                  >
                    Clear selection to view all available copies
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                  {sortedAvailableCopies.map((copy) => {
                    const isSelected = selectedCopyIds.includes(copy._id);
                    const isFinalized = ['FINALIZED', 'ADMIN_REVIEWED', 'COMPLETED'].includes(copy.evaluationStatus);
                    const isAiEvaluated = copy.evaluationStatus === 'AI_EVALUATED' || copy.evaluationStatus === 'AI_REVIEW_PENDING';
                    const isAiProcessed = isAiEvaluated || isFinalized;
                    const isAiFailed = ['AI_FAILED', 'FAILED'].includes(copy.evaluationStatus);
                    const isAiRunning = ['AI_PROCESSING', 'PROCESSING'].includes(copy.evaluationStatus);
                    const isRecentlyEvaluated = recentlyEvaluatedIds.includes(copy._id);

                    return (
                      <div
                        key={copy._id}
                        onClick={() => {
                          if (!isFinalized && !isAiEvaluated) {
                            toggleSelectCopy(copy._id);
                          }
                        }}
                        className={`p-4 flex items-center justify-between transition-colors ${
                          isSelected
                            ? 'bg-indigo-50/60 border-l-4 border-indigo-600'
                            : isRecentlyEvaluated && isAiEvaluated
                            ? 'bg-amber-50/60 border-l-4 border-amber-500'
                            : isAiEvaluated
                            ? 'bg-amber-50/30 border-l-2 border-amber-400 hover:bg-amber-50/60'
                            : isFinalized
                            ? 'bg-emerald-50/30 border-l-2 border-emerald-400 hover:bg-emerald-50/60'
                            : 'hover:bg-slate-50'
                        } ${!isFinalized && !isAiEvaluated ? 'cursor-pointer' : ''}`}
                      >
                        <div className="flex items-center space-x-3.5">
                          <button
                            type="button"
                            disabled={isFinalized || isAiEvaluated}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isFinalized && !isAiEvaluated) {
                                toggleSelectCopy(copy._id);
                              }
                            }}
                            className={`${isFinalized || isAiEvaluated ? 'opacity-30 cursor-not-allowed text-slate-400' : 'text-slate-400 hover:text-indigo-600'}`}
                          >
                            {isSelected ? (
                              <CheckSquare className="w-5 h-5 text-indigo-600" />
                            ) : (
                              <Square className="w-5 h-5 text-slate-400" />
                            )}
                          </button>

                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-mono font-bold text-sm text-slate-900">{copy.copyId}</span>
                              <Badge status={copy.evaluationStatus}>{copy.evaluationStatus}</Badge>
                              {isRecentlyEvaluated && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-200">
                                  Just Evaluated
                                </span>
                              )}
                              {copy.bookletNumber && (
                                <span className="text-[10px] text-slate-400 font-mono">
                                  [{copy.bookletNumber}]
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Student:{' '}
                              <span className="text-slate-800 font-medium">
                                {copy.candidateName || copy.student?.name || 'Candidate'}
                              </span>{' '}
                              ({copy.candidateRollNo || copy.student?.studentRollNo || 'N/A'})
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 text-right text-xs">
                          <div>
                            {copy.evaluationMode === 'AI' || copy.evaluationMode === 'AI_EVALUATION' || isAiProcessed ? (
                              <span className="text-emerald-700 font-medium text-[11px] flex items-center space-x-1 justify-end">
                                <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                                <span>AI System (No Evaluator)</span>
                              </span>
                            ) : copy.assignedEvaluator ? (
                              <div>
                                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                                  Assigned To
                                </span>
                                <span className="font-semibold text-slate-800">
                                  {copy.assignedEvaluator.name}
                                </span>
                              </div>
                            ) : (
                              <span className="text-amber-700 font-medium italic">Unassigned</span>
                            )}

                            {/* Score Display */}
                            {isFinalized && copy.totalAwardedMarks !== null && copy.totalAwardedMarks !== undefined ? (
                              <div className="text-[11px] font-mono text-emerald-700 font-bold mt-1">
                                Final: {copy.finalTotal ?? copy.totalAwardedMarks} / {copy.totalMaxMarks} ({copy.percentage}%)
                              </div>
                            ) : copy.aiTotal !== null && copy.aiTotal !== undefined ? (
                              <div className="text-[11px] font-mono text-amber-700 font-bold mt-1">
                                AI Score: {copy.aiTotal} / {copy.totalMaxMarks}
                              </div>
                            ) : null}
                          </div>

                          {/* Quick Action Buttons on Item */}
                          {isAiEvaluated && (
                            <Button
                              size="sm"
                              variant="primary"
                              icon={Edit3}
                              onClick={(e) => {
                                e.stopPropagation();
                                openAiReviewModal(copy);
                              }}
                              className="text-xs bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 text-white shadow-sm shrink-0 font-semibold border-none"
                            >
                              Review & Finalize
                            </Button>
                          )}

                          {isFinalized && (
                            <Button
                              size="sm"
                              variant="outline"
                              icon={Edit3}
                              onClick={(e) => {
                                e.stopPropagation();
                                openAiReviewModal(copy);
                              }}
                              className="text-[11px] text-emerald-700 border-emerald-200 hover:bg-emerald-50 shrink-0"
                            >
                              Review / Edit
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
                              className="text-[11px] text-rose-700 border-rose-200 hover:bg-rose-50 shrink-0"
                            >
                              Retry AI
                            </Button>
                          )}

                          {isAiRunning && (
                            <span className="text-amber-700 text-xs flex items-center space-x-1 animate-pulse shrink-0 font-medium">
                              <RefreshCw className="w-3 h-3 animate-spin text-amber-600" />
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
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center space-x-2 text-amber-700 font-bold text-sm">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Gemini AI Evaluation Confirmation</span>
            </div>
            <p className="leading-relaxed text-slate-700">
              This answer copy will be automatically evaluated using the configured AI evaluation system.
            </p>
            <p className="leading-relaxed text-slate-500 text-[11px]">
              The generated marks and feedback can be reviewed and modified by the Admin after evaluation.
            </p>
            <div className="pt-2 border-t border-slate-200 text-[11px] font-mono text-slate-500 flex items-center justify-between">
              <span>
                Selected Copies: <strong className="text-slate-900">{selectedCopyIds.length}</strong>
              </span>
              <span>
                Subject: <strong className="text-indigo-600 font-semibold">{selectedExam?.subject}</strong>
              </span>
            </div>
          </div>

          {aiProcessing && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center space-x-2 animate-pulse font-medium">
              <RefreshCw className="w-4 h-4 animate-spin text-amber-600 shrink-0" />
              <span>AI is evaluating the answer copy... Please wait.</span>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
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
              className="bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 text-white font-medium border-none"
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
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-3 gap-3">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">Candidate</span>
              <span className="font-semibold text-slate-800">
                {reviewModalCopy?.candidateName || reviewModalCopy?.student?.name || 'Candidate'}
              </span>
              <span className="text-[10px] text-slate-400 block font-mono">
                Roll: {reviewModalCopy?.candidateRollNo || reviewModalCopy?.student?.studentRollNo || 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">Subject & Booklet</span>
              <span className="font-semibold text-indigo-600">{selectedExam?.subject}</span>
              <span className="text-[10px] text-slate-400 block font-mono">
                Booklet: {reviewModalCopy?.bookletNumber || 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">Evaluation Status</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-block mt-0.5">
                {reviewModalCopy?.evaluationStatus}
              </span>
            </div>
          </div>

          {/* Question-wise AI Marks and Final Marks Review Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="font-bold text-slate-800 uppercase text-[11px] tracking-wider">
                Question-Wise AI Marks & Feedback
              </span>
              <span className="text-[11px] text-slate-500">
                Modify final marks if required. Original AI marks remain preserved.
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {(reviewModalCopy?.answers || []).map((ans) => {
                const qId = (ans.question?._id || ans.question)?.toString() || String(ans.questionNumber);
                const maxMarks = ans.maxMarks || 10;
                const aiScore = ans.aiMarks !== null && ans.aiMarks !== undefined ? ans.aiMarks : (ans.aiSuggestedMarks ?? ans.marksAwarded ?? 0);
                const currentFinal = reviewForm[qId]?.finalMarks !== undefined ? reviewForm[qId].finalMarks : (ans.finalMarks ?? aiScore);
                const currentComment = reviewForm[qId]?.comments !== undefined ? reviewForm[qId].comments : (ans.adminComment || '');
                const isModified = Number(currentFinal) !== Number(aiScore);

                return (
                  <div key={qId} className="p-4 space-y-3 hover:bg-slate-50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-indigo-600 text-xs">
                            Q{ans.questionNumber}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            (Max: {maxMarks} marks)
                          </span>
                          {isModified && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              Modified by Admin
                            </span>
                          )}
                        </div>
                        {ans.question?.questionText && (
                          <p className="text-xs text-slate-700 font-medium leading-relaxed">
                            {ans.question.questionText}
                          </p>
                        )}
                        {ans.studentAnswer && (
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-700">
                            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">
                              Student's Answer:
                            </span>
                            <p className="whitespace-pre-wrap font-sans text-slate-800 leading-relaxed">
                              {ans.studentAnswer}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Marks Awarded Column: AI Marks vs Final Marks Input */}
                      <div className="flex items-center space-x-3 shrink-0 bg-slate-50 p-2 rounded-xl border border-slate-200">
                        <div className="text-center">
                          <span className="text-[10px] text-slate-500 block font-sans">AI Marks</span>
                          <span className="font-mono font-bold text-amber-700 text-xs">
                            {aiScore} / {maxMarks}
                          </span>
                        </div>

                        <div className="h-6 w-px bg-slate-200" />

                        <div>
                          <label className="text-[10px] text-slate-500 block font-sans">
                            Final Marks
                          </label>
                          <input
                            type="number"
                            min="0"
                            max={maxMarks}
                            step="0.5"
                            value={currentFinal}
                            onChange={(e) => handleReviewMarkChange(qId, e.target.value, maxMarks)}
                            className="w-16 bg-white border border-indigo-400 rounded px-2 py-1 text-xs font-mono font-bold text-slate-900 text-center focus:outline-none focus:border-indigo-600"
                          />
                        </div>
                      </div>
                    </div>

                    {/* AI Feedback */}
                    {ans.aiFeedback && (
                      <div className="p-2.5 rounded-xl bg-amber-50/50 border border-amber-100 text-[11px] text-slate-700">
                        <span className="font-semibold text-amber-700 mr-1.5">AI Feedback:</span>
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
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Overall Comments */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1 text-xs">
              Overall Review Comment
            </label>
            <textarea
              rows="2"
              value={reviewOverallComment}
              onChange={(e) => setReviewOverallComment(e.target.value)}
              placeholder="Admin remarks on overall answer copy..."
              className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600"
            />
          </div>

          {/* Totals Summary Footer */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs font-mono">
            <div>
              <span className="text-slate-500 block text-[10px]">Original AI Total</span>
              <span className="font-bold text-amber-700 text-sm">
                {reviewModalCopy?.aiTotal ?? 0} / {reviewModalCopy?.totalMaxMarks ?? selectedExam?.maxMarks ?? 100}
              </span>
            </div>

            <div>
              <span className="text-slate-500 block text-[10px]">Final Total (Calculated)</span>
              <span className="font-bold text-emerald-700 text-sm">
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
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm border-none"
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
