import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import AdminOverview from './AdminOverview';
import AdminUsers from './AdminUsers';
import AdminTransactions from './AdminTransactions';
import AdminAnalytics from './AdminAnalytics';
import AdminPackages from './AdminPackages';
import AdminEmailTemplates from './AdminEmailTemplates';
import AdminHealth from './AdminHealth';
import AdminSettings from './AdminSettings';
import AdminTranslations from './AdminTranslations';
import AdminBlog from './AdminBlog';
import ImportArticle from './ImportArticle';
import AdminTarotArticles from './AdminTarotArticles';
import { LayoutDashboard, Users, CreditCard, BarChart3, Settings, Package, Mail, Activity, Languages, FileText, Upload } from 'lucide-react';

type AdminTab = 'overview' | 'users' | 'transactions' | 'analytics' | 'packages' | 'emails' | 'blog' | 'import-article' | 'tarot-articles' | 'health' | 'translations' | 'settings';

const AdminDashboard: React.FC = () => {
  const { language } = useApp();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | undefined>();
  const [blogKey, setBlogKey] = useState(0); // Key to force re-mount of AdminBlog

  const handleServiceClick = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    setActiveTab('settings');
  };

  const tabs: { id: AdminTab; labelEn: string; labelFr: string; icon: React.ReactNode }[] = [
    { id: 'overview', labelEn: 'Overview', labelFr: 'Apercu', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'users', labelEn: 'Users', labelFr: 'Utilisateurs', icon: <Users className="w-4 h-4" /> },
    { id: 'transactions', labelEn: 'Transactions', labelFr: 'Transactions', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'packages', labelEn: 'Packages', labelFr: 'Forfaits', icon: <Package className="w-4 h-4" /> },
    { id: 'emails', labelEn: 'Emails', labelFr: 'Emails', icon: <Mail className="w-4 h-4" /> },
    { id: 'blog', labelEn: 'Blog', labelFr: 'Blog', icon: <FileText className="w-4 h-4" /> },
    { id: 'import-article', labelEn: 'Import Article', labelFr: 'Importer Article', icon: <Upload className="w-4 h-4" /> },
    { id: 'tarot-articles', labelEn: 'Tarot Articles', labelFr: 'Articles Tarot', icon: <FileText className="w-4 h-4" /> },
    { id: 'analytics', labelEn: 'Analytics', labelFr: 'Analytique', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'health', labelEn: 'Health', labelFr: 'Sante', icon: <Activity className="w-4 h-4" /> },
    { id: 'translations', labelEn: 'Translations', labelFr: 'Traductions', icon: <Languages className="w-4 h-4" /> },
    { id: 'settings', labelEn: 'Settings', labelFr: 'Parametres', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-heading text-amber-400 mb-2">
          {language === 'en' ? 'Admin Dashboard' : 'Tableau de Bord Admin'}
        </h1>
        <p className="text-purple-300/70">
          {language === 'en'
            ? 'Manage users, view analytics, and configure the platform'
            : 'Gerez les utilisateurs, consultez les analyses et configurez la plateforme'}
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 mb-8 border-b border-purple-500/20 pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              // Clear selected service when clicking settings tab directly
              if (tab.id === 'settings') setSelectedServiceId(undefined);
              // Reset blog view when clicking blog tab
              if (tab.id === 'blog') setBlogKey(k => k + 1);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{language === 'en' ? tab.labelEn : tab.labelFr}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[500px]">
        {activeTab === 'overview' && <AdminOverview />}
        {activeTab === 'users' && <AdminUsers />}
        {activeTab === 'transactions' && <AdminTransactions />}
        {activeTab === 'packages' && <AdminPackages />}
        {activeTab === 'emails' && <AdminEmailTemplates />}
        {activeTab === 'blog' && <AdminBlog key={blogKey} />}
        {activeTab === 'import-article' && (
          <ImportArticle
            editingArticleId={editingArticleId}
            onCancelEdit={() => {
              setEditingArticleId(null);
              setActiveTab('tarot-articles');
            }}
          />
        )}
        {activeTab === 'tarot-articles' && (
          <AdminTarotArticles
            onNavigateToImport={(articleId) => {
              setEditingArticleId(articleId);
              setActiveTab('import-article');
            }}
          />
        )}
        {activeTab === 'analytics' && <AdminAnalytics />}
        {activeTab === 'health' && <AdminHealth onServiceClick={handleServiceClick} />}
        {activeTab === 'translations' && <AdminTranslations />}
        {activeTab === 'settings' && <AdminSettings selectedServiceId={selectedServiceId} />}
      </div>
    </div>
  );
};

export default AdminDashboard;
