import React from 'react';
import { LucideIcon } from 'lucide-react';

interface FormInputProps {
  type?: 'text' | 'email' | 'password';
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  icon?: LucideIcon;
  rightIcon?: React.ReactNode;
  required?: boolean;
  error?: boolean;
  className?: string;
  id?: string;
}

const FormInput: React.FC<FormInputProps> = ({
  type = 'text',
  value,
  onChange,
  placeholder,
  icon: Icon,
  rightIcon,
  required = false,
  error = false,
  className = '',
  id
}) => {
  return (
    <div className="relative group">
      {Icon && (
        <Icon className="absolute left-3 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-amber-400 transition-colors" />
      )}
      <input
        type={type}
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={`
          w-full bg-slate-950 border rounded-lg py-3 text-white
          focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/50
          outline-none transition-all
          ${Icon ? 'pl-10' : 'pl-4'}
          ${rightIcon ? 'pr-10' : 'pr-4'}
          ${error
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/50'
            : 'border-purple-900/50'
          }
          ${className}
        `}
      />
      {rightIcon && (
        <div className="absolute right-3 top-3.5">
          {rightIcon}
        </div>
      )}
    </div>
  );
};

export default FormInput;
