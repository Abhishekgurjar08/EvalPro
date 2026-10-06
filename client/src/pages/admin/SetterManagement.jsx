import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useToast } from '../../context/ToastContext';
import { Users, UserCheck, AlertTriangle, CheckCircle2, RefreshCw, BookOpen, Layers, Plus, Trash2, Edit3 } from 'lucide-react';

const SetterManagement = () => {
  const [exams, setExams] = useState([]);
  const [setters, setSetters] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [assignSetterModalOpen, setAssignSetterModalOpen] = useState(false);
  const [assignSyllabusModalOpen, setAssignSyllabusModalOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [selectedSetterId, setSelectedSetterId] = useState('');
  const [syllabi, setSyllabi] = useState([]);
  const [selectedSyllabusId, setSelectedSyllabusId] = useState('');
  const [isDefiningNewSyllabus, setIsDefiningNewSyllabus] = useState(false);
  const [newSyllabusUnits, setNewSyllabusUnits] = useState([]);

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
        fetchData();
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
        fetchData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error assigning syllabus', 'error');
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
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Examination</th>
                  <th className="py-3.5 px-4">Subject</th>
                  <th className="py-3.5 px-4">Assigned Setter</th>
                  <th className="py-3.5 px-4">Assigned Date</th>
                  <th className="py-3.5 px-4">Setter Response</th>
                  <th className="py-3.5 px-4">Syllabus Status</th>
                  <th className="py-3.5 px-4">Response Date / Reason</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {exams.map((exam) => (
                  <tr key={exam._id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-4 font-semibold text-slate-900">
                      <div>{exam.name}</div>
                      <span className="text-[10px] text-slate-400 font-mono">{exam.code}</span>
                    </td>
                    <td className="py-4 px-4 text-slate-700">{exam.subject}</td>
                    <td className="py-4 px-4">
                      {exam.assignedSetter ? (
                        <div>
                          <p className="font-semibold text-slate-800">{exam.assignedSetter.name}</p>
                          <p className="text-[10px] text-slate-400">{exam.assignedSetter.email}</p>
                        </div>
                      ) : (
                        <span className="text-amber-700 italic">No setter assigned</span>
                      )}
                    </td>
                    <td className="py-4 px-4 font-mono text-slate-500">
                      {exam.setterAssignmentDate
                        ? new Date(exam.setterAssignmentDate).toLocaleDateString()
                        : '—'}
                    </td>
                    <td className="py-4 px-4">
                      {['SETTER_ACCEPTED', 'CONTENT_IN_PROGRESS', 'PAPER_SUBMITTED', 'PAPER_APPROVED', 'SCHEDULED', 'LIVE', 'COMPLETED', 'EVALUATION', 'RESULT_PUBLISHED'].includes(exam.status) ? (
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
                      {!exam.assignedSetter || exam.status === 'SETTER_ASSIGNED' ? (
                        <span className="text-slate-400 italic text-[11px]">Awaiting Acceptance</span>
                      ) : exam.status === 'SETTER_REJECTED' ? (
                        <span className="text-slate-400 italic text-[11px]">Not Available</span>
                      ) : (
                        exam.assignedSyllabus ? (
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              <BookOpen className="w-3 h-3 text-emerald-600" /> Assigned
                            </span>
                          </div>
                        ) : (
                          <div>
                            <span className="text-[11px] text-amber-700 font-semibold block mb-1">
                              Not Assigned
                            </span>
                            <Button
                              size="sm"
                              variant="primary"
                              icon={BookOpen}
                              onClick={() => openAssignSyllabusModal(exam)}
                              className="text-[10px] py-1 px-2"
                            >
                              Assign Syllabus
                            </Button>
                          </div>
                        )
                      )}
                    </td>
                    <td className="py-4 px-4">
                      {exam.setterRejectionReason ? (
                        <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[11px]">
                          <strong>Reason:</strong> {exam.setterRejectionReason}
                        </div>
                      ) : exam.setterResponseDate ? (
                        <span className="text-slate-500 font-mono text-[11px]">
                          {new Date(exam.setterResponseDate).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Awaiting response</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right space-x-1.5 whitespace-nowrap">
                      {!exam.assignedSetter ? (
                        <Button
                          size="sm"
                          variant="outline"
                          icon={UserCheck}
                          onClick={() => openAssignSetterModal(exam)}
                        >
                          Assign Setter
                        </Button>
                      ) : exam.status === 'SETTER_REJECTED' ? (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => openAssignSetterModal(exam)}
                        >
                          Reassign Setter
                        </Button>
                      ) : exam.status === 'SETTER_ASSIGNED' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openAssignSetterModal(exam)}
                        >
                          Change Setter
                        </Button>
                      ) : (
                        exam.assignedSyllabus ? (
                          <Button
                            size="sm"
                            variant="outline"
                            icon={Edit3}
                            onClick={() => openAssignSyllabusModal(exam)}
                          >
                            Edit Syllabus
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="primary"
                            icon={BookOpen}
                            onClick={() => openAssignSyllabusModal(exam)}
                          >
                            Assign Syllabus
                          </Button>
                        )
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 1. Assign Setter Modal */}
      <Modal
        isOpen={assignSetterModalOpen}
        onClose={() => setAssignSetterModalOpen(false)}
        title={`Assign Paper Setter - ${selectedExam?.name}`}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleAssignSetter} className="space-y-4">
          <p className="text-xs text-slate-500">
            Subject: <strong className="text-slate-800">{selectedExam?.subject}</strong> | Code: <span className="font-mono text-indigo-600">{selectedExam?.code}</span>
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
            <span>The syllabus can only be assigned after this faculty paper setter accepts the assignment request.</span>
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
                Subject: <strong className="text-slate-800">{selectedExam?.subject}</strong> | Code: <span className="font-mono text-indigo-600">{selectedExam?.code}</span>
              </span>
              <Badge status="ACCEPTED">Setter Accepted</Badge>
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

export default SetterManagement;
