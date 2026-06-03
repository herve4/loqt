import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, checkOnboarding = true, checkValidation = true }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Rediriger vers la page de connexion en gardant en mémoire la page demandée
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (checkValidation && user) {
    if (user.validation_status === 'pending') {
      return <Navigate to="/pending-validation" replace />;
    }
    if (user.validation_status === 'rejected') {
      return <Navigate to="/rejected" replace />;
    }
  }

  if (checkOnboarding && user && user.onboarding_completed === false) {
    // Bloquer l'accès et rediriger vers la console d'onboarding
    return <Navigate to="/onboarding" replace />;
  }

  return children;
};

export default ProtectedRoute;

