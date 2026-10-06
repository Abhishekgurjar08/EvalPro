import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
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
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Send,
  Eye,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Edit3,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Layers,
  HelpCircle
} from 'lucide-react';

const QuestionPaperBuilder = () => {
  const [searchParams] = useSearchParams();
  const examIdParam = searchParams.get('examId');

  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [questionBank, setQuestionBank] = useState([]);
  const [existingPapers, setExistingPapers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Assigned Syllabus Reference State ("Manual Syllabus Dekhke")
  const [assignedSyllabus, setAssignedSyllabus] = useState(null);
  const [syllabusLoading, setSyllabusLoading] = useState(false);
  const [showSyllabusRef, setShowSyllabusRef] = useState(true);

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

  // Custom Question Modal (Manual creation mapped to syllabus)
  const [customQuestionModalOpen, setCustomQuestionModalOpen] = useState(false);
  const [customQText, setCustomQText] = useState('');
  const [customQUnit, setCustomQUnit] = useState('');
  const [customQTopic, setCustomQTopic] = useState('');
  const [customQMarks, setCustomQMarks] = useState(10);
  const [customQDifficulty, setCustomQDifficulty] = useState('MEDIUM');
  const [customQExpectedAnswer, setCustomQExpectedAnswer] = useState('');
  const [savingCustomQ, setSavingCustomQ] = useState(false);

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
        const loadedExams = examsRes.data.examinations || [];
        setExams(loadedExams);
        if (examIdParam && loadedExams.some((e) => e._id === examIdParam)) {
          setSelectedExamId(examIdParam);
        } else if (loadedExams.length > 0) {
          setSelectedExamId(loadedExams[0]._id);
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
      fetchAssignedSyllabusForExam(selectedExamId);
    }
  }, [selectedExamId, existingPapers]);

  const fetchAssignedSyllabusForExam = async (examId) => {
    try {
      setSyllabusLoading(true);
      const res = await api.get(`/syllabus/exam/${examId}`);
      if (res.data.success && res.data.syllabus) {
        setAssignedSyllabus(res.data.syllabus);
      } else {
        const ex = exams.find((e) => e._id === examId);
        if (ex?.assignedSyllabus && typeof ex.assignedSyllabus === 'object') {
          setAssignedSyllabus(ex.assignedSyllabus);
        } else {
          setAssignedSyllabus(null);
        }
      }
    } catch (err) {
      setAssignedSyllabus(null);
    } finally {
      setSyllabusLoading(false);
    }
  };

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

  const handleCreateCustomQuestion = async (e) => {
    e.preventDefault();
    if (!customQText.trim()) {
      showToast('Question text is required', 'error');
      return;
    }
    try {
      setSavingCustomQ(true);
      const chosenUnit = customQUnit || assignedSyllabus?.units?.[0]?.title || 'Unit 1';
      const res = await api.post('/questions', {
        subject: selectedExam?.subject,
        examination: selectedExamId,
        unit: chosenUnit,
        topic: customQTopic.trim() || 'Core Concept',
        questionText: customQText.trim(),
        questionType: 'DESCRIPTIVE',
        difficulty: customQDifficulty,
        marks: Number(customQMarks) || 10,
        expectedAnswer: customQExpectedAnswer.trim()
      });

      if (res.data.success && res.data.question) {
        const newQ = res.data.question;
        setSelectedQuestions([
          ...selectedQuestions,
          {
            questionId: newQ._id,
            question: newQ,
            marks: newQ.marks,
            customInstruction: ''
          }
        ]);
        showToast('Custom question added to paper!', 'success');
        setCustomQuestionModalOpen(false);
        setCustomQText('');
        setCustomQTopic('');
        setCustomQExpectedAnswer('');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error creating custom question', 'error');
    } finally {
      setSavingCustomQ(false);
    }
  };

  const selectedExam = exams.find((e) => e._id === selectedExamId);
  const currentTotalMarks = selectedQuestions.reduce((acc, q) => acc + (Number(q.marks) || 0), 0);
  const examMaxMarks = selectedExam?.maxMarks || 50;
  const isMarksMatching = currentTotalMarks === examMaxMarks;
  const isPaperLocked = false;

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
            <Button
              variant="ai"
              icon={Sparkles}
              loading={generatingAi}
              onClick={handleGenerateAiPaper}
            >
              Generate Paper with AI
            </Button>
            <Button
              variant="outline"
              icon={Eye}
              onClick={() => setPreviewModalOpen(true)}
              disabled={selectedQuestions.length === 0}
            >
              Preview
            </Button>
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
          </div>
        }
      />

      {/* Select Examination Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-full md:w-auto">
          <label className="block text-xs font-semibold text-slate-700 mb-1">Active Examination</label>
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="w-full md:w-96 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/20 font-semibold"
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
            <span className="text-slate-500 block font-medium">Total Marks / Requirement:</span>
            <span
              className={`text-base font-bold font-mono ${
                isMarksMatching ? 'text-emerald-600' : 'text-amber-700'
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
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start space-x-3 text-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-rose-800">Admin Rejection Feedback - Revision Required:</p>
            <p className="text-rose-700 mt-1 leading-relaxed">{rejectionNotes}</p>
            <p className="text-[11px] text-rose-600 mt-2">
              Modify the question selections below, save, and resubmit for approval.
            </p>
          </div>
        </div>
      )}

      {/* ASSIGNED SYLLABUS REFERENCE PANEL */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="text-sm font-bold text-slate-900 tracking-tight">
                  Assigned Syllabus Reference
                </h4>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Admin Assigned
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Reference the official course syllabus below to assemble your question paper manually ("Syllabus Dekhke").
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <Link to={`/setter/syllabus/${selectedExamId}`}>
              <Button variant="outline" size="sm" icon={Layers} className="text-xs">
                View Scheme / Blueprint
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSyllabusRef(!showSyllabusRef)}
            >
              {showSyllabusRef ? 'Hide Syllabus' : 'View Syllabus'}
            </Button>
          </div>
        </div>

        {showSyllabusRef && (
          <>
            {syllabusLoading ? (
              <div className="py-4 text-center text-xs text-slate-500">
                Loading assigned syllabus...
              </div>
            ) : !assignedSyllabus || !assignedSyllabus.units || assignedSyllabus.units.length === 0 ? (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center space-x-3">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>No official syllabus assigned by Admin yet for this examination.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {assignedSyllabus.units.map((unit, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 space-y-2 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                        Unit {unit.unitNumber || idx + 1}
                      </span>
                      {!isPaperLocked && (
                        <button
                          type="button"
                          onClick={() => {
                            setCustomQUnit(unit.title);
                            setCustomQuestionModalOpen(true);
                          }}
                          className="text-[10px] text-indigo-600 hover:text-indigo-700 font-semibold"
                        >
                          + Write Q
                        </button>
                      )}
                    </div>

                    <h5 className="font-bold text-xs text-slate-900 line-clamp-1">
                      {unit.title}
                    </h5>

                    {unit.description && (
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                        {unit.description}
                      </p>
                    )}

                    {Array.isArray(unit.topics) && unit.topics.length > 0 && (
                      <div className="pt-1 flex flex-wrap gap-1">
                        {unit.topics.slice(0, 3).map((t, tIdx) => (
                          <span
                            key={tIdx}
                            className="text-[9px] px-1.5 py-0.5 rounded bg-white text-slate-700 font-mono border border-slate-200"
                          >
                            {typeof t === 'string' ? t : t.title}
                          </span>
                        ))}
                        {unit.topics.length > 3 && (
                          <span className="text-[9px] px-1 py-0.5 text-slate-400">
                            +{unit.topics.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Paper Header Inputs */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm mb-6 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Question Paper Title</label>
          <input
            type="text"
            disabled={isPaperLocked}
            value={paperTitle}
            onChange={(e) => setPaperTitle(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/20 font-bold"
          />
        </div>
      </div>

      {/* Questions Arrangement Panel */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden mb-8">
        <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-900 tracking-tight">
              Selected Questions ({selectedQuestions.length})
            </h4>
            <p className="text-xs text-slate-500">
              Arrange questions in examination sequence and define question-specific notes.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              icon={Plus}
              onClick={() => {
                setCustomQUnit(assignedSyllabus?.units?.[0]?.title || 'Unit 1');
                setCustomQuestionModalOpen(true);
              }}
            >
              Write Custom Question
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={handleOpenPicker}
            >
              Add from Question Bank
            </Button>
          </div>
        </div>

        {selectedQuestions.length === 0 ? (
          <EmptyState
            title="No questions added to paper"
            message="Reference the assigned syllabus above and assemble your paper by generating with AI, writing custom questions, or picking from the bank."
            action={
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button
                  variant="ai"
                  icon={Sparkles}
                  loading={generatingAi}
                  onClick={handleGenerateAiPaper}
                >
                  Generate Paper with AI
                </Button>
                <Button
                  variant="outline"
                  icon={Plus}
                  onClick={() => {
                    setCustomQUnit(assignedSyllabus?.units?.[0]?.title || 'Unit 1');
                    setCustomQuestionModalOpen(true);
                  }}
                >
                  Write Custom Question
                </Button>
                <Button variant="outline" icon={Plus} onClick={handleOpenPicker}>
                  Pick from Question Bank
                </Button>
              </div>
            }
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {selectedQuestions.map((item, idx) => (
              <div key={idx} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors">
                <div className="flex items-center space-x-3 flex-1">
                  <div className="flex flex-col space-y-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveQuestion(idx, 'up')}
                      className="text-slate-400 hover:text-slate-700 disabled:opacity-20 transition-colors"
                      title="Move Question Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === selectedQuestions.length - 1}
                      onClick={() => moveQuestion(idx, 'down')}
                      className="text-slate-400 hover:text-slate-700 disabled:opacity-20 transition-colors"
                      title="Move Question Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 font-mono font-bold text-xs flex items-center justify-center shrink-0 border border-indigo-100">
                    Q{idx + 1}
                  </span>

                  <div className="flex-1">
                    <p className="text-xs font-semibold text-slate-900 leading-snug">
                      {item.question?.questionText || 'Question item'}
                    </p>
                    <div className="flex items-center space-x-2 text-[10px] text-slate-500 mt-1 font-mono">
                      {item.question?.subject && (
                        <span className="text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200 font-semibold">
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
                    <span className="text-slate-500">Marks:</span>
                    <input
                      type="number"
                      min="1"
                      value={item.marks}
                      onChange={(e) => {
                        const updated = [...selectedQuestions];
                        updated[idx].marks = Number(e.target.value);
                        setSelectedQuestions(updated);
                      }}
                      className="w-16 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-indigo-600 font-mono font-bold text-center focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/20"
                    />
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={RefreshCw}
                      loading={regeneratingIdx === idx}
                      onClick={() => handleRegenerateQuestionInPaper(idx)}
                      className="text-[10px] text-amber-700 hover:text-amber-800 hover:bg-amber-50 p-1.5"
                      title="Regenerate this question with Gemini AI"
                    />
                    <button
                      type="button"
                      onClick={() => removeQuestionFromPaper(idx)}
                      className="p-1.5 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                      title="Remove Question"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
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
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-800">
                1. Select Subject:
              </span>
              <span className="text-[11px] text-indigo-600 font-mono">
                Active Subject: <strong>{pickerSubjectFilter || 'All'}</strong>
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {availableSubjects.map((subj) => (
                <button
                  key={subj}
                  type="button"
                  onClick={() => setPickerSubjectFilter(subj)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    pickerSubjectFilter === subj
                      ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
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
              <span className="text-xs font-semibold text-slate-700">
                2. Select Questions for {pickerSubjectFilter || 'Paper'}:
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
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
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs hover:border-slate-300 transition-colors"
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center space-x-2">
                          <Badge status={q.difficulty}>{q.difficulty}</Badge>
                          <span className="text-indigo-600 font-mono font-semibold">{q.subject}</span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-500 font-mono">{q.unit}</span>
                          <span className="font-mono font-bold text-emerald-600">{q.marks} Marks</span>
                        </div>
                        <p className="font-semibold text-slate-900 leading-snug">{q.questionText}</p>
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
                <div className="p-8 text-center text-slate-400 text-xs">
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
          <div className="text-center pb-4 border-b border-slate-200 space-y-1">
            <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider">{paperTitle}</h2>
            <p className="text-slate-500">Course: {selectedExam?.course} (Sem {selectedExam?.semester}) | Subject: {selectedExam?.subject}</p>
            <div className="flex justify-center space-x-6 text-[11px] font-mono text-slate-600 pt-1">
              <span>Time Allowed: {selectedExam?.durationMinutes} Minutes</span>
              <span>•</span>
              <span>Maximum Marks: {examMaxMarks}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <p className="font-bold text-slate-800 uppercase tracking-wider mb-1 text-[11px]">General Instructions:</p>
            <ol className="list-decimal list-inside text-slate-600 space-y-0.5">
              {instructions.map((ins, i) => (
                <li key={i}>{ins}</li>
              ))}
            </ol>
          </div>

          <div className="space-y-4">
            {selectedQuestions.map((item, i) => (
              <div key={i} className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200 space-y-1.5">
                <div className="flex justify-between items-start">
                  <span className="font-bold text-slate-900 text-sm">
                    Q{i + 1}. {item.question?.questionText}
                  </span>
                  <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 shrink-0 ml-3">
                    [{item.marks}]
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* Write Custom Question Modal ("Manual Creation Mapped to Syllabus") */}
      <Modal
        isOpen={customQuestionModalOpen}
        onClose={() => setCustomQuestionModalOpen(false)}
        title="Write Custom Question (Mapped to Syllabus)"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreateCustomQuestion} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Syllabus Unit *</label>
              <select
                value={customQUnit}
                onChange={(e) => setCustomQUnit(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/20 font-semibold"
              >
                {assignedSyllabus?.units && assignedSyllabus.units.length > 0 ? (
                  assignedSyllabus.units.map((u, i) => (
                    <option key={i} value={u.title}>
                      Unit {u.unitNumber || i + 1}: {u.title}
                    </option>
                  ))
                ) : (
                  <option value="Unit 1">Unit 1: Core Principles</option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Topic / Concept</label>
              <input
                type="text"
                value={customQTopic}
                onChange={(e) => setCustomQTopic(e.target.value)}
                placeholder="e.g. Process Scheduling & IPC"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Marks *</label>
              <input
                type="number"
                min="1"
                max={examMaxMarks}
                value={customQMarks}
                onChange={(e) => setCustomQMarks(Number(e.target.value) || 1)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-indigo-600 font-mono font-bold text-xs focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/20"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Difficulty</label>
              <select
                value={customQDifficulty}
                onChange={(e) => setCustomQDifficulty(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/20 font-semibold"
              >
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Question Text *</label>
            <textarea
              required
              rows="4"
              value={customQText}
              onChange={(e) => setCustomQText(e.target.value)}
              placeholder="Enter clear, academically rigorous question text according to the selected syllabus unit..."
              className="w-full bg-white border border-slate-200 rounded-xl p-3 text-slate-900 text-xs focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/20 leading-relaxed font-sans"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Expected Scoring Model Answer (Optional):
            </label>
            <textarea
              rows="3"
              value={customQExpectedAnswer}
              onChange={(e) => setCustomQExpectedAnswer(e.target.value)}
              placeholder="Core points, key terms, or technical steps expected for evaluation..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 text-xs focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/20 font-mono"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200">
            <Button variant="ghost" onClick={() => setCustomQuestionModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={savingCustomQ} icon={Plus}>
              Add to Question Paper
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default QuestionPaperBuilder;
