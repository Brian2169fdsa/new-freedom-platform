import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LoadingScreen } from '../layout/LoadingScreen';
import type { UserRole } from '../../types';

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
}

export function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
  const { firebaseUser, user, loading, initialized } = useAuth();
  const location = useLocation();

  if (!initialized || loading) return <LoadingScreen />;

  const isAuthenticated = firebaseUser || (DEMO_MODE && user);
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRoles && user && !requiredRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
