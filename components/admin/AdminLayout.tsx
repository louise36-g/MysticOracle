import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import AdminNav from './AdminNav';

// Loading fallback for nested route content
const AdminContentLoader: React.FC = () => (
  <div className="flex items-center justify-center py-20">
    <div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
  </div>
);

const AdminLayout: React.FC = () => {
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

      {/* Tab Navigation */}
      <AdminNav />

      {/* Nested Route Content */}
      <div className="min-h-[500px]">
        <Suspense fallback={<AdminContentLoader />}>
          <Outlet />
        </Suspense>
      </div>
    </div>
  );
};

export default AdminLayout;
