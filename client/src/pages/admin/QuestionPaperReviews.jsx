import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../context/ToastContext';
import { FileText, CheckCircle2, XCircle, Eye, AlertTriangle } from 'lucide-react';

const QuestionPaperReviews = () => {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Review Modals
  const [previewPaper, setPreviewPaper] = useState(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [rejectionComments, setRejectionComments] = useState('');
  const [processing, setProcessing] = useState(false);
  const [processingPaperId, setProcessingPaperId] = useState(null);

  const { showToast } = useToast();

  useEffect(() => {
    fetchPapers();
  }, []);

  const fetchPapers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/question-papers');
      if (res.data.success) {
        setPapers(res.data.questionPapers || []);
      }
    } catch (err) {
      showToast('Failed to load question papers', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (paper) => {
    if (!paper || !paper._id) return;

    try {
      setProcessing(true);
      setProcessingPaperId(paper._id);
      const res = await api.post(`/question-papers/${paper._id}/review`, {
        action: 'APPROVE',
        comments: 'Approved by Examination Controller. Ready for examination conduct.'
      });

      if (res.data.success) {
        showToast('Question paper officially approved!', 'success');
        setPapers((prev) =>
          prev.map((p) => (p._id === paper._id ? { ...p, status: 'APPROVED' } : p))
        );
        fetchPapers();
        setPreviewPaper(null);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error approving paper', 'error');
    } finally {
      setProcessing(false);
      setProcessingPaperId(null);
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPaper || !rejectionComments.trim()) {
      showToast('Rejection reason is mandatory.', 'error');
      return;
    }

    try {
      setProcessing(true);
      const res = await api.post(`/question-papers/${selectedPaper._id}/review`, {
        action: 'REJECT',
        comments: rejectionComments
      });

      if (res.data.success) {
        showToast('Question paper returned for setter revision.', 'warning');
        setRejectModalOpen(false);
        setRejectionComments('');
        fetchPapers();
        setPreviewPaper(null);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error rejecting paper', 'error');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Question Paper Review & Approvals"
        subtitle="Audit submitted question papers against syllabus alignment, blueprint criteria, and marking rubrics before test conduct."
        breadcrumb="Quality & Moderation"
      />

      {loading ? (
        <LoadingSpinner fullPage text="Loading submitted question papers..." />
      ) : papers.length === 0 ? (
        <EmptyState
          title="No question papers pending review"
          message="Submitted question papers from exam setters will appear here for administrative approval."
        />
      ) : (
        <div className="space-y-4">
          {papers.map((paper) => (
            <div
              key={paper._id}
              className="surface-card p-5 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div>
                <div className="flex items-center space-x-2.5">
                  <h4 className="text-base font-bold text-white tracking-tight">{paper.paperTitle}</h4>
                  <Badge status={paper.status}>{paper.status}</Badge>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1.5">
                  <span>Exam: <strong className="text-slate-200">{paper.examination?.name}</strong></span>
                  <span>•</span>
                  <span>Subject: <strong className="text-indigo-400">{paper.examination?.subject}</strong></span>
                  <span>•</span>
                  <span>Total Marks: <strong className="text-white font-mono">{paper.totalMarks}</strong></span>
                  <span>•</span>
                  <span>Questions: <strong className="text-white font-mono">{paper.questions?.length || 0}</strong></span>
                </div>
                {paper.rejectionReason && (
                  <div className="mt-2.5 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
                    <strong>Previous Rejection Notes:</strong> {paper.rejectionReason}
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2.5 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  icon={Eye}
                  onClick={() => setPreviewPaper(paper)}
                >
                  Inspect Paper
                </Button>

                {paper.status === 'SUBMITTED' && (
                  <>
                    <Button
                      size="sm"
                      variant="success"
                      icon={CheckCircle2}
                      loading={processing && processingPaperId === paper._id}
                      onClick={() => handleApprove(paper)}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      icon={XCircle}
                      onClick={() => {
                        setSelectedPaper(paper);
                        setRejectModalOpen(true);
                      }}
                    >
                      Reject with Reason
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Inspect Paper Modal */}
      <Modal
        isOpen={!!previewPaper}
        onClose={() => setPreviewPaper(null)}
        title={previewPaper?.paperTitle || 'Question Paper Preview'}
        maxWidth="max-w-4xl"
      >
        {previewPaper && (
          <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
            {/* Header Details */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs flex justify-between items-center">
              <div>
                <p className="text-slate-400">Subject: <span className="text-white font-semibold">{previewPaper.examination?.subject}</span></p>
                <p className="text-slate-400">Exam: <span className="text-white font-semibold">{previewPaper.examination?.name}</span></p>
              </div>
              <div className="text-right">
                <p className="text-slate-400">Total Marks: <span className="text-indigo-400 font-mono font-bold text-sm">{previewPaper.totalMarks}</span></p>
                <Badge status={previewPaper.status}>{previewPaper.status}</Badge>
              </div>
            </div>

            {/* Instructions */}
            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
              <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Instructions</h5>
              <ul className="list-disc list-inside text-xs text-slate-400 space-y-1">
                {previewPaper.instructions?.map((ins, i) => (
                  <li key={i}>{ins}</li>
                ))}
              </ul>
            </div>

            {/* Questions List */}
            <div className="space-y-4">
              <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Paper Questions ({previewPaper.questions?.length || 0})
              </h5>
              {previewPaper.questions?.map((item, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-xs space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-white text-sm">
                      Q{item.questionNumber || idx + 1}. {item.question?.questionText || 'Question Text'}
                    </span>
                    <span className="px-2 py-0.5 rounded font-mono font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0 ml-3">
                      {item.marks} Marks
                    </span>
                  </div>

                  {item.question?.expectedAnswer && (
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400">
                      <strong className="text-slate-300 block mb-0.5">Reference / Expected Answer:</strong>
                      <p className="leading-relaxed">{item.question.expectedAnswer}</p>
                    </div>
                  )}

                  {/* Rubric Criteria if any */}
                  {item.question?.rubric?.criteria && item.question.rubric.criteria.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-800/80">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                        Defined Marking Rubric:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {item.question.rubric.criteria.map((crit, cIdx) => (
                          <div key={cIdx} className="p-2 rounded bg-slate-950/60 border border-slate-800/80">
                            <div className="flex justify-between font-semibold text-slate-300">
                              <span>{crit.name}</span>
                              <span className="font-mono text-indigo-400">{crit.maxMarks}m</span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">{crit.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Approval / Rejection Actions inside modal */}
            {previewPaper.status === 'SUBMITTED' && (
              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                <Button
                  variant="danger"
                  onClick={() => {
                    setSelectedPaper(previewPaper);
                    setRejectModalOpen(true);
                  }}
                >
                  Reject with Reason
                </Button>
                <Button
                  variant="success"
                  icon={CheckCircle2}
                  loading={processing && processingPaperId === previewPaper._id}
                  onClick={() => handleApprove(previewPaper)}
                >
                  Approve Paper
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Rejection Reason Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Reject Question Paper - Provide Revision Reason"
      >
        <form onSubmit={handleRejectSubmit} className="space-y-4">
          <p className="text-xs text-slate-400">
            A detailed revision reason is mandatory. The exam setter will be notified and requested to update the paper.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Rejection Reason & Required Modifications *
            </label>
            <textarea
              required
              rows="4"
              value={rejectionComments}
              onChange={(e) => setRejectionComments(e.target.value)}
              placeholder="e.g. Unit 3 question distribution does not match blueprint. Please replace Q4 with a question covering TCP congestion control."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
            <Button variant="ghost" onClick={() => setRejectModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" loading={processing}>
              Confirm Rejection & Send Feedback
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default QuestionPaperReviews;
