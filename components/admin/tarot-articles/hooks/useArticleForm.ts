/**
 * Hook for managing tarot article form state with client-side validation
 */

import { useState, useCallback, useMemo } from 'react';
import { TarotArticle } from '../../../../services/apiService';

// Validation error types
export interface ValidationErrors {
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  cardType?: string;
  cardNumber?: string;
  featuredImage?: string;
  categories?: string;
  [key: string]: string | undefined;
}

// Validation rules configuration
const VALIDATION_RULES = {
  title: {
    required: true,
    minLength: 5,
    maxLength: 200,
  },
  slug: {
    required: true,
    pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    minLength: 3,
    maxLength: 200,
  },
  excerpt: {
    required: true,
    minLength: 50,
    maxLength: 500,
  },
  content: {
    required: true,
    minLength: 500,
  },
  cardType: {
    required: true,
    validValues: ['MAJOR_ARCANA', 'SUIT_OF_WANDS', 'SUIT_OF_CUPS', 'SUIT_OF_SWORDS', 'SUIT_OF_PENTACLES'],
  },
  cardNumber: {
    required: true,
  },
};

// Helper to strip HTML tags for word/character counting
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

// Validate a single field
function validateField(
  field: keyof typeof VALIDATION_RULES,
  value: unknown,
  language: string
): string | undefined {
  const rules = VALIDATION_RULES[field];
  const t = language === 'fr';

  // Get string value (handle arrays, objects, etc.)
  let stringValue = '';
  if (typeof value === 'string') {
    stringValue = field === 'content' ? stripHtml(value) : value.trim();
  } else if (Array.isArray(value)) {
    stringValue = value.join('');
  }

  // Required check
  if (rules.required && !stringValue) {
    const fieldNames: Record<string, { en: string; fr: string }> = {
      title: { en: 'Title', fr: 'Titre' },
      slug: { en: 'Slug', fr: 'Slug' },
      excerpt: { en: 'Excerpt', fr: 'Extrait' },
      content: { en: 'Content', fr: 'Contenu' },
      cardType: { en: 'Card type', fr: 'Type de carte' },
      cardNumber: { en: 'Card number', fr: 'Numero de carte' },
    };
    const name = fieldNames[field]?.[t ? 'fr' : 'en'] || field;
    return t ? `${name} est requis` : `${name} is required`;
  }

  // Min length check
  if ('minLength' in rules && stringValue.length < rules.minLength) {
    return t
      ? `Minimum ${rules.minLength} caracteres requis (actuellement ${stringValue.length})`
      : `Minimum ${rules.minLength} characters required (currently ${stringValue.length})`;
  }

  // Max length check
  if ('maxLength' in rules && stringValue.length > rules.maxLength) {
    return t
      ? `Maximum ${rules.maxLength} caracteres (actuellement ${stringValue.length})`
      : `Maximum ${rules.maxLength} characters (currently ${stringValue.length})`;
  }

  // Pattern check (slug)
  if ('pattern' in rules && stringValue && !rules.pattern.test(stringValue)) {
    if (field === 'slug') {
      return t
        ? 'Le slug ne doit contenir que des lettres minuscules, chiffres et tirets'
        : 'Slug must only contain lowercase letters, numbers, and hyphens';
    }
  }

  // Valid values check (cardType)
  if ('validValues' in rules && stringValue && !rules.validValues.includes(stringValue)) {
    return t ? 'Valeur invalide' : 'Invalid value';
  }

  return undefined;
}

export interface UseArticleFormOptions {
  language?: string;
  onValidationChange?: (isValid: boolean, errors: ValidationErrors) => void;
}

export interface UseArticleFormReturn {
  errors: ValidationErrors;
  touched: Record<string, boolean>;
  isValid: boolean;
  isDirty: boolean;
  validate: () => boolean;
  validateField: (field: string) => string | undefined;
  setFieldTouched: (field: string) => void;
  clearErrors: () => void;
  clearFieldError: (field: string) => void;
  getFieldError: (field: string) => string | undefined;
  hasError: (field: string) => boolean;
}

export function useArticleForm(
  article: TarotArticle | null,
  options: UseArticleFormOptions = {}
): UseArticleFormReturn {
  const { language = 'en' } = options;

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Validate all fields
  const validate = useCallback((): boolean => {
    if (!article) return false;

    const newErrors: ValidationErrors = {};
    let hasErrors = false;

    // Validate each field with rules
    (Object.keys(VALIDATION_RULES) as Array<keyof typeof VALIDATION_RULES>).forEach((field) => {
      const value = article[field as keyof TarotArticle];
      const error = validateField(field, value, language);
      if (error) {
        newErrors[field] = error;
        hasErrors = true;
      }
    });

    setErrors(newErrors);

    // Mark all fields as touched
    const allTouched: Record<string, boolean> = {};
    Object.keys(VALIDATION_RULES).forEach((field) => {
      allTouched[field] = true;
    });
    setTouched(allTouched);

    return !hasErrors;
  }, [article, language]);

  // Validate a single field
  const validateSingleField = useCallback(
    (field: string): string | undefined => {
      if (!article) return undefined;

      const rules = VALIDATION_RULES[field as keyof typeof VALIDATION_RULES];
      if (!rules) return undefined;

      const value = article[field as keyof TarotArticle];
      const error = validateField(field as keyof typeof VALIDATION_RULES, value, language);

      setErrors((prev) => ({
        ...prev,
        [field]: error,
      }));

      return error;
    },
    [article, language]
  );

  // Mark field as touched (for showing errors on blur)
  const setFieldTouched = useCallback((field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  // Clear all errors
  const clearErrors = useCallback(() => {
    setErrors({});
    setTouched({});
  }, []);

  // Clear error for a specific field
  const clearFieldError = useCallback((field: string) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  // Get error for a field (only if touched)
  const getFieldError = useCallback(
    (field: string): string | undefined => {
      return touched[field] ? errors[field] : undefined;
    },
    [errors, touched]
  );

  // Check if field has error (only if touched)
  const hasError = useCallback(
    (field: string): boolean => {
      return touched[field] && !!errors[field];
    },
    [errors, touched]
  );

  // Compute if form is valid (based on current errors)
  const isValid = useMemo(() => {
    return Object.values(errors).filter(Boolean).length === 0;
  }, [errors]);

  // Compute if form is dirty (has any changes)
  const isDirty = useMemo(() => {
    return Object.keys(touched).length > 0;
  }, [touched]);

  return {
    errors,
    touched,
    isValid,
    isDirty,
    validate,
    validateField: validateSingleField,
    setFieldTouched,
    clearErrors,
    clearFieldError,
    getFieldError,
    hasError,
  };
}

export default useArticleForm;
