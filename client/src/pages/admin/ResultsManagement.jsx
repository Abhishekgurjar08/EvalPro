import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../context/ToastContext';
import { Award, Globe, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

const ResultsManagement = () => {
  const [results, setResults] = useState([]);
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [resultsRes, examsRes] = await Promise.all([
        api.get('/results'),
        api.get('/examinations')
      ]);

      if (resultsRes.data.success) setResults(resultsRes.data.results || []);
      if (examsRes.data.success) {
        setExams(examsRes.data.examinations || []);
        if (examsRes.data.examinations.length > 0) {
          setSelectedExamId(examsRes.data.examinations[0]._id);
        }
      }
    } catch (err) {
      showToast('Failed to load examination results', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePublishResults = async () => {
    if (!selectedExamId) return;

    const exam = exams.find((e) => e._id === selectedExamId);
    if (!window.confirm(`Are you sure you want to officially publish results for ${exam?.name}? Students will be able to view their marks and grades immediately.`)) {
      return;
    }

    try {
      setPublishing(true);
      const res = await api.post(`/results/publish/${selectedExamId}`);
      if (res.data.success) {
        showToast(`Results published successfully for ${res.data.publishedCount} students!`, 'success');
        fetchInitialData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error publishing results', 'error');
    } finally {
      setPublishing(false);
    }
  };

  const filteredResults = selectedExamId
    ? results.filter((r) => r.examination?._id === selectedExamId)
    : results;

  const unpublishedCount = filteredResults.filter((r) => !r.published).length;
  const publishedCount = filteredResults.filter((r) => r.published).length;

  return (
    <div>
      <PageHeader
        title="Examination Results & Official Publication"
        subtitle="Review computed percentage, grades, and pass/fail statistics before authorizing public release to candidates."
        breadcrumb="Academic Records"
        action={
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={fetchInitialData}>
            Refresh
          </Button>
        }
      />

      {/* Control Banner */}
      <div className="surface-card p-5 rounded-xl border border-slate-800 mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-full md:w-auto">
          <label className="block text-xs font-semibold text-slate-400 mb-1">
            Filter by Examination
          </label>
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="w-full md:w-96 bg-slate-900/90 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-medium"
          >
            {exams.map((ex) => (
              <option key={ex._id} value={ex._id}>
                {ex.code} - {ex.name} ({ex.subject})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-4 w-full md:w-auto justify-between md:justify-end">
          <div className="text-right text-xs">
            <span className="text-slate-400 block">Publication Status:</span>
            <span className="font-bold text-white">
              {publishedCount} Published / <span className="text-amber-400">{unpublishedCount} Pending</span>
            </span>
          </div>

          <Button
            variant="success"
            size="md"
            icon={Globe}
            loading={publishing}
            disabled={unpublishedCount === 0}
            onClick={handlePublishResults}
          >
            Publish Results ({unpublishedCount})
          </Button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner fullPage text="Retrieving computed results..." />
      ) : filteredResults.length === 0 ? (
        <EmptyState
          title="No evaluated results found"
          message="Once faculty evaluators complete answer copy scoring, computed results will appear here for audit and publishing."
        />
      ) : (
        <div className="surface-card rounded-xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Roll Number</th>
                  <th className="py-3.5 px-4">Marks Awarded</th>
                  <th className="py-3.5 px-4">Percentage</th>
                  <th className="py-3.5 px-4">Grade</th>
                  <th className="py-3.5 px-4">Outcome</th>
                  <th className="py-3.5 px-4 text-right">Publication State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredResults.map((res) => (
                  <tr key={res._id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-4 font-semibold text-white">
                      <div>{res.student?.name}</div>
                      <span className="text-[10px] text-slate-500">{res.student?.email}</span>
                    </td>
                    <td className="py-4 px-4 font-mono text-slate-300">
                      {res.student?.studentRollNo || '—'}
                    </td>
                    <td className="py-4 px-4 font-mono font-bold text-white">
                      {res.totalMarks} / {res.maxMarks}
                    </td>
                    <td className="py-4 px-4 font-mono font-bold text-indigo-400">
                      {res.percentage}%
                    </td>
                    <td className="py-4 px-4">
                      <span className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 font-bold font-mono text-sm text-white flex items-center justify-center">
                        {res.grade}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      {res.passed ? (
                        <span className="text-emerald-400 font-bold flex items-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Passed</span>
                        </span>
                      ) : (
                        <span className="text-rose-400 font-bold flex items-center space-x-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Failed</span>
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right">
                      {res.published ? (
                        <Badge status="PUBLISHED">Published</Badge>
                      ) : (
                        <Badge status="PENDING">Draft / Unreleased</Badge>
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

export default ResultsManagement;
