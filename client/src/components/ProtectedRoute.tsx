import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useGetMeQuery } from '../store/api/authApi';

const ProtectedRoute = ({ children, roles }: { children: ReactNode; roles?: string[] }) => {
  const { data, isLoading, isError } = useGetMeQuery();

  if (isLoading) return null;
  if (isError) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(data!.user.role)) {
    // Send each role to its own home: admins never see user features and vice versa.
    return <Navigate to={data!.user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
