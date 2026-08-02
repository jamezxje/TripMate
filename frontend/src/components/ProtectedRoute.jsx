import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useUserStore } from '../store/useUserStore';

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, token } = useUserStore();
  const location = useLocation();

  const isUserLoggedIn = isAuthenticated || !!token || !!localStorage.getItem('token');

  if (!isUserLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children ? children : <Outlet />;
};
