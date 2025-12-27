import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useApp } from '../../context/AppContext';
import { fetchAdminTransactions } from '../../services/apiService';
import { ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { motion } from 'framer-motion';

interface TransactionWithUser {
  id: string;
  type: string;
  amount: number;
  description: string;
  paymentProvider?: string;
  paymentStatus?: string;
  paymentAmount?: number;
  currency?: string;
  createdAt: string;
  user: { username: string; email: string };
}

const AdminTransactions: React.FC = () => {
  const { language } = useApp();
  const { getToken } = useAuth();

  const [transactions, setTransactions] = useState<TransactionWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    const loadTransactions = async () => {
      try {
        setLoading(true);
        const token = await getToken();
        if (!token) throw new Error('No token');

        const result = await fetchAdminTransactions(token, {
          page,
          limit: 25,
          type: typeFilter || undefined
        });

        setTransactions(result.transactions);
        setTotalPages(result.pagination.totalPages);
        setTotal(result.pagination.total);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load transactions');
      } finally {
        setLoading(false);
      }
    };

    loadTransactions();
  }, [getToken, page, typeFilter]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'PURCHASE': return 'text-green-400 bg-green-500/10';
      case 'READING': return 'text-blue-400 bg-blue-500/10';
      case 'QUESTION': return 'text-cyan-400 bg-cyan-500/10';
      case 'DAILY_BONUS': return 'text-amber-400 bg-amber-500/10';
      case 'ACHIEVEMENT': return 'text-purple-400 bg-purple-500/10';
      case 'REFERRAL_BONUS': return 'text-pink-400 bg-pink-500/10';
      case 'REFUND': return 'text-red-400 bg-red-500/10';
      default: return 'text-slate-400 bg-slate-500/10';
    }
  };

  const getAmountDisplay = (tx: TransactionWithUser) => {
    if (tx.type === 'PURCHASE' && tx.paymentAmount) {
      return `€${Number(tx.paymentAmount).toFixed(2)}`;
    }
    const prefix = tx.amount >= 0 ? '+' : '';
    return `${prefix}${tx.amount} cr`;
  };

  return (
    <div>
      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <Filter className="w-4 h-4 text-slate-400" />
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="px-4 py-2 bg-slate-800/60 border border-purple-500/20 rounded-lg text-slate-200 focus:outline-none"
        >
          <option value="">{language === 'en' ? 'All Types' : 'Tous les types'}</option>
          <option value="PURCHASE">{language === 'en' ? 'Purchases' : 'Achats'}</option>
          <option value="READING">{language === 'en' ? 'Readings' : 'Lectures'}</option>
          <option value="DAILY_BONUS">{language === 'en' ? 'Daily Bonus' : 'Bonus quotidien'}</option>
          <option value="ACHIEVEMENT">{language === 'en' ? 'Achievements' : 'Realisations'}</option>
          <option value="REFERRAL_BONUS">{language === 'en' ? 'Referrals' : 'Parrainages'}</option>
          <option value="REFUND">{language === 'en' ? 'Refunds' : 'Remboursements'}</option>
        </select>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-red-300 mb-4">
          {error}
        </div>
      )}

      {!loading && (
        <>
          <div className="bg-slate-900/60 rounded-xl border border-purple-500/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-purple-500/20 bg-slate-800/50">
                    <th className="text-left p-4 text-slate-300 font-medium">{language === 'en' ? 'Date' : 'Date'}</th>
                    <th className="text-left p-4 text-slate-300 font-medium">{language === 'en' ? 'User' : 'Utilisateur'}</th>
                    <th className="text-left p-4 text-slate-300 font-medium">{language === 'en' ? 'Type' : 'Type'}</th>
                    <th className="text-left p-4 text-slate-300 font-medium">{language === 'en' ? 'Description' : 'Description'}</th>
                    <th className="text-right p-4 text-slate-300 font-medium">{language === 'en' ? 'Amount' : 'Montant'}</th>
                    <th className="text-left p-4 text-slate-300 font-medium">{language === 'en' ? 'Status' : 'Statut'}</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        {language === 'en' ? 'No transactions found' : 'Aucune transaction trouvee'}
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx, index) => (
                      <motion.tr
                        key={tx.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.02 }}
                        className="border-b border-purple-500/10 hover:bg-slate-800/30"
                      >
                        <td className="p-4 text-slate-400 text-sm">
                          {new Date(tx.createdAt).toLocaleString()}
                        </td>
                        <td className="p-4">
                          <p className="text-slate-200 text-sm">{tx.user.username}</p>
                          <p className="text-slate-500 text-xs">{tx.user.email}</p>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(tx.type)}`}>
                            {tx.type.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-4 text-slate-300 text-sm max-w-[200px] truncate">
                          {tx.description}
                        </td>
                        <td className="p-4 text-right">
                          <span className={tx.amount >= 0 ? 'text-green-400' : 'text-red-400'}>
                            {getAmountDisplay(tx)}
                          </span>
                        </td>
                        <td className="p-4">
                          {tx.paymentStatus && (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              tx.paymentStatus === 'COMPLETED' ? 'text-green-400 bg-green-500/10' :
                              tx.paymentStatus === 'PENDING' ? 'text-amber-400 bg-amber-500/10' :
                              'text-red-400 bg-red-500/10'
                            }`}>
                              {tx.paymentStatus}
                            </span>
                          )}
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
                ? `Showing ${transactions.length} of ${total} transactions`
                : `Affichage de ${transactions.length} sur ${total} transactions`}
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
                {page} / {totalPages || 1}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-2 bg-slate-800 rounded-lg text-slate-300 disabled:opacity-50 hover:bg-slate-700"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminTransactions;
