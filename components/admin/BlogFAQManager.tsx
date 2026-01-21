import React from 'react';
import { useApp } from '../../context/AppContext';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { FAQItem } from '../../services/apiService';

interface BlogFAQManagerProps {
  faq: FAQItem[];
  onChange: (faq: FAQItem[]) => void;
}

const BlogFAQManager: React.FC<BlogFAQManagerProps> = ({ faq, onChange }) => {
  const { language } = useApp();

  const handleAdd = () => {
    onChange([...faq, { question: '', answer: '' }]);
  };

  const handleRemove = (index: number) => {
    onChange(faq.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, field: 'question' | 'answer', value: string) => {
    const updated = [...faq];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      {faq.map((item, index) => (
        <div
          key={index}
          className="bg-slate-800/50 rounded-lg p-3 border border-slate-700"
        >
          <div className="flex items-start gap-2 mb-2">
            <GripVertical className="w-4 h-4 text-slate-500 mt-2 cursor-grab" />
            <div className="flex-1">
              <label className="block text-xs text-slate-500 mb-1">
                {language === 'en' ? 'Question' : 'Question'} #{index + 1}
              </label>
              <input
                type="text"
                value={item.question}
                onChange={(e) => handleChange(index, 'question', e.target.value)}
                placeholder={language === 'en' ? 'Enter question...' : 'Entrez la question...'}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-sm text-slate-200"
              />
            </div>
            <button
              onClick={() => handleRemove(index)}
              className="p-1.5 text-red-400 hover:bg-red-500/20 rounded mt-5"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <div className="ml-6">
            <label className="block text-xs text-slate-500 mb-1">
              {language === 'en' ? 'Answer' : 'Reponse'}
            </label>
            <textarea
              value={item.answer}
              onChange={(e) => handleChange(index, 'answer', e.target.value)}
              placeholder={language === 'en' ? 'Enter answer...' : 'Entrez la reponse...'}
              rows={2}
              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-sm text-slate-200 resize-none"
            />
          </div>
        </div>
      ))}

      <button
        onClick={handleAdd}
        className="w-full py-2 border border-dashed border-slate-600 text-slate-400 rounded-lg hover:border-purple-500 hover:text-purple-400 text-sm flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" />
        {language === 'en' ? 'Add FAQ' : 'Ajouter FAQ'}
      </button>

      {faq.length === 0 && (
        <p className="text-center text-slate-500 text-sm py-4">
          {language === 'en' ? 'No FAQ items yet' : 'Aucune FAQ'}
        </p>
      )}
    </div>
  );
};

export default BlogFAQManager;
