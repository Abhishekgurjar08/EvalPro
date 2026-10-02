import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useToast } from '../../context/ToastContext';
import {
  Calendar,
  HelpCircle,
  FileText,
  Layers,
  CheckCircle2,
  XCircle,
  ArrowRight,
  BookOpen,
  AlertTriangle
} from 'lucide-react';

const SetterDashboard = () => {
  const [assignedExams, setAssignedExams] = useState([]);
  const [questionsCount, setQuestionsCount] = useState(0);
  const [papersCount, setPapersCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Response Modal
  const [responseModalOpen, setResponseModalOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [responseType, setResponseType] = useState('ACCEPT'); // 'ACCEPT' or 'REJECT'
  const [rejectReason, setRejectReason] = useState('');
  const [responding, setResponding] = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
    fetchSetterData();
  }, []);

  const fetchSetterData = async () => {
    try {
      setLoading(true);
      const [examsRes, questionsRes, papersRes] = await Promise.all([
        api.get('/examinations'),
        api.get('/questions'),
        api.get('/question-papers')
      ]);

      if (examsRes.data.success) setAssignedExams(examsRes.data.examinations || []);
      if (questionsRes.data.success) setQuestionsCount(questionsRes.data.total || 0);
      if (papersRes.data.success) setPapersCount(papersRes.data.count || 0);
    } catch (err) {
      showToast('Failed to load setter dashboard', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSetterResponse = async (e) => {
    e.preventDefault();
    if (!selectedExam) return;

    if (responseType === 'REJECT' && !rejectReason.trim()) {
      showToast('Rejection reason is mandatory.', 'error');
      return;
    }

    try {
      setResponding(true);
      const res = await api.post(`/examinations/${selectedExam._id}/setter-response`, {
        response: responseType,
        reason: rejectReason
      });

      if (res.data.success) {
        showToast(
          `Assignment ${responseType === 'ACCEPT' ? 'accepted' : 'rejected'} successfully!`,
          'success'
        );
        setResponseModalOpen(false);
        setRejectReason('');
        fetchSetterData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error recording response', 'error');
    } finally {
      setResponding(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullPage text="Loading exam setter workspace..." />;
  }

  const pendingAcceptance = assignedExams.filter((e) => e.status === 'SETTER_ASSIGNED');

  return (
    <div>
      <PageHeader
        title="Exam Setter Authoring Center"
        subtitle="Curate examination syllabi, author rubric-grounded question banks, construct marks blueprints, and submit question papers."
        breadcrumb="Content Architecture"
      />

      {/* Pending Assignment Alert */}
      {pendingAcceptance.length > 0 && (
        <div className="mb-8 p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">
                You have {pendingAcceptance.length} examination assignment(s) awaiting your formal response!
              </p>
              <p className="text-xs text-indigo-300">
                Please review the subject, duration, and marks requirements to accept or decline with reason.
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setSelectedExam(pendingAcceptance[0]);
              setResponseType('ACCEPT');
              setResponseModalOpen(true);
            }}
          >
            Respond Now
          </Button>
        </div>
      )}

      {/* Setter Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <StatCard
          title="Assigned Examinations"
          value={assignedExams.length}
          subtitle="Assigned to your faculty profile"
          icon={Calendar}
          color="indigo"
        />
        <StatCard
          title="Active Question Bank"
          value={questionsCount}
          subtitle="Rubric-defined descriptive items"
          icon={HelpCircle}
          color="sky"
        />
        <StatCard
          title="Question Papers"
          value={papersCount}
          subtitle="Drafted and submitted papers"
          icon={FileText}
          color="purple"
        />
      </div>

      {/* Setter Workflow Navigator */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Link
          to="/setter/examinations"
          className="surface-card p-4 rounded-xl border border-slate-800 transition-all duration-200 hover:border-slate-700 hover:bg-slate-900/90 group"
        >
          <div className="flex justify-between items-center text-[10px] font-semibold uppercase tracking-wider text-indigo-400 mb-1">
            <span>Step 1</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
          </div>
          <h4 className="text-xs font-semibold text-slate-100">My Examinations</h4>
          <p className="text-[11px] text-slate-400 mt-1">Accept assignments and inspect parameters.</p>
        </Link>

        <Link
          to="/setter/questions"
          className="surface-card p-4 rounded-xl border border-slate-800 transition-all duration-200 hover:border-slate-700 hover:bg-slate-900/90 group"
        >
          <div className="flex justify-between items-center text-[10px] font-semibold uppercase tracking-wider text-sky-400 mb-1">
            <span>Step 2</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-sky-400 group-hover:translate-x-0.5 transition-all" />
          </div>
          <h4 className="text-xs font-semibold text-slate-100">Question Bank & Rubrics</h4>
          <p className="text-[11px] text-slate-400 mt-1">Author descriptive questions & criteria rubrics.</p>
        </Link>

        <Link
          to={assignedExams.length > 0 ? `/setter/syllabus/${assignedExams[0]._id}` : '/setter/examinations'}
          className="surface-card p-4 rounded-xl border border-slate-800 transition-all duration-200 hover:border-slate-700 hover:bg-slate-900/90 group"
        >
          <div className="flex justify-between items-center text-[10px] font-semibold uppercase tracking-wider text-emerald-400 mb-1">
            <span>Step 3</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
          </div>
          <h4 className="text-xs font-semibold text-slate-100">Syllabus & Paper Scheme</h4>
          <p className="text-[11px] text-slate-400 mt-1">Define units, paper scheme, and marks distribution.</p>
        </Link>

        <Link
          to="/setter/question-papers"
          className="surface-card p-4 rounded-xl border border-slate-800 transition-all duration-200 hover:border-slate-700 hover:bg-slate-900/90 group"
        >
          <div className="flex justify-between items-center text-[10px] font-semibold uppercase tracking-wider text-purple-400 mb-1">
            <span>Step 4</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all" />
          </div>
          <h4 className="text-xs font-semibold text-slate-100">Paper Builder & Submit</h4>
          <p className="text-[11px] text-slate-400 mt-1">Select questions & submit for admin approval.</p>
        </Link>
      </div>

      {/* Assigned Examinations List */}
      <div className="surface-card rounded-xl border border-slate-800 overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-base font-bold text-white tracking-tight">Your Assigned Examinations</h3>
          <span className="text-xs text-slate-400 font-mono">{assignedExams.length} Assigned</span>
        </div>

        <div className="divide-y divide-slate-800/60">
          {assignedExams.map((exam) => (
            <div key={exam._id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2.5">
                  <h4 className="text-base font-bold text-white">{exam.name}</h4>
                  <Badge status={exam.status}>{exam.status.replace('_', ' ')}</Badge>
                </div>
                <div className="flex items-center space-x-3 text-xs text-slate-400 mt-1.5">
                  <span className="font-mono bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 text-slate-300">
                    {exam.code}
                  </span>
                  <span>Subject: <strong className="text-indigo-400">{exam.subject}</strong></span>
                  <span>•</span>
                  <span>Course: <strong className="text-slate-300">{exam.course} (Sem {exam.semester})</strong></span>
                  <span>•</span>
                  <span>Max Marks: <strong className="text-white font-mono">{exam.maxMarks}</strong></span>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                {exam.status === 'SETTER_ASSIGNED' && (
                  <>
                    <Button
                      size="sm"
                      variant="success"
                      icon={CheckCircle2}
                      onClick={() => {
                        setSelectedExam(exam);
                        setResponseType('ACCEPT');
                        setResponseModalOpen(true);
                      }}
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      icon={XCircle}
                      onClick={() => {
                        setSelectedExam(exam);
                        setResponseType('REJECT');
                        setResponseModalOpen(true);
                      }}
                    >
                      Decline
                    </Button>
                  </>
                )}

                <Link to={`/setter/syllabus/${exam._id}`}>
                  <Button size="sm" variant="outline">
                    Syllabus & Paper Scheme
                  </Button>
                </Link>

                <Link to="/setter/question-papers">
                  <Button size="sm" variant="primary">
                    Question Paper
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Response Acceptance / Rejection Modal */}
      <Modal
        isOpen={responseModalOpen}
        onClose={() => setResponseModalOpen(false)}
        title={`Respond to Setter Assignment - ${selectedExam?.name}`}
      >
        <form onSubmit={handleSetterResponse} className="space-y-4">
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1">
            <p className="text-slate-300">
              Subject: <strong className="text-indigo-400">{selectedExam?.subject}</strong>
            </p>
            <p className="text-slate-400">
              Exam Code: <span className="font-mono text-white">{selectedExam?.code}</span> | Max Marks: {selectedExam?.maxMarks}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Your Decision</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setResponseType('ACCEPT')}
                className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
                  responseType === 'ACCEPT'
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400 shadow-lg shadow-emerald-500/10'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Accept Assignment</span>
              </button>

              <button
                type="button"
                onClick={() => setResponseType('REJECT')}
                className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
                  responseType === 'REJECT'
                    ? 'bg-rose-600/20 border-rose-500 text-rose-400 shadow-lg shadow-rose-500/10'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <XCircle className="w-4 h-4" />
                <span>Decline Assignment</span>
              </button>
            </div>
          </div>

          {responseType === 'REJECT' && (
            <div>
              <label className="block text-xs font-semibold text-rose-300 mb-1">
                Decline Reason (Mandatory) *
              </label>
              <textarea
                required
                rows="3"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Please state the administrative or subject-matter reason for declining this setter assignment..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-rose-500"
              />
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
            <Button variant="ghost" onClick={() => setResponseModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant={responseType === 'ACCEPT' ? 'success' : 'danger'}
              loading={responding}
            >
              Confirm Response
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SetterDashboard;
