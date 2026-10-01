import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../context/ToastContext';
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
  Eye,
  Trash2,
  FileCheck,
  Cpu,
  Layers,
  HelpCircle,
  AlertCircle,
  Check,
  Scan,
  BookOpen,
  Lock,
  Unlock,
  UserCheck,
  RefreshCw,
  Sliders,
  ExternalLink,
  ZoomIn,
  ZoomOut
} from 'lucide-react';

const ScanAnswerCopies = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [exam, setExam] = useState(null);
  const [copies, setCopies] = useState([]);
  const [evaluators, setEvaluators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scannerStatus, setScannerStatus] = useState(null);
  const [pullingScannerFeed, setPullingScannerFeed] = useState(false);

  // Mode Selection & Locking State
  const [selectedMode, setSelectedMode] = useState('MANUAL');
  const [confirmAiModalCopy, setConfirmAiModalCopy] = useState(null); // single copy or 'BATCH'
  const [lockingMode, setLockingMode] = useState(false);
  const [runningAiBatch, setRunningAiBatch] = useState(false);
  const [evaluatingCopyId, setEvaluatingCopyId] = useState(null);

  const isAiMode =
    ['AI_EVALUATION', 'AI', 'AI_ASSISTED'].includes(selectedMode) ||
    ['AI_EVALUATION', 'AI', 'AI_ASSISTED'].includes(exam?.evaluationMode);

  // Manual Upload Form State (Fallback)
  const [candidateRollNo, setCandidateRollNo] = useState('');
  const [candidateName, setCandidateName] = useState('');
  const [bookletNumber, setBookletNumber] = useState('');
  const [customCopyId, setCustomCopyId] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [showUploadFallback, setShowUploadFallback] = useState(false);

  // Assignment Modal State
  const [assignModalCopy, setAssignModalCopy] = useState(null); // single copy or 'BATCH'
  const [selectedCopyIds, setSelectedCopyIds] = useState([]);
  const [targetEvaluatorId, setTargetEvaluatorId] = useState('');
  const [assigning, setAssigning] = useState(false);

  // View Copy Modal State
  const [viewCopyModal, setViewCopyModal] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    fetchInitialData();
  }, [id]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [examRes, copiesRes, evalRes, scannerRes] = await Promise.all([
        api.get(`/examinations/${id}`),
        api.get('/answer-copies', { params: { examinationId: id, limit: 200 } }),
        api.get('/evaluators'),
        api.get('/scanner/status').catch(() => ({ data: null }))
      ]);

      if (examRes.data.success) {
        const examData = examRes.data.examination;
        setExam(examData);
        if (examData.evaluationMode) {
          const norm = ['AI_EVALUATION', 'AI', 'AI_ASSISTED'].includes(examData.evaluationMode)
            ? 'AI_EVALUATION'
            : 'MANUAL';
          setSelectedMode(norm);
        }
      }
      if (copiesRes.data.success) {
        setCopies(copiesRes.data.answerCopies || []);
      }
      if (evalRes.data.success) {
        setEvaluators(evalRes.data.evaluators || []);
      }
      if (scannerRes?.data?.success) {
        setScannerStatus(scannerRes.data);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load examination details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const reloadCopies = async () => {
    try {
      const res = await api.get('/answer-copies', { params: { examinationId: id, limit: 200 } });
      if (res.data.success) {
        setCopies(res.data.answerCopies || []);
      }
    } catch (err) {
      // silently handle
    }
  };

  // Pull Scanned Batch from Scanner Station
  const handleTriggerScannerFeed = async (batchSize = 3) => {
    try {
      setPullingScannerFeed(true);
      const res = await api.post(`/scanner/feed/${id}`, { batchSize });
      if (res.data.success) {
        showToast(res.data.message || 'Scanned copies ingested from scanner station.', 'success');
        await fetchInitialData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to pull scanner feed', 'error');
    } finally {
      setPullingScannerFeed(false);
    }
  };

  const handleSelectMode = async (mode) => {
    if (exam?.evaluationModeLocked) return;
    const targetMode = mode === 'AI_EVALUATION' || mode === 'AI' ? 'AI_EVALUATION' : 'MANUAL';
    setSelectedMode(targetMode);
    try {
      await api.put(`/answer-copies/${id}/select-evaluation-mode`, {
        evaluationMode: targetMode
      });
      await reloadCopies();
    } catch (err) {
      // Local selection maintained
    }
  };

  // Start Batch AI Evaluation for all copies (Section 2 & 12)
  const handleStartAiEvaluation = async () => {
    try {
      setRunningAiBatch(true);
      const res = await api.post(`/answer-copies/${id}/start-ai-evaluation`);
      if (res.data.success) {
        showToast(res.data.message || 'AI Evaluation completed!', 'success');
        await fetchInitialData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to complete AI evaluation', 'error');
    } finally {
      setRunningAiBatch(false);
    }
  };

  // Run AI Evaluation on a single copy
  const handleSingleCopyAiEvaluate = async (copyId) => {
    try {
      setEvaluatingCopyId(copyId);
      const res = await api.post(`/answer-copies/${copyId}/ai-evaluate`);
      if (res.data.success) {
        showToast(res.data.message || 'AI evaluation completed for copy.', 'success');
        await reloadCopies();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to evaluate copy with AI', 'error');
    } finally {
      setEvaluatingCopyId(null);
    }
  };

  // Lock Evaluation Mode (Sections 3 & 4)
  const handleLockEvaluationMode = async () => {
    if (exam?.evaluationModeLocked) return;

    const targetMode = isAiMode ? 'AI_EVALUATION' : 'MANUAL';
    const modeLabel = isAiMode ? 'AI Evaluation' : 'Manual Evaluation';
    if (
      !window.confirm(
        `Are you sure you want to permanently LOCK the evaluation mode to "${modeLabel}"?\n\nOnce locked:\n• Admin cannot casually modify it.\n• Evaluators CANNOT change it or switch modes.\n• ${
          isAiMode
            ? 'Scanned copies will be evaluated strictly with AI and will NOT be assigned to evaluators.'
            : 'Scanned copies will be assigned to human evaluators for manual checking.'
        }`
      )
    ) {
      return;
    }

    try {
      setLockingMode(true);
      const res = await api.put(`/answer-copies/${id}/lock-evaluation-mode`, {
        evaluationMode: targetMode
      });
      if (res.data.success) {
        setExam(res.data.examination);
        showToast(`Evaluation mode permanently locked to ${modeLabel}!`, 'success');
        await reloadCopies();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to lock evaluation mode', 'error');
    } finally {
      setLockingMode(false);
    }
  };

  // Assign Copy to Evaluator (Sections 5 & 6)
  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!targetEvaluatorId) {
      showToast('Please select an evaluator.', 'warning');
      return;
    }

    const copyIdsToAssign = assignModalCopy === 'BATCH'
      ? selectedCopyIds
      : [assignModalCopy._id];

    if (copyIdsToAssign.length === 0) {
      showToast('No copies selected to assign.', 'warning');
      return;
    }

    try {
      setAssigning(true);
      const res = await api.post(`/answer-copies/${id}/assign`, {
        copyIds: copyIdsToAssign,
        evaluatorId: targetEvaluatorId
      });

      if (res.data.success) {
        showToast(res.data.message || 'Copies assigned successfully!', 'success');
        setAssignModalCopy(null);
        setSelectedCopyIds([]);
        setTargetEvaluatorId('');
        await reloadCopies();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to assign copies', 'error');
    } finally {
      setAssigning(false);
    }
  };

  // File Upload Helper (fallback)
  const fileToDataUrl = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const handleManualUpload = async (e) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      showToast('Please select at least one scanned file.', 'warning');
      return;
    }

    try {
      setUploading(true);
      const copiesPayload = [];

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const dataUrl = await fileToDataUrl(file);
        const copyCode = customCopyId
          ? (selectedFiles.length > 1 ? `${customCopyId}-${i + 1}` : customCopyId)
          : `COPY-${Date.now().toString().slice(-4)}-${i + 1}`;

        copiesPayload.push({
          copyId: copyCode,
          candidateRollNo: candidateRollNo || `ROLL-${Date.now().toString().slice(-4)}`,
          candidateName: candidateName || 'Candidate',
          bookletNumber: bookletNumber || `BK-${Date.now().toString().slice(-4)}`,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          fileUrl: dataUrl,
          scannedPages: [
            {
              pageNumber: 1,
              fileUrl: dataUrl
            }
          ]
        });
      }

      const res = await api.post(`/answer-copies/scan-upload/${id}`, { copies: copiesPayload });
      if (res.data.success) {
        showToast(`Successfully uploaded ${res.data.count} scanned physical copies.`, 'success');
        setSelectedFiles([]);
        setCandidateRollNo('');
        setCandidateName('');
        setBookletNumber('');
        setCustomCopyId('');
        setShowUploadFallback(false);
        await fetchInitialData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to upload copies', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteCopy = async (copyId) => {
    if (!window.confirm('Delete this answer copy?')) return;
    try {
      const res = await api.delete(`/answer-copies/${copyId}`);
      if (res.data.success) {
        showToast('Answer copy deleted.', 'success');
        await reloadCopies();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete copy', 'error');
    }
  };

  const toggleSelectCopy = (copyId) => {
    setSelectedCopyIds((prev) =>
      prev.includes(copyId) ? prev.filter((c) => c !== copyId) : [...prev, copyId]
    );
  };

  const selectAllUnassigned = () => {
    const unassignedIds = copies.filter((c) => !c.assignedEvaluator).map((c) => c._id);
    setSelectedCopyIds(unassignedIds);
  };

  if (loading) {
    return <LoadingSpinner fullPage text="Loading examination and scanned copies..." />;
  }

  // Summary Metrics
  const totalCopies = copies.length;
  const assignedCopies = copies.filter((c) => c.assignedEvaluator).length;
  const unassignedCopies = totalCopies - assignedCopies;
  const evaluatedCopies = copies.filter((c) => c.evaluationStatus === 'COMPLETED' || c.evaluationStatus === 'AI_APPROVED').length;

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Page Header */}
      <div>
        <Link
          to="/admin/examinations"
          className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Examinations</span>
        </Link>
        <PageHeader
          title={`Scanned Copies: ${exam?.name}`}
          subtitle={`Manage physical answer copy scanning, evaluation mode locking, and evaluator assignments for ${exam?.subject}.`}
          breadcrumb="Examination Management / Scanned Copies"
          action={
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                icon={RefreshCw}
                onClick={fetchInitialData}
              >
                Refresh
              </Button>
            </div>
          }
        />
      </div>

      {/* Examination Metadata Card */}
      <div className="surface-card p-5 rounded-xl border border-slate-800 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 text-xs">
        <div>
          <span className="text-slate-400 block text-[10px] uppercase tracking-wider">Exam Code</span>
          <span className="font-mono font-bold text-slate-100 text-sm">{exam?.code}</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] uppercase tracking-wider">Subject</span>
          <span className="font-semibold text-indigo-400 text-sm">{exam?.subject}</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] uppercase tracking-wider">Max Marks</span>
          <span className="font-mono font-bold text-slate-100 text-sm">{exam?.maxMarks} marks</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] uppercase tracking-wider">Examination Status</span>
          <div className="mt-0.5">
            <Badge status={exam?.status}>{exam?.status}</Badge>
          </div>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] uppercase tracking-wider">Total Scanned</span>
          <span className="font-mono font-bold text-emerald-400 text-base">{totalCopies}</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] uppercase tracking-wider">Evaluation Mode</span>
          <span className="font-semibold text-slate-200 block mt-0.5">
            {exam?.evaluationMode === 'AI_ASSISTED' ? 'AI-Assisted' : (exam?.evaluationMode === 'MANUAL' ? 'Manual' : 'Not Configured')}
            {exam?.evaluationModeLocked && <span className="ml-1 text-emerald-400">🔒</span>}
          </span>
        </div>
      </div>

      {/* SECTION 1: SCANNER INTEGRATION STATION */}
      <div className="surface-card rounded-xl border border-indigo-500/20 overflow-hidden shadow-lg">
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Scan className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Physical Scanner Integration Station
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  ● Bridge Active
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                Driver Protocol: {scannerStatus?.hardwareProtocol || 'TWAIN-Direct / WIA Network Driver'} • 300 DPI Duplex
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="primary"
              size="sm"
              icon={Scan}
              loading={pullingScannerFeed}
              onClick={() => handleTriggerScannerFeed(3)}
            >
              Scan Batch from Scanner Station
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={UploadCloud}
              onClick={() => setShowUploadFallback((v) => !v)}
            >
              {showUploadFallback ? 'Hide File Import' : 'Manual Scanned File Import'}
            </Button>
          </div>
        </div>

        {/* Real-world flow indicator */}
        <div className="p-4 bg-slate-950/70 border-b border-slate-800/80 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 text-slate-400">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 font-medium">Physical Answer Copies</span>
              <span>→</span>
              <span className="px-2 py-1 rounded bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 font-medium">High-Speed Scanner</span>
              <span>→</span>
              <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 font-medium">Scanner Integration Service</span>
              <span>→</span>
              <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 font-medium">Digital Copies</span>
              <span>→</span>
              <span className="px-2 py-1 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-medium">Admin Scanned Copies</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            ℹ️ Physical answer sheets are ingested directly through the high-speed scanner integration layer (`/api/scanner/ingest`). Barcode identification and optical scans automatically map to this examination.
          </p>
        </div>

        {/* Manual File Import Fallback Form */}
        {showUploadFallback && (
          <form onSubmit={handleManualUpload} className="p-5 bg-slate-900/90 border-t border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-1.5">
                <UploadCloud className="w-4 h-4 text-indigo-400" />
                <span>Operator Manual File Import (PDF, JPG, JPEG, PNG)</span>
              </h4>
              <span className="text-[10px] text-slate-400">Used if scanner drops files into local directory</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Candidate Roll No</label>
                <input
                  type="text"
                  placeholder="e.g. CS-2024-001"
                  value={candidateRollNo}
                  onChange={(e) => setCandidateRollNo(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Candidate Name</label>
                <input
                  type="text"
                  placeholder="e.g. Aarav Sharma"
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Answer Booklet ID</label>
                <input
                  type="text"
                  placeholder="e.g. BK-OS-8801"
                  value={bookletNumber}
                  onChange={(e) => setBookletNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Custom Copy ID</label>
                <input
                  type="text"
                  placeholder="e.g. COPY-001"
                  value={customCopyId}
                  onChange={(e) => setCustomCopyId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <input
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setSelectedFiles(Array.from(e.target.files))}
                className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500"
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" variant="primary" size="sm" loading={uploading} icon={UploadCloud}>
                Import Scanned Physical Copy
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* SECTION 2: EVALUATION MODE SELECTION & LOCKING (Sections 3 & 4) */}
      <div className="surface-card p-5 rounded-xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <span>Evaluation Mode Configuration</span>
              </h3>
              {exam?.evaluationModeLocked ? (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
                  <Lock className="w-3 h-3" />
                  <span>LOCKED</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center space-x-1">
                  <Unlock className="w-3 h-3" />
                  <span>SELECT & LOCK</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Select exactly one evaluation mode for this examination. Once locked, the mode cannot be modified and evaluators cannot override it.
            </p>
          </div>

          {!exam?.evaluationModeLocked && (
            <Button
              variant="primary"
              size="md"
              icon={Lock}
              loading={lockingMode}
              onClick={handleLockEvaluationMode}
            >
              Lock Evaluation Mode
            </Button>
          )}
        </div>

        {/* Mode Selector Cards (Only TWO options: Manual Evaluation or AI Evaluation) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Option 1: MANUAL EVALUATION */}
          <div
            onClick={() => handleSelectMode('MANUAL')}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              selectedMode === 'MANUAL'
                ? 'bg-indigo-950/30 border-indigo-500 ring-1 ring-indigo-500'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
            } ${exam?.evaluationModeLocked ? 'cursor-default' : ''}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  name="evalMode"
                  value="MANUAL"
                  checked={selectedMode === 'MANUAL'}
                  disabled={exam?.evaluationModeLocked}
                  onChange={() => handleSelectMode('MANUAL')}
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-700 bg-slate-950"
                />
                <div>
                  <h4 className="text-sm font-bold text-white">Manual Evaluation</h4>
                  <span className="text-[11px] text-indigo-400 font-medium">Examiner Assignment & Question-Wise Grading</span>
                </div>
              </div>
              <FileCheck className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-xs text-slate-300 mt-3 leading-relaxed">
              Scanned copies remain available. Admin assigns copies to evaluators who review scanned booklets and enter question-wise marks manually.
            </p>
          </div>

          {/* Option 2: AI EVALUATION */}
          <div
            onClick={() => handleSelectMode('AI_EVALUATION')}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              isAiMode
                ? 'bg-indigo-950/30 border-indigo-500 ring-1 ring-indigo-500'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
            } ${exam?.evaluationModeLocked ? 'cursor-default' : ''}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  name="evalMode"
                  value="AI_EVALUATION"
                  checked={isAiMode}
                  disabled={exam?.evaluationModeLocked}
                  onChange={() => handleSelectMode('AI_EVALUATION')}
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-700 bg-slate-950"
                />
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center space-x-1.5">
                    <span>AI Evaluation</span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  </h4>
                  <span className="text-[11px] text-amber-400 font-medium">Google Gemini Multimodal Evaluation + Admin Review</span>
                </div>
              </div>
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <p className="text-xs text-slate-300 mt-3 leading-relaxed">
              Scanned copies are evaluated directly using Google Gemini AI. No evaluator assignment. Admin reviews and finalizes question-wise marks.
            </p>
          </div>
        </div>

        {exam?.evaluationModeLocked && (
          <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 flex items-center space-x-2 text-xs text-emerald-300">
            <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Evaluation Mode is permanently <strong>LOCKED</strong> to{' '}
              <strong>{isAiMode ? 'AI Evaluation' : 'Manual Evaluation'}</strong>.
              All answer copies follow this configuration. Evaluators cannot change or override this mode.
            </span>
          </div>
        )}
      </div>

      {/* SECTION 3: SCANNED COPIES TABLE & ASSIGNMENTS */}
      <div className="surface-card rounded-xl border border-slate-800 overflow-hidden shadow-lg space-y-0">
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Scanned Copies ({totalCopies})
            </h3>
            <div className="flex items-center space-x-2 text-xs">
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                Assigned: {assignedCopies}
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-400 font-mono">
                Unassigned: {unassignedCopies}
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-emerald-400 font-mono">
                Evaluated: {evaluatedCopies}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {isAiMode ? (
              <Button
                variant="primary"
                size="sm"
                icon={Sparkles}
                loading={runningAiBatch}
                onClick={() => setConfirmAiModalCopy('BATCH')}
                className="bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 text-white"
              >
                🤖 Evaluate All with AI
              </Button>
            ) : (
              <>
                {selectedCopyIds.length > 0 && (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={UserCheck}
                    onClick={() => setAssignModalCopy('BATCH')}
                  >
                    Assign Selected ({selectedCopyIds.length})
                  </Button>
                )}
                {unassignedCopies > 0 && selectedCopyIds.length === 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectAllUnassigned}
                  >
                    Select All Unassigned
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {totalCopies === 0 ? (
          <EmptyState
            title="No Scanned Answer Copies Ingested"
            message="Click 'Scan Batch from Scanner Station' above or use manual file import to ingest answer sheets."
            action={
              <Button
                variant="primary"
                icon={Scan}
                loading={pullingScannerFeed}
                onClick={() => handleTriggerScannerFeed(3)}
              >
                Scan Physical Copies Now
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  {isAiMode ? (
                    <th className="py-3 px-4 w-12 text-center text-slate-500">#</th>
                  ) : (
                    <th className="py-3 px-4 w-10">
                      <input
                        type="checkbox"
                        checked={selectedCopyIds.length > 0 && selectedCopyIds.length === copies.filter((c) => !c.assignedEvaluator).length}
                        onChange={(e) => {
                          if (e.target.checked) selectAllUnassigned();
                          else setSelectedCopyIds([]);
                        }}
                        className="rounded border-slate-700 bg-slate-900"
                      />
                    </th>
                  )}
                  <th className="py-3 px-4">Copy ID</th>
                  <th className="py-3 px-4">Candidate Identifier</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Evaluation Mode</th>
                  <th className="py-3 px-4">Assigned Evaluator</th>
                  <th className="py-3 px-4">Evaluation Progress</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {copies.map((copy, idx) => {
                  const isAssigned = !!copy.assignedEvaluator;
                  const isCompleted = ['AI_EVALUATED', 'AI_REVIEWED', 'EVALUATED', 'REVIEWED', 'COMPLETED', 'AI_APPROVED', 'ADMIN_REVIEWED'].includes(copy.evaluationStatus);

                  return (
                    <tr key={copy._id} className="hover:bg-slate-800/30 transition-colors">
                      {isAiMode ? (
                        <td className="py-3 px-4 text-center text-slate-500 font-mono font-medium">
                          {idx + 1}
                        </td>
                      ) : (
                        <td className="py-3 px-4">
                          {!isAssigned && (
                            <input
                              type="checkbox"
                              checked={selectedCopyIds.includes(copy._id)}
                              onChange={() => toggleSelectCopy(copy._id)}
                              className="rounded border-slate-700 bg-slate-900"
                            />
                          )}
                        </td>
                      )}

                      {/* Copy ID */}
                      <td className="py-3 px-4 font-mono font-bold text-white">
                        <div className="flex items-center space-x-1.5">
                          <span>{copy.copyId}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-sans block">
                          Booklet: {copy.bookletNumber || 'N/A'}
                        </span>
                      </td>

                      {/* Candidate */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-100">{copy.candidateName || 'Candidate'}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Roll: {copy.candidateRollNo || 'N/A'}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {['AI_REVIEWED', 'REVIEWED', 'ADMIN_REVIEWED'].includes(copy.evaluationStatus) ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            {isAiMode ? 'AI REVIEWED' : 'REVIEWED'}
                          </span>
                        ) : ['AI_EVALUATED', 'EVALUATED'].includes(copy.evaluationStatus) ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                            {isAiMode ? 'AI EVALUATED' : 'EVALUATED'}
                          </span>
                        ) : ['AI_PROCESSING', 'PROCESSING'].includes(copy.evaluationStatus) ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse">
                            AI PROCESSING...
                          </span>
                        ) : ['AI_FAILED', 'FAILED'].includes(copy.evaluationStatus) ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                            AI FAILED
                          </span>
                        ) : isAiMode ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                            AI PENDING
                          </span>
                        ) : (
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                              isAssigned
                                ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            {isAssigned ? 'ASSIGNED' : 'PENDING'}
                          </span>
                        )}
                      </td>

                      {/* Evaluation Mode */}
                      <td className="py-3 px-4">
                        <span className="font-mono text-xs">
                          {isAiMode ? (
                            <span className="text-amber-400 flex items-center space-x-1">
                              <Sparkles className="w-3 h-3" />
                              <span>AI Evaluation</span>
                            </span>
                          ) : (
                            <span className="text-slate-300">Manual Evaluation</span>
                          )}
                        </span>
                      </td>

                      {/* Evaluator */}
                      <td className="py-3 px-4">
                        {isAiMode ? (
                          <span className="text-emerald-400/90 font-medium text-[11px] flex items-center space-x-1">
                            <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                            <span>AI System (No Evaluator)</span>
                          </span>
                        ) : copy.assignedEvaluator ? (
                          <div>
                            <span className="font-semibold text-slate-200 block">
                              {copy.assignedEvaluator.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {copy.assignedEvaluator.email}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">— Unassigned</span>
                        )}
                      </td>

                      {/* Evaluation Progress */}
                      <td className="py-3 px-4">
                        {isCompleted ? (
                          <div>
                            <div className="flex items-center space-x-1 text-emerald-400 font-mono font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>
                                Final: {copy.finalTotal ?? copy.totalAwardedMarks} / {copy.totalMaxMarks} ({copy.percentage}%)
                              </span>
                            </div>
                            {isAiMode && (
                              <div className="text-[10px] text-amber-400/90 font-mono">
                                AI Score: {copy.aiTotal ?? copy.totalAwardedMarks} / {copy.totalMaxMarks}
                              </div>
                            )}
                          </div>
                        ) : ['AI_PROCESSING', 'PROCESSING'].includes(copy.evaluationStatus) ? (
                          <span className="text-amber-400 font-mono text-xs flex items-center space-x-1">
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            <span>AI Processing...</span>
                          </span>
                        ) : ['AI_FAILED', 'FAILED'].includes(copy.evaluationStatus) ? (
                          <span className="text-rose-400 font-mono text-xs" title={copy.errorMessage}>
                            AI Evaluation Failed
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono text-xs">
                            {isAiMode ? 'Ready for AI' : 'Pending Evaluation'}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={Eye}
                          onClick={() => setViewCopyModal(copy)}
                          className="text-[11px]"
                        >
                          View Copy
                        </Button>

                        {isAiMode ? (
                          // STRICT REQUIREMENT: In AI Evaluation, NEVER show Assign Evaluator!
                          <>
                            {isCompleted ? (
                              <Link to={`/admin/evaluate/${copy._id}`}>
                                <Button
                                  size="sm"
                                  variant="primary"
                                  icon={CheckCircle2}
                                  className="text-[11px] bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white"
                                >
                                  Review AI Evaluation
                                </Button>
                              </Link>
                            ) : ['AI_PROCESSING', 'PROCESSING'].includes(copy.evaluationStatus) || evaluatingCopyId === copy._id ? (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled
                                className="text-[11px] text-amber-300 border-amber-500/40 opacity-80"
                              >
                                <RefreshCw className="w-3 h-3 animate-spin mr-1" />
                                AI Processing...
                              </Button>
                            ) : ['AI_FAILED', 'FAILED'].includes(copy.evaluationStatus) ? (
                              <Button
                                size="sm"
                                variant="outline"
                                icon={RefreshCw}
                                onClick={() => setConfirmAiModalCopy(copy)}
                                className="text-[11px] text-rose-300 border-rose-500/40 hover:bg-rose-500/10"
                              >
                                Retry AI
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="primary"
                                icon={Sparkles}
                                onClick={() => setConfirmAiModalCopy(copy)}
                                className="text-[11px] bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 text-white shadow-sm"
                              >
                                🤖 Evaluate with AI
                              </Button>
                            )}
                          </>
                        ) : (
                          // MANUAL MODE: Assign Evaluator and Manual Evaluation
                          <>
                            {!isCompleted && (
                              <Button
                                size="sm"
                                variant="outline"
                                icon={UserCheck}
                                onClick={() => {
                                  setAssignModalCopy(copy);
                                  setTargetEvaluatorId(copy.assignedEvaluator?._id || '');
                                }}
                                className="text-[11px]"
                              >
                                {isAssigned ? 'Reassign' : 'Assign Evaluator'}
                              </Button>
                            )}

                            <Link to={`/admin/evaluate/${copy._id}`}>
                              <Button
                                size="sm"
                                variant="primary"
                                icon={BookOpen}
                                className="text-[11px]"
                              >
                                {isCompleted ? 'Review & Edit Marks' : 'Evaluate'}
                              </Button>
                            </Link>
                          </>
                        )}

                        {!isAssigned && !isAiMode && (
                          <Button
                            size="sm"
                            variant="ghost"
                            icon={Trash2}
                            onClick={() => handleDeleteCopy(copy._id)}
                            className="text-[11px] text-rose-400 hover:text-rose-300"
                          />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ASSIGN / REASSIGN EVALUATOR MODAL */}
      <Modal
        isOpen={!!assignModalCopy}
        onClose={() => setAssignModalCopy(null)}
        title={
          assignModalCopy === 'BATCH'
            ? `Batch Assign ${selectedCopyIds.length} Answer Copies`
            : `Assign Evaluator: ${assignModalCopy?.copyId}`
        }
      >
        <form onSubmit={handleAssignSubmit} className="space-y-4 text-xs">
          <div>
            <span className="text-slate-400 block mb-1">Examination & Subject</span>
            <span className="font-semibold text-slate-100">{exam?.name} ({exam?.subject})</span>
          </div>

          <div>
            <span className="text-slate-400 block mb-1">Locked Evaluation Mode</span>
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
              <span className="font-bold text-indigo-400 font-mono">
                {exam?.evaluationMode || 'MANUAL'}
              </span>
              <span className="text-[10px] text-slate-400">
                (Copies inherit this mode automatically)
              </span>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">
              Select Evaluator *
            </label>
            <select
              value={targetEvaluatorId}
              onChange={(e) => setTargetEvaluatorId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
            >
              <option value="">-- Choose Evaluator --</option>
              {evaluators.map((ev) => (
                <option key={ev.user?._id || ev._id} value={ev.user?._id || ev._id}>
                  {ev.name || ev.user?.name} ({ev.department || 'Academic'} • Active: {ev.workload?.activeAssigned || 0})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAssignModalCopy(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={assigning}
              icon={UserCheck}
            >
              Confirm Assignment
            </Button>
          </div>
        </form>
      </Modal>

      {/* AI EVALUATION CONFIRMATION MODAL (Section 6) */}
      <Modal
        isOpen={!!confirmAiModalCopy}
        onClose={() => setConfirmAiModalCopy(null)}
        title="Evaluate Scanned Copy with AI?"
      >
        <div className="space-y-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-900/90 border border-indigo-500/30 text-slate-200 space-y-3">
            <div className="flex items-center space-x-2 text-indigo-400 font-semibold text-sm">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>AI Evaluation Confirmation</span>
            </div>
            <p className="leading-relaxed text-slate-300">
              This answer copy will be automatically evaluated using the configured AI evaluation system.
            </p>
            <p className="leading-relaxed text-slate-400 text-[11px]">
              The generated marks and feedback can be reviewed and modified by the Admin after evaluation.
            </p>
            {confirmAiModalCopy && confirmAiModalCopy !== 'BATCH' && (
              <div className="mt-2 pt-2.5 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-400">
                  Target Copy: <strong className="text-white">{confirmAiModalCopy.copyId}</strong>
                </span>
                <span className="text-slate-400">
                  Candidate: <strong className="text-white">{confirmAiModalCopy.candidateName || 'N/A'}</strong>
                </span>
              </div>
            )}
            {confirmAiModalCopy === 'BATCH' && (
              <div className="mt-2 pt-2.5 border-t border-slate-800 text-[11px] font-mono text-amber-300">
                Evaluation Target: All {copies.length} scanned copies for this examination.
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setConfirmAiModalCopy(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              icon={Sparkles}
              loading={runningAiBatch || !!evaluatingCopyId}
              onClick={async () => {
                const target = confirmAiModalCopy;
                setConfirmAiModalCopy(null);
                if (target === 'BATCH') {
                  await handleStartAiEvaluation();
                } else if (target?._id) {
                  await handleSingleCopyAiEvaluate(target._id);
                }
              }}
              className="bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 text-white"
            >
              Evaluate with AI
            </Button>
          </div>
        </div>
      </Modal>

      {/* VIEW SCANNED COPY PREVIEW MODAL */}
      <Modal
        isOpen={!!viewCopyModal}
        onClose={() => setViewCopyModal(null)}
        title={`Scanned Physical Answer Booklet: ${viewCopyModal?.copyId}`}
      >
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-3 gap-3 p-3 bg-slate-950 rounded-lg border border-slate-800">
            <div>
              <span className="text-slate-400 block text-[10px]">Candidate Roll No</span>
              <span className="font-mono font-bold text-slate-100">{viewCopyModal?.candidateRollNo || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Booklet ID</span>
              <span className="font-mono font-bold text-indigo-400">{viewCopyModal?.bookletNumber || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Candidate Name</span>
              <span className="font-semibold text-slate-200">{viewCopyModal?.candidateName || 'Candidate'}</span>
            </div>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center justify-between bg-slate-900 p-2 rounded-lg border border-slate-800">
            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.2))}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-slate-300 text-xs px-2">{Math.round(zoomLevel * 100)}%</span>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(2.0, z + 0.2))}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel(1)}
                className="px-2 py-0.5 rounded text-[10px] font-mono text-slate-400 hover:text-white hover:bg-slate-800"
              >
                Reset
              </button>
            </div>

            {viewCopyModal?.scannedDocument?.fileUrl && (
              <a
                href={viewCopyModal.scannedDocument.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1 text-indigo-400 hover:text-indigo-300 text-xs"
              >
                <span>Open in New Tab</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          {/* Document Display */}
          <div className="max-h-[500px] overflow-auto bg-slate-950 p-4 rounded-lg border border-slate-800 flex justify-center">
            {viewCopyModal?.scannedDocument?.fileUrl ? (
              viewCopyModal.scannedDocument.fileType?.includes('pdf') || viewCopyModal.scannedDocument.fileName?.endsWith('.pdf') ? (
                <iframe
                  src={viewCopyModal.scannedDocument.fileUrl}
                  title="Answer Booklet Preview"
                  className="w-full h-[450px] rounded border border-slate-700 bg-white"
                  style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
                />
              ) : (
                <img
                  src={viewCopyModal.scannedDocument.fileUrl}
                  alt="Scanned Physical Copy"
                  style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
                  className="max-w-full rounded shadow-md border border-slate-800"
                />
              )
            ) : (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <FileText className="w-8 h-8 mx-auto text-slate-600" />
                <p>Digital copy rendered from scanner station ingestion data.</p>
                <p className="font-mono text-xs text-slate-500">Booklet: {viewCopyModal?.bookletNumber}</p>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="outline" size="sm" onClick={() => setViewCopyModal(null)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ScanAnswerCopies;
