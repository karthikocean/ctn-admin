import React from 'react';
import { useAuth } from '@/context/AuthContext';

interface PermissionGateProps {
  children: React.ReactNode;
  module: string;
  action: string;
  fallback?: React.ReactNode;
}

/**
 * A component that conditionally renders its children based on user permissions.
 */
export const PermissionGate: React.FC<PermissionGateProps> = ({ 
  children, 
  module, 
  action, 
  fallback = null 
}) => {
  const { hasPermission } = useAuth();

  if (hasPermission(module, action)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};

export default PermissionGate;
