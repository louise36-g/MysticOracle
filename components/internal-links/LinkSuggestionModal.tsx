/**
 * Link Suggestion Modal
 *
 * Modal for reviewing and applying internal link suggestions.
 */

import React, { useState, useMemo } from 'react';
import { Link2, CheckSquare, Square, AlertCircle } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../Button';
import type { LinkSuggestion } from './contentScanner';

interface LinkSuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  suggestions: LinkSuggestion[];
  onApply: (selected: LinkSuggestion[]) => void;
}

const TYPE_LABELS: Record<string, string> = {
  tarot: 'Tarot Card',
  blog: 'Blog Post',
};

const TYPE_COLORS: Record<string, string> = {
  tarot: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  blog: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
};

const LinkSuggestionModal: React.FC<LinkSuggestionModalProps> = ({
  isOpen,
  onClose,
  suggestions: initialSuggestions,
  onApply,
}) => {
  const [suggestions, setSuggestions] = useState<LinkSuggestion[]>(initialSuggestions);

  // Reset suggestions when modal opens with new data
  React.useEffect(() => {
    setSuggestions(initialSuggestions);
  }, [initialSuggestions]);

  const selectedCount = useMemo(() => suggestions.filter((s) => s.selected).length, [suggestions]);

  const toggleSuggestion = (index: number) => {
    setSuggestions((prev) =>
      prev.map((s, i) => (i === index ? { ...s, selected: !s.selected } : s))
    );
  };

  const selectAll = () => {
    setSuggestions((prev) => prev.map((s) => ({ ...s, selected: true })));
  };

  const deselectAll = () => {
    setSuggestions((prev) => prev.map((s) => ({ ...s, selected: false })));
  };

  const handleApply = () => {
    onApply(suggestions.filter((s) => s.selected));
    onClose();
  };

  const footer = (
    <div className="flex items-center justify-between">
      <div className="text-sm text-slate-400">
        {selectedCount} of {suggestions.length} selected
      </div>
      <div className="flex gap-3">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleApply} disabled={selectedCount === 0}>
          <Link2 className="w-4 h-4 mr-2" />
          Insert {selectedCount} Link{selectedCount !== 1 ? 's' : ''}
        </Button>
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Internal Link Suggestions"
      size="xl"
      footer={footer}
    >
      <div className="space-y-4">
        {suggestions.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-slate-500 mx-auto mb-3" />
            <p className="text-slate-400">No linkable terms found in the content.</p>
            <p className="text-sm text-slate-500 mt-1">
              Try adding more content that mentions tarot cards or blog topics.
            </p>
          </div>
        ) : (
          <>
            {/* Quick actions */}
            <div className="flex items-center gap-2 pb-3 border-b border-white/10">
              <button
                onClick={selectAll}
                className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1"
              >
                <CheckSquare className="w-4 h-4" />
                Select All
              </button>
              <span className="text-slate-600">|</span>
              <button
                onClick={deselectAll}
                className="text-sm text-slate-400 hover:text-slate-300 flex items-center gap-1"
              >
                <Square className="w-4 h-4" />
                Deselect All
              </button>
            </div>

            {/* Suggestions list */}
            <div className="space-y-2 max-h-[40vh] overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <label
                  key={`${suggestion.slug}-${suggestion.position}`}
                  className={`
                    flex items-center gap-3 p-3 rounded-lg cursor-pointer
                    border transition-colors
                    ${
                      suggestion.selected
                        ? 'bg-purple-500/10 border-purple-500/30'
                        : 'bg-slate-800/50 border-transparent hover:border-slate-700'
                    }
                  `}
                >
                  <input
                    type="checkbox"
                    checked={suggestion.selected}
                    onChange={() => toggleSuggestion(index)}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-purple-500 focus:ring-purple-500 focus:ring-offset-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white truncate">
                        "{suggestion.term}"
                      </span>
                      <span className="text-slate-500">→</span>
                      <code className="text-xs bg-slate-800 px-2 py-0.5 rounded text-slate-300 truncate">
                        {suggestion.shortcode}
                      </code>
                    </div>
                    <div className="text-sm text-slate-400 mt-1">
                      Links to: {suggestion.title}
                    </div>
                  </div>
                  <span
                    className={`
                      text-xs px-2 py-1 rounded border
                      ${TYPE_COLORS[suggestion.type]}
                    `}
                  >
                    {TYPE_LABELS[suggestion.type]}
                  </span>
                </label>
              ))}
            </div>

          </>
        )}
      </div>
    </Modal>
  );
};

export default LinkSuggestionModal;
