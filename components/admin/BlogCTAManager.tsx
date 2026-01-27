import React from 'react';
import { useApp } from '../../context/AppContext';
import { Trash2, ExternalLink } from 'lucide-react';
import { CTAItem } from '../../services/apiService';

interface BlogCTAManagerProps {
  cta?: CTAItem;
  onChange: (cta: CTAItem | undefined) => void;
}

const BlogCTAManager: React.FC<BlogCTAManagerProps> = ({ cta, onChange }) => {
  const { language } = useApp();

  const handleEnable = () => {
    onChange({
      heading: language === 'en' ? 'Ready to Explore?' : 'Pret a explorer?',
      text: language === 'en'
        ? 'Discover what the cards have in store for you with a personalized reading.'
        : 'Decouvrez ce que les cartes vous reservent avec une lecture personnalisee.',
      buttonText: language === 'en' ? 'Get Your Reading' : 'Obtenez votre lecture',
      buttonUrl: '/reading',
    });
  };

  const handleDisable = () => {
    onChange(undefined);
  };

  const handleChange = (field: keyof CTAItem, value: string) => {
    if (!cta) return;
    onChange({ ...cta, [field]: value });
  };

  if (!cta) {
    return (
      <div className="text-center py-4">
        <p className="text-slate-500 text-sm mb-3">
          {language === 'en'
            ? 'Add a call to action banner at the end of your article'
            : 'Ajoutez une banniere d\'appel a l\'action a la fin de votre article'}
        </p>
        <button
          onClick={handleEnable}
          className="px-4 py-2 bg-purple-600/20 text-purple-300 rounded-lg hover:bg-purple-600/30 text-sm border border-purple-500/30"
        >
          {language === 'en' ? 'Enable CTA' : 'Activer CTA'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs text-slate-500 mb-1">
          {language === 'en' ? 'Heading' : 'Titre'}
        </label>
        <input
          type="text"
          value={cta.heading}
          onChange={(e) => handleChange('heading', e.target.value)}
          placeholder={language === 'en' ? 'Enter heading...' : 'Entrez le titre...'}
          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-sm text-slate-200"
        />
      </div>

      <div>
        <label className="block text-xs text-slate-500 mb-1">
          {language === 'en' ? 'Description' : 'Description'}
        </label>
        <textarea
          value={cta.text}
          onChange={(e) => handleChange('text', e.target.value)}
          placeholder={language === 'en' ? 'Enter description...' : 'Entrez la description...'}
          rows={2}
          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-sm text-slate-200 resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-slate-500 mb-1">
            {language === 'en' ? 'Button Text' : 'Texte du bouton'}
          </label>
          <input
            type="text"
            value={cta.buttonText}
            onChange={(e) => handleChange('buttonText', e.target.value)}
            placeholder={language === 'en' ? 'Button label...' : 'Libelle du bouton...'}
            className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-sm text-slate-200"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">
            {language === 'en' ? 'Button URL' : 'URL du bouton'}
          </label>
          <input
            type="text"
            value={cta.buttonUrl}
            onChange={(e) => handleChange('buttonUrl', e.target.value)}
            placeholder="/tarot"
            className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-sm text-slate-200"
          />
        </div>
      </div>

      {/* Preview */}
      <div className="mt-4 p-4 rounded-lg bg-gradient-to-r from-purple-900/50 to-indigo-900/50 border border-purple-500/30">
        <p className="text-xs text-slate-500 mb-2">{language === 'en' ? 'Preview:' : 'Apercu:'}</p>
        <h4 className="text-lg font-heading text-purple-200 mb-2">{cta.heading || '...'}</h4>
        <p className="text-slate-300 text-sm mb-3">{cta.text || '...'}</p>
        <div className="flex items-center gap-2">
          <span className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm">
            {cta.buttonText || '...'}
          </span>
          {cta.buttonUrl && (
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <ExternalLink className="w-3 h-3" />
              {cta.buttonUrl}
            </span>
          )}
        </div>
      </div>

      {/* Disable button */}
      <button
        onClick={handleDisable}
        className="w-full py-2 text-red-400 hover:bg-red-500/10 rounded-lg text-sm flex items-center justify-center gap-2 border border-red-500/30"
      >
        <Trash2 className="w-4 h-4" />
        {language === 'en' ? 'Remove CTA' : 'Supprimer CTA'}
      </button>
    </div>
  );
};

export default BlogCTAManager;
