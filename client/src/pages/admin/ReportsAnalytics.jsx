import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import Badge from '../../components/Badge';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useToast } from '../../context/ToastContext';
import { BarChart3, Sparkles, UserCheck, Calendar, CheckCircle2, TrendingUp, AlertTriangle } from 'lucide-react';

const ReportsAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reports/comprehensive');
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      showToast('Failed to load comprehensive analytics', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullPage text="Synthesizing system-wide examination metrics..." />;
  }

  const { examReports = [], evaluatorReports = [], aiMetrics = {} } = data || {};

  return (
    <div>
      <PageHeader
        title="Institutional Reports & Audit Analytics"
        subtitle="Examine institutional completion rates, faculty evaluator workloads, and empirical AI vs Human evaluator comparison metrics."
        breadcrumb="Analytics & Intelligence"
      />

      {/* AI Evaluation Comparison KPI Strip */}
      <div className="mb-8">
        <div className="flex items-center space-x-2 text-sm font-bold text-white mb-4">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>AI vs Evaluator Comparative Accuracy & Acceptance</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            title="Total AI Consultations"
            value={aiMetrics.totalAICalls || 0}
            subtitle={`${aiMetrics.evaluatedComparisons || 0} finalized by evaluators`}
            icon={Sparkles}
            color="indigo"
          />
          <StatCard
            title="Evaluator Acceptance Rate"
            value={`${aiMetrics.acceptanceRate || 0}%`}
            subtitle={`${aiMetrics.acceptedCount || 0} exact suggestions accepted`}
            icon={CheckCircle2}
            color="emerald"
          />
          <StatCard
            title="Evaluator Modifications"
            value={aiMetrics.modifiedCount || 0}
            subtitle="Marks fine-tuned by faculty"
            icon={AlertTriangle}
            color="amber"
          />
          <StatCard
            title="Avg Mark Deviation"
            value={`±${aiMetrics.averageMarkDifference || 0}`}
            subtitle="Human evaluator vs AI score delta"
            icon={TrendingUp}
            color="purple"
          />
        </div>
      </div>

      {/* Detailed AI vs Human Comparison Table */}
      <div className="surface-card rounded-xl border border-slate-800 mb-10 overflow-hidden">
        <div className="p-5 border-b border-slate-800 bg-slate-900/50">
          <h3 className="text-sm font-semibold text-slate-100 tracking-tight">
            Raw Empirical AI vs Evaluator Comparison Log
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Transparent question-by-question scoring comparison showing AI suggested marks vs human final decision.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Evaluated Question</th>
                <th className="py-3.5 px-4">Max Marks</th>
                <th className="py-3.5 px-4">AI Suggested</th>
                <th className="py-3.5 px-4">Evaluator Final</th>
                <th className="py-3.5 px-4">Score Delta</th>
                <th className="py-3.5 px-4">Faculty Action</th>
                <th className="py-3.5 px-4 text-right">Engine Model</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {aiMetrics.comparisons?.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-500">
                    No AI evaluation comparisons recorded yet. Run AI grading in Evaluator workspace to generate comparison data.
                  </td>
                </tr>
              ) : (
                aiMetrics.comparisons?.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-white max-w-sm truncate">
                      {c.questionText}
                    </td>
                    <td className="py-3.5 px-4 font-mono">{c.maxMarks}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-400">
                      {c.aiSuggestedMarks}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                      {c.evaluatorFinalMarks !== null ? c.evaluatorFinalMarks : '—'}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      {c.difference !== undefined ? (
                        <span className={c.difference === 0 ? 'text-emerald-400' : 'text-amber-400'}>
                          {c.difference === 0 ? '0 (Identical)' : `±${c.difference}`}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {c.evaluatorAction === 'ACCEPTED' ? (
                        <Badge status="SUCCESS">Accepted</Badge>
                      ) : c.evaluatorAction === 'MODIFIED' ? (
                        <Badge status="WARNING">Modified</Badge>
                      ) : (
                        <Badge status="PENDING">Pending</Badge>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-[10px] text-slate-400">
                      {c.modelUsed}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two Column Section: Exam Performance & Evaluator Workload */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Examination Summary */}
        <div className="surface-card rounded-xl border border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-800 bg-slate-900/50">
            <h4 className="text-xs font-semibold text-slate-200 tracking-tight flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-indigo-400" />
              <span>Examination Status & Completion Rates</span>
            </h4>
          </div>

          <div className="divide-y divide-slate-800/60 text-xs">
            {examReports.map((ex) => (
              <div key={ex.id} className="p-4 hover:bg-slate-800/30 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-semibold text-slate-100">{ex.name}</span>
                    <span className="text-[11px] text-slate-400 ml-2 font-mono">({ex.code})</span>
                  </div>
                  <Badge status={ex.status}>{ex.status}</Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-slate-400 pt-2 border-t border-slate-800/60">
                  <div>
                    <span>Total Copies:</span>{' '}
                    <strong className="text-white font-mono">{ex.totalCopies}</strong>
                  </div>
                  <div>
                    <span>Completed:</span>{' '}
                    <strong className="text-emerald-400 font-mono">{ex.completedCopies}</strong>
                  </div>
                  <div>
                    <span>Pending:</span>{' '}
                    <strong className="text-amber-400 font-mono">{ex.pendingCopies}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Evaluator Workload Table */}
        <div className="surface-card rounded-xl border border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-800 bg-slate-900/50">
            <h4 className="text-xs font-semibold text-slate-200 tracking-tight flex items-center space-x-2">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>Faculty Evaluator Workloads</span>
            </h4>
          </div>

          <div className="divide-y divide-slate-800/60 text-xs">
            {evaluatorReports.map((ev) => (
              <div key={ev.id} className="p-4 hover:bg-slate-800/30 transition-colors">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="font-bold text-white">{ev.name}</span>
                  <span className="text-slate-400 text-[11px]">{ev.department}</span>
                </div>
                <div className="flex justify-between text-slate-400 text-[11px] mb-1">
                  <span>
                    Allocated: <strong className="text-white font-mono">{ev.assigned}</strong> / Max{' '}
                    {ev.maxWorkload}
                  </span>
                  <span>{ev.completionRate}% finished</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${ev.completionRate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsAnalytics;
