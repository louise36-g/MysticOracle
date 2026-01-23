import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Trash2,
} from 'lucide-react';

// Custom Image Component with resize handles and controls
const ResizableImageComponent: React.FC<NodeViewProps> = ({ node, updateAttributes, deleteNode, selected }) => {
  const { src, alt, title, width, align = 'center' } = node.attrs;
  const [isResizing, setIsResizing] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const startWidth = useRef<number>(0);
  const startX = useRef<number>(0);

  // Show controls when selected or hovered
  useEffect(() => {
    if (selected) {
      setShowControls(true);
    }
  }, [selected]);

  const handleMouseDown = useCallback((e: React.MouseEvent, corner: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    startX.current = e.clientX;
    startWidth.current = imageRef.current?.offsetWidth || 300;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const diff = corner.includes('right')
        ? moveEvent.clientX - startX.current
        : startX.current - moveEvent.clientX;
      const newWidth = Math.max(100, Math.min(startWidth.current + diff, 1200));
      updateAttributes({ width: newWidth });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [updateAttributes]);

  const setAlignment = (newAlign: string) => {
    updateAttributes({ align: newAlign });
  };

  const presetSizes = [
    { label: 'S', width: 200 },
    { label: 'M', width: 400 },
    { label: 'L', width: 600 },
    { label: 'Full', width: '100%' },
  ];

  const getContainerClasses = () => {
    let classes = 'resizable-image-wrapper relative group ';
    switch (align) {
      case 'left':
        classes += 'text-left';
        break;
      case 'right':
        classes += 'text-right';
        break;
      case 'center':
        classes += 'text-center';
        break;
      case 'float-left':
        classes += 'float-left mr-4 mb-2';
        break;
      case 'float-right':
        classes += 'float-right ml-4 mb-2';
        break;
      default:
        classes += 'text-center';
    }
    return classes;
  };

  const getImageStyle = (): React.CSSProperties => {
    const style: React.CSSProperties = {
      maxWidth: '100%',
      height: 'auto',
      display: align?.includes('float') ? 'block' : 'inline-block',
    };

    if (width) {
      style.width = typeof width === 'number' ? `${width}px` : width;
    }

    return style;
  };

  return (
    <NodeViewWrapper className={getContainerClasses()}>
      <div
        ref={containerRef}
        className={`inline-block relative ${selected ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-slate-900' : ''}`}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => !selected && setShowControls(false)}
      >
        {/* Image */}
        <img
          ref={imageRef}
          src={src}
          alt={alt || ''}
          title={title}
          style={getImageStyle()}
          className={`rounded-lg ${isResizing ? 'select-none' : ''}`}
          draggable={false}
        />

        {/* Controls overlay */}
        {showControls && (
          <>
            {/* Top toolbar */}
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-lg p-1 shadow-xl z-10">
              {/* Alignment buttons */}
              <button
                onClick={() => setAlignment('float-left')}
                className={`p-1.5 rounded transition-colors ${align === 'float-left' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                title="Float Left"
              >
                <AlignLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setAlignment('center')}
                className={`p-1.5 rounded transition-colors ${align === 'center' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                title="Center"
              >
                <AlignCenter className="w-4 h-4" />
              </button>
              <button
                onClick={() => setAlignment('float-right')}
                className={`p-1.5 rounded transition-colors ${align === 'float-right' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                title="Float Right"
              >
                <AlignRight className="w-4 h-4" />
              </button>

              <div className="w-px h-5 bg-slate-700 mx-1" />

              {/* Size presets */}
              {presetSizes.map((size) => (
                <button
                  key={size.label}
                  onClick={() => updateAttributes({ width: size.width })}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    width === size.width
                      ? 'bg-purple-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                  title={typeof size.width === 'number' ? `${size.width}px` : 'Full width'}
                >
                  {size.label}
                </button>
              ))}

              <div className="w-px h-5 bg-slate-700 mx-1" />

              {/* Delete button */}
              <button
                onClick={deleteNode}
                className="p-1.5 rounded text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-colors"
                title="Delete Image"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Resize handles */}
            <div
              className="absolute top-0 left-0 w-3 h-3 bg-purple-500 rounded-full cursor-nw-resize opacity-0 group-hover:opacity-100 transition-opacity -translate-x-1/2 -translate-y-1/2"
              onMouseDown={(e) => handleMouseDown(e, 'top-left')}
            />
            <div
              className="absolute top-0 right-0 w-3 h-3 bg-purple-500 rounded-full cursor-ne-resize opacity-0 group-hover:opacity-100 transition-opacity translate-x-1/2 -translate-y-1/2"
              onMouseDown={(e) => handleMouseDown(e, 'top-right')}
            />
            <div
              className="absolute bottom-0 left-0 w-3 h-3 bg-purple-500 rounded-full cursor-sw-resize opacity-0 group-hover:opacity-100 transition-opacity -translate-x-1/2 translate-y-1/2"
              onMouseDown={(e) => handleMouseDown(e, 'bottom-left')}
            />
            <div
              className="absolute bottom-0 right-0 w-3 h-3 bg-purple-500 rounded-full cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity translate-x-1/2 translate-y-1/2"
              onMouseDown={(e) => handleMouseDown(e, 'bottom-right')}
            />

            {/* Side handles for width resize */}
            <div
              className="absolute top-1/2 left-0 w-2 h-8 bg-purple-500 rounded-full cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity -translate-x-1/2 -translate-y-1/2"
              onMouseDown={(e) => handleMouseDown(e, 'left')}
            />
            <div
              className="absolute top-1/2 right-0 w-2 h-8 bg-purple-500 rounded-full cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity translate-x-1/2 -translate-y-1/2"
              onMouseDown={(e) => handleMouseDown(e, 'right')}
            />

            {/* Width indicator */}
            {isResizing && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-xs px-2 py-1 rounded">
                {typeof width === 'number' ? `${width}px` : width || 'auto'}
              </div>
            )}
          </>
        )}
      </div>
    </NodeViewWrapper>
  );
};

// TipTap Extension
const ResizableImage = Node.create({
  name: 'resizableImage',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
      title: {
        default: null,
      },
      width: {
        default: null,
      },
      align: {
        default: 'center',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'img[src]',
        getAttrs: (dom) => {
          const element = dom as HTMLElement;
          // Parse width from data-width attribute or style attribute
          let width = element.getAttribute('data-width');
          if (!width && element.style.width) {
            width = element.style.width.replace('px', '');
          }
          // Convert to number if it's a valid number string, otherwise keep as-is (e.g., "100%")
          const parsedWidth = width && !isNaN(Number(width)) ? Number(width) : width;

          return {
            src: element.getAttribute('src'),
            alt: element.getAttribute('alt'),
            title: element.getAttribute('title'),
            width: parsedWidth || null,
            align: element.getAttribute('data-align') || 'center',
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { width, align, ...attrs } = HTMLAttributes;

    // Don't add inline styles - let CSS handle sizing via data attributes
    // This prevents !important wars between editor and presentation styles
    return [
      'img',
      mergeAttributes(attrs, {
        'data-width': width,
        'data-align': align,
        loading: 'lazy',
        class: `editor-image align-${align}`,
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageComponent);
  },

  addCommands() {
    return {
      setResizableImage:
        (options: { src: string; alt?: string; title?: string; width?: number | string; align?: string }) =>
        ({ commands }: { commands: { insertContent: (content: { type: string; attrs: typeof options }) => boolean } }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    } as Record<string, (...args: unknown[]) => unknown>;
  },
});

export default ResizableImage;
