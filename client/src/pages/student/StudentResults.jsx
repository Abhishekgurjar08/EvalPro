import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../context/ToastContext';
import { Award, Eye, CheckCircle2, AlertCircle, FileText, Check } from 'lucide-react';

const StudentResults = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedResult, setSelectedResult] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailedData, setDetailedData] = useState(null);

  const { showToast } = useToast();

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const res = await api.get('/results');
      if (res.data.success) {
        setResults(res.data.results || []);
      }
    } catch (err) {
      showToast('Failed to load published examination results', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenMarksheet = async (resItem) => {
    setSelectedResult(resItem);
    try {
      setDetailLoading(true);
      const res = await api.get(`/results/${resItem._id}`);
      if (res.data.success) {
        setDetailedData(res.data);
      }
    } catch (err) {
      showToast('Error retrieving detailed marksheet breakdown', 'error');
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Official Examination Results & Scorecards"
        subtitle="Access validated academic scores, question-by-question examiner feedback, and approved grade transcripts."
        breadcrumb="Academic Results"
      />

      {loading ? (
        <LoadingSpinner fullPage text="Retrieving officially published results..." />
      ) : results.length === 0 ? (
        <EmptyState
          title="No published results available yet"
          message="Your submitted examinations are currently undergoing faculty evaluation. Published scorecards will appear here once officially approved by the Examination Control Division."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {results.map((res) => (
            <div
              key={res._id}
              className="surface-card p-5 rounded-xl border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all duration-200"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                      {res.examination?.code}
                    </span>
                    <h3 className="text-lg font-bold text-white tracking-tight mt-1.5 leading-snug">
                      {res.examination?.name}
                    </h3>
                    <p className="text-xs text-slate-400">{res.examination?.subject}</p>
                  </div>
                  <div className="text-right">
                    <span className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 font-bold font-mono text-lg text-emerald-400 flex items-center justify-center shadow-inner">
                      {res.grade}
                    </span>
                  </div>
                </div>

                {/* Score Summary Banner */}
                <div className="mt-5 p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Awarded Score</span>
                    <span className="font-mono font-bold text-xl text-white">
                      {res.totalMarks} / {res.maxMarks}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Percentage</span>
                    <span className="font-mono font-bold text-xl text-indigo-400">
                      {res.percentage}%
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                  <span>Outcome:</span>
                  {res.passed ? (
                    <span className="text-emerald-400 font-bold flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Passed with Distinction</span>
                    </span>
                  ) : (
                    <span className="text-rose-400 font-bold flex items-center space-x-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Re-evaluation Required</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-mono">
                  Released: {new Date(res.publishedAt || res.createdAt).toLocaleDateString()}
                </span>
                <Button
                  size="sm"
                  variant="primary"
                  icon={Eye}
                  onClick={() => handleOpenMarksheet(res)}
                >
                  View Question Breakdown
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detailed Marksheet Modal */}
      <Modal
        isOpen={!!selectedResult}
        onClose={() => {
          setSelectedResult(null);
          setDetailedData(null);
        }}
        title={`Official Marksheet Breakdown - ${selectedResult?.examination?.name}`}
        maxWidth="max-w-3xl"
      >
        {detailLoading ? (
          <LoadingSpinner text="Retrieving question breakdown and examiner comments..." />
        ) : detailedData ? (
          <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-2 text-xs">
            {/* Top Transcript Card */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <p className="text-white font-bold text-sm">{detailedData.result?.student?.name}</p>
                <p className="text-slate-400 font-mono text-[11px]">
                  Roll No: {detailedData.result?.student?.studentRollNo} • {detailedData.result?.examination?.subject}
                </p>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-xl text-emerald-400">
                  {detailedData.result?.totalMarks} / {detailedData.result?.maxMarks} ({detailedData.result?.percentage}%)
                </span>
                <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">
                  Final Grade: {detailedData.result?.grade}
                </span>
              </div>
            </div>

            {/* Overall Examiner Feedback */}
            {detailedData.evaluation?.overallComments && (
              <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/20 text-xs text-slate-200">
                <strong className="text-indigo-400 block mb-1">Faculty Examiner General Assessment:</strong>
                <p className="leading-relaxed">{detailedData.evaluation.overallComments}</p>
              </div>
            )}

            {/* Question-Wise Scores */}
            <div className="space-y-3">
              <h5 className="font-bold text-slate-200 uppercase tracking-wider">
                Question-Wise Performance Breakdown
              </h5>
              {detailedData.evaluation?.questionEvaluations?.map((qe, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-white">
                      Q{qe.questionNumber || idx + 1}. {qe.question?.questionText || 'Question'}
                    </span>
                    <span className="font-mono font-bold text-emerald-400 text-sm shrink-0 ml-3">
                      {qe.marksAwarded} / {qe.maxMarks}
                    </span>
                  </div>

                  {qe.comments && (
                    <div className="text-[11px] text-slate-400 bg-slate-900/60 p-2 rounded-lg border border-slate-800 mt-1">
                      <strong className="text-slate-300">Examiner Feedback:</strong> {qe.comments}
                    </div>
                  )}

                  {/* Rubric Criteria if evaluated */}
                  {qe.criteriaBreakdown?.length > 0 && (
                    <div className="pt-2 border-t border-slate-800/60 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {qe.criteriaBreakdown.map((crit, cIdx) => (
                        <div key={cIdx} className="text-[10px] flex justify-between text-slate-400 p-1.5 rounded bg-slate-900/40">
                          <span>{crit.criterion}</span>
                          <span className="font-mono text-indigo-400 font-semibold">
                            {crit.marksAwarded} / {crit.maxMarks}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

export default StudentResults;
