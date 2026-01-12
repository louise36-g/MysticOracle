import React from 'react';

interface EditorFieldProps {
  label: string;
  languageFlag?: string;
  children: React.ReactNode;
  className?: string;
}

export const EditorField: React.FC<EditorFieldProps> = ({
  label,
  languageFlag,
  children,
  className = 'mb-6',
}) => (
  <div className={className}>
    <label className="block text-sm text-slate-400 mb-2">
      {languageFlag && <span className="mr-1">{languageFlag}</span>}
      {label}
    </label>
    {children}
  </div>
);

interface TitleInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const TitleInput: React.FC<TitleInputProps> = ({
  value,
  onChange,
  placeholder = 'Enter title...',
}) => (
  <input
    type="text"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    className="w-full px-4 py-3 bg-slate-800 border border-purple-500/20 rounded-lg text-slate-200 text-xl font-medium placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
  />
);

interface ExcerptInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

export const ExcerptInput: React.FC<ExcerptInputProps> = ({
  value,
  onChange,
  placeholder = 'Brief summary...',
  rows = 2,
}) => (
  <textarea
    value={value}
    onChange={(e) => onChange(e.target.value)}
    rows={rows}
    placeholder={placeholder}
    className="w-full px-4 py-2 bg-slate-800 border border-purple-500/20 rounded-lg text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:border-purple-500/50"
  />
);

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'number';
  min?: number;
}

export const SidebarInput: React.FC<TextInputProps> = ({
  value,
  onChange,
  placeholder,
  type = 'text',
  min,
}) => (
  <input
    type={type}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    min={min}
    className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-sm text-slate-200"
  />
);

interface SelectInputProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}

export const SidebarSelect: React.FC<SelectInputProps> = ({
  value,
  onChange,
  options,
}) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-sm text-slate-200"
  >
    {options.map((opt) => (
      <option key={opt.value} value={opt.value}>
        {opt.label}
      </option>
    ))}
  </select>
);

interface TextAreaInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

export const SidebarTextArea: React.FC<TextAreaInputProps> = ({
  value,
  onChange,
  placeholder,
  rows = 2,
}) => (
  <textarea
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    rows={rows}
    className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-sm text-slate-200 resize-none"
  />
);

interface LabelProps {
  children: React.ReactNode;
}

export const SidebarLabel: React.FC<LabelProps> = ({ children }) => (
  <label className="block text-xs text-slate-500 mb-1">{children}</label>
);
