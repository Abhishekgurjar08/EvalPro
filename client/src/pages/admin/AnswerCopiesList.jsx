import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../context/ToastContext';
import { FileCheck, Search, Filter, RefreshCw } from 'lucide-react';

const AnswerCopiesList = () => {
  const [copies, setCopies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { showToast } = useToast();

  useEffect(() => {
    fetchCopies();
  }, [statusFilter]);

  const fetchCopies = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      const res = await api.get('/answer-copies', { params });
      if (res.data.success) {
        setCopies(res.data.answerCopies || []);
      }
    } catch (err) {
      showToast('Failed to load answer copies', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Student Answer Copies Repository"
        subtitle="Track submitted digital answer copies, assigned evaluators, and question-wise evaluation progress."
        breadcrumb="Submissions & Tracking"
        action={
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={fetchCopies}>
            Refresh
          </Button>
        }
      />

      {/* Filter and Search */}
      <div className="surface-card p-4 rounded-xl border border-slate-800 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            placeholder="Search by Copy ID or subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchCopies()}
            className="w-full bg-slate-900/90 border border-slate-700/80 rounded-lg pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900/90 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Evaluation Statuses</option>
            <option value="PENDING">Pending Assignment</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress (Drafted)</option>
            <option value="COMPLETED">Completed</option>
          </select>
          <Button variant="outline" size="sm" onClick={fetchCopies}>
            Apply
          </Button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner fullPage text="Retrieving digital answer copies..." />
      ) : copies.length === 0 ? (
        <EmptyState
          title="No answer copies found"
          message="Submitted examination copies will appear here for audit, assignment and tracking."
        />
      ) : (
        <div className="surface-card rounded-xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Copy ID</th>
                  <th className="py-3.5 px-4">Candidate</th>
                  <th className="py-3.5 px-4">Examination & Subject</th>
                  <th className="py-3.5 px-4">Mode</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Assigned Evaluator</th>
                  <th className="py-3.5 px-4 text-right">Awarded Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {copies.map((copy) => (
                  <tr key={copy._id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-4 font-mono font-bold text-white">
                      {copy.copyId}
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-semibold text-slate-200">{copy.student?.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{copy.student?.studentRollNo}</p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-white font-medium">{copy.examination?.name}</p>
                      <p className="text-[11px] text-indigo-400">{copy.subject}</p>
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 border border-slate-800 text-slate-300">
                        {copy.evaluationMode}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <Badge status={copy.evaluationStatus}>{copy.evaluationStatus}</Badge>
                    </td>
                    <td className="py-4 px-4">
                      {copy.assignedEvaluator ? (
                        <div>
                          <p className="font-medium text-slate-200">{copy.assignedEvaluator.name}</p>
                          <p className="text-[10px] text-slate-500">{copy.assignedEvaluator.email}</p>
                        </div>
                      ) : (
                        <span className="text-amber-400/80 italic font-medium">Unassigned</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right">
                      {copy.totalAwardedMarks !== null && copy.totalAwardedMarks !== undefined ? (
                        <div className="font-mono font-bold text-emerald-400 text-sm">
                          {copy.totalAwardedMarks} / {copy.totalMaxMarks}
                          <span className="text-[10px] text-slate-400 font-normal ml-1">
                            ({copy.percentage}%)
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">Not evaluated</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnswerCopiesList;
