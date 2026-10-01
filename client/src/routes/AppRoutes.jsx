import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';

// Auth
import Login from '../pages/auth/Login';

// Admin Pages
import AdminDashboard from '../pages/admin/AdminDashboard';
import ExaminationsList from '../pages/admin/ExaminationsList';
import SetterManagement from '../pages/admin/SetterManagement';
import EvaluatorManagement from '../pages/admin/EvaluatorManagement';
import CopyAssignment from '../pages/admin/CopyAssignment';
import QuestionPaperReviews from '../pages/admin/QuestionPaperReviews';
import AnswerCopiesList from '../pages/admin/AnswerCopiesList';
import ScanAnswerCopies from '../pages/admin/ScanAnswerCopies';
import ResultsManagement from '../pages/admin/ResultsManagement';
import ReportsAnalytics from '../pages/admin/ReportsAnalytics';
import AuditLogsView from '../pages/admin/AuditLogsView';

// Setter Pages
import SetterDashboard from '../pages/setter/SetterDashboard';
import MyExaminations from '../pages/setter/MyExaminations';
import SyllabusManager from '../pages/setter/SyllabusManager';
import QuestionBank from '../pages/setter/QuestionBank';
import QuestionPaperBuilder from '../pages/setter/QuestionPaperBuilder';

// Evaluator Pages
import EvaluatorDashboard from '../pages/evaluator/EvaluatorDashboard';
import AssignedCopies from '../pages/evaluator/AssignedCopies';
import EvaluationWorkspace from '../pages/evaluator/EvaluationWorkspace';
import EvaluationHistory from '../pages/evaluator/EvaluationHistory';

const AppRoutes = () => {
  const { isAuthenticated, user, getDashboardUrl } = useAuth();

  return (
    <Routes>
      {/* Public Login Route */}
      <Route
        path="/login"
        element={
          isAuthenticated && user ? (
            <Navigate to={getDashboardUrl(user.role)} replace />
          ) : (
            <Login />
          )
        }
      />

      {/* Root redirect */}
      <Route
        path="/"
        element={
          isAuthenticated && user ? (
            <Navigate to={getDashboardUrl(user.role)} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Authenticated Dashboard Layout Routes */}
      <Route element={<DashboardLayout />}>
        {/* Admin Routes */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/examinations" element={<ExaminationsList />} />
          <Route path="/admin/setters" element={<SetterManagement />} />
          <Route path="/admin/evaluators" element={<EvaluatorManagement />} />
          <Route path="/admin/copy-assignment" element={<CopyAssignment />} />
          <Route path="/admin/examinations/:id/scan" element={<ScanAnswerCopies />} />
          <Route path="/admin/examinations/:id/scanned-copies" element={<ScanAnswerCopies />} />
          <Route path="/admin/evaluate/:copyId" element={<EvaluationWorkspace />} />
          <Route path="/admin/question-papers" element={<QuestionPaperReviews />} />
          <Route path="/admin/answer-copies" element={<AnswerCopiesList />} />
          <Route path="/admin/results" element={<ResultsManagement />} />
          <Route path="/admin/reports" element={<ReportsAnalytics />} />
          <Route path="/admin/audit-logs" element={<AuditLogsView />} />
        </Route>

        {/* Exam Setter Routes */}
        <Route element={<ProtectedRoute allowedRoles={['EXAM_SETTER', 'ADMIN']} />}>
          <Route path="/setter/dashboard" element={<SetterDashboard />} />
          <Route path="/setter/examinations" element={<MyExaminations />} />
          <Route path="/setter/syllabus/:examId" element={<SyllabusManager />} />
          <Route path="/setter/questions" element={<QuestionBank />} />
          <Route path="/setter/question-papers" element={<QuestionPaperBuilder />} />
        </Route>

        {/* Evaluator Routes */}
        <Route element={<ProtectedRoute allowedRoles={['EVALUATOR', 'ADMIN']} />}>
          <Route path="/evaluator/dashboard" element={<EvaluatorDashboard />} />
          <Route path="/evaluator/assigned-copies" element={<AssignedCopies />} />
          <Route path="/evaluator/evaluate/:copyId" element={<EvaluationWorkspace />} />
          <Route path="/evaluator/history" element={<EvaluationHistory />} />
        </Route>
      </Route>

      {/* Catch-all 404 redirect */}
      <Route
        path="*"
        element={
          isAuthenticated && user ? (
            <Navigate to={getDashboardUrl(user.role)} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
};

export default AppRoutes;
