import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../context/ToastContext';
import { Calendar, CheckCircle2, XCircle, BookOpen, Layers, FileText, AlertCircle } from 'lucide-react';

const MyExaminations = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  // Response Modal
  const [responseModalOpen, setResponseModalOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [responseType, setResponseType] = useState('ACCEPT');
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
    fetchMyExams();
  }, []);

  const fetchMyExams = async () => {
    try {
      setLoading(true);
      const res = await api.get('/examinations');
      if (res.data.success) {
        setExams(res.data.examinations || []);
      }
    } catch (err) {
      showToast('Failed to load assigned examinations', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (e) => {
    e.preventDefault();
    if (!selectedExam) return;

    if (responseType === 'REJECT' && !rejectReason.trim()) {
      showToast('Rejection reason is mandatory.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post(`/examinations/${selectedExam._id}/setter-response`, {
        response: responseType,
        reason: rejectReason
      });

      if (res.data.success) {
        showToast(
          `Assignment ${responseType === 'ACCEPT' ? 'accepted' : 'rejected'} successfully!`,
          'success'
        );
        setResponseModalOpen(false);
        setRejectReason('');
        fetchMyExams();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error recording response', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="My Assigned Examinations"
        subtitle="Manage examinations assigned to you, accept appointments, configure paper scheme, and access question bank."
        breadcrumb="Content Operations"
      />

      {loading ? (
        <LoadingSpinner fullPage text="Loading assigned examinations..." />
      ) : exams.length === 0 ? (
        <EmptyState
          title="No examinations assigned"
          message="When the administration assigns you as exam setter for a course, it will appear here."
        />
      ) : (
        <div className="space-y-4">
          {exams.map((exam) => (
            <div
              key={exam._id}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:border-slate-300 transition-all"
            >
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">{exam.name}</h3>
                  <Badge status={exam.status}>{exam.status.replace('_', ' ')}</Badge>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                  <span className="font-mono bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg text-slate-900 font-bold">
                    {exam.code}
                  </span>
                  <span>Subject: <strong className="text-indigo-600 font-semibold">{exam.subject}</strong></span>
                  <span>•</span>
                  <span>Semester: <strong className="text-slate-800">{exam.semester} ({exam.course})</strong></span>
                  <span>•</span>
                  <span>Max Marks: <strong className="text-slate-900 font-mono">{exam.maxMarks}</strong></span>
                  <span>•</span>
                  <span>Duration: <strong className="text-slate-900 font-mono">{exam.durationMinutes} mins</strong></span>
                </div>

                {exam.status === 'SETTER_ASSIGNED' && (
                  <div className="pt-1">
                    <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 font-medium bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Action Required: Please Accept or Decline Assignment
                    </span>
                  </div>
                )}

                <div className="pt-1 flex items-center gap-2">
                  {exam.assignedSyllabus ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Syllabus Assigned by Admin
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 font-medium bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                      <BookOpen className="w-3.5 h-3.5 text-slate-400" /> Awaiting Admin Syllabus
                    </span>
                  )}
                </div>

                {exam.setterRejectionReason && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                    <strong>Decline Reason Provided:</strong> {exam.setterRejectionReason}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                {exam.status === 'SETTER_ASSIGNED' && (
                  <>
                    <Button
                      size="sm"
                      variant="success"
                      icon={CheckCircle2}
                      onClick={() => {
                        setSelectedExam(exam);
                        setResponseType('ACCEPT');
                        setResponseModalOpen(true);
                      }}
                    >
                      Accept Assignment
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      icon={XCircle}
                      onClick={() => {
                        setSelectedExam(exam);
                        setResponseType('REJECT');
                        setResponseModalOpen(true);
                      }}
                    >
                      Decline
                    </Button>
                  </>
                )}

                {/* Options for Paper Setter: Syllabus & Scheme and Question Bank */}
                <Link to={`/setter/syllabus/${exam._id}`}>
                  <Button size="sm" variant="primary" icon={Layers}>
                    Syllabus & Scheme
                  </Button>
                </Link>

                <Link to={`/setter/questions?subject=${encodeURIComponent(exam.subject || '')}`}>
                  <Button size="sm" variant="outline" icon={BookOpen}>
                    Question Bank
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Response Modal */}
      <Modal
        isOpen={responseModalOpen}
        onClose={() => setResponseModalOpen(false)}
        title={`Respond to Assignment - ${selectedExam?.name}`}
      >
        <form onSubmit={handleResponse} className="space-y-4">
          <p className="text-xs text-slate-500">
            Subject: <strong className="text-slate-900">{selectedExam?.subject}</strong> | Code: {selectedExam?.code}
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">Decision</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setResponseType('ACCEPT')}
                className={`p-3.5 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
                  responseType === 'ACCEPT'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Accept Assignment</span>
              </button>

              <button
                type="button"
                onClick={() => setResponseType('REJECT')}
                className={`p-3.5 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
                  responseType === 'REJECT'
                    ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <XCircle className="w-4 h-4" />
                <span>Decline Assignment</span>
              </button>
            </div>
          </div>

          {responseType === 'REJECT' && (
            <div>
              <label className="block text-xs font-semibold text-rose-700 mb-1">
                Decline Reason (Mandatory) *
              </label>
              <textarea
                required
                rows="3"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="State your reason for declining this setter assignment..."
                className="w-full bg-white border border-rose-300 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20"
              />
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200">
            <Button variant="ghost" onClick={() => setResponseModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant={responseType === 'ACCEPT' ? 'success' : 'danger'}
              loading={submitting}
            >
              Confirm
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MyExaminations;
