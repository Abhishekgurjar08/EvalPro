import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../context/ToastContext';
import {
  Scan,
  FolderKanban,
  Search,
  RefreshCw,
  ArrowRight,
  Clock,
  Layers,
  Sparkles,
  Filter,
  UserCheck
} from 'lucide-react';

const ScannedCopiesOverview = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summaryData, setSummaryData] = useState({
    totalSubjects: 0,
    totalCopies: 0,
    assignedCopies: 0,
    remainingCopies: 0,
    aiEvaluatedCopies: 0,
    completedCopies: 0,
    assignmentPercentage: 0
  });
  const [subjectStats, setSubjectStats] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, PENDING_ASSIGNMENT, FULLY_ASSIGNED

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setRefreshing(true);
      const res = await api.get('/answer-copies/subject-stats');
      if (res.data.success) {
        setSummaryData(res.data.summary || {});
        setSubjectStats(res.data.subjectStats || []);
      }
    } catch (err) {
      showToast('Failed to load subject-wise scanned copies data', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Filtered Subject Stats based on Search & Status Filter
  const filteredSubjects = useMemo(() => {
    return subjectStats.filter((sub) => {
      const matchesSearch =
        sub.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.name.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (statusFilter === 'PENDING_ASSIGNMENT') {
        return sub.remainingCopies > 0;
      } else if (statusFilter === 'FULLY_ASSIGNED') {
        return sub.totalCopies > 0 && sub.remainingCopies === 0;
      }
      return true;
    });
  }, [subjectStats, searchQuery, statusFilter]);

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Page Header */}
      <PageHeader
        breadcrumb="Manual & Digital Evaluation"
        title="Scanned Copies & Subject Quotas"
        subtitle="Subject-wise real-time breakdown of digitized student answer copies, allocated evaluators, and decrementing remaining unassigned pools."
        action={
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              loading={refreshing}
              onClick={fetchStats}
            >
              Refresh Data
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={FolderKanban}
              onClick={() => navigate('/admin/copy-assignment')}
            >
              Assign Copies
            </Button>
          </div>
        }
      />

      {loading ? (
        <LoadingSpinner fullPage text="Calculating subject-wise scanned copies & remaining quotas..." />
      ) : (
        <>
          {/* Top KPI Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Total Scanned Copies */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden group hover:border-indigo-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Total Scanned Copies
                </span>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <Scan className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {summaryData.totalCopies}
                </div>
                <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                  {summaryData.totalSubjects} Subjects
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-400">
                Total physical scripts scanned & digitally indexed
              </p>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-indigo-600" />
            </div>

            {/* Total Assigned Copies */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden group hover:border-emerald-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Assigned Copies
                </span>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                  <UserCheck className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <div className="text-3xl font-extrabold text-emerald-600 tracking-tight">
                  {summaryData.assignedCopies}
                </div>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
                  {summaryData.assignmentPercentage}% Allocated
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-400">
                Copies assigned to faculty evaluators
              </p>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-600" />
            </div>

            {/* Remaining Unassigned Copies */}
            <div className="bg-white p-5 rounded-2xl border border-amber-200/90 shadow-sm relative overflow-hidden bg-gradient-to-b from-white to-amber-50/20 group hover:border-amber-400 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                  Remaining Copies
                </span>
                <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <div className="text-3xl font-extrabold text-amber-600 tracking-tight">
                  {summaryData.remainingCopies}
                </div>
                <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200">
                  Available in Pool
                </span>
              </div>
              <p className="mt-2 text-xs text-amber-700/80 font-medium">
                Decrements automatically as copies are assigned
              </p>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-amber-500" />
            </div>

            {/* AI Evaluated / Completed */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden group hover:border-purple-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  AI Evaluated / Reviewed
                </span>
                <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
                  <Sparkles className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <div className="text-3xl font-extrabold text-purple-600 tracking-tight">
                  {summaryData.aiEvaluatedCopies}
                </div>
                <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200/60">
                  {summaryData.completedCopies} Finalized
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-400">
                Copies processed through AI rubric engine
              </p>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-indigo-600" />
            </div>
          </div>

          {/* Search, Filter and Actions Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
              <input
                type="text"
                placeholder="Search subject by name, code (e.g., CS-101, Chemistry)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 transition-all"
              />
            </div>

            <div className="flex items-center space-x-3 w-full md:w-auto">
              <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span>Filter:</span>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/20"
              >
                <option value="ALL">All Subjects</option>
                <option value="PENDING_ASSIGNMENT">Has Remaining Copies</option>
                <option value="FULLY_ASSIGNED">Fully Assigned</option>
              </select>
            </div>
          </div>

          {/* Subject-Wise Overview Cards */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>Subject Quota Breakdown</span>
                <span className="text-xs font-normal text-slate-500">
                  ({filteredSubjects.length} subjects found)
                </span>
              </h2>
            </div>

            {filteredSubjects.length === 0 ? (
              <EmptyState
                title="No Subjects Found"
                message="No examination subjects match your current search and filter criteria."
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredSubjects.map((sub) => {
                  const percentAssigned = sub.assignmentPercentage;

                  return (
                    <div
                      key={sub.examinationId}
                      className="rounded-2xl border border-slate-200/80 hover:border-slate-300 hover:shadow-md transition-all duration-200 p-5 bg-white shadow-sm flex flex-col justify-between relative overflow-hidden"
                    >
                      {/* Top Bar with Subject & Code */}
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200/80 tracking-wide mb-1.5">
                              {sub.code}
                            </span>
                            <h3 className="text-sm font-bold text-slate-900 truncate" title={sub.name}>
                              {sub.subject}
                            </h3>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">
                              {sub.course} • Sem {sub.semester} • Max {sub.maxMarks} Marks
                            </p>
                          </div>
                          <Badge
                            status={
                              sub.remainingCopies === 0 && sub.totalCopies > 0
                                ? 'COMPLETED'
                                : sub.remainingCopies > 0
                                ? 'PENDING'
                                : 'INFO'
                            }
                          >
                            {sub.remainingCopies === 0 && sub.totalCopies > 0
                              ? 'Fully Assigned'
                              : `${sub.remainingCopies} Remaining`}
                          </Badge>
                        </div>

                        {/* Numbers Grid: Total vs Assigned vs Remaining */}
                        <div className="mt-5 grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                          {/* Total */}
                          <div className="text-center">
                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Total
                            </span>
                            <span className="text-base font-extrabold text-slate-800">
                              {sub.totalCopies}
                            </span>
                          </div>

                          {/* Assigned */}
                          <div className="text-center border-x border-slate-200/70">
                            <span className="block text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                              Assigned
                            </span>
                            <span className="text-base font-extrabold text-emerald-700">
                              {sub.assignedCopies}
                            </span>
                          </div>

                          {/* Remaining */}
                          <div className="text-center">
                            <span className="block text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                              Remaining
                            </span>
                            <span className="text-base font-extrabold text-amber-700">
                              {sub.remainingCopies}
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-4">
                          <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 mb-1.5">
                            <span>Assignment Ratio</span>
                            <span className="font-semibold text-slate-800">{percentAssigned}%</span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
                            <div
                              className="h-full bg-emerald-500 transition-all duration-500"
                              style={{ width: `${percentAssigned}%` }}
                              title={`Assigned: ${sub.assignedCopies}`}
                            />
                            <div
                              className="h-full bg-amber-400/80 transition-all duration-500"
                              style={{ width: `${100 - percentAssigned}%` }}
                              title={`Remaining: ${sub.remainingCopies}`}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-[11px] text-slate-400">
                          Mode: <span className="font-medium text-slate-700">{sub.evaluationMode || 'MANUAL'}</span>
                        </span>
                        <div className="flex items-center space-x-2">
                          <Link
                            to="/admin/copy-assignment"
                            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                          >
                            <span>Assign</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ScannedCopiesOverview;
