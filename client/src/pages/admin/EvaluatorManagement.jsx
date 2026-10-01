import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useToast } from '../../context/ToastContext';
import { Plus, UserCheck, BookOpen, BarChart2 } from 'lucide-react';

const EvaluatorManagement = () => {
  const [evaluators, setEvaluators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    employeeId: '',
    department: 'Computer Science & Engineering',
    subjects: 'Computer Networks, Operating Systems',
    maxWorkload: 50,
    password: 'Evaluator@123'
  });

  const { showToast } = useToast();

  useEffect(() => {
    fetchEvaluators();
  }, []);

  const fetchEvaluators = async () => {
    try {
      setLoading(true);
      const res = await api.get('/evaluators');
      if (res.data.success) {
        setEvaluators(res.data.evaluators || []);
      }
    } catch (err) {
      showToast('Failed to load evaluators', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvaluator = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        subjects: formData.subjects.split(',').map((s) => s.trim()).filter((s) => s.length > 0)
      };

      const res = await api.post('/evaluators', payload);
      if (res.data.success) {
        showToast('Evaluator profile created successfully!', 'success');
        setCreateModalOpen(false);
        fetchEvaluators();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error creating evaluator', 'error');
    }
  };

  return (
    <div>
      <PageHeader
        title="Evaluator Faculty Management"
        subtitle="Manage evaluator profiles, subject specializations, and real-time grading capacity."
        breadcrumb="Faculty Governance"
        action={
          <Button variant="primary" icon={Plus} onClick={() => setCreateModalOpen(true)}>
            Add Faculty Evaluator
          </Button>
        }
      />

      {loading ? (
        <LoadingSpinner fullPage text="Loading evaluator faculty profiles..." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {evaluators.map((ev) => (
            <div key={ev._id} className="surface-card p-5 rounded-xl border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center text-xs">
                      {ev.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white tracking-tight">{ev.name}</h4>
                      <p className="text-xs text-slate-400">{ev.email}</p>
                    </div>
                  </div>
                  <Badge status={ev.status}>{ev.status}</Badge>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Faculty ID:</span>
                    <span className="font-mono text-slate-200">{ev.employeeId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Department:</span>
                    <span className="text-slate-200">{ev.department}</span>
                  </div>
                </div>

                {/* Assigned Subjects */}
                <div className="mt-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Authorized Subject Specializations
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {ev.subjects?.map((sub, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-lg text-[11px] bg-slate-900 border border-slate-800 text-indigo-300 font-medium"
                      >
                        {sub}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Workload Progress Bar */}
              <div className="mt-6 pt-4 border-t border-slate-800">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-400">Assigned Workload:</span>
                  <span className="font-semibold text-white">
                    {ev.workload?.activeAssigned || 0} / {ev.workload?.maxWorkload || 50} copies
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, ev.workload?.utilizationPercentage || 0)}%`
                    }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 mt-1.5">
                  <span>{ev.workload?.completed || 0} completed</span>
                  <span>{ev.workload?.utilizationPercentage || 0}% allocated</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Evaluator Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Add Faculty Evaluator Profile"
      >
        <form onSubmit={handleCreateEvaluator} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Dr. Rahul Sharma"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="evaluator@university.edu"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Faculty / Employee ID</label>
              <input
                type="text"
                required
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                placeholder="FAC-EVAL-205"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Department</label>
            <input
              type="text"
              required
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Authorized Subjects (Comma-separated)
            </label>
            <input
              type="text"
              required
              value={formData.subjects}
              onChange={(e) => setFormData({ ...formData, subjects: e.target.value })}
              placeholder="Computer Networks, Operating Systems"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Max Workload Capacity</label>
            <input
              type="number"
              min="10"
              max="200"
              value={formData.maxWorkload}
              onChange={(e) => setFormData({ ...formData, maxWorkload: Number(e.target.value) })}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
            <Button variant="ghost" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Evaluator
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default EvaluatorManagement;
