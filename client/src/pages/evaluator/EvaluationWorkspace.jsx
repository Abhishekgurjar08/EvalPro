import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import LoadingSpinner from '../../components/LoadingSpinner';
import AnnotationToolbar from '../../components/AnnotationToolbar';
import AnnotationOverlay from '../../components/AnnotationOverlay';
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

  // Evaluator Remarks & Annotation states
  const [annotations, setAnnotations] = useState([]);
  const [activeTool, setActiveTool] = useState('select'); // 'select' | 'pen' | 'highlight' | 'text' | 'eraser'
  const [penColor, setPenColor] = useState('#ef4444');
  const [penSize, setPenSize] = useState(3);
  const [highlightColor, setHighlightColor] = useState('#eab308');
  const [highlightSize, setHighlightSize] = useState(22);
  const [isSavingAnnotations, setIsSavingAnnotations] = useState(false);
  const [hasUnsavedAnnotations, setHasUnsavedAnnotations] = useState(false);
  const [history, setHistory] = useState({}); // { [pageNumber]: { undo: [], redo: [] } }
  const [quickPresetToPlace, setQuickPresetToPlace] = useState(null);

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

        // STRICT EVALUATION MODE DETERMINATION:
        // When Admin selects "Manual Check" or assigns the copy to an Evaluator, or user is an Evaluator:
        // This is 100% HUMAN / MANUAL EVALUATION!
        // No AI evaluation should happen. No Gemini calls. No AI suggestions.
        const isManual = user?.role === 'EVALUATOR' || !!copyData.assignedEvaluator || copyData.evaluationMode === 'MANUAL';
        const normalizedMode = isManual ? 'MANUAL' : (['AI_EVALUATION', 'AI', 'AI_ASSISTED'].includes(copyData.evaluationMode) ? 'AI_EVALUATION' : 'MANUAL');
        setEvalMode(normalizedMode);
        setIsModeLocked(true);

        // Initialize evaluations map
        const initialMap = {};
        for (const ansItem of copyData.answers || []) {
          const qId = ansItem.question?._id || ansItem.question;
          const maxM = ansItem.maxMarks || ansItem.question?.marks || 10;

          const prevQ = existingEval?.questionEvaluations?.find(
            (qe) => (qe.question?._id || qe.question) === qId || qe.questionNumber === ansItem.questionNumber
          );

          if (isManual) {
            // MANUAL EVALUATION: strictly human evaluator marks. No AI marks or feedback!
            const manualScore = prevQ?.marksAwarded ?? ansItem.marksAwarded ?? (ansItem.finalMarks ?? 0);
            initialMap[qId] = {
              questionId: qId,
              questionNumber: ansItem.questionNumber,
              maxMarks: maxM,
              aiMarks: null,
              finalMarks: manualScore,
              marksAwarded: manualScore,
              comments: prevQ ? prevQ.comments : (ansItem.evaluatorRemarks || ''),
              aiSuggestedMarks: null,
              aiFeedback: '',
              wasAiAccepted: false,
              criteriaBreakdown: prevQ?.criteriaBreakdown || []
            };
          } else {
            // AI MODE (Admin Review):
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
        }

        setEvaluations(initialMap);
        if (existingEval?.overallComments) {
          setOverallComments(existingEval.overallComments);
        }

        // Load saved remarks/annotations for this answer copy
        if (Array.isArray(res.data.annotations)) {
          setAnnotations(res.data.annotations);
        }
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load answer copy', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Annotation Actions & History Management
  const currentPage = activePageIndex + 1;
  const currentPageAnnotations = annotations.filter((a) => Number(a.pageNumber) === currentPage);
  const canUndo = (history[currentPage]?.undo?.length || 0) > 0;
  const canRedo = (history[currentPage]?.redo?.length || 0) > 0;

  const handleAddAnnotation = (newAnn) => {
    setAnnotations((prev) => [...prev, newAnn]);
    setHasUnsavedAnnotations(true);
    setHistory((prev) => {
      const p = currentPage;
      const pageHist = prev[p] || { undo: [], redo: [] };
      return {
        ...prev,
        [p]: {
          undo: [...pageHist.undo, { type: 'ADD', annotation: newAnn }],
          redo: []
        }
      };
    });
  };

  const handleRemoveAnnotation = (annId) => {
    const target = annotations.find((a) => (a.id || a._id) === annId);
    if (!target) return;
    setAnnotations((prev) => prev.filter((a) => (a.id || a._id) !== annId));
    setHasUnsavedAnnotations(true);
    setHistory((prev) => {
      const p = Number(target.pageNumber) || currentPage;
      const pageHist = prev[p] || { undo: [], redo: [] };
      return {
        ...prev,
        [p]: {
          undo: [...pageHist.undo, { type: 'DELETE', annotation: target }],
          redo: []
        }
      };
    });
  };

  const handleUndo = () => {
    const p = currentPage;
    const pageHist = history[p] || { undo: [], redo: [] };
    if (!pageHist.undo || pageHist.undo.length === 0) return;

    const lastAction = pageHist.undo[pageHist.undo.length - 1];
    const newUndo = pageHist.undo.slice(0, -1);

    if (lastAction.type === 'ADD') {
      const targetId = lastAction.annotation.id || lastAction.annotation._id;
      setAnnotations((prev) => prev.filter((a) => (a.id || a._id) !== targetId));
      setHistory((prev) => ({
        ...prev,
        [p]: {
          undo: newUndo,
          redo: [...pageHist.redo, lastAction]
        }
      }));
    } else if (lastAction.type === 'DELETE') {
      setAnnotations((prev) => [...prev, lastAction.annotation]);
      setHistory((prev) => ({
        ...prev,
        [p]: {
          undo: newUndo,
          redo: [...pageHist.redo, lastAction]
        }
      }));
    } else if (lastAction.type === 'CLEAR') {
      setAnnotations((prev) => [...prev, ...(lastAction.annotations || [])]);
      setHistory((prev) => ({
        ...prev,
        [p]: {
          undo: newUndo,
          redo: [...pageHist.redo, lastAction]
        }
      }));
    }
    setHasUnsavedAnnotations(true);
  };

  const handleRedo = () => {
    const p = currentPage;
    const pageHist = history[p] || { undo: [], redo: [] };
    if (!pageHist.redo || pageHist.redo.length === 0) return;

    const lastAction = pageHist.redo[pageHist.redo.length - 1];
    const newRedo = pageHist.redo.slice(0, -1);

    if (lastAction.type === 'ADD') {
      setAnnotations((prev) => [...prev, lastAction.annotation]);
      setHistory((prev) => ({
        ...prev,
        [p]: {
          undo: [...pageHist.undo, lastAction],
          redo: newRedo
        }
      }));
    } else if (lastAction.type === 'DELETE') {
      const targetId = lastAction.annotation.id || lastAction.annotation._id;
      setAnnotations((prev) => prev.filter((a) => (a.id || a._id) !== targetId));
      setHistory((prev) => ({
        ...prev,
        [p]: {
          undo: [...pageHist.undo, lastAction],
          redo: newRedo
        }
      }));
    } else if (lastAction.type === 'CLEAR') {
      setAnnotations((prev) => prev.filter((a) => Number(a.pageNumber) !== p));
      setHistory((prev) => ({
        ...prev,
        [p]: {
          undo: [...pageHist.undo, lastAction],
          redo: newRedo
        }
      }));
    }
    setHasUnsavedAnnotations(true);
  };

  const handleClearPage = () => {
    const p = currentPage;
    const pageAnns = annotations.filter((a) => Number(a.pageNumber) === p);
    if (pageAnns.length === 0) {
      showToast(`Page ${p} has no remarks to clear.`, 'info');
      return;
    }
    if (!window.confirm(`Are you sure you want to clear all remarks and annotations on Page ${p}?`)) {
      return;
    }
    setAnnotations((prev) => prev.filter((a) => Number(a.pageNumber) !== p));
    setHasUnsavedAnnotations(true);
    setHistory((prev) => {
      const pageHist = prev[p] || { undo: [], redo: [] };
      return {
        ...prev,
        [p]: {
          undo: [...pageHist.undo, { type: 'CLEAR', annotations: pageAnns }],
          redo: []
        }
      };
    });
    showToast(`Cleared remarks on Page ${p}`, 'info');
  };

  const handleSaveAnnotations = async (isSilent = false) => {
    try {
      setIsSavingAnnotations(true);
      const res = await api.put(`/answer-copies/${copyId}/annotations`, {
        annotations
      });
      if (res.data.success) {
        if (Array.isArray(res.data.annotations)) {
          setAnnotations(res.data.annotations);
        }
        setHasUnsavedAnnotations(false);
        if (!isSilent) {
          showToast('Remarks and annotations saved successfully.', 'success');
        }
      }
    } catch (err) {
      if (!isSilent) {
        showToast(err.response?.data?.message || 'Failed to save annotations', 'error');
      }
    } finally {
      setIsSavingAnnotations(false);
    }
  };

  // Keyboard Shortcuts for Annotation Actions
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveAnnotations(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [annotations, history, currentPage]);

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
      const targetAnsItem = (copy.answers || []).find(
        (a) => (a.question?._id || a.question)?.toString() === qId?.toString()
      );
      const res = await api.post(`/answer-copies/${copy._id}/retry-question-ai`, {
        questionId: qId,
        studentAnswer: targetAnsItem?.studentAnswer || ''
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

      if (hasUnsavedAnnotations) {
        await handleSaveAnnotations(true);
      }

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

      const studentAnswersPayload = (copy.answers || []).map((a) => ({
        questionNumber: a.questionNumber,
        studentAnswer: a.studentAnswer || ''
      }));

      const res = await api.post('/evaluations/save-draft', {
        answerCopyId: copy._id,
        evaluationMode: evalMode,
        questionEvaluations: questionEvaluationsArray,
        studentAnswers: studentAnswersPayload,
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

      if (hasUnsavedAnnotations) {
        await handleSaveAnnotations(true);
      }

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

      const studentAnswersPayload = (copy.answers || []).map((a) => ({
        questionNumber: a.questionNumber,
        studentAnswer: a.studentAnswer || ''
      }));

      const res = await api.post('/evaluations/submit', {
        answerCopyId: copy._id,
        evaluationMode: evalMode,
        questionEvaluations: questionEvaluationsArray,
        studentAnswers: studentAnswersPayload,
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
          className="inline-flex items-center space-x-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{user?.role === 'ADMIN' ? 'Back to Scanned Copies' : 'Back to Assigned Copies'}</span>
        </Link>
        <span className="text-xs text-slate-500 font-mono">
          Examination: <strong className="text-slate-800 font-semibold">{copy?.examination?.name || 'Academic Exam'}</strong>
        </span>
      </div>

      {/* Sticky Header: Answer Copy Metadata, Locked Evaluation Mode & Live Scores */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 flex flex-col xl:flex-row xl:items-center justify-between gap-4 sticky top-16 z-20 shadow-sm backdrop-blur-md">
        <div>
          <div className="flex items-center space-x-3">
            <span className="font-mono font-bold text-slate-900 text-lg tracking-tight">{copy?.copyId}</span>
            <Badge status={copy?.evaluationStatus}>{copy?.evaluationStatus}</Badge>
            {copy?.bookletNumber && (
              <span className="px-2 py-0.5 rounded bg-slate-100 text-[11px] font-mono text-slate-700 border border-slate-200">
                Booklet: {copy.bookletNumber}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
            <span>Subject: <strong className="text-indigo-600 font-medium">{copy?.subject}</strong></span>
            <span>•</span>
            <span>Candidate: <strong className="text-slate-800">{copy?.candidateName || 'Candidate'}</strong></span>
            <span>•</span>
            <span>Roll No: <strong className="text-slate-700 font-mono">{copy?.candidateRollNo || 'N/A'}</strong></span>
          </div>
        </div>

        {/* Locked Evaluation Mode Banner & Final Action Controls */}
        <div className="flex flex-wrap items-center gap-4 justify-between xl:justify-end">
          {/* Mode Indicator */}
          <div className="flex items-center space-x-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-slate-500">Mode:</span>
            {isAiMode ? (
              <span className="font-bold text-amber-700 flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>AI Evaluation</span>
              </span>
            ) : (
              <span className="font-bold text-indigo-600">
                Manual Evaluation
              </span>
            )}
          </div>

          {/* Running Score Display */}
          <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 text-right min-w-[170px]">
            {isAiMode ? (
              <div className="space-y-0.5">
                <div className="text-[10px] text-amber-700 uppercase tracking-wider font-semibold">
                  AI Total: <strong className="font-mono text-xs">{totalAiSuggested} / {totalMax}</strong>
                </div>
                <div className="text-[10px] text-slate-600 uppercase tracking-wider font-semibold">
                  Final Total: <strong className="font-mono text-emerald-600 text-sm">{totalFinalMarks} / {totalMax}</strong>
                </div>
              </div>
            ) : (
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
                  Awarded Total
                </span>
                <div className="text-xl font-bold font-mono text-emerald-600">
                  {totalAwarded} / {totalMax}
                  <span className="text-xs text-slate-500 font-normal ml-1">
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
                  Submit Evaluation
                </Button>
              </>
            ) : (
              <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
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
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden flex flex-col h-[calc(100vh-160px)] min-h-[650px] sticky top-36 shadow-sm">
            {/* Scanned Copy Header & Controls */}
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Scanned Physical Copy
                  </h3>
                  <span className="text-[11px] text-slate-500 font-mono block">
                    {copy?.scannedDocument?.fileName || `${copy?.copyId}_Booklet.pdf`}
                  </span>
                </div>
              </div>

              {/* Viewer Controls */}
              <div className="flex items-center space-x-1 bg-white px-2 py-1 rounded-xl border border-slate-200 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.15))}
                  title="Zoom Out"
                  className="p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-mono text-slate-700 px-1 font-semibold">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(2.0, z + 0.15))}
                  title="Zoom In"
                  className="p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel(1)}
                  title="Reset Zoom"
                  className="p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 text-[10px] font-mono font-semibold transition-colors"
                >
                  100%
                </button>
                {copy?.scannedDocument?.fileUrl && (
                  <a
                    href={copy.scannedDocument.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    title="Open in New Window"
                    className="p-1 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 ml-1 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>

            {/* Evaluator Annotation & Remark Toolbar */}
            <AnnotationToolbar
              activeTool={activeTool}
              setActiveTool={setActiveTool}
              penColor={penColor}
              setPenColor={setPenColor}
              penSize={penSize}
              setPenSize={setPenSize}
              highlightColor={highlightColor}
              setHighlightColor={setHighlightColor}
              highlightSize={highlightSize}
              setHighlightSize={setHighlightSize}
              canUndo={canUndo}
              canRedo={canRedo}
              onUndo={handleUndo}
              onRedo={handleRedo}
              onClearPage={handleClearPage}
              onSave={() => handleSaveAnnotations(false)}
              isSaving={isSavingAnnotations}
              hasUnsavedChanges={hasUnsavedAnnotations}
              pageNumber={activePageIndex + 1}
              pageAnnotationCount={currentPageAnnotations.length}
              onQuickPresetSelect={(preset) => setQuickPresetToPlace(preset)}
            />

            {/* Multi-page Navigation */}
            {scannedPages.length > 1 && (
              <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-1 overflow-x-auto">
                  {scannedPages.map((pg, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActivePageIndex(idx)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
                        activePageIndex === idx
                          ? 'bg-indigo-600 text-white font-bold shadow-xs'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      Page {idx + 1}
                    </button>
                  ))}
                </div>
                <span className="text-[11px] text-slate-500 font-mono shrink-0 ml-2">
                  Page {activePageIndex + 1} of {scannedPages.length}
                </span>
              </div>
            )}

            {/* Document Viewer Body */}
            <div className="flex-1 overflow-auto bg-slate-100/70 p-4 flex flex-col items-center">
              {hasUploadedFile ? (
                isPdf ? (
                  <div className="w-full h-full min-h-[600px] flex flex-col relative" style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}>
                    <div className="relative w-full flex-1 min-h-[600px] rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                      <iframe
                        src={copy.scannedDocument.fileUrl}
                        title="Physical Scanned Booklet"
                        className={`w-full h-full min-h-[600px] border-0 ${activeTool !== 'select' ? 'pointer-events-none' : 'pointer-events-auto'}`}
                      />
                      <AnnotationOverlay
                        pageNumber={activePageIndex + 1}
                        activeTool={activeTool}
                        penColor={penColor}
                        penSize={penSize}
                        highlightColor={highlightColor}
                        highlightSize={highlightSize}
                        annotations={annotations}
                        onAddAnnotation={handleAddAnnotation}
                        onRemoveAnnotation={handleRemoveAnnotation}
                        quickPresetToPlace={quickPresetToPlace}
                        onClearQuickPreset={() => setQuickPresetToPlace(null)}
                      />
                    </div>
                  </div>
                ) : (
                  <div
                    className="transition-transform duration-150 ease-out origin-top flex flex-col items-center"
                    style={{ transform: `scale(${zoomLevel})` }}
                  >
                    <div className="relative inline-block">
                      <img
                        src={
                          scannedPages.length > 0 && scannedPages[activePageIndex]?.fileUrl
                            ? scannedPages[activePageIndex].fileUrl
                            : copy.scannedDocument.fileUrl
                        }
                        alt={`Scanned Answer Page ${activePageIndex + 1}`}
                        className="max-w-full rounded-xl shadow-lg border border-slate-200 object-contain block"
                      />
                      <AnnotationOverlay
                        pageNumber={activePageIndex + 1}
                        activeTool={activeTool}
                        penColor={penColor}
                        penSize={penSize}
                        highlightColor={highlightColor}
                        highlightSize={highlightSize}
                        annotations={annotations}
                        onAddAnnotation={handleAddAnnotation}
                        onRemoveAnnotation={handleRemoveAnnotation}
                        quickPresetToPlace={quickPresetToPlace}
                        onClearQuickPreset={() => setQuickPresetToPlace(null)}
                      />
                    </div>
                  </div>
                )
              ) : (
                /* Fallback physical answer copy view if transcribed from scanner OCR */
                <div
                  className="w-full max-w-xl transition-transform origin-top relative"
                  style={{ transform: `scale(${zoomLevel})` }}
                >
                  <div className="relative w-full bg-white text-slate-900 rounded-2xl p-6 shadow-md font-serif space-y-6 text-sm border border-slate-200">
                    <div className="border-b-2 border-slate-800 pb-3 text-center">
                      <div className="text-[11px] uppercase tracking-widest text-slate-500 font-sans font-bold">
                        Official University Examination Answer Booklet
                      </div>
                      <div className="text-lg font-bold text-slate-900 mt-1 font-sans">
                        {copy?.examination?.name || 'Examination Paper'}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-left font-sans mt-3 p-2 bg-slate-50 rounded-xl border border-slate-200">
                        <div>Candidate Roll No: <strong>{copy?.candidateRollNo || '2024-ENG-082'}</strong></div>
                        <div>Booklet No: <strong>{copy?.bookletNumber || 'BK-99214'}</strong></div>
                        <div>Candidate Name: <strong>{copy?.candidateName || 'Examinee'}</strong></div>
                        <div>Subject: <strong>{copy?.subject}</strong></div>
                      </div>
                    </div>

                    <div className="space-y-5 text-slate-800 font-sans">
                      {copy?.answers?.map((ans, aIdx) => (
                        <div key={aIdx} className="space-y-1.5 pb-4 border-b border-slate-100">
                          <div className="font-bold text-xs text-indigo-900 bg-indigo-50 px-2 py-1 rounded-lg inline-block border border-indigo-100">
                            Answer to Question {ans.questionNumber || aIdx + 1}:
                          </div>
                          <p className="text-xs text-slate-800 leading-relaxed font-serif whitespace-pre-wrap pl-2 border-l-2 border-indigo-200">
                            {ans.studentAnswer || '(No written answer provided for this question.)'}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400 font-sans uppercase">
                      Scanned & Digitally Indexed by Examination Authority • End of Answer Script
                    </div>

                    <AnnotationOverlay
                      pageNumber={activePageIndex + 1}
                      activeTool={activeTool}
                      penColor={penColor}
                      penSize={penSize}
                      highlightColor={highlightColor}
                      highlightSize={highlightSize}
                      annotations={annotations}
                      onAddAnnotation={handleAddAnnotation}
                      onRemoveAnnotation={handleRemoveAnnotation}
                      quickPresetToPlace={quickPresetToPlace}
                      onClearQuickPreset={() => setQuickPresetToPlace(null)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Scanned Copy Footer */}
            <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Booklet ID: <strong className="text-slate-800 font-mono">{copy?.bookletNumber || copy?.copyId}</strong></span>
              <span className="text-slate-500">Total Questions: <strong className="text-indigo-600 font-mono">{copy?.answers?.length || 0}</strong></span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: EVALUATION WORKSPACE */}
        <div className="lg:col-span-6 xl:col-span-6 flex flex-col space-y-5">
          {/* Mode Banner & Instruction */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2.5 rounded-xl border ${isAiMode ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'}`}>
                {isAiMode ? <Sparkles className="w-5 h-5" /> : <FileCheck className="w-5 h-5" />}
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                  <span>{isAiMode ? 'AI Evaluation (Gemini Marks + Admin Review)' : 'Manual Evaluation'}</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
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
              <span className="text-lg font-mono font-bold text-emerald-600">
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
                  className="bg-white p-4 rounded-2xl border border-slate-200/80 space-y-4 transition-all hover:border-slate-300 shadow-sm relative"
                >
                  {/* Annotation overlay layer directly over Question & Response Card */}
                  <AnnotationOverlay
                    pageNumber={`Q_${ansItem.questionNumber || idx + 1}`}
                    activeTool={activeTool}
                    penColor={penColor}
                    penSize={penSize}
                    highlightColor={highlightColor}
                    highlightSize={highlightSize}
                    annotations={annotations}
                    onAddAnnotation={handleAddAnnotation}
                    onRemoveAnnotation={handleRemoveAnnotation}
                    quickPresetToPlace={quickPresetToPlace}
                    onClearQuickPreset={() => setQuickPresetToPlace(null)}
                  />

                  {/* Question Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                    <div className="flex items-start space-x-2.5">
                      <span className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-700 font-mono font-bold text-xs flex items-center justify-center shrink-0 border border-indigo-200">
                        Q{ansItem.questionNumber || idx + 1}
                      </span>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900 leading-snug">
                          {ansItem.question?.questionText || 'Descriptive Question'}
                        </h4>
                        <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-0.5">
                          {ansItem.question?.unit && <span>Unit: {ansItem.question.unit}</span>}
                          {ansItem.question?.topic && <span>• Topic: {ansItem.question.topic}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 font-mono font-bold text-xs text-slate-800">
                        Max: {ansItem.maxMarks}m
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleShowRef(qId)}
                        className="px-2 py-1 rounded-lg text-slate-600 hover:text-slate-900 bg-white border border-slate-200 text-xs flex items-center space-x-1 shadow-2xs"
                      >
                        {showRef ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        <span>{showRef ? 'Hide Reference' : 'Reference Answer'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Model / Reference Answer (Toggleable) */}
                  {showRef && ansItem.question?.expectedAnswer && (
                    <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-200 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 flex items-center space-x-1">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Official Reference / Model Answer:</span>
                      </span>
                      <p className="text-xs text-slate-700 leading-relaxed font-mono whitespace-pre-wrap">
                        {ansItem.question.expectedAnswer}
                      </p>
                    </div>
                  )}

                  {/* Student Written Response / Candidate Answer Input */}
                  <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <label className="font-semibold text-slate-800 flex items-center space-x-1.5">
                        <FileText className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Candidate Written Response / Notes:</span>
                      </label>
                      <span className="text-[10px] font-mono text-slate-400">
                        {ansItem.studentAnswer ? `${ansItem.studentAnswer.split(/\s+/).filter(Boolean).length} words` : 'Type below'}
                      </span>
                    </div>
                    <textarea
                      rows={3}
                      value={ansItem.studentAnswer || ''}
                      onChange={(e) => {
                        const newText = e.target.value;
                        setCopy((prev) => {
                          const updatedAnswers = [...(prev.answers || [])];
                          updatedAnswers[idx] = { ...updatedAnswers[idx], studentAnswer: newText };
                          return { ...prev, answers: updatedAnswers };
                        });
                      }}
                      placeholder="Type or transcribe candidate's written response from physical copy here..."
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 leading-relaxed font-sans shadow-2xs"
                    />
                  </div>

                  {/* Rubric Breakdown */}
                  {ansItem.question?.rubric?.criteria && ansItem.question.rubric.criteria.length > 0 && (
                    <div className="p-3 rounded-xl bg-slate-50/50 border border-slate-200 space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                        Marking Rubric Standards
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {ansItem.question.rubric.criteria.map((crit, cIdx) => (
                          <div key={cIdx} className="p-2 rounded-lg bg-white border border-slate-200 text-[11px] space-y-0.5 shadow-2xs">
                            <div className="flex justify-between font-semibold text-slate-800">
                              <span>{crit.name}</span>
                              <span className="font-mono text-indigo-600">{crit.maxMarks}m</span>
                            </div>
                            <p className="text-slate-500 leading-tight">{crit.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* WORKFLOW BRANCH A: AI EVALUATION MODE */}
                  {isAiMode && (
                    <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-amber-800 font-semibold text-xs uppercase tracking-wider">
                          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
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
                              className="text-[10px] text-amber-700 border-amber-300 hover:bg-amber-100 py-1 px-2"
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
                        <div className="space-y-3 pt-2 border-t border-amber-200">
                          {/* Marks Comparison Table */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-white border border-amber-200 shadow-2xs">
                            <div>
                              <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">Maximum Marks</span>
                              <span className="text-base font-bold font-mono text-slate-900">
                                {ansItem.maxMarks} marks
                              </span>
                            </div>

                            <div>
                              <span className="text-[10px] text-amber-700 uppercase tracking-wider block font-semibold flex items-center space-x-1">
                                <Sparkles className="w-3 h-3" />
                                <span>AI Marks (Original)</span>
                              </span>
                              <span className="text-base font-bold font-mono text-amber-700">
                                {qEval.aiMarks ?? qEval.aiSuggestedMarks} / {ansItem.maxMarks}
                              </span>
                            </div>

                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] text-emerald-700 uppercase tracking-wider font-semibold">
                                  Final Marks {user?.role === 'ADMIN' && '(Admin Editable)'}
                                </span>
                                {qEval.aiMarks !== null && Number(qEval.finalMarks) !== Number(qEval.aiMarks) && (
                                  <span className="text-[9px] px-1 py-0.2 rounded bg-amber-100 text-amber-800 font-mono">
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
                                  className="w-20 bg-white border border-emerald-500 rounded-lg px-2.5 py-1 text-sm text-emerald-700 font-mono font-bold text-center focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                                <span className="text-xs text-slate-500 font-mono">/ {ansItem.maxMarks}</span>
                              </div>
                            </div>
                          </div>

                          {/* AI Explanation / Feedback */}
                          {(qEval.aiFeedback || qEval.comments) && (
                            <div className="text-xs text-slate-700 leading-relaxed bg-white p-3 rounded-xl border border-amber-200">
                              <strong className="text-amber-800 block text-[11px] mb-1">AI Feedback:</strong>
                              <p>{qEval.aiFeedback || qEval.comments}</p>
                            </div>
                          )}

                          {/* Criteria breakdown if available */}
                          {qEval.criteriaBreakdown?.length > 0 && (
                            <div className="space-y-1.5 pt-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                                Rubric Alignment:
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                {qEval.criteriaBreakdown.map((crit, crIdx) => (
                                  <div key={crIdx} className="p-2 rounded-lg bg-white border border-amber-100 text-[11px]">
                                    <div className="flex justify-between text-slate-800 font-semibold">
                                      <span>{crit.criterion}</span>
                                      <span className="font-mono text-amber-700">{crit.marks}/{crit.maxMarks}m</span>
                                    </div>
                                    <p className="text-slate-500 text-[10px] mt-0.5">{crit.feedback}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Admin Comment field */}
                          <div>
                            <label className="block text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">
                              Admin Comment (Preserves original AI Marks for audit)
                            </label>
                            <input
                              type="text"
                              value={qEval.comments || ''}
                              onChange={(e) => updateQuestionEvaluation(qId, 'comments', e.target.value)}
                              placeholder="Enter admin remarks or rationale for final marks..."
                              className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-white rounded-xl text-center text-xs text-slate-500 border border-amber-100">
                          {isAiRunning ? 'Analyzing student answer with Gemini AI...' : 'AI evaluation queued for this question.'}
                        </div>
                      )}
                    </div>
                  )}

                  {/* WORKFLOW BRANCH B: MANUAL EVALUATION MODE */}
                  {evalMode === 'MANUAL' && (
                    <div className="pt-3 border-t border-slate-100 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center space-x-2">
                          <label className="text-xs font-semibold text-slate-800 shrink-0">
                            Question {ansItem.questionNumber || idx + 1} Marks Given:
                          </label>
                          <input
                            type="number"
                            min="0"
                            max={ansItem.maxMarks}
                            step="0.5"
                            value={qEval.marksAwarded ?? 0}
                            onChange={(e) => handleManualMarkChange(qId, e.target.value, ansItem.maxMarks)}
                            className="w-20 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm text-emerald-700 font-mono font-bold text-center focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 shadow-2xs"
                          />
                          <span className="text-xs text-slate-500 font-mono">/ {ansItem.maxMarks}</span>
                        </div>
                      </div>

                      {/* Question-wise Remarks & Feedback Box */}
                      <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-200 space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                          <label className="text-[11px] font-semibold text-slate-700 flex items-center space-x-1.5">
                            <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Question {ansItem.questionNumber || idx + 1} Examiner Remarks:</span>
                          </label>

                          {/* Quick Preset Buttons for fast feedback */}
                          <div className="flex flex-wrap gap-1">
                            {['Step missing', 'Wrong formula', 'Good explanation', 'Partially correct', 'Calculation error'].map((tag) => (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => {
                                  const currentVal = qEval.comments || '';
                                  const newVal = currentVal ? `${currentVal}; ${tag}` : tag;
                                  updateQuestionEvaluation(qId, 'comments', newVal);
                                }}
                                className="px-1.5 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] text-slate-600 hover:text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50 transition-colors shadow-2xs"
                              >
                                + {tag}
                              </button>
                            ))}
                          </div>
                        </div>

                        <textarea
                          rows="2"
                          value={qEval.comments || ''}
                          onChange={(e) => updateQuestionEvaluation(qId, 'comments', e.target.value)}
                          placeholder={`Enter specific remarks for Question ${ansItem.questionNumber || idx + 1} (e.g., Step 2 missing, accurate explanation, deduction rationale)...`}
                          className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 leading-relaxed shadow-2xs"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Overall Comments & Final Evaluation Submission */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4 mb-8">
            <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-indigo-600" />
              <span>Overall Examiner Evaluation Feedback</span>
            </h4>
            <textarea
              rows="3"
              value={overallComments}
              onChange={(e) => setOverallComments(e.target.value)}
              placeholder="Enter examiner review summary, holistic feedback, or notes on student's performance..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 leading-relaxed shadow-2xs"
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-3 border-t border-slate-100 gap-4">
              <div className="text-xs text-slate-500">
                {isAiMode ? (
                  <div className="flex items-center space-x-4">
                    <span>
                      Total AI Marks:{' '}
                      <strong className="text-amber-700 font-mono text-sm font-bold ml-1">
                        {totalAiSuggested} / {totalMax} ({aiPercentage}%)
                      </strong>
                    </span>
                    <span>•</span>
                    <span>
                      Final Total:{' '}
                      <strong className="text-emerald-700 font-mono text-base font-bold ml-1">
                        {totalFinalMarks} / {totalMax} ({finalPercentage}%)
                      </strong>
                    </span>
                  </div>
                ) : (
                  <div>
                    Total Score Given:{' '}
                    <strong className="text-emerald-700 font-mono text-base font-bold ml-1">
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
                      Submit Evaluation
                    </Button>
                  </>
                ) : (
                  <div className="flex items-center space-x-1.5 text-xs text-emerald-700 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Evaluation Finalized</span>
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
