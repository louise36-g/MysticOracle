import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { ROUTES } from '../../routes/routes';

export function ProtectedRoute() {
  const { isSignedIn, isLoaded } = useUser();
  const location = useLocation();

  // Show nothing while Clerk loads
  if (!isLoaded) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Redirect to home if not signed in
  if (!isSignedIn) {
    return <Navigate to={ROUTES.HOME} state={{ from: location }} replace />;
  }

  return <Outlet />;
}
