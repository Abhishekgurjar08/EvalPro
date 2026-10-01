import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../context/ToastContext';
import { Clock, Award, FileCheck, ArrowRight } from 'lucide-react';

const MyAttempts = () => {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    fetchAttempts();
  }, []);

  const fetchAttempts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/exams/my-attempts');
      if (res.data.success) {
        setAttempts(res.data.attempts || []);
      }
    } catch (err) {
      showToast('Failed to load examination attempts', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="My Examination Submissions"
        subtitle="Track submitted digital answer copies, audit timestamps, and evaluation progression."
        breadcrumb="Candidate Records"
      />

      {loading ? (
        <LoadingSpinner fullPage text="Retrieving candidate examination records..." />
      ) : attempts.length === 0 ? (
        <EmptyState
          title="No exam submissions found"
          message="Once you submit a scheduled examination, your digital answer copy and evaluation status will appear here."
          action={
            <Link to="/student/exams">
              <Button variant="primary">Browse Available Exams</Button>
            </Link>
          }
        />
      ) : (
        <div className="surface-card rounded-xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Examination</th>
                  <th className="py-3.5 px-4">Subject</th>
                  <th className="py-3.5 px-4">Copy ID</th>
                  <th className="py-3.5 px-4">Submitted At</th>
                  <th className="py-3.5 px-4">Evaluation Status</th>
                  <th className="py-3.5 px-4 text-right">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {attempts.map((att) => (
                  <tr key={att._id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-4 font-semibold text-white">
                      <div>{att.examination?.name}</div>
                      <span className="text-[10px] text-slate-500 font-mono">{att.examination?.code}</span>
                    </td>
                    <td className="py-4 px-4 text-slate-300">{att.examination?.subject}</td>
                    <td className="py-4 px-4 font-mono font-bold text-indigo-400">
                      {att.copy?.copyId || '—'}
                    </td>
                    <td className="py-4 px-4 font-mono text-slate-400 text-[11px]">
                      {att.submittedAt ? new Date(att.submittedAt).toLocaleString() : 'In Progress'}
                    </td>
                    <td className="py-4 px-4">
                      {att.copy?.evaluationStatus ? (
                        <Badge status={att.copy.evaluationStatus}>{att.copy.evaluationStatus}</Badge>
                      ) : (
                        <Badge status="PENDING">Under Evaluation</Badge>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right">
                      {att.copy?.evaluationStatus === 'COMPLETED' ? (
                        <Link to="/student/results">
                          <Button size="sm" variant="outline" icon={Award}>
                            View Result
                          </Button>
                        </Link>
                      ) : (
                        <span className="text-slate-500 italic text-xs">Evaluation in progress</span>
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

export default MyAttempts;
