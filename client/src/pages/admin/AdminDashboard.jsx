import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import {
  Calendar,
  Users,
  UserCheck,
  HelpCircle,
  FileCheck,
  Clock,
  CheckCircle2,
  FileText,
  ArrowRight,
  Sparkles,
  Zap,
  Award,
  Layers,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentExams, setRecentExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await api.get('/reports/dashboard-stats');
      if (res.data.success) {
        setStats(res.data.stats);
        setRecentExams(res.data.recentExaminations || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullPage text="Gathering executive examination analytics..." />;
  }

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Executive Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-[#121933] via-[#0d1428] to-[#151130] border border-indigo-500/20 shadow-2xl shadow-indigo-950/40">
        {/* Ambient background glow accents */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Pariksha AI Executive Oversight</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400 font-mono text-[11px]">{currentDate}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-indigo-200 to-white">{user?.name || 'Administrator'}</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              Continuous examination orchestration, multimodal Gemini AI evaluation, and official result publishing terminal.
            </p>
          </div>

          {/* Quick Action Button Group */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
            <Link to="/admin/examinations">
              <Button
                variant="primary"
                size="md"
                icon={Calendar}
                className="w-full sm:w-auto"
              >
                Create Examination
              </Button>
            </Link>

            <Link to="/admin/copy-assignment">
              <Button
                variant="secondary"
                size="md"
                icon={FileCheck}
                className="w-full sm:w-auto"
              >
                Assign Copies
              </Button>
            </Link>
          </div>
        </div>

        {/* Live Metrics Pill Strip */}
        <div className="relative z-10 mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-400">Gemini AI Engine:</span>
            <span className="text-emerald-400 font-bold">100% Operational</span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-slate-400">Active Exams:</span>
            <span className="text-white font-bold">{stats?.activeExaminations || 0}</span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-slate-400">Evaluated Copies:</span>
            <span className="text-indigo-300 font-bold">{stats?.completedEvaluations || 0}</span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-slate-400">Active Setters:</span>
            <span className="text-white font-bold">{stats?.totalSetters || 0}</span>
          </div>
        </div>
      </div>

      {/* Pending Approvals Alert Banner */}
      {stats?.pendingPaperApprovals > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg shadow-amber-950/20">
          <div className="flex items-center space-x-3.5">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-200">
                {stats.pendingPaperApprovals} Question Paper(s) Awaiting Administrative Approval
              </p>
              <p className="text-xs text-amber-300/80 mt-0.5">
                Faculty setters have finalized papers requiring syllabus conformity sign-off before examination scheduling.
              </p>
            </div>
          </div>
          <Link to="/admin/question-papers">
            <Button
              variant="outline"
              size="sm"
              className="border-amber-500/40 text-amber-200 hover:bg-amber-500/10 shrink-0 font-semibold"
            >
              Review Question Papers
            </Button>
          </Link>
        </div>
      )}

      {/* Primary Executive KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Examinations"
          value={stats?.totalExaminations || 0}
          subtitle={`${stats?.activeExaminations || 0} active / ${stats?.completedExaminations || 0} completed`}
          icon={Calendar}
          color="indigo"
        />
        <StatCard
          title="Question Bank Repository"
          value={stats?.totalQuestions || 0}
          subtitle="Rubric mapped questions"
          icon={HelpCircle}
          color="sky"
        />
        <StatCard
          title="Answer Copies"
          value={stats?.totalAnswerCopies || 0}
          subtitle={`${stats?.completedEvaluations || 0} evaluated`}
          icon={FileCheck}
          color="emerald"
        />
        <StatCard
          title="Pending Evaluations"
          value={stats?.pendingEvaluations || 0}
          subtitle="Manual & AI in queue"
          icon={Clock}
          color="amber"
        />
      </div>

      {/* Personnel Overview KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <StatCard
          title="Assigned Exam Setters"
          value={stats?.totalSetters || 0}
          subtitle="Syllabus and assessment authors"
          icon={Users}
          color="purple"
        />
        <StatCard
          title="Authorized Evaluators"
          value={stats?.totalEvaluators || 0}
          subtitle="Subject domain faculty experts"
          icon={UserCheck}
          color="emerald"
        />
      </div>

      {/* Workflow Navigation Command Cards */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Core Workflows & Orchestration
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Link
            to="/admin/examinations"
            className="surface-card surface-hover p-6 rounded-2xl flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold font-mono tracking-wider uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Phase 1
                </span>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
              </div>
              <h4 className="text-base font-bold text-white tracking-tight">
                Exam Creation & Paper Setters
              </h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Establish academic examinations, assign faculty setters, track paper submissions, and approve syllabus rubrics.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-800/80 text-[11px] font-semibold text-indigo-400 flex items-center space-x-1">
              <span>Manage examinations</span>
              <span>→</span>
            </div>
          </Link>

          <Link
            to="/admin/copy-assignment"
            className="surface-card surface-hover p-6 rounded-2xl flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold font-mono tracking-wider uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Phase 2
                </span>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
              </div>
              <h4 className="text-base font-bold text-white tracking-tight">
                Copy Assignment & Evaluation
              </h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Select bulk random copies for 100% human Manual Check or automated Multimodal Gemini AI rubric evaluation.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-800/80 text-[11px] font-semibold text-emerald-400 flex items-center space-x-1">
              <span>Open assignment hub</span>
              <span>→</span>
            </div>
          </Link>

          <Link
            to="/admin/results"
            className="surface-card surface-hover p-6 rounded-2xl flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold font-mono tracking-wider uppercase bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  Phase 3
                </span>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
              </div>
              <h4 className="text-base font-bold text-white tracking-tight">
                Results & Official Publication
              </h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Inspect question-wise scores for all evaluated copies (Manual & AI), verify grades, and officially publish results.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-800/80 text-[11px] font-semibold text-purple-400 flex items-center space-x-1">
              <span>View evaluated copies</span>
              <span>→</span>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Examinations Table */}
      <div className="surface-card rounded-2xl overflow-hidden shadow-xl">
        <div className="p-5 sm:p-6 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/40">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Recent Examinations</h3>
            <p className="text-xs text-slate-400 mt-0.5">Live lifecycle progress and subject tracking</p>
          </div>
          <Link
            to="/admin/examinations"
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center space-x-1"
          >
            <span>View All</span>
            <span>→</span>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-5">Examination</th>
                <th className="py-3.5 px-5">Subject</th>
                <th className="py-3.5 px-5">Max Marks</th>
                <th className="py-3.5 px-5">Assigned Setter</th>
                <th className="py-3.5 px-5">Lifecycle Status</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {recentExams.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-10 text-center text-slate-500 font-medium">
                    No examinations recorded yet. Click "Create Examination" to begin.
                  </td>
                </tr>
              ) : (
                recentExams.map((exam) => (
                  <tr key={exam._id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-5 font-semibold text-white">
                      <div className="text-sm font-bold tracking-tight">{exam.name}</div>
                      <span className="text-[10px] text-slate-400 font-mono">Code: {exam.code}</span>
                    </td>
                    <td className="py-4 px-5">
                      <span className="font-semibold text-slate-200">{exam.subject}</span>
                    </td>
                    <td className="py-4 px-5 font-mono font-bold text-white">
                      {exam.maxMarks} marks
                    </td>
                    <td className="py-4 px-5">
                      {exam.assignedSetter ? (
                        <div className="flex items-center space-x-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span className="text-slate-200 font-medium">{exam.assignedSetter.name}</span>
                        </div>
                      ) : (
                        <span className="text-amber-400/80 italic text-[11px]">Unassigned</span>
                      )}
                    </td>
                    <td className="py-4 px-5">
                      <Badge status={exam.status}>{exam.status.replace('_', ' ')}</Badge>
                    </td>
                    <td className="py-4 px-5 text-right">
                      <Link
                        to="/admin/examinations"
                        className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        Manage →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
