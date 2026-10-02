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
  Cpu,
  Sliders,
  Check,
  ChevronRight,
  ListChecks,
  Settings,
  HelpCircle as QuestionIcon
} from 'lucide-react';

const QUESTION_PATTERNS = [
  {
    id: 'SIMPLE',
    title: 'Simple Questions',
    badge: 'Single Questions',
    description: 'Each question is a direct standalone problem (e.g. Q1 = 5 marks, Q2 = 5 marks).'
  },
  {
    id: 'SUB_QUESTION',
    title: 'Sub-Questions (A/B)',
    badge: '2 Sub-Parts',
    description: 'Main questions divided into sub-questions (e.g. Q1(A) = 2 marks, Q1(B) = 3 marks).'
  },
  {
    id: 'ABC',
    title: 'A / B / C Pattern',
    badge: '3 Sub-Parts',
    description: 'Each question subdivided into three parts (e.g. Q1(A) = 2m, Q1(B) = 2m, Q1(C) = 1m).'
  },
  {
    id: 'MIXED',
    title: 'Mixed Marks Scheme',
    badge: 'Varied Marks',
    description: 'Custom marks distribution across questions (e.g. Q1 = 2m, Q2 = 5m, Q3 = 10m).'
  }
];

const SyllabusManager = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Workflow Tab: 'syllabus' or 'scheme'
  const [activeTab, setActiveTab] = useState('syllabus');

  // Paper Scheme State
  const [totalQuestions, setTotalQuestions] = useState(5);
  const [totalMarks, setTotalMarks] = useState(50);
  const [questionPattern, setQuestionPattern] = useState('SIMPLE');
  const [numberOfSets, setNumberOfSets] = useState(1);
  const [blueprintUnits, setBlueprintUnits] = useState([]);
  const [questionsConfig, setQuestionsConfig] = useState([]);
  const [difficultyDist, setDifficultyDist] = useState({ easy: 30, medium: 50, hard: 20 });
  const [savingBlueprint, setSavingBlueprint] = useState(false);

  // Post-Save Modals
  const [postSaveModalOpen, setPostSaveModalOpen] = useState(false);
  const [postSchemeModalOpen, setPostSchemeModalOpen] = useState(false);
  const [hasSavedScheme, setHasSavedScheme] = useState(false);

  // AI Paper Generation Flow State
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

      let loadedExam = null;
      if (examRes.data.success) {
        loadedExam = examRes.data.examination;
        setExam(loadedExam);
        setTotalMarks(loadedExam.maxMarks || 50);
      }

      let loadedUnits = [];
      if (sylRes.data.success && sylRes.data.syllabus && Array.isArray(sylRes.data.syllabus.units) && sylRes.data.syllabus.units.length > 0) {
        loadedUnits = sylRes.data.syllabus.units;
        setUnits(loadedUnits);
      } else {
        // Sensible default unit template requiring only Unit Name + Unit Description
        loadedUnits = [
          {
            unitNumber: 1,
            title: 'Object Oriented Programming',
            description: 'Classes, objects, encapsulation, abstraction, inheritance, polymorphism, constructors and method overriding.',
            topics: []
          },
          {
            unitNumber: 2,
            title: 'Design Patterns & Principles',
            description: 'SOLID principles, Factory, Singleton, Observer, and Adapter design patterns in modern architectures.',
            topics: []
          }
        ];
        setUnits(loadedUnits);
      }

      if (bpRes.data.success && bpRes.data.blueprint) {
        const bp = bpRes.data.blueprint;
        setHasSavedScheme(true);
        setBlueprintUnits(bp.unitDistribution || []);
        if (bp.totalQuestions) setTotalQuestions(bp.totalQuestions);
        if (bp.totalMarks) setTotalMarks(bp.totalMarks);
        if (bp.questionPattern) setQuestionPattern(bp.questionPattern);
        if (bp.numberOfSets) setNumberOfSets(bp.numberOfSets);
        if (bp.difficultyDistribution) setDifficultyDist(bp.difficultyDistribution);
        if (bp.questionsConfig && bp.questionsConfig.length > 0) {
          setQuestionsConfig(bp.questionsConfig);
        } else {
          buildQuestionsFromScheme(
            bp.totalQuestions || 5,
            bp.totalMarks || loadedExam?.maxMarks || 50,
            bp.questionPattern || 'SIMPLE',
            bp.unitDistribution || []
          );
        }
      } else {
        // Initialize scheme units from syllabus units
        initSchemeFromSyllabus(loadedUnits, loadedExam?.maxMarks || 50);
      }
    } catch (err) {
      showToast('Error loading syllabus and paper scheme data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const initSchemeFromSyllabus = (sylUnits, maxMarks) => {
    if (!sylUnits || sylUnits.length === 0) return;
    const count = sylUnits.length;
    const baseMarks = Math.floor(maxMarks / count);
    let remMarks = maxMarks % count;

    const initialBpUnits = sylUnits.map((u, idx) => {
      const uTitle = u.title ? (u.title.startsWith('Unit') ? u.title : `Unit ${idx + 1}: ${u.title}`) : `Unit ${idx + 1}`;
      const qMarks = baseMarks + (remMarks > 0 ? 1 : 0);
      if (remMarks > 0) remMarks--;
      const qCount = Math.max(1, Math.round(qMarks / 10)) || 1;
      return {
        unit: uTitle,
        questionsCount: qCount,
        marks: qMarks
      };
    });

    setBlueprintUnits(initialBpUnits);
    const sumQ = initialBpUnits.reduce((s, u) => s + u.questionsCount, 0);
    const sumM = initialBpUnits.reduce((s, u) => s + u.marks, 0);
    setTotalQuestions(sumQ);
    setTotalMarks(sumM);
    buildQuestionsFromScheme(sumQ, sumM, questionPattern, initialBpUnits);
  };

  // Helper to construct questions structure based on pattern and unit distribution
  const buildQuestionsFromScheme = (totalQ, totalM, pattern, distUnits) => {
    const qCount = Math.max(1, Number(totalQ) || 1);
    const totalMarkVal = Number(totalM) || 50;

    const baseMark = Math.floor(totalMarkVal / qCount);
    let remainder = totalMarkVal % qCount;

    const newQuestions = [];
    const flattenedUnitNames = (distUnits || []).map((u) => u.unit);

    for (let i = 1; i <= qCount; i++) {
      let qMarks = baseMark + (remainder > 0 ? 1 : 0);
      if (remainder > 0) remainder--;

      if (pattern === 'MIXED') {
        // Mixed marks: vary mark weights (e.g. 2, 5, 10)
        if (i % 3 === 1) qMarks = Math.max(2, Math.round(baseMark * 0.6));
        else if (i % 3 === 2) qMarks = Math.max(5, baseMark);
        else qMarks = Math.max(10, Math.round(baseMark * 1.4));
      }

      const assignedUnit = flattenedUnitNames[(i - 1) % (flattenedUnitNames.length || 1)] || `Unit ${(i % 5) + 1}`;

      let subQuestions = [];
      if (pattern === 'SUB_QUESTION') {
        const subA = Math.ceil(qMarks / 2);
        const subB = qMarks - subA;
        subQuestions = [
          { subLabel: 'A', marks: subA, description: 'Core conceptual theory' },
          { subLabel: 'B', marks: subB, description: 'Practical application & analysis' }
        ];
      } else if (pattern === 'ABC') {
        const subA = Math.floor(qMarks / 3) || 1;
        const subB = Math.floor(qMarks / 3) || 1;
        const subC = qMarks - subA - subB;
        subQuestions = [
          { subLabel: 'A', marks: subA, description: 'Definition & fundamentals' },
          { subLabel: 'B', marks: subB, description: 'Implementation details' },
          { subLabel: 'C', marks: subC, description: 'Trade-offs & system validation' }
        ];
      }

      newQuestions.push({
        questionNumber: i,
        label: `Q${i}`,
        marks: qMarks,
        unit: assignedUnit,
        subQuestions
      });
    }

    // Normalize mixed marks if sum differs from totalM
    if (pattern === 'MIXED') {
      const curSum = newQuestions.reduce((s, q) => s + q.marks, 0);
      const diff = totalMarkVal - curSum;
      if (diff !== 0 && newQuestions.length > 0) {
        newQuestions[newQuestions.length - 1].marks += diff;
      }
    }

    setQuestionsConfig(newQuestions);
  };

  // ==============================================================
  // SYLLABUS HANDLERS
  // ==============================================================
  const addUnit = () => {
    const nextNum = units.length + 1;
    setUnits([
      ...units,
      {
        unitNumber: nextNum,
        title: `Unit ${nextNum}`,
        description: '',
        topics: []
      }
    ]);
  };

  const removeUnit = (unitIdx) => {
    setUnits(units.filter((_, idx) => idx !== unitIdx));
  };

  const updateUnitField = (idx, field, value) => {
    const updated = [...units];
    updated[idx][field] = value;
    setUnits(updated);
  };

  const saveSyllabus = async () => {
    // Validate that at least one unit exists
    if (!units || units.length === 0) {
      showToast('Please add at least one syllabus unit before saving.', 'error');
      return;
    }

    const invalidUnit = units.find((u) => !u.title || !u.title.trim());
    if (invalidUnit) {
      showToast('Each unit must have a valid Unit Name.', 'error');
      return;
    }

    try {
      setSaving(true);
      const res = await api.post('/syllabus', {
        examinationId: examId,
        subject: exam?.subject || 'Academic Subject',
        units
      });

      if (res.data.success) {
        showToast('Syllabus units saved successfully!', 'success');
        // Synchronize units to Paper Scheme table
        syncSyllabusUnitsToScheme(units);
        // Show next-step modal (Step 4 -> Set Paper Scheme)
        setPostSaveModalOpen(true);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error saving syllabus', 'error');
    } finally {
      setSaving(false);
    }
  };

  const syncSyllabusUnitsToScheme = (currentUnits) => {
    const maxMarks = exam?.maxMarks || 50;
    const count = currentUnits.length;
    const baseMarks = Math.floor(maxMarks / count);
    let remMarks = maxMarks % count;

    const synced = currentUnits.map((u, idx) => {
      const uTitle = u.title ? (u.title.startsWith('Unit') ? u.title : `Unit ${idx + 1}: ${u.title}`) : `Unit ${idx + 1}`;
      const existing = blueprintUnits.find((bp) => bp.unit === uTitle || bp.unit.includes(u.title));
      const m = existing ? existing.marks : baseMarks + (remMarks > 0 ? 1 : 0);
      if (remMarks > 0) remMarks--;
      const q = existing ? existing.questionsCount : Math.max(1, Math.round(m / 10));
      return {
        unit: uTitle,
        questionsCount: q,
        marks: m
      };
    });

    setBlueprintUnits(synced);
    const sumQ = synced.reduce((acc, curr) => acc + (Number(curr.questionsCount) || 0), 0);
    const sumM = synced.reduce((acc, curr) => acc + (Number(curr.marks) || 0), 0);
    setTotalQuestions(sumQ);
    setTotalMarks(sumM);
    buildQuestionsFromScheme(sumQ, sumM, questionPattern, synced);
  };

  // ==============================================================
  // PAPER SCHEME HANDLERS & CALCULATIONS
  // ==============================================================
  const handleUpdateUnitDistribution = (idx, field, value) => {
    const updated = [...blueprintUnits];
    const numVal = Math.max(0, Number(value) || 0);
    updated[idx][field] = field === 'unit' ? value : numVal;
    setBlueprintUnits(updated);

    // Auto-calculate Total Questions and Total Marks
    const autoQuestions = updated.reduce((sum, item) => sum + (Number(item.questionsCount) || 0), 0);
    const autoMarks = updated.reduce((sum, item) => sum + (Number(item.marks) || 0), 0);
    setTotalQuestions(autoQuestions);
    setTotalMarks(autoMarks);

    // Rebuild question cards
    buildQuestionsFromScheme(autoQuestions, autoMarks, questionPattern, updated);
  };

  const handlePatternChange = (newPattern) => {
    setQuestionPattern(newPattern);
    buildQuestionsFromScheme(totalQuestions, totalMarks, newPattern, blueprintUnits);
  };

  const handleUpdateQuestionMarks = (qIdx, value) => {
    const updated = [...questionsConfig];
    const val = Math.max(1, Number(value) || 1);
    updated[qIdx].marks = val;

    // If sub-questions exist, adapt them
    if (updated[qIdx].subQuestions?.length > 0) {
      const subCount = updated[qIdx].subQuestions.length;
      const baseSub = Math.floor(val / subCount);
      let rem = val % subCount;
      updated[qIdx].subQuestions = updated[qIdx].subQuestions.map((sq) => {
        const sM = baseSub + (rem > 0 ? 1 : 0);
        if (rem > 0) rem--;
        return { ...sq, marks: sM };
      });
    }
    setQuestionsConfig(updated);
  };

  const handleUpdateSubQuestionMarks = (qIdx, sqIdx, value) => {
    const updated = [...questionsConfig];
    const val = Math.max(0, Number(value) || 0);
    updated[qIdx].subQuestions[sqIdx].marks = val;
    // Auto-sum to question marks
    const subSum = updated[qIdx].subQuestions.reduce((s, sq) => s + (Number(sq.marks) || 0), 0);
    updated[qIdx].marks = subSum;
    setQuestionsConfig(updated);
  };

  const addBlueprintRow = () => {
    const nextIdx = blueprintUnits.length + 1;
    const updated = [
      ...blueprintUnits,
      { unit: `Unit ${nextIdx}: Supplementary Topics`, questionsCount: 1, marks: 10 }
    ];
    setBlueprintUnits(updated);
    const sumQ = updated.reduce((s, u) => s + u.questionsCount, 0);
    const sumM = updated.reduce((s, u) => s + u.marks, 0);
    setTotalQuestions(sumQ);
    setTotalMarks(sumM);
    buildQuestionsFromScheme(sumQ, sumM, questionPattern, updated);
  };

  const removeBlueprintRow = (idx) => {
    const updated = blueprintUnits.filter((_, i) => i !== idx);
    setBlueprintUnits(updated);
    const sumQ = updated.reduce((s, u) => s + u.questionsCount, 0);
    const sumM = updated.reduce((s, u) => s + u.marks, 0);
    setTotalQuestions(sumQ);
    setTotalMarks(sumM);
    buildQuestionsFromScheme(sumQ, sumM, questionPattern, updated);
  };

  // Validation Computations
  const sumUnitQuestions = blueprintUnits.reduce((sum, item) => sum + (Number(item.questionsCount) || 0), 0);
  const sumUnitMarks = blueprintUnits.reduce((sum, item) => sum + (Number(item.marks) || 0), 0);
  const examMaxMarks = exam?.maxMarks || 50;

  const isQuestionsMatch = sumUnitQuestions === Number(totalQuestions) && totalQuestions > 0;
  const isMarksMatch = sumUnitMarks === Number(totalMarks) && sumUnitMarks === examMaxMarks;
  const sumQuestionMarks = questionsConfig.reduce((sum, q) => sum + (Number(q.marks) || 0), 0);
  const isQuestionMarksMatch = questionsConfig.length === 0 || sumQuestionMarks === Number(totalMarks);
  const isQuestionsListValid =
    questionsConfig.length > 0 &&
    isQuestionMarksMatch &&
    questionsConfig.length === Number(totalQuestions) &&
    questionsConfig.every(
      (q) =>
        q.marks > 0 &&
        (!q.subQuestions?.length ||
          q.subQuestions.reduce((s, sq) => s + (Number(sq.marks) || 0), 0) === Number(q.marks))
    );

  const isSchemeValid = blueprintUnits.length > 0 && isQuestionsMatch && isMarksMatch && isQuestionsListValid;

  const savePaperScheme = async () => {
    if (!isQuestionsMatch) {
      showToast(
        `Sum of unit questions (${sumUnitQuestions}) must equal total questions (${totalQuestions}).`,
        'error'
      );
      return;
    }

    if (!isMarksMatch) {
      showToast(
        `Sum of unit marks (${sumUnitMarks}) must equal exam maximum marks (${examMaxMarks}).`,
        'error'
      );
      return;
    }

    if (!isQuestionMarksMatch) {
      showToast(
        `Sum of question marks (${sumQuestionMarks}) must equal total marks (${totalMarks}).`,
        'error'
      );
      return;
    }

    try {
      setSavingBlueprint(true);
      const res = await api.post('/blueprints', {
        examinationId: examId,
        totalQuestions,
        totalMarks: examMaxMarks,
        questionPattern,
        numberOfSets,
        unitDistribution: blueprintUnits,
        questionsConfig,
        difficultyDistribution: difficultyDist,
        questionTypeDistribution: {
          descriptive: 40,
          longAnswer: 40,
          shortAnswer: 20,
          mcq: 0
        }
      });

      if (res.data.success) {
        setHasSavedScheme(true);
        showToast('Paper Scheme saved successfully!', 'success');
        setPostSchemeModalOpen(true);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error saving paper scheme', 'error');
    } finally {
      setSavingBlueprint(false);
    }
  };

  // ==============================================================
  // AI PAPER GENERATION ACTIONS
  // ==============================================================
  const handleStartAiPaperGeneration = async () => {
    setPostSaveModalOpen(false);
    setPostSchemeModalOpen(false);
    try {
      setAiGenerating(true);
      const res = await api.post('/ai/generate-paper', {
        examinationId: examId,
        targetTotalMarks: totalMarks || exam?.maxMarks,
        targetQuestionCount: totalQuestions
      });

      if (res.data.success) {
        setAiPaperData(res.data.data);
        setAiReviewModalOpen(true);
        showToast('Question paper generated strictly from syllabus & paper scheme!', 'success');
      }
    } catch (err) {
      showToast(
        err.response?.data?.message || 'Failed to generate paper with AI.',
        'error'
      );
    } finally {
      setAiGenerating(false);
    }
  };

  const handleRegenerateSingleQuestion = async (idx) => {
    if (!aiPaperData || !aiPaperData.questions[idx]) return;
    const targetQ = aiPaperData.questions[idx];

    try {
      setRegeneratingIdx(idx);
      const existingTexts = aiPaperData.questions.map((q) => q.questionText);

      const sylUnit = units.find((u) => {
        const uT = (u.title || '').toLowerCase().trim();
        const tU = (targetQ.unit || '').toLowerCase().trim();
        return uT === tU || uT.includes(tU) || tU.includes(uT);
      });

      const res = await api.post('/ai/regenerate-question', {
        subject: exam?.subject,
        unit: targetQ.unit,
        unitDescription: sylUnit?.description || '',
        topic: targetQ.topic,
        marks: targetQ.marks,
        difficulty: targetQ.difficulty,
        questionType: targetQ.questionType,
        questionPattern: questionPattern,
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

  const deleteAiQuestion = (idx) => {
    if (!aiPaperData) return;
    const updated = aiPaperData.questions.filter((_, i) => i !== idx);
    setAiPaperData({
      ...aiPaperData,
      questions: updated
    });
  };

  const addAiQuestion = () => {
    if (!aiPaperData) return;
    const nextNum = aiPaperData.questions.length + 1;
    const newQ = {
      questionNumber: nextNum,
      questionText: 'Enter new academic question...',
      marks: 10,
      unit: units[0]?.title || 'Unit 1',
      topic: 'General Architecture',
      difficulty: 'MEDIUM',
      questionType: 'DESCRIPTIVE',
      expectedAnswer: 'Reference model answer and key scoring criteria.'
    };
    setAiPaperData({
      ...aiPaperData,
      questions: [...aiPaperData.questions, newQ]
    });
  };

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

  if (loading) {
    return <LoadingSpinner fullPage text="Loading syllabus & paper scheme..." />;
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
        title={`${exam?.name || 'Examination'} - Syllabus & Paper Scheme`}
        subtitle={`Author academic syllabus units and define question paper scheme, patterns, and marks distribution for ${exam?.subject} (${exam?.code}).`}
        breadcrumb="Exam Authoring"
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
                disabled={!isSchemeValid}
                onClick={savePaperScheme}
              >
                Save Paper Scheme
              </Button>
            )}
          </div>
        }
      />

      {/* Sequential Flow Tabs */}
      <div className="flex border-b border-slate-800 mb-6 space-x-8">
        <button
          onClick={() => setActiveTab('syllabus')}
          className={`pb-3 text-sm font-bold tracking-tight transition-colors border-b-2 flex items-center space-x-2.5 ${
            activeTab === 'syllabus'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>1. Set Syllabus</span>
          <Badge status={units.length > 0 ? 'INFO' : 'PENDING'}>{units.length} Units</Badge>
        </button>

        <button
          onClick={() => {
            syncSyllabusUnitsToScheme(units);
            setActiveTab('scheme');
          }}
          className={`pb-3 text-sm font-bold tracking-tight transition-colors border-b-2 flex items-center space-x-2.5 ${
            activeTab === 'scheme'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>2. Set Paper Scheme</span>
          <Badge status={isSchemeValid ? 'SUCCESS' : 'WARNING'}>
            {isSchemeValid ? 'Scheme Valid' : 'Config Required'}
          </Badge>
        </button>
      </div>

      {activeTab === 'syllabus' ? (
        /* ============================================================== */
        /* 1. SYLLABUS BUILDER                                            */
        /* For every unit, only require: Unit Name & Unit Description     */
        /* ============================================================== */
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <p className="font-semibold text-slate-200">Define Syllabus Units</p>
              <p className="text-slate-400 mt-0.5">
                Enter the unit name and detailed description for each module. Individual questions are not required.
              </p>
            </div>
            <div className="flex items-center space-x-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                icon={Sliders}
                onClick={() => {
                  syncSyllabusUnitsToScheme(units);
                  setActiveTab('scheme');
                }}
              >
                Go to Paper Scheme →
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {units.map((unit, uIdx) => (
              <div key={uIdx} className="surface-card p-5 rounded-xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center space-x-3 flex-1 mr-4">
                    <span className="font-mono text-xs px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold">
                      Unit {unit.unitNumber || uIdx + 1}
                    </span>
                    <div className="flex-1">
                      <input
                        type="text"
                        value={unit.title}
                        onChange={(e) => updateUnitField(uIdx, 'title', e.target.value)}
                        placeholder="Unit Name (e.g. Object Oriented Programming)..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-bold"
                      />
                    </div>
                  </div>
                  {units.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeUnit(uIdx)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Remove Unit"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Unit Description <span className="text-indigo-400">*</span>
                  </label>
                  <textarea
                    rows="3"
                    value={unit.description}
                    onChange={(e) => updateUnitField(uIdx, 'description', e.target.value)}
                    placeholder="Describe classes, objects, encapsulation, abstraction, inheritance, polymorphism, and key concepts..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 leading-relaxed"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button variant="outline" icon={Plus} onClick={addUnit}>
              Add Another Unit
            </Button>
            <Button variant="primary" icon={Save} loading={saving} onClick={saveSyllabus}>
              {hasSavedScheme ? 'Save Syllabus Units' : 'Save Syllabus & Proceed to Scheme'}
            </Button>
          </div>
        </div>
      ) : (
        /* ============================================================== */
        /* 2. SET PAPER SCHEME TAB                                        */
        /* Total questions, marks, patterns, unit distribution, sets     */
        /* ============================================================== */
        <div className="space-y-6">
          {/* Scheme Overview & Automatic Calculations Header */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="surface-card p-4 rounded-xl border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Total Questions
              </span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-2xl font-bold font-mono text-white">{totalQuestions}</span>
                <span className="text-xs text-slate-400">Questions</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Auto-sum from units: {sumUnitQuestions}</p>
            </div>

            <div className="surface-card p-4 rounded-xl border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Total Marks
              </span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span
                  className={`text-2xl font-bold font-mono ${
                    sumUnitMarks === examMaxMarks ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {sumUnitMarks}
                </span>
                <span className="text-xs text-slate-400">/ {examMaxMarks} marks</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                {sumUnitMarks === examMaxMarks ? 'Matches exam max marks' : 'Must match exam max marks'}
              </p>
            </div>

            <div className="surface-card p-4 rounded-xl border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Question Pattern
              </span>
              <div className="flex items-center space-x-1.5 mt-1">
                <span className="text-sm font-bold text-indigo-400">
                  {QUESTION_PATTERNS.find((p) => p.id === questionPattern)?.title || questionPattern}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Configurable sub-parts</p>
            </div>

            <div className="surface-card p-4 rounded-xl border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Validation Status
              </span>
              <div className="mt-1.5">
                <Badge status={isSchemeValid ? 'SUCCESS' : 'WARNING'}>
                  {isSchemeValid ? 'Scheme Fully Valid' : 'Action Required'}
                </Badge>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                {isSchemeValid ? 'Ready for paper generation' : 'Resolve warnings below'}
              </p>
            </div>
          </div>

          {/* Question Pattern Selector */}
          <div className="surface-card p-5 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white tracking-tight">Question Pattern Style</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Select how questions and sub-questions should be structured in this paper.
                </p>
              </div>
              <span className="text-xs font-mono text-slate-400">4 Patterns Supported</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
              {QUESTION_PATTERNS.map((pat) => (
                <div
                  key={pat.id}
                  onClick={() => handlePatternChange(pat.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                    questionPattern === pat.id
                      ? 'bg-indigo-950/30 border-indigo-500 text-white shadow-sm'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">{pat.title}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                        questionPattern === pat.id
                          ? 'bg-indigo-500 text-white font-semibold'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {pat.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{pat.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Unit-Wise Question & Marks Distribution */}
          <div className="surface-card p-5 rounded-xl border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <h4 className="text-sm font-bold text-white tracking-tight">Unit-Wise Distribution</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Define questions count and marks allocated for each syllabus unit.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  icon={RefreshCw}
                  onClick={() => syncSyllabusUnitsToScheme(units)}
                >
                  Re-sync from Syllabus
                </Button>
                <Button size="sm" variant="outline" icon={Plus} onClick={addBlueprintRow}>
                  Add Row
                </Button>
              </div>
            </div>

            <div className="space-y-2.5">
              {blueprintUnits.map((row, idx) => (
                <div
                  key={idx}
                  className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800"
                >
                  <div className="flex-1">
                    <input
                      type="text"
                      value={row.unit}
                      onChange={(e) => handleUpdateUnitDistribution(idx, 'unit', e.target.value)}
                      placeholder="Unit Name..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-semibold"
                    />
                  </div>

                  <div className="flex items-center space-x-4 shrink-0">
                    <div className="flex items-center space-x-2">
                      <label className="text-xs text-slate-400">Questions:</label>
                      <input
                        type="number"
                        min="0"
                        value={row.questionsCount}
                        onChange={(e) => handleUpdateUnitDistribution(idx, 'questionsCount', e.target.value)}
                        className="w-16 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white font-mono text-center focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <label className="text-xs text-slate-400">Marks:</label>
                      <input
                        type="number"
                        min="0"
                        value={row.marks}
                        onChange={(e) => handleUpdateUnitDistribution(idx, 'marks', e.target.value)}
                        className="w-20 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-indigo-400 font-bold font-mono text-center focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => removeBlueprintRow(idx)}
                      className="text-slate-500 hover:text-rose-400 p-1"
                      title="Remove Row"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Distribution Summary Footer */}
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between text-xs font-semibold gap-3">
              <span className="text-slate-400">Distribution Totals:</span>
              <div className="flex items-center space-x-6 font-mono">
                <span>
                  Total Questions: <strong className="text-white">{sumUnitQuestions}</strong>
                </span>
                <span>
                  Total Marks: <strong className={sumUnitMarks === examMaxMarks ? 'text-emerald-400' : 'text-amber-400'}>{sumUnitMarks} / {examMaxMarks}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Question Breakdown Preview */}
          <div className="surface-card p-5 rounded-xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h4 className="text-sm font-bold text-white tracking-tight">
                  Question Breakdown & Sub-Question Pattern Preview
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Review and customize marks per question and sub-parts (A/B/C) according to your scheme.
                </p>
              </div>
              <Badge status="INFO">{questionsConfig.length} Configured</Badge>
            </div>

            <div className="space-y-3">
              {questionsConfig.map((q, qIdx) => (
                <div key={qIdx} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-bold border border-indigo-500/20">
                        {q.label || `Q${qIdx + 1}`}
                      </span>
                      <span className="text-xs text-slate-300 font-semibold">{q.unit}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-slate-400">Total Marks:</span>
                      <input
                        type="number"
                        min="1"
                        value={q.marks}
                        onChange={(e) => handleUpdateQuestionMarks(qIdx, e.target.value)}
                        className="w-16 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-indigo-300 font-bold font-mono text-center focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Sub-Questions if applicable */}
                  {q.subQuestions && q.subQuestions.length > 0 && (
                    <div className="pl-4 border-l-2 border-slate-800 space-y-2 pt-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Sub-Question Parts ({q.subQuestions.length}):
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {q.subQuestions.map((sq, sqIdx) => (
                          <div
                            key={sqIdx}
                            className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 flex items-center justify-between space-x-2"
                          >
                            <span className="font-mono text-xs font-bold text-slate-300">
                              Part ({sq.subLabel})
                            </span>
                            <div className="flex items-center space-x-1">
                              <input
                                type="number"
                                min="0"
                                value={sq.marks}
                                onChange={(e) => handleUpdateSubQuestionMarks(qIdx, sqIdx, e.target.value)}
                                className="w-12 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-white font-mono text-center focus:outline-none"
                              />
                              <span className="text-[10px] text-slate-400">m</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Difficulty & Sets Configuration */}
          <div className="surface-card p-5 rounded-xl border border-slate-800 space-y-4">
            <h4 className="text-sm font-bold text-white tracking-tight">Difficulty & Paper Sets</h4>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

              <div>
                <label className="block text-[11px] text-indigo-400 font-semibold mb-1">Number of Paper Sets</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={numberOfSets}
                  onChange={(e) => setNumberOfSets(Number(e.target.value) || 1)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Real-time Validation Banner */}
          {!isSchemeValid ? (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 space-y-1.5">
              <div className="flex items-center space-x-2 font-bold text-amber-200">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span>Scheme Validation Required Before Saving:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 pl-1 text-[11px] text-amber-300/90">
                {!isQuestionsMatch && (
                  <li>
                    Sum of unit question counts ({sumUnitQuestions}) must equal total questions ({totalQuestions}).
                  </li>
                )}
                {!isMarksMatch && (
                  <li>
                    Sum of unit marks ({sumUnitMarks}) must equal examination maximum score ({examMaxMarks}).
                  </li>
                )}
                {!isQuestionsListValid && (
                  <li>Every question and sub-question must have valid positive marks.</li>
                )}
              </ul>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center space-x-3 text-emerald-300 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                All paper scheme requirements are valid! Unit question sums and marks match examination maximum score ({examMaxMarks}).
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            <Button variant="outline" onClick={() => setActiveTab('syllabus')}>
              ← Back to Syllabus
            </Button>
            <div className="flex items-center space-x-3">
              <Button
                variant="primary"
                icon={Save}
                loading={savingBlueprint}
                disabled={!isSchemeValid}
                onClick={savePaperScheme}
              >
                Save Paper Scheme
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 1: POST SYLLABUS SAVE MODAL                              */}
      {/* Workflow Step: Proceed to Set Paper Scheme or Paper Creation   */}
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
              <p className="font-bold text-sm text-emerald-200">Syllabus units have been saved!</p>
              <p className="text-[11px] text-emerald-300/80">
                {hasSavedScheme
                  ? 'Paper Scheme is already set. You can now create your question paper manually or generate with AI.'
                  : 'Next required step in the authoring flow: Configure the Question Paper Scheme.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Primary Option: If scheme is saved -> Create Paper Manually, otherwise -> Set Paper Scheme */}
            {hasSavedScheme ? (
              <div
                onClick={() => {
                  setPostSaveModalOpen(false);
                  navigate(`/setter/question-papers?examId=${examId}`);
                }}
                className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/50 hover:border-indigo-400 hover:bg-indigo-900/30 transition-all cursor-pointer space-y-2 group shadow-sm"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <FileText className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-sm text-white group-hover:text-indigo-300">
                  Create Paper Manually
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Assemble questions manually, author questions, or pick questions from your Question Bank.
                </p>
                <div className="pt-2">
                  <span className="text-[11px] font-semibold text-indigo-400 group-hover:underline">
                    Proceed to Paper Builder →
                  </span>
                </div>
              </div>
            ) : (
              <div
                onClick={() => {
                  setPostSaveModalOpen(false);
                  syncSyllabusUnitsToScheme(units);
                  setActiveTab('scheme');
                }}
                className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/50 hover:border-indigo-400 hover:bg-indigo-900/30 transition-all cursor-pointer space-y-2 group shadow-sm"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Sliders className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-sm text-white group-hover:text-indigo-300">
                  Set Paper Scheme
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Configure total questions, marks distribution, question patterns (simple, sub-questions, A/B/C, mixed), and unit allocation.
                </p>
                <div className="pt-2">
                  <span className="text-[11px] font-semibold text-indigo-400 group-hover:underline">
                    Proceed to Paper Scheme →
                  </span>
                </div>
              </div>
            )}

            {/* AI Option: Generate Paper with AI */}
            <div
              onClick={handleStartAiPaperGeneration}
              className="p-4 rounded-xl bg-slate-900/80 border border-amber-500/40 hover:border-amber-400 hover:bg-amber-950/20 transition-all cursor-pointer space-y-2 group"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Sparkles className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-sm text-white group-hover:text-amber-300">
                Generate Paper with AI
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Generate balanced examination questions directly from your syllabus units using Gemini AI.
              </p>
              <div className="pt-2">
                <span className="text-[11px] font-semibold text-amber-400 group-hover:underline">
                  Generate Questions →
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            {hasSavedScheme ? (
              <button
                type="button"
                onClick={() => {
                  setPostSaveModalOpen(false);
                  syncSyllabusUnitsToScheme(units);
                  setActiveTab('scheme');
                }}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 hover:underline flex items-center space-x-1"
              >
                <span>Edit Paper Scheme</span>
                <span>→</span>
              </button>
            ) : <div />}
            <Button variant="ghost" size="sm" onClick={() => setPostSaveModalOpen(false)}>
              Stay on Syllabus
            </Button>
          </div>
        </div>
      </Modal>

      {/* ============================================================== */}
      {/* MODAL 2: POST SCHEME SAVE MODAL                                */}
      {/* Next Step: Create Paper Manually or Generate with AI           */}
      {/* ============================================================== */}
      <Modal
        isOpen={postSchemeModalOpen}
        onClose={() => setPostSchemeModalOpen(false)}
        title="Paper Scheme Saved Successfully"
        maxWidth="max-w-xl"
      >
        <div className="space-y-5 text-xs">
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center space-x-3 text-emerald-300">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="font-bold text-sm text-emerald-200">Paper Scheme has been established!</p>
              <p className="text-[11px] text-emerald-300/80">
                Your question patterns, marks distribution, and syllabus mapping are locked in.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Create Paper Manually */}
            <div
              onClick={() => {
                setPostSchemeModalOpen(false);
                navigate(`/setter/question-papers?examId=${examId}`);
              }}
              className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/50 hover:border-indigo-400 hover:bg-indigo-900/30 transition-all cursor-pointer space-y-2 group shadow-sm"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                <FileText className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-sm text-white group-hover:text-indigo-300">
                Create Paper Manually
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Manually assemble, preview, rearrange questions, or pick questions from your Question Bank.
              </p>
              <div className="pt-2">
                <span className="text-[11px] font-semibold text-indigo-400 group-hover:underline">
                  Open Paper Builder →
                </span>
              </div>
            </div>

            {/* Generate with AI */}
            <div
              onClick={handleStartAiPaperGeneration}
              className="p-4 rounded-xl bg-slate-900/80 border border-amber-500/50 hover:border-amber-400 hover:bg-amber-950/20 transition-all cursor-pointer space-y-2 group shadow-sm"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Sparkles className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-sm text-white group-hover:text-amber-300">
                Generate Paper with AI
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Generate questions strictly structured according to your saved Paper Scheme and syllabus units.
              </p>
              <div className="pt-2">
                <span className="text-[11px] font-semibold text-amber-400 group-hover:underline">
                  Launch AI Generation →
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-800">
            <Button variant="ghost" size="sm" onClick={() => setPostSchemeModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* ============================================================== */}
      {/* AI GENERATED PAPER REVIEW MODAL                                */}
      {/* ============================================================== */}
      <Modal
        isOpen={aiReviewModalOpen}
        onClose={() => setAiReviewModalOpen(false)}
        title="AI Question Paper Review & Customization"
        maxWidth="max-w-5xl"
      >
        <div className="space-y-5 text-xs max-h-[78vh] overflow-y-auto pr-2">
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

              <div className="flex items-center space-x-4 shrink-0 text-right">
                <div>
                  <span className="text-slate-400 text-[10px] block">Generated Total Marks:</span>
                  <span
                    className={`font-mono text-sm font-bold ${
                      aiPaperData?.questions?.reduce((s, q) => s + (Number(q.marks) || 0), 0) === examMaxMarks
                        ? 'text-emerald-400'
                        : 'text-amber-400'
                    }`}
                  >
                    {aiPaperData?.questions?.reduce((s, q) => s + (Number(q.marks) || 0), 0) || 0} / {examMaxMarks} m
                  </span>
                </div>
                <Button size="sm" variant="outline" icon={Plus} onClick={addAiQuestion}>
                  Add Question
                </Button>
              </div>
            </div>
          </div>

          {aiPaperData?.sets?.length > 1 && (
            <div className="flex items-center space-x-2 p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] text-slate-400 font-semibold mr-1">Generated Paper Sets:</span>
              {aiPaperData.sets.map((set, sIdx) => {
                const isActive = (aiPaperData.currentSetIdx || 0) === sIdx;
                return (
                  <button
                    key={sIdx}
                    type="button"
                    onClick={() => {
                      setAiPaperData({
                        ...aiPaperData,
                        currentSetIdx: sIdx,
                        questions: set.questions
                      });
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {set.setName || `Set ${sIdx + 1}`} ({set.questions?.length || 0}Q)
                  </button>
                );
              })}
            </div>
          )}

          <div className="space-y-4">
            {aiPaperData?.questions?.map((item, idx) => (
              <div key={idx} className="surface-card p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                      Q{idx + 1}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-300">{item.unit}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      <label className="text-[11px] text-slate-400">Marks:</label>
                      <input
                        type="number"
                        min="1"
                        value={item.marks}
                        onChange={(e) => updateAiQuestionField(idx, 'marks', e.target.value)}
                        className="w-14 bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-xs text-indigo-300 font-mono text-center font-bold"
                      />
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      icon={RefreshCw}
                      loading={regeneratingIdx === idx}
                      onClick={() => handleRegenerateSingleQuestion(idx)}
                      title="Regenerate question with AI"
                    >
                      Regenerate
                    </Button>
                    <button
                      type="button"
                      onClick={() => deleteAiQuestion(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                      title="Delete question"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <textarea
                    rows="3"
                    value={item.questionText}
                    onChange={(e) => updateAiQuestionField(idx, 'questionText', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 leading-relaxed font-sans"
                  />
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                    Expected Scoring Model Answer:
                  </label>
                  <textarea
                    rows="2"
                    value={item.expectedAnswer || ''}
                    onChange={(e) => updateAiQuestionField(idx, 'expectedAnswer', e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded p-2 text-[11px] text-slate-300 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            <Button variant="ghost" onClick={() => setAiReviewModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              icon={Save}
              loading={savingAiPaper}
              onClick={handleSaveReviewedAiPaper}
            >
              Save Final Question Paper (Draft)
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SyllabusManager;
