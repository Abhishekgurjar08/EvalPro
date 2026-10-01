import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useToast } from '../../context/ToastContext';
import {
  Layers,
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  FileText,
  RefreshCw,
  BookOpen,
  Send,
  AlertCircle,
  HelpCircle,
  Cpu
} from 'lucide-react';

const SyllabusManager = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Blueprint state
  const [activeTab, setActiveTab] = useState('syllabus'); // 'syllabus' or 'blueprint'
  const [blueprintUnits, setBlueprintUnits] = useState([]);
  const [difficultyDist, setDifficultyDist] = useState({ easy: 30, medium: 50, hard: 20 });
  const [savingBlueprint, setSavingBlueprint] = useState(false);

  // AI Paper Generation Flow State (Requirements 2, 3, 5, 6, 7)
  const [postSaveModalOpen, setPostSaveModalOpen] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiReviewModalOpen, setAiReviewModalOpen] = useState(false);
  const [aiPaperData, setAiPaperData] = useState(null);
  const [regeneratingIdx, setRegeneratingIdx] = useState(null);
  const [savingAiPaper, setSavingAiPaper] = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
    fetchSyllabusAndExam();
  }, [examId]);

  const fetchSyllabusAndExam = async () => {
    try {
      setLoading(true);
      const [examRes, sylRes, bpRes] = await Promise.all([
        api.get(`/examinations/${examId}`),
        api.get(`/syllabus/exam/${examId}`),
        api.get(`/blueprints/exam/${examId}`)
      ]);

      if (examRes.data.success) {
        setExam(examRes.data.examination);
      }

      if (sylRes.data.success && sylRes.data.syllabus) {
        setUnits(sylRes.data.syllabus.units || []);
      } else {
        // Default template
        setUnits([
          {
            unitNumber: 1,
            title: 'Foundations & Architecture',
            description: 'Core concepts and basic models.',
            topics: [
              { topicNumber: 1, title: 'Introduction and Protocols', description: '' },
              { topicNumber: 2, title: 'Layered Abstraction', description: '' }
            ]
          }
        ]);
      }

      if (bpRes.data.success && bpRes.data.blueprint) {
        setBlueprintUnits(bpRes.data.blueprint.unitDistribution || []);
        if (bpRes.data.blueprint.difficultyDistribution) {
          setDifficultyDist(bpRes.data.blueprint.difficultyDistribution);
        }
      } else {
        // Initialize default blueprint based on units
        setBlueprintUnits([
          { unit: 'Unit 1: Foundations', marks: 25, questionsCount: 2 },
          { unit: 'Unit 2: Core Protocols', marks: 25, questionsCount: 2 }
        ]);
      }
    } catch (err) {
      showToast('Error loading syllabus data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Syllabus Handlers
  const addUnit = () => {
    const nextNum = units.length + 1;
    setUnits([
      ...units,
      {
        unitNumber: nextNum,
        title: `Unit ${nextNum}`,
        description: '',
        topics: [{ topicNumber: 1, title: 'Topic 1', description: '' }]
      }
    ]);
  };

  const removeUnit = (unitIdx) => {
    setUnits(units.filter((_, idx) => idx !== unitIdx));
  };

  const addTopic = (unitIdx) => {
    const unit = units[unitIdx];
    const nextTopicNum = (unit.topics?.length || 0) + 1;
    const updated = [...units];
    updated[unitIdx].topics.push({
      topicNumber: nextTopicNum,
      title: `Topic ${nextTopicNum}`,
      description: ''
    });
    setUnits(updated);
  };

  const removeTopic = (unitIdx, topicIdx) => {
    const updated = [...units];
    updated[unitIdx].topics = updated[unitIdx].topics.filter((_, idx) => idx !== topicIdx);
    setUnits(updated);
  };

  const saveSyllabus = async () => {
    try {
      setSaving(true);
      const res = await api.post('/syllabus', {
        examinationId: examId,
        subject: exam?.subject,
        units
      });

      if (res.data.success) {
        showToast('Syllabus updated successfully!', 'success');
        // Prompt Paper Setter with exactly the two options (Requirements 2 & 3)
        setPostSaveModalOpen(true);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error saving syllabus', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Blueprint Handlers
  const addBlueprintRow = () => {
    setBlueprintUnits([
      ...blueprintUnits,
      { unit: `Unit ${blueprintUnits.length + 1}`, marks: 10, questionsCount: 1 }
    ]);
  };

  const removeBlueprintRow = (idx) => {
    setBlueprintUnits(blueprintUnits.filter((_, i) => i !== idx));
  };

  const updateBlueprintUnit = (idx, field, value) => {
    const updated = [...blueprintUnits];
    updated[idx][field] = field === 'marks' || field === 'questionsCount' ? Number(value) : value;
    setBlueprintUnits(updated);
  };

  const currentBlueprintTotal = blueprintUnits.reduce((acc, curr) => acc + (Number(curr.marks) || 0), 0);
  const examMaxMarks = exam?.maxMarks || 50;
  const isBlueprintValid = currentBlueprintTotal === examMaxMarks;

  const saveBlueprint = async () => {
    if (!isBlueprintValid) {
      showToast(
        `Blueprint sum (${currentBlueprintTotal}) must equal exam max marks (${examMaxMarks}).`,
        'error'
      );
      return;
    }

    try {
      setSavingBlueprint(true);
      const res = await api.post('/blueprints', {
        examinationId: examId,
        unitDistribution: blueprintUnits,
        difficultyDistribution: difficultyDist
      });

      if (res.data.success) {
        showToast('Marks blueprint saved successfully!', 'success');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error saving blueprint', 'error');
    } finally {
      setSavingBlueprint(false);
    }
  };

  // ==============================================================
  // AI PAPER GENERATION ACTIONS (Requirements 2, 3, 4, 5, 6, 7)
  // ==============================================================

  const handleStartAiPaperGeneration = async () => {
    setPostSaveModalOpen(false);
    try {
      setAiGenerating(true);
      const res = await api.post('/ai/generate-paper', {
        examinationId: examId
      });

      if (res.data.success) {
        setAiPaperData(res.data.data);
        setAiReviewModalOpen(true);
        showToast('Question paper generated strictly from syllabus using Gemini AI!', 'success');
      }
    } catch (err) {
      showToast(
        err.response?.data?.message || 'Failed to generate paper with AI. Please check your Gemini configuration.',
        'error'
      );
    } finally {
      setAiGenerating(false);
    }
  };

  // Replace/Regenerate an individual question (Requirement 6)
  const handleRegenerateSingleQuestion = async (idx) => {
    if (!aiPaperData || !aiPaperData.questions[idx]) return;
    const targetQ = aiPaperData.questions[idx];

    try {
      setRegeneratingIdx(idx);
      const existingTexts = aiPaperData.questions.map((q) => q.questionText);

      const res = await api.post('/ai/regenerate-question', {
        subject: exam?.subject,
        unit: targetQ.unit,
        topic: targetQ.topic,
        marks: targetQ.marks,
        difficulty: targetQ.difficulty,
        questionType: targetQ.questionType,
        existingQuestions: existingTexts
      });

      if (res.data.success) {
        const updatedQuestions = [...aiPaperData.questions];
        updatedQuestions[idx] = {
          ...updatedQuestions[idx],
          questionText: res.data.question.questionText,
          expectedAnswer: res.data.question.expectedAnswer,
          difficulty: res.data.question.difficulty || targetQ.difficulty,
          questionType: res.data.question.questionType || targetQ.questionType
        };

        setAiPaperData({
          ...aiPaperData,
          questions: updatedQuestions
        });

        showToast(`Question ${idx + 1} regenerated successfully!`, 'success');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error regenerating question', 'error');
    } finally {
      setRegeneratingIdx(null);
    }
  };

  // Modify question field in AI review
  const updateAiQuestionField = (idx, field, value) => {
    if (!aiPaperData) return;
    const updated = [...aiPaperData.questions];
    updated[idx] = {
      ...updated[idx],
      [field]: field === 'marks' ? Number(value) : value
    };

    setAiPaperData({
      ...aiPaperData,
      questions: updated
    });
  };

  // Delete question in AI review
  const deleteAiQuestion = (idx) => {
    if (!aiPaperData) return;
    const updated = aiPaperData.questions.filter((_, i) => i !== idx);
    setAiPaperData({
      ...aiPaperData,
      questions: updated
    });
  };

  // Add new question in AI review
  const addAiQuestion = () => {
    if (!aiPaperData) return;
    const nextNum = aiPaperData.questions.length + 1;
    const newQ = {
      questionNumber: nextNum,
      questionText: 'Enter new academic question...',
      marks: 10,
      unit: units[0]?.title || 'Unit 1',
      topic: units[0]?.topics?.[0]?.title || 'General',
      difficulty: 'MEDIUM',
      questionType: 'DESCRIPTIVE',
      expectedAnswer: 'Reference model answer and key scoring criteria.'
    };
    setAiPaperData({
      ...aiPaperData,
      questions: [...aiPaperData.questions, newQ]
    });
  };

  // Save the reviewed AI-generated paper (Requirement 6)
  const handleSaveReviewedAiPaper = async () => {
    if (!aiPaperData || !aiPaperData.questions.length) {
      showToast('No questions to save.', 'warning');
      return;
    }

    const currentTotal = aiPaperData.questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0);
    if (currentTotal !== examMaxMarks) {
      showToast(
        `Total marks (${currentTotal}) must match examination maximum marks (${examMaxMarks}) before saving.`,
        'error'
      );
      return;
    }

    try {
      setSavingAiPaper(true);
      const res = await api.post('/ai/save-generated-paper', {
        examinationId: examId,
        paperTitle: aiPaperData.title || `${exam?.name} - Question Paper`,
        instructions: [
          'All questions are compulsory.',
          'Write concise, point-wise, well-structured answers.',
          'Draw neat diagrams and cite examples wherever relevant.'
        ],
        questions: aiPaperData.questions
      });

      if (res.data.success) {
        showToast('Question paper saved successfully as DRAFT!', 'success');
        setAiReviewModalOpen(false);
        navigate(`/setter/question-papers?examId=${examId}`);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save paper', 'error');
    } finally {
      setSavingAiPaper(false);
    }
  };

  const calculatedAiTotal = aiPaperData?.questions?.reduce((sum, q) => sum + (Number(q.marks) || 0), 0) || 0;
  const isAiMarksMatching = calculatedAiTotal === examMaxMarks;

  if (loading) {
    return <LoadingSpinner fullPage text="Loading syllabus & blueprint..." />;
  }

  return (
    <div>
      <div className="mb-4">
        <Link
          to="/setter/examinations"
          className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Assigned Examinations</span>
        </Link>
      </div>

      <PageHeader
        title={`${exam?.name} - Syllabus & Blueprint`}
        subtitle={`Design units and topics for ${exam?.subject} (${exam?.code}) and define blueprint distribution matching ${exam?.maxMarks} marks.`}
        breadcrumb="Academic Syllabus"
        action={
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              icon={Sparkles}
              loading={aiGenerating}
              onClick={handleStartAiPaperGeneration}
              className="text-amber-300 border-amber-500/30 hover:bg-amber-500/10"
            >
              Generate Paper with AI
            </Button>
            {activeTab === 'syllabus' ? (
              <Button variant="primary" icon={Save} loading={saving} onClick={saveSyllabus}>
                Save Syllabus
              </Button>
            ) : (
              <Button
                variant="primary"
                icon={Save}
                loading={savingBlueprint}
                disabled={!isBlueprintValid}
                onClick={saveBlueprint}
              >
                Save Marks Blueprint
              </Button>
            )}
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex border-b border-slate-800 mb-6 space-x-6">
        <button
          onClick={() => setActiveTab('syllabus')}
          className={`pb-3 text-sm font-bold tracking-tight transition-colors border-b-2 flex items-center space-x-2 ${
            activeTab === 'syllabus'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Syllabus Hierarchy (Units & Topics)</span>
        </button>
        <button
          onClick={() => setActiveTab('blueprint')}
          className={`pb-3 text-sm font-bold tracking-tight transition-colors border-b-2 flex items-center space-x-2 ${
            activeTab === 'blueprint'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Marks Blueprint & Weightage</span>
        </button>
      </div>

      {activeTab === 'syllabus' ? (
        /* Syllabus Builder */
        <div className="space-y-6">
          {units.map((unit, uIdx) => (
            <div key={uIdx} className="surface-card p-5 rounded-xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-3 flex-1 mr-4">
                  <span className="font-mono text-xs px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold">
                    Unit {unit.unitNumber || uIdx + 1}
                  </span>
                  <input
                    type="text"
                    value={unit.title}
                    onChange={(e) => {
                      const updated = [...units];
                      updated[uIdx].title = e.target.value;
                      setUnits(updated);
                    }}
                    placeholder="Unit Title..."
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-bold"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeUnit(uIdx)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Unit Description</label>
                <textarea
                  rows="2"
                  value={unit.description}
                  onChange={(e) => {
                    const updated = [...units];
                    updated[uIdx].description = e.target.value;
                    setUnits(updated);
                  }}
                  placeholder="Key concepts and learning objectives for this unit..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Topics */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Topics ({unit.topics?.length || 0})
                  </span>
                  <Button size="sm" variant="ghost" icon={Plus} onClick={() => addTopic(uIdx)}>
                    Add Topic
                  </Button>
                </div>

                {unit.topics?.map((top, tIdx) => (
                  <div key={tIdx} className="flex items-center space-x-2">
                    <span className="text-[10px] text-slate-500 font-mono w-6 text-center">
                      {top.topicNumber || tIdx + 1}.
                    </span>
                    <input
                      type="text"
                      value={top.title}
                      onChange={(e) => {
                        const updated = [...units];
                        updated[uIdx].topics[tIdx].title = e.target.value;
                        setUnits(updated);
                      }}
                      placeholder="Topic Name..."
                      className="flex-1 bg-slate-900/60 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => removeTopic(uIdx, tIdx)}
                      className="text-slate-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <Button variant="outline" icon={Plus} onClick={addUnit} className="w-full py-3">
            Add Another Unit
          </Button>
        </div>
      ) : (
        /* Marks Blueprint Tab */
        <div className="surface-card p-5 rounded-xl border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
            <div>
              <h4 className="text-sm font-bold text-white tracking-tight">Marks Blueprint Validation</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                The total allocated unit marks must match the examination maximum score exactly.
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Blueprint vs Max Marks:</span>
              <span
                className={`text-xl font-bold font-mono ${
                  isBlueprintValid ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {currentBlueprintTotal} / {examMaxMarks} marks
              </span>
            </div>
          </div>

          {/* Unit-wise Distribution Table */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Unit-Wise Distribution
              </span>
              <Button size="sm" variant="outline" icon={Plus} onClick={addBlueprintRow}>
                Add Distribution Row
              </Button>
            </div>

            <div className="space-y-2">
              {blueprintUnits.map((row, idx) => (
                <div
                  key={idx}
                  className="flex items-center space-x-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800"
                >
                  <input
                    type="text"
                    value={row.unit}
                    onChange={(e) => updateBlueprintUnit(idx, 'unit', e.target.value)}
                    placeholder="Unit name..."
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs text-slate-400">Questions:</span>
                    <input
                      type="number"
                      min="1"
                      value={row.questionsCount}
                      onChange={(e) => updateBlueprintUnit(idx, 'questionsCount', e.target.value)}
                      className="w-16 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs text-slate-400">Marks:</span>
                    <input
                      type="number"
                      min="1"
                      value={row.marks}
                      onChange={(e) => updateBlueprintUnit(idx, 'marks', e.target.value)}
                      className="w-20 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-indigo-400 font-bold focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeBlueprintRow(idx)}
                    className="text-slate-500 hover:text-rose-400 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Difficulty Distribution */}
          <div className="pt-4 border-t border-slate-800">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-3">
              Difficulty Distribution (%)
            </span>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] text-emerald-400 font-semibold mb-1">Easy (%)</label>
                <input
                  type="number"
                  value={difficultyDist.easy}
                  onChange={(e) => setDifficultyDist({ ...difficultyDist, easy: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] text-amber-400 font-semibold mb-1">Medium (%)</label>
                <input
                  type="number"
                  value={difficultyDist.medium}
                  onChange={(e) => setDifficultyDist({ ...difficultyDist, medium: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] text-rose-400 font-semibold mb-1">Hard (%)</label>
                <input
                  type="number"
                  value={difficultyDist.hard}
                  onChange={(e) => setDifficultyDist({ ...difficultyDist, hard: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* POST-SAVE OPTIONS MODAL (Requirements 2 & 3)                    */}
      {/* Provide two options: Create Paper Manually OR Generate Paper with AI */}
      {/* ============================================================== */}
      <Modal
        isOpen={postSaveModalOpen}
        onClose={() => setPostSaveModalOpen(false)}
        title="Syllabus Saved Successfully"
        maxWidth="max-w-xl"
      >
        <div className="space-y-5 text-xs">
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center space-x-3 text-emerald-300">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="font-bold text-sm text-emerald-200">Syllabus is saved and ready!</p>
              <p className="text-[11px] text-emerald-300/80">
                Choose how you would like to proceed with the examination question paper authoring:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* OPTION 1: CREATE PAPER MANUALLY */}
            <div
              onClick={() => {
                setPostSaveModalOpen(false);
                navigate(`/setter/question-papers?examId=${examId}`);
              }}
              className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-950/20 transition-all cursor-pointer space-y-2 group"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                <FileText className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-sm text-white group-hover:text-indigo-300">
                Create Paper Manually
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Hand-pick questions from the question bank or author custom questions manually.
              </p>
              <div className="pt-2">
                <span className="text-[11px] font-semibold text-indigo-400 group-hover:underline">
                  Open Paper Builder →
                </span>
              </div>
            </div>

            {/* OPTION 2: GENERATE PAPER WITH AI */}
            <div
              onClick={handleStartAiPaperGeneration}
              className="p-4 rounded-xl bg-slate-900/80 border border-amber-500/40 hover:border-amber-400 hover:bg-amber-950/20 transition-all cursor-pointer space-y-2 group shadow-sm"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Sparkles className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-sm text-white group-hover:text-amber-300 flex items-center space-x-1.5">
                <span>Generate Paper with AI</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono font-normal">
                  Gemini
                </span>
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Automatically generate balanced examination questions strictly aligned with your units and topics.
              </p>
              <div className="pt-2">
                <span className="text-[11px] font-semibold text-amber-400 group-hover:underline">
                  Launch Gemini Generation →
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-800">
            <Button variant="ghost" size="sm" onClick={() => setPostSaveModalOpen(false)}>
              Stay on Syllabus Manager
            </Button>
          </div>
        </div>
      </Modal>

      {/* ============================================================== */}
      {/* AI GENERATED PAPER REVIEW MODAL (Requirements 5, 6, 7)         */}
      {/* Paper Setter must be able to view, edit, delete, regenerate    */}
      {/* individual questions, modify marks, and save final paper.      */}
      {/* ============================================================== */}
      <Modal
        isOpen={aiReviewModalOpen}
        onClose={() => setAiReviewModalOpen(false)}
        title="Gemini AI Question Paper Review & Customization"
        maxWidth="max-w-5xl"
      >
        <div className="space-y-5 text-xs max-h-[78vh] overflow-y-auto pr-2">
          {/* Paper Title & Validation Banner */}
          <div className="surface-card p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1">
                <label className="block text-slate-400 font-semibold mb-1 text-[11px]">Paper Title</label>
                <input
                  type="text"
                  value={aiPaperData?.title || ''}
                  onChange={(e) => setAiPaperData({ ...aiPaperData, title: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="text-right shrink-0">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                  Total Allocated Marks
                </span>
                <span
                  className={`text-lg font-mono font-bold ${
                    isAiMarksMatching ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {calculatedAiTotal} / {examMaxMarks} marks
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-semibold">
                  Subject: {exam?.subject}
                </span>
                <span>•</span>
                <span>Generated Questions: <strong>{aiPaperData?.questions?.length || 0}</strong></span>
              </div>

              <div className="flex items-center space-x-2">
                <Button size="sm" variant="outline" icon={Plus} onClick={addAiQuestion}>
                  Add Question
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  icon={Save}
                  loading={savingAiPaper}
                  disabled={!isAiMarksMatching || !aiPaperData?.questions?.length}
                  onClick={handleSaveReviewedAiPaper}
                >
                  Save & Approve Draft Paper
                </Button>
              </div>
            </div>
          </div>

          {/* Generated Questions List (Full review, edit, delete, regenerate) */}
          <div className="space-y-4">
            {aiPaperData?.questions?.map((q, idx) => {
              const isRegenerating = regeneratingIdx === idx;

              return (
                <div
                  key={idx}
                  className="surface-card p-4 rounded-xl border border-slate-800 space-y-3 relative hover:border-slate-700 transition-colors shadow-sm"
                >
                  {/* Question Header Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
                    <div className="flex items-center space-x-2">
                      <span className="w-6 h-6 rounded-md bg-indigo-500/10 text-indigo-400 font-mono font-bold text-xs flex items-center justify-center border border-indigo-500/20">
                        Q{idx + 1}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {q.unit} • {q.topic}
                      </span>
                      <Badge status={q.difficulty}>{q.difficulty}</Badge>
                    </div>

                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        <span className="text-slate-400 text-[11px]">Marks:</span>
                        <input
                          type="number"
                          min="1"
                          max={examMaxMarks}
                          value={q.marks}
                          onChange={(e) => updateAiQuestionField(idx, 'marks', e.target.value)}
                          className="w-14 bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-xs text-indigo-400 font-mono font-bold text-center focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        icon={RefreshCw}
                        loading={isRegenerating}
                        onClick={() => handleRegenerateSingleQuestion(idx)}
                        className="text-[10px] text-amber-300 border-amber-500/30 hover:bg-amber-500/10 py-1 px-2"
                        title="Regenerate this specific question using Gemini AI strictly for this unit & topic"
                      >
                        Regenerate
                      </Button>

                      <button
                        type="button"
                        onClick={() => deleteAiQuestion(idx)}
                        className="text-slate-500 hover:text-rose-400 p-1 rounded"
                        title="Delete question"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Question Text (Editable) */}
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">
                      Question Text (Editable)
                    </label>
                    <textarea
                      rows="2"
                      value={q.questionText}
                      onChange={(e) => updateAiQuestionField(idx, 'questionText', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 font-medium focus:outline-none focus:border-indigo-500 leading-relaxed"
                    />
                  </div>

                  {/* Expected Reference Answer (Editable) */}
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1 flex items-center space-x-1">
                      <BookOpen className="w-3 h-3 text-indigo-400" />
                      <span>Model Answer & Rubric Points (Used for subsequent AI Evaluation)</span>
                    </label>
                    <textarea
                      rows="2"
                      value={q.expectedAnswer}
                      onChange={(e) => updateAiQuestionField(idx, 'expectedAnswer', e.target.value)}
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-lg p-2 text-xs text-slate-300 font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Metadata Mapping */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">Unit Mapping</label>
                      <input
                        type="text"
                        value={q.unit}
                        onChange={(e) => updateAiQuestionField(idx, 'unit', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-300 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">Topic Mapping</label>
                      <input
                        type="text"
                        value={q.topic}
                        onChange={(e) => updateAiQuestionField(idx, 'topic', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-300 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">Difficulty</label>
                      <select
                        value={q.difficulty}
                        onChange={(e) => updateAiQuestionField(idx, 'difficulty', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-300 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="EASY">EASY</option>
                        <option value="MEDIUM">MEDIUM</option>
                        <option value="HARD">HARD</option>
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Validation and Save */}
          <div className="p-4 surface-card rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-white">
                Paper Setter Approval Notice
              </p>
              <p className="text-[11px] text-slate-400">
                You remain responsible for verifying questions before submitting to the administrator for formal conduct approval.
              </p>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <Button variant="ghost" size="sm" onClick={() => setAiReviewModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                icon={Save}
                loading={savingAiPaper}
                disabled={!isAiMarksMatching || !aiPaperData?.questions?.length}
                onClick={handleSaveReviewedAiPaper}
              >
                Save & Proceed to Submit
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SyllabusManager;
