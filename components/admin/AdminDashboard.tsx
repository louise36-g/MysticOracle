import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import AdminOverview from './AdminOverview';
import AdminUsers from './AdminUsers';
import AdminAnalytics from './AdminAnalytics';

type AdminTab = 'overview' | 'users' | 'analytics';

const AdminDashboard: React.FC = () => {
  const { language } = useApp();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  const tabs: { id: AdminTab; labelEn: string; labelFr: string }[] = [
    { id: 'overview', labelEn: 'Overview', labelFr: 'Aperçu' },
    { id: 'users', labelEn: 'Users', labelFr: 'Utilisateurs' },
    { id: 'analytics', labelEn: 'Analytics', labelFr: 'Analytique' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-heading text-amber-400 mb-2">
        {language === 'en' ? 'Admin Dashboard' : 'Tableau de Bord Admin'}
      </h1>
      <p className="text-purple-300/70 mb-8">
        {language === 'en' ? 'Manage users and view platform analytics' : 'Gérez les utilisateurs et consultez les analyses'}
      </p>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-8 border-b border-purple-500/20 pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-purple-600 text-white'
                : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {language === 'en' ? tab.labelEn : tab.labelFr}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && <AdminOverview />}
      {activeTab === 'users' && <AdminUsers />}
      {activeTab === 'analytics' && <AdminAnalytics />}
    </div>
  );
};

export default AdminDashboard;
