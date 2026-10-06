import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../context/ToastContext';
import { ShieldAlert, RefreshCw, Filter } from 'lucide-react';

const AuditLogsView = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = {};
      if (actionFilter) params.action = actionFilter;
      const res = await api.get('/audit-logs', { params });
      if (res.data.success) {
        setLogs(res.data.logs || []);
      }
    } catch (err) {
      showToast('Failed to load system audit logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="System Security & Workflow Audit Logs"
        subtitle="Immutable chronological history of all lifecycle transitions, submissions, approvals, copy assignments, and evaluation records."
        breadcrumb="Compliance & Integrity"
        action={
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={fetchLogs}>
            Refresh
          </Button>
        }
      />

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/20"
          >
            <option value="">All Security & Workflow Actions</option>
            <option value="USER_LOGIN">User Logins</option>
            <option value="EXAM_CREATED">Exam Created</option>
            <option value="SETTER_ASSIGNED">Setter Assigned</option>
            <option value="SETTER_ACCEPTED">Setter Accepted</option>
            <option value="SETTER_REJECTED">Setter Rejected</option>
            <option value="QUESTION_PAPER_SUBMITTED">Paper Submitted</option>
            <option value="QUESTION_PAPER_APPROVED">Paper Approved</option>
            <option value="QUESTION_PAPER_REJECTED">Paper Rejected</option>
            <option value="EXAM_SUBMITTED">Exam Submitted</option>
            <option value="ANSWER_COPIES_ASSIGNED">Copies Assigned</option>
            <option value="EVALUATION_COMPLETED">Evaluation Completed</option>
            <option value="RESULTS_PUBLISHED">Results Published</option>
          </select>
        </div>
        <span className="text-xs text-slate-500 font-mono font-medium">{logs.length} logged events</span>
      </div>

      {loading ? (
        <LoadingSpinner fullPage text="Retrieving immutable audit records..." />
      ) : logs.length === 0 ? (
        <EmptyState
          title="No audit logs found"
          message="System audit logs will automatically record security and operational activities here."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">Actor / Role</th>
                  <th className="py-3.5 px-4">Action Event</th>
                  <th className="py-3.5 px-4">Entity</th>
                  <th className="py-3.5 px-4">Event Metadata / Details</th>
                  <th className="py-3.5 px-4 text-right">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-mono">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-sans font-medium text-slate-900">
                      <div>{log.userName}</div>
                      <span className="text-[10px] text-indigo-600 font-mono font-semibold">{log.userRole}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-sans text-slate-800">{log.entity}</td>
                    <td className="py-3.5 px-4 font-sans text-xs text-slate-500 max-w-md truncate">
                      {JSON.stringify(log.details)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-400 text-[11px]">
                      {log.ipAddress || '127.0.0.1'}
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

export default AuditLogsView;
