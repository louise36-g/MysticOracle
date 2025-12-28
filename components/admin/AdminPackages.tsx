import React, { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useApp } from '../../context/AppContext';
import {
  fetchAdminPackages,
  createAdminPackage,
  updateAdminPackage,
  deleteAdminPackage,
  seedAdminPackages,
  AdminCreditPackage
} from '../../services/apiService';
import { Plus, Edit2, Trash2, Package, Check, X, GripVertical, Download } from 'lucide-react';
import { motion } from 'framer-motion';

// Form component defined outside to prevent re-creation on every render
const PackageFormFields: React.FC<{
  formData: {
    credits: number;
    priceEur: number;
    nameEn: string;
    nameFr: string;
    labelEn: string;
    labelFr: string;
    discount: number;
    badge: string;
    isActive: boolean;
    sortOrder: number;
  };
  setFormData: React.Dispatch<React.SetStateAction<{
    credits: number;
    priceEur: number;
    nameEn: string;
    nameFr: string;
    labelEn: string;
    labelFr: string;
    discount: number;
    badge: string;
    isActive: boolean;
    sortOrder: number;
  }>>;
  language: string;
  onSave: () => void;
  onCancel: () => void;
  isNew: boolean;
}> = ({ formData, setFormData, language, onSave, onCancel, isNew }) => (
  <motion.div
    initial={{ opacity: 0, height: 0 }}
    animate={{ opacity: 1, height: 'auto' }}
    exit={{ opacity: 0, height: 0 }}
    className="bg-slate-800/50 rounded-lg p-4 border border-purple-500/30"
  >
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
      <div>
        <label className="block text-xs text-slate-400 mb-1">Credits</label>
        <input
          type="number"
          value={formData.credits}
          onChange={e => setFormData(prev => ({ ...prev, credits: parseInt(e.target.value) || 0 }))}
          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white text-sm"
        />
      </div>
      <div>
        <label className="block text-xs text-slate-400 mb-1">Price (EUR)</label>
        <input
          type="number"
          step="0.01"
          value={formData.priceEur}
          onChange={e => setFormData(prev => ({ ...prev, priceEur: parseFloat(e.target.value) || 0 }))}
          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white text-sm"
        />
      </div>
      <div>
        <label className="block text-xs text-slate-400 mb-1">Discount %</label>
        <input
          type="number"
          value={formData.discount}
          onChange={e => setFormData(prev => ({ ...prev, discount: parseInt(e.target.value) || 0 }))}
          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white text-sm"
        />
      </div>
      <div>
        <label className="block text-xs text-slate-400 mb-1">Sort Order</label>
        <input
          type="number"
          value={formData.sortOrder}
          onChange={e => setFormData(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white text-sm"
        />
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4 mb-4">
      <div>
        <label className="block text-xs text-slate-400 mb-1">Name (EN)</label>
        <input
          type="text"
          value={formData.nameEn}
          onChange={e => setFormData(prev => ({ ...prev, nameEn: e.target.value }))}
          placeholder="e.g., Starter Pack"
          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white text-sm"
        />
      </div>
      <div>
        <label className="block text-xs text-slate-400 mb-1">Name (FR)</label>
        <input
          type="text"
          value={formData.nameFr}
          onChange={e => setFormData(prev => ({ ...prev, nameFr: e.target.value }))}
          placeholder="e.g., Pack Debutant"
          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white text-sm"
        />
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4 mb-4">
      <div>
        <label className="block text-xs text-slate-400 mb-1">Label (EN)</label>
        <input
          type="text"
          value={formData.labelEn}
          onChange={e => setFormData(prev => ({ ...prev, labelEn: e.target.value }))}
          placeholder="e.g., Best Value"
          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white text-sm"
        />
      </div>
      <div>
        <label className="block text-xs text-slate-400 mb-1">Label (FR)</label>
        <input
          type="text"
          value={formData.labelFr}
          onChange={e => setFormData(prev => ({ ...prev, labelFr: e.target.value }))}
          placeholder="e.g., Meilleur Valeur"
          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white text-sm"
        />
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4 mb-4">
      <div>
        <label className="block text-xs text-slate-400 mb-1">Badge</label>
        <select
          value={formData.badge}
          onChange={e => setFormData(prev => ({ ...prev, badge: e.target.value }))}
          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white text-sm"
        >
          <option value="">None</option>
          <option value="POPULAR">Popular</option>
          <option value="BEST_VALUE">Best Value</option>
          <option value="LIMITED">Limited Offer</option>
        </select>
      </div>
      <div className="flex items-center gap-2 pt-5">
        <input
          type="checkbox"
          id={`isActive-${isNew ? 'new' : 'edit'}`}
          checked={formData.isActive}
          onChange={e => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
          className="w-4 h-4"
        />
        <label htmlFor={`isActive-${isNew ? 'new' : 'edit'}`} className="text-sm text-slate-300">
          {language === 'en' ? 'Active' : 'Actif'}
        </label>
      </div>
    </div>

    <div className="flex gap-2">
      <button
        onClick={onSave}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 rounded text-white text-sm"
      >
        <Check className="w-4 h-4" />
        {isNew ? (language === 'en' ? 'Create' : 'Creer') : (language === 'en' ? 'Save' : 'Sauvegarder')}
      </button>
      <button
        onClick={onCancel}
        className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-white text-sm"
      >
        <X className="w-4 h-4" />
        {language === 'en' ? 'Cancel' : 'Annuler'}
      </button>
    </div>
  </motion.div>
);

const AdminPackages: React.FC = () => {
  const { language } = useApp();
  const { getToken } = useAuth();
  const [packages, setPackages] = useState<AdminCreditPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [seeding, setSeeding] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    credits: 10,
    priceEur: 1.99,
    nameEn: '',
    nameFr: '',
    labelEn: '',
    labelFr: '',
    discount: 0,
    badge: '',
    isActive: true,
    sortOrder: 0
  });

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) throw new Error('No token');

      const { packages: pkgs } = await fetchAdminPackages(token);
      setPackages(pkgs);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load packages');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const token = await getToken();
      if (!token) throw new Error('No token');

      await createAdminPackage(token, {
        ...formData,
        badge: formData.badge || null
      });
      await loadPackages();
      setShowNewForm(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create package');
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      const token = await getToken();
      if (!token) throw new Error('No token');

      await updateAdminPackage(token, id, {
        ...formData,
        badge: formData.badge || null
      });
      await loadPackages();
      setEditingId(null);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update package');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(language === 'en' ? 'Delete this package?' : 'Supprimer ce forfait?')) return;

    try {
      const token = await getToken();
      if (!token) throw new Error('No token');

      await deleteAdminPackage(token, id);
      await loadPackages();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete package');
    }
  };

  const startEdit = (pkg: AdminCreditPackage) => {
    setFormData({
      credits: pkg.credits,
      priceEur: Number(pkg.priceEur),
      nameEn: pkg.nameEn,
      nameFr: pkg.nameFr,
      labelEn: pkg.labelEn,
      labelFr: pkg.labelFr,
      discount: pkg.discount,
      badge: pkg.badge || '',
      isActive: pkg.isActive,
      sortOrder: pkg.sortOrder
    });
    setEditingId(pkg.id);
    setShowNewForm(false);
  };

  const resetForm = () => {
    setFormData({
      credits: 10,
      priceEur: 1.99,
      nameEn: '',
      nameFr: '',
      labelEn: '',
      labelFr: '',
      discount: 0,
      badge: '',
      isActive: true,
      sortOrder: packages.length
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setShowNewForm(false);
    resetForm();
  };

  const handleSeed = async () => {
    try {
      setSeeding(true);
      const token = await getToken();
      if (!token) throw new Error('No token');

      const result = await seedAdminPackages(token);
      setPackages(result.packages);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to seed packages');
    } finally {
      setSeeding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package className="w-6 h-6 text-amber-400" />
          <h2 className="text-xl font-heading text-purple-200">
            {language === 'en' ? 'Credit Packages' : 'Forfaits de Credits'}
          </h2>
        </div>
        {!showNewForm && !editingId && (
          <button
            onClick={() => { resetForm(); setShowNewForm(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-white text-sm"
          >
            <Plus className="w-4 h-4" />
            {language === 'en' ? 'Add Package' : 'Ajouter Forfait'}
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-red-300">
          {error}
        </div>
      )}

      {showNewForm && (
        <PackageFormFields
          formData={formData}
          setFormData={setFormData}
          language={language}
          onSave={handleCreate}
          onCancel={cancelEdit}
          isNew={true}
        />
      )}

      <div className="space-y-3">
        {packages.length === 0 && !showNewForm ? (
          <div className="text-center py-12">
            <p className="text-slate-400 mb-4">
              {language === 'en' ? 'No packages yet.' : 'Aucun forfait.'}
            </p>
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded-lg text-white text-sm mx-auto disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {seeding
                ? (language === 'en' ? 'Loading...' : 'Chargement...')
                : (language === 'en' ? 'Load Default Packages' : 'Charger les forfaits par défaut')}
            </button>
          </div>
        ) : (
          packages.map((pkg, index) => (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`bg-slate-900/60 rounded-lg border p-4 ${
                pkg.isActive ? 'border-purple-500/20' : 'border-slate-700 opacity-60'
              }`}
            >
              {editingId === pkg.id ? (
                <PackageFormFields
                  formData={formData}
                  setFormData={setFormData}
                  language={language}
                  onSave={() => handleUpdate(pkg.id)}
                  onCancel={cancelEdit}
                  isNew={false}
                />
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <GripVertical className="w-4 h-4 text-slate-600" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-white">
                          {pkg.credits} {language === 'en' ? 'credits' : 'credits'}
                        </span>
                        <span className="text-amber-400 font-medium">
                          EUR {Number(pkg.priceEur).toFixed(2)}
                        </span>
                        {pkg.badge && (
                          <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded text-xs">
                            {pkg.badge}
                          </span>
                        )}
                        {!pkg.isActive && (
                          <span className="px-2 py-0.5 bg-slate-700 text-slate-400 rounded text-xs">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-400">
                        {language === 'en' ? pkg.nameEn : pkg.nameFr}
                        {pkg.discount > 0 && (
                          <span className="ml-2 text-green-400">-{pkg.discount}%</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => startEdit(pkg)}
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(pkg.id)}
                      className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminPackages;
