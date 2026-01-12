/**
 * Brevo Email Service
 * Handles transactional emails, newsletters, and marketing
 */

import * as Brevo from '@getbrevo/brevo';

// Initialize Brevo API clients with authentication
const apiKey = process.env.BREVO_API_KEY;

if (!apiKey) {
  console.warn('⚠️ BREVO_API_KEY not configured - emails will not be sent');
}

// Create API instances with API key
const transactionalApi = new Brevo.TransactionalEmailsApi();
const contactsApi = new Brevo.ContactsApi();

// Set API key using the SDK method
if (apiKey) {
  transactionalApi.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, apiKey);
  contactsApi.setApiKey(Brevo.ContactsApiApiKeys.apiKey, apiKey);
}

// ============================================
// EMAIL TEMPLATES
// ============================================

// Base email wrapper for consistent styling
const emailWrapper = (content: string, language: 'en' | 'fr' = 'en') => `
<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MysticOracle</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #0f0c29; color: #e2e8f0;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #0f0c29;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); border-radius: 16px; overflow: hidden; border: 1px solid rgba(139, 92, 246, 0.3);">
          <!-- Header -->
          <tr>
            <td style="padding: 30px 40px; text-align: center; border-bottom: 1px solid rgba(139, 92, 246, 0.2);">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #fbbf24; letter-spacing: 2px;">
                ✨ MysticOracle ✨
              </h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background: rgba(0,0,0,0.2); border-top: 1px solid rgba(139, 92, 246, 0.2);">
              <p style="margin: 0 0 10px 0; font-size: 12px; color: #94a3b8; text-align: center;">
                ${language === 'en' ? 'You received this email because you have an account with MysticOracle.' : 'Vous avez reçu cet email car vous avez un compte MysticOracle.'}
              </p>
              <p style="margin: 0; font-size: 12px; color: #64748b; text-align: center;">
                <a href="{{params.siteUrl}}" style="color: #a78bfa; text-decoration: none;">MysticOracle.com</a>
                ${language === 'en' ? ' | ' : ' | '}
                <a href="{{params.unsubscribeUrl}}" style="color: #64748b; text-decoration: none;">${language === 'en' ? 'Unsubscribe' : 'Se désabonner'}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const TEMPLATES = {
  WELCOME: {
    en: {
      subject: 'Welcome to MysticOracle - Your Journey Begins! 🔮',
      htmlContent: emailWrapper(
        `
        <h2 style="margin: 0 0 20px 0; font-size: 24px; color: #c4b5fd;">
          Welcome, {{params.username}}!
        </h2>
        <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #e2e8f0;">
          The stars have aligned to welcome you to MysticOracle. Your mystical journey begins now with <strong style="color: #fbbf24;">10 free credits</strong> to explore the ancient wisdom of Tarot.
        </p>
        <div style="background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 12px; padding: 20px; margin: 25px 0;">
          <h3 style="margin: 0 0 15px 0; font-size: 16px; color: #a78bfa;">What awaits you:</h3>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr><td style="padding: 8px 0; color: #e2e8f0; font-size: 14px;">🃏 AI-powered tarot readings with deep insights</td></tr>
            <tr><td style="padding: 8px 0; color: #e2e8f0; font-size: 14px;">⭐ Personalized daily horoscopes</td></tr>
            <tr><td style="padding: 8px 0; color: #e2e8f0; font-size: 14px;">🔮 Follow-up questions for deeper understanding</td></tr>
            <tr><td style="padding: 8px 0; color: #e2e8f0; font-size: 14px;">🎁 Daily login bonuses and rewards</td></tr>
          </table>
        </div>
        <div style="text-align: center; margin-top: 30px;">
          <a href="{{params.siteUrl}}" style="display: inline-block; background: linear-gradient(135deg, #fbbf24 0%, #a855f7 100%); color: #1e1b4b; font-weight: 600; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-size: 16px;">
            Begin Your First Reading →
          </a>
        </div>
      `,
        'en'
      ),
    },
    fr: {
      subject: 'Bienvenue sur MysticOracle - Votre Voyage Commence! 🔮',
      htmlContent: emailWrapper(
        `
        <h2 style="margin: 0 0 20px 0; font-size: 24px; color: #c4b5fd;">
          Bienvenue, {{params.username}}!
        </h2>
        <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #e2e8f0;">
          Les étoiles se sont alignées pour vous accueillir sur MysticOracle. Votre voyage mystique commence maintenant avec <strong style="color: #fbbf24;">10 crédits gratuits</strong> pour explorer la sagesse ancienne du Tarot.
        </p>
        <div style="background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 12px; padding: 20px; margin: 25px 0;">
          <h3 style="margin: 0 0 15px 0; font-size: 16px; color: #a78bfa;">Ce qui vous attend:</h3>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr><td style="padding: 8px 0; color: #e2e8f0; font-size: 14px;">🃏 Lectures de tarot alimentées par l'IA</td></tr>
            <tr><td style="padding: 8px 0; color: #e2e8f0; font-size: 14px;">⭐ Horoscopes quotidiens personnalisés</td></tr>
            <tr><td style="padding: 8px 0; color: #e2e8f0; font-size: 14px;">🔮 Questions de suivi pour approfondir</td></tr>
            <tr><td style="padding: 8px 0; color: #e2e8f0; font-size: 14px;">🎁 Bonus quotidiens et récompenses</td></tr>
          </table>
        </div>
        <div style="text-align: center; margin-top: 30px;">
          <a href="{{params.siteUrl}}" style="display: inline-block; background: linear-gradient(135deg, #fbbf24 0%, #a855f7 100%); color: #1e1b4b; font-weight: 600; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-size: 16px;">
            Commencer Votre Première Lecture →
          </a>
        </div>
      `,
        'fr'
      ),
    },
  },

  PURCHASE_CONFIRMATION: {
    en: {
      subject: 'Payment Confirmed - {{params.credits}} Credits Added ✨',
      htmlContent: emailWrapper(
        `
        <div style="text-align: center; margin-bottom: 25px;">
          <div style="display: inline-block; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); border-radius: 50%; padding: 15px;">
            <span style="font-size: 32px;">✓</span>
          </div>
        </div>
        <h2 style="margin: 0 0 20px 0; font-size: 24px; color: #c4b5fd; text-align: center;">
          Payment Confirmed!
        </h2>
        <p style="margin: 0 0 25px 0; font-size: 16px; line-height: 1.6; color: #e2e8f0; text-align: center;">
          Thank you for your purchase, {{params.username}}. Your credits have been added to your account.
        </p>
        <div style="background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 12px; padding: 25px; margin: 25px 0;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td style="padding: 10px 0; color: #94a3b8; font-size: 14px;">Credits Added</td>
              <td style="padding: 10px 0; color: #fbbf24; font-size: 18px; font-weight: 600; text-align: right;">+{{params.credits}}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #94a3b8; font-size: 14px;">Amount Paid</td>
              <td style="padding: 10px 0; color: #e2e8f0; font-size: 16px; text-align: right;">{{params.amount}}</td>
            </tr>
            <tr style="border-top: 1px solid rgba(139, 92, 246, 0.2);">
              <td style="padding: 15px 0 10px 0; color: #a78bfa; font-size: 14px; font-weight: 600;">New Balance</td>
              <td style="padding: 15px 0 10px 0; color: #22c55e; font-size: 20px; font-weight: 700; text-align: right;">{{params.newBalance}} credits</td>
            </tr>
          </table>
        </div>
        <div style="text-align: center; margin-top: 30px;">
          <a href="{{params.siteUrl}}" style="display: inline-block; background: linear-gradient(135deg, #fbbf24 0%, #a855f7 100%); color: #1e1b4b; font-weight: 600; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-size: 16px;">
            Continue Your Journey →
          </a>
        </div>
      `,
        'en'
      ),
    },
    fr: {
      subject: 'Paiement Confirmé - {{params.credits}} Crédits Ajoutés ✨',
      htmlContent: emailWrapper(
        `
        <div style="text-align: center; margin-bottom: 25px;">
          <div style="display: inline-block; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); border-radius: 50%; padding: 15px;">
            <span style="font-size: 32px;">✓</span>
          </div>
        </div>
        <h2 style="margin: 0 0 20px 0; font-size: 24px; color: #c4b5fd; text-align: center;">
          Paiement Confirmé!
        </h2>
        <p style="margin: 0 0 25px 0; font-size: 16px; line-height: 1.6; color: #e2e8f0; text-align: center;">
          Merci pour votre achat, {{params.username}}. Vos crédits ont été ajoutés à votre compte.
        </p>
        <div style="background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 12px; padding: 25px; margin: 25px 0;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td style="padding: 10px 0; color: #94a3b8; font-size: 14px;">Crédits Ajoutés</td>
              <td style="padding: 10px 0; color: #fbbf24; font-size: 18px; font-weight: 600; text-align: right;">+{{params.credits}}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #94a3b8; font-size: 14px;">Montant Payé</td>
              <td style="padding: 10px 0; color: #e2e8f0; font-size: 16px; text-align: right;">{{params.amount}}</td>
            </tr>
            <tr style="border-top: 1px solid rgba(139, 92, 246, 0.2);">
              <td style="padding: 15px 0 10px 0; color: #a78bfa; font-size: 14px; font-weight: 600;">Nouveau Solde</td>
              <td style="padding: 15px 0 10px 0; color: #22c55e; font-size: 20px; font-weight: 700; text-align: right;">{{params.newBalance}} crédits</td>
            </tr>
          </table>
        </div>
        <div style="text-align: center; margin-top: 30px;">
          <a href="{{params.siteUrl}}" style="display: inline-block; background: linear-gradient(135deg, #fbbf24 0%, #a855f7 100%); color: #1e1b4b; font-weight: 600; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-size: 16px;">
            Continuer Votre Voyage →
          </a>
        </div>
      `,
        'fr'
      ),
    },
  },

  LOW_CREDITS_REMINDER: {
    en: {
      subject: 'Your MysticOracle Credits are Running Low 🔮',
      htmlContent: emailWrapper(
        `
        <h2 style="margin: 0 0 20px 0; font-size: 24px; color: #c4b5fd;">
          Don't let your journey end, {{params.username}}
        </h2>
        <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #e2e8f0;">
          You have only <strong style="color: #fbbf24;">{{params.credits}} credits</strong> remaining. Top up now to continue receiving mystical guidance.
        </p>
        <div style="background: rgba(251, 191, 36, 0.1); border: 1px solid rgba(251, 191, 36, 0.3); border-radius: 12px; padding: 20px; margin: 25px 0; text-align: center;">
          <p style="margin: 0 0 10px 0; font-size: 14px; color: #94a3b8;">Your current balance</p>
          <p style="margin: 0; font-size: 36px; font-weight: 700; color: #fbbf24;">{{params.credits}}</p>
          <p style="margin: 5px 0 0 0; font-size: 14px; color: #94a3b8;">credits remaining</p>
        </div>
        <div style="text-align: center; margin-top: 30px;">
          <a href="{{params.siteUrl}}" style="display: inline-block; background: linear-gradient(135deg, #fbbf24 0%, #a855f7 100%); color: #1e1b4b; font-weight: 600; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-size: 16px;">
            Get More Credits →
          </a>
        </div>
      `,
        'en'
      ),
    },
    fr: {
      subject: 'Vos Crédits MysticOracle sont Presque Épuisés 🔮',
      htmlContent: emailWrapper(
        `
        <h2 style="margin: 0 0 20px 0; font-size: 24px; color: #c4b5fd;">
          Ne laissez pas votre voyage s'arrêter, {{params.username}}
        </h2>
        <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #e2e8f0;">
          Il ne vous reste que <strong style="color: #fbbf24;">{{params.credits}} crédits</strong>. Rechargez maintenant pour continuer à recevoir des conseils mystiques.
        </p>
        <div style="background: rgba(251, 191, 36, 0.1); border: 1px solid rgba(251, 191, 36, 0.3); border-radius: 12px; padding: 20px; margin: 25px 0; text-align: center;">
          <p style="margin: 0 0 10px 0; font-size: 14px; color: #94a3b8;">Votre solde actuel</p>
          <p style="margin: 0; font-size: 36px; font-weight: 700; color: #fbbf24;">{{params.credits}}</p>
          <p style="margin: 5px 0 0 0; font-size: 14px; color: #94a3b8;">crédits restants</p>
        </div>
        <div style="text-align: center; margin-top: 30px;">
          <a href="{{params.siteUrl}}" style="display: inline-block; background: linear-gradient(135deg, #fbbf24 0%, #a855f7 100%); color: #1e1b4b; font-weight: 600; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-size: 16px;">
            Obtenir Plus de Crédits →
          </a>
        </div>
      `,
        'fr'
      ),
    },
  },
};

// ============================================
// EMAIL SENDING FUNCTIONS
// ============================================

interface SendEmailOptions {
  to: string;
  toName?: string;
  subject: string;
  htmlContent: string;
  params?: Record<string, string>;
}

/**
 * Send a transactional email
 */
export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  try {
    const sendSmtpEmail = new Brevo.SendSmtpEmail();

    sendSmtpEmail.sender = {
      name: 'MysticOracle',
      email: 'louise.charlotte.griffin@gmail.com', // Update with your verified domain
    };

    sendSmtpEmail.to = [
      {
        email: options.to,
        name: options.toName || options.to,
      },
    ];

    sendSmtpEmail.subject = options.subject;
    sendSmtpEmail.htmlContent = options.htmlContent;

    if (options.params) {
      sendSmtpEmail.params = options.params;
    }

    await transactionalApi.sendTransacEmail(sendSmtpEmail);
    console.log(`✅ Email sent to ${options.to}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(
  email: string,
  username: string,
  language: 'en' | 'fr' = 'en'
): Promise<boolean> {
  const template = TEMPLATES.WELCOME[language];

  return sendEmail({
    to: email,
    toName: username,
    subject: template.subject,
    htmlContent: template.htmlContent,
    params: {
      username,
      siteUrl: process.env.FRONTEND_URL || 'https://mysticoracle.com',
      unsubscribeUrl: `${process.env.FRONTEND_URL}/unsubscribe`,
    },
  });
}

/**
 * Send purchase confirmation email
 */
export async function sendPurchaseConfirmation(
  email: string,
  username: string,
  credits: number,
  amount: number,
  newBalance: number,
  language: 'en' | 'fr' = 'en'
): Promise<boolean> {
  const template = TEMPLATES.PURCHASE_CONFIRMATION[language];

  return sendEmail({
    to: email,
    toName: username,
    subject: template.subject.replace('{{params.credits}}', credits.toString()),
    htmlContent: template.htmlContent,
    params: {
      username,
      credits: credits.toString(),
      amount: `€${amount.toFixed(2)}`,
      newBalance: newBalance.toString(),
      siteUrl: process.env.FRONTEND_URL || 'https://mysticoracle.com',
    },
  });
}

// ============================================
// CONTACT MANAGEMENT (Newsletter)
// ============================================

/**
 * Add or update contact in Brevo
 */
export async function upsertContact(
  email: string,
  attributes?: {
    USERNAME?: string;
    LANGUAGE?: string;
  },
  listIds?: number[]
): Promise<boolean> {
  try {
    const contact = new Brevo.CreateContact();
    contact.email = email;
    contact.attributes = attributes || {};

    if (listIds && listIds.length > 0) {
      contact.listIds = listIds;
    }

    contact.updateEnabled = true; // Update if exists

    await contactsApi.createContact(contact);
    console.log(`✅ Contact added/updated: ${email}`);
    return true;
  } catch (error) {
    console.error('Error upserting contact:', error);
    return false;
  }
}

/**
 * Subscribe to newsletter
 */
export async function subscribeToNewsletter(
  email: string,
  language: 'en' | 'fr' = 'en'
): Promise<boolean> {
  // List ID 1 = Newsletter (update with your actual list ID)
  const NEWSLETTER_LIST_ID = 1;

  return upsertContact(email, { LANGUAGE: language }, [NEWSLETTER_LIST_ID]);
}

/**
 * Unsubscribe from all marketing
 */
export async function unsubscribeContact(email: string): Promise<boolean> {
  try {
    const updateContact = new Brevo.UpdateContact();
    updateContact.emailBlacklisted = true;

    await contactsApi.updateContact(email, updateContact);
    console.log(`✅ Contact unsubscribed: ${email}`);
    return true;
  } catch (error) {
    console.error('Error unsubscribing contact:', error);
    return false;
  }
}

export default {
  sendEmail,
  sendWelcomeEmail,
  sendPurchaseConfirmation,
  upsertContact,
  subscribeToNewsletter,
  unsubscribeContact,
};
