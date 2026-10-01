import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../context/ToastContext';
import { Calendar, Clock, Award, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

const AvailableExams = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [instructionsExam, setInstructionsExam] = useState(null);
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const res = await api.get('/exams/available');
      if (res.data.success) {
        setExams(res.data.examinations || []);
      }
    } catch (err) {
      showToast('Failed to load available examinations', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStartExam = (exam) => {
    setInstructionsExam(null);
    navigate(`/student/exam-session/${exam._id}`);
  };

  return (
    <div>
      <PageHeader
        title="Scheduled Examinations"
        subtitle="Review official examination instructions, time allocations, and launch live testing sessions."
        breadcrumb="Test Center"
      />

      {loading ? (
        <LoadingSpinner fullPage text="Retrieving available exams..." />
      ) : exams.length === 0 ? (
        <EmptyState
          title="No examinations available"
          message="There are no scheduled examinations pending for your enrollment at this time."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {exams.map((exam) => {
            const hasSubmitted = exam.myAttempt?.status === 'SUBMITTED';

            return (
              <div
                key={exam._id}
                className="surface-card p-5 rounded-xl border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all duration-200"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                        {exam.code}
                      </span>
                      <h3 className="text-lg font-bold text-white tracking-tight mt-1.5 leading-snug">
                        {exam.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">{exam.subject}</p>
                    </div>
                    {hasSubmitted ? (
                      <Badge status="COMPLETED">Submitted</Badge>
                    ) : (
                      <Badge status="LIVE">Open for Conduct</Badge>
                    )}
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-800 grid grid-cols-3 gap-3 text-xs text-slate-400">
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-slate-500">Duration</span>
                      <span className="font-mono font-bold text-white text-sm">{exam.durationMinutes}m</span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-slate-500">Max Marks</span>
                      <span className="font-mono font-bold text-white text-sm">{exam.maxMarks}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-slate-500">Pass Marks</span>
                      <span className="font-mono font-bold text-white text-sm">{exam.passingMarks}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
                  <div className="text-xs text-slate-400">
                    {hasSubmitted ? (
                      <span className="text-emerald-400 font-semibold flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Submitted & Under Evaluation</span>
                      </span>
                    ) : (
                      <span>Full screen secure testing mode</span>
                    )}
                  </div>

                  {hasSubmitted ? (
                    <Link to="/student/attempts">
                      <Button size="sm" variant="outline">
                        View Submission
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      size="sm"
                      variant="primary"
                      icon={ArrowRight}
                      onClick={() => setInstructionsExam(exam)}
                    >
                      Instructions & Launch
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Exam Instructions Modal */}
      <Modal
        isOpen={!!instructionsExam}
        onClose={() => setInstructionsExam(null)}
        title={`Exam Instructions - ${instructionsExam?.name}`}
        maxWidth="max-w-2xl"
      >
        {instructionsExam && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Subject:</span>
                <span className="font-bold text-white">{instructionsExam.subject}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Allocated Time:</span>
                <span className="font-mono font-bold text-indigo-400">{instructionsExam.durationMinutes} Minutes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Marks:</span>
                <span className="font-mono font-bold text-white">{instructionsExam.maxMarks}</span>
              </div>
            </div>

            <div className="space-y-2">
              <h5 className="font-bold text-slate-200 uppercase tracking-wider">Candidate Guidelines:</h5>
              <ul className="list-disc list-inside text-slate-400 space-y-1 leading-relaxed">
                {instructionsExam.instructions?.map((ins, i) => (
                  <li key={i}>{ins}</li>
                ))}
                <li>Answers are automatically saved to the cloud during the testing session.</li>
                <li>Do not navigate away or switch browser tabs excessively during the exam.</li>
                <li>Once submitted, your digital answer copy is locked and dispatched for faculty evaluation.</li>
              </ul>
            </div>

            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 shrink-0" />
              <span>Encrypted test environment. Submission timestamp and IP are logged for audit.</span>
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
              <Button variant="ghost" onClick={() => setInstructionsExam(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                icon={ArrowRight}
                onClick={() => handleStartExam(instructionsExam)}
              >
                I Agree & Start Exam
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AvailableExams;
