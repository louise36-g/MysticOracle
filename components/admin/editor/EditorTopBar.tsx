import React from 'react';
import { ArrowLeft, Save, Eye, ExternalLink, Code, FileText } from 'lucide-react';
import { EditorTopBarProps, AVAILABLE_LANGUAGES } from './types';

const EditorTopBar: React.FC<EditorTopBarProps> = ({
  title,
  isNew = false,
  onBack,
  onSave,
  saving,
  language,
  editLanguage,
  onEditLanguageChange,
  previewUrl,
  isPublished = false,
  showPublish = false,
  onPublish,
  editorMode,
  onEditorModeChange,
}) => {
  return (
    <div className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-purple-500/20">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">{language === 'en' ? 'Back' : 'Retour'}</span>
          </button>
          <div className="h-6 w-px bg-slate-700" />
          <h1 className="text-lg font-heading text-purple-200 truncate max-w-md">
            {title}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Language Selector (optional) */}
          {editLanguage && onEditLanguageChange && (
            <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
              {AVAILABLE_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => onEditLanguageChange(lang.code)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                    editLanguage === lang.code
                      ? 'bg-purple-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  <span>{lang.flag}</span>
                  <span className="hidden sm:inline">{lang.name}</span>
                </button>
              ))}
            </div>
          )}

          {/* Editor Mode Toggle (optional) */}
          {editorMode && onEditorModeChange && (
            <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-0.5">
              <button
                onClick={() => onEditorModeChange('markdown')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-colors ${
                  editorMode === 'markdown'
                    ? 'bg-purple-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
                title="Markdown editor"
              >
                <Code className="w-3.5 h-3.5" />
                <span>Markdown</span>
              </button>
              <button
                onClick={() => onEditorModeChange('visual')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-colors ${
                  editorMode === 'visual'
                    ? 'bg-purple-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
                title="Visual editor"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Visual</span>
              </button>
            </div>
          )}

          {/* Preview button */}
          {previewUrl && (
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 text-sm"
            >
              {isPublished ? (
                <ExternalLink className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">
                {isPublished
                  ? (language === 'en' ? 'View' : 'Voir')
                  : (language === 'en' ? 'Preview' : 'Aperçu')}
              </span>
            </a>
          )}

          {/* Save button */}
          <button
            onClick={onSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 disabled:opacity-50 text-sm font-medium"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {language === 'en' ? 'Save' : 'Enregistrer'}
          </button>

          {/* Publish button (optional) */}
          {showPublish && onPublish && (
            <button
              onClick={onPublish}
              disabled={saving}
              className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg text-sm font-medium ${
                isPublished
                  ? 'bg-slate-600 hover:bg-slate-500'
                  : 'bg-green-600 hover:bg-green-500'
              } disabled:opacity-50`}
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
              {isPublished
                ? (language === 'en' ? 'Unpublish' : 'Dépublier')
                : (language === 'en' ? 'Publish' : 'Publier')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditorTopBar;
