import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../context/ToastContext';
import { FileCheck, ArrowRight, Filter, RefreshCw, CheckCircle2 } from 'lucide-react';

const AssignedCopies = () => {
  const [copies, setCopies] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const { showToast } = useToast();

  useEffect(() => {
    fetchAssigned();
  }, [statusFilter]);

  const fetchAssigned = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/answer-copies/my-assigned', { params });
      if (res.data.success) {
        setCopies(res.data.answerCopies || []);
        setStats(res.data.stats);
      }
    } catch (err) {
      showToast('Failed to load assigned copies', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Assigned Answer Copies"
        subtitle="Manage and evaluate student answer copies assigned to your subject specialization."
        breadcrumb="Grading Portfolio"
        action={
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={fetchAssigned}>
            Refresh
          </Button>
        }
      />

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-6 border-b border-slate-800 pb-4">
        <button
          onClick={() => setStatusFilter('')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            statusFilter === ''
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          All Assigned ({stats?.total || 0})
        </button>

        <button
          onClick={() => setStatusFilter('ASSIGNED')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            statusFilter === 'ASSIGNED'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          Pending Evaluation ({stats?.pending || 0})
        </button>

        <button
          onClick={() => setStatusFilter('IN_PROGRESS')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            statusFilter === 'IN_PROGRESS'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          In Progress Drafts ({stats?.inProgress || 0})
        </button>

        <button
          onClick={() => setStatusFilter('COMPLETED')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            statusFilter === 'COMPLETED'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          Completed ({stats?.completed || 0})
        </button>
      </div>

      {loading ? (
        <LoadingSpinner fullPage text="Retrieving assigned answer sheets..." />
      ) : copies.length === 0 ? (
        <EmptyState
          title="No answer copies in this category"
          message="Switch status filters above to view other assigned answer copies."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {copies.map((copy) => {
            const isCompleted = copy.evaluationStatus === 'COMPLETED';

            return (
              <div
                key={copy._id}
                className="surface-card p-5 rounded-xl border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all duration-200"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono font-bold text-white text-base block">{copy.copyId}</span>
                      <span className="text-xs text-indigo-400 font-semibold">{copy.subject}</span>
                    </div>
                    <Badge status={copy.evaluationStatus}>{copy.evaluationStatus}</Badge>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Examination:</span>
                      <span className="text-white font-medium truncate max-w-[180px]">
                        {copy.examination?.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Evaluation Mode:</span>
                      <span className="font-mono text-slate-200">{copy.evaluationMode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Submission Date:</span>
                      <span className="font-mono text-slate-400">
                        {new Date(copy.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between">
                  {copy.totalAwardedMarks !== null && copy.totalAwardedMarks !== undefined ? (
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Awarded Score</span>
                      <span className="font-mono font-bold text-emerald-400 text-base">
                        {copy.totalAwardedMarks} / {copy.totalMaxMarks} ({copy.percentage}%)
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-amber-400 font-medium">Pending marks entry</span>
                  )}

                  <Link to={`/evaluator/evaluate/${copy._id}`}>
                    <Button
                      size="sm"
                      variant={isCompleted ? 'secondary' : 'primary'}
                      icon={isCompleted ? CheckCircle2 : ArrowRight}
                    >
                      {isCompleted ? 'Review Score' : 'Evaluate'}
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AssignedCopies;
