import React, { useEffect, useState } from 'react';
import DOMPurify from 'dompurify';
import { useAuth } from '@clerk/clerk-react';
import { useApp } from '../../context/AppContext';
import {
  fetchAdminEmailTemplatesCRUD,
  createAdminEmailTemplate,
  updateAdminEmailTemplate,
  deleteAdminEmailTemplate,
  seedAdminEmailTemplates,
  AdminEmailTemplate
} from '../../services/apiService';
import { Plus, Edit2, Trash2, Mail, Check, X, Eye, Code, Download } from 'lucide-react';
import { motion } from 'framer-motion';

// Sanitize HTML for safe preview rendering
const sanitizeEmailHtml = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'a', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'span', 'div', 'hr'
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'style', 'class', 'width', 'height'],
    ALLOW_DATA_ATTR: false,
  });
};

const AdminEmailTemplates: React.FC = () => {
  const { language } = useApp();
  const { getToken } = useAuth();
  const [templates, setTemplates] = useState<AdminEmailTemplate[]>([]);
  const [brevoConfigured, setBrevoConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [previewLang, setPreviewLang] = useState<'en' | 'fr'>('en');
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  const [formData, setFormData] = useState({
    slug: '',
    subjectEn: '',
    bodyEn: '',
    subjectFr: '',
    bodyFr: '',
    isActive: true
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) throw new Error('No token');

      const data = await fetchAdminEmailTemplatesCRUD(token);
      setTemplates(data.templates);
      setBrevoConfigured(data.brevoConfigured);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const token = await getToken();
      if (!token) throw new Error('No token');

      await createAdminEmailTemplate(token, formData);
      await loadTemplates();
      setShowNewForm(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create template');
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      const token = await getToken();
      if (!token) throw new Error('No token');

      await updateAdminEmailTemplate(token, id, formData);
      await loadTemplates();
      setEditingId(null);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update template');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(language === 'en' ? 'Delete this template?' : 'Supprimer ce modele?')) return;

    try {
      const token = await getToken();
      if (!token) throw new Error('No token');

      await deleteAdminEmailTemplate(token, id);
      await loadTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete template');
    }
  };

  const startEdit = (template: AdminEmailTemplate) => {
    setFormData({
      slug: template.slug,
      subjectEn: template.subjectEn,
      bodyEn: template.bodyEn,
      subjectFr: template.subjectFr,
      bodyFr: template.bodyFr,
      isActive: template.isActive
    });
    setEditingId(template.id);
    setShowNewForm(false);
    setPreviewingId(null);
  };

  const resetForm = () => {
    setFormData({
      slug: '',
      subjectEn: '',
      bodyEn: '',
      subjectFr: '',
      bodyFr: '',
      isActive: true
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

      const result = await seedAdminEmailTemplates(token);
      setTemplates(result.templates);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to seed templates');
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

  const TemplateForm = ({ isNew }: { isNew: boolean }) => (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="bg-slate-800/50 rounded-lg p-4 border border-purple-500/30"
    >
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Slug (identifier)</label>
          <input
            type="text"
            value={formData.slug}
            onChange={e => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z_]/g, '') })}
            placeholder="e.g., welcome, purchase_confirmation"
            disabled={!isNew}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white text-sm disabled:opacity-50"
          />
        </div>
        <div className="flex items-center gap-2 pt-5">
          <input
            type="checkbox"
            id="isActiveTemplate"
            checked={formData.isActive}
            onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
            className="w-4 h-4"
          />
          <label htmlFor="isActiveTemplate" className="text-sm text-slate-300">
            {language === 'en' ? 'Active' : 'Actif'}
          </label>
        </div>
      </div>

      {/* English */}
      <div className="mb-4 p-3 bg-slate-900/50 rounded-lg">
        <h4 className="text-sm font-medium text-purple-300 mb-2">English</h4>
        <div className="mb-2">
          <label className="block text-xs text-slate-400 mb-1">Subject</label>
          <input
            type="text"
            value={formData.subjectEn}
            onChange={e => setFormData({ ...formData, subjectEn: e.target.value })}
            placeholder="Email subject line"
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Body (HTML)</label>
          <textarea
            value={formData.bodyEn}
            onChange={e => setFormData({ ...formData, bodyEn: e.target.value })}
            placeholder="<h1>Hello {{params.username}}</h1>..."
            rows={6}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white text-sm font-mono"
          />
        </div>
      </div>

      {/* French */}
      <div className="mb-4 p-3 bg-slate-900/50 rounded-lg">
        <h4 className="text-sm font-medium text-purple-300 mb-2">French</h4>
        <div className="mb-2">
          <label className="block text-xs text-slate-400 mb-1">Sujet</label>
          <input
            type="text"
            value={formData.subjectFr}
            onChange={e => setFormData({ ...formData, subjectFr: e.target.value })}
            placeholder="Ligne de sujet"
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Corps (HTML)</label>
          <textarea
            value={formData.bodyFr}
            onChange={e => setFormData({ ...formData, bodyFr: e.target.value })}
            placeholder="<h1>Bonjour {{params.username}}</h1>..."
            rows={6}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white text-sm font-mono"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => isNew ? handleCreate() : handleUpdate(editingId!)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 rounded text-white text-sm"
        >
          <Check className="w-4 h-4" />
          {isNew ? (language === 'en' ? 'Create' : 'Creer') : (language === 'en' ? 'Save' : 'Sauvegarder')}
        </button>
        <button
          onClick={cancelEdit}
          className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-white text-sm"
        >
          <X className="w-4 h-4" />
          {language === 'en' ? 'Cancel' : 'Annuler'}
        </button>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Mail className="w-6 h-6 text-cyan-400" />
          <div>
            <h2 className="text-xl font-heading text-purple-200">
              {language === 'en' ? 'Email Templates' : 'Modeles d\'Email'}
            </h2>
            <p className="text-xs text-slate-400">
              {brevoConfigured
                ? (language === 'en' ? 'Brevo connected' : 'Brevo connecte')
                : (language === 'en' ? 'Brevo not configured' : 'Brevo non configure')}
            </p>
          </div>
        </div>
        {!showNewForm && !editingId && (
          <button
            onClick={() => { resetForm(); setShowNewForm(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-white text-sm"
          >
            <Plus className="w-4 h-4" />
            {language === 'en' ? 'Add Template' : 'Ajouter Modele'}
          </button>
        )}
      </div>

      <div className="p-3 bg-slate-800/30 rounded-lg text-sm text-slate-400">
        <Code className="w-4 h-4 inline mr-2" />
        {language === 'en'
          ? 'Use {{params.variableName}} for dynamic content. Available: username, siteUrl, credits, amount, newBalance'
          : 'Utilisez {{params.variableName}} pour le contenu dynamique. Disponible: username, siteUrl, credits, amount, newBalance'}
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-red-300">
          {error}
        </div>
      )}

      {showNewForm && <TemplateForm isNew />}

      <div className="space-y-3">
        {templates.length === 0 && !showNewForm ? (
          <div className="text-center py-12">
            <p className="text-slate-400 mb-4">
              {language === 'en' ? 'No templates yet.' : 'Aucun modèle.'}
            </p>
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded-lg text-white text-sm mx-auto disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {seeding
                ? (language === 'en' ? 'Loading...' : 'Chargement...')
                : (language === 'en' ? 'Load Default Templates' : 'Charger les modèles par défaut')}
            </button>
          </div>
        ) : (
          templates.map((template, index) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`bg-slate-900/60 rounded-lg border p-4 ${
                template.isActive ? 'border-purple-500/20' : 'border-slate-700 opacity-60'
              }`}
            >
              {editingId === template.id ? (
                <TemplateForm isNew={false} />
              ) : (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 rounded text-xs font-mono">
                        {template.slug}
                      </span>
                      {!template.isActive && (
                        <span className="px-2 py-0.5 bg-slate-700 text-slate-400 rounded text-xs">
                          Inactive
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPreviewingId(previewingId === template.id ? null : template.id)}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => startEdit(template)}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(template.id)}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-slate-300">
                    {language === 'en' ? template.subjectEn : template.subjectFr}
                  </p>

                  {previewingId === template.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4 pt-4 border-t border-slate-700"
                    >
                      <div className="flex gap-2 mb-3">
                        <button
                          onClick={() => setPreviewLang('en')}
                          className={`px-3 py-1 rounded text-xs ${previewLang === 'en' ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-300'}`}
                        >
                          English
                        </button>
                        <button
                          onClick={() => setPreviewLang('fr')}
                          className={`px-3 py-1 rounded text-xs ${previewLang === 'fr' ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-300'}`}
                        >
                          French
                        </button>
                      </div>
                      <div className="bg-white rounded-lg p-4 max-h-64 overflow-auto">
                        <div
                          className="text-black text-sm"
                          dangerouslySetInnerHTML={{
                            __html: sanitizeEmailHtml(previewLang === 'en' ? template.bodyEn : template.bodyFr)
                          }}
                        />
                      </div>
                    </motion.div>
                  )}
                </>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminEmailTemplates;
