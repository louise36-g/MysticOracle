import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { getAllUsers, updateUserStatus, adjustUserCredits, setUserAdmin } from '../../services/storageService';
import { User, AccountStatus } from '../../types';
import { Search, Shield, ShieldOff, Plus, Minus, Check, X, Crown } from 'lucide-react';

const AdminUsers: React.FC = () => {
  const { language } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<User[]>(() => getAllUsers());
  const [creditAdjustment, setCreditAdjustment] = useState<{ userId: string; amount: string } | null>(null);

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    const term = searchTerm.toLowerCase();
    return users.filter(
      (u) =>
        u.username.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        u.id.toLowerCase().includes(term)
    );
  }, [users, searchTerm]);

  const refreshUsers = () => {
    setUsers(getAllUsers());
  };

  const handleStatusChange = (userId: string, newStatus: AccountStatus) => {
    updateUserStatus(userId, newStatus);
    refreshUsers();
  };

  const handleCreditAdjust = (userId: string, amount: number) => {
    adjustUserCredits(userId, amount);
    refreshUsers();
    setCreditAdjustment(null);
  };

  const handleToggleAdmin = (userId: string, currentIsAdmin: boolean) => {
    setUserAdmin(userId, !currentIsAdmin);
    refreshUsers();
  };

  const getStatusColor = (status: AccountStatus) => {
    switch (status) {
      case 'active':
        return 'text-green-400 bg-green-500/10';
      case 'flagged':
        return 'text-amber-400 bg-amber-500/10';
      case 'suspended':
        return 'text-red-400 bg-red-500/10';
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h2 className="text-xl font-heading text-purple-200">
          {language === 'en' ? 'User Management' : 'Gestion des Utilisateurs'}
        </h2>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={language === 'en' ? 'Search users...' : 'Rechercher...'}
            className="pl-10 pr-4 py-2 bg-slate-800/60 border border-purple-500/20 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500/50 w-full md:w-64"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900/60 rounded-xl border border-purple-500/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-purple-500/20 bg-slate-800/50">
                <th className="text-left p-4 text-slate-300 font-medium">
                  {language === 'en' ? 'User' : 'Utilisateur'}
                </th>
                <th className="text-left p-4 text-slate-300 font-medium">
                  {language === 'en' ? 'Credits' : 'Crédits'}
                </th>
                <th className="text-left p-4 text-slate-300 font-medium">
                  {language === 'en' ? 'Readings' : 'Lectures'}
                </th>
                <th className="text-left p-4 text-slate-300 font-medium">
                  {language === 'en' ? 'Status' : 'Statut'}
                </th>
                <th className="text-left p-4 text-slate-300 font-medium">
                  {language === 'en' ? 'Joined' : 'Inscrit'}
                </th>
                <th className="text-left p-4 text-slate-300 font-medium">
                  {language === 'en' ? 'Actions' : 'Actions'}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    {language === 'en' ? 'No users found' : 'Aucun utilisateur trouvé'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-purple-500/10 hover:bg-slate-800/30">
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
                      {creditAdjustment?.userId === user.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={creditAdjustment.amount}
                            onChange={(e) =>
                              setCreditAdjustment({ userId: user.id, amount: e.target.value })
                            }
                            className="w-20 px-2 py-1 bg-slate-700 border border-purple-500/30 rounded text-slate-200 text-sm"
                            placeholder="+/-"
                          />
                          <button
                            onClick={() =>
                              handleCreditAdjust(user.id, parseInt(creditAdjustment.amount) || 0)
                            }
                            className="p-1 text-green-400 hover:bg-green-500/20 rounded"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setCreditAdjustment(null)}
                            className="p-1 text-red-400 hover:bg-red-500/20 rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-purple-300 font-medium">{user.credits}</span>
                          <button
                            onClick={() => setCreditAdjustment({ userId: user.id, amount: '' })}
                            className="p-1 text-slate-400 hover:text-purple-300 hover:bg-purple-500/20 rounded"
                            title={language === 'en' ? 'Adjust credits' : 'Ajuster crédits'}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-slate-300">{user.totalReadings || 0}</td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          user.accountStatus
                        )}`}
                      >
                        {user.accountStatus}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400 text-sm">
                      {new Date(user.joinDate).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {user.accountStatus === 'active' ? (
                          <button
                            onClick={() => handleStatusChange(user.id, 'suspended')}
                            className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg"
                            title={language === 'en' ? 'Suspend user' : 'Suspendre'}
                          >
                            <ShieldOff className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusChange(user.id, 'active')}
                            className="p-2 text-green-400 hover:bg-green-500/20 rounded-lg"
                            title={language === 'en' ? 'Activate user' : 'Activer'}
                          >
                            <Shield className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleToggleAdmin(user.id, !!user.isAdmin)}
                          className={`p-2 rounded-lg ${
                            user.isAdmin
                              ? 'text-amber-400 hover:bg-amber-500/20'
                              : 'text-slate-400 hover:bg-slate-500/20'
                          }`}
                          title={
                            user.isAdmin
                              ? language === 'en'
                                ? 'Remove admin'
                                : 'Retirer admin'
                              : language === 'en'
                              ? 'Make admin'
                              : 'Rendre admin'
                          }
                        >
                          <Crown className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-4 text-slate-400 text-sm">
        {language === 'en'
          ? `Showing ${filteredUsers.length} of ${users.length} users`
          : `Affichage de ${filteredUsers.length} sur ${users.length} utilisateurs`}
      </p>
    </div>
  );
};

export default AdminUsers;
