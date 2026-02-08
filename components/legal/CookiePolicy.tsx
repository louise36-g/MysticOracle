import React from 'react';
import { useApp } from '../../context/AppContext';
import { Cookie, Shield, Settings, Clock, Globe, Mail } from 'lucide-react';

const CookiePolicy: React.FC = () => {
  const { language } = useApp();

  const content = {
    en: {
      title: 'Cookie Policy',
      subtitle: 'Politique des Cookies',
      lastUpdated: 'Last updated: December 2024',

      sections: [
        {
          icon: Cookie,
          title: '1. What Are Cookies?',
          content: `Cookies are small text files that are stored on your device (computer, tablet, or mobile) when you visit a website. They help the website remember your preferences and improve your browsing experience.

**Types of storage we use:**
• Cookies - Small text files with expiration dates
• Local Storage - Browser storage for persistent data
• Session Storage - Temporary storage cleared when browser closes`
        },
        {
          icon: Shield,
          title: '2. Essential Cookies',
          content: `**These cookies are required for the website to function and cannot be disabled.**

| Cookie Name | Purpose | Duration |
|-------------|---------|----------|
| clerk_session | Authentication session | Session |
| __clerk_db_jwt | Clerk authentication token | 1 year |
| celestiarcana_cookie_consent | Your cookie preferences | 13 months |

**Why they're necessary:**
• Authentication and security
• Remembering your language preference
• Maintaining your session while using the site
• Storing your cookie consent choice`
        },
        {
          icon: Settings,
          title: '3. Analytics Cookies',
          content: `**These cookies help us understand how visitors use our website.**

When enabled, we may use:
• Anonymous usage statistics
• Page view tracking
• Feature usage analysis

**We DO NOT:**
• Track individual users across websites
• Sell or share analytics data with third parties
• Use analytics for advertising purposes

**Data anonymization:**
All analytics data is anonymized. We cannot identify individual users from this data.`
        },
        {
          icon: Globe,
          title: '4. Marketing Cookies',
          content: `**These cookies are used to deliver relevant advertisements.**

Currently, CelestiArcana does not use marketing cookies. If we introduce them in the future, we will:
• Update this policy
• Request your explicit consent
• Provide clear opt-out options

**Third-party services:**
If you purchase credits, our payment providers (Stripe/PayPal) may set their own cookies. Please refer to their privacy policies:
• Stripe: https://stripe.com/privacy
• PayPal: https://www.paypal.com/privacy`
        },
        {
          icon: Clock,
          title: '5. Cookie Retention',
          content: `**How long cookies are stored:**

• Essential cookies: Duration varies (session to 1 year)
• Analytics cookies: Up to 2 years
• Marketing cookies: Not currently used

**CNIL Compliance:**
In accordance with French regulations (CNIL), your cookie consent is valid for a maximum of 13 months. After this period, we will ask for your consent again.`
        },
        {
          icon: Settings,
          title: '6. Managing Your Cookies',
          content: `**On CelestiArcana:**
You can change your cookie preferences at any time by clicking the cookie settings option in our cookie banner or footer.

**In Your Browser:**
You can also manage cookies through your browser settings:

• **Chrome:** Settings > Privacy and Security > Cookies
• **Firefox:** Settings > Privacy & Security > Cookies
• **Safari:** Preferences > Privacy > Cookies
• **Edge:** Settings > Cookies and Site Permissions

**Note:** Disabling essential cookies may prevent you from using certain features of our website.`
        },
        {
          icon: Shield,
          title: '7. Your Rights (GDPR)',
          content: `Under the General Data Protection Regulation (GDPR), you have the right to:

• **Access** - Request information about cookies we store
• **Rectification** - Correct any inaccurate data
• **Erasure** - Request deletion of your data
• **Withdraw Consent** - Change your cookie preferences at any time

**How to exercise your rights:**
Contact us at contact@celestiarcana.com or use the cookie settings panel.`
        },
        {
          icon: Mail,
          title: '8. Contact Us',
          content: `For any questions about our use of cookies:

**Email:** contact@celestiarcana.com
**Address:** 7 rue Beauregard, 77171 Chalautre la Grande, France

**Data Protection Officer:**
contact@celestiarcana.com

**Response Time:**
We aim to respond to all cookie-related inquiries within 30 days.`
        }
      ]
    },
    fr: {
      title: 'Politique des Cookies',
      subtitle: 'Cookie Policy',
      lastUpdated: 'Dernière mise à jour : Décembre 2024',

      sections: [
        {
          icon: Cookie,
          title: '1. Que Sont les Cookies ?',
          content: `Les cookies sont de petits fichiers texte stockés sur votre appareil (ordinateur, tablette ou mobile) lorsque vous visitez un site web. Ils aident le site à mémoriser vos préférences et à améliorer votre expérience de navigation.

**Types de stockage que nous utilisons :**
• Cookies - Petits fichiers texte avec dates d'expiration
• Local Storage - Stockage navigateur pour données persistantes
• Session Storage - Stockage temporaire effacé à la fermeture du navigateur`
        },
        {
          icon: Shield,
          title: '2. Cookies Essentiels',
          content: `**Ces cookies sont nécessaires au fonctionnement du site et ne peuvent pas être désactivés.**

| Nom du Cookie | Objectif | Durée |
|---------------|----------|-------|
| clerk_session | Session d'authentification | Session |
| __clerk_db_jwt | Token d'authentification Clerk | 1 an |
| celestiarcana_cookie_consent | Vos préférences de cookies | 13 mois |

**Pourquoi ils sont nécessaires :**
• Authentification et sécurité
• Mémorisation de votre préférence de langue
• Maintien de votre session pendant l'utilisation du site
• Stockage de votre choix de consentement aux cookies`
        },
        {
          icon: Settings,
          title: '3. Cookies Analytiques',
          content: `**Ces cookies nous aident à comprendre comment les visiteurs utilisent notre site.**

Lorsqu'ils sont activés, nous pouvons utiliser :
• Statistiques d'utilisation anonymes
• Suivi des pages vues
• Analyse de l'utilisation des fonctionnalités

**Nous NE faisons PAS :**
• Suivre les utilisateurs individuels sur d'autres sites
• Vendre ou partager les données analytiques avec des tiers
• Utiliser les analyses à des fins publicitaires

**Anonymisation des données :**
Toutes les données analytiques sont anonymisées. Nous ne pouvons pas identifier les utilisateurs individuels à partir de ces données.`
        },
        {
          icon: Globe,
          title: '4. Cookies Marketing',
          content: `**Ces cookies sont utilisés pour diffuser des publicités pertinentes.**

Actuellement, CelestiArcana n'utilise pas de cookies marketing. Si nous les introduisons à l'avenir, nous :
• Mettrons à jour cette politique
• Demanderons votre consentement explicite
• Fournirons des options de refus claires

**Services tiers :**
Si vous achetez des crédits, nos prestataires de paiement (Stripe/PayPal) peuvent définir leurs propres cookies. Veuillez consulter leurs politiques de confidentialité :
• Stripe : https://stripe.com/privacy
• PayPal : https://www.paypal.com/privacy`
        },
        {
          icon: Clock,
          title: '5. Conservation des Cookies',
          content: `**Durée de stockage des cookies :**

• Cookies essentiels : Durée variable (session à 1 an)
• Cookies analytiques : Jusqu'à 2 ans
• Cookies marketing : Non utilisés actuellement

**Conformité CNIL :**
Conformément à la réglementation française (CNIL), votre consentement aux cookies est valable pour une durée maximale de 13 mois. Après cette période, nous vous demanderons à nouveau votre consentement.`
        },
        {
          icon: Settings,
          title: '6. Gérer Vos Cookies',
          content: `**Sur CelestiArcana :**
Vous pouvez modifier vos préférences de cookies à tout moment en cliquant sur l'option de paramètres de cookies dans notre bannière ou pied de page.

**Dans Votre Navigateur :**
Vous pouvez également gérer les cookies via les paramètres de votre navigateur :

• **Chrome :** Paramètres > Confidentialité et sécurité > Cookies
• **Firefox :** Paramètres > Vie privée et sécurité > Cookies
• **Safari :** Préférences > Confidentialité > Cookies
• **Edge :** Paramètres > Cookies et autorisations de site

**Note :** La désactivation des cookies essentiels peut vous empêcher d'utiliser certaines fonctionnalités de notre site.`
        },
        {
          icon: Shield,
          title: '7. Vos Droits (RGPD)',
          content: `En vertu du Règlement Général sur la Protection des Données (RGPD), vous avez le droit de :

• **Accès** - Demander des informations sur les cookies que nous stockons
• **Rectification** - Corriger toute donnée inexacte
• **Effacement** - Demander la suppression de vos données
• **Retrait du Consentement** - Modifier vos préférences de cookies à tout moment

**Comment exercer vos droits :**
Contactez-nous à contact@celestiarcana.com ou utilisez le panneau de paramètres des cookies.`
        },
        {
          icon: Mail,
          title: '8. Nous Contacter',
          content: `Pour toute question concernant notre utilisation des cookies :

**Email :** contact@celestiarcana.com
**Adresse :** 7 rue Beauregard, 77171 Chalautre la Grande, France

**Délégué à la Protection des Données :**
contact@celestiarcana.com

**Délai de Réponse :**
Nous nous efforçons de répondre à toutes les demandes relatives aux cookies dans un délai de 30 jours.`
        }
      ]
    }
  };

  const t = content[language];

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

        {/* Sections */}
        <div className="space-y-8">
          {t.sections.map((section, index) => {
            const Icon = section.icon;
            return (
              <div
                key={index}
                className="bg-slate-900/60 rounded-xl border border-purple-500/20 p-6 md:p-8"
              >
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
                        const formattedLine = line.replace(
                          /\*\*(.*?)\*\*/g,
                          '<strong class="text-purple-200">$1</strong>'
                        );
                        if (line.startsWith('•')) {
                          return (
                            <p
                              key={lIndex}
                              className="ml-4 text-slate-400"
                              dangerouslySetInnerHTML={{ __html: formattedLine }}
                            />
                          );
                        }
                        if (line.startsWith('|')) {
                          // Simple table row styling
                          return (
                            <p
                              key={lIndex}
                              className="font-mono text-xs text-slate-400"
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
          })}
        </div>

        {/* Footer Note */}
        <div className="mt-12 text-center text-slate-500 text-sm">
          <p>
            {language === 'en'
              ? 'This Cookie Policy complies with GDPR and French CNIL regulations.'
              : 'Cette Politique des Cookies est conforme au RGPD et aux réglementations françaises de la CNIL.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CookiePolicy;
