import { Language } from '../types';

type TranslationKey = keyof typeof translations.en;

const translations = {
  en: {
    // Auth
    'auth.welcomeBack': 'Welcome Back',
    'auth.beginJourney': 'Begin Your Journey',
    'auth.recoverAccount': 'Recover Account',
    'auth.cardsWaiting': 'The cards have been waiting for you.',
    'auth.createAccountDesc': 'Create an account to track your destiny.',
    'auth.chooseUsername': 'Choose a Username',
    'auth.emailAddress': 'Email Address',
    'auth.password': 'Password',
    'auth.confirmPassword': 'Confirm Password',
    'auth.referralCode': 'Referral Code (Optional)',
    'auth.rememberMe': 'Remember me',
    'auth.enterPortal': 'Enter Portal',
    'auth.createAccount': 'Create Account',
    'auth.sendResetLink': 'Send Reset Link',
    'auth.newHere': 'New here?',
    'auth.alreadyInitialized': 'Already initialized?',
    'auth.signIn': 'Sign In',
    'auth.lostKey': 'Lost your key?',
    'auth.passwordsNoMatch': 'Passwords do not match',
    'auth.passwordMinLength': 'Password must be at least 8 characters',
    'auth.resetLinkSent': 'Password reset link sent to your email!',

    // Reading
    'reading.askQuestion': 'What question weighs on your mind?',
    'reading.questionPlaceholder': 'Enter your question for the oracle...',
    'reading.generalGuidance': 'General Guidance',
    'reading.interpretationStyle': 'Interpretation Style',
    'reading.basicInterpretation': 'Basic interpretation included',
    'reading.advancedOptions': 'Advanced Options',
    'reading.hideAdvanced': 'Hide Advanced',
    'reading.totalCost': 'Total Cost',
    'reading.credits': 'credits',
    'reading.free': 'Free',
    'reading.consultOracle': 'Consult the Oracle',
    'reading.insufficientCredits': 'Insufficient credits',
    'reading.shuffling': 'Shuffling the cosmic energies...',
    'reading.drawCard': 'Draw Card',
    'reading.cardsDrawn': 'cards drawn',
    'reading.revealReading': 'Reveal Reading',
    'reading.newReading': 'New Reading',
    'reading.askFollowUp': 'Ask the Oracle a follow-up question...',
    'reading.send': 'Send',

    // Profile
    'profile.title': 'Your Profile',
    'profile.credits': 'Credits',
    'profile.loginStreak': 'Login Streak',
    'profile.days': 'days',
    'profile.referralCode': 'Your Referral Code',
    'profile.copied': 'Copied!',
    'profile.logout': 'Logout',
    'profile.verifyEmail': 'Verify Email',
    'profile.emailVerified': 'Email Verified',

    // General
    'general.loading': 'Loading...',
    'general.error': 'An error occurred',
    'general.retry': 'Retry',
    'general.cancel': 'Cancel',
    'general.save': 'Save',
    'general.edit': 'Edit',
  },
  fr: {
    // Auth
    'auth.welcomeBack': 'Bon Retour',
    'auth.beginJourney': 'Commencez Votre Voyage',
    'auth.recoverAccount': 'Récupération',
    'auth.cardsWaiting': 'Les cartes vous attendaient.',
    'auth.createAccountDesc': 'Créez un compte pour suivre votre destin.',
    'auth.chooseUsername': "Choisissez un Nom d'utilisateur",
    'auth.emailAddress': 'Adresse Email',
    'auth.password': 'Mot de passe',
    'auth.confirmPassword': 'Confirmer le mot de passe',
    'auth.referralCode': 'Code de parrainage (Optionnel)',
    'auth.rememberMe': 'Se souvenir de moi',
    'auth.enterPortal': 'Entrer',
    'auth.createAccount': 'Créer un Compte',
    'auth.sendResetLink': 'Envoyer le lien',
    'auth.newHere': 'Nouveau ici ?',
    'auth.alreadyInitialized': 'Déjà initié ?',
    'auth.signIn': 'Se Connecter',
    'auth.lostKey': 'Clé perdue ?',
    'auth.passwordsNoMatch': 'Les mots de passe ne correspondent pas',
    'auth.passwordMinLength': 'Le mot de passe doit contenir au moins 8 caractères',
    'auth.resetLinkSent': 'Lien de réinitialisation envoyé à votre email !',

    // Reading
    'reading.askQuestion': 'Quelle question pèse sur votre esprit ?',
    'reading.questionPlaceholder': "Entrez votre question pour l'oracle...",
    'reading.generalGuidance': 'Guidance Générale',
    'reading.interpretationStyle': "Style d'Interprétation",
    'reading.basicInterpretation': 'Interprétation de base incluse',
    'reading.advancedOptions': 'Options Avancées',
    'reading.hideAdvanced': 'Masquer Avancées',
    'reading.totalCost': 'Coût Total',
    'reading.credits': 'crédits',
    'reading.free': 'Gratuit',
    'reading.consultOracle': "Consulter l'Oracle",
    'reading.insufficientCredits': 'Crédits insuffisants',
    'reading.shuffling': 'Mélange des énergies cosmiques...',
    'reading.drawCard': 'Tirer une Carte',
    'reading.cardsDrawn': 'cartes tirées',
    'reading.revealReading': 'Révéler la Lecture',
    'reading.newReading': 'Nouvelle Lecture',
    'reading.askFollowUp': "Posez une question de suivi à l'Oracle...",
    'reading.send': 'Envoyer',

    // Profile
    'profile.title': 'Votre Profil',
    'profile.credits': 'Crédits',
    'profile.loginStreak': 'Série de Connexions',
    'profile.days': 'jours',
    'profile.referralCode': 'Votre Code de Parrainage',
    'profile.copied': 'Copié !',
    'profile.logout': 'Déconnexion',
    'profile.verifyEmail': "Vérifier l'Email",
    'profile.emailVerified': 'Email Vérifié',

    // General
    'general.loading': 'Chargement...',
    'general.error': 'Une erreur est survenue',
    'general.retry': 'Réessayer',
    'general.cancel': 'Annuler',
    'general.save': 'Sauvegarder',
    'general.edit': 'Modifier',
  }
} as const;

/**
 * Get a translated string by key
 */
export function t(key: TranslationKey, language: Language): string {
  return translations[language][key] || key;
}

/**
 * Create a translation function bound to a specific language
 */
export function createTranslator(language: Language) {
  return (key: TranslationKey) => t(key, language);
}

export { translations };
export type { TranslationKey };
