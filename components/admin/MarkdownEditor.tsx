import React, { useState, useMemo, useCallback, useRef } from 'react';
import { marked } from 'marked';
import {
  Eye,
  EyeOff,
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  Image as ImageIcon,
  Minus,
  Upload,
  Columns,
  Maximize2,
  Minimize2,
  Check,
  X,
  HelpCircle,
} from 'lucide-react';

interface MarkdownEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  mediaLibrary?: { id: string; url: string; originalName: string }[];
  onMediaUpload?: (file: File) => Promise<string>;
  onMediaDelete?: (id: string) => Promise<void>;
}

// Configure marked for safe HTML output
marked.setOptions({
  breaks: true,
  gfm: true,
});

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  content,
  onChange,
  placeholder = 'Write your content in Markdown...',
  mediaLibrary = [],
  onMediaUpload,
  onMediaDelete,
}) => {
  // Convert HTML back to markdown for editing (simple conversion)
  const htmlToMarkdown = (html: string): string => {
    if (!html) return '';

    let md = html;

    // Convert headings
    md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
    md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
    md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');

    // Convert bold and italic
    md = md.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
    md = md.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
    md = md.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
    md = md.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');

    // Convert links
    md = md.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');

    // Convert images
    md = md.replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*\/?>/gi, '![$2]($1)');
    md = md.replace(/<img[^>]*src="([^"]*)"[^>]*\/?>/gi, '![]($1)');

    // Convert lists
    md = md.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (match, content) => {
      return content.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n') + '\n';
    });
    md = md.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (match, content) => {
      let index = 0;
      return content.replace(/<li[^>]*>(.*?)<\/li>/gi, () => {
        index++;
        return `${index}. $1\n`;
      }) + '\n';
    });

    // Convert blockquotes
    md = md.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (match, content) => {
      return content.split('\n').map((line: string) => `> ${line.trim()}`).join('\n') + '\n\n';
    });

    // Convert code blocks
    md = md.replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, '```\n$1\n```\n\n');
    md = md.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');

    // Convert horizontal rules
    md = md.replace(/<hr\s*\/?>/gi, '\n---\n\n');

    // Convert paragraphs
    md = md.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '$1\n\n');

    // Convert line breaks
    md = md.replace(/<br\s*\/?>/gi, '\n');

    // Remove remaining HTML tags
    md = md.replace(/<[^>]*>/g, '');

    // Decode HTML entities
    md = md.replace(/&nbsp;/g, ' ');
    md = md.replace(/&amp;/g, '&');
    md = md.replace(/&lt;/g, '<');
    md = md.replace(/&gt;/g, '>');
    md = md.replace(/&quot;/g, '"');

    // Clean up extra whitespace
    md = md.replace(/\n{3,}/g, '\n\n');

    return md.trim();
  };

  const [markdown, setMarkdown] = useState(() => htmlToMarkdown(content));
  const [viewMode, setViewMode] = useState<'split' | 'edit' | 'preview'>('split');
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [deletingMedia, setDeletingMedia] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalFileInputRef = useRef<HTMLInputElement>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Convert markdown to HTML for preview
  const htmlOutput = useMemo(() => {
    try {
      return marked(markdown) as string;
    } catch {
      return '<p>Error parsing markdown</p>';
    }
  }, [markdown]);

  // Handle markdown changes - only call onChange when user edits
  const handleMarkdownChange = useCallback((newMarkdown: string) => {
    setMarkdown(newMarkdown);
    try {
      const html = marked(newMarkdown) as string;
      onChangeRef.current(html);
    } catch {
      // Don't update parent on parse error
    }
  }, []);

  // Insert text at cursor position
  const insertAtCursor = useCallback((before: string, after: string = '', placeholder: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = markdown.substring(start, end) || placeholder;

    const newText =
      markdown.substring(0, start) +
      before + selectedText + after +
      markdown.substring(end);

    handleMarkdownChange(newText);

    // Set cursor position after insertion
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length
      );
    }, 0);
  }, [markdown, handleMarkdownChange]);

  // Toolbar actions
  const toolbarActions = {
    bold: () => insertAtCursor('**', '**', 'bold text'),
    italic: () => insertAtCursor('*', '*', 'italic text'),
    h1: () => insertAtCursor('# ', '', 'Heading 1'),
    h2: () => insertAtCursor('## ', '', 'Heading 2'),
    h3: () => insertAtCursor('### ', '', 'Heading 3'),
    bulletList: () => insertAtCursor('- ', '', 'List item'),
    orderedList: () => insertAtCursor('1. ', '', 'List item'),
    quote: () => insertAtCursor('> ', '', 'Quote'),
    code: () => insertAtCursor('`', '`', 'code'),
    codeBlock: () => insertAtCursor('```\n', '\n```', 'code block'),
    hr: () => insertAtCursor('\n---\n'),
    faq: () => insertAtCursor('\n[FAQ]\n'),
    link: () => setShowLinkModal(true),
    image: () => setShowImageModal(true),
  };

  const insertLink = () => {
    if (linkUrl) {
      const text = linkText || linkUrl;
      const textarea = textareaRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const newMarkdown =
          markdown.substring(0, start) +
          `[${text}](${linkUrl})` +
          markdown.substring(start);
        handleMarkdownChange(newMarkdown);
      }
      setLinkUrl('');
      setLinkText('');
      setShowLinkModal(false);
    }
  };

  const insertImage = () => {
    if (imageUrl) {
      const alt = imageAlt || 'image';
      const textarea = textareaRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const newMarkdown =
          markdown.substring(0, start) +
          `![${alt}](${imageUrl})` +
          markdown.substring(start);
        handleMarkdownChange(newMarkdown);
      }
      setImageUrl('');
      setImageAlt('');
      setShowImageModal(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!onMediaUpload) return;

    setUploading(true);
    try {
      const url = await onMediaUpload(file);
      const alt = file.name.replace(/\.[^/.]+$/, '');
      const textarea = textareaRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const newMarkdown =
          markdown.substring(0, start) +
          `![${alt}](${url})` +
          markdown.substring(start);
        handleMarkdownChange(newMarkdown);
      }
    } catch (err) {
      console.error('Failed to upload image:', err);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleModalFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onMediaUpload) {
      setUploading(true);
      try {
        const url = await onMediaUpload(file);
        setImageUrl(url);
        setImageAlt(file.name.replace(/\.[^/.]+$/, ''));
      } catch (err) {
        console.error('Failed to upload image:', err);
      } finally {
        setUploading(false);
      }
    }
    if (modalFileInputRef.current) {
      modalFileInputRef.current.value = '';
    }
  };

  const handleMediaDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onMediaDelete) return;

    setDeletingMedia(id);
    try {
      await onMediaDelete(id);
    } catch (err) {
      console.error('Failed to delete media:', err);
    } finally {
      setDeletingMedia(null);
    }
  };

  const MenuButton: React.FC<{
    onClick: () => void;
    title: string;
    children: React.ReactNode;
    isActive?: boolean;
  }> = ({ onClick, title, children, isActive }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded transition-colors ${
        isActive
          ? 'bg-purple-600 text-white'
          : 'text-slate-400 hover:text-white hover:bg-slate-700'
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="bg-slate-800 border border-purple-500/20 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-2 border-b border-purple-500/20 bg-slate-900/50">
        <MenuButton onClick={toolbarActions.bold} title="Bold (Ctrl+B)">
          <Bold className="w-4 h-4" />
        </MenuButton>
        <MenuButton onClick={toolbarActions.italic} title="Italic (Ctrl+I)">
          <Italic className="w-4 h-4" />
        </MenuButton>

        <div className="w-px h-5 bg-slate-700 mx-1" />

        <MenuButton onClick={toolbarActions.h1} title="Heading 1">
          <Heading1 className="w-4 h-4" />
        </MenuButton>
        <MenuButton onClick={toolbarActions.h2} title="Heading 2">
          <Heading2 className="w-4 h-4" />
        </MenuButton>
        <MenuButton onClick={toolbarActions.h3} title="Heading 3">
          <Heading3 className="w-4 h-4" />
        </MenuButton>

        <div className="w-px h-5 bg-slate-700 mx-1" />

        <MenuButton onClick={toolbarActions.bulletList} title="Bullet List">
          <List className="w-4 h-4" />
        </MenuButton>
        <MenuButton onClick={toolbarActions.orderedList} title="Numbered List">
          <ListOrdered className="w-4 h-4" />
        </MenuButton>
        <MenuButton onClick={toolbarActions.quote} title="Quote">
          <Quote className="w-4 h-4" />
        </MenuButton>

        <div className="w-px h-5 bg-slate-700 mx-1" />

        <MenuButton onClick={toolbarActions.code} title="Inline Code">
          <Code className="w-4 h-4" />
        </MenuButton>
        <MenuButton onClick={toolbarActions.hr} title="Horizontal Rule">
          <Minus className="w-4 h-4" />
        </MenuButton>
        <MenuButton onClick={toolbarActions.faq} title="Insert FAQ Section Marker">
          <HelpCircle className="w-4 h-4" />
        </MenuButton>

        <div className="w-px h-5 bg-slate-700 mx-1" />

        <MenuButton onClick={toolbarActions.link} title="Insert Link">
          <LinkIcon className="w-4 h-4" />
        </MenuButton>
        <MenuButton onClick={toolbarActions.image} title="Insert Image">
          <ImageIcon className="w-4 h-4" />
        </MenuButton>

        {onMediaUpload && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <MenuButton
              onClick={() => fileInputRef.current?.click()}
              title="Upload Image"
            >
              {uploading ? (
                <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
            </MenuButton>
          </>
        )}

        {/* View Mode Toggle */}
        <div className="ml-auto flex items-center gap-1 bg-slate-800 rounded-lg p-0.5">
          <button
            onClick={() => setViewMode('edit')}
            className={`px-2 py-1 rounded text-xs transition-colors ${
              viewMode === 'edit'
                ? 'bg-purple-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Edit only"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewMode('split')}
            className={`px-2 py-1 rounded text-xs transition-colors ${
              viewMode === 'split'
                ? 'bg-purple-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Split view"
          >
            <Columns className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewMode('preview')}
            className={`px-2 py-1 rounded text-xs transition-colors ${
              viewMode === 'preview'
                ? 'bg-purple-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Preview only"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Editor/Preview Area */}
      <div className={`flex ${viewMode === 'split' ? 'divide-x divide-slate-700' : ''}`}>
        {/* Markdown Editor */}
        {viewMode !== 'preview' && (
          <div className={viewMode === 'split' ? 'w-1/2' : 'w-full'}>
            <textarea
              ref={textareaRef}
              value={markdown}
              onChange={(e) => handleMarkdownChange(e.target.value)}
              placeholder={placeholder}
              className="w-full min-h-[400px] p-4 bg-transparent text-slate-200 font-mono text-sm resize-none focus:outline-none placeholder-slate-500"
              spellCheck={false}
            />
          </div>
        )}

        {/* Preview */}
        {viewMode !== 'edit' && (
          <div className={viewMode === 'split' ? 'w-1/2' : 'w-full'}>
            <div className="p-4 min-h-[400px] overflow-auto">
              <div
                className="prose prose-invert prose-purple max-w-none
                  prose-headings:text-slate-200
                  prose-p:text-slate-300
                  prose-a:text-purple-400
                  prose-strong:text-slate-200
                  prose-code:text-pink-400
                  prose-code:bg-slate-900
                  prose-code:px-1.5
                  prose-code:py-0.5
                  prose-code:rounded
                  prose-pre:bg-slate-900
                  prose-blockquote:border-purple-500
                  prose-blockquote:text-slate-400
                  prose-li:text-slate-300
                  prose-img:rounded-lg
                "
                dangerouslySetInnerHTML={{ __html: htmlOutput }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-purple-500/30 rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-purple-200">Insert Link</h3>
              <button onClick={() => setShowLinkModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Link Text</label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="Click here"
                  className="w-full px-4 py-2 bg-slate-800 border border-purple-500/20 rounded-lg text-slate-200"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">URL</label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-4 py-2 bg-slate-800 border border-purple-500/20 rounded-lg text-slate-200"
                  onKeyDown={(e) => e.key === 'Enter' && insertLink()}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLinkModal(false)}
                  className="flex-1 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600"
                >
                  Cancel
                </button>
                <button
                  onClick={insertLink}
                  disabled={!linkUrl}
                  className="flex-1 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 disabled:opacity-50"
                >
                  Insert
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-purple-500/30 rounded-xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-purple-200">Insert Image</h3>
              <button onClick={() => setShowImageModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              {/* Upload Button */}
              {onMediaUpload && (
                <div>
                  <input
                    ref={modalFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleModalFileSelect}
                    className="hidden"
                  />
                  <button
                    onClick={() => modalFileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg transition-colors"
                  >
                    {uploading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5" />
                        Upload Image
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-700"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-slate-900 text-slate-500">or enter URL</span>
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Image URL</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-4 py-2 bg-slate-800 border border-purple-500/20 rounded-lg text-slate-200"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Alt Text</label>
                <input
                  type="text"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  placeholder="Describe the image..."
                  className="w-full px-4 py-2 bg-slate-800 border border-purple-500/20 rounded-lg text-slate-200"
                />
              </div>

              {mediaLibrary.length > 0 && (
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Or select from Media Library</label>
                  <div className="grid grid-cols-4 gap-2 max-h-[200px] overflow-y-auto p-2 bg-slate-800/50 rounded-lg">
                    {mediaLibrary.map((item) => (
                      <div key={item.id} className="relative group">
                        <button
                          onClick={() => {
                            setImageUrl(item.url);
                            setImageAlt(item.originalName);
                          }}
                          className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-colors w-full ${
                            imageUrl === item.url ? 'border-purple-500' : 'border-transparent hover:border-purple-500/50'
                          }`}
                        >
                          <img src={item.url} alt={item.originalName} className="w-full h-full object-cover" />
                          {imageUrl === item.url && (
                            <div className="absolute inset-0 bg-purple-500/30 flex items-center justify-center">
                              <Check className="w-6 h-6 text-white" />
                            </div>
                          )}
                        </button>
                        {/* Delete button */}
                        {onMediaDelete && (
                          <button
                            onClick={(e) => handleMediaDelete(item.id, e)}
                            disabled={deletingMedia === item.id}
                            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-400 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                            title="Delete image"
                          >
                            {deletingMedia === item.id ? (
                              <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <X className="w-3 h-3" />
                            )}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowImageModal(false)}
                  className="flex-1 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600"
                >
                  Cancel
                </button>
                <button
                  onClick={insertImage}
                  disabled={!imageUrl}
                  className="flex-1 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 disabled:opacity-50"
                >
                  Insert
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarkdownEditor;
