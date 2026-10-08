import React from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../services/api';

export default function ProtectedRoute({ children, allowedRole }) {
  const user = authService.getCurrentUser();
  const role = authService.getRole();

  if (!user) {
    return <Navigate to="/login" replace state={{ error: 'Please log in to access this page.' }} />;
  }

  if (allowedRole && role !== allowedRole) {
    return (
      <Navigate
        to={role === 'student' ? '/student-dashboard' : '/admin-dashboard'}
        replace
        state={{ error: 'Unauthorized access. You do not have permission to view that page.' }}
      />
    );
  }

  return children;
}
