import React from 'react';
import { NavLink } from 'react-router-dom';
import { ROUTES } from '../../routes/routes';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  BarChart3,
  Settings,
  Package,
  Mail,
  Activity,
  Languages,
  FileText,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface NavItem {
  to: string;
  labelKey: string;
  labelDefault: string;
  icon: React.ReactNode;
}

const AdminNav: React.FC = () => {
  const { t } = useApp();

  const navItems: NavItem[] = [
    {
      to: ROUTES.ADMIN,
      labelKey: 'admin.AdminDashboard.tab_overview',
      labelDefault: 'Overview',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      to: ROUTES.ADMIN_USERS,
      labelKey: 'admin.AdminDashboard.tab_users',
      labelDefault: 'Users',
      icon: <Users className="w-4 h-4" />,
    },
    {
      to: ROUTES.ADMIN_TRANSACTIONS,
      labelKey: 'admin.AdminDashboard.tab_transactions',
      labelDefault: 'Transactions',
      icon: <CreditCard className="w-4 h-4" />,
    },
    {
      to: ROUTES.ADMIN_PACKAGES,
      labelKey: 'admin.AdminDashboard.tab_packages',
      labelDefault: 'Packages',
      icon: <Package className="w-4 h-4" />,
    },
    {
      to: ROUTES.ADMIN_EMAIL_TEMPLATES,
      labelKey: 'admin.AdminDashboard.tab_emails',
      labelDefault: 'Emails',
      icon: <Mail className="w-4 h-4" />,
    },
    {
      to: ROUTES.ADMIN_BLOG,
      labelKey: 'admin.AdminDashboard.tab_blog',
      labelDefault: 'Blog',
      icon: <FileText className="w-4 h-4" />,
    },
    {
      to: ROUTES.ADMIN_TAROT,
      labelKey: 'admin.AdminDashboard.tab_tarot-articles',
      labelDefault: 'The Arcanas',
      icon: <FileText className="w-4 h-4" />,
    },
    {
      to: ROUTES.ADMIN_ANALYTICS,
      labelKey: 'admin.AdminDashboard.tab_analytics',
      labelDefault: 'Analytics',
      icon: <BarChart3 className="w-4 h-4" />,
    },
    {
      to: ROUTES.ADMIN_HEALTH,
      labelKey: 'admin.AdminDashboard.tab_health',
      labelDefault: 'Health',
      icon: <Activity className="w-4 h-4" />,
    },
    {
      to: ROUTES.ADMIN_TRANSLATIONS,
      labelKey: 'admin.AdminDashboard.tab_translations',
      labelDefault: 'Translations',
      icon: <Languages className="w-4 h-4" />,
    },
    {
      to: ROUTES.ADMIN_SETTINGS,
      labelKey: 'admin.AdminDashboard.tab_settings',
      labelDefault: 'Settings',
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  const baseClasses =
    'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all';
  const activeClasses = 'bg-purple-600 text-white shadow-lg shadow-purple-500/20';
  const inactiveClasses =
    'bg-slate-800/50 text-slate-300 hover:bg-slate-700 hover:text-white';

  return (
    <nav className="flex flex-wrap gap-2 mb-8 border-b border-purple-500/20 pb-4">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === ROUTES.ADMIN}
          className={({ isActive }) =>
            `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`
          }
        >
          {item.icon}
          <span className="hidden sm:inline">
            {t(item.labelKey, item.labelDefault)}
          </span>
        </NavLink>
      ))}
    </nav>
  );
};

export default AdminNav;
