import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../context/ToastContext';
import { Award, Globe, CheckCircle2, AlertCircle, RefreshCw, UserCheck, Sparkles, FileText } from 'lucide-react';

const ResultsManagement = () => {
  const [results, setResults] = useState([]);
  const [evaluatedCopies, setEvaluatedCopies] = useState([]);
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
      const examsRes = await api.get('/examinations');
      if (examsRes.data.success) {
        const loadedExams = examsRes.data.examinations || [];
        setExams(loadedExams);
        if (loadedExams.length > 0) {
          const firstExamId = loadedExams[0]._id;
          setSelectedExamId(firstExamId);
          await fetchResultsForExam(firstExamId);
        }
      }
    } catch (err) {
      showToast('Failed to load examinations', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedExamId) {
      fetchResultsForExam(selectedExamId);
    }
  }, [selectedExamId]);

  const fetchResultsForExam = async (examId) => {
    try {
      const res = await api.get(`/results?examinationId=${examId}`);
      if (res.data.success) {
        setResults(res.data.results || []);
        setEvaluatedCopies(res.data.evaluatedCopies || []);
      }
    } catch (err) {
      showToast('Error loading results for selected examination', 'error');
    }
  };

  const handlePublishResults = async () => {
    if (!selectedExamId) return;

    const exam = exams.find((e) => e._id === selectedExamId);
    if (
      !window.confirm(
        `Are you sure you want to officially publish results for ${exam?.name} (${exam?.subject})? All ${evaluatedCopies.length} evaluated copies will be published immediately.`
      )
    ) {
      return;
    }

    try {
      setPublishing(true);
      const res = await api.post(`/results/publish/${selectedExamId}`);
      if (res.data.success) {
        showToast(
          res.data.message || `Results published successfully for ${res.data.publishedCount} evaluated copies!`,
          'success'
        );
        // Refresh exam list and current exam results
        const examsRes = await api.get('/examinations');
        if (examsRes.data.success) setExams(examsRes.data.examinations || []);
        await fetchResultsForExam(selectedExamId);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error publishing results', 'error');
    } finally {
      setPublishing(false);
    }
  };

  const selectedExam = exams.find((e) => e._id === selectedExamId);
  const isExamPublished = selectedExam?.status === 'RESULT_PUBLISHED';

  // Compute grade helper
  const getGrade = (percentage) => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C';
    if (percentage >= 40) return 'D';
    return 'F';
  };

  return (
    <div>
      <PageHeader
        title="Examination Results & Official Publication"
        subtitle="Review computed percentage, grades, and evaluated copy records before authorizing public release to candidates."
        breadcrumb="Academic Records"
        action={
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={() => selectedExamId && fetchResultsForExam(selectedExamId)}
          >
            Refresh
          </Button>
        }
      />

      {/* Control Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-full md:w-auto">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Filter by Examination
          </label>
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="w-full md:w-96 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/20 font-medium"
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
            <span className="text-slate-500 block font-medium">Publication Status:</span>
            <span className="font-bold text-slate-900">
              {isExamPublished ? (
                <span className="text-emerald-600 flex items-center space-x-1 justify-end font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Result Published</span>
                </span>
              ) : (
                <span className="text-amber-700 flex items-center space-x-1 justify-end font-semibold">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Publication Pending</span>
                </span>
              )}
            </span>
          </div>

          <Button
            variant="success"
            size="md"
            icon={Globe}
            loading={publishing}
            disabled={evaluatedCopies.length === 0}
            onClick={handlePublishResults}
          >
            {isExamPublished ? 'Re-Publish Results' : `Publish Result (${evaluatedCopies.length} Copies)`}
          </Button>
        </div>
      </div>

      {/* Subject & Publication State Card */}
      {selectedExam && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/40">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">Subject:</span>
              <span className="text-sm font-bold text-indigo-600">{selectedExam.subject}</span>
              <span className="text-xs text-slate-400 font-mono">({selectedExam.code})</span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">{selectedExam.name}</p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-mono">
              <span className="text-slate-600 mr-2">Total Evaluated:</span>
              <span className="font-bold text-slate-900">{evaluatedCopies.length}</span>
            </div>
            {isExamPublished ? (
              <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Result Published</span>
              </span>
            ) : (
              <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center space-x-1.5">
                <AlertCircle className="w-4 h-4" />
                <span>Pending Publication</span>
              </span>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <LoadingSpinner fullPage text="Retrieving computed results and evaluated copies..." />
      ) : evaluatedCopies.length === 0 ? (
        <EmptyState
          title="No evaluated answer copies found"
          message="Once answer copies are evaluated through Manual Evaluation or AI Evaluation, they will appear here in the final result list."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Evaluated Answer Copies ({evaluatedCopies.length} Total)
            </h4>
            <span className="text-xs text-slate-500 font-mono">
              Subject: <strong className="text-indigo-600">{selectedExam?.subject}</strong>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Copy No.</th>
                  <th className="py-3.5 px-4">Student Information</th>
                  <th className="py-3.5 px-4">Evaluation Mode</th>
                  <th className="py-3.5 px-4">Marks Obtained</th>
                  <th className="py-3.5 px-4">Percentage</th>
                  <th className="py-3.5 px-4">Grade</th>
                  <th className="py-3.5 px-4">Outcome</th>
                  <th className="py-3.5 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {evaluatedCopies.map((copy) => {
                  const marksObtained = copy.finalTotal ?? copy.totalAwardedMarks ?? 0;
                  const totalMarks = copy.totalMaxMarks || selectedExam?.maxMarks || 100;
                  const percentage =
                    copy.percentage !== null && copy.percentage !== undefined
                      ? copy.percentage
                      : totalMarks > 0
                      ? Math.round((marksObtained / totalMarks) * 100 * 10) / 10
                      : 0;
                  const grade = getGrade(percentage);
                  const passingMarks = selectedExam?.passingMarks || Math.round(totalMarks * 0.4);
                  const isPassed = marksObtained >= passingMarks;

                  const isManual =
                    copy.evaluationMode === 'MANUAL' || !!copy.assignedEvaluator;
                  const studentName =
                    copy.candidateName || copy.student?.name || '';
                  const studentRoll =
                    copy.candidateRollNo || copy.student?.studentRollNo || '';

                  return (
                    <tr key={copy._id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Copy Number */}
                      <td className="py-4 px-4 font-mono font-bold text-slate-900">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-indigo-600">{copy.copyId}</span>
                          {copy.bookletNumber && (
                            <span className="text-[10px] text-slate-500 font-mono">
                              [{copy.bookletNumber}]
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Student Information */}
                      <td className="py-4 px-4">
                        {studentName ? (
                          <div>
                            <div className="font-semibold text-slate-900">{studentName}</div>
                            {studentRoll && (
                              <span className="text-[10px] font-mono text-slate-500">
                                Roll: {studentRoll}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">—</span>
                        )}
                      </td>

                      {/* Evaluation Mode */}
                      <td className="py-4 px-4">
                        {isManual ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 inline-flex items-center space-x-1">
                            <UserCheck className="w-3 h-3" />
                            <span>Manual Check</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center space-x-1">
                            <Sparkles className="w-3 h-3" />
                            <span>AI Check</span>
                          </span>
                        )}
                      </td>

                      {/* Marks Obtained / Total Marks */}
                      <td className="py-4 px-4 font-mono font-bold text-slate-900 text-sm">
                        {marksObtained} / {totalMarks}
                      </td>

                      {/* Percentage */}
                      <td className="py-4 px-4 font-mono font-bold text-indigo-600">
                        {percentage}%
                      </td>

                      {/* Grade */}
                      <td className="py-4 px-4">
                        <span className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 font-bold font-mono text-xs text-slate-800 flex items-center justify-center">
                          {grade}
                        </span>
                      </td>

                      {/* Outcome */}
                      <td className="py-4 px-4">
                        {isPassed ? (
                          <span className="text-emerald-700 font-bold flex items-center space-x-1 text-xs">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Passed</span>
                          </span>
                        ) : (
                          <span className="text-rose-700 font-bold flex items-center space-x-1 text-xs">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>Failed</span>
                          </span>
                        )}
                      </td>

                      {/* Publication State */}
                      <td className="py-4 px-4 text-right">
                        {isExamPublished ? (
                          <Badge status="PUBLISHED">Published</Badge>
                        ) : (
                          <Badge status="PENDING">Draft / Unreleased</Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer Summary: Total Evaluated Copies */}
          <div className="p-4 bg-slate-50/90 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2 text-slate-700">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span className="font-semibold">
                Total Evaluated Copies: <strong className="text-slate-900 font-mono text-sm">{evaluatedCopies.length}</strong>
              </span>
              <span className="text-slate-500">
                (Evaluated via Manual Check & AI Check)
              </span>
            </div>

            <div className="text-slate-600 font-mono">
              Subject: <strong className="text-indigo-600">{selectedExam?.subject}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsManagement;
