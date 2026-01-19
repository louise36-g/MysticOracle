/**
 * FormField - Wrapper component with validation error display
 */

import React from 'react';
import { AlertCircle } from 'lucide-react';

interface FormFieldProps {
  label: string;
  error?: string;
  touched?: boolean;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  touched,
  required,
  hint,
  children,
}) => {
  const showError = touched && error;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-300">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>

      <div className={showError ? 'ring-1 ring-red-500/50 rounded-lg' : ''}>
        {children}
      </div>

      {showError ? (
        <div className="flex items-start gap-2 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      ) : hint ? (
        <p className="text-slate-500 text-sm">{hint}</p>
      ) : null}
    </div>
  );
};

export default FormField;
