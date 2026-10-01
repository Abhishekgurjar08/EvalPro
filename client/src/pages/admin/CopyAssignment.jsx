import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../context/ToastContext';
import { FolderKanban, CheckSquare, Square, UserCheck, CheckCircle2, AlertCircle } from 'lucide-react';

const CopyAssignment = () => {
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [evaluators, setEvaluators] = useState([]);
  const [selectedEvaluatorId, setSelectedEvaluatorId] = useState('');
  const [copies, setCopies] = useState([]);
  const [selectedCopyIds, setSelectedCopyIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [examsRes, evalRes] = await Promise.all([
        api.get('/examinations'),
        api.get('/evaluators')
      ]);

      if (examsRes.data.success) {
        setExams(examsRes.data.examinations || []);
        if (examsRes.data.examinations.length > 0) {
          setSelectedExamId(examsRes.data.examinations[0]._id);
        }
      }
      if (evalRes.data.success) {
        setEvaluators(evalRes.data.evaluators || []);
      }
    } catch (err) {
      showToast('Failed to load initial assignment data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedExamId) {
      fetchCopiesForExam(selectedExamId);
    }
  }, [selectedExamId]);

  const fetchCopiesForExam = async (examId) => {
    try {
      const res = await api.get(`/answer-copies?examinationId=${examId}`);
      if (res.data.success) {
        setCopies(res.data.answerCopies || []);
        setSelectedCopyIds([]);
      }
    } catch (err) {
      showToast('Error loading answer copies for selected exam', 'error');
    }
  };

  const selectedExam = exams.find((e) => e._id === selectedExamId);
  const selectedEvaluator = evaluators.find((ev) => ev.user._id === selectedEvaluatorId || ev._id === selectedEvaluatorId);

  // Subject matching validation rule: Evaluator must have subject
  const isSubjectMatch =
    !selectedEvaluator ||
    !selectedExam ||
    selectedEvaluator.subjects?.some(
      (s) => s.toLowerCase().trim() === selectedExam.subject.toLowerCase().trim()
    );

  const toggleSelectCopy = (id) => {
    setSelectedCopyIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAllUnassigned = () => {
    const unassignedIds = copies
      .filter((c) => !c.assignedEvaluator || c.evaluationStatus === 'PENDING')
      .map((c) => c._id);
    setSelectedCopyIds(unassignedIds);
  };

  const handleAssignCopies = async () => {
    if (!selectedExamId || !selectedEvaluatorId) {
      showToast('Please select both an Examination and an Evaluator.', 'error');
      return;
    }

    if (selectedCopyIds.length === 0) {
      showToast('Please select at least one answer copy to assign.', 'error');
      return;
    }

    if (!isSubjectMatch) {
      showToast(
        `Subject mismatch! Evaluator ${selectedEvaluator.name} is not authorized for ${selectedExam.subject}.`,
        'error'
      );
      return;
    }

    try {
      setAssigning(true);
      const res = await api.post('/evaluators/assign-copies', {
        examinationId: selectedExamId,
        evaluatorId: selectedEvaluator.user._id || selectedEvaluator.user,
        copyIds: selectedCopyIds
      });

      if (res.data.success) {
        showToast(
          `Successfully assigned ${res.data.assignedCount} copies to ${selectedEvaluator.name}!`,
          'success'
        );
        fetchCopiesForExam(selectedExamId);
        // Refresh evaluator workload
        const evalRes = await api.get('/evaluators');
        if (evalRes.data.success) setEvaluators(evalRes.data.evaluators || []);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error assigning answer copies', 'error');
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Answer Copy Allocation & Evaluator Assignment"
        subtitle="Match student answer copies with qualified faculty evaluators based on subject expertise and workload limits."
        breadcrumb="Manual & Digital Evaluation"
      />

      {loading ? (
        <LoadingSpinner fullPage text="Loading assignment control panel..." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Exam & Evaluator Selector */}
          <div className="lg:col-span-1 space-y-6">
            {/* Step 1: Select Exam */}
            <div className="surface-card p-5 rounded-xl border border-slate-800">
              <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3 flex items-center space-x-2">
                <span className="w-5 h-5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs flex items-center justify-center font-bold">
                  1
                </span>
                <span>Select Examination</span>
              </h4>

              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                {exams.map((ex) => (
                  <option key={ex._id} value={ex._id}>
                    {ex.code} - {ex.name} ({ex.subject})
                  </option>
                ))}
              </select>

              {selectedExam && (
                <div className="mt-3 p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Subject:</span>
                    <span className="font-semibold text-indigo-400">{selectedExam.subject}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Marks:</span>
                    <span className="text-slate-200 font-mono">{selectedExam.maxMarks}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Select Evaluator */}
            <div className="surface-card p-5 rounded-xl border border-slate-800">
              <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3 flex items-center space-x-2">
                <span className="w-5 h-5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs flex items-center justify-center font-bold">
                  2
                </span>
                <span>Select Faculty Evaluator</span>
              </h4>

              <select
                value={selectedEvaluatorId}
                onChange={(e) => setSelectedEvaluatorId(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="">-- Choose Evaluator --</option>
                {evaluators.map((ev) => (
                  <option key={ev._id} value={ev._id}>
                    {ev.name} ({ev.department})
                  </option>
                ))}
              </select>

              {selectedEvaluator && (
                <div className="mt-4 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Evaluator:</span>
                    <span className="font-semibold text-white">{selectedEvaluator.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-1">Subjects:</span>
                    <div className="flex flex-wrap gap-1">
                      {selectedEvaluator.subjects?.map((s, i) => (
                        <span
                          key={i}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${
                            selectedExam && s.toLowerCase().trim() === selectedExam.subject.toLowerCase().trim()
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold'
                              : 'bg-slate-800 border-slate-700 text-slate-300'
                          }`}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Subject Match Indicator */}
                  {!isSubjectMatch ? (
                    <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] flex items-center space-x-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>Warning: Not authorized for {selectedExam?.subject}</span>
                    </div>
                  ) : (
                    <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] flex items-center space-x-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>Subject Matched: Authorized</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-800">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Current Workload:</span>
                      <span className="font-mono text-white">
                        {selectedEvaluator.workload?.activeAssigned || 0} / {selectedEvaluator.maxWorkload || 50} copies
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Card */}
            <div className="surface-card p-5 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between mb-3 text-xs">
                <span className="text-slate-400">Selected for Assignment:</span>
                <span className="font-mono font-bold text-indigo-400 text-sm">
                  {selectedCopyIds.length} copies
                </span>
              </div>
              <Button
                variant="primary"
                size="lg"
                icon={UserCheck}
                loading={assigning}
                disabled={selectedCopyIds.length === 0 || !selectedEvaluatorId || !isSubjectMatch}
                onClick={handleAssignCopies}
                className="w-full"
              >
                Assign Selected Copies
              </Button>
            </div>
          </div>

          {/* Right Column: Copies List & Checkbox Selection */}
          <div className="lg:col-span-2">
            <div className="surface-card rounded-xl border border-slate-800 overflow-hidden">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                <div>
                  <h4 className="text-sm font-semibold text-slate-100 tracking-tight">Available Answer Copies</h4>
                  <p className="text-xs text-slate-400">
                    Showing submissions for {selectedExam?.name} ({copies.length} total)
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={selectAllUnassigned}>
                    Select All Unassigned
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedCopyIds([])}
                    disabled={selectedCopyIds.length === 0}
                  >
                    Clear Selection
                  </Button>
                </div>
              </div>

              {copies.length === 0 ? (
                <EmptyState
                  title="No answer copies found"
                  message="There are no student submissions registered yet for this examination."
                />
              ) : (
                <div className="divide-y divide-slate-800/60 max-h-[600px] overflow-y-auto">
                  {copies.map((copy) => {
                    const isSelected = selectedCopyIds.includes(copy._id);
                    const isCompleted = copy.evaluationStatus === 'COMPLETED';

                    return (
                      <div
                        key={copy._id}
                        onClick={() => !isCompleted && toggleSelectCopy(copy._id)}
                        className={`p-4 flex items-center justify-between transition-colors ${
                          isSelected
                            ? 'bg-indigo-600/10 border-l-4 border-indigo-500'
                            : 'hover:bg-slate-800/30'
                        } ${isCompleted ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <div className="flex items-center space-x-3.5">
                          <button
                            type="button"
                            disabled={isCompleted}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isCompleted) toggleSelectCopy(copy._id);
                            }}
                            className="text-slate-400 hover:text-indigo-400"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-5 h-5 text-indigo-400" />
                            ) : (
                              <Square className="w-5 h-5 text-slate-600" />
                            )}
                          </button>

                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-mono font-bold text-sm text-white">{copy.copyId}</span>
                              <Badge status={copy.evaluationStatus}>{copy.evaluationStatus}</Badge>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                              Student: <span className="text-slate-200">{copy.student?.name}</span> (
                              {copy.student?.studentRollNo})
                            </p>
                          </div>
                        </div>

                        <div className="text-right text-xs">
                          {copy.assignedEvaluator ? (
                            <div>
                              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                                Assigned To
                              </span>
                              <span className="font-semibold text-slate-200">
                                {copy.assignedEvaluator.name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-amber-400/80 font-medium italic">Unassigned</span>
                          )}

                          {copy.totalAwardedMarks !== null && copy.totalAwardedMarks !== undefined && (
                            <div className="text-[11px] font-mono text-emerald-400 font-bold mt-1">
                              {copy.totalAwardedMarks} / {copy.totalMaxMarks} ({copy.percentage}%)
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CopyAssignment;
