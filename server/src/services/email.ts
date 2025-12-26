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

const TEMPLATES = {
  WELCOME: {
    en: {
      subject: 'Welcome to MysticOracle! 🔮',
      htmlContent: `
        <html>
          <body style="font-family: Arial, sans-serif; background-color: #0f0c29; color: #e2e8f0; padding: 40px;">
            <div style="max-width: 600px; margin: 0 auto;">
              <h1 style="color: #c4b5fd;">Welcome to MysticOracle, {{params.username}}!</h1>
              <p>Your mystical journey begins now. You've received <strong>10 free credits</strong> to start exploring.</p>
              <p>Discover what the cards have in store for you:</p>
              <ul>
                <li>🃏 AI-powered tarot readings</li>
                <li>⭐ Daily horoscopes</li>
                <li>🔮 Follow-up questions for deeper insights</li>
              </ul>
              <a href="{{params.siteUrl}}" style="display: inline-block; background: linear-gradient(to right, #fbbf24, #a855f7); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 20px;">Start Your First Reading</a>
              <p style="margin-top: 40px; color: #94a3b8; font-size: 12px;">
                You're receiving this email because you signed up for MysticOracle.<br>
                <a href="{{params.unsubscribeUrl}}" style="color: #94a3b8;">Unsubscribe</a>
              </p>
            </div>
          </body>
        </html>
      `
    },
    fr: {
      subject: 'Bienvenue sur MysticOracle! 🔮',
      htmlContent: `
        <html>
          <body style="font-family: Arial, sans-serif; background-color: #0f0c29; color: #e2e8f0; padding: 40px;">
            <div style="max-width: 600px; margin: 0 auto;">
              <h1 style="color: #c4b5fd;">Bienvenue sur MysticOracle, {{params.username}}!</h1>
              <p>Votre voyage mystique commence maintenant. Vous avez reçu <strong>10 crédits gratuits</strong> pour commencer à explorer.</p>
              <p>Découvrez ce que les cartes vous réservent :</p>
              <ul>
                <li>🃏 Lectures de tarot alimentées par l'IA</li>
                <li>⭐ Horoscopes quotidiens</li>
                <li>🔮 Questions de suivi pour des insights plus profonds</li>
              </ul>
              <a href="{{params.siteUrl}}" style="display: inline-block; background: linear-gradient(to right, #fbbf24, #a855f7); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 20px;">Commencer Votre Première Lecture</a>
              <p style="margin-top: 40px; color: #94a3b8; font-size: 12px;">
                Vous recevez cet email car vous vous êtes inscrit sur MysticOracle.<br>
                <a href="{{params.unsubscribeUrl}}" style="color: #94a3b8;">Se désabonner</a>
              </p>
            </div>
          </body>
        </html>
      `
    }
  },

  PURCHASE_CONFIRMATION: {
    en: {
      subject: 'Payment Confirmed - {{params.credits}} Credits Added',
      htmlContent: `
        <html>
          <body style="font-family: Arial, sans-serif; background-color: #0f0c29; color: #e2e8f0; padding: 40px;">
            <div style="max-width: 600px; margin: 0 auto;">
              <h1 style="color: #c4b5fd;">Payment Confirmed! ✨</h1>
              <p>Thank you for your purchase, {{params.username}}.</p>
              <div style="background: #1e1b4b; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Credits Added:</strong> {{params.credits}}</p>
                <p><strong>Amount Paid:</strong> {{params.amount}}</p>
                <p><strong>New Balance:</strong> {{params.newBalance}} credits</p>
              </div>
              <a href="{{params.siteUrl}}" style="display: inline-block; background: linear-gradient(to right, #fbbf24, #a855f7); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Continue Your Journey</a>
            </div>
          </body>
        </html>
      `
    },
    fr: {
      subject: 'Paiement Confirmé - {{params.credits}} Crédits Ajoutés',
      htmlContent: `
        <html>
          <body style="font-family: Arial, sans-serif; background-color: #0f0c29; color: #e2e8f0; padding: 40px;">
            <div style="max-width: 600px; margin: 0 auto;">
              <h1 style="color: #c4b5fd;">Paiement Confirmé! ✨</h1>
              <p>Merci pour votre achat, {{params.username}}.</p>
              <div style="background: #1e1b4b; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Crédits Ajoutés:</strong> {{params.credits}}</p>
                <p><strong>Montant Payé:</strong> {{params.amount}}</p>
                <p><strong>Nouveau Solde:</strong> {{params.newBalance}} crédits</p>
              </div>
              <a href="{{params.siteUrl}}" style="display: inline-block; background: linear-gradient(to right, #fbbf24, #a855f7); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Continuer Votre Voyage</a>
            </div>
          </body>
        </html>
      `
    }
  }
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
      email: 'louise.charlotte.griffin@gmail.com' // Update with your verified domain
    };

    sendSmtpEmail.to = [{
      email: options.to,
      name: options.toName || options.to
    }];

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
      unsubscribeUrl: `${process.env.FRONTEND_URL}/unsubscribe`
    }
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
      siteUrl: process.env.FRONTEND_URL || 'https://mysticoracle.com'
    }
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

  return upsertContact(
    email,
    { LANGUAGE: language },
    [NEWSLETTER_LIST_ID]
  );
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
  unsubscribeContact
};
