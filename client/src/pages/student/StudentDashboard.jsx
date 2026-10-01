import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Calendar, Award, Clock, ArrowRight, CheckCircle2 } from 'lucide-react';

const StudentDashboard = () => {
  const [exams, setExams] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      const [examsRes, attemptsRes, resultsRes] = await Promise.all([
        api.get('/exams/available'),
        api.get('/exams/my-attempts'),
        api.get('/results')
      ]);

      if (examsRes.data.success) setExams(examsRes.data.examinations || []);
      if (attemptsRes.data.success) setAttempts(attemptsRes.data.attempts || []);
      if (resultsRes.data.success) setResults(resultsRes.data.results || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullPage text="Retrieving student portal information..." />;
  }

  const upcomingOrAvailable = exams.filter((e) => !e.myAttempt || e.myAttempt.status !== 'SUBMITTED');

  return (
    <div>
      <PageHeader
        title="Student Examination Portal"
        subtitle="Access scheduled examinations, conduct live testing sessions, and inspect officially published score reports."
        breadcrumb="Candidate Workspace"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <StatCard
          title="Available Examinations"
          value={upcomingOrAvailable.length}
          subtitle="Ready for test conduct"
          icon={Calendar}
          color="indigo"
        />
        <StatCard
          title="Submitted Exam Copies"
          value={attempts.length}
          subtitle="Under evaluation / evaluated"
          icon={Clock}
          color="purple"
        />
        <StatCard
          title="Published Results"
          value={results.length}
          subtitle="Officially approved marks"
          icon={Award}
          color="emerald"
        />
      </div>

      {/* Available Examinations Section */}
      <div className="surface-card rounded-xl border border-slate-800 overflow-hidden mb-8">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div>
            <h3 className="text-sm font-semibold text-slate-100 tracking-tight">Available Examinations</h3>
            <p className="text-xs text-slate-400 mt-0.5">Examinations open for online testing</p>
          </div>
          <Link to="/student/exams" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300">
            View All Examinations →
          </Link>
        </div>

        {upcomingOrAvailable.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-400">
            No active examinations scheduled at this time. All attempted exams are listed under My Attempts.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {upcomingOrAvailable.map((exam) => (
              <div key={exam._id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2.5">
                    <h4 className="text-base font-bold text-white">{exam.name}</h4>
                    <span className="font-mono text-[10px] bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-indigo-400 font-bold">
                      {exam.code}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 text-xs text-slate-400 mt-1">
                    <span>Subject: <strong className="text-white">{exam.subject}</strong></span>
                    <span>•</span>
                    <span>Duration: <strong className="text-slate-300 font-mono">{exam.durationMinutes} mins</strong></span>
                    <span>•</span>
                    <span>Max Marks: <strong className="text-white font-mono">{exam.maxMarks}</strong></span>
                  </div>
                </div>

                <Link to={`/student/exam-session/${exam._id}`}>
                  <Button variant="primary" size="md" icon={ArrowRight}>
                    Start Examination
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Published Results Section */}
      {results.length > 0 && (
        <div className="surface-card rounded-xl border border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
            <div>
              <h3 className="text-sm font-semibold text-slate-100 tracking-tight">Published Exam Results</h3>
              <p className="text-xs text-slate-400 mt-0.5">Official grades authorized by the examination board</p>
            </div>
            <Link to="/student/results" className="text-xs font-semibold text-emerald-400 hover:text-emerald-300">
              View Detailed Marksheets →
            </Link>
          </div>

          <div className="divide-y divide-slate-800/60">
            {results.map((res) => (
              <div key={res._id} className="p-4 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-white text-sm">{res.examination?.name}</p>
                  <p className="text-slate-400">{res.examination?.subject} ({res.examination?.code})</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <span className="font-mono font-bold text-base text-emerald-400">
                      {res.totalMarks} / {res.maxMarks}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      {res.percentage}% • Grade {res.grade}
                    </span>
                  </div>
                  <Link to="/student/results">
                    <Button size="sm" variant="outline">
                      Marksheet
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
