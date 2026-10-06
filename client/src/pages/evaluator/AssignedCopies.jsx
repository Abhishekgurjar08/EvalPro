import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../context/ToastContext';
import { FileCheck, ArrowRight, Filter, RefreshCw, CheckCircle2, UserCheck, Clock } from 'lucide-react';

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
    <div className="space-y-6">
      <PageHeader
        title="Assigned Answer Copies"
        subtitle="Review assigned student answer copies, examine handwritten submissions, and record question-wise marks."
        breadcrumb="Faculty Evaluation Portal"
        action={
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={fetchAssigned}>
            Refresh
          </Button>
        }
      />

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-4">
        <button
          onClick={() => setStatusFilter('')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            statusFilter === ''
              ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-500'
              : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          All Assigned ({stats?.total || 0})
        </button>

        <button
          onClick={() => setStatusFilter('ASSIGNED')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            statusFilter === 'ASSIGNED'
              ? 'bg-amber-600 text-white shadow-sm ring-1 ring-amber-500'
              : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          Pending Evaluation ({stats?.pending || 0})
        </button>

        <button
          onClick={() => setStatusFilter('IN_PROGRESS')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            statusFilter === 'IN_PROGRESS'
              ? 'bg-purple-600 text-white shadow-sm ring-1 ring-purple-500'
              : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          In Progress ({stats?.inProgress || 0})
        </button>

        <button
          onClick={() => setStatusFilter('COMPLETED')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            statusFilter === 'COMPLETED'
              ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-500'
              : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          Completed ({stats?.completed || 0})
        </button>
      </div>

      {loading ? (
        <LoadingSpinner fullPage text="Retrieving assigned answer sheets..." />
      ) : copies.length === 0 ? (
        <EmptyState
          title="No answer copies in this view"
          message="Switch the filter tabs above or check back when the Admin assigns copies to your faculty profile."
          icon={FileCheck}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {copies.map((copy) => {
            const isCompleted = copy.evaluationStatus === 'COMPLETED';

            return (
              <div
                key={copy._id}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono font-bold text-slate-900 text-base block tracking-tight">
                        {copy.copyId}
                      </span>
                      <span className="text-xs text-indigo-600 font-semibold">{copy.subject}</span>
                    </div>
                    <Badge status={copy.evaluationStatus}>{copy.evaluationStatus}</Badge>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Examination:</span>
                      <span className="text-slate-800 font-medium truncate max-w-[180px]">
                        {copy.examination?.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Evaluation Flow:</span>
                      <span className="font-mono text-emerald-600 font-semibold flex items-center space-x-1">
                        <UserCheck className="w-3 h-3" />
                        <span>Manual Grading</span>
                      </span>
                    </div>
                    {copy.candidateName && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Candidate:</span>
                        <span className="text-slate-700 font-medium">
                          {copy.candidateName}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                  {copy.totalAwardedMarks !== null && copy.totalAwardedMarks !== undefined ? (
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                        Final Score
                      </span>
                      <span className="font-mono font-bold text-emerald-600 text-base">
                        {copy.totalAwardedMarks} / {copy.totalMaxMarks} ({copy.percentage}%)
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1.5 text-xs text-amber-600 font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Pending evaluation</span>
                    </div>
                  )}

                  <Link to={`/evaluator/evaluate/${copy._id}`}>
                    <Button
                      size="sm"
                      variant={isCompleted ? 'secondary' : 'primary'}
                      icon={isCompleted ? CheckCircle2 : ArrowRight}
                      className="font-semibold shadow-xs"
                    >
                      {isCompleted ? 'Review Score' : 'Evaluate Now'}
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
