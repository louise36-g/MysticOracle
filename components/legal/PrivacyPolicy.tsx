import React from 'react';
import { useApp } from '../../context/AppContext';
import { Shield, Mail, Clock, Users, Globe, AlertCircle } from 'lucide-react';

const PrivacyPolicy: React.FC = () => {
  const { language } = useApp();

  const content = {
    en: {
      title: 'Privacy Policy',
      subtitle: 'Politique de Confidentialité',
      lastUpdated: 'Last updated: December 2024',

      sections: [
        {
          icon: Shield,
          title: '1. Data Controller',
          content: `MysticOracle is operated by La Petite Voie, an auto-entrepreneur registered in France.

**Registered Address:** 7 rue Beauregard, 77171 Chalautre la Grande, France
**SIRET:** 92357809000014
**Contact:** privacy@mysticoracle.com

For any questions regarding your personal data, you may contact our Data Protection team at the address above.`
        },
        {
          icon: Users,
          title: '2. Data We Collect',
          content: `We collect the following categories of personal data:

**Account Information:**
• Email address (for account creation and communication)
• Username (for identification within the platform)
• Password (encrypted, never stored in plain text)

**Technical Data:**
• IP address (for security and fraud prevention)
• Browser type and version
• Device information
• Cookies and similar technologies

**Usage Data:**
• Reading history and preferences
• Credit transactions and balance
• Login timestamps and activity logs

**Payment Data:**
• Payment transactions are processed by our third-party payment processors (Stripe/PayPal)
• We do not store your complete credit card details on our servers`
        },
        {
          icon: AlertCircle,
          title: '3. Purpose & Legal Basis',
          content: `We process your data for the following purposes:

**Contract Performance (Art. 6(1)(b) GDPR):**
• Creating and managing your account
• Providing tarot readings and horoscope services
• Processing credit transactions
• Customer support

**Legitimate Interest (Art. 6(1)(f) GDPR):**
• Improving our services and user experience
• Fraud prevention and security
• Analytics and service optimization

**Consent (Art. 6(1)(a) GDPR):**
• Marketing communications (optional)
• Non-essential cookies
• Newsletter subscription

**Legal Obligation (Art. 6(1)(c) GDPR):**
• Tax and accounting records
• Response to legal requests`
        },
        {
          icon: Clock,
          title: '4. Data Retention',
          content: `We retain your data for the following periods:

**Active Accounts:**
• Account data: Duration of account + 3 years after closure
• Reading history: Duration of account + 1 year

**Deleted Accounts:**
• Personal data anonymized within 90 days
• Anonymized usage statistics may be retained indefinitely

**Legal Requirements:**
• Payment and transaction records: 10 years (French tax law)
• Security logs: 1 year

**Cookies:**
• Maximum 13 months as per CNIL guidelines`
        },
        {
          icon: Globe,
          title: '5. Third-Party Data Sharing',
          content: `We share your data with the following categories of recipients:

**Service Providers:**
• **Hosting Provider:** Render - Data stored in EU (Frankfurt)
• **Payment Processors:** Stripe/PayPal - PCI DSS compliant
• **Email Service:** Brevo (Sendinblue) - For transactional emails

**AI Services:**
• **OpenRouter/LLM Providers:** Your questions and reading requests are processed by AI services. No personal identifiers are sent with these requests.

**International Transfers:**
Some of our service providers may process data outside the EU. In such cases, we ensure appropriate safeguards:
• EU-US Data Privacy Framework
• Standard Contractual Clauses (SCCs)
• Adequacy decisions by the European Commission

We never sell your personal data to third parties.`
        },
        {
          icon: Shield,
          title: '6. Your Rights (RGPD)',
          content: `Under the GDPR, you have the following rights:

**Right of Access (Art. 15)**
Request a copy of all personal data we hold about you.

**Right to Rectification (Art. 16)**
Request correction of inaccurate or incomplete data.

**Right to Erasure (Art. 17)**
Request deletion of your personal data ("right to be forgotten").

**Right to Restriction (Art. 18)**
Request limitation of processing in certain circumstances.

**Right to Data Portability (Art. 20)**
Receive your data in a structured, machine-readable format.

**Right to Object (Art. 21)**
Object to processing based on legitimate interests or for direct marketing.

**Right to Withdraw Consent (Art. 7)**
Withdraw consent at any time for consent-based processing.

**To exercise these rights:**
Email: privacy@mysticoracle.com
Response time: Within 30 days

**Right to Lodge a Complaint:**
If you believe your rights have been violated, you may file a complaint with the CNIL (Commission Nationale de l'Informatique et des Libertés):
Website: www.cnil.fr
Address: 3 Place de Fontenoy, TSA 80715, 75334 Paris Cedex 07`
        },
        {
          icon: Shield,
          title: '7. Security Measures',
          content: `We implement appropriate technical and organizational measures to protect your data:

• Encryption of data in transit (TLS/SSL)
• Secure password hashing (bcrypt)
• Regular security audits
• Access controls and authentication
• Secure data backup procedures

In case of a data breach affecting your rights, we will notify you and the CNIL within 72 hours as required by GDPR.`
        },
        {
          icon: AlertCircle,
          title: '8. Automated Decision-Making & AI',
          content: `**Use of Artificial Intelligence:**
Our tarot readings and horoscopes are generated using AI language models (LLMs). This constitutes automated processing of your requests.

**How it works:**
• Your questions and selected cards are sent to AI services for interpretation
• No personal identifiers (email, username) are included in these requests
• The AI generates personalized content based solely on your query context

**Your rights regarding automated processing (Art. 22 GDPR):**
• The AI-generated readings are for entertainment purposes only
• No legally or similarly significant decisions are made based on this processing
• You may request human review of any interpretation by contacting us

**Important disclaimer:**
Tarot readings and horoscopes are provided for entertainment and self-reflection purposes only. They do not constitute professional advice (medical, legal, financial, or psychological).`
        },
        {
          icon: Users,
          title: '9. Children & Minors',
          content: `**Age Requirement:**
MysticOracle is intended for users aged 16 years and older in accordance with French law (Article 7-1 of Law No. 78-17).

**Parental Consent:**
Users between 13 and 16 years old may use the service only with verifiable parental or guardian consent.

**Our Commitment:**
• We do not knowingly collect data from children under 13
• If we discover that a child under 13 has created an account, we will promptly delete it
• Parents or guardians may contact us to request deletion of their child's data

**Contact for Parental Requests:**
Email: privacy@mysticoracle.com`
        },
        {
          icon: Mail,
          title: '10. Contact Us',
          content: `For any questions about this Privacy Policy or your personal data:

**Email:** privacy@mysticoracle.com
**Address:** 7 rue Beauregard, 77171 Chalautre la Grande, France

We aim to respond to all inquiries within 30 days.`
        }
      ]
    },
    fr: {
      title: 'Politique de Confidentialité',
      subtitle: 'Privacy Policy',
      lastUpdated: 'Dernière mise à jour : Décembre 2024',

      sections: [
        {
          icon: Shield,
          title: '1. Responsable du Traitement',
          content: `MysticOracle est exploité par La Petite Voie, auto-entrepreneur enregistré en France.

**Adresse du Siège:** 7 rue Beauregard, 77171 Chalautre la Grande, France
**SIRET:** 92357809000014
**Contact:** privacy@mysticoracle.com

Pour toute question concernant vos données personnelles, vous pouvez contacter notre équipe Protection des Données à l'adresse ci-dessus.`
        },
        {
          icon: Users,
          title: '2. Données Collectées',
          content: `Nous collectons les catégories de données personnelles suivantes :

**Informations de Compte :**
• Adresse email (pour la création de compte et la communication)
• Nom d'utilisateur (pour l'identification sur la plateforme)
• Mot de passe (chiffré, jamais stocké en clair)

**Données Techniques :**
• Adresse IP (pour la sécurité et la prévention de la fraude)
• Type et version du navigateur
• Informations sur l'appareil
• Cookies et technologies similaires

**Données d'Utilisation :**
• Historique et préférences de lecture
• Transactions de crédits et solde
• Horodatage des connexions et journaux d'activité

**Données de Paiement :**
• Les transactions de paiement sont traitées par nos processeurs de paiement tiers (Stripe/PayPal)
• Nous ne stockons pas les détails complets de votre carte bancaire sur nos serveurs`
        },
        {
          icon: AlertCircle,
          title: '3. Finalités et Base Légale',
          content: `Nous traitons vos données pour les finalités suivantes :

**Exécution du Contrat (Art. 6(1)(b) RGPD) :**
• Création et gestion de votre compte
• Fourniture des services de tarot et horoscope
• Traitement des transactions de crédits
• Support client

**Intérêt Légitime (Art. 6(1)(f) RGPD) :**
• Amélioration de nos services et de l'expérience utilisateur
• Prévention de la fraude et sécurité
• Analyses et optimisation du service

**Consentement (Art. 6(1)(a) RGPD) :**
• Communications marketing (optionnel)
• Cookies non essentiels
• Inscription à la newsletter

**Obligation Légale (Art. 6(1)(c) RGPD) :**
• Registres fiscaux et comptables
• Réponse aux demandes légales`
        },
        {
          icon: Clock,
          title: '4. Durée de Conservation',
          content: `Nous conservons vos données pendant les périodes suivantes :

**Comptes Actifs :**
• Données de compte : Durée du compte + 3 ans après clôture
• Historique des lectures : Durée du compte + 1 an

**Comptes Supprimés :**
• Données personnelles anonymisées sous 90 jours
• Statistiques d'utilisation anonymisées conservées indéfiniment

**Exigences Légales :**
• Registres de paiement et transactions : 10 ans (droit fiscal français)
• Journaux de sécurité : 1 an

**Cookies :**
• Maximum 13 mois conformément aux directives de la CNIL`
        },
        {
          icon: Globe,
          title: '5. Partage des Données avec des Tiers',
          content: `Nous partageons vos données avec les catégories de destinataires suivantes :

**Prestataires de Services :**
• **Hébergeur :** Render - Données stockées dans l'UE (Francfort)
• **Processeurs de Paiement :** Stripe/PayPal - Conformes PCI DSS
• **Service Email :** Brevo (Sendinblue) - Pour les emails transactionnels

**Services d'IA :**
• **OpenRouter/Fournisseurs LLM :** Vos questions et demandes de lecture sont traitées par des services d'IA. Aucun identifiant personnel n'est envoyé avec ces requêtes.

**Transferts Internationaux :**
Certains de nos prestataires peuvent traiter des données en dehors de l'UE. Dans ce cas, nous assurons des garanties appropriées :
• Cadre de Protection des Données UE-USA
• Clauses Contractuelles Types (CCT)
• Décisions d'adéquation de la Commission Européenne

Nous ne vendons jamais vos données personnelles à des tiers.`
        },
        {
          icon: Shield,
          title: '6. Vos Droits (RGPD)',
          content: `En vertu du RGPD, vous disposez des droits suivants :

**Droit d'Accès (Art. 15)**
Demander une copie de toutes les données personnelles que nous détenons sur vous.

**Droit de Rectification (Art. 16)**
Demander la correction de données inexactes ou incomplètes.

**Droit à l'Effacement (Art. 17)**
Demander la suppression de vos données personnelles ("droit à l'oubli").

**Droit à la Limitation (Art. 18)**
Demander la limitation du traitement dans certaines circonstances.

**Droit à la Portabilité (Art. 20)**
Recevoir vos données dans un format structuré et lisible par machine.

**Droit d'Opposition (Art. 21)**
S'opposer au traitement basé sur l'intérêt légitime ou pour le marketing direct.

**Droit de Retirer le Consentement (Art. 7)**
Retirer votre consentement à tout moment pour les traitements basés sur le consentement.

**Pour exercer ces droits :**
Email : privacy@mysticoracle.com
Délai de réponse : Sous 30 jours

**Droit de Déposer une Plainte :**
Si vous estimez que vos droits ont été violés, vous pouvez déposer une plainte auprès de la CNIL (Commission Nationale de l'Informatique et des Libertés) :
Site web : www.cnil.fr
Adresse : 3 Place de Fontenoy, TSA 80715, 75334 Paris Cedex 07`
        },
        {
          icon: Shield,
          title: '7. Mesures de Sécurité',
          content: `Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données :

• Chiffrement des données en transit (TLS/SSL)
• Hachage sécurisé des mots de passe (bcrypt)
• Audits de sécurité réguliers
• Contrôles d'accès et authentification
• Procédures de sauvegarde sécurisées

En cas de violation de données affectant vos droits, nous vous notifierons ainsi que la CNIL dans les 72 heures conformément au RGPD.`
        },
        {
          icon: AlertCircle,
          title: '8. Prise de Décision Automatisée & IA',
          content: `**Utilisation de l'Intelligence Artificielle :**
Nos lectures de tarot et horoscopes sont générés à l'aide de modèles de langage IA (LLM). Cela constitue un traitement automatisé de vos demandes.

**Comment cela fonctionne :**
• Vos questions et cartes sélectionnées sont envoyées aux services d'IA pour interprétation
• Aucun identifiant personnel (email, nom d'utilisateur) n'est inclus dans ces requêtes
• L'IA génère du contenu personnalisé basé uniquement sur le contexte de votre requête

**Vos droits concernant le traitement automatisé (Art. 22 RGPD) :**
• Les lectures générées par l'IA sont uniquement à des fins de divertissement
• Aucune décision juridiquement ou similairement significative n'est prise sur la base de ce traitement
• Vous pouvez demander une révision humaine de toute interprétation en nous contactant

**Avertissement important :**
Les lectures de tarot et horoscopes sont fournis à des fins de divertissement et de réflexion personnelle uniquement. Ils ne constituent pas des conseils professionnels (médicaux, juridiques, financiers ou psychologiques).`
        },
        {
          icon: Users,
          title: '9. Enfants & Mineurs',
          content: `**Condition d'Âge :**
MysticOracle est destiné aux utilisateurs âgés de 16 ans et plus conformément à la loi française (Article 7-1 de la Loi n° 78-17).

**Consentement Parental :**
Les utilisateurs entre 13 et 16 ans ne peuvent utiliser le service qu'avec le consentement vérifiable d'un parent ou tuteur.

**Notre Engagement :**
• Nous ne collectons pas sciemment de données d'enfants de moins de 13 ans
• Si nous découvrons qu'un enfant de moins de 13 ans a créé un compte, nous le supprimerons rapidement
• Les parents ou tuteurs peuvent nous contacter pour demander la suppression des données de leur enfant

**Contact pour les Demandes Parentales :**
Email : privacy@mysticoracle.com`
        },
        {
          icon: Mail,
          title: '10. Nous Contacter',
          content: `Pour toute question concernant cette Politique de Confidentialité ou vos données personnelles :

**Email :** privacy@mysticoracle.com
**Adresse :** 7 rue Beauregard, 77171 Chalautre la Grande, France

Nous nous efforçons de répondre à toutes les demandes sous 30 jours.`
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
                        // Handle bold text
                        const formattedLine = line.replace(
                          /\*\*(.*?)\*\*/g,
                          '<strong class="text-purple-200">$1</strong>'
                        );
                        // Handle bullet points
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
          })}
        </div>

        {/* Footer Note */}
        <div className="mt-12 text-center text-slate-500 text-sm">
          <p>
            {language === 'en'
              ? 'This Privacy Policy complies with the General Data Protection Regulation (GDPR) and French data protection laws.'
              : 'Cette Politique de Confidentialité est conforme au Règlement Général sur la Protection des Données (RGPD) et aux lois françaises sur la protection des données.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
