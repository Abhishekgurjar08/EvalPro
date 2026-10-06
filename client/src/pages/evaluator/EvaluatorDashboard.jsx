import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useToast } from '../../context/ToastContext';
import { FileCheck, Clock, CheckCircle2, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';

const EvaluatorDashboard = () => {
  const [data, setData] = useState({ stats: null, answerCopies: [] });
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    fetchEvaluatorData();
  }, []);

  const fetchEvaluatorData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/answer-copies/my-assigned');
      if (res.data.success) {
        setData({
          stats: res.data.stats,
          answerCopies: res.data.answerCopies || []
        });
      }
    } catch (err) {
      showToast('Failed to load evaluator dashboard', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullPage text="Gathering assigned answer copies..." />;
  }

  const { stats, answerCopies } = data;
  const pendingOrInProgress = answerCopies.filter((c) => c.evaluationStatus !== 'COMPLETED');

  return (
    <div>
      <PageHeader
        title="Faculty Evaluation Dashboard"
        subtitle="Review assigned candidate answer copies using rubric criteria, digital annotation tools, and AI-assisted marking suggestions."
        breadcrumb="Academic Assessment"
        action={
          <Link to="/evaluator/assigned-copies">
            <Button variant="primary" icon={FileCheck}>
              Open Evaluation Queue
            </Button>
          </Link>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard
          title="Total Assigned Copies"
          value={stats?.total || 0}
          subtitle="Allocated for your subject review"
          icon={FileCheck}
          color="indigo"
        />
        <StatCard
          title="Pending Evaluation"
          value={stats?.pending || 0}
          subtitle="Awaiting initial grading"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Drafts In Progress"
          value={stats?.inProgress || 0}
          subtitle="Partially evaluated drafts"
          icon={Sparkles}
          color="purple"
        />
        <StatCard
          title="Completed Evaluations"
          value={stats?.completed || 0}
          subtitle="Finalized & results computed"
          icon={CheckCircle2}
          color="emerald"
        />
      </div>

      {/* Active Evaluation Queue */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden mb-8">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 tracking-tight">Active Evaluation Queue</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Answer copies requiring grading or draft continuation ({pendingOrInProgress.length} active)
            </p>
          </div>
          <Link to="/evaluator/assigned-copies" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
            View All Assigned Copies →
          </Link>
        </div>

        {pendingOrInProgress.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-500">
            All assigned copies have been evaluated! Check back when new examinations are assigned.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {pendingOrInProgress.slice(0, 5).map((copy) => (
              <div
                key={copy._id}
                className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
              >
                <div className="flex items-center space-x-3.5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 font-mono font-bold flex items-center justify-center text-xs border border-indigo-100 shrink-0">
                    {copy.copyId.slice(-4)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900 text-sm">{copy.copyId}</span>
                      <Badge status={copy.evaluationStatus}>{copy.evaluationStatus}</Badge>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-700 border border-slate-200">
                        {copy.evaluationMode}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {copy.examination?.name} • <span className="text-indigo-600 font-semibold">{copy.subject}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  <Link to={`/evaluator/evaluate/${copy._id}`}>
                    <Button size="sm" variant="primary" icon={ArrowRight}>
                      {copy.evaluationStatus === 'IN_PROGRESS' ? 'Continue Evaluation' : 'Start Evaluating'}
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EvaluatorDashboard;
