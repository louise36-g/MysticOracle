import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useUser } from '@clerk/clerk-react';
import { RefreshCcw, AlertCircle, CheckCircle, FileText, Clock, Mail } from 'lucide-react';

interface WithdrawalFormData {
  email: string;
  orderReference: string;
  purchaseDate: string;
  reason: string;
}

const WithdrawalForm: React.FC = () => {
  const { language } = useApp();
  const { user, isSignedIn } = useUser();
  const [formData, setFormData] = useState<WithdrawalFormData>({
    email: user?.primaryEmailAddress?.emailAddress || '',
    orderReference: '',
    purchaseDate: '',
    reason: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const content = {
    en: {
      title: 'Right of Withdrawal',
      subtitle: 'Droit de Rétractation',
      lastUpdated: 'EU Consumer Rights',

      intro: {
        icon: FileText,
        title: 'Your 14-Day Withdrawal Right',
        content: `Under EU consumer protection law (Directive 2011/83/EU), you have the right to withdraw from your purchase within **14 days** without giving any reason.

**The withdrawal period expires:**
• 14 days from the day of purchase for digital content

**Important Exceptions:**
• If you have already used credits from your purchase, only unused credits can be refunded
• The withdrawal right does not apply to fully consumed digital content where you explicitly consented to immediate performance and acknowledged loss of withdrawal right`
      },

      form: {
        title: 'Withdrawal Request Form',
        email: 'Email Address',
        emailPlaceholder: 'Your email address',
        orderReference: 'Order/Transaction Reference',
        orderReferencePlaceholder: 'e.g., pi_xxx or txn_xxx',
        purchaseDate: 'Date of Purchase',
        reason: 'Reason (Optional)',
        reasonPlaceholder: 'Tell us why you want to withdraw (optional)',
        submit: 'Submit Withdrawal Request',
        submitting: 'Submitting...',
        loginRequired: 'Please sign in to submit a withdrawal request',
      },

      success: {
        title: 'Request Submitted',
        message: 'Your withdrawal request has been received. We will process it within 14 days and contact you at the email address provided.',
      },

      error: {
        title: 'Submission Failed',
        tryAgain: 'Please try again or contact us directly at contact@celestiarcana.com',
      },

      timeline: {
        icon: Clock,
        title: 'Processing Timeline',
        content: `**After you submit your request:**
• We will acknowledge receipt within 48 hours
• Refund processed within 14 days of receiving your request
• Refund will be made using the same payment method as your original purchase

**Contact for Refunds:**
Email: contact@celestiarcana.com
Address: 7 rue Beauregard, 77171 Chalautre la Grande, France`
      },

      footer: 'This form complies with EU Directive 2011/83/EU on consumer rights.',
    },
    fr: {
      title: 'Droit de Rétractation',
      subtitle: 'Right of Withdrawal',
      lastUpdated: 'Droits des Consommateurs UE',

      intro: {
        icon: FileText,
        title: 'Votre Droit de Rétractation de 14 Jours',
        content: `Conformément à la législation européenne sur la protection des consommateurs (Directive 2011/83/UE), vous avez le droit de vous rétracter de votre achat dans un délai de **14 jours** sans avoir à justifier votre décision.

**Le délai de rétractation expire :**
• 14 jours à compter du jour de l'achat pour le contenu numérique

**Exceptions Importantes :**
• Si vous avez déjà utilisé des crédits de votre achat, seuls les crédits non utilisés peuvent être remboursés
• Le droit de rétractation ne s'applique pas au contenu numérique entièrement consommé lorsque vous avez expressément consenti à l'exécution immédiate et reconnu la perte du droit de rétractation`
      },

      form: {
        title: 'Formulaire de Demande de Rétractation',
        email: 'Adresse Email',
        emailPlaceholder: 'Votre adresse email',
        orderReference: 'Référence de Commande/Transaction',
        orderReferencePlaceholder: 'ex: pi_xxx ou txn_xxx',
        purchaseDate: 'Date d\'Achat',
        reason: 'Motif (Facultatif)',
        reasonPlaceholder: 'Dites-nous pourquoi vous souhaitez vous rétracter (facultatif)',
        submit: 'Soumettre la Demande de Rétractation',
        submitting: 'Envoi en cours...',
        loginRequired: 'Veuillez vous connecter pour soumettre une demande de rétractation',
      },

      success: {
        title: 'Demande Envoyée',
        message: 'Votre demande de rétractation a été reçue. Nous la traiterons dans un délai de 14 jours et vous contacterons à l\'adresse email fournie.',
      },

      error: {
        title: 'Échec de l\'Envoi',
        tryAgain: 'Veuillez réessayer ou nous contacter directement à contact@celestiarcana.com',
      },

      timeline: {
        icon: Clock,
        title: 'Délai de Traitement',
        content: `**Après soumission de votre demande :**
• Nous accuserons réception sous 48 heures
• Remboursement effectué dans les 14 jours suivant la réception de votre demande
• Le remboursement sera effectué par le même moyen de paiement que votre achat initial

**Contact pour les Remboursements :**
Email : contact@celestiarcana.com
Adresse : 7 rue Beauregard, 77171 Chalautre la Grande, France`
      },

      footer: 'Ce formulaire est conforme à la Directive UE 2011/83/UE relative aux droits des consommateurs.',
    }
  };

  const t = content[language];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      const response = await fetch('/api/v1/users/withdrawal-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit request');
      }

      setSubmitStatus('success');
      setFormData({
        email: user?.primaryEmailAddress?.emailAddress || '',
        orderReference: '',
        purchaseDate: '',
        reason: '',
      });
    } catch (error) {
      setSubmitStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Helper to format text with bold markers - content is static/trusted from this component
  const formatText = (text: string): string => {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-purple-200">$1</strong>');
  };

  const renderSection = (section: { icon: typeof FileText; title: string; content: string }) => {
    const Icon = section.icon;
    return (
      <div className="bg-slate-900/60 rounded-xl border border-purple-500/20 p-6 md:p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-500/10 rounded-lg">
            <Icon className="w-5 h-5 text-purple-400" />
          </div>
          <h2 className="text-xl font-heading text-purple-200">
            {section.title}
          </h2>
        </div>
        <div className="text-slate-300 prose prose-invert prose-sm max-w-none">
          {section.content.split('\n\n').map((paragraph, pIndex) => (
            <div key={pIndex} className="mb-4">
              {paragraph.split('\n').map((line, lIndex) => {
                const formattedLine = formatText(line);
                if (line.startsWith('•')) {
                  return (
                    <p
                      key={lIndex}
                      className="ml-4 text-slate-400"
                      dangerouslySetInnerHTML={{ __html: formattedLine }}
                    />
                  );
                }
                return (
                  <p
                    key={lIndex}
                    dangerouslySetInnerHTML={{ __html: formattedLine }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen py-12 px-4 relative z-10">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-purple-300 mb-2">
            {t.title}
          </h1>
          <p className="text-slate-400 text-sm italic">{t.subtitle}</p>
          <p className="text-slate-500 text-sm mt-4">{t.lastUpdated}</p>
        </div>

        <div className="space-y-8">
          {/* Introduction */}
          {renderSection(t.intro)}

          {/* Form Section */}
          <div className="bg-slate-900/60 rounded-xl border border-purple-500/20 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <RefreshCcw className="w-5 h-5 text-purple-400" />
              </div>
              <h2 className="text-xl font-heading text-purple-200">
                {t.form.title}
              </h2>
            </div>

            {submitStatus === 'success' ? (
              <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-6 text-center">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <h3 className="text-xl font-heading text-green-300 mb-2">{t.success.title}</h3>
                <p className="text-slate-300">{t.success.message}</p>
              </div>
            ) : !isSignedIn ? (
              <div className="bg-amber-900/30 border border-amber-500/30 rounded-lg p-6 text-center">
                <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
                <p className="text-slate-300">{t.form.loginRequired}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {submitStatus === 'error' && (
                  <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-red-300 mb-2">
                      <AlertCircle className="w-5 h-5" />
                      <span className="font-medium">{t.error.title}</span>
                    </div>
                    <p className="text-red-300/80 text-sm">
                      {errorMessage || t.error.tryAgain}
                    </p>
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-purple-200 mb-2">
                    {t.form.email} *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder={t.form.emailPlaceholder}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-purple-500/30 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
                  />
                </div>

                <div>
                  <label htmlFor="orderReference" className="block text-sm font-medium text-purple-200 mb-2">
                    {t.form.orderReference} *
                  </label>
                  <input
                    type="text"
                    id="orderReference"
                    name="orderReference"
                    required
                    value={formData.orderReference}
                    onChange={handleInputChange}
                    placeholder={t.form.orderReferencePlaceholder}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-purple-500/30 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
                  />
                </div>

                <div>
                  <label htmlFor="purchaseDate" className="block text-sm font-medium text-purple-200 mb-2">
                    {t.form.purchaseDate} *
                  </label>
                  <input
                    type="date"
                    id="purchaseDate"
                    name="purchaseDate"
                    required
                    value={formData.purchaseDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-purple-500/30 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
                  />
                </div>

                <div>
                  <label htmlFor="reason" className="block text-sm font-medium text-purple-200 mb-2">
                    {t.form.reason}
                  </label>
                  <textarea
                    id="reason"
                    name="reason"
                    rows={3}
                    value={formData.reason}
                    onChange={handleInputChange}
                    placeholder={t.form.reasonPlaceholder}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-purple-500/30 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCcw className="w-5 h-5 animate-spin" />
                      {t.form.submitting}
                    </>
                  ) : (
                    <>
                      <Mail className="w-5 h-5" />
                      {t.form.submit}
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Timeline */}
          {renderSection(t.timeline)}
        </div>

        {/* Footer Note */}
        <div className="mt-12 text-center text-slate-500 text-sm">
          <p>{t.footer}</p>
        </div>
      </div>
    </div>
  );
};

export default WithdrawalForm;
