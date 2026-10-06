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

  // Syllabus and Exam State
  const [assignedSyllabus, setAssignedSyllabus] = useState(null);
  const [showFullSyllabus, setShowFullSyllabus] = useState(true);

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

      let loadedSyllabus = null;
      if (sylRes.data.success && sylRes.data.syllabus) {
        loadedSyllabus = sylRes.data.syllabus;
      } else if (loadedExam?.assignedSyllabus && typeof loadedExam.assignedSyllabus === 'object') {
        loadedSyllabus = loadedExam.assignedSyllabus;
      }

      setAssignedSyllabus(loadedSyllabus);

      let loadedUnits = [];
      if (loadedSyllabus && Array.isArray(loadedSyllabus.units) && loadedSyllabus.units.length > 0) {
        loadedUnits = loadedSyllabus.units;
        setUnits(loadedUnits);
      } else {
        loadedUnits = [];
        setUnits([]);
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
    let unitsToUse = sylUnits;
    if (!unitsToUse || unitsToUse.length === 0) {
      unitsToUse = [
        { unitNumber: 1, title: 'Unit 1: Fundamentals & Conceptual Overview' },
        { unitNumber: 2, title: 'Unit 2: Core Architecture & Methods' },
        { unitNumber: 3, title: 'Unit 3: Implementation & Protocols' },
        { unitNumber: 4, title: 'Unit 4: Advanced Systems & Design' },
        { unitNumber: 5, title: 'Unit 5: Applications & Case Studies' }
      ];
    }
    const count = unitsToUse.length;
    const baseMarks = Math.floor(maxMarks / count);
    let remMarks = maxMarks % count;

    const initialBpUnits = unitsToUse.map((u, idx) => {
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
  // Strictly follows configured Paper Scheme + Assigned Syllabus
  // ==============================================================
  const handleStartAiPaperGeneration = async () => {
    setPostSchemeModalOpen(false);

    // Auto-save current paper scheme first so backend uses the exact current scheme
    if (isSchemeValid) {
      try {
        await api.post('/blueprints', {
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
        setHasSavedScheme(true);
      } catch (saveErr) {
        console.warn('Auto-save scheme before AI generation notice:', saveErr);
      }
    }

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
          className="inline-flex items-center space-x-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Assigned Examinations</span>
        </Link>
      </div>

      <PageHeader
        title={`${exam?.name || 'Examination'} - Assigned Syllabus & Paper Scheme`}
        subtitle={`Review the syllabus assigned by Admin and configure question paper scheme for ${exam?.subject} (${exam?.code}).`}
        breadcrumb="Exam Authoring"
        action={
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              icon={FileText}
              onClick={() => navigate(`/setter/question-papers?examId=${examId}`)}
            >
              Create Manually
            </Button>
            <Button
              variant="ai"
              icon={Sparkles}
              loading={aiGenerating}
              disabled={units.length === 0}
              onClick={handleStartAiPaperGeneration}
            >
              Generate with AI
            </Button>
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
        }
      />

      <div className="space-y-6">
        {/* ============================================================== */}
        {/* 1. ADMIN-ASSIGNED SYLLABUS SECTION                             */}
        {/* ============================================================== */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">
                    Assigned Syllabus
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Assigned by Admin
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {assignedSyllabus?.title || `${exam?.subject || 'Course'} Official Syllabus`} • Course: {exam?.course || 'University'} • Subject: {exam?.subject}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <span className="text-xs font-mono font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                {units.length} Syllabus Units
              </span>
              {units.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFullSyllabus(!showFullSyllabus)}
                >
                  {showFullSyllabus ? 'Hide Units' : 'View Units'}
                </Button>
              )}
            </div>
          </div>

          {units.length === 0 ? (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <p className="font-bold text-amber-900">No Syllabus Assigned by Admin Yet</p>
                <p className="text-amber-700 text-[11px] mt-0.5">
                  The Admin will assign the official syllabus for this examination. Once assigned, you can configure your scheme and prepare question papers.
                </p>
              </div>
            </div>
          ) : (
            showFullSyllabus && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                {units.map((unit, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-2 hover:border-indigo-300 hover:bg-white transition-all shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                        Unit {unit.unitNumber || idx + 1}
                      </span>
                      {unit.hours && (
                        <span className="text-[10px] text-slate-500 font-mono">
                          {unit.hours} hrs
                        </span>
                      )}
                    </div>

                    <h5 className="font-bold text-xs text-slate-900 line-clamp-1">
                      {unit.title}
                    </h5>

                    {unit.description && (
                      <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                        {unit.description}
                      </p>
                    )}

                    {Array.isArray(unit.topics) && unit.topics.length > 0 && (
                      <div className="pt-1 flex flex-wrap gap-1">
                        {unit.topics.slice(0, 3).map((top, tIdx) => (
                          <span
                            key={tIdx}
                            className="text-[9px] px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-200 font-mono"
                          >
                            {typeof top === 'string' ? top : top.title}
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
            )
          )}
        </div>

        {/* ============================================================== */}
        {/* 2. TWO WAYS TO CREATE QUESTION PAPER ACCORDING TO SYLLABUS     */}
        {/* ============================================================== */}
        <div className="bg-gradient-to-r from-indigo-50/80 via-white to-purple-50/50 p-5 rounded-2xl border border-indigo-100 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center space-x-2">
                <span>Create Question Paper According to Syllabus</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 font-semibold border border-indigo-200">
                  2 Creation Modes
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Prepare the official question paper using automated AI or manual syllabus reference.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* WAY 1: GENERATE WITH AI */}
            <div className="p-5 rounded-2xl bg-white border border-amber-200/90 shadow-sm hover:border-amber-400 transition-all space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-sm text-slate-900">1. Generate with AI</span>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                    Strictly Follows Scheme
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  AI generates questions strictly aligned with your <strong className="text-slate-800">Paper Scheme below</strong> (total questions, pattern, unit distribution & marks) using the Admin-assigned syllabus.
                </p>
                <ul className="text-[10px] text-slate-500 space-y-1 pl-4 list-disc">
                  <li>Strict syllabus knowledge boundary per unit</li>
                  <li>Automatic marks & pattern compliance (A/B/C sub-parts)</li>
                  <li>Review, edit, or regenerate questions before saving</li>
                </ul>
              </div>

              <div className="pt-2">
                <Button
                  variant="primary"
                  icon={Sparkles}
                  loading={aiGenerating}
                  disabled={units.length === 0}
                  onClick={handleStartAiPaperGeneration}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs shadow-sm shadow-amber-500/20 border-0"
                >
                  {aiGenerating ? 'Generating AI Paper...' : '⚡ Generate Paper with AI'}
                </Button>
              </div>
            </div>

            {/* WAY 2: MANUAL CREATION */}
            <div className="p-5 rounded-2xl bg-white border border-indigo-200/90 shadow-sm hover:border-indigo-400 transition-all space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center">
                      <FileText className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-sm text-slate-900">2. Create Manually</span>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Manual Mode
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Assemble the question paper manually while looking at the Admin-assigned syllabus units and topics directly on screen in the Question Paper Builder.
                </p>
                <ul className="text-[10px] text-slate-500 space-y-1 pl-4 list-disc">
                  <li>View full assigned syllabus side-by-side in real-time</li>
                  <li>Pick questions from Question Bank or write custom ones</li>
                  <li>Manually organize question order and custom marks</li>
                </ul>
              </div>

              <div className="pt-2">
                <Button
                  variant="outline"
                  icon={FileText}
                  onClick={() => navigate(`/setter/question-papers?examId=${examId}`)}
                  className="w-full text-indigo-600 border-indigo-200 hover:bg-indigo-50 font-semibold text-xs"
                >
                  ✍️ Create Manually →
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* 3. PAPER SCHEME CONFIGURATION                                  */}
        {/* ============================================================== */}
        {/* Scheme Overview & Automatic Calculations Header */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Total Questions
            </span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-bold font-mono text-slate-900">{totalQuestions}</span>
              <span className="text-xs text-slate-500">Questions</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Auto-sum from units: {sumUnitQuestions}</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Total Marks
            </span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span
                className={`text-2xl font-bold font-mono ${
                  sumUnitMarks === examMaxMarks ? 'text-emerald-600' : 'text-amber-600'
                }`}
              >
                {sumUnitMarks}
              </span>
              <span className="text-xs text-slate-500">/ {examMaxMarks} marks</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              {sumUnitMarks === examMaxMarks ? 'Matches exam max marks' : 'Must match exam max marks'}
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Question Pattern
            </span>
            <div className="flex items-center space-x-1.5 mt-1">
              <span className="text-sm font-bold text-indigo-600">
                {QUESTION_PATTERNS.find((p) => p.id === questionPattern)?.title || questionPattern}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Configurable sub-parts</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Validation Status
            </span>
            <div className="mt-1.5">
              <Badge status={isSchemeValid ? 'SUCCESS' : 'WARNING'}>
                {isSchemeValid ? 'Scheme Fully Valid' : 'Action Required'}
              </Badge>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              {isSchemeValid ? 'Ready for paper generation' : 'Resolve warnings below'}
            </p>
          </div>
        </div>

        {/* Question Pattern Selector */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900 tracking-tight">Question Pattern Style</h4>
              <p className="text-xs text-slate-500 mt-0.5">
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
                    ? 'bg-indigo-50/70 border-indigo-500 text-slate-900 shadow-xs'
                    : 'bg-slate-50/50 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">{pat.title}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                      questionPattern === pat.id
                        ? 'bg-indigo-600 text-white font-semibold'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {pat.badge}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">{pat.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Unit-Wise Question & Marks Distribution */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h4 className="text-sm font-bold text-slate-900 tracking-tight">Unit-Wise Distribution</h4>
              <p className="text-xs text-slate-500 mt-0.5">
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
                className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80"
              >
                <div className="flex-1">
                  <input
                    type="text"
                    value={row.unit}
                    onChange={(e) => handleUpdateUnitDistribution(idx, 'unit', e.target.value)}
                    placeholder="Unit Name..."
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 font-semibold shadow-2xs"
                  />
                </div>

                <div className="flex items-center space-x-4 shrink-0">
                  <div className="flex items-center space-x-2">
                    <label className="text-xs text-slate-500 font-medium">Questions:</label>
                    <input
                      type="number"
                      min="0"
                      value={row.questionsCount}
                      onChange={(e) => handleUpdateUnitDistribution(idx, 'questionsCount', e.target.value)}
                      className="w-16 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 font-mono text-center focus:outline-none focus:border-indigo-600 shadow-2xs"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <label className="text-xs text-slate-500 font-medium">Marks:</label>
                    <input
                      type="number"
                      min="0"
                      value={row.marks}
                      onChange={(e) => handleUpdateUnitDistribution(idx, 'marks', e.target.value)}
                      className="w-20 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-indigo-600 font-bold font-mono text-center focus:outline-none focus:border-indigo-600 shadow-2xs"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => removeBlueprintRow(idx)}
                    className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                    title="Remove Row"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Distribution Summary Footer */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between text-xs font-semibold gap-3">
            <span className="text-slate-500">Distribution Totals:</span>
            <div className="flex items-center space-x-6 font-mono">
              <span>
                Total Questions: <strong className="text-slate-900">{sumUnitQuestions}</strong>
              </span>
              <span>
                Total Marks: <strong className={sumUnitMarks === examMaxMarks ? 'text-emerald-600' : 'text-amber-600'}>{sumUnitMarks} / {examMaxMarks}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Question Breakdown Preview */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h4 className="text-sm font-bold text-slate-900 tracking-tight">
                Question Breakdown & Sub-Question Pattern Preview
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Review and customize marks per question and sub-parts (A/B/C) according to your scheme.
              </p>
            </div>
            <Badge status="INFO">{questionsConfig.length} Configured</Badge>
          </div>

          <div className="space-y-3">
            {questionsConfig.map((q, qIdx) => (
              <div key={qIdx} className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                      {q.label || `Q${qIdx + 1}`}
                    </span>
                    <span className="text-xs text-slate-800 font-semibold">{q.unit}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-slate-500">Total Marks:</span>
                    <input
                      type="number"
                      min="1"
                      value={q.marks}
                      onChange={(e) => handleUpdateQuestionMarks(qIdx, e.target.value)}
                      className="w-16 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-indigo-700 font-bold font-mono text-center focus:outline-none focus:border-indigo-600 shadow-2xs"
                    />
                  </div>
                </div>

                {/* Sub-Questions if applicable */}
                {q.subQuestions && q.subQuestions.length > 0 && (
                  <div className="pl-4 border-l-2 border-slate-200 space-y-2 pt-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Sub-Question Parts ({q.subQuestions.length}):
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {q.subQuestions.map((sq, sqIdx) => (
                        <div
                          key={sqIdx}
                          className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between space-x-2 shadow-2xs"
                        >
                          <span className="font-mono text-xs font-bold text-slate-700">
                            Part ({sq.subLabel})
                          </span>
                          <div className="flex items-center space-x-1">
                            <input
                              type="number"
                              min="0"
                              value={sq.marks}
                              onChange={(e) => handleUpdateSubQuestionMarks(qIdx, sqIdx, e.target.value)}
                              className="w-12 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-800 font-mono text-center focus:outline-none focus:border-indigo-600"
                            />
                            <span className="text-[10px] text-slate-500">m</span>
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
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <h4 className="text-sm font-bold text-slate-900 tracking-tight">Difficulty & Paper Sets</h4>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-[11px] text-emerald-700 font-semibold mb-1">Easy (%)</label>
              <input
                type="number"
                value={difficultyDist.easy}
                onChange={(e) => setDifficultyDist({ ...difficultyDist, easy: Number(e.target.value) })}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-600 font-mono shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-[11px] text-amber-700 font-semibold mb-1">Medium (%)</label>
              <input
                type="number"
                value={difficultyDist.medium}
                onChange={(e) => setDifficultyDist({ ...difficultyDist, medium: Number(e.target.value) })}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-600 font-mono shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-[11px] text-rose-700 font-semibold mb-1">Hard (%)</label>
              <input
                type="number"
                value={difficultyDist.hard}
                onChange={(e) => setDifficultyDist({ ...difficultyDist, hard: Number(e.target.value) })}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-600 font-mono shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-[11px] text-indigo-700 font-semibold mb-1">Number of Paper Sets</label>
              <input
                type="number"
                min="1"
                max="5"
                value={numberOfSets}
                onChange={(e) => setNumberOfSets(Number(e.target.value) || 1)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-600 font-mono shadow-2xs"
              />
            </div>
          </div>
        </div>

        {/* Real-time Validation Banner */}
        {!isSchemeValid ? (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-1.5">
            <div className="flex items-center space-x-2 font-bold text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>Scheme Validation Required Before Saving:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 pl-1 text-[11px] text-amber-800">
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
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center space-x-3 text-emerald-800 text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              All paper scheme requirements are valid! Unit question sums and marks match examination maximum score ({examMaxMarks}).
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <Link to="/setter/examinations">
            <Button variant="outline">
              ← Back to Assigned Examinations
            </Button>
          </Link>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              icon={FileText}
              onClick={() => navigate(`/setter/question-papers?examId=${examId}`)}
            >
              Create Manually →
            </Button>
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

      {/* ============================================================== */}
      {/* MODAL 2: POST SCHEME SAVE MODAL                                */}
      {/* ============================================================== */}
      <Modal
        isOpen={postSchemeModalOpen}
        onClose={() => setPostSchemeModalOpen(false)}
        title="Paper Scheme Saved Successfully"
        maxWidth="max-w-xl"
      >
        <div className="space-y-5 text-xs">
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center space-x-3 text-emerald-800">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold text-sm text-emerald-900">Paper Scheme has been established!</p>
              <p className="text-[11px] text-emerald-700">
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
              className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 transition-all cursor-pointer space-y-2 group shadow-2xs"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center group-hover:scale-105 transition-transform">
                <FileText className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600">
                Create Paper Manually
              </h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Manually assemble, preview, rearrange questions, or pick questions from your Question Bank.
              </p>
              <div className="pt-2">
                <span className="text-[11px] font-semibold text-indigo-600 group-hover:underline">
                  Open Paper Builder →
                </span>
              </div>
            </div>

            {/* Generate with AI */}
            <div
              onClick={handleStartAiPaperGeneration}
              className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 hover:border-amber-400 hover:bg-amber-50 transition-all cursor-pointer space-y-2 group shadow-2xs"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 border border-amber-300 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Sparkles className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-sm text-slate-900 group-hover:text-amber-700">
                Generate Paper with AI
              </h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Generate questions strictly structured according to your saved Paper Scheme and syllabus units.
              </p>
              <div className="pt-2">
                <span className="text-[11px] font-semibold text-amber-700 group-hover:underline">
                  Launch AI Generation →
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-100">
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
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1">
                <label className="block text-slate-600 font-semibold mb-1 text-[11px]">Paper Title</label>
                <input
                  type="text"
                  value={aiPaperData?.title || ''}
                  onChange={(e) => setAiPaperData({ ...aiPaperData, title: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-indigo-600 shadow-2xs"
                />
              </div>

              <div className="flex items-center space-x-4 shrink-0 text-right">
                <div>
                  <span className="text-slate-500 text-[10px] block">Generated Total Marks:</span>
                  <span
                    className={`font-mono text-sm font-bold ${
                      aiPaperData?.questions?.reduce((s, q) => s + (Number(q.marks) || 0), 0) === examMaxMarks
                        ? 'text-emerald-600'
                        : 'text-amber-600'
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
            <div className="flex items-center space-x-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] text-slate-500 font-semibold mr-1">Generated Paper Sets:</span>
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
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
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
              <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      Q{idx + 1}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-700">{item.unit}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      <label className="text-[11px] text-slate-500">Marks:</label>
                      <input
                        type="number"
                        min="1"
                        value={item.marks}
                        onChange={(e) => updateAiQuestionField(idx, 'marks', e.target.value)}
                        className="w-14 bg-white border border-slate-200 rounded px-2 py-0.5 text-xs text-indigo-700 font-mono text-center font-bold"
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
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 leading-relaxed font-sans"
                  />
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50/70 border border-slate-200">
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                    Expected Scoring Model Answer:
                  </label>
                  <textarea
                    rows="2"
                    value={item.expectedAnswer || ''}
                    onChange={(e) => updateAiQuestionField(idx, 'expectedAnswer', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded p-2 text-[11px] text-slate-700 focus:outline-none focus:border-indigo-600 font-mono"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
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
