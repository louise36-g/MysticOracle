import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Send, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { apiRequest } from '../services/api/client';
import Button from './Button';

const content = {
  en: {
    hero: {
      title: 'Get in Touch',
      subtitle: 'We\'d love to hear from you. Send us a message and we\'ll respond as soon as possible.',
    },
    form: {
      name: 'Your Name',
      namePlaceholder: 'Enter your name',
      email: 'Email Address',
      emailPlaceholder: 'your@email.com',
      phone: 'Phone (optional)',
      phonePlaceholder: '+44 7123 456789',
      subject: 'Subject',
      subjectPlaceholder: 'Select a topic',
      message: 'Your Message',
      messagePlaceholder: 'Tell us how we can help you...',
      submit: 'Send Message',
      sending: 'Sending...',
      subjects: {
        general: 'General Enquiry',
        reading: 'Reading Issue',
        billing: 'Billing & Payments',
        feedback: 'Feedback & Suggestions',
        other: 'Other',
      },
    },
    success: {
      title: 'Message Sent',
      text: 'Thank you for reaching out. We\'ll get back to you within 24\u201348 hours.',
      another: 'Send another message',
    },
    error: {
      generic: 'Something went wrong. Please try again.',
    },
    validation: {
      nameRequired: 'Please enter your name.',
      emailRequired: 'Please enter your email address.',
      emailInvalid: 'Please enter a valid email address.',
      subjectRequired: 'Please select a subject.',
      messageRequired: 'Please enter your message.',
      messageMin: 'Your message must be at least 10 characters.',
    },
    response: {
      title: 'Response Time',
      text: 'We typically reply within 24\u201348 hours.',
    },
  },
  fr: {
    hero: {
      title: 'Contactez-nous',
      subtitle: 'Nous serions ravis de vous entendre. Envoyez-nous un message et nous vous r\u00e9pondrons d\u00e8s que possible.',
    },
    form: {
      name: 'Votre Nom',
      namePlaceholder: 'Entrez votre nom',
      email: 'Adresse Email',
      emailPlaceholder: 'votre@email.com',
      phone: 'T\u00e9l\u00e9phone (facultatif)',
      phonePlaceholder: '+33 6 12 34 56 78',
      subject: 'Sujet',
      subjectPlaceholder: 'S\u00e9lectionnez un sujet',
      message: 'Votre Message',
      messagePlaceholder: 'Dites-nous comment nous pouvons vous aider...',
      submit: 'Envoyer le Message',
      sending: 'Envoi en cours...',
      subjects: {
        general: 'Question G\u00e9n\u00e9rale',
        reading: 'Probl\u00e8me de Lecture',
        billing: 'Facturation & Paiements',
        feedback: 'Retours & Suggestions',
        other: 'Autre',
      },
    },
    success: {
      title: 'Message Envoy\u00e9',
      text: 'Merci de nous avoir contact\u00e9s. Nous vous r\u00e9pondrons sous 24 \u00e0 48 heures.',
      another: 'Envoyer un autre message',
    },
    error: {
      generic: 'Une erreur est survenue. Veuillez r\u00e9essayer.',
    },
    validation: {
      nameRequired: 'Veuillez entrer votre nom.',
      emailRequired: 'Veuillez entrer votre adresse email.',
      emailInvalid: 'Veuillez entrer une adresse email valide.',
      subjectRequired: 'Veuillez s\u00e9lectionner un sujet.',
      messageRequired: 'Veuillez entrer votre message.',
      messageMin: 'Votre message doit contenir au moins 10 caract\u00e8res.',
    },
    response: {
      title: 'D\u00e9lai de R\u00e9ponse',
      text: 'Nous r\u00e9pondons g\u00e9n\u00e9ralement sous 24 \u00e0 48 heures.',
    },
  },
};

interface FormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}

const Contact: React.FC = () => {
  const { language } = useApp();
  const t = content[language];

  const [form, setForm] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!form.name.trim()) newErrors.name = t.validation.nameRequired;
    if (!form.email.trim()) {
      newErrors.email = t.validation.emailRequired;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = t.validation.emailInvalid;
    }
    if (!form.subject) newErrors.subject = t.validation.subjectRequired;
    if (!form.message.trim()) {
      newErrors.message = t.validation.messageRequired;
    } else if (form.message.trim().length < 10) {
      newErrors.message = t.validation.messageMin;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await apiRequest<{ success: boolean }>('/api/v1/contact/submit', {
        method: 'POST',
        body: {
          name: form.name.trim(),
          email: form.email.trim(),
          subject: form.subject,
          message: form.message.trim(),
          phone: form.phone.trim() || undefined,
          language,
        },
      });
      setIsSuccess(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : t.error.generic);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    setErrors({});
    setIsSuccess(false);
    setSubmitError('');
  };

  const updateField = (field: keyof FormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const inputClasses = (field: keyof FormErrors) =>
    `w-full px-4 py-3 rounded-lg bg-slate-800/60 border text-slate-200 placeholder-slate-500 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500/40 ${
      errors[field]
        ? 'border-red-500/60 focus:border-red-400'
        : 'border-white/10 hover:border-white/20 focus:border-purple-500/50'
    }`;

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Section */}
      <section className="relative py-16 px-4 text-center overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-3xl -z-10" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-b from-amber-100 to-purple-300 mb-4">
            {t.hero.title}
          </h1>
          <p className="text-lg text-slate-300 max-w-xl mx-auto">
            {t.hero.subtitle}
          </p>
        </motion.div>
      </section>

      <div className="max-w-2xl mx-auto px-4">
        {isSuccess ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 mx-auto mb-6 bg-green-500/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
            <h2 className="text-2xl font-heading text-amber-100 mb-3">
              {t.success.title}
            </h2>
            <p className="text-slate-400 mb-8 max-w-md mx-auto">
              {t.success.text}
            </p>
            <Button variant="outline" onClick={handleReset}>
              {t.success.another}
            </Button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <form onSubmit={handleSubmit} noValidate>
              <div className="bg-slate-900/40 border border-white/10 rounded-2xl p-6 md:p-8 space-y-5">
                {/* Name & Email row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      {t.form.name}
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={e => updateField('name', e.target.value)}
                      placeholder={t.form.namePlaceholder}
                      className={inputClasses('name')}
                    />
                    {errors.name && (
                      <p className="mt-1.5 text-xs text-red-400">{errors.name}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      {t.form.email}
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => updateField('email', e.target.value)}
                      placeholder={t.form.emailPlaceholder}
                      className={inputClasses('email')}
                    />
                    {errors.email && (
                      <p className="mt-1.5 text-xs text-red-400">{errors.email}</p>
                    )}
                  </div>
                </div>

                {/* Phone & Subject row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      {t.form.phone}
                    </label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder={t.form.phonePlaceholder}
                      className="w-full px-4 py-3 rounded-lg bg-slate-800/60 border border-white/10 text-slate-200 placeholder-slate-500 text-sm transition-colors hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      {t.form.subject}
                    </label>
                    <select
                      value={form.subject}
                      onChange={e => updateField('subject', e.target.value)}
                      className={`${inputClasses('subject')} ${!form.subject ? 'text-slate-500' : ''}`}
                    >
                      <option value="">{t.form.subjectPlaceholder}</option>
                      <option value="General">{t.form.subjects.general}</option>
                      <option value="Reading Issue">{t.form.subjects.reading}</option>
                      <option value="Billing">{t.form.subjects.billing}</option>
                      <option value="Feedback">{t.form.subjects.feedback}</option>
                      <option value="Other">{t.form.subjects.other}</option>
                    </select>
                    {errors.subject && (
                      <p className="mt-1.5 text-xs text-red-400">{errors.subject}</p>
                    )}
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    {t.form.message}
                  </label>
                  <textarea
                    value={form.message}
                    onChange={e => updateField('message', e.target.value)}
                    placeholder={t.form.messagePlaceholder}
                    rows={6}
                    className={`${inputClasses('message')} resize-none`}
                  />
                  {errors.message && (
                    <p className="mt-1.5 text-xs text-red-400">{errors.message}</p>
                  )}
                </div>

                {/* Submit error */}
                {submitError && (
                  <div className="flex items-center gap-3 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    <p className="text-sm text-red-300">{submitError}</p>
                  </div>
                )}

                {/* Submit button + response time */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                  <div className="flex items-center gap-2 text-slate-500 text-xs order-2 sm:order-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{t.response.text}</span>
                  </div>
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={isSubmitting}
                    className="w-full sm:w-auto order-1 sm:order-2"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {isSubmitting ? t.form.sending : t.form.submit}
                  </Button>
                </div>
              </div>
            </form>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Contact;
