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
  <title>CelestiArcana</title>
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
                ✨ CelestiArcana ✨
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
                ${language === 'en' ? 'You received this email because you have an account with CelestiArcana.' : 'Vous avez reçu cet email car vous avez un compte CelestiArcana.'}
              </p>
              <p style="margin: 0; font-size: 12px; color: #64748b; text-align: center;">
                <a href="{{params.siteUrl}}" style="color: #a78bfa; text-decoration: none;">CelestiArcana.com</a>
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
      subject: 'Welcome to CelestiArcana - Your Journey Begins! 🔮',
      htmlContent: emailWrapper(
        `
        <h2 style="margin: 0 0 20px 0; font-size: 24px; color: #c4b5fd;">
          Welcome, {{params.username}}!
        </h2>
        <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #e2e8f0;">
          The stars have aligned to welcome you to CelestiArcana. Your mystical journey begins now with <strong style="color: #fbbf24;">10 free credits</strong> to explore the ancient wisdom of Tarot.
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
      subject: 'Bienvenue sur CelestiArcana - Votre Voyage Commence! 🔮',
      htmlContent: emailWrapper(
        `
        <h2 style="margin: 0 0 20px 0; font-size: 24px; color: #c4b5fd;">
          Bienvenue, {{params.username}}!
        </h2>
        <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #e2e8f0;">
          Les étoiles se sont alignées pour vous accueillir sur CelestiArcana. Votre voyage mystique commence maintenant avec <strong style="color: #fbbf24;">10 crédits gratuits</strong> pour explorer la sagesse ancienne du Tarot.
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
      subject: 'Your CelestiArcana Credits are Running Low 🔮',
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
      subject: 'Vos Crédits CelestiArcana sont Presque Épuisés 🔮',
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

  REFERRAL_INVITE: {
    en: {
      subject: "Your friend {{params.senderName}} thinks you'd love CelestiArcana! 🔮",
      htmlContent: emailWrapper(
        `
        <h2 style="margin: 0 0 20px 0; font-size: 24px; color: #c4b5fd; text-align: center;">
          You've Been Invited!
        </h2>
        <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #e2e8f0;">
          Your friend <strong style="color: #fbbf24;">{{params.senderName}}</strong> thought you'd enjoy CelestiArcana — an AI-powered tarot reading experience that blends ancient wisdom with modern insight.
        </p>
        <div style="background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center;">
          <p style="margin: 0 0 10px 0; font-size: 14px; color: #94a3b8;">Your personal invitation code</p>
          <p style="margin: 0; font-size: 28px; font-weight: 700; color: #fbbf24; letter-spacing: 4px;">{{params.referralCode}}</p>
          <p style="margin: 10px 0 0 0; font-size: 14px; color: #a78bfa;">Sign up and enter this code to get <strong>5 free credits</strong></p>
        </div>
        <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #94a3b8; text-align: center;">
          Use your credits for personalized tarot readings, daily horoscopes, and more.
        </p>
        <div style="text-align: center; margin-top: 30px;">
          <a href="{{params.signupUrl}}" style="display: inline-block; background: linear-gradient(135deg, #fbbf24 0%, #a855f7 100%); color: #1e1b4b; font-weight: 600; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-size: 16px;">
            Join CelestiArcana →
          </a>
        </div>
      `,
        'en'
      ),
    },
    fr: {
      subject: 'Votre ami(e) {{params.senderName}} pense que CelestiArcana vous plaira ! 🔮',
      htmlContent: emailWrapper(
        `
        <h2 style="margin: 0 0 20px 0; font-size: 24px; color: #c4b5fd; text-align: center;">
          Vous Êtes Invité(e) !
        </h2>
        <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #e2e8f0;">
          Votre ami(e) <strong style="color: #fbbf24;">{{params.senderName}}</strong> pense que CelestiArcana vous plaira — une expérience de lecture de tarot alimentée par l'IA qui mêle sagesse ancienne et vision moderne.
        </p>
        <div style="background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center;">
          <p style="margin: 0 0 10px 0; font-size: 14px; color: #94a3b8;">Votre code d'invitation personnel</p>
          <p style="margin: 0; font-size: 28px; font-weight: 700; color: #fbbf24; letter-spacing: 4px;">{{params.referralCode}}</p>
          <p style="margin: 10px 0 0 0; font-size: 14px; color: #a78bfa;">Inscrivez-vous et entrez ce code pour obtenir <strong>5 crédits gratuits</strong></p>
        </div>
        <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #94a3b8; text-align: center;">
          Utilisez vos crédits pour des lectures de tarot personnalisées, des horoscopes quotidiens et plus encore.
        </p>
        <div style="text-align: center; margin-top: 30px;">
          <a href="{{params.signupUrl}}" style="display: inline-block; background: linear-gradient(135deg, #fbbf24 0%, #a855f7 100%); color: #1e1b4b; font-weight: 600; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-size: 16px;">
            Rejoindre CelestiArcana →
          </a>
        </div>
      `,
        'fr'
      ),
    },
  },
  REFERRAL_REDEEMED: {
    en: {
      subject: 'Great news — your referral code was just used! 🎉',
      htmlContent: emailWrapper(
        `
        <div style="text-align: center; margin-bottom: 25px;">
          <div style="display: inline-block; background: linear-gradient(135deg, #fbbf24 0%, #a855f7 100%); border-radius: 50%; padding: 15px;">
            <span style="font-size: 32px;">🎁</span>
          </div>
        </div>
        <h2 style="margin: 0 0 20px 0; font-size: 24px; color: #c4b5fd; text-align: center;">
          Your Referral Code Was Redeemed!
        </h2>
        <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #e2e8f0; text-align: center;">
          Hey {{params.referrerName}}, your friend <strong style="color: #fbbf24;">{{params.redeemerName}}</strong> just used your referral code to join CelestiArcana!
        </p>
        <div style="background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center;">
          <p style="margin: 0 0 10px 0; font-size: 14px; color: #94a3b8;">You've earned</p>
          <p style="margin: 0; font-size: 42px; font-weight: 700; color: #fbbf24;">+{{params.credits}}</p>
          <p style="margin: 5px 0 0 0; font-size: 16px; color: #22c55e; font-weight: 600;">bonus credits</p>
        </div>
        <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #94a3b8; text-align: center;">
          Keep sharing your code to earn more free credits with every friend who joins.
        </p>
        <div style="text-align: center; margin-top: 30px;">
          <a href="{{params.siteUrl}}" style="display: inline-block; background: linear-gradient(135deg, #fbbf24 0%, #a855f7 100%); color: #1e1b4b; font-weight: 600; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-size: 16px;">
            Visit CelestiArcana →
          </a>
        </div>
      `,
        'en'
      ),
    },
    fr: {
      subject: "Bonne nouvelle — votre code de parrainage vient d'être utilisé ! 🎉",
      htmlContent: emailWrapper(
        `
        <div style="text-align: center; margin-bottom: 25px;">
          <div style="display: inline-block; background: linear-gradient(135deg, #fbbf24 0%, #a855f7 100%); border-radius: 50%; padding: 15px;">
            <span style="font-size: 32px;">🎁</span>
          </div>
        </div>
        <h2 style="margin: 0 0 20px 0; font-size: 24px; color: #c4b5fd; text-align: center;">
          Votre Code de Parrainage a Été Utilisé !
        </h2>
        <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #e2e8f0; text-align: center;">
          Hey {{params.referrerName}}, votre ami(e) <strong style="color: #fbbf24;">{{params.redeemerName}}</strong> vient d'utiliser votre code de parrainage pour rejoindre CelestiArcana !
        </p>
        <div style="background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center;">
          <p style="margin: 0 0 10px 0; font-size: 14px; color: #94a3b8;">Vous avez gagné</p>
          <p style="margin: 0; font-size: 42px; font-weight: 700; color: #fbbf24;">+{{params.credits}}</p>
          <p style="margin: 5px 0 0 0; font-size: 16px; color: #22c55e; font-weight: 600;">crédits bonus</p>
        </div>
        <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #94a3b8; text-align: center;">
          Continuez à partager votre code pour gagner plus de crédits gratuits avec chaque ami qui s'inscrit.
        </p>
        <div style="text-align: center; margin-top: 30px;">
          <a href="{{params.siteUrl}}" style="display: inline-block; background: linear-gradient(135deg, #fbbf24 0%, #a855f7 100%); color: #1e1b4b; font-weight: 600; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-size: 16px;">
            Visiter CelestiArcana →
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
  replyTo?: { email: string; name?: string };
}

/**
 * Send a transactional email
 */
export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  try {
    const sendSmtpEmail = new Brevo.SendSmtpEmail();

    sendSmtpEmail.sender = {
      name: 'CelestiArcana',
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

    if (options.replyTo) {
      sendSmtpEmail.replyTo = {
        email: options.replyTo.email,
        name: options.replyTo.name || options.replyTo.email,
      };
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
      siteUrl: process.env.FRONTEND_URL || 'https://celestiarcana.com',
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
      siteUrl: process.env.FRONTEND_URL || 'https://celestiarcana.com',
    },
  });
}

/**
 * Send referral invitation email
 */
export async function sendReferralInviteEmail(
  recipientEmail: string,
  friendName: string,
  senderName: string,
  referralCode: string,
  language: 'en' | 'fr' = 'en'
): Promise<boolean> {
  const template = TEMPLATES.REFERRAL_INVITE[language];
  const siteUrl = process.env.FRONTEND_URL || 'https://celestiarcana.com';
  const signupUrl = `${siteUrl}/sign-up?ref=${referralCode}`;

  return sendEmail({
    to: recipientEmail,
    toName: friendName || recipientEmail,
    subject: template.subject.replace('{{params.senderName}}', senderName),
    htmlContent: template.htmlContent,
    params: {
      senderName,
      referralCode,
      signupUrl,
      siteUrl,
      unsubscribeUrl: `${siteUrl}/unsubscribe`,
    },
  });
}

/**
 * Notify the referrer that their code was redeemed
 */
export async function sendReferralRedeemedEmail(
  referrerEmail: string,
  referrerName: string,
  redeemerName: string,
  creditsAwarded: number,
  language: 'en' | 'fr' = 'en'
): Promise<boolean> {
  const template = TEMPLATES.REFERRAL_REDEEMED[language];
  const siteUrl = process.env.FRONTEND_URL || 'https://celestiarcana.com';

  return sendEmail({
    to: referrerEmail,
    toName: referrerName,
    subject: template.subject,
    htmlContent: template.htmlContent,
    params: {
      referrerName,
      redeemerName,
      credits: creditsAwarded.toString(),
      siteUrl,
      unsubscribeUrl: `${siteUrl}/unsubscribe`,
    },
  });
}

/**
 * Send contact form submission to admin
 */
export async function sendContactFormEmail(
  senderEmail: string,
  senderName: string,
  subject: string,
  message: string,
  phone?: string,
  language: 'en' | 'fr' = 'en'
): Promise<boolean> {
  const timestamp = new Date().toLocaleString(language === 'fr' ? 'fr-FR' : 'en-GB', {
    dateStyle: 'full',
    timeStyle: 'short',
  });

  const htmlContent = emailWrapper(
    `
    <h2 style="margin: 0 0 20px 0; font-size: 24px; color: #c4b5fd;">
      New Contact Form Message
    </h2>
    <div style="background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 12px; padding: 20px; margin: 0 0 20px 0;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td style="padding: 6px 0; color: #94a3b8; font-size: 13px; width: 80px; vertical-align: top;">Name</td>
          <td style="padding: 6px 0; color: #e2e8f0; font-size: 14px;">${senderName}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #94a3b8; font-size: 13px; vertical-align: top;">Email</td>
          <td style="padding: 6px 0; color: #e2e8f0; font-size: 14px;"><a href="mailto:${senderEmail}" style="color: #a78bfa; text-decoration: none;">${senderEmail}</a></td>
        </tr>
        ${
          phone
            ? `<tr>
          <td style="padding: 6px 0; color: #94a3b8; font-size: 13px; vertical-align: top;">Phone</td>
          <td style="padding: 6px 0; color: #e2e8f0; font-size: 14px;">${phone}</td>
        </tr>`
            : ''
        }
        <tr>
          <td style="padding: 6px 0; color: #94a3b8; font-size: 13px; vertical-align: top;">Subject</td>
          <td style="padding: 6px 0; color: #e2e8f0; font-size: 14px;">${subject}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #94a3b8; font-size: 13px; vertical-align: top;">Sent</td>
          <td style="padding: 6px 0; color: #e2e8f0; font-size: 14px;">${timestamp}</td>
        </tr>
      </table>
    </div>
    <div style="background: rgba(0, 0, 0, 0.2); border-radius: 12px; padding: 20px; margin: 0 0 20px 0;">
      <p style="margin: 0 0 8px 0; font-size: 13px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Message</p>
      <p style="margin: 0; font-size: 15px; line-height: 1.7; color: #e2e8f0; white-space: pre-wrap;">${message}</p>
    </div>
    <p style="margin: 0; font-size: 12px; color: #64748b; text-align: center;">
      Reply directly to this email to respond to the sender.
    </p>
    `,
    'en'
  );

  return sendEmail({
    to: 'contact@celestiarcana.com',
    toName: 'CelestiArcana',
    subject: `[CelestiArcana Contact] ${subject} - from ${senderName}`,
    htmlContent,
    replyTo: { email: senderEmail, name: senderName },
    params: {
      siteUrl: process.env.FRONTEND_URL || 'https://celestiarcana.com',
      unsubscribeUrl: `${process.env.FRONTEND_URL}/unsubscribe`,
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
  sendReferralInviteEmail,
  sendReferralRedeemedEmail,
  sendContactFormEmail,
  upsertContact,
  subscribeToNewsletter,
  unsubscribeContact,
};
