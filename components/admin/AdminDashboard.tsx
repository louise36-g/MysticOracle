import React from 'react';
import { useApp } from '../../context/AppContext';
import AdminOverview from './AdminOverview';

/**
 * AdminDashboard - Legacy Component
 *
 * This component has been simplified as part of the React Router migration.
 * Tab-based navigation is now handled by AdminLayout + AdminNav with nested routes.
 *
 * This component remains as a pass-through for the legacy SPA routing in App.tsx.
 * Once App.tsx is migrated to use React Router, this component can be removed.
 *
 * @see AdminLayout.tsx - New layout with navigation
 * @see AdminNav.tsx - Route-based navigation
 * @see /routes/routes.ts - Route definitions
 */
const AdminDashboard: React.FC = () => {
  const { t } = useApp();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-heading text-amber-400 mb-2">
          {t('admin.AdminDashboard.admin_dashboard', 'Admin Dashboard')}
        </h1>
        <p className="text-purple-300/70">
          {t(
            'admin.AdminDashboard.manage_users_view_analytics',
            'Manage users, view analytics, and configure the platform'
          )}
        </p>
      </div>

      {/* Overview Content */}
      <AdminOverview />
    </div>
  );
};

export default AdminDashboard;
