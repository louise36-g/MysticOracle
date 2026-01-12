import React from 'react';
import RichTextEditor from '../RichTextEditor';
import MarkdownEditor from '../MarkdownEditor';
import { ContentEditorProps } from './types';

const ContentEditor: React.FC<ContentEditorProps> = ({
  content,
  onChange,
  placeholder,
  mediaLibrary,
  onMediaUpload,
  onMediaDelete,
  editorMode = 'visual',
}) => {
  if (editorMode === 'markdown') {
    return (
      <MarkdownEditor
        content={content}
        onChange={onChange}
        placeholder={placeholder}
        mediaLibrary={mediaLibrary}
        onMediaUpload={onMediaUpload}
        onMediaDelete={onMediaDelete}
      />
    );
  }

  return (
    <RichTextEditor
      content={content}
      onChange={onChange}
      placeholder={placeholder}
      mediaLibrary={mediaLibrary}
      onMediaUpload={onMediaUpload}
      onMediaDelete={onMediaDelete}
    />
  );
};

export default ContentEditor;
