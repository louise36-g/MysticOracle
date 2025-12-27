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
} from '../../services/apiService';
import { Search, Shield, ShieldOff, Plus, Check, X, Crown, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

const AdminUsers: React.FC = () => {
  const { language } = useApp();
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
            placeholder={language === 'en' ? 'Search users...' : 'Rechercher...'}
            className="w-full pl-10 pr-4 py-2 bg-slate-800/60 border border-purple-500/20 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as any); setPage(1); }}
          className="px-4 py-2 bg-slate-800/60 border border-purple-500/20 rounded-lg text-slate-200 focus:outline-none"
        >
          <option value="">{language === 'en' ? 'All Status' : 'Tous les statuts'}</option>
          <option value="ACTIVE">{language === 'en' ? 'Active' : 'Actif'}</option>
          <option value="FLAGGED">{language === 'en' ? 'Flagged' : 'Signale'}</option>
          <option value="SUSPENDED">{language === 'en' ? 'Suspended' : 'Suspendu'}</option>
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
          <option value="createdAt-desc">{language === 'en' ? 'Newest First' : 'Plus recents'}</option>
          <option value="createdAt-asc">{language === 'en' ? 'Oldest First' : 'Plus anciens'}</option>
          <option value="credits-desc">{language === 'en' ? 'Most Credits' : 'Plus de credits'}</option>
          <option value="totalReadings-desc">{language === 'en' ? 'Most Readings' : 'Plus de lectures'}</option>
          <option value="username-asc">{language === 'en' ? 'Name A-Z' : 'Nom A-Z'}</option>
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
                    <th className="text-left p-4 text-slate-300 font-medium">{language === 'en' ? 'User' : 'Utilisateur'}</th>
                    <th className="text-left p-4 text-slate-300 font-medium">{language === 'en' ? 'Credits' : 'Credits'}</th>
                    <th className="text-left p-4 text-slate-300 font-medium">{language === 'en' ? 'Readings' : 'Lectures'}</th>
                    <th className="text-left p-4 text-slate-300 font-medium">{language === 'en' ? 'Status' : 'Statut'}</th>
                    <th className="text-left p-4 text-slate-300 font-medium">{language === 'en' ? 'Joined' : 'Inscrit'}</th>
                    <th className="text-left p-4 text-slate-300 font-medium">{language === 'en' ? 'Actions' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        {language === 'en' ? 'No users found' : 'Aucun utilisateur trouve'}
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
                              className="p-1 text-slate-400 hover:text-purple-300 hover:bg-purple-500/20 rounded"
                              title={language === 'en' ? 'Adjust credits' : 'Ajuster credits'}
                            >
                              <Plus className="w-3 h-3" />
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
                              title={language === 'en' ? 'View details' : 'Voir details'}
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {user.accountStatus === 'ACTIVE' ? (
                              <button
                                onClick={() => handleStatusChange(user.id, 'SUSPENDED')}
                                className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg"
                                title={language === 'en' ? 'Suspend user' : 'Suspendre'}
                              >
                                <ShieldOff className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleStatusChange(user.id, 'ACTIVE')}
                                className="p-2 text-green-400 hover:bg-green-500/20 rounded-lg"
                                title={language === 'en' ? 'Activate user' : 'Activer'}
                              >
                                <Shield className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleToggleAdmin(user.id)}
                              className={`p-2 rounded-lg ${user.isAdmin ? 'text-amber-400 hover:bg-amber-500/20' : 'text-slate-400 hover:bg-slate-500/20'}`}
                              title={user.isAdmin ? (language === 'en' ? 'Remove admin' : 'Retirer admin') : (language === 'en' ? 'Make admin' : 'Rendre admin')}
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
              {language === 'en'
                ? `Showing ${data.users.length} of ${data.pagination.total} users`
                : `Affichage de ${data.users.length} sur ${data.pagination.total} utilisateurs`}
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
              {language === 'en' ? 'Adjust Credits' : 'Ajuster Credits'}: {creditModal.username}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  {language === 'en' ? 'Amount (+/-)' : 'Montant (+/-)'}
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
                  {language === 'en' ? 'Reason' : 'Raison'}
                </label>
                <input
                  type="text"
                  value={creditReason}
                  onChange={(e) => setCreditReason(e.target.value)}
                  placeholder={language === 'en' ? 'Bonus, refund, etc.' : 'Bonus, remboursement, etc.'}
                  className="w-full px-4 py-2 bg-slate-800 border border-purple-500/20 rounded-lg text-slate-200"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setCreditModal(null)}
                  className="flex-1 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600"
                >
                  {language === 'en' ? 'Cancel' : 'Annuler'}
                </button>
                <button
                  onClick={handleCreditAdjust}
                  disabled={!creditAmount || !creditReason}
                  className="flex-1 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 disabled:opacity-50"
                >
                  {language === 'en' ? 'Apply' : 'Appliquer'}
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
                <span className="text-slate-400">{language === 'en' ? 'Total Earned' : 'Total gagne'}</span>
                <span className="text-green-400">{selectedUser.totalCreditsEarned}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{language === 'en' ? 'Total Spent' : 'Total depense'}</span>
                <span className="text-red-400">{selectedUser.totalCreditsSpent}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{language === 'en' ? 'Readings' : 'Lectures'}</span>
                <span className="text-slate-200">{selectedUser.totalReadings}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{language === 'en' ? 'Login Streak' : 'Jours consecutifs'}</span>
                <span className="text-amber-400">{selectedUser.loginStreak} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{language === 'en' ? 'Last Login' : 'Derniere connexion'}</span>
                <span className="text-slate-200">{new Date(selectedUser.lastLoginDate).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{language === 'en' ? 'Achievements' : 'Realisations'}</span>
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
