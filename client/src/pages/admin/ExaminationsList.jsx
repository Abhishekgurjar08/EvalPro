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
import { Plus, Search, Calendar, UserCheck, Settings, CheckCircle2, XCircle, Scan, Edit3, Trash2, BookOpen, Layers } from 'lucide-react';

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
  const [assignSetterModalOpen, setAssignSetterModalOpen] = useState(false);
  const [assignSyllabusModalOpen, setAssignSyllabusModalOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [selectedSetterId, setSelectedSetterId] = useState('');
  const [syllabi, setSyllabi] = useState([]);
  const [selectedSyllabusId, setSelectedSyllabusId] = useState('');
  const [isDefiningNewSyllabus, setIsDefiningNewSyllabus] = useState(false);
  const [newSyllabusUnits, setNewSyllabusUnits] = useState([]);
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

  const openAssignSetterModal = (exam) => {
    setSelectedExam(exam);
    setSelectedSetterId(exam.assignedSetter?._id || '');
    setAssignSetterModalOpen(true);
  };

  const handleAssignSetter = async (e) => {
    e.preventDefault();
    if (!selectedExam || !selectedSetterId) {
      showToast('Please select an exam setter.', 'warning');
      return;
    }

    try {
      const res = await api.post(`/examinations/${selectedExam._id}/assign-setter`, {
        setterId: selectedSetterId
      });
      if (res.data.success) {
        showToast('Exam setter assigned successfully! Pending setter acceptance.', 'success');
        setAssignSetterModalOpen(false);
        fetchExams();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error assigning setter', 'error');
    }
  };

  const openAssignSyllabusModal = async (exam) => {
    setSelectedExam(exam);

    // Fetch existing syllabi
    try {
      const res = await api.get('/syllabus');
      if (res.data.success) {
        setSyllabi(res.data.syllabi || []);
      }
    } catch (err) {
      console.error(err);
    }

    // Default units template for this subject if Admin chooses to define new syllabus
    setNewSyllabusUnits([
      { unitNumber: 1, title: `${exam.subject} Fundamentals & Architecture`, description: `Core concepts, structural principles, and foundational theories of ${exam.subject}.` },
      { unitNumber: 2, title: `Core Protocols & Implementation`, description: `Detailed mechanisms, protocols, practical operations, and design models in ${exam.subject}.` },
      { unitNumber: 3, title: `Advanced Analysis & Applications`, description: `Optimization, advanced problem solving, case studies, and modern standards in ${exam.subject}.` }
    ]);

    const existingSylId = exam.assignedSyllabus?._id || exam.assignedSyllabus;
    if (existingSylId) {
      setSelectedSyllabusId(existingSylId);
      setIsDefiningNewSyllabus(false);
    } else {
      setSelectedSyllabusId('');
      setIsDefiningNewSyllabus(false);
    }

    setAssignSyllabusModalOpen(true);
  };

  const handleAssignSyllabus = async (e) => {
    e.preventDefault();
    if (!selectedExam) return;

    if (!selectedSyllabusId && !isDefiningNewSyllabus) {
      showToast('Please select or define a syllabus for this exam.', 'warning');
      return;
    }

    try {
      const payload = {};

      if (isDefiningNewSyllabus || selectedSyllabusId === '__NEW__') {
        const validUnits = newSyllabusUnits.filter((u) => u.title.trim());
        if (validUnits.length === 0) {
          showToast('Please provide at least one valid unit title for the syllabus.', 'warning');
          return;
        }
        payload.units = validUnits;
      } else {
        payload.syllabusId = selectedSyllabusId;
      }

      const res = await api.post(`/examinations/${selectedExam._id}/assign-syllabus`, payload);
      if (res.data.success) {
        showToast('Syllabus assigned successfully to accepted paper setter!', 'success');
        setAssignSyllabusModalOpen(false);
        fetchExams();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error assigning syllabus', 'error');
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
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            placeholder="Search exam by title, code or subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchExams()}
            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/20"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-indigo-600"
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
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Examination</th>
                  <th className="py-3.5 px-4">Course & Sem</th>
                  <th className="py-3.5 px-4">Marks & Time</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Paper Setter & Syllabus</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {exams.map((exam) => (
                  <tr key={exam._id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-4 font-semibold text-slate-900">
                      <div>{exam.name}</div>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-[10px] text-slate-600 font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          {exam.code}
                        </span>
                        <span className="text-[11px] text-indigo-600 font-medium">{exam.subject}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-slate-500">
                      {exam.course} - Sem {exam.semester}
                    </td>
                    <td className="py-4 px-4 font-mono">
                      <span className="text-slate-900 font-bold">{exam.maxMarks}</span> marks /{' '}
                      <span className="text-slate-500">{exam.durationMinutes}m</span>
                    </td>
                    <td className="py-4 px-4">
                      <Badge status={exam.status}>{exam.status.replace('_', ' ')}</Badge>
                    </td>
                    <td className="py-4 px-4">
                      {exam.assignedSetter ? (
                        <div className="space-y-1">
                          <p className="font-semibold text-slate-800">{exam.assignedSetter.name}</p>
                          <p className="text-[10px] text-slate-400">{exam.assignedSetter.email}</p>

                          {/* 1. Pending Setter Acceptance */}
                          {exam.status === 'SETTER_ASSIGNED' && (
                            <div className="pt-0.5 space-y-0.5">
                              <span className="inline-flex items-center text-[10px] text-amber-700 font-medium">
                                Paper Setter: Pending Response
                              </span>
                              <div className="text-[10px] text-slate-400 italic">
                                Syllabus: Not Available (Awaiting Acceptance)
                              </div>
                              <button
                                type="button"
                                onClick={() => openAssignSetterModal(exam)}
                                className="text-[10px] text-indigo-600 hover:text-indigo-700 underline font-medium block mt-0.5"
                              >
                                Change Setter
                              </button>
                            </div>
                          )}

                          {/* 2. Setter Rejected */}
                          {exam.status === 'SETTER_REJECTED' && (
                            <div className="pt-0.5 space-y-0.5">
                              <span className="inline-flex items-center text-[10px] text-rose-700 font-medium">
                                Paper Setter: Rejected
                              </span>
                              <div className="text-[10px] text-slate-400 italic">
                                Syllabus: Not Available
                              </div>
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => openAssignSetterModal(exam)}
                                className="text-[10px] py-0.5 px-2 mt-1"
                              >
                                Reassign Setter
                              </Button>
                            </div>
                          )}

                          {/* 3. Setter Accepted: Syllabus Assignment Available */}
                          {['SETTER_ACCEPTED', 'CONTENT_IN_PROGRESS', 'PAPER_SUBMITTED', 'PAPER_APPROVED', 'SCHEDULED', 'LIVE', 'COMPLETED', 'EVALUATION', 'RESULT_PUBLISHED'].includes(exam.status) && (
                            <div className="pt-0.5 space-y-1">
                              <div className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-medium">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Paper Setter: Accepted
                              </div>

                              {exam.assignedSyllabus ? (
                                <div className="flex items-center gap-2">
                                  <span className="inline-flex items-center gap-1 text-[10px] text-indigo-700 font-medium bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                                    <BookOpen className="w-3 h-3 text-indigo-600" /> Syllabus: Assigned
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => openAssignSyllabusModal(exam)}
                                    className="text-[10px] text-indigo-600 hover:text-indigo-700 underline font-medium"
                                  >
                                    Edit
                                  </button>
                                </div>
                              ) : (
                                <div className="pt-0.5">
                                  <span className="text-[10px] text-amber-700 font-medium block mb-1">
                                    Syllabus: Not Assigned
                                  </span>
                                  <Button
                                    size="sm"
                                    variant="primary"
                                    icon={BookOpen}
                                    onClick={() => openAssignSyllabusModal(exam)}
                                    className="text-[10px] py-1 px-2.5"
                                  >
                                    Assign Syllabus
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <span className="text-[11px] text-amber-700 italic block">No setter assigned</span>
                          <Button
                            size="sm"
                            variant="outline"
                            icon={UserCheck}
                            onClick={() => openAssignSetterModal(exam)}
                            className="text-[11px]"
                          >
                            Assign Paper Setter
                          </Button>
                        </div>
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
                          className="text-[11px] text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                        >
                          Delete
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openAssignSetterModal(exam)}
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Examination Title</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. B.Tech Semester VI Final Exam"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Examination Code</label>
              <input
                type="text"
                required
                disabled={!!editingExam}
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g. CS-CN-601"
                className={`w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-600 uppercase font-mono ${
                  editingExam ? 'opacity-60 cursor-not-allowed bg-slate-50' : ''
                }`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
              <input
                type="text"
                required
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="e.g. Computer Networks"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Course</label>
              <input
                type="text"
                required
                value={formData.course}
                onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                placeholder="e.g. B.Tech"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Semester</label>
              <input
                type="number"
                min="1"
                max="12"
                required
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Maximum Marks</label>
              <input
                type="number"
                min="1"
                required
                value={formData.maxMarks}
                onChange={(e) => setFormData({ ...formData, maxMarks: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-600 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Duration (Minutes)</label>
              <input
                type="number"
                min="15"
                required
                value={formData.durationMinutes}
                onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-600 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Instructions (One per line)</label>
            <textarea
              rows="3"
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
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

      {/* 1. Assign Paper Setter Modal */}
      <Modal
        isOpen={assignSetterModalOpen}
        onClose={() => setAssignSetterModalOpen(false)}
        title={`Assign Paper Setter - ${selectedExam?.name}`}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleAssignSetter} className="space-y-4">
          <p className="text-xs text-slate-500">
            Designate a faculty member as the official paper setter for{' '}
            <strong className="text-slate-800">{selectedExam?.name}</strong> (<span className="text-indigo-600 font-semibold">{selectedExam?.subject}</span>).
            The paper setter will receive an assignment request to accept or decline.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Select Faculty Paper Setter <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={selectedSetterId}
              onChange={(e) => setSelectedSetterId(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-600"
            >
              <option value="">-- Choose Exam Setter --</option>
              {setters.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.email}) - {s.department}
                </option>
              ))}
            </select>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 space-y-1">
            <span className="font-semibold text-slate-700 block">Workflow Notice:</span>
            <span>Academic syllabus will be assigned in the next step, only after this faculty member reviews and accepts the assignment.</span>
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
            <Button variant="ghost" onClick={() => setAssignSetterModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" icon={UserCheck}>
              Assign Paper Setter
            </Button>
          </div>
        </form>
      </Modal>

      {/* 2. Assign Syllabus Modal */}
      <Modal
        isOpen={assignSyllabusModalOpen}
        onClose={() => setAssignSyllabusModalOpen(false)}
        title={`Assign Syllabus to Paper Setter - ${selectedExam?.name}`}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleAssignSyllabus} className="space-y-4">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">
                Examination: <strong className="text-slate-800">{selectedExam?.name}</strong> (<span className="text-indigo-600 font-semibold">{selectedExam?.subject}</span>)
              </span>
              <span className="font-mono text-slate-500 text-[11px]">{selectedExam?.code}</span>
            </div>
            <div className="flex items-center gap-2 pt-1 border-t border-slate-200 text-[11px]">
              <span className="text-slate-500">Accepted Paper Setter:</span>
              <span className="font-semibold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                {selectedExam?.assignedSetter?.name || 'Assigned Faculty'}
              </span>
              <span className="text-slate-400">({selectedExam?.assignedSetter?.email})</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Select Curriculum Syllabus <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={selectedSyllabusId}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedSyllabusId(val);
                setIsDefiningNewSyllabus(val === '__NEW__');
              }}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-600"
            >
              <option value="">-- Choose Syllabus to Assign --</option>
              {syllabi
                .filter((s) => s.subject?.toLowerCase() === selectedExam?.subject?.toLowerCase())
                .map((s) => (
                  <option key={s._id} value={s._id}>
                    ★ [Subject Match] {s.subject} ({s.units?.length || 0} Units) {s.examination ? `- Exam: ${s.examination.code || s.examination.name}` : ''}
                  </option>
                ))}
              {syllabi
                .filter((s) => s.subject?.toLowerCase() !== selectedExam?.subject?.toLowerCase())
                .map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.subject} ({s.units?.length || 0} Units) {s.examination ? `- Exam: ${s.examination.code || s.examination.name}` : ''}
                  </option>
                ))}
              <option value="__NEW__">+ Define / Customize New Syllabus for this Examination</option>
            </select>
          </div>

          {/* Selected Syllabus Preview */}
          {selectedSyllabusId && selectedSyllabusId !== '__NEW__' && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div className="flex items-center justify-between text-slate-700">
                <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                  Assigned Syllabus Preview
                </span>
                {(() => {
                  const s = syllabi.find((item) => item._id === selectedSyllabusId);
                  return s ? (
                    <span className="text-[11px] text-emerald-700 font-mono bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {s.units?.length || 0} Units Defined
                    </span>
                  ) : null;
                })()}
              </div>
              {(() => {
                const s = syllabi.find((item) => item._id === selectedSyllabusId);
                if (!s || !s.units) return null;
                return (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {s.units.map((u, idx) => (
                      <div key={idx} className="p-2 rounded-lg bg-white border border-slate-200">
                        <div className="font-semibold text-slate-800">
                          Unit {u.unitNumber || idx + 1}: {u.title}
                        </div>
                        {u.description && (
                          <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                            {u.description}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Define New Syllabus Units Section */}
          {(isDefiningNewSyllabus || selectedSyllabusId === '__NEW__') && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-600" />
                    Define Syllabus Units for this Examination
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Specify the unit titles and descriptions that the setter will be instructed to use.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  icon={Plus}
                  onClick={() =>
                    setNewSyllabusUnits([
                      ...newSyllabusUnits,
                      {
                        unitNumber: newSyllabusUnits.length + 1,
                        title: `Unit ${newSyllabusUnits.length + 1}`,
                        description: ''
                      }
                    ])
                  }
                  className="text-[10px]"
                >
                  Add Unit
                </Button>
              </div>

              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {newSyllabusUnits.map((unit, uIdx) => (
                  <div key={uIdx} className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[10px] text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 shrink-0">
                        Unit {unit.unitNumber || uIdx + 1}
                      </span>
                      <input
                        type="text"
                        required
                        value={unit.title}
                        onChange={(e) => {
                          const updated = [...newSyllabusUnits];
                          updated[uIdx].title = e.target.value;
                          setNewSyllabusUnits(updated);
                        }}
                        placeholder="Unit Title (e.g. Network Layer & Routing)..."
                        className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-600"
                      />
                      {newSyllabusUnits.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setNewSyllabusUnits(newSyllabusUnits.filter((_, idx) => idx !== uIdx))}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors"
                          title="Remove Unit"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <textarea
                      rows="2"
                      value={unit.description}
                      onChange={(e) => {
                        const updated = [...newSyllabusUnits];
                        updated[uIdx].description = e.target.value;
                        setNewSyllabusUnits(updated);
                      }}
                      placeholder="Unit Description / Core syllabus boundaries for this module..."
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-[11px] text-slate-700 focus:outline-none focus:border-indigo-600 leading-normal"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
            <Button variant="ghost" onClick={() => setAssignSyllabusModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" icon={BookOpen}>
              Save Syllabus Assignment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ExaminationsList;
