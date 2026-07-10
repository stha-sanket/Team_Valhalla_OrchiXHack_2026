import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useGetMeQuery } from '../store/api/authApi';

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { isLoading, isError } = useGetMeQuery();

  if (isLoading) return null;
  if (isError) return <Navigate to="/login" replace />;

  return <>{children}</>;
};

export default ProtectedRoute;
