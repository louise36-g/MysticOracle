import { Navigate, Outlet } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { useApp } from '../../context/AppContext';
import { ROUTES } from '../../routes/routes';
import { Shield } from 'lucide-react';

export function AdminRoute() {
  const { isSignedIn, isLoaded } = useUser();
  const { user, isLoading, t } = useApp();

  // Show nothing while loading
  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Redirect if not signed in
  if (!isSignedIn) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  // Show 403 if not admin
  if (!user?.isAdmin) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 bg-red-500/20 rounded-full flex items-center justify-center">
            <Shield className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-3xl font-heading text-white mb-4">
            {t('app.App.access_denied', 'Access Denied')}
          </h1>
          <p className="text-slate-400 mb-6">
            {t('app.App.access_denied_description', 'You do not have permission to access this page.')}
          </p>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
