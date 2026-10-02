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
import { Plus, Search, Calendar, UserCheck, Settings, CheckCircle2, XCircle, Scan, Edit3, Trash2 } from 'lucide-react';

const initialFormData = {
  name: '',
  code: '',
  session: '2025-2026',
  course: 'B.Tech',
  semester: 6,
  subject: '',
  durationMinutes: 120,
  maxMarks: 50,
  passingMarks: 20,
  description: '',
  instructions: 'Attempt all questions.\nRead each question carefully.\nMaintain academic integrity.'
};

const ExaminationsList = () => {
  const [exams, setExams] = useState([]);
  const [setters, setSetters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [selectedSetterId, setSelectedSetterId] = useState('');
  const [editingExam, setEditingExam] = useState(null);
  const [submittingExam, setSubmittingExam] = useState(false);

  // Form State
  const [formData, setFormData] = useState(initialFormData);

  const { showToast } = useToast();

  useEffect(() => {
    fetchExams();
    fetchSetters();
  }, [filterStatus]);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (search) params.search = search;
      const res = await api.get('/examinations', { params });
      if (res.data.success) {
        setExams(res.data.examinations || []);
      }
    } catch (err) {
      showToast('Failed to load examinations', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchSetters = async () => {
    try {
      const res = await api.get('/auth/users?role=EXAM_SETTER');
      if (res.data.success) {
        setSetters(res.data.users || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenCreate = () => {
    setEditingExam(null);
    setFormData(initialFormData);
    setCreateModalOpen(true);
  };

  const handleOpenEdit = (exam) => {
    setEditingExam(exam);
    setFormData({
      name: exam.name || '',
      code: exam.code || '',
      session: exam.session || '2025-2026',
      course: exam.course || 'B.Tech',
      semester: exam.semester || 6,
      subject: exam.subject || '',
      durationMinutes: exam.durationMinutes || 120,
      maxMarks: exam.maxMarks || 50,
      passingMarks: exam.passingMarks || 20,
      description: exam.description || '',
      instructions: Array.isArray(exam.instructions)
        ? exam.instructions.join('\n')
        : (exam.instructions || '')
    });
    setCreateModalOpen(true);
  };

  const handleDeleteExam = async (exam) => {
    if (!window.confirm(`Are you sure you want to delete examination "${exam.name}" (${exam.code})?`)) return;
    try {
      const res = await api.delete(`/examinations/${exam._id}`);
      if (res.data.success) {
        showToast('Examination deleted successfully!', 'success');
        fetchExams();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete examination', 'error');
    }
  };

  const handleSaveExam = async (e) => {
    e.preventDefault();

    const cleanName = (formData.name || '').trim();
    const cleanCode = (formData.code || '').trim().toUpperCase();
    const cleanSubject = (formData.subject || '').trim();
    const numMaxMarks = Number(formData.maxMarks);
    const numDuration = Number(formData.durationMinutes);

    if (!cleanName || !cleanCode || !cleanSubject) {
      showToast('Examination Title, Code, and Subject are required.', 'warning');
      return;
    }

    if (numMaxMarks <= 0) {
      showToast('Maximum marks must be greater than 0.', 'warning');
      return;
    }

    if (numDuration < 15) {
      showToast('Duration must be at least 15 minutes.', 'warning');
      return;
    }

    try {
      setSubmittingExam(true);
      const parsedInstructions = typeof formData.instructions === 'string'
        ? formData.instructions.split('\n').map((i) => i.trim()).filter(Boolean)
        : (Array.isArray(formData.instructions) ? formData.instructions : []);

      const payload = {
        name: cleanName,
        code: cleanCode,
        session: formData.session || '2025-2026',
        course: formData.course || 'B.Tech',
        semester: Number(formData.semester) || 6,
        subject: cleanSubject,
        durationMinutes: numDuration,
        maxMarks: numMaxMarks,
        passingMarks: Number(formData.passingMarks) || Math.round(numMaxMarks * 0.4),
        description: formData.description || '',
        instructions: parsedInstructions.length > 0 ? parsedInstructions : [
          'Attempt all questions in sequence.',
          'Read each question carefully before answering.',
          'Maintain academic integrity.'
        ]
      };

      if (editingExam) {
        const res = await api.put(`/examinations/${editingExam._id}`, payload);
        if (res.data.success) {
          showToast('Examination updated successfully!', 'success');
          setCreateModalOpen(false);
          setEditingExam(null);
          setFormData(initialFormData);
          fetchExams();
        }
      } else {
        const res = await api.post('/examinations', payload);
        if (res.data.success) {
          showToast('Examination created successfully!', 'success');
          setCreateModalOpen(false);
          setFormData(initialFormData);
          fetchExams();
        }
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error saving examination', 'error');
    } finally {
      setSubmittingExam(false);
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
        fetchExams();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error assigning setter', 'error');
    }
  };

  const handleMarkExamCompleted = async (examId) => {
    try {
      const res = await api.put(`/examinations/${examId}`, { status: 'COMPLETED' });
      if (res.data.success) {
        showToast('Examination marked as Exam Completed! You can now scan answer copies.', 'success');
        fetchExams();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update exam status', 'error');
    }
  };

  return (
    <div>
      <PageHeader
        title="Examination Management"
        subtitle="Configure academic sessions, courses, question paper guidelines, and setter assignments."
        breadcrumb="Academic Operations"
        action={
          <Button variant="primary" icon={Plus} onClick={handleOpenCreate}>
            Create New Examination
          </Button>
        }
      />

      {/* Filter / Search Bar */}
      <div className="surface-card p-4 rounded-xl border border-slate-800 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            placeholder="Search exam by title, code or subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchExams()}
            className="w-full bg-slate-900/90 border border-slate-700/80 rounded-lg pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-900/90 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Lifecycle States</option>
            <option value="DRAFT">Draft</option>
            <option value="SETTER_ASSIGNED">Setter Assigned</option>
            <option value="SETTER_ACCEPTED">Setter Accepted</option>
            <option value="PAPER_SUBMITTED">Paper Submitted</option>
            <option value="PAPER_APPROVED">Paper Approved</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="LIVE">Live</option>
            <option value="EVALUATION">Evaluation</option>
            <option value="RESULT_PUBLISHED">Result Published</option>
          </select>
          <Button variant="outline" size="sm" onClick={fetchExams}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Examinations Table */}
      {loading ? (
        <LoadingSpinner fullPage text="Loading examinations..." />
      ) : exams.length === 0 ? (
        <EmptyState
          title="No examinations found"
          message="Create your first examination to initiate setter assignment and question bank compilation."
          action={
            <Button variant="primary" icon={Plus} onClick={() => setCreateModalOpen(true)}>
              Create Examination
            </Button>
          }
        />
      ) : (
        <div className="surface-card rounded-xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Examination</th>
                  <th className="py-3.5 px-4">Course & Sem</th>
                  <th className="py-3.5 px-4">Marks & Time</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Assigned Setter</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {exams.map((exam) => (
                  <tr key={exam._id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-4 font-semibold text-white">
                      <div>{exam.name}</div>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-[10px] text-slate-400 font-mono bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                          {exam.code}
                        </span>
                        <span className="text-[11px] text-indigo-400 font-medium">{exam.subject}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-slate-400">
                      {exam.course} - Sem {exam.semester}
                    </td>
                    <td className="py-4 px-4 font-mono">
                      <span className="text-white font-bold">{exam.maxMarks}</span> marks /{' '}
                      <span className="text-slate-400">{exam.durationMinutes}m</span>
                    </td>
                    <td className="py-4 px-4">
                      <Badge status={exam.status}>{exam.status.replace('_', ' ')}</Badge>
                    </td>
                    <td className="py-4 px-4">
                      {exam.assignedSetter ? (
                        <div>
                          <p className="font-semibold text-slate-200">{exam.assignedSetter.name}</p>
                          <p className="text-[10px] text-slate-400">{exam.assignedSetter.email}</p>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          icon={UserCheck}
                          onClick={() => {
                            setSelectedExam(exam);
                            setAssignModalOpen(true);
                          }}
                          className="text-[11px]"
                        >
                          Assign Setter
                        </Button>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right space-x-2 whitespace-nowrap">
                      {/* Show Scanned Copies action if exam has reached completed/conducted stage */}
                      {['COMPLETED', 'SCANNING_IN_PROGRESS', 'SCANNING_COMPLETED', 'EVALUATION', 'LIVE'].includes(exam.status) && (
                        <Link to={`/admin/examinations/${exam._id}/scanned-copies`}>
                          <Button
                            size="sm"
                            variant="primary"
                            icon={Scan}
                            className="text-[11px]"
                          >
                            Scanned Copies
                          </Button>
                        </Link>
                      )}

                      {/* Option to mark exam conducted if scheduled or paper approved */}
                      {['SCHEDULED', 'PAPER_APPROVED'].includes(exam.status) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkExamCompleted(exam._id)}
                          className="text-[11px]"
                        >
                          Mark Completed
                        </Button>
                      )}

                      {/* Edit action for draft exams */}
                      {exam.status === 'DRAFT' && (
                        <Button
                          size="sm"
                          variant="outline"
                          icon={Edit3}
                          onClick={() => handleOpenEdit(exam)}
                          className="text-[11px]"
                        >
                          Edit
                        </Button>
                      )}

                      {/* Delete action for draft exams */}
                      {exam.status === 'DRAFT' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={Trash2}
                          onClick={() => handleDeleteExam(exam)}
                          className="text-[11px] text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                        >
                          Delete
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedExam(exam);
                          setSelectedSetterId(exam.assignedSetter?._id || '');
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

      {/* Create / Edit Examination Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          setEditingExam(null);
          setFormData(initialFormData);
        }}
        title={editingExam ? `Edit Examination - ${editingExam.code}` : 'Create New Examination'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSaveExam} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Examination Title</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. B.Tech Semester VI Final Exam"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Examination Code</label>
              <input
                type="text"
                required
                disabled={!!editingExam}
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g. CS-CN-601"
                className={`w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 uppercase font-mono ${
                  editingExam ? 'opacity-60 cursor-not-allowed' : ''
                }`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Subject</label>
              <input
                type="text"
                required
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="e.g. Computer Networks"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Course</label>
              <input
                type="text"
                required
                value={formData.course}
                onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                placeholder="e.g. B.Tech"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Semester</label>
              <input
                type="number"
                min="1"
                max="12"
                required
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Maximum Marks</label>
              <input
                type="number"
                min="1"
                required
                value={formData.maxMarks}
                onChange={(e) => setFormData({ ...formData, maxMarks: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Duration (Minutes)</label>
              <input
                type="number"
                min="15"
                required
                value={formData.durationMinutes}
                onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Instructions (One per line)</label>
            <textarea
              rows="3"
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
            <Button
              variant="ghost"
              onClick={() => {
                setCreateModalOpen(false);
                setEditingExam(null);
                setFormData(initialFormData);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={submittingExam}>
              {editingExam ? 'Update Examination' : 'Create Examination'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Assign Setter Modal */}
      <Modal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title={`Assign Exam Setter - ${selectedExam?.code}`}
      >
        <form onSubmit={handleAssignSetter} className="space-y-4">
          <p className="text-xs text-slate-400">
            Select a designated exam setter to curate the syllabus, question bank, marking rubrics, and final question paper for{' '}
            <strong className="text-white">{selectedExam?.name}</strong> ({selectedExam?.subject}).
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Select Faculty Setter</label>
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
            <Button type="submit" variant="primary" icon={UserCheck}>
              Confirm Setter Assignment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ExaminationsList;
