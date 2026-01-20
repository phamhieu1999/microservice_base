import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const isAuthed = useAppSelector((s) => Boolean(s.auth.accessToken));
  if (!isAuthed) return <Navigate to="/login" replace />;
  return <>{children}</>;
}


