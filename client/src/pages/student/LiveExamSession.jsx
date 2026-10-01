import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';
import { useToast } from '../../context/ToastContext';
import {
  Clock,
  Save,
  Send,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

const LiveExamSession = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [examData, setExamData] = useState(null);
  const [attemptId, setAttemptId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);

  // Student answers: { [qId]: answerText }
  const [answers, setAnswers] = useState({});
  const [autosaveStatus, setAutosaveStatus] = useState('Saved');
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(7200);
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const autosaveTimerRef = useRef(null);

  useEffect(() => {
    initializeExam();
  }, [examId]);

  const initializeExam = async () => {
    try {
      setLoading(true);
      const res = await api.post(`/exams/${examId}/start`);
      if (res.data.success) {
        setExamData(res.data.examination);
        setAttemptId(res.data.attempt.id);
        const qList = res.data.questionPaper.questions || [];
        setQuestions(qList);

        // Populate draft answers if resuming
        const initialAnswers = {};
        for (const draftItem of res.data.attempt.answersDraft || []) {
          initialAnswers[draftItem.questionId] = draftItem.answerText;
        }
        setAnswers(initialAnswers);

        // Duration in seconds
        const totalSecs = (res.data.examination.durationMinutes || 120) * 60;
        setTimeLeftSeconds(totalSecs);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error starting exam session', 'error');
      navigate('/student/exams');
    } finally {
      setLoading(false);
    }
  };

  // Countdown Timer
  useEffect(() => {
    if (loading || timeLeftSeconds <= 0) return;

    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, timeLeftSeconds]);

  const handleAutoSubmit = () => {
    showToast('Examination time has expired. Submitting your answers automatically.', 'warning');
    submitFinalExam();
  };

  // Format seconds to HH:MM:SS
  const formatTimer = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (qId, text) => {
    setAnswers((prev) => ({ ...prev, [qId]: text }));
    setAutosaveStatus('Unsaved changes...');

    // Debounced autosave
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => {
      triggerAutosave({ ...answers, [qId]: text });
    }, 2000);
  };

  const triggerAutosave = async (currentAnswers) => {
    if (!attemptId) return;

    try {
      setAutosaveStatus('Saving draft...');
      const draftPayload = Object.entries(currentAnswers).map(([qId, txt]) => ({
        questionId: qId,
        answerText: txt
      }));

      await api.post('/exams/save-draft', {
        attemptId,
        answers: draftPayload
      });
      setAutosaveStatus('Saved to Cloud');
    } catch (err) {
      setAutosaveStatus('Autosave failed');
    }
  };

  const submitFinalExam = async () => {
    try {
      setSubmitting(true);
      const answersPayload = questions.map((item, idx) => {
        const qId = item.question?._id || item.question;
        return {
          questionId: qId,
          questionNumber: item.questionNumber || idx + 1,
          answerText: answers[qId] || ''
        };
      });

      const res = await api.post('/exams/submit', {
        attemptId,
        answers: answersPayload
      });

      if (res.data.success) {
        showToast('Examination submitted successfully! Your digital answer copy has been generated.', 'success');
        navigate('/student/attempts');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error submitting examination', 'error');
    } finally {
      setSubmitting(false);
      setSubmitConfirmOpen(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullPage text="Configuring secure examination environment..." />;
  }

  const currentQ = questions[activeQuestionIdx];
  const currentQId = currentQ?.question?._id || currentQ?.question;
  const answeredCount = Object.values(answers).filter((txt) => (txt || '').trim().length > 0).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Session Bar */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-30">
        <div>
          <h2 className="text-sm font-semibold text-slate-100 tracking-tight">{examData?.name}</h2>
          <p className="text-[11px] text-slate-400">
            Subject: <span className="text-indigo-400 font-semibold">{examData?.subject}</span> • Code: {examData?.code}
          </p>
        </div>

        {/* Center Timer */}
        <div className="flex items-center space-x-2 px-4 py-1.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-sm">
          <Clock className={`w-4 h-4 ${timeLeftSeconds < 600 ? 'text-rose-400 animate-pulse' : 'text-indigo-400'}`} />
          <span className={`font-bold ${timeLeftSeconds < 600 ? 'text-rose-400 font-bold' : 'text-white'}`}>
            {formatTimer(timeLeftSeconds)}
          </span>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-4">
          <span className="text-[11px] text-slate-400 hidden sm:inline-block font-mono">
            {autosaveStatus}
          </span>
          <Button
            variant="success"
            size="sm"
            icon={Send}
            onClick={() => setSubmitConfirmOpen(true)}
          >
            Submit Exam
          </Button>
        </div>
      </header>

      {/* Main Testing View */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Question Palette */}
        <div className="lg:col-span-1 space-y-4">
          <div className="surface-card p-5 rounded-xl border border-slate-800 space-y-4">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold uppercase tracking-wider text-slate-400">Question Palette</span>
              <span className="font-mono text-indigo-400 font-bold">
                {answeredCount} / {questions.length} Answered
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {questions.map((q, idx) => {
                const qId = q.question?._id || q.question;
                const isAnswered = !!(answers[qId] && answers[qId].trim().length > 0);
                const isActive = activeQuestionIdx === idx;

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveQuestionIdx(idx)}
                    className={`h-9 rounded-lg font-mono text-xs font-semibold transition-all flex items-center justify-center border ${
                      isActive
                        ? 'bg-indigo-600 border-indigo-400 text-white shadow-sm'
                        : isAnswered
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Q{idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-800 text-[11px] space-y-1 text-slate-400">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded bg-emerald-500/20 border border-emerald-500/40" />
                <span>Answered</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded bg-slate-900 border border-slate-800" />
                <span>Unanswered</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded bg-indigo-600 border border-indigo-400" />
                <span>Current Question</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Question Content & Rich Text Area */}
        <div className="lg:col-span-3 flex flex-col space-y-4">
          <div className="surface-card p-5 rounded-xl border border-slate-800 flex-1 flex flex-col justify-between space-y-5">
            <div>
              {/* Question Header */}
              <div className="flex justify-between items-start pb-4 border-b border-slate-800">
                <div className="flex items-start space-x-3">
                  <span className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 font-mono font-bold text-sm flex items-center justify-center shrink-0 border border-indigo-500/20">
                    Q{activeQuestionIdx + 1}
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-white leading-relaxed">
                      {currentQ?.question?.questionText}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 font-mono">
                      {currentQ?.question?.unit} • {currentQ?.question?.topic}
                    </p>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 font-mono font-bold text-xs text-indigo-400 shrink-0 ml-3">
                  {currentQ?.marks} Marks
                </span>
              </div>

              {/* Student Answer Text Area */}
              <div className="mt-5 space-y-2">
                <label className="block text-xs font-semibold text-slate-300">
                  Your Answer (Drafting in real-time)
                </label>
                <textarea
                  rows="14"
                  value={answers[currentQId] || ''}
                  onChange={(e) => handleAnswerChange(currentQId, e.target.value)}
                  placeholder="Type your structured answer here. Formulate key principles, sequence definitions, equations, and technical explanations..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-sans leading-relaxed resize-y"
                />
              </div>
            </div>

            {/* Bottom Nav between questions */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <Button
                variant="secondary"
                size="md"
                icon={ChevronLeft}
                disabled={activeQuestionIdx === 0}
                onClick={() => setActiveQuestionIdx((prev) => prev - 1)}
              >
                Previous Question
              </Button>

              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-400 font-mono">
                  {answers[currentQId]?.trim() ? `${answers[currentQId].split(/\s+/).length} words` : '0 words'}
                </span>
              </div>

              {activeQuestionIdx < questions.length - 1 ? (
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setActiveQuestionIdx((prev) => prev + 1)}
                >
                  <span>Next Question</span>
                  <ChevronRight className="w-4 h-4 ml-1.5" />
                </Button>
              ) : (
                <Button
                  variant="success"
                  size="md"
                  icon={Send}
                  onClick={() => setSubmitConfirmOpen(true)}
                >
                  Submit Examination
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Dialog */}
      <Modal
        isOpen={submitConfirmOpen}
        onClose={() => setSubmitConfirmOpen(false)}
        title="Submit Examination Confirmation"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-300 leading-relaxed">
            You have completed <strong className="text-emerald-400 font-mono text-sm">{answeredCount}</strong> of{' '}
            <strong className="text-white font-mono text-sm">{questions.length}</strong> questions.
          </p>

          {answeredCount < questions.length && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>You have {questions.length - answeredCount} unanswered question(s).</span>
            </div>
          )}

          <p className="text-slate-400">
            Once submitted, your answers will be permanently saved and a unique digital answer copy will be generated for faculty evaluation. You will not be able to modify your answers.
          </p>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
            <Button variant="ghost" onClick={() => setSubmitConfirmOpen(false)}>
              Continue Working
            </Button>
            <Button
              variant="success"
              icon={CheckCircle2}
              loading={submitting}
              onClick={submitFinalExam}
            >
              Confirm & Submit
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default LiveExamSession;
