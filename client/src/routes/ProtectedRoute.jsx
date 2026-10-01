import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { user, loading, isAuthenticated, getDashboardUrl } = useAuth();

  if (loading) {
    return <LoadingSpinner fullPage text="Verifying credentials..." />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to={getDashboardUrl(user.role)} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
