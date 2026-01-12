import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { SidebarSectionProps } from './types';

const SidebarSection: React.FC<SidebarSectionProps> = ({
  title,
  icon,
  isOpen,
  onToggle,
  children,
}) => (
  <div className="border-b border-slate-700/50 last:border-b-0">
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between p-3 hover:bg-slate-800/50 transition-colors"
    >
      <div className="flex items-center gap-2 text-slate-300">
        {icon}
        <span className="text-sm font-medium">{title}</span>
      </div>
      {isOpen ? (
        <ChevronUp className="w-4 h-4 text-slate-500" />
      ) : (
        <ChevronDown className="w-4 h-4 text-slate-500" />
      )}
    </button>
    {isOpen && <div className="px-3 pb-3">{children}</div>}
  </div>
);

export default SidebarSection;
