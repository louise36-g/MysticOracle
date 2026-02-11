import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useApp } from '../../context/AppContext';
import {
  fetchAdminUsers,
  updateUserStatus,
  adjustUserCredits,
  toggleUserAdmin,
  AdminUser,
  AdminUserList
} from '../../services/api';
import { Search, Shield, ShieldOff, Plus, Check, X, Crown, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

const AdminUsers: React.FC = () => {
  const { t } = useApp();
  const { getToken } = useAuth();

  const [data, setData] = useState<AdminUserList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & pagination
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ACTIVE' | 'FLAGGED' | 'SUSPENDED' | ''>('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<'createdAt' | 'credits' | 'totalReadings' | 'username'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Credit adjustment modal
  const [creditModal, setCreditModal] = useState<{ userId: string; username: string } | null>(null);
  const [creditAmount, setCreditAmount] = useState('');
  const [creditReason, setCreditReason] = useState('');

  // User detail modal
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) throw new Error('No token');

      const result = await fetchAdminUsers(token, {
        page,
        limit: 15,
        search: search || undefined,
        status: statusFilter || undefined,
        sortBy,
        sortOrder
      });

      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [getToken, page, search, statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      loadUsers();
    }, search ? 300 : 0);

    return () => clearTimeout(debounce);
  }, [loadUsers]);

  const handleStatusChange = async (userId: string, status: 'ACTIVE' | 'FLAGGED' | 'SUSPENDED') => {
    try {
      const token = await getToken();
      if (!token) return;

      await updateUserStatus(token, userId, status);
      loadUsers();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleToggleAdmin = async (userId: string) => {
    try {
      const token = await getToken();
      if (!token) return;

      await toggleUserAdmin(token, userId);
      loadUsers();
    } catch (err) {
      alert('Failed to toggle admin status');
    }
  };

  const handleCreditAdjust = async () => {
    if (!creditModal || !creditAmount || !creditReason) return;

    try {
      const token = await getToken();
      if (!token) return;

      await adjustUserCredits(token, creditModal.userId, parseInt(creditAmount), creditReason);
      setCreditModal(null);
      setCreditAmount('');
      setCreditReason('');
      loadUsers();
    } catch (err) {
      alert('Failed to adjust credits');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'text-green-400 bg-green-500/10';
      case 'FLAGGED': return 'text-amber-400 bg-amber-500/10';
      case 'SUSPENDED': return 'text-red-400 bg-red-500/10';
      default: return 'text-slate-400 bg-slate-500/10';
    }
  };

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder={t('admin.AdminUsers.search_users', 'Search users...')}
            className="w-full pl-10 pr-4 py-2 bg-slate-800/60 border border-purple-500/20 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as 'ACTIVE' | 'FLAGGED' | 'SUSPENDED' | ''); setPage(1); }}
          className="px-4 py-2 bg-slate-800/60 border border-purple-500/20 rounded-lg text-slate-200 focus:outline-none"
        >
          <option value="">{t('admin.AdminUsers.all_status', 'All Status')}</option>
          <option value="ACTIVE">{t('admin.AdminUsers.active', 'Active')}</option>
          <option value="FLAGGED">{t('admin.AdminUsers.flagged', 'Flagged')}</option>
          <option value="SUSPENDED">{t('admin.AdminUsers.suspended', 'Suspended')}</option>
        </select>

        <select
          value={`${sortBy}-${sortOrder}`}
          onChange={(e) => {
            const [by, order] = e.target.value.split('-') as [typeof sortBy, typeof sortOrder];
            setSortBy(by);
            setSortOrder(order);
            setPage(1);
          }}
          className="px-4 py-2 bg-slate-800/60 border border-purple-500/20 rounded-lg text-slate-200 focus:outline-none"
        >
          <option value="createdAt-desc">{t('admin.AdminUsers.newest_first', 'Newest First')}</option>
          <option value="createdAt-asc">{t('admin.AdminUsers.oldest_first', 'Oldest First')}</option>
          <option value="credits-desc">{t('admin.AdminUsers.most_credits', 'Most Credits')}</option>
          <option value="totalReadings-desc">{t('admin.AdminUsers.most_readings', 'Most Readings')}</option>
          <option value="username-asc">{t('admin.AdminUsers.name_az', 'Name A-Z')}</option>
        </select>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-red-300 mb-4">
          {error}
        </div>
      )}

      {/* Users Table */}
      {!loading && data && (
        <>
          <div className="bg-slate-900/60 rounded-xl border border-purple-500/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-purple-500/20 bg-slate-800/50">
                    <th className="text-left p-4 text-slate-300 font-medium">{t('admin.AdminUsers.user', 'User')}</th>
                    <th className="text-left p-4 text-slate-300 font-medium">{t('admin.AdminUsers.credits', 'Credits')}</th>
                    <th className="text-left p-4 text-slate-300 font-medium">{t('admin.AdminUsers.readings', 'Readings')}</th>
                    <th className="text-left p-4 text-slate-300 font-medium">{t('admin.AdminUsers.status', 'Status')}</th>
                    <th className="text-left p-4 text-slate-300 font-medium">{t('admin.AdminUsers.joined', 'Joined')}</th>
                    <th className="text-left p-4 text-slate-300 font-medium">{t('admin.AdminUsers.actions', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        {t('admin.AdminUsers.no_users_found', 'No users found')}
                      </td>
                    </tr>
                  ) : (
                    data.users.map((user) => (
                      <motion.tr
                        key={user.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="border-b border-purple-500/10 hover:bg-slate-800/30"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            {user.isAdmin && <Crown className="w-4 h-4 text-amber-400" />}
                            <div>
                              <p className="text-slate-200 font-medium">{user.username}</p>
                              <p className="text-slate-400 text-sm">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="text-purple-300 font-medium">{user.credits}</span>
                            <button
                              onClick={() => setCreditModal({ userId: user.id, username: user.username })}
                              className="flex items-center gap-1 px-2 py-1 text-xs text-emerald-400 bg-emerald-500/10
                                         hover:bg-emerald-500/20 border border-emerald-500/30 rounded-md transition-colors"
                              title={t('admin.AdminUsers.adjust_credits', 'Adjust credits')}
                            >
                              <Plus className="w-3 h-3" />
                              <span>{t('admin.AdminUsers.add', 'Add')}</span>
                            </button>
                          </div>
                        </td>
                        <td className="p-4 text-slate-300">{user.totalReadings}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.accountStatus)}`}>
                            {user.accountStatus}
                          </span>
                        </td>
                        <td className="p-4 text-slate-400 text-sm">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setSelectedUser(user)}
                              className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/20 rounded-lg"
                              title={t('admin.AdminUsers.view_details', 'View details')}
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {user.accountStatus === 'ACTIVE' ? (
                              <button
                                onClick={() => handleStatusChange(user.id, 'SUSPENDED')}
                                className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg"
                                title={t('admin.AdminUsers.suspend_user', 'Suspend user')}
                              >
                                <ShieldOff className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleStatusChange(user.id, 'ACTIVE')}
                                className="p-2 text-green-400 hover:bg-green-500/20 rounded-lg"
                                title={t('admin.AdminUsers.activate_user', 'Activate user')}
                              >
                                <Shield className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleToggleAdmin(user.id)}
                              className={`p-2 rounded-lg ${user.isAdmin ? 'text-amber-400 hover:bg-amber-500/20' : 'text-slate-400 hover:bg-slate-500/20'}`}
                              title={user.isAdmin ? t('admin.AdminUsers.remove_admin', 'Remove admin') : t('admin.AdminUsers.make_admin', 'Make admin')}
                            >
                              <Crown className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-slate-400 text-sm">
              {t('admin.AdminUsers.showing_users', `Showing ${data.users.length} of ${data.pagination.total} users`)}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 bg-slate-800 rounded-lg text-slate-300 disabled:opacity-50 hover:bg-slate-700"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-slate-300 px-4">
                {page} / {data.pagination.totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(data.pagination.totalPages, p + 1))}
                disabled={page >= data.pagination.totalPages}
                className="p-2 bg-slate-800 rounded-lg text-slate-300 disabled:opacity-50 hover:bg-slate-700"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Credit Adjustment Modal */}
      {creditModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-purple-500/30 rounded-xl p-6 max-w-md w-full"
          >
            <h3 className="text-lg font-heading text-purple-200 mb-4">
              {t('admin.AdminUsers.adjust_credits_2', 'Adjust Credits')}: {creditModal.username}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  {t('admin.AdminUsers.amount', 'Amount (+/-)')}
                </label>
                <input
                  type="number"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  placeholder="+10 or -5"
                  className="w-full px-4 py-2 bg-slate-800 border border-purple-500/20 rounded-lg text-slate-200"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  {t('admin.AdminUsers.reason', 'Reason')}
                </label>
                <input
                  type="text"
                  value={creditReason}
                  onChange={(e) => setCreditReason(e.target.value)}
                  placeholder={t('admin.AdminUsers.bonus_refund_etc', 'Bonus, refund, etc.')}
                  className="w-full px-4 py-2 bg-slate-800 border border-purple-500/20 rounded-lg text-slate-200"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setCreditModal(null)}
                  className="flex-1 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600"
                >
                  {t('admin.AdminUsers.cancel', 'Cancel')}
                </button>
                <button
                  onClick={handleCreditAdjust}
                  disabled={!creditAmount || !creditReason}
                  className="flex-1 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 disabled:opacity-50"
                >
                  {t('admin.AdminUsers.apply', 'Apply')}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-purple-500/30 rounded-xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-heading text-purple-200">
                {selectedUser.username}
              </h3>
              <button onClick={() => setSelectedUser(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Email</span>
                <span className="text-slate-200">{selectedUser.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Credits</span>
                <span className="text-purple-300">{selectedUser.credits}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{t('admin.AdminUsers.total_earned', 'Total Earned')}</span>
                <span className="text-green-400">{selectedUser.totalCreditsEarned}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{t('admin.AdminUsers.total_spent', 'Total Spent')}</span>
                <span className="text-red-400">{selectedUser.totalCreditsSpent}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{t('admin.AdminUsers.readings_2', 'Readings')}</span>
                <span className="text-slate-200">{selectedUser.totalReadings}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{t('admin.AdminUsers.login_streak', 'Login Streak')}</span>
                <span className="text-amber-400">{selectedUser.loginStreak} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{t('admin.AdminUsers.last_login', 'Last Login')}</span>
                <span className="text-slate-200">{new Date(selectedUser.lastLoginDate).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{t('admin.AdminUsers.achievements', 'Achievements')}</span>
                <span className="text-slate-200">{selectedUser._count.achievements}</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
