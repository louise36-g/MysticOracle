import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useEditor, EditorContent } from '@tiptap/react';
import { fetchAdminBlogMedia, BlogMedia } from '../../services/apiService';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import ResizableImage from './ResizableImageExtension';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  Image as ImageIcon,
  Heading1,
  Heading2,
  Heading3,
  Minus,
  RemoveFormatting,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Upload,
  X,
  Check,
  Type,
  Unlink,
  Loader,
} from 'lucide-react';

// Folder configuration for media library
const MEDIA_FOLDERS = [
  { id: 'all', label: 'All' },
  { id: 'blog', label: 'Blog' },
  { id: 'tarot', label: 'Tarot' },
];

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  mediaLibrary?: { id: string; url: string; originalName: string }[];
  onMediaUpload?: (file: File) => Promise<string>;
  onMediaDelete?: (id: string) => Promise<void>;
}

const FONT_SIZES = [
  { label: 'Small', value: '0.875rem', class: 'text-sm' },
  { label: 'Normal', value: '1rem', class: 'text-base' },
  { label: 'Large', value: '1.125rem', class: 'text-lg' },
  { label: 'XL', value: '1.25rem', class: 'text-xl' },
  { label: '2XL', value: '1.5rem', class: 'text-2xl' },
];

const MenuButton: React.FC<{
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}> = ({ onClick, isActive, disabled, title, children }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`p-1.5 rounded transition-colors ${
      isActive
        ? 'bg-purple-600 text-white'
        : 'text-slate-400 hover:text-white hover:bg-slate-700'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    {children}
  </button>
);

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onChange,
  onBlur,
  placeholder = 'Start writing...',
  mediaLibrary = [],
  onMediaUpload,
  onMediaDelete,
}) => {
  const { getToken } = useAuth();
  const [showImageModal, setShowImageModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [showFontSizeMenu, setShowFontSizeMenu] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingMedia, setDeletingMedia] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalFileInputRef = useRef<HTMLInputElement>(null);
  const fontSizeRef = useRef<HTMLDivElement>(null);

  // Media library state - fetch independently for reliability
  const [modalMedia, setModalMedia] = useState<BlogMedia[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [activeFolder, setActiveFolder] = useState<string>('all');

  // Fetch media when modal opens
  useEffect(() => {
    if (showImageModal) {
      loadModalMedia();
    }
  }, [showImageModal]);

  const loadModalMedia = async () => {
    try {
      setMediaLoading(true);
      const token = await getToken();
      if (!token) return;
      const folderFilter = activeFolder === 'all' ? undefined : activeFolder;
      const result = await fetchAdminBlogMedia(token, folderFilter);
      setModalMedia(result.media);
    } catch (err) {
      console.error('Failed to load media:', err);
    } finally {
      setMediaLoading(false);
    }
  };

  // Reload media when folder changes (only if modal is open)
  useEffect(() => {
    if (showImageModal) {
      loadModalMedia();
    }
  }, [activeFolder]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
          HTMLAttributes: {
            class: 'list-disc',
          },
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
          HTMLAttributes: {
            class: 'list-decimal',
          },
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-purple-400 underline hover:text-purple-300',
        },
      }),
      ResizableImage,
      Placeholder.configure({
        placeholder,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
      TextStyle,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    onBlur: () => {
      onBlur?.();
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-purple max-w-none focus:outline-none min-h-[300px] px-4 py-3',
      },
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer?.files?.length) {
          const file = event.dataTransfer.files[0];
          if (file.type.startsWith('image/')) {
            event.preventDefault();
            handleImageUpload(file);
            return true;
          }
        }
        return false;
      },
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (items) {
          for (const item of Array.from(items)) {
            if (item.type.startsWith('image/')) {
              const file = item.getAsFile();
              if (file) {
                event.preventDefault();
                handleImageUpload(file);
                return true;
              }
            }
          }
        }
        return false;
      },
    },
  });

  const handleImageUpload = useCallback(async (file: File) => {
    if (!onMediaUpload || !editor) return;

    setUploading(true);
    try {
      const url = await onMediaUpload(file);
      (editor.chain().focus() as unknown as { setResizableImage: (opts: { src: string; alt: string; align: string }) => { run: () => void } })
        .setResizableImage({ src: url, alt: file.name, align: 'center' })
        .run();
    } catch (err) {
      console.error('Failed to upload image:', err);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  }, [onMediaUpload, editor]);

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
        // Reload media library after successful upload
        await loadModalMedia();
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
      // Reload media library after deletion
      await loadModalMedia();
    } catch (err) {
      console.error('Failed to delete media:', err);
    } finally {
      setDeletingMedia(null);
    }
  };

  const insertImage = () => {
    if (imageUrl && editor) {
      (editor.chain().focus() as unknown as { setResizableImage: (opts: { src: string; alt: string; align: string }) => { run: () => void } })
        .setResizableImage({ src: imageUrl, alt: imageAlt, align: 'center' })
        .run();
      setImageUrl('');
      setImageAlt('');
      setShowImageModal(false);
    }
  };

  const insertLink = () => {
    if (linkUrl && editor) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
      setLinkUrl('');
      setShowLinkModal(false);
    }
  };

  const removeLink = () => {
    if (editor) {
      editor.chain().focus().unsetLink().run();
    }
  };

  const setFontSize = (size: string) => {
    if (editor) {
      editor.chain().focus().setMark('textStyle', { fontSize: size }).run();
    }
    setShowFontSizeMenu(false);
  };

  if (!editor) {
    return (
      <div className="bg-slate-800 border border-purple-500/20 rounded-lg p-4 min-h-[350px] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-slate-800 border border-purple-500/20 rounded-lg overflow-hidden">
      {/* Main Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-2 border-b border-purple-500/20 bg-slate-900/50">
        {/* Undo/Redo */}
        <MenuButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo (Ctrl+Z)"
        >
          <Undo className="w-4 h-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo (Ctrl+Y)"
        >
          <Redo className="w-4 h-4" />
        </MenuButton>

        <div className="w-px h-5 bg-slate-700 mx-1" />

        {/* Font Size Dropdown */}
        <div className="relative" ref={fontSizeRef}>
          <button
            type="button"
            onClick={() => setShowFontSizeMenu(!showFontSizeMenu)}
            className="flex items-center gap-1 px-2 py-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-700 text-sm"
            title="Font Size"
          >
            <Type className="w-4 h-4" />
            <span className="hidden sm:inline">Size</span>
          </button>
          {showFontSizeMenu && (
            <div className="absolute top-full left-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 min-w-[120px]">
              {FONT_SIZES.map((size) => (
                <button
                  key={size.value}
                  onClick={() => setFontSize(size.value)}
                  className="w-full px-3 py-2 text-left text-slate-300 hover:bg-slate-700 first:rounded-t-lg last:rounded-b-lg"
                  style={{ fontSize: size.value }}
                >
                  {size.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-slate-700 mx-1" />

        {/* Headings */}
        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive('heading', { level: 1 })}
          title="Heading 1"
        >
          <Heading1 className="w-4 h-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive('heading', { level: 3 })}
          title="Heading 3"
        >
          <Heading3 className="w-4 h-4" />
        </MenuButton>

        <div className="w-px h-5 bg-slate-700 mx-1" />

        {/* Text Formatting */}
        <MenuButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          title="Underline (Ctrl+U)"
        >
          <UnderlineIcon className="w-4 h-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          title="Strikethrough"
        >
          <Strikethrough className="w-4 h-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          isActive={editor.isActive('code')}
          title="Inline Code"
        >
          <Code className="w-4 h-4" />
        </MenuButton>

        <div className="w-px h-5 bg-slate-700 mx-1" />

        {/* Text Alignment */}
        <MenuButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          isActive={editor.isActive({ textAlign: 'left' })}
          title="Align Left"
        >
          <AlignLeft className="w-4 h-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          isActive={editor.isActive({ textAlign: 'center' })}
          title="Align Center"
        >
          <AlignCenter className="w-4 h-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          isActive={editor.isActive({ textAlign: 'right' })}
          title="Align Right"
        >
          <AlignRight className="w-4 h-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          isActive={editor.isActive({ textAlign: 'justify' })}
          title="Justify"
        >
          <AlignJustify className="w-4 h-4" />
        </MenuButton>

        <div className="w-px h-5 bg-slate-700 mx-1" />

        {/* Lists */}
        <MenuButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          title="Quote"
        >
          <Quote className="w-4 h-4" />
        </MenuButton>

        <div className="w-px h-5 bg-slate-700 mx-1" />

        {/* Links */}
        <MenuButton
          onClick={() => {
            if (editor.isActive('link')) {
              removeLink();
            } else {
              setShowLinkModal(true);
            }
          }}
          isActive={editor.isActive('link')}
          title={editor.isActive('link') ? 'Remove Link' : 'Add Link'}
        >
          {editor.isActive('link') ? <Unlink className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
        </MenuButton>

        {/* Images */}
        <MenuButton
          onClick={() => setShowImageModal(true)}
          title="Insert Image"
        >
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
              disabled={uploading}
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

        <div className="w-px h-5 bg-slate-700 mx-1" />

        {/* Other */}
        <MenuButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Horizontal Rule"
        >
          <Minus className="w-4 h-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
          title="Clear Formatting"
        >
          <RemoveFormatting className="w-4 h-4" />
        </MenuButton>
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} />

      {/* Drop Zone Indicator */}
      {uploading && (
        <div className="absolute inset-0 bg-purple-900/30 flex items-center justify-center pointer-events-none">
          <div className="bg-slate-800 rounded-lg p-4 flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-slate-200">Uploading image...</span>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-purple-500/30 rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-purple-500/20">
              <h3 className="text-lg font-medium text-purple-200">Insert Image</h3>
              <button
                onClick={() => setShowImageModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
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

              {/* URL Input */}
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
                <label className="block text-sm text-slate-400 mb-1">Alt Text (for accessibility)</label>
                <input
                  type="text"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  placeholder="Describe the image..."
                  className="w-full px-4 py-2 bg-slate-800 border border-purple-500/20 rounded-lg text-slate-200"
                />
              </div>

              {/* Media Library with Folder Tabs */}
              <div>
                <label className="block text-sm text-slate-400 mb-2">Or select from Media Library</label>

                {/* Folder Tabs */}
                <div className="flex items-center gap-1 mb-3 bg-slate-800/50 p-1 rounded-lg">
                  {MEDIA_FOLDERS.map((folder) => (
                    <button
                      key={folder.id}
                      onClick={() => setActiveFolder(folder.id)}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        activeFolder === folder.id
                          ? 'bg-purple-600 text-white'
                          : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                      }`}
                    >
                      {folder.label}
                    </button>
                  ))}
                </div>

                {/* Media Grid */}
                {mediaLoading ? (
                  <div className="flex items-center justify-center py-8 bg-slate-800/50 rounded-lg">
                    <Loader className="w-6 h-6 text-purple-400 animate-spin" />
                  </div>
                ) : modalMedia.length > 0 ? (
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-[280px] overflow-y-auto p-2 bg-slate-800/50 rounded-lg">
                    {modalMedia.map((item) => (
                      <div
                        key={item.id}
                        className="relative group"
                      >
                        <button
                          onClick={() => {
                            setImageUrl(item.url);
                            setImageAlt(item.originalName || '');
                          }}
                          className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-colors w-full ${
                            imageUrl === item.url ? 'border-purple-500' : 'border-transparent hover:border-purple-500/50'
                          }`}
                        >
                          <img
                            src={item.url}
                            alt={item.originalName || 'Media'}
                            className="w-full h-full object-cover"
                          />
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
                ) : (
                  <div className="text-center py-8 bg-slate-800/50 rounded-lg">
                    <ImageIcon className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                    <p className="text-sm text-slate-500">
                      {activeFolder === 'all'
                        ? 'No images uploaded yet'
                        : `No images in ${activeFolder} folder`}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Sticky Footer with Buttons */}
            <div className="p-4 border-t border-purple-500/20 bg-slate-900">
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
                  Insert Image
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-purple-500/30 rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-purple-200">Insert Link</h3>
              <button
                onClick={() => setShowLinkModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">URL</label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-4 py-2 bg-slate-800 border border-purple-500/20 rounded-lg text-slate-200"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      insertLink();
                    }
                  }}
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
                  Insert Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Editor Styles */}
      <style>{`
        .ProseMirror {
          min-height: 300px;
          outline: none;
        }
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #64748b;
          pointer-events: none;
          height: 0;
        }
        .ProseMirror h1 {
          font-size: 1.875rem;
          font-weight: 700;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          color: #e2e8f0;
        }
        .ProseMirror h2 {
          font-size: 1.5rem;
          font-weight: 600;
          margin-top: 1.25rem;
          margin-bottom: 0.5rem;
          color: #e2e8f0;
        }
        .ProseMirror h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
          color: #e2e8f0;
        }
        .ProseMirror p {
          margin-bottom: 0.75rem;
          color: #cbd5e1;
        }
        /* Fixed bullet list styling */
        .ProseMirror ul {
          list-style-type: disc !important;
          padding-left: 1.5rem;
          margin-bottom: 0.75rem;
          margin-left: 0.5rem;
        }
        .ProseMirror ul ul {
          list-style-type: circle !important;
        }
        .ProseMirror ul ul ul {
          list-style-type: square !important;
        }
        .ProseMirror ol {
          list-style-type: decimal !important;
          padding-left: 1.5rem;
          margin-bottom: 0.75rem;
          margin-left: 0.5rem;
        }
        .ProseMirror li {
          color: #cbd5e1;
          margin-bottom: 0.25rem;
          display: list-item !important;
        }
        .ProseMirror li p {
          margin-bottom: 0;
        }
        .ProseMirror li::marker {
          color: #a78bfa;
        }
        .ProseMirror blockquote {
          border-left: 3px solid #7c3aed;
          padding-left: 1rem;
          margin: 1rem 0;
          color: #94a3b8;
          font-style: italic;
        }
        .ProseMirror code {
          background: #1e293b;
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          font-family: monospace;
          font-size: 0.875rem;
          color: #f472b6;
        }
        .ProseMirror pre {
          background: #1e293b;
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 1rem 0;
        }
        .ProseMirror pre code {
          background: none;
          padding: 0;
          color: #e2e8f0;
        }
        .ProseMirror hr {
          border: none;
          border-top: 1px solid #475569;
          margin: 1.5rem 0;
        }
        .ProseMirror .editor-image {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin: 1rem 0;
          cursor: pointer;
        }
        .ProseMirror .editor-image.ProseMirror-selectednode {
          outline: 3px solid #a78bfa;
          outline-offset: 2px;
        }
        /* Resizable image wrapper styles */
        .ProseMirror .resizable-image-wrapper {
          margin: 1rem 0;
          clear: both;
        }
        .ProseMirror .resizable-image-wrapper.float-left {
          clear: none;
        }
        .ProseMirror .resizable-image-wrapper.float-right {
          clear: none;
        }
        .ProseMirror .resizable-image-wrapper img {
          border-radius: 0.5rem;
        }
        /* Image alignment classes */
        .ProseMirror .align-left {
          text-align: left;
        }
        .ProseMirror .align-center {
          text-align: center;
        }
        .ProseMirror .align-right {
          text-align: right;
        }
        .ProseMirror .align-float-left {
          float: left;
          margin-right: 1rem;
          margin-bottom: 0.5rem;
        }
        .ProseMirror .align-float-right {
          float: right;
          margin-left: 1rem;
          margin-bottom: 0.5rem;
        }
        /* Clear floats after floated images */
        .ProseMirror p::after,
        .ProseMirror h1::after,
        .ProseMirror h2::after,
        .ProseMirror h3::after {
          content: "";
          display: table;
          clear: both;
        }
        .ProseMirror a {
          color: #a78bfa;
          text-decoration: underline;
        }
        .ProseMirror a:hover {
          color: #c4b5fd;
        }
        /* Text alignment */
        .ProseMirror [style*="text-align: center"] {
          text-align: center;
        }
        .ProseMirror [style*="text-align: right"] {
          text-align: right;
        }
        .ProseMirror [style*="text-align: justify"] {
          text-align: justify;
        }
        /* Underline */
        .ProseMirror u {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
