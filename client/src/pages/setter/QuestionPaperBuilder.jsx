import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../context/ToastContext';
import { FileText, Plus, Trash2, ArrowUp, ArrowDown, Send, Eye, CheckCircle2, AlertCircle, Sparkles, RefreshCw, Edit3 } from 'lucide-react';

const QuestionPaperBuilder = () => {
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [questionBank, setQuestionBank] = useState([]);
  const [existingPapers, setExistingPapers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active builder paper
  const [activePaperId, setActivePaperId] = useState(null);
  const [paperTitle, setPaperTitle] = useState('');
  const [instructions, setInstructions] = useState([
    'All questions are compulsory.',
    'Write concise, well-structured, point-wise answers.',
    'Draw neat technical diagrams and protocol timing sequences wherever appropriate.'
  ]);
  const [selectedQuestions, setSelectedQuestions] = useState([]); // [{ questionId, question, marks, customInstruction }]
  const [paperStatus, setPaperStatus] = useState('DRAFT');
  const [rejectionNotes, setRejectionNotes] = useState('');

  // AI states
  const [generatingAi, setGeneratingAi] = useState(false);
  const [regeneratingIdx, setRegeneratingIdx] = useState(null);
  const [editingQuestionIdx, setEditingQuestionIdx] = useState(null);

  // Question Picker Modal
  const [pickerModalOpen, setPickerModalOpen] = useState(false);
  const [pickerSubjectFilter, setPickerSubjectFilter] = useState('');
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [examsRes, qRes, papersRes] = await Promise.all([
        api.get('/examinations'),
        api.get('/questions'),
        api.get('/question-papers')
      ]);

      if (examsRes.data.success) {
        setExams(examsRes.data.examinations || []);
        if (examsRes.data.examinations.length > 0) {
          setSelectedExamId(examsRes.data.examinations[0]._id);
        }
      }
      if (qRes.data.success) setQuestionBank(qRes.data.questions || []);
      if (papersRes.data.success) setExistingPapers(papersRes.data.questionPapers || []);
    } catch (err) {
      showToast('Failed to load question paper data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedExamId) {
      loadPaperForExam(selectedExamId);
    }
  }, [selectedExamId, existingPapers]);

  const loadPaperForExam = (examId) => {
    const exam = exams.find((e) => e._id === examId);
    const paper = existingPapers.find((p) => p.examination?._id === examId || p.examination === examId);

    if (paper) {
      setActivePaperId(paper._id);
      setPaperTitle(paper.paperTitle);
      setInstructions(paper.instructions || []);
      setPaperStatus(paper.status);
      setRejectionNotes(paper.rejectionReason || '');
      setSelectedQuestions(
        paper.questions?.map((qItem) => ({
          questionId: qItem.question?._id || qItem.question,
          question: qItem.question,
          marks: qItem.marks,
          customInstruction: qItem.customInstruction || ''
        })) || []
      );
    } else {
      setActivePaperId(null);
      setPaperTitle(`${exam?.name || 'Examination'} - Official Paper`);
      setInstructions([
        'All questions are compulsory.',
        'Write concise, well-structured, point-wise answers.',
        'Draw diagrams wherever relevant.'
      ]);
      setPaperStatus('DRAFT');
      setRejectionNotes('');
      setSelectedQuestions([]);
    }
  };

  const selectedExam = exams.find((e) => e._id === selectedExamId);
  const currentTotalMarks = selectedQuestions.reduce((acc, q) => acc + (Number(q.marks) || 0), 0);
  const examMaxMarks = selectedExam?.maxMarks || 50;
  const isMarksMatching = currentTotalMarks === examMaxMarks;
  const isPaperLocked = paperStatus === 'APPROVED' || paperStatus === 'SUBMITTED';

  const availableSubjects = Array.from(
    new Set(questionBank.map((q) => q.subject).filter(Boolean))
  ).sort();

  const handleOpenPicker = () => {
    if (selectedExam?.subject && availableSubjects.includes(selectedExam.subject)) {
      setPickerSubjectFilter(selectedExam.subject);
    } else if (availableSubjects.length > 0) {
      setPickerSubjectFilter(availableSubjects[0]);
    }
    setPickerModalOpen(true);
  };

  // Add question from Question Bank Picker
  const addQuestionToPaper = (question) => {
    if (selectedQuestions.some((q) => q.questionId === question._id)) {
      showToast('Question already added to paper.', 'warning');
      return;
    }

    setSelectedQuestions([
      ...selectedQuestions,
      {
        questionId: question._id,
        question: question,
        marks: question.marks,
        customInstruction: ''
      }
    ]);
    showToast(`Added Q${selectedQuestions.length + 1} to paper`, 'info');
  };

  const removeQuestionFromPaper = (idx) => {
    setSelectedQuestions(selectedQuestions.filter((_, i) => i !== idx));
  };

  const moveQuestion = (idx, direction) => {
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === selectedQuestions.length - 1) return;

    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    const updated = [...selectedQuestions];
    const temp = updated[idx];
    updated[idx] = updated[targetIdx];
    updated[targetIdx] = temp;
    setSelectedQuestions(updated);
  };

  const handleSaveDraft = async () => {
    if (!selectedExamId) return;

    try {
      setSaving(true);
      const payload = {
        examinationId: selectedExamId,
        paperTitle,
        instructions,
        questions: selectedQuestions.map((q, idx) => ({
          question: q.questionId,
          questionNumber: idx + 1,
          marks: Number(q.marks),
          customInstruction: q.customInstruction || ''
        }))
      };

      const url = activePaperId ? `/question-papers/${activePaperId}` : '/question-papers';
      const res = await api({
        method: activePaperId ? 'put' : 'post',
        url,
        data: payload
      });

      if (res.data.success) {
        showToast('Question paper saved successfully!', 'success');
        setActivePaperId(res.data.questionPaper._id);
        setPaperStatus(res.data.questionPaper.status);
        const [refreshPapers, refreshExams] = await Promise.all([
          api.get('/question-papers'),
          api.get('/examinations')
        ]);
        if (refreshPapers.data?.success) setExistingPapers(refreshPapers.data.questionPapers || []);
        if (refreshExams.data?.success) setExams(refreshExams.data.examinations || []);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error saving question paper', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitForApproval = async () => {
    if (!selectedExamId) {
      showToast('Please select an active examination first.', 'warning');
      return;
    }

    if (!selectedQuestions || selectedQuestions.length === 0) {
      showToast('Please add questions to the paper before submitting.', 'error');
      return;
    }

    if (!isMarksMatching) {
      showToast(
        `Total marks (${currentTotalMarks}) must equal exam maximum marks (${examMaxMarks}) before submission.`,
        'error'
      );
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        examinationId: selectedExamId,
        paperTitle,
        instructions,
        questions: selectedQuestions.map((q, idx) => ({
          question: q.questionId,
          questionNumber: idx + 1,
          marks: Number(q.marks),
          customInstruction: q.customInstruction || ''
        }))
      };

      // 1. Auto-save current state first so MongoDB has the exact latest questions and marks
      let paperId = activePaperId;
      const saveUrl = paperId ? `/question-papers/${paperId}` : '/question-papers';
      const saveRes = await api({
        method: paperId ? 'put' : 'post',
        url: saveUrl,
        data: payload
      });

      if (saveRes.data?.success && saveRes.data?.questionPaper?._id) {
        paperId = saveRes.data.questionPaper._id;
        setActivePaperId(paperId);
      }

      // 2. Submit for Admin review
      const submitTargetId = paperId || selectedExamId;
      const res = await api.post(`/question-papers/${submitTargetId}/submit`, {
        comments: 'Ready for administrative approval and conduct scheduling.',
        ...payload
      });

      if (res.data.success) {
        showToast('Question paper submitted for admin approval!', 'success');
        setPaperStatus('SUBMITTED');
        const [refreshPapers, refreshExams] = await Promise.all([
          api.get('/question-papers'),
          api.get('/examinations')
        ]);
        if (refreshPapers.data?.success) setExistingPapers(refreshPapers.data.questionPapers || []);
        if (refreshExams.data?.success) setExams(refreshExams.data.examinations || []);
      }
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Error submitting question paper', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateAiPaper = async () => {
    if (!selectedExamId) {
      showToast('Please select an active examination first.', 'warning');
      return;
    }
    try {
      setGeneratingAi(true);
      const res = await api.post('/ai/generate-paper', {
        examinationId: selectedExamId
      });
      if (res.data.success) {
        const generated = res.data.data;
        const saveRes = await api.post('/ai/save-generated-paper', {
          examinationId: selectedExamId,
          paperTitle: generated.title,
          questions: generated.questions
        });
        if (saveRes.data.success) {
          showToast('Question paper generated strictly from syllabus using Gemini AI!', 'success');
          const refreshPapers = await api.get('/question-papers');
          if (refreshPapers.data.success) {
            setExistingPapers(refreshPapers.data.questionPapers || []);
          }
        }
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to generate paper with AI', 'error');
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleRegenerateQuestionInPaper = async (idx) => {
    const item = selectedQuestions[idx];
    if (!item) return;
    try {
      setRegeneratingIdx(idx);
      const res = await api.post('/ai/regenerate-question', {
        subject: selectedExam?.subject,
        unit: item.question?.unit || 'Unit 1',
        topic: item.question?.topic || 'General',
        marks: item.marks,
        difficulty: item.question?.difficulty || 'MEDIUM',
        questionType: item.question?.questionType || 'DESCRIPTIVE',
        existingQuestions: selectedQuestions.map((q) => q.question?.questionText || '')
      });
      if (res.data.success) {
        const updated = [...selectedQuestions];
        updated[idx] = {
          ...updated[idx],
          question: {
            ...updated[idx].question,
            questionText: res.data.question.questionText,
            expectedAnswer: res.data.question.expectedAnswer,
            difficulty: res.data.question.difficulty
          }
        };
        setSelectedQuestions(updated);
        showToast(`Q${idx + 1} regenerated with AI!`, 'success');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error regenerating question', 'error');
    } finally {
      setRegeneratingIdx(null);
    }
  };

  if (loading) {
    return <LoadingSpinner fullPage text="Initializing question paper builder..." />;
  }

  return (
    <div>
      <PageHeader
        title="Question Paper Assembly & Approval Submission"
        subtitle="Select questions from the bank, validate blueprint alignment, arrange questions, and submit for administrative review."
        breadcrumb="Exam Authoring"
        action={
          <div className="flex items-center space-x-2">
            {!isPaperLocked && (
              <Button
                variant="outline"
                icon={Sparkles}
                loading={generatingAi}
                onClick={handleGenerateAiPaper}
                className="text-amber-300 border-amber-500/40 hover:bg-amber-500/10"
              >
                Generate Paper with AI
              </Button>
            )}
            <Button
              variant="outline"
              icon={Eye}
              onClick={() => setPreviewModalOpen(true)}
              disabled={selectedQuestions.length === 0}
            >
              Preview
            </Button>
            {!isPaperLocked && (
              <>
                <Button variant="secondary" loading={saving} onClick={handleSaveDraft}>
                  Save Draft
                </Button>
                <Button
                  variant="primary"
                  icon={Send}
                  loading={submitting}
                  disabled={!isMarksMatching || selectedQuestions.length === 0}
                  onClick={handleSubmitForApproval}
                >
                  Submit for Approval
                </Button>
              </>
            )}
          </div>
        }
      />

      {/* Select Examination Bar */}
      <div className="surface-card p-4 rounded-xl border border-slate-800 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-full md:w-auto">
          <label className="block text-xs font-semibold text-slate-400 mb-1">Active Examination</label>
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="w-full md:w-96 bg-slate-900/90 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-semibold"
          >
            {exams.map((ex) => (
              <option key={ex._id} value={ex._id}>
                {ex.code} - {ex.name} ({ex.subject})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right text-xs">
            <span className="text-slate-400 block">Total Marks / Requirement:</span>
            <span
              className={`text-base font-bold font-mono ${
                isMarksMatching ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {currentTotalMarks} / {examMaxMarks} marks
            </span>
          </div>
          <Badge status={paperStatus}>{paperStatus}</Badge>
        </div>
      </div>

      {/* Rejection Alert if applicable */}
      {rejectionNotes && paperStatus === 'REJECTED' && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start space-x-3 text-xs">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-rose-300">Admin Rejection Feedback - Revision Required:</p>
            <p className="text-rose-200/90 mt-1 leading-relaxed">{rejectionNotes}</p>
            <p className="text-[11px] text-rose-400/80 mt-2">
              Modify the question selections below, save, and resubmit for approval.
            </p>
          </div>
        </div>
      )}

      {/* Paper Header Inputs */}
      <div className="surface-card p-5 rounded-xl border border-slate-800 mb-6 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Question Paper Title</label>
          <input
            type="text"
            disabled={isPaperLocked}
            value={paperTitle}
            onChange={(e) => setPaperTitle(e.target.value)}
            className="w-full bg-slate-900/90 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-bold"
          />
        </div>
      </div>

      {/* Questions Arrangement Panel */}
      <div className="surface-card rounded-xl border border-slate-800 overflow-hidden mb-8">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-white tracking-tight">
              Selected Questions ({selectedQuestions.length})
            </h4>
            <p className="text-xs text-slate-400">
              Arrange questions in examination sequence and define question-specific notes.
            </p>
          </div>

          {!isPaperLocked && (
            <Button
              variant="outline"
              size="sm"
              icon={Plus}
              onClick={handleOpenPicker}
            >
              Add from Question Bank
            </Button>
          )}
        </div>

        {selectedQuestions.length === 0 ? (
          <EmptyState
            title="No questions added to paper"
            message="Click 'Generate Paper with AI' to automatically generate questions strictly from the syllabus, or pick questions manually from the bank."
            action={
              !isPaperLocked && (
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Button
                    variant="primary"
                    icon={Sparkles}
                    loading={generatingAi}
                    onClick={handleGenerateAiPaper}
                    className="bg-amber-600 hover:bg-amber-500 text-white"
                  >
                    Generate Paper with AI
                  </Button>
                  <Button variant="outline" icon={Plus} onClick={handleOpenPicker}>
                    Pick Questions Manually
                  </Button>
                </div>
              )
            }
          />
        ) : (
          <div className="divide-y divide-slate-800/60">
            {selectedQuestions.map((item, idx) => (
              <div key={idx} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-800/20 transition-colors">
                <div className="flex items-center space-x-3 flex-1">
                  {!isPaperLocked && (
                    <div className="flex flex-col space-y-1">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveQuestion(idx, 'up')}
                        className="text-slate-500 hover:text-white disabled:opacity-20"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === selectedQuestions.length - 1}
                        onClick={() => moveQuestion(idx, 'down')}
                        className="text-slate-500 hover:text-white disabled:opacity-20"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <span className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                    Q{idx + 1}
                  </span>

                  <div className="flex-1">
                    <p className="text-xs font-semibold text-white leading-snug">
                      {item.question?.questionText || 'Question item'}
                    </p>
                    <div className="flex items-center space-x-2 text-[10px] text-slate-400 mt-1 font-mono">
                      {item.question?.subject && (
                        <span className="text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20 font-semibold">
                          {item.question.subject}
                        </span>
                      )}
                      <span>{item.question?.unit}</span>
                      <span>•</span>
                      <span>{item.question?.topic}</span>
                      <span>•</span>
                      <span>Difficulty: {item.question?.difficulty}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <div className="flex items-center space-x-1 text-xs">
                    <span className="text-slate-400">Marks:</span>
                    <input
                      type="number"
                      min="1"
                      disabled={isPaperLocked}
                      value={item.marks}
                      onChange={(e) => {
                        const updated = [...selectedQuestions];
                        updated[idx].marks = Number(e.target.value);
                        setSelectedQuestions(updated);
                      }}
                      className="w-16 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-indigo-400 font-mono font-bold text-center focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {!isPaperLocked && (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={RefreshCw}
                        loading={regeneratingIdx === idx}
                        onClick={() => handleRegenerateQuestionInPaper(idx)}
                        className="text-[10px] text-amber-300 hover:text-amber-200 hover:bg-amber-500/10 p-1.5"
                        title="Regenerate this question with Gemini AI"
                      />
                      <button
                        type="button"
                        onClick={() => removeQuestionFromPaper(idx)}
                        className="text-slate-500 hover:text-rose-400 p-1.5"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Subject-Wise Question Bank Picker Modal */}
      <Modal
        isOpen={pickerModalOpen}
        onClose={() => setPickerModalOpen(false)}
        title="Subject-Wise Question Setting"
        maxWidth="max-w-3xl"
      >
        <div className="space-y-4">
          {/* Step 1: Select Subject */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200">
                1. Select Subject:
              </span>
              <span className="text-[11px] text-indigo-400 font-mono">
                Active Subject: <strong>{pickerSubjectFilter || 'All'}</strong>
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {availableSubjects.map((subj) => (
                <button
                  key={subj}
                  type="button"
                  onClick={() => setPickerSubjectFilter(subj)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    pickerSubjectFilter === subj
                      ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 hover:text-white border border-slate-700/40'
                  }`}
                >
                  {subj}
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Select Questions from Chosen Subject */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300">
                2. Select Questions for {pickerSubjectFilter || 'Paper'}:
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {questionBank.filter((q) => !pickerSubjectFilter || q.subject === pickerSubjectFilter).length} questions available
              </span>
            </div>

            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
              {questionBank
                .filter((q) => !pickerSubjectFilter || q.subject === pickerSubjectFilter)
                .map((q) => {
                  const isAlreadyAdded = selectedQuestions.some((item) => item.questionId === q._id);

                  return (
                    <div
                      key={q._id}
                      className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3 text-xs hover:border-slate-700 transition-colors"
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center space-x-2">
                          <Badge status={q.difficulty}>{q.difficulty}</Badge>
                          <span className="text-indigo-400 font-mono font-semibold">{q.subject}</span>
                          <span className="text-slate-500">•</span>
                          <span className="text-slate-400 font-mono">{q.unit}</span>
                          <span className="font-mono font-bold text-emerald-400">{q.marks} Marks</span>
                        </div>
                        <p className="font-semibold text-white leading-snug">{q.questionText}</p>
                      </div>

                      <Button
                        size="sm"
                        variant={isAlreadyAdded ? 'secondary' : 'primary'}
                        disabled={isAlreadyAdded}
                        onClick={() => addQuestionToPaper(q)}
                      >
                        {isAlreadyAdded ? 'Added' : 'Select'}
                      </Button>
                    </div>
                  );
                })}

              {questionBank.filter((q) => !pickerSubjectFilter || q.subject === pickerSubjectFilter).length === 0 && (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No questions available in this subject repository yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* Formal Paper Preview Modal */}
      <Modal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        title="Official Question Paper Preview"
        maxWidth="max-w-4xl"
      >
        <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-2 text-xs">
          <div className="text-center pb-4 border-b border-slate-800 space-y-1">
            <h2 className="text-lg font-bold text-white uppercase tracking-wider">{paperTitle}</h2>
            <p className="text-slate-400">Course: {selectedExam?.course} (Sem {selectedExam?.semester}) | Subject: {selectedExam?.subject}</p>
            <div className="flex justify-center space-x-6 text-[11px] font-mono text-slate-300 pt-1">
              <span>Time Allowed: {selectedExam?.durationMinutes} Minutes</span>
              <span>•</span>
              <span>Maximum Marks: {examMaxMarks}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <p className="font-bold text-slate-300 uppercase tracking-wider mb-1 text-[11px]">General Instructions:</p>
            <ol className="list-decimal list-inside text-slate-400 space-y-0.5">
              {instructions.map((ins, i) => (
                <li key={i}>{ins}</li>
              ))}
            </ol>
          </div>

          <div className="space-y-4">
            {selectedQuestions.map((item, i) => (
              <div key={i} className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800 space-y-1.5">
                <div className="flex justify-between items-start">
                  <span className="font-bold text-white text-sm">
                    Q{i + 1}. {item.question?.questionText}
                  </span>
                  <span className="font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 shrink-0 ml-3">
                    [{item.marks}]
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default QuestionPaperBuilder;
