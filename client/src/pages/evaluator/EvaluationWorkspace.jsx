import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import {
  Sparkles,
  Save,
  CheckCircle2,
  ArrowLeft,
  BookOpen,
  MessageSquare,
  Check,
  AlertCircle,
  FileCheck,
  Eye,
  EyeOff,
  FileText,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Lock,
  Award,
  RefreshCw
} from 'lucide-react';

const EvaluationWorkspace = () => {
  const { copyId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();

  const [copy, setCopy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [evalMode, setEvalMode] = useState('MANUAL'); // 'MANUAL' or 'AI_EVALUATION'
  const [isModeLocked, setIsModeLocked] = useState(false);

  const isAiMode = ['AI_EVALUATION', 'AI', 'AI_ASSISTED'].includes(evalMode);

  // Question evaluations state: { [qId]: { marksAwarded, comments, aiSuggestedMarks, aiFeedback, wasAiAccepted, criteriaBreakdown: [] } }
  const [evaluations, setEvaluations] = useState({});
  const [overallComments, setOverallComments] = useState('');
  const [showRefAnswers, setShowRefAnswers] = useState({});

  // Viewer controls for scanned physical copy
  const [zoomLevel, setZoomLevel] = useState(1);
  const [activePageIndex, setActivePageIndex] = useState(0);

  // AI loading and action states
  const [aiLoading, setAiLoading] = useState({});
  const [approvingAi, setApprovingAi] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [submittingFinal, setSubmittingFinal] = useState(false);
  const [savingFinalMarks, setSavingFinalMarks] = useState(false);

  useEffect(() => {
    fetchCopyDetails();
  }, [copyId]);

  const fetchCopyDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/answer-copies/${copyId}`);
      if (res.data.success) {
        const copyData = res.data.answerCopy;
        const existingEval = res.data.existingEvaluation;

        setCopy(copyData);

        // Locked Evaluation Mode from Examination
        const examMode = copyData.examination?.evaluationMode || copyData.evaluationMode || 'MANUAL';
        const normalizedMode = ['AI_EVALUATION', 'AI', 'AI_ASSISTED'].includes(examMode) ? 'AI_EVALUATION' : 'MANUAL';
        setEvalMode(normalizedMode);
        setIsModeLocked(!!copyData.examination?.evaluationModeLocked);

        // Initialize evaluations map
        const initialMap = {};
        for (const ansItem of copyData.answers || []) {
          const qId = ansItem.question?._id || ansItem.question;
          const maxM = ansItem.maxMarks || ansItem.question?.marks || 10;

          const prevQ = existingEval?.questionEvaluations?.find(
            (qe) => (qe.question?._id || qe.question) === qId || qe.questionNumber === ansItem.questionNumber
          );

          const aiScore = ansItem.aiMarks ?? prevQ?.aiMarks ?? prevQ?.aiSuggestedMarks ?? ansItem.aiSuggestedMarks ?? null;
          const finalScore = ansItem.finalMarks ?? prevQ?.finalMarks ?? (aiScore !== null ? aiScore : (prevQ ? prevQ.marksAwarded : (ansItem.marksAwarded ?? 0)));

          initialMap[qId] = {
            questionId: qId,
            questionNumber: ansItem.questionNumber,
            maxMarks: maxM,
            aiMarks: aiScore,
            finalMarks: finalScore,
            marksAwarded: finalScore,
            comments: prevQ ? prevQ.comments : (ansItem.evaluatorRemarks || ''),
            aiSuggestedMarks: aiScore,
            aiFeedback: ansItem.aiFeedback || prevQ?.aiFeedback || ansItem.aiAnalysis || '',
            wasAiAccepted: prevQ ? prevQ.wasAiAccepted : ansItem.isAiApproved,
            criteriaBreakdown: prevQ?.criteriaBreakdown || []
          };
        }

        setEvaluations(initialMap);
        if (existingEval?.overallComments) {
          setOverallComments(existingEval.overallComments);
        }

        // In AI mode, if some questions have no AI suggestions yet, automatically trigger analysis
        if (normalizedMode === 'AI_EVALUATION') {
          for (const ansItem of copyData.answers || []) {
            const qId = ansItem.question?._id || ansItem.question;
            if (initialMap[qId]?.aiMarks === null && initialMap[qId]?.aiSuggestedMarks === null) {
              triggerAiEvaluation(copyData._id, ansItem);
            }
          }
        }
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load answer copy', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateQuestionEvaluation = (qId, field, val) => {
    setEvaluations((prev) => ({
      ...prev,
      [qId]: {
        ...prev[qId],
        [field]: val
      }
    }));
  };

  const toggleShowRef = (qId) => {
    setShowRefAnswers((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

  // Run AI Evaluation for a specific question
  const triggerAiEvaluation = async (copyIdToUse, ansItem) => {
    const qId = ansItem.question?._id || ansItem.question;
    try {
      setAiLoading((prev) => ({ ...prev, [qId]: true }));

      const res = await api.post('/ai/evaluate', {
        answerCopyId: copyIdToUse || copy?._id,
        questionId: qId,
        studentAnswer: ansItem.studentAnswer
      });

      if (res.data.success) {
        const aiData = res.data.data;
        const score = aiData.suggestedMarks ?? aiData.marksAwarded ?? 0;
        updateQuestionEvaluation(qId, 'aiMarks', score);
        updateQuestionEvaluation(qId, 'finalMarks', score);
        updateQuestionEvaluation(qId, 'marksAwarded', score);
        updateQuestionEvaluation(qId, 'aiSuggestedMarks', score);
        updateQuestionEvaluation(qId, 'aiFeedback', aiData.feedback || aiData.overallFeedback || '');
        updateQuestionEvaluation(qId, 'criteriaBreakdown', aiData.criteriaEvaluation || []);
      }
    } catch (err) {
      // silently log fallback
    } finally {
      setAiLoading((prev) => ({ ...prev, [qId]: false }));
    }
  };

  // FINAL MARKS (AI MODE): Admin editable mark change handler
  const handleFinalMarkChange = (qId, val, maxMarks) => {
    if (val === '') {
      updateQuestionEvaluation(qId, 'finalMarks', '');
      updateQuestionEvaluation(qId, 'marksAwarded', 0);
      return;
    }
    const num = Number(val);
    if (num > maxMarks) {
      showToast(`Marks cannot exceed question maximum (${maxMarks}).`, 'warning');
      return;
    }
    if (num < 0) {
      showToast('Marks cannot be negative.', 'warning');
      return;
    }

    updateQuestionEvaluation(qId, 'finalMarks', num);
    updateQuestionEvaluation(qId, 'marksAwarded', num);
  };

  // RETRY AI EVALUATION FOR A SINGLE QUESTION (Requirement 15)
  const handleRetryQuestionAi = async (qId) => {
    try {
      setAiLoading((prev) => ({ ...prev, [qId]: true }));
      const res = await api.post(`/answer-copies/${copy._id}/retry-question-ai`, {
        questionId: qId
      });
      if (res.data.success) {
        showToast(res.data.message || 'Question re-evaluated successfully!', 'success');
        setCopy(res.data.answerCopy);
        const targetAns = res.data.targetAnswer;
        updateQuestionEvaluation(qId, 'aiMarks', targetAns.aiMarks);
        updateQuestionEvaluation(qId, 'finalMarks', targetAns.finalMarks);
        updateQuestionEvaluation(qId, 'marksAwarded', targetAns.marksAwarded);
        updateQuestionEvaluation(qId, 'aiSuggestedMarks', targetAns.aiSuggestedMarks);
        updateQuestionEvaluation(qId, 'aiFeedback', targetAns.aiFeedback);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error retrying AI evaluation for question', 'error');
    } finally {
      setAiLoading((prev) => ({ ...prev, [qId]: false }));
    }
  };

  // ADMIN SAVE FINAL MARKS (Section 3, 5, 6, 14)
  const handleSaveAdminFinalMarks = async () => {
    // 1. Validate all question marks
    for (const q of Object.values(evaluations)) {
      const val = Number(q.finalMarks);
      if (isNaN(val) || val < 0 || val > q.maxMarks) {
        showToast(`Invalid marks for Question ${q.questionNumber}. Must be between 0 and ${q.maxMarks}.`, 'error');
        return;
      }
    }

    try {
      setSavingFinalMarks(true);
      const questionMarksPayload = Object.values(evaluations).map((q) => ({
        questionId: q.questionId,
        questionNumber: q.questionNumber,
        finalMarks: Number(q.finalMarks),
        comments: q.comments
      }));

      const res = await api.put(`/answer-copies/${copy._id}/admin-save-marks`, {
        questionMarks: questionMarksPayload,
        overallComments
      });

      if (res.data.success) {
        showToast(res.data.message || 'Final marks saved and verified by Admin. Status updated to ADMIN_REVIEWED.', 'success');
        setCopy(res.data.answerCopy);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save final marks', 'error');
    } finally {
      setSavingFinalMarks(false);
    }
  };

  // MANUAL MODE: Mark change handler with strict maxMarks check
  const handleManualMarkChange = (qId, val, maxMarks) => {
    const num = Number(val);
    if (num > maxMarks) {
      showToast(`Marks cannot exceed question maximum (${maxMarks}).`, 'warning');
      return;
    }
    if (num < 0) {
      showToast('Marks cannot be negative.', 'warning');
      return;
    }

    updateQuestionEvaluation(qId, 'marksAwarded', num);
    updateQuestionEvaluation(qId, 'finalMarks', num);
  };

  // AI MODE: Approve AI Evaluation (Sections 9 & 10)
  const handleApproveAiEvaluation = async () => {
    const totalAiScore = Object.values(evaluations).reduce(
      (sum, q) => sum + (Number(q.aiMarks ?? q.aiSuggestedMarks) || 0),
      0
    );

    if (
      !window.confirm(
        `Confirm Approval of AI-Assisted Evaluation?\n\nTotal Suggested Score: ${totalAiScore} / ${totalMax} (${totalMax > 0 ? Math.round((totalAiScore / totalMax) * 100) : 0}%).\n\nUpon approval, the AI-generated marks will be accepted as the final evaluation marks.`
      )
    ) {
      return;
    }

    try {
      setApprovingAi(true);
      const res = await api.post('/evaluations/approve-ai', {
        answerCopyId: copy._id,
        overallComments: overallComments || 'AI-assisted evaluation reviewed and approved by examiner.'
      });

      if (res.data.success) {
        showToast('AI-Assisted Evaluation approved and finalized successfully!', 'success');
        if (user?.role === 'ADMIN') {
          navigate(`/admin/examinations/${copy.examination?._id || copy.examination}/scan`);
        } else {
          navigate('/evaluator/assigned-copies');
        }
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error approving AI evaluation', 'error');
    } finally {
      setApprovingAi(false);
    }
  };

  // MANUAL MODE: Save Draft
  const handleSaveDraft = async () => {
    try {
      setSavingDraft(true);
      const questionEvaluationsArray = Object.values(evaluations).map((q) => ({
        question: q.questionId,
        questionNumber: q.questionNumber,
        maxMarks: q.maxMarks,
        marksAwarded: Number(q.marksAwarded) || 0,
        comments: q.comments || '',
        aiSuggestedMarks: q.aiSuggestedMarks,
        aiFeedback: q.aiFeedback,
        wasAiAccepted: q.wasAiAccepted,
        criteriaBreakdown: q.criteriaBreakdown || []
      }));

      const res = await api.post('/evaluations/save-draft', {
        answerCopyId: copy._id,
        evaluationMode: evalMode,
        questionEvaluations: questionEvaluationsArray,
        overallComments
      });

      if (res.data.success) {
        showToast('Evaluation draft saved successfully.', 'success');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error saving draft', 'error');
    } finally {
      setSavingDraft(false);
    }
  };

  // MANUAL MODE: Finalize & Submit
  const handleSubmitFinal = async () => {
    if (
      !window.confirm(
        `Confirm submission of final manual evaluation?\nTotal Awarded: ${totalAwarded} / ${totalMax} marks (${runningPercentage}%).`
      )
    ) {
      return;
    }

    try {
      setSubmittingFinal(true);
      const questionEvaluationsArray = Object.values(evaluations).map((q) => ({
        question: q.questionId,
        questionNumber: q.questionNumber,
        maxMarks: q.maxMarks,
        marksAwarded: Number(q.marksAwarded) || 0,
        comments: q.comments || '',
        aiSuggestedMarks: q.aiSuggestedMarks,
        aiFeedback: q.aiFeedback,
        wasAiAccepted: q.wasAiAccepted,
        criteriaBreakdown: q.criteriaBreakdown || []
      }));

      const res = await api.post('/evaluations/submit', {
        answerCopyId: copy._id,
        evaluationMode: evalMode,
        questionEvaluations: questionEvaluationsArray,
        overallComments
      });

      if (res.data.success) {
        showToast('Manual evaluation finalized and result recorded successfully!', 'success');
        if (user?.role === 'ADMIN') {
          navigate(`/admin/examinations/${copy.examination?._id || copy.examination}/scan`);
        } else {
          navigate('/evaluator/assigned-copies');
        }
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error submitting evaluation', 'error');
    } finally {
      setSubmittingFinal(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullPage text="Loading answer copy and evaluation workspace..." />;
  }

  // Calculate live running totals
  const totalAwarded = Object.values(evaluations).reduce(
    (sum, q) => sum + (Number(q.marksAwarded) || 0),
    0
  );
  const totalAiSuggested = Object.values(evaluations).reduce(
    (sum, q) => sum + (Number(q.aiMarks ?? q.aiSuggestedMarks) || 0),
    0
  );
  const totalFinalMarks = Object.values(evaluations).reduce(
    (sum, q) => sum + (Number(q.finalMarks ?? q.marksAwarded) || 0),
    0
  );
  const totalMax = copy?.totalMaxMarks || copy?.examination?.maxMarks || 50;
  const runningPercentage = totalMax > 0 ? Math.round((totalAwarded / totalMax) * 100 * 10) / 10 : 0;
  const aiPercentage = totalMax > 0 ? Math.round((totalAiSuggested / totalMax) * 100 * 10) / 10 : 0;
  const finalPercentage = totalMax > 0 ? Math.round((totalFinalMarks / totalMax) * 100 * 10) / 10 : 0;
  const isCompleted = copy?.evaluationStatus === 'COMPLETED' || copy?.evaluationStatus === 'AI_APPROVED' || copy?.evaluationStatus === 'REVIEWED';

  // Scanned pages extraction
  const scannedPages = copy?.scannedDocument?.scannedPages || [];
  const hasUploadedFile = !!copy?.scannedDocument?.fileUrl;
  const isPdf = copy?.scannedDocument?.fileType?.includes('pdf') || copy?.scannedDocument?.fileName?.toLowerCase().endsWith('.pdf');

  // Back URL determination
  const backUrl = user?.role === 'ADMIN'
    ? (copy?.examination?._id ? `/admin/examinations/${copy.examination._id}/scan` : '/admin/examinations')
    : '/evaluator/assigned-copies';

  return (
    <div className="space-y-4">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to={backUrl}
          className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{user?.role === 'ADMIN' ? 'Back to Scanned Copies' : 'Back to Assigned Copies'}</span>
        </Link>
        <span className="text-xs text-slate-500 font-mono">
          Examination: <strong className="text-slate-300 font-semibold">{copy?.examination?.name || 'Academic Exam'}</strong>
        </span>
      </div>

      {/* Sticky Header: Answer Copy Metadata, Locked Evaluation Mode & Live Scores */}
      <div className="surface-card p-4 rounded-xl border border-slate-800 flex flex-col xl:flex-row xl:items-center justify-between gap-4 sticky top-16 z-20 shadow-xl bg-slate-900/95 backdrop-blur-md">
        <div>
          <div className="flex items-center space-x-3">
            <span className="font-mono font-bold text-white text-lg tracking-tight">{copy?.copyId}</span>
            <Badge status={copy?.evaluationStatus}>{copy?.evaluationStatus}</Badge>
            {copy?.bookletNumber && (
              <span className="px-2 py-0.5 rounded bg-slate-800 text-[11px] font-mono text-indigo-300 border border-slate-700">
                Booklet: {copy.bookletNumber}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
            <span>Subject: <strong className="text-indigo-400 font-medium">{copy?.subject}</strong></span>
            <span>•</span>
            <span>Candidate: <strong className="text-slate-200">{copy?.candidateName || 'Candidate'}</strong></span>
            <span>•</span>
            <span>Roll No: <strong className="text-slate-300 font-mono">{copy?.candidateRollNo || 'N/A'}</strong></span>
          </div>
        </div>

        {/* Locked Evaluation Mode Banner & Final Action Controls */}
        <div className="flex flex-wrap items-center gap-4 justify-between xl:justify-end">
          {/* Mode Indicator */}
          <div className="flex items-center space-x-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">Mode:</span>
            {isAiMode ? (
              <span className="font-bold text-amber-400 flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Evaluation</span>
              </span>
            ) : (
              <span className="font-bold text-indigo-400">
                Manual Evaluation
              </span>
            )}
          </div>

          {/* Running Score Display */}
          <div className="bg-slate-950 px-4 py-2 rounded-lg border border-slate-800 text-right min-w-[170px]">
            {isAiMode ? (
              <div className="space-y-0.5">
                <div className="text-[10px] text-amber-400 uppercase tracking-wider font-semibold">
                  AI Total: <strong className="font-mono text-xs">{totalAiSuggested} / {totalMax}</strong>
                </div>
                <div className="text-[10px] text-slate-300 uppercase tracking-wider font-semibold">
                  Final Total: <strong className="font-mono text-emerald-400 text-sm">{totalFinalMarks} / {totalMax}</strong>
                </div>
              </div>
            ) : (
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                  Awarded Total
                </span>
                <div className="text-xl font-bold font-mono text-emerald-400">
                  {totalAwarded} / {totalMax}
                  <span className="text-xs text-slate-300 font-normal ml-1">
                    ({runningPercentage}%)
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons based on Mode */}
          <div className="flex items-center space-x-2">
            {isAiMode ? (
              <Button
                variant="primary"
                size="md"
                icon={Save}
                loading={savingFinalMarks}
                onClick={handleSaveAdminFinalMarks}
              >
                Save Final Marks
              </Button>
            ) : !isCompleted ? (
              <>
                <Button variant="secondary" size="md" icon={Save} loading={savingDraft} onClick={handleSaveDraft}>
                  Save Draft
                </Button>
                <Button variant="primary" size="md" icon={CheckCircle2} loading={submittingFinal} onClick={handleSubmitFinal}>
                  Finalize
                </Button>
              </>
            ) : (
              <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Evaluation Finalized</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Split Layout: SCANNED ANSWER COPY (Left) vs EVALUATION (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: SCANNED ANSWER COPY */}
        <div className="lg:col-span-6 xl:col-span-6 flex flex-col space-y-3">
          <div className="surface-card rounded-xl border border-slate-800 overflow-hidden flex flex-col h-[calc(100vh-160px)] min-h-[650px] sticky top-36 shadow-lg">
            {/* Scanned Copy Header & Controls */}
            <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Scanned Physical Copy
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono block">
                    {copy?.scannedDocument?.fileName || `${copy?.copyId}_Booklet.pdf`}
                  </span>
                </div>
              </div>

              {/* Viewer Controls */}
              <div className="flex items-center space-x-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.15))}
                  title="Zoom Out"
                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-mono text-slate-300 px-1">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(2.0, z + 0.15))}
                  title="Zoom In"
                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel(1)}
                  title="Reset Zoom"
                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 text-[10px] font-mono"
                >
                  100%
                </button>
                {copy?.scannedDocument?.fileUrl && (
                  <a
                    href={copy.scannedDocument.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    title="Open in New Window"
                    className="p-1 rounded text-slate-400 hover:text-indigo-400 hover:bg-slate-800 ml-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>

            {/* Multi-page Navigation */}
            {scannedPages.length > 1 && (
              <div className="px-3 py-2 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-1 overflow-x-auto">
                  {scannedPages.map((pg, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActivePageIndex(idx)}
                      className={`px-2.5 py-1 rounded text-xs font-mono transition-all ${
                        activePageIndex === idx
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      Page {idx + 1}
                    </button>
                  ))}
                </div>
                <span className="text-[11px] text-slate-400 font-mono shrink-0 ml-2">
                  Page {activePageIndex + 1} of {scannedPages.length}
                </span>
              </div>
            )}

            {/* Document Viewer Body */}
            <div className="flex-1 overflow-auto bg-slate-950 p-4 flex flex-col items-center">
              {hasUploadedFile ? (
                isPdf ? (
                  <div className="w-full h-full flex flex-col">
                    <iframe
                      src={copy.scannedDocument.fileUrl}
                      title="Physical Scanned Booklet"
                      className="w-full flex-1 rounded border border-slate-800 bg-white"
                      style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
                    />
                  </div>
                ) : (
                  <div
                    className="transition-transform duration-150 ease-out origin-top flex flex-col items-center"
                    style={{ transform: `scale(${zoomLevel})` }}
                  >
                    <img
                      src={
                        scannedPages.length > 0 && scannedPages[activePageIndex]?.fileUrl
                          ? scannedPages[activePageIndex].fileUrl
                          : copy.scannedDocument.fileUrl
                      }
                      alt={`Scanned Answer Page ${activePageIndex + 1}`}
                      className="max-w-full rounded shadow-2xl border border-slate-800 object-contain"
                    />
                  </div>
                )
              ) : (
                /* Fallback physical answer copy view if transcribed from scanner OCR */
                <div
                  className="w-full max-w-xl bg-white text-slate-900 rounded-lg p-6 shadow-2xl font-serif space-y-6 text-sm border-2 border-slate-300 transition-transform origin-top"
                  style={{ transform: `scale(${zoomLevel})` }}
                >
                  <div className="border-b-2 border-slate-800 pb-3 text-center">
                    <div className="text-[11px] uppercase tracking-widest text-slate-500 font-sans font-bold">
                      Official University Examination Answer Booklet
                    </div>
                    <div className="text-lg font-bold text-slate-900 mt-1 font-sans">
                      {copy?.examination?.name || 'Examination Paper'}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-left font-sans mt-3 p-2 bg-slate-100 rounded border border-slate-300">
                      <div>Candidate Roll No: <strong>{copy?.candidateRollNo || '2024-ENG-082'}</strong></div>
                      <div>Booklet No: <strong>{copy?.bookletNumber || 'BK-99214'}</strong></div>
                      <div>Candidate Name: <strong>{copy?.candidateName || 'Examinee'}</strong></div>
                      <div>Subject: <strong>{copy?.subject}</strong></div>
                    </div>
                  </div>

                  <div className="space-y-5 text-slate-800 font-sans">
                    {copy?.answers?.map((ans, aIdx) => (
                      <div key={aIdx} className="space-y-1.5 pb-4 border-b border-slate-200">
                        <div className="font-bold text-xs text-indigo-900 bg-indigo-50 px-2 py-1 rounded inline-block">
                          Answer to Question {ans.questionNumber || aIdx + 1}:
                        </div>
                        <p className="text-xs text-slate-800 leading-relaxed font-serif whitespace-pre-wrap pl-2 border-l-2 border-indigo-200">
                          {ans.studentAnswer || '(No written answer provided for this question.)'}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-slate-300 text-center text-[10px] text-slate-400 font-sans uppercase">
                    Scanned & Digitally Indexed by Examination Authority • End of Answer Script
                  </div>
                </div>
              )}
            </div>

            {/* Scanned Copy Footer */}
            <div className="p-2.5 bg-slate-900 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Booklet ID: <strong className="text-slate-200 font-mono">{copy?.bookletNumber || copy?.copyId}</strong></span>
              <span className="text-slate-400">Total Questions: <strong className="text-indigo-400 font-mono">{copy?.answers?.length || 0}</strong></span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: EVALUATION WORKSPACE */}
        <div className="lg:col-span-6 xl:col-span-6 flex flex-col space-y-5">
          {/* Mode Banner & Instruction */}
          <div className="surface-card p-4 rounded-xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2.5 rounded-lg ${isAiMode ? 'bg-amber-500/10 text-amber-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
                {isAiMode ? <Sparkles className="w-5 h-5" /> : <FileCheck className="w-5 h-5" />}
              </div>
              <div>
                <h2 className="text-sm font-bold text-white flex items-center space-x-1.5">
                  <span>{isAiMode ? 'AI Evaluation (Gemini Marks + Admin Review)' : 'Manual Evaluation'}</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isAiMode
                    ? 'AI marks are suggestions. As Admin, you can review and modify Final Marks question-by-question.'
                    : 'Inspect the scanned answer sheet on the left and enter question-wise marks.'}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                {isAiMode ? 'Final Total' : 'Manual Score'}
              </span>
              <span className="text-lg font-mono font-bold text-emerald-400">
                {isAiMode ? totalFinalMarks : totalAwarded} / {totalMax}
              </span>
            </div>
          </div>

          {/* Question-wise Cards */}
          <div className="space-y-4">
            {copy?.answers?.map((ansItem, idx) => {
              const qId = ansItem.question?._id || ansItem.question;
              const qEval = evaluations[qId] || {};
              const isAiRunning = !!aiLoading[qId];
              const hasAiResult = (qEval.aiMarks !== null && qEval.aiMarks !== undefined) || (qEval.aiSuggestedMarks !== null && qEval.aiSuggestedMarks !== undefined);
              const showRef = !!showRefAnswers[qId];

              return (
                <div
                  key={idx}
                  className="surface-card p-4 rounded-xl border border-slate-800 space-y-4 transition-all hover:border-slate-700 shadow-sm"
                >
                  {/* Question Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
                    <div className="flex items-start space-x-2.5">
                      <span className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 font-mono font-bold text-xs flex items-center justify-center shrink-0 border border-indigo-500/20">
                        Q{ansItem.questionNumber || idx + 1}
                      </span>
                      <div>
                        <h4 className="text-sm font-semibold text-white leading-snug">
                          {ansItem.question?.questionText || 'Descriptive Question'}
                        </h4>
                        <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5">
                          {ansItem.question?.unit && <span>Unit: {ansItem.question.unit}</span>}
                          {ansItem.question?.topic && <span>• Topic: {ansItem.question.topic}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 font-mono font-bold text-xs text-slate-200">
                        Max: {ansItem.maxMarks}m
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleShowRef(qId)}
                        className="px-2 py-1 rounded-lg text-slate-400 hover:text-white bg-slate-900 border border-slate-800 text-xs flex items-center space-x-1"
                      >
                        {showRef ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        <span>{showRef ? 'Hide Reference' : 'Reference Answer'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Model / Reference Answer (Toggleable) */}
                  {showRef && ansItem.question?.expectedAnswer && (
                    <div className="p-3 rounded-lg bg-indigo-950/30 border border-indigo-500/30 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 flex items-center space-x-1">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Official Reference / Model Answer:</span>
                      </span>
                      <p className="text-xs text-slate-300 leading-relaxed font-mono whitespace-pre-wrap">
                        {ansItem.question.expectedAnswer}
                      </p>
                    </div>
                  )}

                  {/* Student Written Response */}
                  <div className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-semibold text-slate-300">Extracted Candidate Response:</span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {ansItem.studentAnswer ? `${ansItem.studentAnswer.split(/\s+/).length} words` : 'Empty response'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-200 font-sans leading-relaxed whitespace-pre-wrap">
                      {ansItem.studentAnswer || (
                        <span className="italic text-slate-400">Refer to physical answer copy on the left panel.</span>
                      )}
                    </div>
                  </div>

                  {/* Rubric Breakdown */}
                  {ansItem.question?.rubric?.criteria && ansItem.question.rubric.criteria.length > 0 && (
                    <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800/80 space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Marking Rubric Standards
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {ansItem.question.rubric.criteria.map((crit, cIdx) => (
                          <div key={cIdx} className="p-2 rounded bg-slate-900 border border-slate-800 text-[11px] space-y-0.5">
                            <div className="flex justify-between font-semibold text-slate-300">
                              <span>{crit.name}</span>
                              <span className="font-mono text-indigo-400">{crit.maxMarks}m</span>
                            </div>
                            <p className="text-slate-400 leading-tight">{crit.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ============================================================== */}
                  {/* WORKFLOW BRANCH A: AI EVALUATION MODE                           */}
                  {/* AI marks are suggested. Admin can edit Final Marks.            */}
                  {/* ============================================================== */}
                  {isAiMode && (
                    <div className="p-3.5 rounded-lg bg-amber-950/20 border border-amber-500/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-amber-400 font-semibold text-xs uppercase tracking-wider">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>AI Evaluation Result & Admin Review</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {hasAiResult && (
                            <Button
                              size="sm"
                              variant="outline"
                              icon={RefreshCw}
                              loading={isAiRunning}
                              onClick={() => handleRetryQuestionAi(qId)}
                              className="text-[10px] text-amber-300 border-amber-500/40 hover:bg-amber-500/10 py-1 px-2"
                              title="Re-run Gemini AI evaluation for this question"
                            >
                              Retry Question AI
                            </Button>
                          )}
                          {!hasAiResult && (
                            <Button
                              size="sm"
                              variant="outline"
                              icon={Sparkles}
                              loading={isAiRunning}
                              onClick={() => triggerAiEvaluation(copy._id, ansItem)}
                            >
                              Analyze with AI
                            </Button>
                          )}
                        </div>
                      </div>

                      {hasAiResult ? (
                        <div className="space-y-3 pt-2 border-t border-slate-800">
                          {/* Marks Comparison Table: Maximum Marks, AI Marks, Final Marks (Requirement 14) */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-lg bg-slate-950 border border-slate-800">
                            <div>
                              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Maximum Marks</span>
                              <span className="text-base font-bold font-mono text-slate-200">
                                {ansItem.maxMarks} marks
                              </span>
                            </div>

                            <div>
                              <span className="text-[10px] text-amber-400 uppercase tracking-wider block font-semibold flex items-center space-x-1">
                                <Sparkles className="w-3 h-3" />
                                <span>AI Marks (Original)</span>
                              </span>
                              <span className="text-base font-bold font-mono text-amber-400">
                                {qEval.aiMarks ?? qEval.aiSuggestedMarks} / {ansItem.maxMarks}
                              </span>
                            </div>

                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-semibold">
                                  Final Marks {user?.role === 'ADMIN' && '(Admin Editable)'}
                                </span>
                                {qEval.aiMarks !== null && Number(qEval.finalMarks) !== Number(qEval.aiMarks) && (
                                  <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">
                                    Modified by Admin
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center space-x-1.5">
                                <input
                                  type="number"
                                  min="0"
                                  max={ansItem.maxMarks}
                                  step="0.5"
                                  value={qEval.finalMarks !== undefined && qEval.finalMarks !== null ? qEval.finalMarks : (qEval.aiMarks ?? 0)}
                                  onChange={(e) => handleFinalMarkChange(qId, e.target.value, ansItem.maxMarks)}
                                  className="w-20 bg-slate-900 border border-emerald-500/60 rounded-lg px-2.5 py-1 text-sm text-emerald-400 font-mono font-bold text-center focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                                />
                                <span className="text-xs text-slate-400 font-mono">/ {ansItem.maxMarks}</span>
                              </div>
                            </div>
                          </div>

                          {/* AI Explanation / Feedback (Requirement 14) */}
                          {(qEval.aiFeedback || qEval.comments) && (
                            <div className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded border border-slate-800">
                              <strong className="text-amber-400 block text-[11px] mb-1">AI Feedback:</strong>
                              <p>{qEval.aiFeedback || qEval.comments}</p>
                            </div>
                          )}

                          {/* Criteria breakdown if available */}
                          {qEval.criteriaBreakdown?.length > 0 && (
                            <div className="space-y-1.5 pt-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                Rubric Alignment:
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                {qEval.criteriaBreakdown.map((crit, crIdx) => (
                                  <div key={crIdx} className="p-2 rounded bg-slate-950/60 border border-slate-800 text-[11px]">
                                    <div className="flex justify-between text-slate-300 font-semibold">
                                      <span>{crit.criterion}</span>
                                      <span className="font-mono text-amber-400">{crit.marks}/{crit.maxMarks}m</span>
                                    </div>
                                    <p className="text-slate-400 text-[10px] mt-0.5">{crit.feedback}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Admin Comment field (Requirement 14) */}
                          <div>
                            <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">
                              Admin Comment (Preserves original AI Marks for audit)
                            </label>
                            <input
                              type="text"
                              value={qEval.comments || ''}
                              onChange={(e) => updateQuestionEvaluation(qId, 'comments', e.target.value)}
                              placeholder="Enter admin remarks or rationale for final marks..."
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-slate-950 rounded text-center text-xs text-slate-400">
                          {isAiRunning ? 'Analyzing student answer with Gemini AI...' : 'AI evaluation queued for this question.'}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ============================================================== */}
                  {/* WORKFLOW BRANCH B: MANUAL EVALUATION MODE (Section 7)          */}
                  {/* Evaluator enters question-wise marks and remarks.              */}
                  {/* ============================================================== */}
                  {evalMode === 'MANUAL' && (
                    <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center space-x-2">
                        <label className="text-xs font-semibold text-slate-200 shrink-0">
                          Q{ansItem.questionNumber || idx + 1} Marks Awarded:
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={ansItem.maxMarks}
                          step="0.5"
                          value={qEval.marksAwarded ?? 0}
                          onChange={(e) => handleManualMarkChange(qId, e.target.value, ansItem.maxMarks)}
                          className="w-20 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-emerald-400 font-mono font-bold text-center focus:outline-none focus:border-indigo-500"
                        />
                        <span className="text-xs text-slate-400 font-mono">/ {ansItem.maxMarks}</span>
                      </div>

                      <div className="flex-1 sm:max-w-xs">
                        <input
                          type="text"
                          value={qEval.comments || ''}
                          onChange={(e) => updateQuestionEvaluation(qId, 'comments', e.target.value)}
                          placeholder="Examiner remarks (optional)..."
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Overall Comments & Final Evaluation Submission */}
          <div className="surface-card p-5 rounded-xl border border-slate-800 space-y-4 mb-8 shadow-lg">
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              <span>Overall Examiner Evaluation Feedback</span>
            </h4>
            <textarea
              rows="3"
              value={overallComments}
              onChange={(e) => setOverallComments(e.target.value)}
              placeholder="Enter examiner review summary, holistic feedback, or notes on student's performance..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 leading-relaxed"
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-3 border-t border-slate-800 gap-4">
              <div className="text-xs text-slate-400">
                {isAiMode ? (
                  <div className="flex items-center space-x-4">
                    <span>
                      Total AI Marks:{' '}
                      <strong className="text-amber-400 font-mono text-sm font-bold ml-1">
                        {totalAiSuggested} / {totalMax} ({aiPercentage}%)
                      </strong>
                    </span>
                    <span>•</span>
                    <span>
                      Final Total:{' '}
                      <strong className="text-emerald-400 font-mono text-base font-bold ml-1">
                        {totalFinalMarks} / {totalMax} ({finalPercentage}%)
                      </strong>
                    </span>
                  </div>
                ) : (
                  <div>
                    Final Calculated Score:{' '}
                    <strong className="text-emerald-400 font-mono text-base font-bold ml-1">
                      {totalAwarded} / {totalMax} marks ({runningPercentage}%)
                    </strong>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                {isAiMode ? (
                  <Button
                    variant="primary"
                    size="md"
                    icon={Save}
                    loading={savingFinalMarks}
                    onClick={handleSaveAdminFinalMarks}
                  >
                    Save Final Marks
                  </Button>
                ) : !isCompleted ? (
                  <>
                    <Button variant="secondary" icon={Save} loading={savingDraft} onClick={handleSaveDraft}>
                      Save Draft
                    </Button>
                    <Button
                      variant="primary"
                      size="md"
                      icon={CheckCircle2}
                      loading={submittingFinal}
                      onClick={handleSubmitFinal}
                    >
                      Finalize & Submit Evaluation
                    </Button>
                  </>
                ) : (
                  <div className="flex items-center space-x-1.5 text-xs text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Evaluation Finalized & Locked</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EvaluationWorkspace;
