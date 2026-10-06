import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../context/ToastContext';
import { Clock, Eye, CheckCircle2, ArrowRight } from 'lucide-react';

const EvaluationHistory = () => {
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await api.get('/evaluations/history');
      if (res.data.success) {
        setEvaluations(res.data.evaluations || []);
      }
    } catch (err) {
      showToast('Failed to load evaluation history', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Historical Evaluation Records"
        subtitle="Chronological audit history of all draft saves and finalized examinations evaluated by your account."
        breadcrumb="Faculty Archive"
      />

      {loading ? (
        <LoadingSpinner fullPage text="Retrieving evaluation records..." />
      ) : evaluations.length === 0 ? (
        <EmptyState
          title="No evaluation history recorded"
          message="Once you start scoring assigned answer copies, historical audit snapshots will appear here."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Answer Copy ID</th>
                  <th className="py-3.5 px-4">Examination</th>
                  <th className="py-3.5 px-4">Evaluation Mode</th>
                  <th className="py-3.5 px-4">Marks Awarded</th>
                  <th className="py-3.5 px-4">State</th>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {evaluations.map((ev) => (
                  <tr key={ev._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-4 font-mono font-bold text-slate-900">
                      {ev.answerCopy?.copyId || 'COPY'}
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-semibold text-slate-900">{ev.examination?.name}</p>
                      <p className="text-[11px] text-indigo-600 font-medium">{ev.examination?.subject}</p>
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono bg-slate-100 border border-slate-200 text-slate-700">
                        {ev.evaluationMode}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-mono font-bold text-emerald-600">
                      {ev.totalMarks} / {ev.maxPossibleMarks} ({ev.percentage}%)
                    </td>
                    <td className="py-4 px-4">
                      {ev.isDraft ? (
                        <Badge status="IN_PROGRESS">Draft Saved</Badge>
                      ) : (
                        <Badge status="COMPLETED">Submitted Final</Badge>
                      )}
                    </td>
                    <td className="py-4 px-4 text-slate-500 font-mono text-[11px]">
                      {new Date(ev.submittedAt || ev.updatedAt).toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Link to={`/evaluator/evaluate/${ev.answerCopy?._id || ev.answerCopy}`}>
                        <Button size="sm" variant="outline" icon={Eye}>
                          Inspect
                        </Button>
                      </Link>
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

export default EvaluationHistory;
