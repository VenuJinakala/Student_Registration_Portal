import React from 'react';
import { useLocation } from 'react-router-dom';

export default function Footer() {
  const location = useLocation();

  let pageName = 'Task Document';
  if (location.pathname === '/login' || location.pathname === '/') {
    pageName = 'Unified Login';
  } else if (location.pathname === '/signup') {
    pageName = 'Student Signup';
  } else if (location.pathname === '/student-dashboard') {
    pageName = 'Student Dashboard';
  } else if (location.pathname === '/admin-dashboard') {
    pageName = 'Admin Dashboard';
  }

  return (
    <footer className="portal-footer">
      <div className="container">
        <span>Basic Coding Test - 1 | {pageName} | Task Document</span>
      </div>
    </footer>
  );
}
