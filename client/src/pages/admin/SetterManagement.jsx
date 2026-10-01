import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useToast } from '../../context/ToastContext';
import { Users, UserCheck, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';

const SetterManagement = () => {
  const [exams, setExams] = useState([]);
  const [setters, setSetters] = useState([]);
  const [loading, setLoading] = useState(true);

  // Reassignment Modal
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [selectedSetterId, setSelectedSetterId] = useState('');

  const { showToast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [examsRes, settersRes] = await Promise.all([
        api.get('/examinations'),
        api.get('/auth/users?role=EXAM_SETTER')
      ]);

      if (examsRes.data.success) setExams(examsRes.data.examinations || []);
      if (settersRes.data.success) setSetters(settersRes.data.users || []);
    } catch (err) {
      showToast('Failed to load setter assignments', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignSetter = async (e) => {
    e.preventDefault();
    if (!selectedExam || !selectedSetterId) return;

    try {
      const res = await api.post(`/examinations/${selectedExam._id}/assign-setter`, {
        setterId: selectedSetterId
      });
      if (res.data.success) {
        showToast('Exam setter assigned successfully!', 'success');
        setAssignModalOpen(false);
        fetchData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error assigning setter', 'error');
    }
  };

  return (
    <div>
      <PageHeader
        title="Exam Setter Assignments & History"
        subtitle="Monitor setter allocation, acceptance, and rejection reasons across all subject examinations."
        breadcrumb="Content Governance"
        action={
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={fetchData}>
            Refresh
          </Button>
        }
      />

      {loading ? (
        <LoadingSpinner fullPage text="Loading setter assignments..." />
      ) : (
        <div className="surface-card rounded-xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Examination</th>
                  <th className="py-3.5 px-4">Subject</th>
                  <th className="py-3.5 px-4">Assigned Setter</th>
                  <th className="py-3.5 px-4">Assigned Date</th>
                  <th className="py-3.5 px-4">Setter Response</th>
                  <th className="py-3.5 px-4">Response Date / Reason</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {exams.map((exam) => (
                  <tr key={exam._id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-4 font-semibold text-white">
                      <div>{exam.name}</div>
                      <span className="text-[10px] text-slate-500 font-mono">{exam.code}</span>
                    </td>
                    <td className="py-4 px-4 text-slate-300">{exam.subject}</td>
                    <td className="py-4 px-4">
                      {exam.assignedSetter ? (
                        <div>
                          <p className="font-semibold text-slate-200">{exam.assignedSetter.name}</p>
                          <p className="text-[10px] text-slate-400">{exam.assignedSetter.email}</p>
                        </div>
                      ) : (
                        <span className="text-amber-400 italic">No setter assigned</span>
                      )}
                    </td>
                    <td className="py-4 px-4 font-mono text-slate-400">
                      {exam.setterAssignmentDate
                        ? new Date(exam.setterAssignmentDate).toLocaleDateString()
                        : '—'}
                    </td>
                    <td className="py-4 px-4">
                      {exam.status === 'SETTER_ACCEPTED' ? (
                        <Badge status="ACCEPTED">Accepted</Badge>
                      ) : exam.status === 'SETTER_REJECTED' ? (
                        <Badge status="REJECTED">Rejected</Badge>
                      ) : exam.status === 'SETTER_ASSIGNED' ? (
                        <Badge status="PENDING">Pending Response</Badge>
                      ) : (
                        <Badge status={exam.status}>{exam.status.replace('_', ' ')}</Badge>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      {exam.setterRejectionReason ? (
                        <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px]">
                          <strong>Reason:</strong> {exam.setterRejectionReason}
                        </div>
                      ) : exam.setterResponseDate ? (
                        <span className="text-slate-400 font-mono text-[11px]">
                          {new Date(exam.setterResponseDate).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-slate-500 italic">Awaiting response</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Button
                        size="sm"
                        variant={exam.status === 'SETTER_REJECTED' ? 'danger' : 'outline'}
                        onClick={() => {
                          setSelectedExam(exam);
                          setSelectedSetterId('');
                          setAssignModalOpen(true);
                        }}
                      >
                        {exam.assignedSetter ? 'Reassign' : 'Assign'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      <Modal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title={`Assign Setter to ${selectedExam?.name}`}
      >
        <form onSubmit={handleAssignSetter} className="space-y-4">
          <p className="text-xs text-slate-400">
            Subject: <strong className="text-white">{selectedExam?.subject}</strong>
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Choose Faculty Setter</label>
            <select
              required
              value={selectedSetterId}
              onChange={(e) => setSelectedSetterId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">-- Choose Exam Setter --</option>
              {setters.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.email}) - {s.department}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
            <Button variant="ghost" onClick={() => setAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Assign Exam Setter
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SetterManagement;
