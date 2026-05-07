import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import ModernLoader from "./common/ModernLoader";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <ModernLoader />;
  }

  if (!isAuthenticated) {
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <ModernLoader />;
  }

  // If user is authenticated and trying to access login page, redirect to dashboard
  if (isAuthenticated && location.pathname === "/login") {
    return <Navigate to="/" replace />;
  }

  return children;
};
export const PermissionRoute = ({ 
  children, 
  module, 
  action = "view" 
}: { 
  children: React.ReactNode; 
  module: string; 
  action?: string;
}) => {
  const { hasPermission, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <ModernLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!hasPermission(module, action)) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4 text-red-500">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Access Denied</h2>
        <p className="text-slate-500 max-w-xs">
          You don't have permission to access the <strong>{module}</strong> module with <strong>{action}</strong> privileges.
        </p>
      </div>
    );
  }

  return children;
};
