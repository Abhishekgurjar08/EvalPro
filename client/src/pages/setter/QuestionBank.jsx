import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../context/ToastContext';
import {
  HelpCircle,
  Plus,
  Search,
  Filter,
  Eye,
  Trash2,
  Edit3,
  Sparkles,
  ArrowLeft,
  BookOpen,
  FolderOpen,
  Layers,
  ChevronRight,
  BookMarked
} from 'lucide-react';

const QuestionBank = () => {
  // Subject Navigation State
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [loadingSubjects, setLoadingSubjects] = useState(true);

  // Subject Creation Modal
  const [newSubjectModalOpen, setNewSubjectModalOpen] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');

  // Questions State for Selected Subject
  const [questions, setQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [search, setSearch] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [filterType, setFilterType] = useState('');

  // Question Creation & Edit Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [previewQuestion, setPreviewQuestion] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    subject: '',
    unit: 'Unit 1',
    topic: 'General Architecture',
    questionText: '',
    questionType: 'DESCRIPTIVE',
    marks: 10,
    difficulty: 'MEDIUM',
    expectedAnswer: '',
    explanation: '',
    rubricCriteria: [
      { name: 'Introduction & Core Definition', description: 'Accurate technical formulation', maxMarks: 2, keywords: [] },
      { name: 'Key Principles & Architecture', description: 'Thorough conceptual breakdown', maxMarks: 5, keywords: [] },
      { name: 'Practical Examples / Conclusion', description: 'Real-world protocol mapping', maxMarks: 3, keywords: [] }
    ]
  });

  const { showToast } = useToast();

  // Load distinct subjects on mount
  useEffect(() => {
    fetchSubjects();
  }, []);

  // Whenever selectedSubject changes, load questions for that subject
  useEffect(() => {
    if (selectedSubject) {
      fetchQuestionsForSubject(selectedSubject);
    }
  }, [selectedSubject, filterDifficulty, filterType]);

  const fetchSubjects = async () => {
    try {
      setLoadingSubjects(true);
      const res = await api.get('/questions/subjects');
      if (res.data.success) {
        setSubjects(res.data.subjects || []);
      }
    } catch (err) {
      showToast('Failed to load subjects', 'error');
    } finally {
      setLoadingSubjects(false);
    }
  };

  const fetchQuestionsForSubject = async (subjectName) => {
    try {
      setLoadingQuestions(true);
      const params = {
        subject: subjectName,
        exact: 'true'
      };
      if (filterDifficulty) params.difficulty = filterDifficulty;
      if (filterType) params.questionType = filterType;
      if (search) params.search = search;

      const res = await api.get('/questions', { params });
      if (res.data.success) {
        setQuestions(res.data.questions || []);
      }
    } catch (err) {
      showToast(`Failed to load questions for ${subjectName}`, 'error');
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleSelectSubject = (subjectName) => {
    setSelectedSubject(subjectName);
    setSearch('');
    setFilterDifficulty('');
    setFilterType('');
  };

  const handleBackToSubjects = () => {
    setSelectedSubject(null);
    setQuestions([]);
    fetchSubjects(); // Refresh counts
  };

  const handleCreateNewSubject = (e) => {
    e.preventDefault();
    const trimmed = newSubjectName.trim();
    if (!trimmed) {
      showToast('Please enter a valid subject name', 'warning');
      return;
    }

    // Check if subject already exists
    const exists = subjects.some((s) => s.name.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      showToast('This subject already exists in the Question Bank.', 'info');
      handleSelectSubject(trimmed);
      setNewSubjectModalOpen(false);
      setNewSubjectName('');
      return;
    }

    // Add locally to subjects and navigate to it
    setSubjects((prev) => [...prev, { name: trimmed, questionCount: 0 }].sort((a, b) => a.name.localeCompare(b.name)));
    setSelectedSubject(trimmed);
    setNewSubjectModalOpen(false);
    setNewSubjectName('');
    showToast(`Subject collection "${trimmed}" opened! Author questions below.`, 'success');
  };

  // Open Create Question Modal (Subject automatically pre-filled and locked to selectedSubject)
  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      subject: selectedSubject || 'General',
      unit: 'Unit 1',
      topic: 'General Architecture',
      questionText: '',
      questionType: 'DESCRIPTIVE',
      marks: 10,
      difficulty: 'MEDIUM',
      expectedAnswer: '',
      explanation: '',
      rubricCriteria: [
        { name: 'Introduction & Core Definition', description: 'Accurate technical formulation', maxMarks: 2, keywords: [] },
        { name: 'Key Principles & Architecture', description: 'Thorough conceptual breakdown', maxMarks: 5, keywords: [] },
        { name: 'Practical Examples / Conclusion', description: 'Real-world protocol mapping', maxMarks: 3, keywords: [] }
      ]
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (q) => {
    setEditingId(q._id);
    setFormData({
      subject: q.subject || selectedSubject,
      unit: q.unit || 'Unit 1',
      topic: q.topic || 'General',
      questionText: q.questionText || '',
      questionType: q.questionType || 'DESCRIPTIVE',
      marks: q.marks || 10,
      difficulty: q.difficulty || 'MEDIUM',
      expectedAnswer: q.expectedAnswer || '',
      explanation: q.explanation || '',
      rubricCriteria: q.rubric?.criteria || [
        { name: 'Core Understanding', description: '', maxMarks: q.marks, keywords: [] }
      ]
    });
    setModalOpen(true);
  };

  const handleDeleteQuestion = async (qId) => {
    if (!window.confirm('Are you sure you want to delete this question from the bank?')) return;
    try {
      const res = await api.delete(`/questions/${qId}`);
      if (res.data.success) {
        showToast('Question deleted successfully', 'success');
        fetchQuestionsForSubject(selectedSubject);
        fetchSubjects();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete question', 'error');
    }
  };

  // Rubric Criterion Handlers
  const addRubricCriterion = () => {
    setFormData({
      ...formData,
      rubricCriteria: [
        ...formData.rubricCriteria,
        { name: 'New Criterion', description: '', maxMarks: 1, keywords: [] }
      ]
    });
  };

  const removeRubricCriterion = (idx) => {
    setFormData({
      ...formData,
      rubricCriteria: formData.rubricCriteria.filter((_, i) => i !== idx)
    });
  };

  const updateRubricCriterion = (idx, field, val) => {
    const updated = [...formData.rubricCriteria];
    if (field === 'keywords') {
      updated[idx].keywords = val.split(',').map((k) => k.trim()).filter((k) => k.length > 0);
    } else {
      updated[idx][field] = field === 'maxMarks' ? Number(val) : val;
    }
    setFormData({ ...formData, rubricCriteria: updated });
  };

  const rubricSum = formData.rubricCriteria.reduce((sum, c) => sum + (Number(c.maxMarks) || 0), 0);
  const isRubricValid = rubricSum <= Number(formData.marks);

  const handleSubmitQuestion = async (e) => {
    e.preventDefault();

    if (!isRubricValid) {
      showToast(
        `Rubric criteria total (${rubricSum}) cannot exceed question max marks (${formData.marks}).`,
        'error'
      );
      return;
    }

    try {
      const payload = {
        ...formData,
        subject: selectedSubject // Automatically associate selected subject
      };

      if (editingId) {
        const res = await api.put(`/questions/${editingId}`, payload);
        if (res.data.success) {
          showToast('Question updated successfully!', 'success');
          setModalOpen(false);
          fetchQuestionsForSubject(selectedSubject);
          fetchSubjects();
        }
      } else {
        const res = await api.post('/questions', payload);
        if (res.data.success) {
          showToast(`Question saved to ${selectedSubject} question bank!`, 'success');
          setModalOpen(false);
          fetchQuestionsForSubject(selectedSubject);
          fetchSubjects();
        }
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error saving question', 'error');
    }
  };

  // ==========================================
  // RENDER: SUBJECTS OVERVIEW VIEW (Step 2)
  // ==========================================
  if (!selectedSubject) {
    return (
      <div>
        <PageHeader
          title="Subject-Wise Question Bank"
          subtitle="Select an academic subject to view, curate, and author questions within its dedicated repository."
          breadcrumb="Question Repository"
          action={
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => setNewSubjectModalOpen(true)}
            >
              Add Subject Bank
            </Button>
          }
        />

        {loadingSubjects ? (
          <LoadingSpinner fullPage text="Retrieving subject question banks..." />
        ) : subjects.length === 0 ? (
          <EmptyState
            title="No Subjects Found"
            message="No subject question banks exist in the repository yet. Create your first subject to start adding questions."
            icon={BookOpen}
            action={
              <Button
                variant="primary"
                icon={Plus}
                onClick={() => setNewSubjectModalOpen(true)}
              >
                Add First Subject
              </Button>
            }
          />
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {subjects.map((subj) => (
                <div
                  key={subj.name}
                  onClick={() => handleSelectSubject(subj.name)}
                  className="bg-white p-6 rounded-2xl border border-slate-200/80 hover:border-indigo-500/40 hover:shadow-md transition-all duration-200 cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 group-hover:scale-105 transition-transform">
                        <BookMarked className="w-5 h-5" />
                      </div>
                      <span className="font-mono text-xs px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-semibold">
                        {subj.questionCount} {subj.questionCount === 1 ? 'Question' : 'Questions'}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors tracking-tight">
                      {subj.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Questions and rubric criteria organized specifically for {subj.name}.
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-600 group-hover:text-indigo-700">
                    <span>Manage Questions</span>
                    <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal: Add New Subject Bank */}
        <Modal
          isOpen={newSubjectModalOpen}
          onClose={() => setNewSubjectModalOpen(false)}
          title="Create New Subject Question Bank"
          maxWidth="max-w-md"
        >
          <form onSubmit={handleCreateNewSubject} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Subject Name *
              </label>
              <input
                type="text"
                required
                autoFocus
                placeholder="e.g. Operating System, Compiler Design..."
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/20"
              />
            </div>

            <div className="flex justify-end space-x-2.5 pt-3 border-t border-slate-200">
              <Button
                variant="ghost"
                onClick={() => setNewSubjectModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Open Subject Bank
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    );
  }

  // ==========================================
  // RENDER: SUBJECT-SPECIFIC QUESTIONS VIEW (Step 3 & 4)
  // ==========================================
  return (
    <div>
      {/* Subject Navigation Bar */}
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={handleBackToSubjects}
          className="inline-flex items-center space-x-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-100 shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Subjects</span>
        </button>

        <span className="text-xs text-slate-500">
          Viewing: <strong className="text-slate-900 font-semibold">{selectedSubject}</strong> ({questions.length} questions)
        </span>
      </div>

      <PageHeader
        title={`${selectedSubject} — Question Bank`}
        subtitle={`Author and manage questions belonging strictly to ${selectedSubject}. New questions are automatically associated with this subject.`}
        breadcrumb={`Question Bank / ${selectedSubject}`}
        action={
          <Button variant="primary" icon={Plus} onClick={handleOpenCreate}>
            Author Question for {selectedSubject}
          </Button>
        }
      />

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            placeholder={`Search ${selectedSubject} questions...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchQuestionsForSubject(selectedSubject)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/20"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <select
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/20"
          >
            <option value="">All Difficulties</option>
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/20"
          >
            <option value="">All Types</option>
            <option value="DESCRIPTIVE">Descriptive</option>
            <option value="LONG_ANSWER">Long Answer</option>
            <option value="SHORT_ANSWER">Short Answer</option>
            <option value="MCQ">MCQ</option>
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchQuestionsForSubject(selectedSubject)}
          >
            Filter
          </Button>
        </div>
      </div>

      {/* Questions Listing */}
      {loadingQuestions ? (
        <LoadingSpinner fullPage text={`Retrieving ${selectedSubject} questions...`} />
      ) : questions.length === 0 ? (
        <EmptyState
          title={`No questions for ${selectedSubject}`}
          message={`This subject collection has no questions recorded yet. Author your first question for ${selectedSubject} below.`}
          icon={HelpCircle}
          action={
            <Button variant="primary" icon={Plus} onClick={handleOpenCreate}>
              Create Question for {selectedSubject}
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {questions.map((q) => (
            <div
              key={q._id}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row justify-between gap-4 hover:border-slate-300 transition-all"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center space-x-2.5">
                  <Badge status={q.difficulty}>{q.difficulty}</Badge>
                  <span className="text-[11px] font-mono text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200 font-semibold">
                    {q.subject}
                  </span>
                  <span className="text-[11px] font-mono text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200 font-medium">
                    {q.unit} • {q.topic}
                  </span>
                  <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    {q.marks} Marks
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-900 tracking-tight leading-snug">
                  {q.questionText}
                </h4>

                {q.rubric?.criteria && (
                  <div className="flex items-center space-x-2 text-xs text-slate-500">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>
                      Marking Rubric: <strong className="text-slate-800">{q.rubric.criteria.length} criteria defined</strong>
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2 shrink-0 self-start md:self-center">
                <Button size="sm" variant="outline" icon={Eye} onClick={() => setPreviewQuestion(q)}>
                  Preview Rubric
                </Button>
                <Button size="sm" variant="secondary" icon={Edit3} onClick={() => handleOpenEdit(q)}>
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                  icon={Trash2}
                  onClick={() => handleDeleteQuestion(q._id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Author Question & Marking Rubric Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          editingId
            ? `Edit Question — ${selectedSubject}`
            : `Author New Question — ${selectedSubject}`
        }
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleSubmitQuestion} className="space-y-5 max-h-[75vh] overflow-y-auto pr-2">
          {/* Automatic Subject Association Indicator */}
          <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BookMarked className="w-4 h-4 text-indigo-600" />
              <span className="text-xs text-slate-700">
                Subject Association: <strong className="text-indigo-700 font-bold">{selectedSubject}</strong>
              </span>
            </div>
            <span className="text-[10px] text-indigo-700 font-mono font-semibold bg-indigo-100 px-2 py-0.5 rounded-md">
              Auto-Associated
            </span>
          </div>

          {/* Metadata row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Unit</label>
              <input
                type="text"
                required
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder="Unit 1"
                className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/20"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Marks</label>
              <input
                type="number"
                min="1"
                required
                value={formData.marks}
                onChange={(e) => setFormData({ ...formData, marks: Number(e.target.value) })}
                className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-indigo-600 font-bold focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/20 font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Difficulty</label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/20"
              >
                <option value="EASY">EASY</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HARD">HARD</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Topic</label>
            <input
              type="text"
              required
              value={formData.topic}
              onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
              placeholder="e.g. Memory Management / CPU Scheduling"
              className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/20"
            />
          </div>

          {/* Question Text */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Question Text *</label>
            <textarea
              required
              rows="2"
              value={formData.questionText}
              onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
              placeholder="State the question clearly..."
              className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/20"
            />
          </div>

          {/* Reference / Expected Answer */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
              <span>Expected Reference Answer (Critical for Evaluator & AI Benchmarking) *</span>
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            </label>
            <textarea
              required
              rows="4"
              value={formData.expectedAnswer}
              onChange={(e) => setFormData({ ...formData, expectedAnswer: e.target.value })}
              placeholder="Provide the complete canonical solution, keywords, equations, or structural points expected in an ideal answer..."
              className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/20 font-mono leading-relaxed"
            />
          </div>

          {/* MARKING RUBRIC BUILDER */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Question-Specific Marking Rubric</span>
                </h5>
                <p className="text-[11px] text-slate-500">
                  Define discrete criteria and weights. Criteria sum must not exceed question max marks.
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-500 block uppercase font-semibold">Rubric Total:</span>
                <span
                  className={`text-sm font-bold font-mono ${
                    isRubricValid ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {rubricSum} / {formData.marks} Marks
                </span>
              </div>
            </div>

            {/* Criteria Rows */}
            <div className="space-y-3 pt-2">
              {formData.rubricCriteria.map((crit, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2 shadow-xs">
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="Criterion Name (e.g. Core Principle Explanation)"
                      value={crit.name}
                      onChange={(e) => updateRubricCriterion(idx, 'name', e.target.value)}
                      className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-900 font-semibold focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/20"
                    />
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-slate-500 font-medium">Max:</span>
                      <input
                        type="number"
                        min="0.5"
                        step="0.5"
                        value={crit.maxMarks}
                        onChange={(e) => updateRubricCriterion(idx, 'maxMarks', e.target.value)}
                        className="w-16 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-indigo-600 font-bold focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/20 font-mono"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeRubricCriterion(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <input
                    type="text"
                    placeholder="Description / Expectation for full credit..."
                    value={crit.description}
                    onChange={(e) => updateRubricCriterion(idx, 'description', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/20"
                  />

                  <input
                    type="text"
                    placeholder="Reference Keywords (comma-separated, e.g. semaphore, mutex, deadlock)"
                    value={(crit.keywords || []).join(', ')}
                    onChange={(e) => updateRubricCriterion(idx, 'keywords', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] text-slate-600 font-mono placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/20"
                  />
                </div>
              ))}
            </div>

            <Button size="sm" variant="outline" icon={Plus} onClick={addRubricCriterion}>
              Add Rubric Criterion
            </Button>
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={!isRubricValid}>
              {editingId ? 'Save Changes' : `Save Question to ${selectedSubject}`}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Preview Rubric Modal */}
      <Modal
        isOpen={!!previewQuestion}
        onClose={() => setPreviewQuestion(null)}
        title="Question & Rubric Specification"
        maxWidth="max-w-2xl"
      >
        {previewQuestion && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
              <div>
                <span className="font-bold text-slate-900 text-sm block mb-0.5">{previewQuestion.questionText}</span>
                <span className="text-slate-500">
                  <strong className="text-indigo-600 font-semibold">{previewQuestion.subject}</strong> • {previewQuestion.unit} • {previewQuestion.topic}
                </span>
              </div>
              <Badge status={previewQuestion.difficulty}>{previewQuestion.marks} Marks</Badge>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200">
              <strong className="text-slate-700 block mb-1">Expected Reference Solution:</strong>
              <p className="text-slate-600 leading-relaxed font-mono">{previewQuestion.expectedAnswer}</p>
            </div>

            <div>
              <h5 className="font-bold text-slate-900 uppercase tracking-wider mb-2">
                Marking Rubric Criteria ({previewQuestion.rubric?.criteria?.length || 0})
              </h5>
              <div className="space-y-2">
                {previewQuestion.rubric?.criteria?.map((crit, i) => (
                  <div key={i} className="p-3 rounded-xl bg-white border border-slate-200 flex justify-between items-start shadow-xs">
                    <div>
                      <p className="font-semibold text-slate-900">{crit.name}</p>
                      <p className="text-slate-500 text-[11px] mt-0.5">{crit.description}</p>
                      {crit.keywords?.length > 0 && (
                        <p className="text-indigo-600 text-[10px] mt-1 font-mono font-medium">
                          Keywords: {crit.keywords.join(', ')}
                        </p>
                      )}
                    </div>
                    <span className="font-mono font-bold text-indigo-600 shrink-0 ml-3">
                      {crit.maxMarks}m
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default QuestionBank;
