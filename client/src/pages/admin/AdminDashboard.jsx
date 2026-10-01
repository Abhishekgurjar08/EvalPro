import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  Calendar,
  Users,
  UserCheck,
  GraduationCap,
  HelpCircle,
  FileCheck,
  Clock,
  CheckCircle2,
  FileText,
  ArrowRight,
  Sparkles,
  Layers,
  Award
} from 'lucide-react';

const AdminDashboard = () => {
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
    return <LoadingSpinner fullPage text="Gathering system analytics..." />;
  }

  return (
    <div>
      <PageHeader
        title="Admin Examination Control Center"
        subtitle="Manage end-to-end examination lifecycles, setter assignments, evaluator allocations, and AI-assisted grading."
        breadcrumb="Executive Oversight"
        action={
          <div className="flex space-x-2">
            <Link to="/admin/examinations">
              <Button variant="primary" icon={Calendar}>
                Create / Manage Exams
              </Button>
            </Link>
            <Link to="/admin/copy-assignment">
              <Button variant="secondary" icon={FileCheck}>
                Assign Copies
              </Button>
            </Link>
          </div>
        }
      />

      {/* Pending Approvals Alert Banner */}
      {stats?.pendingPaperApprovals > 0 && (
        <div className="mb-8 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-300">
                {stats.pendingPaperApprovals} Question Paper(s) Awaiting Review
              </p>
              <p className="text-xs text-amber-400/80">
                Exam setters have submitted question papers requiring administrative syllabus approval.
              </p>
            </div>
          </div>
          <Link to="/admin/question-papers">
            <Button variant="outline" size="sm" className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10">
              Review Question Papers
            </Button>
          </Link>
        </div>
      )}

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard
          title="Total Examinations"
          value={stats?.totalExaminations || 0}
          subtitle={`${stats?.activeExaminations || 0} active / ${stats?.completedExaminations || 0} completed`}
          icon={Calendar}
          color="indigo"
        />
        <StatCard
          title="Total Question Bank"
          value={stats?.totalQuestions || 0}
          subtitle="Descriptive & rubric mapped"
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
          subtitle="Assigned to evaluators"
          icon={Clock}
          color="amber"
        />
      </div>

      {/* User Hierarchy KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
        <StatCard
          title="Exam Setters"
          value={stats?.totalSetters || 0}
          subtitle="Content and question architects"
          icon={Users}
          color="purple"
        />
        <StatCard
          title="Faculty Evaluators"
          value={stats?.totalEvaluators || 0}
          subtitle="Subject specialized faculty"
          icon={UserCheck}
          color="indigo"
        />
      </div>

      {/* Quick Flow Jump Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <Link
          to="/admin/examinations"
          className="surface-card p-5 rounded-xl border border-slate-800 transition-all duration-200 hover:border-slate-700 hover:bg-slate-900/90 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">Workflow A</span>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
          </div>
          <h4 className="text-sm font-semibold text-slate-100 mt-2">Exam Creation & Setters</h4>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Create academic exams, assign setters, monitor acceptance, and review submitted question papers.
          </p>
        </Link>

        <Link
          to="/admin/copy-assignment"
          className="surface-card p-5 rounded-xl border border-slate-800 transition-all duration-200 hover:border-slate-700 hover:bg-slate-900/90 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Workflow C</span>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
          </div>
          <h4 className="text-sm font-semibold text-slate-100 mt-2">Manual & Digital Copy Assignment</h4>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Filter student copies by examination and subject, match with faculty workload, and assign answer sheets.
          </p>
        </Link>

        <Link
          to="/admin/results"
          className="surface-card p-5 rounded-xl border border-slate-800 transition-all duration-200 hover:border-slate-700 hover:bg-slate-900/90 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-purple-400 uppercase tracking-wider">Workflow E</span>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all" />
          </div>
          <h4 className="text-sm font-semibold text-slate-100 mt-2">Results & Official Publication</h4>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Review computed percentage and grades, audit marks distribution, and authorize public release to students.
          </p>
        </Link>
      </div>

      {/* Recent Examinations Table */}
      <div className="surface-card rounded-xl border border-slate-800 overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Recent Examinations</h3>
            <p className="text-xs text-slate-400 mt-0.5">Live status and lifecycle transition tracking</p>
          </div>
          <Link to="/admin/examinations" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300">
            View All Examinations →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Examination</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Max Marks</th>
                <th className="py-3 px-4">Assigned Setter</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {recentExams.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500">
                    No examinations recorded yet.
                  </td>
                </tr>
              ) : (
                recentExams.map((exam) => (
                  <tr key={exam._id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-white">
                      <div>{exam.name}</div>
                      <span className="text-[10px] text-slate-500 font-mono">{exam.code}</span>
                    </td>
                    <td className="py-3.5 px-4">{exam.subject}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-200">{exam.maxMarks}</td>
                    <td className="py-3.5 px-4">
                      {exam.assignedSetter ? (
                        <span className="text-slate-200">{exam.assignedSetter.name}</span>
                      ) : (
                        <span className="text-amber-400/80 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge status={exam.status}>{exam.status.replace('_', ' ')}</Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/admin/examinations`}
                        className="text-indigo-400 hover:text-indigo-300 font-medium hover:underline"
                      >
                        Manage
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
