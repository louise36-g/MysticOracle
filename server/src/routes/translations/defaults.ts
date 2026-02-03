/**
 * Default Translations
 * This file contains all default translation strings for EN and FR
 */

export interface TranslationValue {
  en: string;
  fr: string;
}

export const defaultTranslations: Record<string, TranslationValue> = {
  // Navigation
  'nav.home': { en: 'Home', fr: 'Accueil' },
  'nav.reading': { en: 'Reading', fr: 'Lecture' },
  'nav.horoscope': { en: 'Horoscope', fr: 'Horoscope' },
  'nav.profile': { en: 'Profile', fr: 'Profil' },
  'nav.admin': { en: 'Admin', fr: 'Admin' },
  'nav.credits': { en: 'credits', fr: 'crédits' },
  'nav.signIn': { en: 'Sign In', fr: 'Connexion' },
  'nav.signOut': { en: 'Sign Out', fr: 'Déconnexion' },

  // Home
  'home.title': { en: 'MysticOracle', fr: 'MysticOracle' },
  'home.subtitle': { en: 'Discover Your Destiny', fr: 'Découvrez Votre Destin' },
  'home.description': {
    en: 'Unveil the secrets of your destiny through the ancient wisdom of Tarot, guided by artificial intelligence.',
    fr: "Dévoilez les secrets de votre destin grâce à la sagesse ancienne du Tarot, guidée par l'intelligence artificielle.",
  },
  'home.startReading': { en: 'Start Your Reading', fr: 'Commencer Votre Lecture' },

  // Tarot
  'tarot.selectSpread': { en: 'Select Your Spread', fr: 'Choisissez Votre Tirage' },
  'tarot.singleCard': { en: 'Single Card', fr: 'Une Carte' },
  'tarot.threeCard': { en: 'Three Card Spread', fr: 'Tirage Trois Cartes' },
  'tarot.celticCross': { en: 'Celtic Cross', fr: 'Croix Celtique' },
  'tarot.shuffleDeck': { en: 'Shuffle the Deck', fr: 'Mélanger les Cartes' },
  'tarot.drawCards': { en: 'Draw Cards', fr: 'Tirer les Cartes' },
  'tarot.getInterpretation': { en: 'Get Interpretation', fr: "Obtenir l'Interprétation" },
  'tarot.askFollowUp': {
    en: 'Ask a follow-up question...',
    fr: 'Posez une question de suivi...',
  },
  'tarot.newReading': { en: 'New Reading', fr: 'Nouvelle Lecture' },
  'tarot.cost': { en: 'Cost', fr: 'Coût' },
  'tarot.credit': { en: 'credit', fr: 'crédit' },
  'tarot.credits': { en: 'credits', fr: 'crédits' },

  // Horoscope signs
  'horoscope.title': { en: 'Daily Horoscope', fr: 'Horoscope Quotidien' },
  'horoscope.selectSign': { en: 'Select your zodiac sign', fr: 'Sélectionnez votre signe' },
  'horoscope.aries': { en: 'Aries', fr: 'Bélier' },
  'horoscope.taurus': { en: 'Taurus', fr: 'Taureau' },
  'horoscope.gemini': { en: 'Gemini', fr: 'Gémeaux' },
  'horoscope.cancer': { en: 'Cancer', fr: 'Cancer' },
  'horoscope.leo': { en: 'Leo', fr: 'Lion' },
  'horoscope.virgo': { en: 'Virgo', fr: 'Vierge' },
  'horoscope.libra': { en: 'Libra', fr: 'Balance' },
  'horoscope.scorpio': { en: 'Scorpio', fr: 'Scorpion' },
  'horoscope.sagittarius': { en: 'Sagittarius', fr: 'Sagittaire' },
  'horoscope.capricorn': { en: 'Capricorn', fr: 'Capricorne' },
  'horoscope.aquarius': { en: 'Aquarius', fr: 'Verseau' },
  'horoscope.pisces': { en: 'Pisces', fr: 'Poissons' },

  // Horoscope Reading Component
  'horoscope.HoroscopeReading.daily_horoscope': { en: 'Daily Horoscope', fr: 'Horoscope du Jour' },
  'horoscope.HoroscopeReading.ask_the_stars': { en: 'Ask the Stars', fr: 'Interrogez les Étoiles' },
  'horoscope.HoroscopeReading.suggested_questions': {
    en: 'Suggested questions:',
    fr: 'Questions suggérées :',
  },
  'horoscope.HoroscopeReading.you': { en: 'You', fr: 'Vous' },
  'horoscope.HoroscopeReading.the_stars': { en: 'The Stars', fr: 'Les Étoiles' },
  'horoscope.HoroscopeReading.consulting_cosmos': {
    en: 'Consulting the cosmos...',
    fr: 'Consultation du cosmos...',
  },
  'horoscope.HoroscopeReading.choose_another_sign': {
    en: 'Choose another sign',
    fr: 'Choisir un autre signe',
  },
  'horoscope.HoroscopeReading.select_zodiac_sign': {
    en: 'Select Your Zodiac Sign',
    fr: 'Sélectionnez Votre Signe du Zodiaque',
  },
  'horoscope.HoroscopeReading.insufficient_credits_message': {
    en: "You've used your free question for this pair. Each credit unlocks 2 questions - earn more credits through daily logins, achievements, or referrals to continue exploring the stars.",
    fr: 'Vous avez utilisé votre question gratuite pour cette paire. Chaque crédit débloque 2 questions - gagnez plus de crédits grâce aux connexions quotidiennes, aux succès ou aux parrainages pour continuer à explorer les étoiles.',
  },

  // Horoscopes Index Page
  'horoscopes.HoroscopesIndex.title': { en: 'Daily Horoscopes', fr: 'Horoscopes du Jour' },
  'horoscopes.HoroscopesIndex.subtitle': {
    en: 'Select your zodiac sign to discover what the stars have in store for you today.',
    fr: "Sélectionnez votre signe du zodiaque pour découvrir ce que les étoiles vous réservent aujourd'hui.",
  },
  'horoscopes.HoroscopesIndex.fire': { en: 'Fire', fr: 'Feu' },
  'horoscopes.HoroscopesIndex.earth': { en: 'Earth', fr: 'Terre' },
  'horoscopes.HoroscopesIndex.air': { en: 'Air', fr: 'Air' },
  'horoscopes.HoroscopesIndex.water': { en: 'Water', fr: 'Eau' },

  // Horoscope Sign Page
  'horoscopes.HoroscopeSignPage.not_found': { en: 'Sign Not Found', fr: 'Signe Non Trouvé' },
  'horoscopes.HoroscopeSignPage.all_signs': {
    en: 'All Zodiac Signs',
    fr: 'Tous les Signes du Zodiaque',
  },
  'horoscopes.HoroscopeSignPage.ruling': { en: 'Ruling', fr: 'Planète' },
  'horoscopes.HoroscopeSignPage.element': { en: 'Element', fr: 'Élément' },
  'horoscopes.HoroscopeSignPage.ask_the_stars': {
    en: 'Ask the Stars',
    fr: 'Interrogez les Étoiles',
  },
  'horoscopes.HoroscopeSignPage.suggested_questions': {
    en: 'Suggested questions:',
    fr: 'Questions suggérées :',
  },
  'horoscopes.HoroscopeSignPage.you': { en: 'You', fr: 'Vous' },
  'horoscopes.HoroscopeSignPage.the_stars': { en: 'The Stars', fr: 'Les Étoiles' },
  'horoscopes.HoroscopeSignPage.consulting': {
    en: 'Consulting the cosmos...',
    fr: 'Consultation du cosmos...',
  },
  'horoscopes.HoroscopeSignPage.view_all_signs': {
    en: 'View All Zodiac Signs',
    fr: 'Découvrir tous les signes',
  },

  // Profile
  'profile.title': { en: 'Your Profile', fr: 'Votre Profil' },
  'profile.credits': { en: 'Credits', fr: 'Crédits' },
  'profile.readingHistory': { en: 'Reading History', fr: 'Historique des Lectures' },
  'profile.achievements': { en: 'Achievements', fr: 'Réalisations' },
  'profile.settings': { en: 'Settings', fr: 'Paramètres' },
  'profile.dailyBonus': { en: 'Daily Bonus', fr: 'Bonus Quotidien' },
  'profile.claim': { en: 'Claim', fr: 'Réclamer' },
  'profile.claimed': { en: 'Claimed', fr: 'Réclamé' },
  'profile.streak': { en: 'Day Streak', fr: 'Jours Consécutifs' },

  // Credit Shop
  'shop.title': { en: 'Get More Credits', fr: 'Obtenez Plus de Crédits' },
  'shop.popular': { en: 'Popular', fr: 'Populaire' },
  'shop.bestValue': { en: 'Best Value', fr: 'Meilleur Rapport' },
  'shop.buyNow': { en: 'Buy Now', fr: 'Acheter' },
  'shop.securePayment': { en: 'Secure Payment', fr: 'Paiement Sécurisé' },
  'shop.payWithCard': { en: 'Pay with Card', fr: 'Payer par Carte' },
  'shop.payWithPaypal': { en: 'Pay with PayPal', fr: 'Payer avec PayPal' },

  // Common
  'common.loading': { en: 'Loading...', fr: 'Chargement...' },
  'common.error': { en: 'Error', fr: 'Erreur' },
  'common.save': { en: 'Save', fr: 'Sauvegarder' },
  'common.cancel': { en: 'Cancel', fr: 'Annuler' },
  'common.delete': { en: 'Delete', fr: 'Supprimer' },
  'common.edit': { en: 'Edit', fr: 'Modifier' },
  'common.create': { en: 'Create', fr: 'Créer' },
  'common.close': { en: 'Close', fr: 'Fermer' },
  'common.yes': { en: 'Yes', fr: 'Oui' },
  'common.no': { en: 'No', fr: 'Non' },
  'common.refresh': { en: 'Refresh', fr: 'Actualiser' },
  'common.active': { en: 'Active', fr: 'Actif' },
  'common.inactive': { en: 'Inactive', fr: 'Inactif' },
  'common.today': { en: 'Today', fr: "Aujourd'hui" },
  'common.yesterday': { en: 'Yesterday', fr: 'Hier' },
  'common.days_ago': { en: 'days ago', fr: 'il y a' },
  'common.back': { en: 'Back to All Signs', fr: 'Retour à tous les signes' },

  // Footer
  'footer.tagline': {
    en: 'AI-powered tarot readings and horoscopes',
    fr: "Tirages tarot et horoscopes propulsés par l'IA",
  },
  'footer.help': { en: 'Help', fr: 'Aide' },
  'footer.faq': { en: 'FAQ', fr: 'FAQ' },
  'footer.howCreditsWork': { en: 'How Credits Work', fr: 'Comment fonctionnent les crédits' },
  'footer.legal': { en: 'Legal', fr: 'Mentions légales' },
  'footer.privacyPolicy': { en: 'Privacy Policy', fr: 'Politique de confidentialité' },
  'footer.termsOfService': { en: 'Terms of Service', fr: "Conditions d'utilisation" },
  'footer.cookiePolicy': { en: 'Cookie Policy', fr: 'Politique des cookies' },
  'footer.contact': { en: 'Contact', fr: 'Contact' },
  'footer.allRightsReserved': { en: 'All rights reserved.', fr: 'Tous droits réservés.' },
  'footer.disclaimer': {
    en: 'For entertainment purposes only. Not a substitute for professional advice.',
    fr: 'À des fins de divertissement uniquement. Ne remplace pas un avis professionnel.',
  },

  // Transaction Types
  'transaction.type.purchase': { en: 'Purchase', fr: 'Achat' },
  'transaction.type.daily_bonus': { en: 'Daily Bonus', fr: 'Bonus quotidien' },
  'transaction.type.achievement': { en: 'Achievement', fr: 'Succès' },
  'transaction.type.referral': { en: 'Referral', fr: 'Parrainage' },
  'transaction.type.reading': { en: 'Reading', fr: 'Lecture' },
  'transaction.type.question': { en: 'Question', fr: 'Question' },
  'transaction.type.refund': { en: 'Refund', fr: 'Remboursement' },
  'transaction.type.other': { en: 'Other', fr: 'Autre' },

  // Filters
  'filter.type': { en: 'Type', fr: 'Type' },
  'filter.date_range': { en: 'Date Range', fr: 'Période' },
  'filter.all': { en: 'All', fr: 'Tout' },
  'filter.all_time': { en: 'All Time', fr: 'Tout' },
  'filter.purchases': { en: 'Purchases', fr: 'Achats' },
  'filter.bonuses': { en: 'Bonuses', fr: 'Bonus' },
  'filter.readings': { en: 'Readings', fr: 'Lectures' },
  'filter.this_week': { en: 'This Week', fr: 'Cette semaine' },
  'filter.this_month': { en: 'This Month', fr: 'Ce mois' },
  'filter.showing_count': {
    en: 'Showing ${resultCount} of ${totalCount} transactions',
    fr: 'Affichage de ${resultCount} sur ${totalCount} transactions',
  },
  'filter.transactions': { en: 'transactions', fr: 'transactions' },
  'filter.clear_filters': { en: 'Clear filters', fr: 'Effacer les filtres' },

  // Admin
  'admin.title': { en: 'Admin Dashboard', fr: 'Tableau de Bord Admin' },
  'admin.overview': { en: 'Overview', fr: 'Aperçu' },
  'admin.users': { en: 'Users', fr: 'Utilisateurs' },
  'admin.transactions': { en: 'Transactions', fr: 'Transactions' },
  'admin.packages': { en: 'Packages', fr: 'Forfaits' },
  'admin.emails': { en: 'Emails', fr: 'Emails' },
  'admin.analytics': { en: 'Analytics', fr: 'Analytique' },
  'admin.health': { en: 'Health', fr: 'Santé' },
  'admin.translations': { en: 'Translations', fr: 'Traductions' },
  'admin.settings': { en: 'Settings', fr: 'Paramètres' },

  // Legal
  'legal.privacy': { en: 'Privacy Policy', fr: 'Politique de Confidentialité' },
  'legal.terms': { en: 'Terms of Service', fr: "Conditions d'Utilisation" },
  'legal.cookies': { en: 'Cookie Policy', fr: 'Politique des Cookies' },
  'legal.contact': { en: 'Contact', fr: 'Contact' },

  // Features
  'features.aiPowered': { en: 'AI Powered Insights', fr: 'Insights par IA' },
  'features.aiPoweredDesc': {
    en: 'Deep, context-aware interpretations powered by AI.',
    fr: "Interprétations profondes et contextuelles alimentées par l'IA.",
  },
  'features.privateSecure': { en: 'Private & Secure', fr: 'Privé & Sécurisé' },
  'features.privateSecureDesc': {
    en: 'Your spiritual journey is personal. We respect your privacy.',
    fr: 'Votre voyage spirituel est personnel. Nous respectons votre vie privée.',
  },
  'features.instantClarity': { en: 'Instant Clarity', fr: 'Clarté Instantanée' },
  'features.instantClarityDesc': {
    en: "Get answers to life's pressing questions in seconds.",
    fr: 'Obtenez des réponses à vos questions en quelques secondes.',
  },

  // Errors & Messages
  'error.insufficientCredits': { en: 'Insufficient credits', fr: 'Crédits insuffisants' },
  'error.notEnoughCredits': { en: 'Not Enough Credits', fr: 'Crédits Insuffisants' },
  'error.lowCredits': { en: 'Running Low on Credits', fr: 'Crédits Bientôt Épuisés' },
  'error.requestFailed': { en: 'Request failed', fr: 'La requête a échoué' },
  'message.buyCredits': { en: 'Buy Credits', fr: 'Acheter des Crédits' },
  'message.later': { en: 'Later', fr: 'Plus Tard' },

  // Reflection
  'reflection.header': {
    en: 'How does this reading resonate with you?',
    fr: 'Comment cette lecture vous parle-t-elle?',
  },
  'reflection.tooltip': {
    en: 'Your reflections help personalize future readings',
    fr: 'Vos réflexions aident à personnaliser les lectures futures',
  },
  'reflection.placeholder': {
    en: 'Share your thoughts, feelings, or insights about this reading...',
    fr: 'Partagez vos pensées, sentiments ou intuitions sur cette lecture...',
  },
  'reflection.save': { en: 'Save Reflection', fr: 'Enregistrer' },
  'reflection.skip': { en: 'Skip', fr: 'Passer' },
  'reflection.saved': { en: 'Reflection saved', fr: 'Réflexion enregistrée' },
  'reflection.saving': { en: 'Saving...', fr: 'Sauvegarde...' },
  'reflection.characters': { en: 'characters', fr: 'caractères' },

  // Welcome Modal
  'welcome.step1.title': { en: 'Welcome to MysticOracle', fr: 'Bienvenue sur MysticOracle' },
  'welcome.step1.description': {
    en: 'Your personal guide to tarot wisdom. Each reading is crafted uniquely for you, blending ancient symbolism with modern insight.',
    fr: 'Votre guide personnel vers la sagesse du tarot. Chaque tirage est créé uniquement pour vous, mêlant symbolisme ancien et intuition moderne.',
  },
  'welcome.step2.title': { en: 'How It Works', fr: 'Comment ça marche' },
  'welcome.step2.point1': {
    en: 'Ask a question (or let the cards guide you)',
    fr: 'Posez une question (ou laissez les cartes vous guider)',
  },
  'welcome.step2.point2': {
    en: 'Choose your spread — from a single card to a full Celtic Cross',
    fr: "Choisissez votre tirage — d'une seule carte à une Croix Celtique complète",
  },
  'welcome.step2.point3': {
    en: 'Receive a personalized interpretation that speaks to your situation',
    fr: 'Recevez une interprétation personnalisée qui parle à votre situation',
  },
  'welcome.step3.title': { en: 'Your Credits', fr: 'Vos Crédits' },
  'welcome.step3.description': {
    en: 'You have 3 free credits to start. A single card reading costs 1 credit, larger spreads cost more. Earn extra credits through daily bonuses and referrals — or purchase more anytime.',
    fr: 'Vous avez 3 crédits gratuits pour commencer. Un tirage à une carte coûte 1 crédit, les tirages plus grands coûtent plus. Gagnez des crédits supplémentaires grâce aux bonus quotidiens et aux parrainages — ou achetez-en à tout moment.',
  },
  'welcome.step3.purchaseNow': { en: 'Purchase now', fr: 'Acheter maintenant' },
  'welcome.step3.learnMore': { en: 'Learn more', fr: 'En savoir plus' },
  'welcome.skip': { en: 'Skip', fr: 'Passer' },
  'welcome.next': { en: 'Next', fr: 'Suivant' },
  'welcome.startReading': {
    en: 'Start Your First Reading',
    fr: 'Commencer Votre Première Lecture',
  },

  // How Credits Work Page
  'credits.hero.title': { en: 'How Credits Work', fr: 'Comment fonctionnent les crédits' },
  'credits.hero.subtitle': {
    en: 'Simple, transparent, no subscriptions',
    fr: 'Simple, transparent, sans abonnement',
  },

  'credits.whatAre.title': { en: 'What Are Credits?', fr: 'Que sont les crédits ?' },
  'credits.whatAre.description': {
    en: "Credits are your currency for tarot readings on MysticOracle. There are no monthly fees or subscriptions — you simply purchase credits when you need them, and they never expire. Each reading type has a fixed cost, so you always know exactly what you're spending.",
    fr: "Les crédits sont votre monnaie pour les lectures de tarot sur MysticOracle. Il n'y a pas de frais mensuels ni d'abonnements — vous achetez simplement des crédits quand vous en avez besoin, et ils n'expirent jamais. Chaque type de lecture a un coût fixe, vous savez donc toujours exactement ce que vous dépensez.",
  },

  'credits.costs.title': { en: 'Reading Costs', fr: 'Coûts des lectures' },
  'credits.costs.readingType': { en: 'Reading Type', fr: 'Type de lecture' },
  'credits.costs.credits': { en: 'Credits', fr: 'Crédits' },
  'credits.costs.followUp': { en: 'Follow-up Question', fr: 'Question de suivi' },
  'credits.costs.note': {
    en: 'More complex spreads with additional cards provide deeper insights and cost more credits.',
    fr: 'Les tirages plus complexes avec des cartes supplémentaires offrent des aperçus plus profonds et coûtent plus de crédits.',
  },
  'credits.credit': { en: 'credit', fr: 'crédit' },
  'credits.credits': { en: 'credits', fr: 'crédits' },

  'credits.earn.title': { en: 'Earning Free Credits', fr: 'Gagner des crédits gratuits' },
  'credits.earn.daily.title': { en: 'Daily Bonus', fr: 'Bonus quotidien' },
  'credits.earn.daily.description': {
    en: 'Visit each day to claim free credits. Build a streak for bigger rewards — 7-day streaks unlock bonus credits!',
    fr: 'Visitez chaque jour pour réclamer des crédits gratuits. Construisez une série pour de plus grandes récompenses — les séries de 7 jours débloquent des crédits bonus !',
  },
  'credits.earn.referrals.title': { en: 'Referrals', fr: 'Parrainages' },
  'credits.earn.referrals.description': {
    en: 'Share your referral link with friends. When they sign up and make their first reading, you both earn credits.',
    fr: "Partagez votre lien de parrainage avec des amis. Quand ils s'inscrivent et font leur première lecture, vous gagnez tous les deux des crédits.",
  },
  'credits.earn.achievements.title': { en: 'Achievements', fr: 'Réussites' },
  'credits.earn.achievements.description': {
    en: 'Complete milestones like your first reading, trying all spread types, or maintaining streaks to unlock bonus credits.',
    fr: 'Complétez des étapes comme votre première lecture, essayer tous les types de tirages, ou maintenir des séries pour débloquer des crédits bonus.',
  },

  'credits.buy.title': { en: 'Buying Credits', fr: 'Acheter des crédits' },
  'credits.buy.description': {
    en: 'Need more credits? Purchase them instantly through our secure checkout. We offer several packages to suit your needs, with bigger packages offering better value.',
    fr: 'Besoin de plus de crédits ? Achetez-les instantanément via notre paiement sécurisé. Nous proposons plusieurs forfaits adaptés à vos besoins, avec de meilleurs prix pour les gros forfaits.',
  },
  'credits.buy.stripe': {
    en: 'Credit/Debit Cards (Stripe)',
    fr: 'Cartes de crédit/débit (Stripe)',
  },
  'credits.buy.paypal': { en: 'PayPal', fr: 'PayPal' },
  'credits.buy.button': { en: 'View Credit Packages', fr: 'Voir les forfaits' },

  'credits.cta.title': { en: 'Ready to begin?', fr: 'Prêt à commencer ?' },
  'credits.cta.description': {
    en: 'Start your journey with a tarot reading and discover what the cards reveal for you.',
    fr: 'Commencez votre voyage avec une lecture de tarot et découvrez ce que les cartes révèlent pour vous.',
  },
  'credits.cta.button': { en: 'Start a Reading', fr: 'Commencer une lecture' },

  // FAQ Page
  'faq.hero.title': { en: 'Frequently Asked Questions', fr: 'Questions Fréquentes' },
  'faq.hero.subtitle': {
    en: 'Everything you need to know about MysticOracle',
    fr: 'Tout ce que vous devez savoir sur MysticOracle',
  },

  'faq.disclaimer.title': { en: 'Important Notice', fr: 'Avis Important' },
  'faq.disclaimer.text': {
    en: 'MysticOracle is for entertainment and personal reflection purposes only. Tarot readings provided here are generated by artificial intelligence and should not be considered professional advice (medical, legal, financial, or otherwise). The interpretations offer symbolic guidance and perspective, not predictions of the future. We encourage you to use these readings as a tool for self-reflection, not as a basis for important life decisions. Always consult qualified professionals for serious matters.',
    fr: "MysticOracle est destiné uniquement au divertissement et à la réflexion personnelle. Les lectures de tarot fournies ici sont générées par intelligence artificielle et ne doivent pas être considérées comme des conseils professionnels (médicaux, juridiques, financiers ou autres). Les interprétations offrent une guidance symbolique et une perspective, pas des prédictions de l'avenir. Nous vous encourageons à utiliser ces lectures comme un outil de réflexion personnelle, pas comme base pour des décisions importantes. Consultez toujours des professionnels qualifiés pour les questions sérieuses.",
  },

  'faq.gettingStarted.title': { en: 'Getting Started', fr: 'Pour Commencer' },
  'faq.gettingStarted.q1': { en: 'What is MysticOracle?', fr: "Qu'est-ce que MysticOracle ?" },
  'faq.gettingStarted.a1': {
    en: "MysticOracle is an AI-powered tarot reading application. Each reading combines traditional tarot symbolism with personalized interpretation based on your question and the cards drawn. It's designed to offer guidance, perspective, and moments of reflection through the rich imagery of tarot.",
    fr: "MysticOracle est une application de lecture de tarot alimentée par l'IA. Chaque lecture combine le symbolisme traditionnel du tarot avec une interprétation personnalisée basée sur votre question et les cartes tirées. Elle est conçue pour offrir guidance, perspective et moments de réflexion à travers l'imagerie riche du tarot.",
  },
  'faq.gettingStarted.q2': { en: 'Is this real tarot?', fr: 'Est-ce du vrai tarot ?' },
  'faq.gettingStarted.a2': {
    en: 'We use authentic tarot card meanings, traditional spreads, and genuine symbolism from the Rider-Waite-Smith tradition. The interpretations are generated by AI, crafted to be thoughtful and relevant to your situation. Think of it as tarot wisdom made accessible — the cards are real, the meanings are authentic, and the technology helps deliver personalized insights.',
    fr: "Nous utilisons des significations authentiques de cartes de tarot, des tirages traditionnels et un symbolisme genuein de la tradition Rider-Waite-Smith. Les interprétations sont générées par l'IA, conçues pour être réfléchies et pertinentes pour votre situation. Considérez-le comme la sagesse du tarot rendue accessible — les cartes sont réelles, les significations sont authentiques, et la technologie aide à fournir des aperçus personnalisés.",
  },
  'faq.gettingStarted.q3': {
    en: 'Do I need to know tarot to use this?',
    fr: 'Dois-je connaître le tarot pour utiliser ceci ?',
  },
  'faq.gettingStarted.a3': {
    en: "Not at all. MysticOracle is designed for everyone, from complete beginners to experienced readers. Simply ask your question and we'll handle the rest. Each reading explains the cards drawn, their traditional meanings, and how they relate to your specific situation.",
    fr: 'Pas du tout. MysticOracle est conçu pour tout le monde, des débutants complets aux lecteurs expérimentés. Posez simplement votre question et nous nous occupons du reste. Chaque lecture explique les cartes tirées, leurs significations traditionnelles et comment elles se rapportent à votre situation spécifique.',
  },
  'faq.gettingStarted.q4': {
    en: 'Are the readings accurate predictions?',
    fr: 'Les lectures sont-elles des prédictions précises ?',
  },
  'faq.gettingStarted.a4': {
    en: "MysticOracle does not predict the future. Tarot is a tool for reflection and insight, not divination. Our AI-generated interpretations offer symbolic guidance based on traditional card meanings. They're meant to help you think about your situation from new angles, not to tell you what will happen. The value lies in the perspective and self-reflection they inspire.",
    fr: "MysticOracle ne prédit pas l'avenir. Le tarot est un outil de réflexion et d'insight, pas de divination. Nos interprétations générées par l'IA offrent une guidance symbolique basée sur les significations traditionnelles des cartes. Elles sont destinées à vous aider à réfléchir à votre situation sous de nouveaux angles, pas à vous dire ce qui va arriver. La valeur réside dans la perspective et l'auto-réflexion qu'elles inspirent.",
  },
  'faq.gettingStarted.q5': {
    en: 'Are the interpretations generated by AI?',
    fr: "Les interprétations sont-elles générées par l'IA ?",
  },
  'faq.gettingStarted.a5': {
    en: "Yes. All readings are generated by artificial intelligence. While we've trained our system on authentic tarot meanings and interpretation techniques, AI can make mistakes or produce responses that don't fully resonate with your situation. Use the readings as one perspective among many, and trust your own intuition above all.",
    fr: "Oui. Toutes les lectures sont générées par intelligence artificielle. Bien que nous ayons formé notre système sur des significations de tarot authentiques et des techniques d'interprétation, l'IA peut faire des erreurs ou produire des réponses qui ne résonnent pas complètement avec votre situation. Utilisez les lectures comme une perspective parmi d'autres, et faites confiance à votre propre intuition avant tout.",
  },

  'faq.credits.title': { en: 'Credits & Payment', fr: 'Crédits & Paiement' },
  'faq.credits.q1': { en: 'How do credits work?', fr: 'Comment fonctionnent les crédits ?' },
  'faq.credits.a1': {
    en: 'Credits are how you pay for readings. There are no subscriptions or monthly fees — you simply buy credits when you need them, or earn them for free through daily bonuses and referrals.',
    fr: "Les crédits sont la façon dont vous payez pour les lectures. Il n'y a pas d'abonnements ni de frais mensuels — vous achetez simplement des crédits quand vous en avez besoin, ou vous les gagnez gratuitement grâce aux bonus quotidiens et aux parrainages.",
  },
  'faq.credits.learnMore': {
    en: 'Learn more about credits',
    fr: 'En savoir plus sur les crédits',
  },
  'faq.credits.q2': { en: 'How much do readings cost?', fr: 'Combien coûtent les lectures ?' },
  'faq.credits.seeFullPricing': { en: 'See full pricing', fr: 'Voir tous les tarifs' },
  'faq.credits.q3': { en: 'Do credits expire?', fr: 'Les crédits expirent-ils ?' },
  'faq.credits.a3': {
    en: "No. Your credits never expire. They're yours until you use them, whether that's tomorrow or years from now.",
    fr: "Non. Vos crédits n'expirent jamais. Ils sont à vous jusqu'à ce que vous les utilisiez, que ce soit demain ou dans des années.",
  },
  'faq.credits.q4': {
    en: 'What payment methods do you accept?',
    fr: 'Quels modes de paiement acceptez-vous ?',
  },
  'faq.credits.a4': {
    en: 'We accept credit and debit cards through Stripe (Visa, Mastercard, American Express, and more) as well as PayPal. All payments are processed securely — we never see or store your payment details.',
    fr: 'Nous acceptons les cartes de crédit et de débit via Stripe (Visa, Mastercard, American Express, et plus) ainsi que PayPal. Tous les paiements sont traités de manière sécurisée — nous ne voyons ni ne stockons jamais vos détails de paiement.',
  },
  'faq.credits.q5': { en: 'Can I get a refund?', fr: 'Puis-je obtenir un remboursement ?' },
  'faq.credits.a5': {
    en: "We evaluate refund requests on a case-by-case basis. If you're unhappy with a purchase, please contact us at",
    fr: "Nous évaluons les demandes de remboursement au cas par cas. Si vous n'êtes pas satisfait d'un achat, veuillez nous contacter à",
  },
  'faq.credits.a5b': {
    en: "and we'll do our best to help.",
    fr: 'et nous ferons de notre mieux pour vous aider.',
  },

  'faq.readings.title': { en: 'Your Readings', fr: 'Vos Lectures' },
  'faq.readings.q1': {
    en: 'Are my readings saved?',
    fr: 'Mes lectures sont-elles sauvegardées ?',
  },
  'faq.readings.a1': {
    en: 'Yes. All your readings are automatically saved to your account. You can view your complete reading history anytime from your',
    fr: 'Oui. Toutes vos lectures sont automatiquement sauvegardées sur votre compte. Vous pouvez consulter votre historique complet de lectures à tout moment depuis votre',
  },
  'faq.readings.profile': { en: 'profile page', fr: 'page de profil' },
  'faq.readings.q2': {
    en: 'Can I ask follow-up questions?',
    fr: 'Puis-je poser des questions de suivi ?',
  },
  'faq.readings.q3': {
    en: 'What spread types are available?',
    fr: 'Quels types de tirages sont disponibles ?',
  },
  'faq.readings.a3': {
    en: 'We offer several spread types to suit different needs:',
    fr: 'Nous proposons plusieurs types de tirages pour répondre à différents besoins :',
  },
  'faq.readings.spread1': { en: 'Single Card', fr: 'Carte Unique' },
  'faq.readings.spread1desc': {
    en: 'Quick guidance for simple questions',
    fr: 'Guidance rapide pour les questions simples',
  },
  'faq.readings.spread2': { en: 'Three Card', fr: 'Trois Cartes' },
  'faq.readings.spread2desc': {
    en: 'Past, present, and future perspective',
    fr: 'Perspective passé, présent et futur',
  },
  'faq.readings.spread5': { en: 'Five Card (Love & Career)', fr: 'Cinq Cartes (Amour & Carrière)' },
  'faq.readings.spread5desc': {
    en: '5-card spreads for relationships and career',
    fr: 'Tirages à 5 cartes pour les relations et la carrière',
  },
  'faq.readings.spread3': { en: 'Horseshoe', fr: 'Fer à Cheval' },
  'faq.readings.spread3desc': {
    en: 'Deeper situation analysis with 7 cards',
    fr: 'Analyse approfondie de la situation avec 7 cartes',
  },
  'faq.readings.spread4': { en: 'Celtic Cross', fr: 'Croix Celtique' },
  'faq.readings.spread4desc': {
    en: 'Comprehensive 10-card reading for complex questions',
    fr: 'Lecture complète de 10 cartes pour les questions complexes',
  },
  'faq.readings.q4': {
    en: 'Can I add my own reflections to readings?',
    fr: 'Puis-je ajouter mes propres réflexions aux lectures ?',
  },
  'faq.readings.a4': {
    en: 'Yes. After each reading, you have the option to write your own reflections and thoughts. This helps you process the reading and creates a personal journal of your tarot journey.',
    fr: "Oui. Après chaque lecture, vous avez la possibilité d'écrire vos propres réflexions et pensées. Cela vous aide à traiter la lecture et crée un journal personnel de votre voyage tarot.",
  },
  'faq.readings.q5': {
    en: 'What languages are supported?',
    fr: 'Quelles langues sont prises en charge ?',
  },
  'faq.readings.a5': {
    en: 'MysticOracle is fully available in English and French. You can switch languages anytime using the flag icon in the header. Your readings will be generated in your selected language.',
    fr: "MysticOracle est entièrement disponible en anglais et en français. Vous pouvez changer de langue à tout moment en utilisant l'icône de drapeau dans l'en-tête. Vos lectures seront générées dans la langue sélectionnée.",
  },
  'faq.credit': { en: 'credit', fr: 'crédit' },
  'faq.credits': { en: 'credits', fr: 'crédits' },

  'faq.privacy.title': { en: 'Privacy & Security', fr: 'Confidentialité & Sécurité' },
  'faq.privacy.q1': { en: 'Is my data private?', fr: 'Mes données sont-elles privées ?' },
  'faq.privacy.a1': {
    en: 'Yes. Your readings, questions, and personal reflections are completely private to your account. We do not share, sell, or use your data for any purpose other than providing you with the service. See our',
    fr: "Oui. Vos lectures, questions et réflexions personnelles sont complètement privées sur votre compte. Nous ne partageons pas, ne vendons pas et n'utilisons pas vos données à d'autres fins que de vous fournir le service. Consultez notre",
  },
  'faq.privacy.privacyPolicy': { en: 'Privacy Policy', fr: 'Politique de Confidentialité' },
  'faq.privacy.a1b': { en: 'for complete details.', fr: 'pour les détails complets.' },
  'faq.privacy.q2': { en: 'Where is my data stored?', fr: 'Où sont stockées mes données ?' },
  'faq.privacy.a2': {
    en: 'Your data is stored on secure servers in the European Union (Frankfurt, Germany), in compliance with GDPR regulations. We use industry-standard encryption to protect your information.',
    fr: "Vos données sont stockées sur des serveurs sécurisés dans l'Union Européenne (Francfort, Allemagne), en conformité avec les réglementations RGPD. Nous utilisons un chiffrement aux normes de l'industrie pour protéger vos informations.",
  },
  'faq.privacy.q3': {
    en: 'How do I delete my account?',
    fr: 'Comment puis-je supprimer mon compte ?',
  },
  'faq.privacy.a3': {
    en: 'To delete your account and all associated data, please contact us at',
    fr: 'Pour supprimer votre compte et toutes les données associées, veuillez nous contacter à',
  },
  'faq.privacy.a3b': {
    en: "We'll process your request within 30 days and confirm once your data has been permanently deleted.",
    fr: 'Nous traiterons votre demande dans les 30 jours et confirmerons une fois vos données définitivement supprimées.',
  },
  'faq.privacy.q4': {
    en: 'Is payment information secure?',
    fr: 'Les informations de paiement sont-elles sécurisées ?',
  },
  'faq.privacy.a4': {
    en: 'Absolutely. All payments are processed by Stripe and PayPal — industry leaders in payment security. We never see, store, or have access to your credit card numbers or banking details.',
    fr: "Absolument. Tous les paiements sont traités par Stripe et PayPal — leaders de l'industrie en sécurité des paiements. Nous ne voyons jamais, ne stockons jamais et n'avons jamais accès à vos numéros de carte de crédit ou détails bancaires.",
  },

  'faq.support.title': { en: 'Support', fr: 'Assistance' },
  'faq.support.q1': {
    en: 'How do I contact support?',
    fr: "Comment puis-je contacter l'assistance ?",
  },
  'faq.support.a1': { en: 'Email us at', fr: 'Envoyez-nous un email à' },
  'faq.support.a1b': {
    en: 'We typically respond within 24-48 hours.',
    fr: 'Nous répondons généralement dans les 24-48 heures.',
  },
  'faq.support.q2': { en: 'I have a payment issue', fr: "J'ai un problème de paiement" },
  'faq.support.a2': {
    en: "We're sorry to hear that. Please contact us at",
    fr: "Nous sommes désolés d'apprendre cela. Veuillez nous contacter à",
  },
  'faq.support.a2b': {
    en: "with your payment confirmation or any relevant details. We'll investigate and resolve the issue as quickly as possible.",
    fr: 'avec votre confirmation de paiement ou tout détail pertinent. Nous enquêterons et résoudrons le problème le plus rapidement possible.',
  },
  'faq.support.q3': {
    en: "Something isn't working correctly",
    fr: 'Quelque chose ne fonctionne pas correctement',
  },
  'faq.support.a3': { en: 'Please email us at', fr: 'Veuillez nous envoyer un email à' },
  'faq.support.a3b': {
    en: 'with a description of the issue, what you were trying to do, and any error messages you saw. Screenshots are always helpful!',
    fr: "avec une description du problème, ce que vous essayiez de faire et les messages d'erreur que vous avez vus. Les captures d'écran sont toujours utiles !",
  },
  'faq.support.q4': {
    en: 'Can I suggest a feature?',
    fr: 'Puis-je suggérer une fonctionnalité ?',
  },
  'faq.support.a4': {
    en: 'Absolutely! We love hearing from our users. Send your ideas to',
    fr: 'Absolument ! Nous adorons avoir des nouvelles de nos utilisateurs. Envoyez vos idées à',
  },
  'faq.support.a4b': {
    en: 'We read every suggestion and consider them for future updates.',
    fr: 'Nous lisons chaque suggestion et les considérons pour les futures mises à jour.',
  },

  'faq.cta.title': { en: 'Still have questions?', fr: 'Vous avez encore des questions ?' },
  'faq.cta.description': {
    en: "We're here to help. Reach out and we'll get back to you as soon as possible.",
    fr: 'Nous sommes là pour vous aider. Contactez-nous et nous vous répondrons dès que possible.',
  },
  'faq.cta.button': { en: 'Contact Support', fr: "Contacter l'Assistance" },

  'faq.footer.disclaimer': {
    en: 'MysticOracle is intended for entertainment and personal insight only. Readings are AI-generated and should not replace professional advice. By using this service, you agree to our',
    fr: "MysticOracle est destiné uniquement au divertissement et à l'insight personnel. Les lectures sont générées par l'IA et ne doivent pas remplacer les conseils professionnels. En utilisant ce service, vous acceptez nos",
  },
  'faq.footer.terms': { en: 'Terms of Service', fr: "Conditions d'Utilisation" },

  // SubNav - Navigation Menu
  'subnav.tarot.title': { en: 'Tarot Readings', fr: 'Tirages Tarot' },
  'subnav.horoscope.title': { en: 'Horoscope', fr: 'Horoscope' },
  'subnav.comingSoon.title': { en: 'Coming Soon', fr: 'Bientôt' },
  'subnav.learn.title': { en: 'Learn', fr: 'Découvrir' },
  'subnav.soon': { en: 'Soon', fr: 'Bientôt' },

  // SubNav - Tarot Spreads
  'subnav.tarot.single.desc': { en: '1 card', fr: '1 carte' },
  'subnav.tarot.three_card.desc': { en: '3 cards', fr: '3 cartes' },
  'subnav.tarot.love.desc': { en: '5 cards', fr: '5 cartes' },
  'subnav.tarot.career.desc': { en: '5 cards', fr: '5 cartes' },
  'subnav.tarot.horseshoe.desc': { en: '7 cards', fr: '7 cartes' },
  'subnav.tarot.celtic_cross.desc': { en: '10 cards', fr: '10 cartes' },

  // SubNav - Coming Soon Items
  'subnav.comingSoon.runes.label': { en: 'Rune Reading', fr: 'Lecture des Runes' },
  'subnav.comingSoon.runes.desc': {
    en: 'Ancient Nordic wisdom',
    fr: 'Sagesse nordique ancienne',
  },
  'subnav.comingSoon.birthchart.label': { en: 'Birth Chart', fr: 'Thème Astral' },
  'subnav.comingSoon.birthchart.desc': {
    en: 'Your cosmic blueprint',
    fr: 'Votre empreinte cosmique',
  },
  'subnav.comingSoon.iching.label': { en: 'I Ching', fr: 'Yi King' },
  'subnav.comingSoon.iching.desc': { en: 'Book of Changes', fr: 'Livre des mutations' },
  'subnav.comingSoon.biofeedback.label': { en: 'Biofeedback', fr: 'Biofeedback' },
  'subnav.comingSoon.biofeedback.desc': {
    en: 'Mind-body connection',
    fr: 'Connexion corps-esprit',
  },

  // SubNav - Learn Items
  'subnav.learn.about.label': { en: 'About Us', fr: 'À Propos' },
  'subnav.learn.about.desc': { en: 'Our story', fr: 'Notre histoire' },
  'subnav.learn.tarotCards.label': { en: 'The Arcanas', fr: 'Les Arcanes' },
  'subnav.learn.tarotCards.desc': { en: 'Explore all 78 cards', fr: 'Explorez les 78 cartes' },
  'subnav.learn.blog.label': { en: 'Blog', fr: 'Blog' },
  'subnav.learn.blog.desc': { en: 'Articles & guides', fr: 'Articles & guides' },
  'subnav.learn.credits.label': {
    en: 'How Credits Work',
    fr: 'Comment fonctionnent les crédits',
  },
  'subnav.learn.credits.desc': { en: 'Pricing & packages', fr: 'Tarifs & forfaits' },
  'subnav.learn.faq.label': { en: 'Help & FAQ', fr: 'Aide & FAQ' },
  'subnav.learn.faq.desc': { en: 'Get answers', fr: 'Trouvez des réponses' },

  // About Us Page
  'about.title': { en: 'About MysticOracle', fr: 'À Propos de MysticOracle' },
  'about.subtitle': {
    en: 'Where ancient wisdom meets modern technology to illuminate your path.',
    fr: 'Là où la sagesse ancienne rencontre la technologie moderne pour éclairer votre chemin.',
  },
  'about.story.title': { en: 'Our Story', fr: 'Notre Histoire' },
  'about.story.p1': {
    en: 'MysticOracle was born from a simple belief: that the timeless wisdom of tarot should be accessible to everyone, anytime they need guidance. We created a platform that honors the rich traditions of tarot reading while embracing the possibilities of artificial intelligence.',
    fr: "MysticOracle est né d'une croyance simple : la sagesse intemporelle du tarot devrait être accessible à tous, à tout moment où ils ont besoin de guidance. Nous avons créé une plateforme qui honore les riches traditions de la lecture du tarot tout en embrassant les possibilités de l'intelligence artificielle.",
  },
  'about.story.p2': {
    en: "Our AI has been trained on centuries of tarot interpretation, symbolism, and meaning, allowing it to provide readings that are both insightful and personally relevant. Whether you seek clarity on love, career, or life's bigger questions, MysticOracle is here to guide you.",
    fr: "Notre IA a été formée sur des siècles d'interprétation, de symbolisme et de signification du tarot, lui permettant de fournir des lectures à la fois perspicaces et personnellement pertinentes. Que vous cherchiez de la clarté sur l'amour, la carrière ou les grandes questions de la vie, MysticOracle est là pour vous guider.",
  },
  'about.values.title': { en: 'Our Values', fr: 'Nos Valeurs' },
  'about.values.ai.title': { en: 'AI-Powered Wisdom', fr: 'Sagesse Assistée par IA' },
  'about.values.ai.desc': {
    en: 'We combine ancient tarot traditions with modern AI to provide meaningful, personalized readings.',
    fr: "Nous combinons les traditions anciennes du tarot avec l'IA moderne pour offrir des lectures personnalisées et significatives.",
  },
  'about.values.compassion.title': {
    en: 'Compassionate Guidance',
    fr: 'Guidance Bienveillante',
  },
  'about.values.compassion.desc': {
    en: 'Every reading is delivered with empathy and care, supporting you on your personal journey.',
    fr: 'Chaque lecture est délivrée avec empathie et soin, vous accompagnant dans votre parcours personnel.',
  },
  'about.values.privacy.title': { en: 'Privacy First', fr: 'Confidentialité Avant Tout' },
  'about.values.privacy.desc': {
    en: 'Your spiritual journey is personal. We protect your data with the highest security standards.',
    fr: 'Votre voyage spirituel est personnel. Nous protégeons vos données avec les plus hauts standards de sécurité.',
  },
  'about.values.instant.title': { en: 'Instant Insights', fr: 'Insights Instantanés' },
  'about.values.instant.desc': {
    en: 'Get clarity when you need it most, with readings available 24/7 at your fingertips.',
    fr: 'Obtenez de la clarté quand vous en avez le plus besoin, avec des lectures disponibles 24h/24.',
  },
  'about.disclaimer': {
    en: 'MysticOracle is intended for entertainment and personal reflection purposes only. Our AI-generated readings should not be considered professional advice for medical, legal, financial, or psychological matters.',
    fr: 'MysticOracle est destiné uniquement à des fins de divertissement et de réflexion personnelle. Nos lectures générées par IA ne doivent pas être considérées comme des conseils professionnels pour des questions médicales, juridiques, financières ou psychologiques.',
  },
  'about.cta.ready': {
    en: 'Ready to begin your journey?',
    fr: 'Prêt à commencer votre voyage ?',
  },
  'about.cta.button': { en: 'Start Your Reading', fr: 'Commencer Votre Lecture' },

  // Blog
  'blog.title': { en: 'Mystic Insights', fr: 'Révélations Mystiques' },
  'blog.subtitle': {
    en: 'Explore the mystical world of tarot, astrology, and spiritual growth.',
    fr: "Explorez le monde mystique du tarot, de l'astrologie et de la croissance spirituelle.",
  },
  'blog.featured': { en: 'Featured Articles', fr: 'Articles à la Une' },
  'blog.all': { en: 'All Articles', fr: 'Tous les Articles' },
  'blog.filtered': { en: 'Filtered Articles', fr: 'Articles Filtrés' },
  'blog.noArticles': { en: 'No articles found.', fr: 'Aucun article trouvé.' },
  'blog.categories': { en: 'Categories', fr: 'Catégories' },
  'blog.tags': { en: 'Tags', fr: 'Tags' },
  'blog.filterBy': { en: 'Filtering by', fr: 'Filtrer par' },
  'blog.backToBlog': { en: 'Back to Blog', fr: 'Retour au Blog' },
  'blog.share': { en: 'Share', fr: 'Partager' },
  'blog.relatedArticles': { en: 'Related Articles', fr: 'Articles Connexes' },
  'blog.readMore': { en: 'Read More', fr: 'Lire la Suite' },
  'blog.minRead': { en: 'min read', fr: 'min de lecture' },
  'blog.views': { en: 'views', fr: 'vues' },
  'blog.preview': { en: 'Preview Mode', fr: 'Mode Aperçu' },
  'blog.previewNote': {
    en: 'This is a preview. The post is not published yet.',
    fr: "Ceci est un aperçu. L'article n'est pas encore publié.",
  },

  // Admin Blog
  'admin.blog': { en: 'Blog', fr: 'Blog' },
  'admin.blog.posts': { en: 'Posts', fr: 'Articles' },
  'admin.blog.categories': { en: 'Categories', fr: 'Catégories' },
  'admin.blog.tags': { en: 'Tags', fr: 'Tags' },
  'admin.blog.media': { en: 'Media', fr: 'Médias' },
  'admin.blog.trash': { en: 'Trash', fr: 'Corbeille' },
  'admin.blog.newPost': { en: 'New Post', fr: 'Nouvel Article' },
  'admin.blog.editPost': { en: 'Edit Post', fr: "Modifier l'Article" },
  'admin.blog.importJson': { en: 'Import JSON', fr: 'Importer JSON' },
  'admin.blog.preview': { en: 'Preview', fr: 'Aperçu' },
  'admin.blog.view': { en: 'View', fr: 'Voir' },
  'admin.blog.restore': { en: 'Restore', fr: 'Restaurer' },
  'admin.blog.emptyTrash': { en: 'Empty Trash', fr: 'Vider la Corbeille' },
  'admin.blog.deleteForever': { en: 'Delete Forever', fr: 'Supprimer Définitivement' },

  // Confirmation dialogs
  'confirm.moveToTrash': { en: 'Move to Trash', fr: 'Déplacer vers la Corbeille' },
  'confirm.moveToTrashMsg': {
    en: 'This post will be moved to the trash. You can restore it later.',
    fr: 'Cet article sera déplacé vers la corbeille. Vous pourrez le restaurer plus tard.',
  },
  'confirm.deleteCategory': { en: 'Delete Category', fr: 'Supprimer la Catégorie' },
  'confirm.deleteCategoryMsg': {
    en: 'Are you sure you want to delete this category?',
    fr: 'Êtes-vous sûr de vouloir supprimer cette catégorie?',
  },
  'confirm.deleteTag': { en: 'Delete Tag', fr: 'Supprimer le Tag' },
  'confirm.deleteTagMsg': {
    en: 'Are you sure you want to delete this tag?',
    fr: 'Êtes-vous sûr de vouloir supprimer ce tag?',
  },
  'confirm.deleteImage': { en: 'Delete Image', fr: "Supprimer l'Image" },
  'confirm.deleteImageMsg': {
    en: 'Are you sure you want to delete this image?',
    fr: 'Êtes-vous sûr de vouloir supprimer cette image?',
  },
  'confirm.permanentDelete': { en: 'Permanently Delete', fr: 'Supprimer Définitivement' },
  'confirm.permanentDeleteMsg': {
    en: 'This will permanently delete this post. This action cannot be undone.',
    fr: 'Cela supprimera définitivement cet article. Cette action est irréversible.',
  },
  'confirm.emptyTrash': { en: 'Empty Trash', fr: 'Vider la Corbeille' },
  'confirm.emptyTrashMsg': {
    en: 'Permanently delete all items in trash? This cannot be undone.',
    fr: 'Supprimer définitivement tous les éléments de la corbeille? Cette action est irréversible.',
  },
  'confirm.cancel': { en: 'Cancel', fr: 'Annuler' },
  'confirm.confirm': { en: 'Confirm', fr: 'Confirmer' },

  // Status labels
  'status.draft': { en: 'Draft', fr: 'Brouillon' },
  'status.published': { en: 'Published', fr: 'Publié' },
  'status.archived': { en: 'Archived', fr: 'Archivé' },

  // ============================================
  // EXTRACTED TRANSLATIONS
  // ============================================

  'app.App.access_denied': { en: 'Access Denied', fr: 'Accès Refusé' }, // App.tsx:535
  'app.App.sign_in': { en: 'Sign In', fr: 'Se connecter' }, // App.tsx:545
  'app.App.go_home': { en: 'Go Home', fr: "Retour à l'accueil" }, // App.tsx:551
  'app.App.start_your_reading': { en: 'Start Your Reading', fr: 'Commencer Votre Lecture' }, // App.tsx:708
  'app.App.ai_powered_insights': { en: 'AI Powered Insights', fr: 'Insights par IA' }, // App.tsx:721
  'app.App.deep_contextaware_interpretations': {
    en: 'Deep, context-aware interpretations powered by AI.',
    fr: "Interprétations profondes et contextuelles alimentées par l'IA.",
  }, // App.tsx:724
  'app.App.private_secure': { en: 'Private & Secure', fr: 'Privé & Sécurisé' }, // App.tsx:730
  'app.App.your_spiritual_journey': {
    en: 'Your spiritual journey is personal. We respect your privacy.',
    fr: 'Votre voyage spirituel est personnel. Nous respectons votre vie privée.',
  }, // App.tsx:733
  'app.App.instant_clarity': { en: 'Instant Clarity', fr: 'Clarté Instantanée' }, // App.tsx:739
  'app.App.get_answers_to': {
    en: "Get answers to life's pressing questions in seconds.",
    fr: 'Obtenez des réponses à vos questions en quelques secondes.',
  }, // App.tsx:742
  'app.App.oracle_reading_coming': {
    en: 'Oracle Reading Coming Soon...',
    fr: 'Lecture Oracle Bientôt Disponible...',
  }, // App.tsx:766
  'app.App.not_enough_credits': { en: 'Not Enough Credits', fr: 'Crédits Insuffisants' }, // App.tsx:849
  'app.App.cancel': { en: 'Cancel', fr: 'Annuler' }, // App.tsx:867
  'app.App.buy_credits': { en: 'Buy Credits', fr: 'Acheter des Crédits' }, // App.tsx:875
  'app.App.running_low_on': { en: 'Running Low on Credits', fr: 'Crédits Bientôt Épuisés' }, // App.tsx:912
  'app.App.later': { en: 'Later', fr: 'Plus Tard' }, // App.tsx:925
  'app.App.buy_credits_2': { en: 'Buy Credits', fr: 'Acheter des Crédits' }, // App.tsx:933
  'AboutUs.tsx.AboutUs.about_mysticoracle': {
    en: 'About MysticOracle',
    fr: 'À Propos de MysticOracle',
  }, // components/AboutUs.tsx:59
  'AboutUs.tsx.AboutUs.our_story': { en: 'Our Story', fr: 'Notre Histoire' }, // components/AboutUs.tsx:77
  'AboutUs.tsx.AboutUs.our_values': { en: 'Our Values', fr: 'Nos Valeurs' }, // components/AboutUs.tsx:101
  'AboutUs.tsx.AboutUs.ready_to_begin': {
    en: 'Ready to begin your journey?',
    fr: 'Prêt à commencer votre voyage ?',
  }, // components/AboutUs.tsx:148
  'AboutUs.tsx.AboutUs.start_your_reading': {
    en: 'Start Your Reading',
    fr: 'Commencer Votre Lecture',
  }, // components/AboutUs.tsx:153
  'ActiveReading.tsx.ActiveReading.insufficient_credits': {
    en: 'Insufficient credits',
    fr: 'Crédits insuffisants',
  }, // components/ActiveReading.tsx:210
  'ActiveReading.tsx.ActiveReading.guidance_from_the': {
    en: 'Guidance from the Tarot',
    fr: 'Guidance du Tarot',
  }, // components/ActiveReading.tsx:224
  'ActiveReading.tsx.ActiveReading.transaction_failed': {
    en: 'Transaction failed.',
    fr: 'La transaction a échoué.',
  }, // components/ActiveReading.tsx:274
  'ActiveReading.tsx.ActiveReading.insufficient_credits_2': {
    en: 'Insufficient credits!',
    fr: 'Crédits insuffisants!',
  }, // components/ActiveReading.tsx:410
  'Breadcrumb.tsx.Breadcrumb.home': { en: 'Home', fr: 'Accueil' }, // components/Breadcrumb.tsx:60
  'Breadcrumb.tsx.Breadcrumb.profile': { en: 'Profile', fr: 'Profil' }, // components/Breadcrumb.tsx:70
  'Breadcrumb.tsx.Breadcrumb.admin_dashboard': { en: 'Admin Dashboard', fr: 'Tableau de Bord' }, // components/Breadcrumb.tsx:77
  'Breadcrumb.tsx.Breadcrumb.privacy_policy': {
    en: 'Privacy Policy',
    fr: 'Politique de Confidentialité',
  }, // components/Breadcrumb.tsx:84
  'Breadcrumb.tsx.Breadcrumb.terms_of_service': {
    en: 'Terms of Service',
    fr: "Conditions d'Utilisation",
  }, // components/Breadcrumb.tsx:91
  'Breadcrumb.tsx.Breadcrumb.cookie_policy': {
    en: 'Cookie Policy',
    fr: 'Politique des Cookies',
  }, // components/Breadcrumb.tsx:98
  'Breadcrumb.tsx.Breadcrumb.article': { en: 'Article', fr: 'Article' }, // components/Breadcrumb.tsx:118
  'Breadcrumb.tsx.Breadcrumb.help_faq': { en: 'Help & FAQ', fr: 'Aide & FAQ' }, // components/Breadcrumb.tsx:125
  'Breadcrumb.tsx.Breadcrumb.how_credits_work': {
    en: 'How Credits Work',
    fr: 'Comment fonctionnent les crédits',
  }, // components/Breadcrumb.tsx:132
  'Breadcrumb.tsx.Breadcrumb.about_us': { en: 'About Us', fr: 'À Propos' }, // components/Breadcrumb.tsx:139
  'Breadcrumb.tsx.Breadcrumb.tarot_cards': { en: 'Tarot Cards', fr: 'Cartes de Tarot' }, // components/Breadcrumb.tsx:146
  'Breadcrumb.tsx.Breadcrumb.all_cards': { en: 'All Cards', fr: 'Toutes les Cartes' }, // components/Breadcrumb.tsx:152
  'Breadcrumb.tsx.Breadcrumb.card_details': { en: 'Card Details', fr: 'Détails' }, // components/Breadcrumb.tsx:158
  'Breadcrumb.tsx.Breadcrumb.tarot_cards_2': { en: 'Tarot Cards', fr: 'Cartes de Tarot' }, // components/Breadcrumb.tsx:165
  'Breadcrumb.tsx.Breadcrumb.tarot_cards_3': { en: 'Tarot Cards', fr: 'Cartes de Tarot' }, // components/Breadcrumb.tsx:172
  'Breadcrumb.tsx.Breadcrumb.all_cards_2': { en: 'All Cards', fr: 'Toutes les Cartes' }, // components/Breadcrumb.tsx:178
  'Breadcrumb.tsx.Breadcrumb.tarot_cards_4': { en: 'Tarot Cards', fr: 'Cartes de Tarot' }, // components/Breadcrumb.tsx:185
  'Breadcrumb.tsx.Breadcrumb.category': { en: 'Category', fr: 'Catégorie' }, // components/Breadcrumb.tsx:191
  'Breadcrumb.tsx.Breadcrumb.tarot_readings': { en: 'Tarot Readings', fr: 'Tirages Tarot' }, // components/Breadcrumb.tsx:200
  'Breadcrumb.tsx.Breadcrumb.tarot_readings_2': { en: 'Tarot Readings', fr: 'Tirages Tarot' }, // components/Breadcrumb.tsx:221
  'Breadcrumb.tsx.Breadcrumb.horoscope': { en: 'Horoscope', fr: 'Horoscope' }, // components/Breadcrumb.tsx:226
  'Breadcrumb.tsx.Breadcrumb.oracle': { en: 'Oracle', fr: 'Oracle' }, // components/Breadcrumb.tsx:231
  'CookieConsent.tsx.CookieConsent.cancel': { en: 'Cancel', fr: 'Annuler' }, // components/CookieConsent.tsx:212
  'CreditShop.tsx.CreditShop.purchase_not_allowed': {
    en: 'Purchase not allowed',
    fr: 'Achat non autorisé',
  }, // components/CreditShop.tsx:176
  'CreditShop.tsx.CreditShop.credit_shop': { en: 'Credit Shop', fr: 'Boutique de Crédits' }, // components/CreditShop.tsx:310
  'CreditShop.tsx.CreditShop.limits': { en: 'Limits', fr: 'Limites' }, // components/CreditShop.tsx:319
  'CreditShop.tsx.CreditShop.payment_error': { en: 'Payment Error', fr: 'Erreur de Paiement' }, // components/CreditShop.tsx:339
  'CreditShop.tsx.CreditShop.spending_reminder': {
    en: 'Spending Reminder',
    fr: 'Rappel de Dépenses',
  }, // components/CreditShop.tsx:354
  'CreditShop.tsx.CreditShop.manage_spending_limits': {
    en: 'Manage spending limits',
    fr: 'Gérer les limites de dépenses',
  }, // components/CreditShop.tsx:361
  'CreditShop.tsx.CreditShop.bonus': { en: 'BONUS', fr: 'BONUS' }, // components/CreditShop.tsx:392
  'CreditShop.tsx.CreditShop.extra_credits_on': {
    en: 'Extra credits on your first purchase!',
    fr: 'Crédits bonus sur votre premier achat !',
  }, // components/CreditShop.tsx:396
  'CreditShop.tsx.CreditShop.starter': { en: 'Starter', fr: 'Découverte' }, // components/CreditShop.tsx:455
  'CreditShop.tsx.CreditShop.credits': { en: 'credits', fr: 'crédits' }, // components/CreditShop.tsx:481
  'CreditShop.tsx.CreditShop.best_value': { en: 'Best Value', fr: 'Meilleur' }, // components/CreditShop.tsx:536
  'CreditShop.tsx.CreditShop.credits_2': { en: 'credits', fr: 'crédits' }, // components/CreditShop.tsx:557
  'CreditShop.tsx.CreditShop.credit': { en: 'credit', fr: 'crédit' }, // components/CreditShop.tsx:579
  'CreditShop.tsx.CreditShop.complete_purchase': {
    en: 'Complete Purchase',
    fr: "Finaliser l'Achat",
  }, // components/CreditShop.tsx:601
  'CreditShop.tsx.CreditShop.credits_3': { en: 'credits', fr: 'crédits' }, // components/CreditShop.tsx:607
  'CreditShop.tsx.CreditShop.recommended': { en: 'Recommended', fr: 'Recommandé' }, // components/CreditShop.tsx:629
  'CreditShop.tsx.CreditShop.oneclick_checkout': {
    en: 'One-click checkout',
    fr: 'Paiement en un clic',
  }, // components/CreditShop.tsx:633
  'CreditShop.tsx.CreditShop.credit_debit_card': {
    en: 'Credit / Debit Card',
    fr: 'Carte Bancaire',
  }, // components/CreditShop.tsx:660
  'CreditShop.tsx.CreditShop.pay_with_paypal': {
    en: 'Pay with PayPal',
    fr: 'Payer avec PayPal',
  }, // components/CreditShop.tsx:689
  'CreditShop.tsx.CreditShop.instant_delivery': {
    en: 'Instant delivery',
    fr: 'Livraison instantanée',
  }, // components/CreditShop.tsx:730
  'CreditShop.tsx.CreditShop.secure_payment': { en: 'Secure payment', fr: 'Paiement sécurisé' }, // components/CreditShop.tsx:736
  'CreditShop.tsx.CreditShop.no_expiration': { en: 'No expiration', fr: 'Sans expiration' }, // components/CreditShop.tsx:742
  'CreditShop.tsx.CreditShop.how_do_credits': {
    en: 'How do credits work?',
    fr: 'Comment fonctionnent les crédits ?',
  }, // components/CreditShop.tsx:757
  'CreditShop.tsx.CreditShop.time_for_a': {
    en: 'Time for a Break?',
    fr: 'Temps de Faire une Pause ?',
  }, // components/CreditShop.tsx:790
  'CreditShop.tsx.CreditShop.set_limits': { en: 'Set Limits', fr: 'Définir des Limites' }, // components/CreditShop.tsx:807
  'CreditShop.tsx.CreditShop.continue': { en: 'Continue', fr: 'Continuer' }, // components/CreditShop.tsx:817
  'FAQ.tsx.FAQ.credit': { en: 'credit', fr: 'crédit' }, // components/FAQ.tsx:316
  'FAQ.tsx.FAQ.credits': { en: 'credits', fr: 'crédits' }, // components/FAQ.tsx:317
  'FAQ.tsx.FAQ.love_relationships': { en: 'Love & Relationships', fr: 'Amour & Relations' }, // components/FAQ.tsx:318
  'FAQ.tsx.FAQ.credits_2': { en: 'credits', fr: 'crédits' }, // components/FAQ.tsx:318
  'FAQ.tsx.FAQ.5card_spread_exploring': {
    en: '5-card spread exploring matters of the heart',
    fr: 'Tirage à 5 cartes explorant les affaires du cœur',
  }, // components/FAQ.tsx:318
  'FAQ.tsx.FAQ.career_path': { en: 'Career Path', fr: 'Chemin de Carrière' }, // components/FAQ.tsx:319
  'FAQ.tsx.FAQ.credits_3': { en: 'credits', fr: 'crédits' }, // components/FAQ.tsx:319
  'FAQ.tsx.FAQ.5card_spread_for': {
    en: '5-card spread for professional guidance',
    fr: 'Tirage à 5 cartes pour orientation professionnelle',
  }, // components/FAQ.tsx:319
  'FAQ.tsx.FAQ.credits_4': { en: 'credits', fr: 'crédits' }, // components/FAQ.tsx:320
  'FAQ.tsx.FAQ.credits_5': { en: 'credits', fr: 'crédits' }, // components/FAQ.tsx:321
  'Footer.tsx.Footer.help': { en: 'Help', fr: 'Aide' }, // components/Footer.tsx:39
  'Footer.tsx.Footer.faq': { en: 'FAQ', fr: 'FAQ' }, // components/Footer.tsx:47
  'Footer.tsx.Footer.how_credits_work': {
    en: 'How Credits Work',
    fr: 'Comment fonctionnent les crédits',
  }, // components/Footer.tsx:54
  'Footer.tsx.Footer.legal': { en: 'Legal', fr: 'Mentions Légales' }, // components/Footer.tsx:62
  'Footer.tsx.Footer.privacy_policy': {
    en: 'Privacy Policy',
    fr: 'Politique de Confidentialité',
  }, // components/Footer.tsx:70
  'Footer.tsx.Footer.terms_of_service': {
    en: 'Terms of Service',
    fr: "Conditions d'Utilisation",
  }, // components/Footer.tsx:77
  'Footer.tsx.Footer.cookie_policy': { en: 'Cookie Policy', fr: 'Politique des Cookies' }, // components/Footer.tsx:84
  'Footer.tsx.Footer.contact': { en: 'Contact', fr: 'Contact' }, // components/Footer.tsx:92
  'Footer.tsx.Footer.all_rights_reserved': {
    en: 'All rights reserved.',
    fr: 'Tous droits réservés.',
  }, // components/Footer.tsx:106
  'Header.tsx.Header.fr': { en: 'fr', fr: 'en' }, // components/Header.tsx:28
  'Header.tsx.Header.fr_2': { en: 'fr', fr: 'en' }, // components/Header.tsx:41
  'Header.tsx.Header.switch_to_french': { en: 'Switch to French', fr: 'Switch to English' }, // components/Header.tsx:90
  'Header.tsx.Header.switch_to_french_2': { en: 'Switch to French', fr: 'Passer en anglais' }, // components/Header.tsx:91
  'Header.tsx.Header.sign_in': { en: 'Sign In', fr: 'Connexion' }, // components/Header.tsx:99
  'Header.tsx.Header.credits': { en: 'Credits', fr: 'Crédits' }, // components/Header.tsx:159
  'Header.tsx.Header.home': { en: 'Home', fr: 'Accueil' }, // components/Header.tsx:170
  'Header.tsx.Header.how_credits_work': {
    en: 'How Credits Work',
    fr: 'Comment fonctionnent les crédits',
  }, // components/Header.tsx:188
  'Header.tsx.Header.help_faq': { en: 'Help & FAQ', fr: 'Aide & FAQ' }, // components/Header.tsx:197
  'Header.tsx.Header.my_account': { en: 'My Account', fr: 'Mon Compte' }, // components/Header.tsx:207
  'Header.tsx.Header.sign_in_2': { en: 'Sign In', fr: 'Connexion' }, // components/Header.tsx:245
  'HoroscopeReading.tsx.HoroscopeReading.daily_horoscope': {
    en: 'Daily Horoscope',
    fr: 'Horoscope du Jour',
  }, // components/HoroscopeReading.tsx:398
  'HoroscopeReading.tsx.HoroscopeReading.ask_the_stars': {
    en: 'Ask the Stars',
    fr: 'Interrogez les Étoiles',
  }, // components/HoroscopeReading.tsx:422
  'HoroscopeReading.tsx.HoroscopeReading.suggested_questions': {
    en: 'Suggested questions:',
    fr: 'Questions suggérées:',
  }, // components/HoroscopeReading.tsx:429
  'HoroscopeReading.tsx.HoroscopeReading.you': { en: 'You', fr: 'Vous' }, // components/HoroscopeReading.tsx:462
  'HoroscopeReading.tsx.HoroscopeReading.the_stars': { en: 'The Stars', fr: 'Les Étoiles' }, // components/HoroscopeReading.tsx:463
  'HoroscopeReading.tsx.HoroscopeReading.the_stars_2': { en: 'The Stars', fr: 'Les Étoiles' }, // components/HoroscopeReading.tsx:481
  'HoroscopeReading.tsx.HoroscopeReading.consulting_the_cosmos': {
    en: 'Consulting the cosmos...',
    fr: 'Consultation du cosmos...',
  }, // components/HoroscopeReading.tsx:485
  'HoroscopeReading.tsx.HoroscopeReading.ask_about_planetary': {
    en: 'Ask about planetary influences, moon phases, or your forecast...',
    fr: 'Posez une question sur les influences planétaires, les phases lunaires...',
  }, // components/HoroscopeReading.tsx:511
  'HoroscopeReading.tsx.HoroscopeReading.choose_another_sign': {
    en: 'Choose another sign',
    fr: 'Choisir un autre signe',
  }, // components/HoroscopeReading.tsx:527
  'HoroscopeReading.tsx.HoroscopeReading.select_your_zodiac': {
    en: 'Select Your Zodiac Sign',
    fr: 'Sélectionnez Votre Signe du Zodiaque',
  }, // components/HoroscopeReading.tsx:537
  'PaymentResult.tsx.PaymentResult.verifying_your_payment': {
    en: 'Verifying your payment...',
    fr: 'Vérification de votre paiement...',
  }, // components/PaymentResult.tsx:95
  'PaymentResult.tsx.PaymentResult.payment_cancelled': {
    en: 'Payment Cancelled',
    fr: 'Paiement Annulé',
  }, // components/PaymentResult.tsx:118
  'PaymentResult.tsx.PaymentResult.back_to_profile': {
    en: 'Back to Profile',
    fr: 'Retour au Profil',
  }, // components/PaymentResult.tsx:130
  'PaymentResult.tsx.PaymentResult.go_home': { en: 'Go Home', fr: 'Accueil' }, // components/PaymentResult.tsx:135
  'PaymentResult.tsx.PaymentResult.payment_successful': {
    en: 'Payment Successful!',
    fr: 'Paiement Réussi !',
  }, // components/PaymentResult.tsx:169
  'PaymentResult.tsx.PaymentResult.credits_added': {
    en: 'Credits Added',
    fr: 'Crédits Ajoutés',
  }, // components/PaymentResult.tsx:182
  'PaymentResult.tsx.PaymentResult.view_profile': { en: 'View Profile', fr: 'Voir le Profil' }, // components/PaymentResult.tsx:215
  'PaymentResult.tsx.PaymentResult.start_reading': {
    en: 'Start Reading',
    fr: 'Commencer une Lecture',
  }, // components/PaymentResult.tsx:220
  'PaymentResult.tsx.PaymentResult.payment_failed': {
    en: 'Payment Failed',
    fr: 'Paiement Échoué',
  }, // components/PaymentResult.tsx:236
  'PaymentResult.tsx.PaymentResult.back_to_profile_2': {
    en: 'Back to Profile',
    fr: 'Retour au Profil',
  }, // components/PaymentResult.tsx:248
  'PaymentResult.tsx.PaymentResult.go_home_2': { en: 'Go Home', fr: 'Accueil' }, // components/PaymentResult.tsx:253
  'QuestionLengthModal.tsx.QuestionLengthModal.long_question_detected': {
    en: 'Long Question Detected',
    fr: 'Question Longue Détectée',
  }, // components/QuestionLengthModal.tsx:63
  'QuestionLengthModal.tsx.QuestionLengthModal.your_question': {
    en: 'Your question:',
    fr: 'Votre question:',
  }, // components/QuestionLengthModal.tsx:78
  'QuestionLengthModal.tsx.QuestionLengthModal.characters': {
    en: 'characters',
    fr: 'caractères',
  }, // components/QuestionLengthModal.tsx:86
  'QuestionLengthModal.tsx.QuestionLengthModal.limit_is_500': {
    en: 'limit is 500 for free',
    fr: 'limite de 500 pour gratuit',
  }, // components/QuestionLengthModal.tsx:89
  'QuestionLengthModal.tsx.QuestionLengthModal.your_balance': {
    en: 'Your balance:',
    fr: 'Votre solde:',
  }, // components/QuestionLengthModal.tsx:99
  'QuestionLengthModal.tsx.QuestionLengthModal.credits': { en: 'credits', fr: 'crédits' }, // components/QuestionLengthModal.tsx:103
  'QuestionLengthModal.tsx.QuestionLengthModal.edit_your_question': {
    en: 'Edit your question manually',
    fr: 'Modifier votre question manuellement',
  }, // components/QuestionLengthModal.tsx:129
  'QuestionLengthModal.tsx.QuestionLengthModal.free': { en: 'Free', fr: 'Gratuit' }, // components/QuestionLengthModal.tsx:133
  'QuestionLengthModal.tsx.QuestionLengthModal.ai_rewrite': {
    en: 'AI rewrite',
    fr: 'Réécriture IA',
  }, // components/QuestionLengthModal.tsx:152
  'QuestionLengthModal.tsx.QuestionLengthModal.credit': { en: 'credit', fr: 'crédit' }, // components/QuestionLengthModal.tsx:161
  'QuestionLengthModal.tsx.QuestionLengthModal.use_full_question': {
    en: 'Use full question',
    fr: 'Utiliser la question complète',
  }, // components/QuestionLengthModal.tsx:177
  'QuestionLengthModal.tsx.QuestionLengthModal.credit_2': { en: 'credit', fr: 'crédit' }, // components/QuestionLengthModal.tsx:186
  'ReadingModeSelector.tsx.ReadingModeSelector.choose_your_reading': {
    en: 'Choose Your Reading',
    fr: 'Choisissez Votre Lecture',
  }, // components/ReadingModeSelector.tsx:43
  'SpendingLimitsSettings.tsx.SpendingLimitsSettings.spent': { en: 'Spent', fr: 'Dépensé' }, // components/SpendingLimitsSettings.tsx:108
  'SpendingLimitsSettings.tsx.SpendingLimitsSettings.no_limit': {
    en: 'No limit',
    fr: 'Pas de limite',
  }, // components/SpendingLimitsSettings.tsx:163
  'SpendingLimitsSettings.tsx.SpendingLimitsSettings.custom_amount': {
    en: 'Custom amount',
    fr: 'Montant personnalisé',
  }, // components/SpendingLimitsSettings.tsx:171
  'SpendingLimitsSettings.tsx.SpendingLimitsSettings.set': { en: 'Set', fr: 'Définir' }, // components/SpendingLimitsSettings.tsx:184
  'SpendingLimitsSettings.tsx.SpendingLimitsSettings.responsible_play': {
    en: 'Responsible Play',
    fr: 'Jeu Responsable',
  }, // components/SpendingLimitsSettings.tsx:222
  'SpendingLimitsSettings.tsx.SpendingLimitsSettings.manage_your_spending': {
    en: 'Manage your spending limits',
    fr: 'Gérez vos limites de dépenses',
  }, // components/SpendingLimitsSettings.tsx:225
  'SpendingLimitsSettings.tsx.SpendingLimitsSettings.selfexclusion_active': {
    en: 'Self-Exclusion Active',
    fr: 'Auto-exclusion Active',
  }, // components/SpendingLimitsSettings.tsx:263
  'SpendingLimitsSettings.tsx.SpendingLimitsSettings.purchases_paused_until': {
    en: 'Purchases paused until',
    fr: "Achats suspendus jusqu'au",
  }, // components/SpendingLimitsSettings.tsx:267
  'SpendingLimitsSettings.tsx.SpendingLimitsSettings.purchases_paused_indefinitely': {
    en: 'Purchases paused indefinitely',
    fr: 'Achats suspendus indéfiniment',
  }, // components/SpendingLimitsSettings.tsx:268
  'SpendingLimitsSettings.tsx.SpendingLimitsSettings.spending_limits': {
    en: 'Spending Limits',
    fr: 'Limites de Dépenses',
  }, // components/SpendingLimitsSettings.tsx:284
  'SpendingLimitsSettings.tsx.SpendingLimitsSettings.daily_limit': {
    en: 'Daily Limit',
    fr: 'Limite Quotidienne',
  }, // components/SpendingLimitsSettings.tsx:304
  'SpendingLimitsSettings.tsx.SpendingLimitsSettings.weekly_limit': {
    en: 'Weekly Limit',
    fr: 'Limite Hebdomadaire',
  }, // components/SpendingLimitsSettings.tsx:306
  'SpendingLimitsSettings.tsx.SpendingLimitsSettings.monthly_limit': {
    en: 'Monthly Limit',
    fr: 'Limite Mensuelle',
  }, // components/SpendingLimitsSettings.tsx:309
  'SpendingLimitsSettings.tsx.SpendingLimitsSettings.take_a_break': {
    en: 'Take a Break',
    fr: 'Faire une Pause',
  }, // components/SpendingLimitsSettings.tsx:325
  'SpendingLimitsSettings.tsx.SpendingLimitsSettings.cancel': { en: 'Cancel', fr: 'Annuler' }, // components/SpendingLimitsSettings.tsx:372
  'SpendingLimitsSettings.tsx.SpendingLimitsSettings.yes_take_a': {
    en: 'Yes, take a break',
    fr: 'Oui, faire une pause',
  }, // components/SpendingLimitsSettings.tsx:375
  'SpendingLimitsSettings.tsx.SpendingLimitsSettings.enable_break': {
    en: 'Enable Break',
    fr: 'Activer la Pause',
  }, // components/SpendingLimitsSettings.tsx:385
  'SpendingLimitsSettings.tsx.SpendingLimitsSettings.break_is_active': {
    en: 'Break is active.',
    fr: 'La pause est active.',
  }, // components/SpendingLimitsSettings.tsx:392
  'SpendingLimitsSettings.tsx.SpendingLimitsSettings.ends': { en: 'Ends', fr: 'Fin' }, // components/SpendingLimitsSettings.tsx:396
  'SpendingLimitsSettings.tsx.SpendingLimitsSettings.history_resources': {
    en: 'History & Resources',
    fr: 'Historique & Ressources',
  }, // components/SpendingLimitsSettings.tsx:414
  'SpendingLimitsSettings.tsx.SpendingLimitsSettings.export_spending_history': {
    en: 'Export Spending History',
    fr: "Exporter l'Historique",
  }, // components/SpendingLimitsSettings.tsx:435
  'SpendingLimitsSettings.tsx.SpendingLimitsSettings.support_resources': {
    en: 'Support Resources',
    fr: 'Ressources de Soutien',
  }, // components/SpendingLimitsSettings.tsx:441
  'SpendingLimitsSettings.tsx.SpendingLimitsSettings.done': { en: 'Done', fr: 'Terminé' }, // components/SpendingLimitsSettings.tsx:475
  'SpreadSelector.tsx.SpreadSelector.choose_your_spread': {
    en: 'Choose Your Spread',
    fr: 'Choisissez Votre Tirage',
  }, // components/SpreadSelector.tsx:289
  'SpreadSelector.tsx.SpreadSelector.cards': { en: 'Cards', fr: 'Cartes' }, // components/SpreadSelector.tsx:354
  'SpreadSelector.tsx.SpreadSelector.cost': { en: 'Cost', fr: 'Coût' }, // components/SpreadSelector.tsx:368
  'SpreadSelector.tsx.SpreadSelector.insufficient_credits': {
    en: 'Insufficient Credits',
    fr: 'Crédits Insuffisants',
  }, // components/SpreadSelector.tsx:385
  'SpreadSelector.tsx.SpreadSelector.buy_credits': {
    en: 'Buy Credits',
    fr: 'Acheter des Crédits',
  }, // components/SpreadSelector.tsx:392
  'SubNav.tsx.SubNav.soon': { en: 'Soon', fr: 'Bientôt' }, // components/SubNav.tsx:257
  'SubNav.tsx.SubNav.tarot_readings': { en: 'Tarot Readings', fr: 'Tirages Tarot' }, // components/SubNav.tsx:338
  'SubNav.tsx.SubNav.coming_soon': { en: 'Coming Soon', fr: 'Bientôt' }, // components/SubNav.tsx:374
  'SubNav.tsx.SubNav.learn': { en: 'Learn', fr: 'Découvrir' }, // components/SubNav.tsx:399
  'TarotArticlePage.tsx.TarotArticlePage.article_not_found': {
    en: 'Article Not Found',
    fr: 'Article Non Trouvé',
  }, // components/TarotArticlePage.tsx:139
  'TarotArticlePage.tsx.TarotArticlePage.back': { en: 'Back', fr: 'Retour' }, // components/TarotArticlePage.tsx:147
  'TarotArticlePage.tsx.TarotArticlePage.back_2': { en: 'Back', fr: 'Retour' }, // components/TarotArticlePage.tsx:221
  'TarotArticlePage.tsx.TarotArticlePage.enus': { en: 'en-US', fr: 'fr-FR' }, // components/TarotArticlePage.tsx:260
  'TarotArticlePage.tsx.TarotArticlePage.court_card': { en: 'Court Card', fr: 'Carte de Cour' }, // components/TarotArticlePage.tsx:284
  'TarotArticlePage.tsx.TarotArticlePage.related_topics': {
    en: 'Related Topics',
    fr: 'Sujets Connexes',
  }, // components/TarotArticlePage.tsx:338
  'TarotArticlePage.tsx.TarotArticlePage.related_cards': {
    en: 'Related Cards',
    fr: 'Cartes Liées',
  }, // components/TarotArticlePage.tsx:362
  'TarotArticlesList.tsx.TarotArticlesList.loading_articles': {
    en: 'Loading articles...',
    fr: 'Chargement des articles...',
  }, // components/TarotArticlesList.tsx:94
  'TarotArticlesList.tsx.TarotArticlesList.try_again': { en: 'Try Again', fr: 'Réessayer' }, // components/TarotArticlesList.tsx:111
  'TarotArticlesList.tsx.TarotArticlesList.tarot_card_meanings': {
    en: 'Tarot Card Meanings',
    fr: 'Significations des Cartes de Tarot',
  }, // components/TarotArticlesList.tsx:123
  'TarotArticlesList.tsx.TarotArticlesList.search_articles': {
    en: 'Search articles...',
    fr: 'Rechercher des articles...',
  }, // components/TarotArticlesList.tsx:140
  'TarotArticlesList.tsx.TarotArticlesList.all_cards': {
    en: 'All Cards',
    fr: 'Toutes les Cartes',
  }, // components/TarotArticlesList.tsx:154
  'TarotArticlesList.tsx.TarotArticlesList.no_articles_found': {
    en: 'No articles found',
    fr: 'Aucun article trouvé',
  }, // components/TarotArticlesList.tsx:175
  'UserProfile.tsx.UserProfile.failed_to_load': {
    en: 'Failed to load history',
    fr: 'Échec du chargement',
  }, // components/UserProfile.tsx:66
  'UserProfile.tsx.UserProfile.member_since': { en: 'Member since', fr: 'Membre depuis' }, // components/UserProfile.tsx:260
  'UserProfile.tsx.UserProfile.credits': { en: 'Credits', fr: 'Crédits' }, // components/UserProfile.tsx:271
  'UserProfile.tsx.UserProfile.day_streak': { en: 'Day Streak', fr: 'Jours consécutifs' }, // components/UserProfile.tsx:287
  'UserProfile.tsx.UserProfile.readings': { en: 'Readings', fr: 'Lectures' }, // components/UserProfile.tsx:294
  'UserProfile.tsx.UserProfile.achievements': { en: 'Achievements', fr: 'Succès' }, // components/UserProfile.tsx:301
  'UserProfile.tsx.UserProfile.referral_code': { en: 'Referral Code', fr: 'Code Parrainage' }, // components/UserProfile.tsx:320
  'UserProfile.tsx.UserProfile.share_both_get': {
    en: 'Share & both get +5 credits',
    fr: 'Partagez et gagnez +5 crédits chacun',
  }, // components/UserProfile.tsx:323
  'UserProfile.tsx.UserProfile.achievements_2': { en: 'Achievements', fr: 'Succès' }, // components/UserProfile.tsx:384
  'UserProfile.tsx.UserProfile.reading_history': {
    en: 'Reading History',
    fr: 'Historique des Lectures',
  }, // components/UserProfile.tsx:415
  'UserProfile.tsx.UserProfile.loading': { en: 'Loading...', fr: 'Chargement...' }, // components/UserProfile.tsx:439
  'UserProfile.tsx.UserProfile.credit_history': {
    en: 'Credit History',
    fr: 'Historique des Crédits',
  }, // components/UserProfile.tsx:477
  'UserProfile.tsx.UserProfile.low_on_credits': { en: 'Low on Credits', fr: 'Crédits faibles' }, // components/UserProfile.tsx:492
  'UserProfile.tsx.UserProfile.get_credits': { en: 'Get Credits', fr: 'Obtenir des crédits' }, // components/UserProfile.tsx:507
  'UserProfile.tsx.UserProfile.purchased': { en: 'Purchased', fr: 'Achetés' }, // components/UserProfile.tsx:531
  'UserProfile.tsx.UserProfile.earned': { en: 'Earned', fr: 'Gagnés' }, // components/UserProfile.tsx:535
  'UserProfile.tsx.UserProfile.spent': { en: 'Spent', fr: 'Dépensés' }, // components/UserProfile.tsx:539
  'UserProfile.tsx.UserProfile.loading_2': { en: 'Loading...', fr: 'Chargement...' }, // components/UserProfile.tsx:549
  'UserProfile.tsx.UserProfile.log_out': { en: 'Log Out', fr: 'Déconnexion' }, // components/UserProfile.tsx:587
  'admin.AdminAnalytics.analytics': { en: 'Analytics', fr: 'Analytique' }, // components/admin/AdminAnalytics.tsx:54
  'admin.AdminAnalytics.readings_last_7': {
    en: 'Readings (Last 7 Days)',
    fr: 'Lectures (7 Derniers Jours)',
  }, // components/admin/AdminAnalytics.tsx:67
  'admin.AdminAnalytics.most_active_users': {
    en: 'Most Active Users',
    fr: 'Utilisateurs les Plus Actifs',
  }, // components/admin/AdminAnalytics.tsx:100
  'admin.AdminAnalytics.no_data_yet': { en: 'No data yet', fr: 'Pas de donnees' }, // components/admin/AdminAnalytics.tsx:104
  'admin.AdminAnalytics.readings': { en: 'readings', fr: 'lectures' }, // components/admin/AdminAnalytics.tsx:126
  'admin.AdminAnalytics.top_credit_holders': {
    en: 'Top Credit Holders',
    fr: 'Top Detenteurs de Credits',
  }, // components/admin/AdminAnalytics.tsx:144
  'admin.AdminAnalytics.no_users_yet': { en: 'No users yet', fr: "Pas d'utilisateurs" }, // components/admin/AdminAnalytics.tsx:148
  'admin.AdminAnalytics.longest_login_streaks': {
    en: 'Longest Login Streaks',
    fr: 'Plus Longues Series de Connexion',
  }, // components/admin/AdminAnalytics.tsx:171
  'admin.AdminAnalytics.no_users_yet_2': { en: 'No users yet', fr: "Pas d'utilisateurs" }, // components/admin/AdminAnalytics.tsx:175
  'admin.AdminAnalytics.days': { en: 'days', fr: 'jours' }, // components/admin/AdminAnalytics.tsx:182
  'admin.AdminBlog.posts': { en: 'Posts', fr: 'Articles' }, // components/admin/AdminBlog.tsx:80
  'admin.AdminBlog.categories': { en: 'Categories', fr: 'Categories' }, // components/admin/AdminBlog.tsx:83
  'admin.AdminBlog.tags': { en: 'Tags', fr: 'Tags' }, // components/admin/AdminBlog.tsx:86
  'admin.AdminBlog.media': { en: 'Media', fr: 'Medias' }, // components/admin/AdminBlog.tsx:87
  'admin.AdminBlog.trash': { en: 'Trash', fr: 'Corbeille' }, // components/admin/AdminBlog.tsx:90
  'admin.AdminBlog.cancel': { en: 'Cancel', fr: 'Annuler' }, // components/admin/AdminBlog.tsx:204
  'admin.AdminBlog.confirm': { en: 'Confirm', fr: 'Confirmer' }, // components/admin/AdminBlog.tsx:217
  'admin.AdminCache.purge_all_cache': { en: 'Purge all cache?', fr: 'Vider tout le cache?' }, // components/admin/AdminCache.tsx:43
  'admin.AdminCache.cache_purged_successfully': {
    en: 'Cache purged successfully',
    fr: 'Cache vide avec succes',
  }, // components/admin/AdminCache.tsx:54
  'admin.AdminCache.failed_to_purge': {
    en: 'Failed to purge cache',
    fr: 'Echec du vidage du cache',
  }, // components/admin/AdminCache.tsx:57
  'admin.AdminCache.failed_to_purge_2': {
    en: 'Failed to purge cache',
    fr: 'Echec du vidage du cache',
  }, // components/admin/AdminCache.tsx:60
  'admin.AdminCache.never': { en: 'Never', fr: 'Jamais' }, // components/admin/AdminCache.tsx:72
  'admin.AdminCache.just_now': { en: 'Just now', fr: "A l'instant" }, // components/admin/AdminCache.tsx:80
  'admin.AdminCache.diffmins_min_ago': {
    en: '${diffMins} min ago',
    fr: 'Il y a ${diffMins} min',
  }, // components/admin/AdminCache.tsx:81
  'admin.AdminCache.diffhours_hours_ago': {
    en: '${diffHours} hours ago',
    fr: 'Il y a ${diffHours} heures',
  }, // components/admin/AdminCache.tsx:82
  'admin.AdminCache.diffdays_days_ago': {
    en: '${diffDays} days ago',
    fr: 'Il y a ${diffDays} jours',
  }, // components/admin/AdminCache.tsx:83
  'admin.AdminCache.cache_management': { en: 'Cache Management', fr: 'Gestion du Cache' }, // components/admin/AdminCache.tsx:100
  'admin.AdminCache.refresh': { en: 'Refresh', fr: 'Actualiser' }, // components/admin/AdminCache.tsx:105
  'admin.AdminCache.cached_items': { en: 'Cached Items', fr: 'Elements en cache' }, // components/admin/AdminCache.tsx:122
  'admin.AdminCache.hit_rate': { en: 'Hit Rate', fr: 'Taux de succes' }, // components/admin/AdminCache.tsx:126
  'admin.AdminCache.memory_usage': { en: 'Memory Usage', fr: 'Utilisation memoire' }, // components/admin/AdminCache.tsx:130
  'admin.AdminCache.cache_breakdown': { en: 'Cache Breakdown', fr: 'Repartition du cache' }, // components/admin/AdminCache.tsx:138
  'admin.AdminCache.items': { en: 'items', fr: 'elements' }, // components/admin/AdminCache.tsx:144
  'admin.AdminCache.purge_all_cache_2': { en: 'Purge All Cache', fr: 'Vider tout le cache' }, // components/admin/AdminCache.tsx:163
  'admin.AdminCache.last_purged': { en: 'Last purged:', fr: 'Dernier vidage:' }, // components/admin/AdminCache.tsx:166
  'admin.AdminDashboard.admin_dashboard': {
    en: 'Admin Dashboard',
    fr: 'Tableau de Bord Admin',
  }, // components/admin/AdminDashboard.tsx:66
  'admin.AdminDebug.debug_tools': { en: 'Debug Tools', fr: 'Outils de Débogage' }, // components/admin/AdminDebug.tsx:89
  'admin.AdminDebug.credit_management': { en: 'Credit Management', fr: 'Gestion des Crédits' }, // components/admin/AdminDebug.tsx:122
  'admin.AdminDebug.current_balance': { en: 'Current Balance', fr: 'Solde Actuel' }, // components/admin/AdminDebug.tsx:128
  'admin.AdminDebug.ai_debug_mode': { en: 'AI Debug Mode', fr: 'Mode Debug IA' }, // components/admin/AdminDebug.tsx:168
  'admin.AdminDebug.status': { en: 'Status', fr: 'Statut' }, // components/admin/AdminDebug.tsx:182
  'admin.AdminDebug.mock_mode_active': { en: 'Mock Mode Active', fr: 'Mode Fictif Actif' }, // components/admin/AdminDebug.tsx:186
  'admin.AdminDebug.using_openrouter': {
    en: 'Using OpenRouter',
    fr: "Utilisation d'OpenRouter",
  }, // components/admin/AdminDebug.tsx:187
  'admin.AdminDebug.disable_debug_mode': {
    en: 'Disable Debug Mode',
    fr: 'Désactiver le Mode Debug',
  }, // components/admin/AdminDebug.tsx:204
  'admin.AdminDebug.enable_debug_mode': {
    en: 'Enable Debug Mode',
    fr: 'Activer le Mode Debug',
  }, // components/admin/AdminDebug.tsx:205
  'admin.AdminDebug.environment_info': { en: 'Environment Info', fr: 'Info Environnement' }, // components/admin/AdminDebug.tsx:227
  'admin.AdminEmailTemplates.delete_this_template': {
    en: 'Delete this template?',
    fr: 'Supprimer ce modele?',
  }, // components/admin/AdminEmailTemplates.tsx:101
  'admin.AdminEmailTemplates.active': { en: 'Active', fr: 'Actif' }, // components/admin/AdminEmailTemplates.tsx:196
  'admin.AdminEmailTemplates.create': { en: 'Create', fr: 'Creer' }, // components/admin/AdminEmailTemplates.tsx:257
  'admin.AdminEmailTemplates.save': { en: 'Save', fr: 'Sauvegarder' }, // components/admin/AdminEmailTemplates.tsx:257
  'admin.AdminEmailTemplates.cancel': { en: 'Cancel', fr: 'Annuler' }, // components/admin/AdminEmailTemplates.tsx:264
  'admin.AdminEmailTemplates.email_templates': { en: 'Email Templates', fr: "Modeles d'Email" }, // components/admin/AdminEmailTemplates.tsx:277
  'admin.AdminEmailTemplates.brevo_connected': { en: 'Brevo connected', fr: 'Brevo connecte' }, // components/admin/AdminEmailTemplates.tsx:281
  'admin.AdminEmailTemplates.brevo_not_configured': {
    en: 'Brevo not configured',
    fr: 'Brevo non configure',
  }, // components/admin/AdminEmailTemplates.tsx:282
  'admin.AdminEmailTemplates.add_template': { en: 'Add Template', fr: 'Ajouter Modele' }, // components/admin/AdminEmailTemplates.tsx:292
  'admin.AdminEmailTemplates.no_templates_yet': {
    en: 'No templates yet.',
    fr: 'Aucun modèle.',
  }, // components/admin/AdminEmailTemplates.tsx:316
  'admin.AdminEmailTemplates.loading': { en: 'Loading...', fr: 'Chargement...' }, // components/admin/AdminEmailTemplates.tsx:325
  'admin.AdminEmailTemplates.load_default_templates': {
    en: 'Load Default Templates',
    fr: 'Charger les modèles par défaut',
  }, // components/admin/AdminEmailTemplates.tsx:326
  'admin.AdminHealth.clear_all_error': {
    en: 'Clear all error logs?',
    fr: "Effacer tous les logs d'erreur?",
  }, // components/admin/AdminHealth.tsx:89
  'admin.AdminHealth.operational': { en: 'Operational', fr: 'Operationnel' }, // components/admin/AdminHealth.tsx:149
  'admin.AdminHealth.error': { en: 'Error', fr: 'Erreur' }, // components/admin/AdminHealth.tsx:151
  'admin.AdminHealth.not_configured': { en: 'Not Configured', fr: 'Non configure' }, // components/admin/AdminHealth.tsx:153
  'admin.AdminHealth.system_health': { en: 'System Health', fr: 'Sante du Systeme' }, // components/admin/AdminHealth.tsx:196
  'admin.AdminHealth.refresh': { en: 'Refresh', fr: 'Actualiser' }, // components/admin/AdminHealth.tsx:217
  'admin.AdminHealth.overall_status': { en: 'Overall Status', fr: 'Statut General' }, // components/admin/AdminHealth.tsx:231
  'admin.AdminHealth.healthy': { en: 'Healthy', fr: 'Sain' }, // components/admin/AdminHealth.tsx:238
  'admin.AdminHealth.partial': { en: 'Partial', fr: 'Partiel' }, // components/admin/AdminHealth.tsx:239
  'admin.AdminHealth.degraded': { en: 'Degraded', fr: 'Degrade' }, // components/admin/AdminHealth.tsx:240
  'admin.AdminHealth.services': { en: 'services', fr: 'services' }, // components/admin/AdminHealth.tsx:243
  'admin.AdminHealth.last_checked': { en: 'Last checked', fr: 'Derniere verification' }, // components/admin/AdminHealth.tsx:249
  'admin.AdminHealth.error_log': { en: 'Error Log', fr: 'Journal des erreurs' }, // components/admin/AdminHealth.tsx:312
  'admin.AdminHealth.all_levels': { en: 'All Levels', fr: 'Tous les niveaux' }, // components/admin/AdminHealth.tsx:329
  'admin.AdminHealth.errors': { en: 'Errors', fr: 'Erreurs' }, // components/admin/AdminHealth.tsx:330
  'admin.AdminHealth.warnings': { en: 'Warnings', fr: 'Avertissements' }, // components/admin/AdminHealth.tsx:331
  'admin.AdminHealth.clear_logs': { en: 'Clear logs', fr: 'Effacer les logs' }, // components/admin/AdminHealth.tsx:338
  'admin.AdminHealth.no_errors_logged': {
    en: 'No errors logged',
    fr: 'Aucune erreur enregistree',
  }, // components/admin/AdminHealth.tsx:364
  'admin.AdminOverview.revenue_last_30': {
    en: 'Revenue (Last 30 Days)',
    fr: 'Revenus (30 derniers jours)',
  }, // components/admin/AdminOverview.tsx:141
  'admin.AdminOverview.revenue': { en: 'Revenue', fr: 'Revenus' }, // components/admin/AdminOverview.tsx:145
  'admin.AdminOverview.transactions': { en: 'Transactions', fr: 'Transactions' }, // components/admin/AdminOverview.tsx:149
  'admin.AdminOverview.by_provider': { en: 'By Provider', fr: 'Par fournisseur' }, // components/admin/AdminOverview.tsx:153
  'admin.AdminOverview.readings_by_spread': {
    en: 'Readings by Spread Type',
    fr: 'Lectures par type',
  }, // components/admin/AdminOverview.tsx:171
  'admin.AdminOverview.no_readings_yet': {
    en: 'No readings yet',
    fr: 'Pas encore de lectures',
  }, // components/admin/AdminOverview.tsx:192
  'admin.AdminPackages.active': { en: 'Active', fr: 'Actif' }, // components/admin/AdminPackages.tsx:161
  'admin.AdminPackages.create': { en: 'Create', fr: 'Creer' }, // components/admin/AdminPackages.tsx:172
  'admin.AdminPackages.save': { en: 'Save', fr: 'Sauvegarder' }, // components/admin/AdminPackages.tsx:172
  'admin.AdminPackages.cancel': { en: 'Cancel', fr: 'Annuler' }, // components/admin/AdminPackages.tsx:179
  'admin.AdminPackages.delete_this_package': {
    en: 'Delete this package?',
    fr: 'Supprimer ce forfait?',
  }, // components/admin/AdminPackages.tsx:264
  'admin.AdminPackages.credit_packages': { en: 'Credit Packages', fr: 'Forfaits de Credits' }, // components/admin/AdminPackages.tsx:345
  'admin.AdminPackages.add_package': { en: 'Add Package', fr: 'Ajouter Forfait' }, // components/admin/AdminPackages.tsx:354
  'admin.AdminPackages.no_packages_yet': { en: 'No packages yet.', fr: 'Aucun forfait.' }, // components/admin/AdminPackages.tsx:380
  'admin.AdminPackages.loading': { en: 'Loading...', fr: 'Chargement...' }, // components/admin/AdminPackages.tsx:389
  'admin.AdminPackages.load_default_packages': {
    en: 'Load Default Packages',
    fr: 'Charger les forfaits par défaut',
  }, // components/admin/AdminPackages.tsx:390
  'admin.AdminPackages.credits': { en: 'credits', fr: 'credits' }, // components/admin/AdminPackages.tsx:420
  'admin.AdminPrompts.prompt_content': { en: 'Prompt Content', fr: 'Contenu du Prompt' }, // components/admin/AdminPrompts.tsx:133
  'admin.AdminPrompts.available_variables': {
    en: 'Available Variables:',
    fr: 'Variables Disponibles:',
  }, // components/admin/AdminPrompts.tsx:148
  'admin.AdminPrompts.characters': { en: 'Characters:', fr: 'Caractères:' }, // components/admin/AdminPrompts.tsx:162
  'admin.AdminPrompts.minimum_50_required': {
    en: 'Minimum 50 required',
    fr: 'Minimum 50 requis',
  }, // components/admin/AdminPrompts.tsx:165
  'admin.AdminPrompts.maximum_10000': { en: 'Maximum 10,000', fr: 'Maximum 10 000' }, // components/admin/AdminPrompts.tsx:170
  'admin.AdminPrompts.cancel': { en: 'Cancel', fr: 'Annuler' }, // components/admin/AdminPrompts.tsx:196
  'admin.AdminPrompts.reset_to_default': { en: 'Reset to Default', fr: 'Réinitialiser' }, // components/admin/AdminPrompts.tsx:204
  'admin.AdminPrompts.ai_prompts': { en: 'AI Prompts', fr: 'Prompts IA' }, // components/admin/AdminPrompts.tsx:217
  'admin.AdminPrompts.tarot_prompts': { en: 'Tarot Prompts', fr: 'Prompts Tarot' }, // components/admin/AdminPrompts.tsx:237
  'admin.AdminPrompts.no_prompts_yet': { en: 'No prompts yet.', fr: 'Aucun prompt.' }, // components/admin/AdminPrompts.tsx:243
  'admin.AdminPrompts.base_template': { en: 'Base Template', fr: 'Modèle de Base' }, // components/admin/AdminPrompts.tsx:277
  'admin.AdminPrompts.custom': { en: 'Custom', fr: 'Personnalisé' }, // components/admin/AdminPrompts.tsx:282
  'admin.AdminPrompts.horoscope_prompts': { en: 'Horoscope Prompts', fr: 'Prompts Horoscope' }, // components/admin/AdminPrompts.tsx:309
  'admin.AdminPrompts.custom_2': { en: 'Custom', fr: 'Personnalisé' }, // components/admin/AdminPrompts.tsx:327
  'admin.AdminSettings.api_keys_settings': {
    en: 'API Keys & Settings',
    fr: 'Clés API & Paramètres',
  }, // components/admin/AdminSettings.tsx:173
  'admin.AdminSettings.not_set': { en: 'Not set', fr: 'Non défini' }, // components/admin/AdminSettings.tsx:244
  'admin.AdminSettings.edit': { en: 'Edit', fr: 'Modifier' }, // components/admin/AdminSettings.tsx:252
  'admin.AdminSettings.service_dashboards': {
    en: 'Service Dashboards',
    fr: 'Tableaux de Bord',
  }, // components/admin/AdminSettings.tsx:282
  'admin.AdminSettings.revenue_export': { en: 'Revenue Export', fr: 'Export des Revenus' }, // components/admin/AdminSettings.tsx:366
  'admin.AdminSettings.ai_configuration': { en: 'AI Configuration', fr: 'Configuration IA' }, // components/admin/AdminSettings.tsx:419
  'admin.AdminSettings.provider': { en: 'Provider', fr: 'Fournisseur' }, // components/admin/AdminSettings.tsx:433
  'admin.AdminSettings.model': { en: 'Model', fr: 'Modèle' }, // components/admin/AdminSettings.tsx:439
  'admin.AdminSettings.api_key_status': { en: 'API Key Status', fr: 'Statut Clé API' }, // components/admin/AdminSettings.tsx:445
  'admin.AdminSettings.configured': { en: 'Configured', fr: 'Configuré' }, // components/admin/AdminSettings.tsx:452
  'admin.AdminSettings.not_set_2': { en: 'Not Set', fr: 'Non configuré' }, // components/admin/AdminSettings.tsx:459
  'admin.AdminSettings.system_information': {
    en: 'System Information',
    fr: 'Informations Système',
  }, // components/admin/AdminSettings.tsx:479
  'admin.AdminSettings.authentication': { en: 'Authentication', fr: 'Authentification' }, // components/admin/AdminSettings.tsx:493
  'admin.AdminSettings.payments': { en: 'Payments', fr: 'Paiements' }, // components/admin/AdminSettings.tsx:499
  'admin.AdminTarotArticles.enus': { en: 'en-US', fr: 'fr-FR' }, // components/admin/AdminTarotArticles.tsx:90
  'admin.AdminTarotArticles.draft': { en: 'Draft', fr: 'Brouillon' }, // components/admin/AdminTarotArticles.tsx:108
  'admin.AdminTarotArticles.published': { en: 'Published', fr: 'Publié' }, // components/admin/AdminTarotArticles.tsx:109
  'admin.AdminTarotArticles.archived': { en: 'Archived', fr: 'Archivé' }, // components/admin/AdminTarotArticles.tsx:110
  'admin.AdminTarotArticles.move_to_trash': {
    en: 'Move to Trash?',
    fr: 'Déplacer vers la corbeille?',
  }, // components/admin/AdminTarotArticles.tsx:224
  'admin.AdminTarotArticles.permanently_delete': {
    en: 'Permanently Delete?',
    fr: 'Supprimer définitivement?',
  }, // components/admin/AdminTarotArticles.tsx:276
  'admin.AdminTarotArticles.empty_trash': { en: 'Empty Trash?', fr: 'Vider la corbeille?' }, // components/admin/AdminTarotArticles.tsx:307
  'admin.AdminTarotArticles.articles': { en: 'Articles', fr: 'Articles' }, // components/admin/AdminTarotArticles.tsx:367
  'admin.AdminTarotArticles.categories': { en: 'Categories', fr: 'Catégories' }, // components/admin/AdminTarotArticles.tsx:379
  'admin.AdminTarotArticles.media': { en: 'Media', fr: 'Médias' }, // components/admin/AdminTarotArticles.tsx:397
  'admin.AdminTarotArticles.trash': { en: 'Trash', fr: 'Corbeille' }, // components/admin/AdminTarotArticles.tsx:406
  'admin.AdminTarotArticles.search_by_title': {
    en: 'Search by title or slug...',
    fr: 'Rechercher par titre ou slug...',
  }, // components/admin/AdminTarotArticles.tsx:424
  'admin.AdminTarotArticles.all_types': { en: 'All Types', fr: 'Tous les types' }, // components/admin/AdminTarotArticles.tsx:436
  'admin.AdminTarotArticles.all_status': { en: 'All Status', fr: 'Tous les statuts' }, // components/admin/AdminTarotArticles.tsx:449
  'admin.AdminTarotArticles.draft_2': { en: 'Draft', fr: 'Brouillon' }, // components/admin/AdminTarotArticles.tsx:450
  'admin.AdminTarotArticles.published_2': { en: 'Published', fr: 'Publié' }, // components/admin/AdminTarotArticles.tsx:451
  'admin.AdminTarotArticles.archived_2': { en: 'Archived', fr: 'Archivé' }, // components/admin/AdminTarotArticles.tsx:452
  'admin.AdminTarotArticles.import_json': { en: 'Import JSON', fr: 'Importer JSON' }, // components/admin/AdminTarotArticles.tsx:460
  'admin.AdminTarotArticles.article': { en: 'Article', fr: 'Article' }, // components/admin/AdminTarotArticles.tsx:475
  'admin.AdminTarotArticles.status': { en: 'Status', fr: 'Statut' }, // components/admin/AdminTarotArticles.tsx:476
  'admin.AdminTarotArticles.stats': { en: 'Stats', fr: 'Stats' }, // components/admin/AdminTarotArticles.tsx:477
  'admin.AdminTarotArticles.actions': { en: 'Actions', fr: 'Actions' }, // components/admin/AdminTarotArticles.tsx:478
  'admin.AdminTarotArticles.no_articles_yet': {
    en: 'No articles yet. Import your first article!',
    fr: 'Aucun article. Importez votre premier article!',
  }, // components/admin/AdminTarotArticles.tsx:485
  'admin.AdminTarotArticles.view': { en: 'View', fr: 'Voir' }, // components/admin/AdminTarotArticles.tsx:547
  'admin.AdminTarotArticles.preview': { en: 'Preview', fr: 'Aperçu' }, // components/admin/AdminTarotArticles.tsx:547
  'admin.AdminTarotArticles.edit': { en: 'Edit', fr: 'Modifier' }, // components/admin/AdminTarotArticles.tsx:554
  'admin.AdminTarotArticles.unpublish': { en: 'Unpublish', fr: 'Dépublier' }, // components/admin/AdminTarotArticles.tsx:566
  'admin.AdminTarotArticles.publish': { en: 'Publish', fr: 'Publier' }, // components/admin/AdminTarotArticles.tsx:566
  'admin.AdminTarotArticles.delete': { en: 'Delete', fr: 'Supprimer' }, // components/admin/AdminTarotArticles.tsx:580
  'admin.AdminTarotArticles.empty_trash_2': { en: 'Empty Trash', fr: 'Vider la corbeille' }, // components/admin/AdminTarotArticles.tsx:645
  'admin.AdminTarotArticles.trash_is_empty': {
    en: 'Trash is empty',
    fr: 'La corbeille est vide',
  }, // components/admin/AdminTarotArticles.tsx:658
  'admin.AdminTarotArticles.deleted_articles_will': {
    en: 'Deleted articles will appear here',
    fr: 'Les articles supprimés apparaîtront ici',
  }, // components/admin/AdminTarotArticles.tsx:661
  'admin.AdminTarotArticles.article_2': { en: 'Article', fr: 'Article' }, // components/admin/AdminTarotArticles.tsx:670
  'admin.AdminTarotArticles.original_slug': { en: 'Original Slug', fr: 'Slug original' }, // components/admin/AdminTarotArticles.tsx:671
  'admin.AdminTarotArticles.deleted': { en: 'Deleted', fr: 'Supprimé' }, // components/admin/AdminTarotArticles.tsx:672
  'admin.AdminTarotArticles.actions_2': { en: 'Actions', fr: 'Actions' }, // components/admin/AdminTarotArticles.tsx:673
  'admin.AdminTarotArticles.restore': { en: 'Restore', fr: 'Restaurer' }, // components/admin/AdminTarotArticles.tsx:711
  'admin.AdminTarotArticles.restore_2': { en: 'Restore', fr: 'Restaurer' }, // components/admin/AdminTarotArticles.tsx:715
  'admin.AdminTarotArticles.delete_permanently': {
    en: 'Delete permanently',
    fr: 'Supprimer définitivement',
  }, // components/admin/AdminTarotArticles.tsx:720
  'admin.AdminTarotArticles.cancel': { en: 'Cancel', fr: 'Annuler' }, // components/admin/AdminTarotArticles.tsx:819
  'admin.AdminTarotArticles.confirm': { en: 'Confirm', fr: 'Confirmer' }, // components/admin/AdminTarotArticles.tsx:829
  'admin.AdminTransactions.revenue_export': { en: 'Revenue Export', fr: 'Export des revenus' }, // components/admin/AdminTransactions.tsx:145
  'admin.AdminTransactions.download_monthly_revenue': {
    en: 'Download monthly revenue reports',
    fr: 'Télécharger les rapports mensuels',
  }, // components/admin/AdminTransactions.tsx:148
  'admin.AdminTransactions.no_data_available': { en: 'No data available', fr: 'Aucune donnée' }, // components/admin/AdminTransactions.tsx:161
  'admin.AdminTransactions.export_csv': { en: 'Export CSV', fr: 'Exporter CSV' }, // components/admin/AdminTransactions.tsx:181
  'admin.AdminTransactions.all_types': { en: 'All Types', fr: 'Tous les types' }, // components/admin/AdminTransactions.tsx:195
  'admin.AdminTransactions.purchases': { en: 'Purchases', fr: 'Achats' }, // components/admin/AdminTransactions.tsx:196
  'admin.AdminTransactions.readings': { en: 'Readings', fr: 'Lectures' }, // components/admin/AdminTransactions.tsx:197
  'admin.AdminTransactions.daily_bonus': { en: 'Daily Bonus', fr: 'Bonus quotidien' }, // components/admin/AdminTransactions.tsx:198
  'admin.AdminTransactions.achievements': { en: 'Achievements', fr: 'Realisations' }, // components/admin/AdminTransactions.tsx:199
  'admin.AdminTransactions.referrals': { en: 'Referrals', fr: 'Parrainages' }, // components/admin/AdminTransactions.tsx:200
  'admin.AdminTransactions.refunds': { en: 'Refunds', fr: 'Remboursements' }, // components/admin/AdminTransactions.tsx:201
  'admin.AdminTransactions.date': { en: 'Date', fr: 'Date' }, // components/admin/AdminTransactions.tsx:224
  'admin.AdminTransactions.user': { en: 'User', fr: 'Utilisateur' }, // components/admin/AdminTransactions.tsx:225
  'admin.AdminTransactions.type': { en: 'Type', fr: 'Type' }, // components/admin/AdminTransactions.tsx:226
  'admin.AdminTransactions.description': { en: 'Description', fr: 'Description' }, // components/admin/AdminTransactions.tsx:227
  'admin.AdminTransactions.amount': { en: 'Amount', fr: 'Montant' }, // components/admin/AdminTransactions.tsx:228
  'admin.AdminTransactions.status': { en: 'Status', fr: 'Statut' }, // components/admin/AdminTransactions.tsx:229
  'admin.AdminTransactions.no_transactions_found': {
    en: 'No transactions found',
    fr: 'Aucune transaction trouvee',
  }, // components/admin/AdminTransactions.tsx:236
  'admin.AdminUsers.search_users': { en: 'Search users...', fr: 'Rechercher...' }, // components/admin/AdminUsers.tsx:130
  'admin.AdminUsers.all_status': { en: 'All Status', fr: 'Tous les statuts' }, // components/admin/AdminUsers.tsx:140
  'admin.AdminUsers.active': { en: 'Active', fr: 'Actif' }, // components/admin/AdminUsers.tsx:141
  'admin.AdminUsers.flagged': { en: 'Flagged', fr: 'Signalé' }, // components/admin/AdminUsers.tsx:142
  'admin.AdminUsers.suspended': { en: 'Suspended', fr: 'Suspendu' }, // components/admin/AdminUsers.tsx:143
  'admin.AdminUsers.newest_first': { en: 'Newest First', fr: 'Plus recents' }, // components/admin/AdminUsers.tsx:156
  'admin.AdminUsers.oldest_first': { en: 'Oldest First', fr: 'Plus anciens' }, // components/admin/AdminUsers.tsx:157
  'admin.AdminUsers.most_credits': { en: 'Most Credits', fr: 'Plus de credits' }, // components/admin/AdminUsers.tsx:158
  'admin.AdminUsers.most_readings': { en: 'Most Readings', fr: 'Plus de lectures' }, // components/admin/AdminUsers.tsx:159
  'admin.AdminUsers.name_az': { en: 'Name A-Z', fr: 'Nom A-Z' }, // components/admin/AdminUsers.tsx:160
  'admin.AdminUsers.user': { en: 'User', fr: 'Utilisateur' }, // components/admin/AdminUsers.tsx:186
  'admin.AdminUsers.credits': { en: 'Credits', fr: 'Credits' }, // components/admin/AdminUsers.tsx:187
  'admin.AdminUsers.readings': { en: 'Readings', fr: 'Lectures' }, // components/admin/AdminUsers.tsx:188
  'admin.AdminUsers.status': { en: 'Status', fr: 'Statut' }, // components/admin/AdminUsers.tsx:189
  'admin.AdminUsers.joined': { en: 'Joined', fr: 'Inscrit' }, // components/admin/AdminUsers.tsx:190
  'admin.AdminUsers.actions': { en: 'Actions', fr: 'Actions' }, // components/admin/AdminUsers.tsx:191
  'admin.AdminUsers.no_users_found': { en: 'No users found', fr: 'Aucun utilisateur trouve' }, // components/admin/AdminUsers.tsx:198
  'admin.AdminUsers.adjust_credits': { en: 'Adjust credits', fr: 'Ajuster credits' }, // components/admin/AdminUsers.tsx:224
  'admin.AdminUsers.view_details': { en: 'View details', fr: 'Voir details' }, // components/admin/AdminUsers.tsx:244
  'admin.AdminUsers.suspend_user': { en: 'Suspend user', fr: 'Suspendre' }, // components/admin/AdminUsers.tsx:252
  'admin.AdminUsers.activate_user': { en: 'Activate user', fr: 'Activer' }, // components/admin/AdminUsers.tsx:260
  'admin.AdminUsers.remove_admin': { en: 'Remove admin', fr: 'Retirer admin' }, // components/admin/AdminUsers.tsx:268
  'admin.AdminUsers.make_admin': { en: 'Make admin', fr: 'Rendre admin' }, // components/admin/AdminUsers.tsx:268
  'admin.AdminUsers.adjust_credits_2': { en: 'Adjust Credits', fr: 'Ajuster Credits' }, // components/admin/AdminUsers.tsx:321
  'admin.AdminUsers.amount': { en: 'Amount (+/-)', fr: 'Montant (+/-)' }, // components/admin/AdminUsers.tsx:326
  'admin.AdminUsers.reason': { en: 'Reason', fr: 'Raison' }, // components/admin/AdminUsers.tsx:338
  'admin.AdminUsers.bonus_refund_etc': {
    en: 'Bonus, refund, etc.',
    fr: 'Bonus, remboursement, etc.',
  }, // components/admin/AdminUsers.tsx:344
  'admin.AdminUsers.cancel': { en: 'Cancel', fr: 'Annuler' }, // components/admin/AdminUsers.tsx:353
  'admin.AdminUsers.apply': { en: 'Apply', fr: 'Appliquer' }, // components/admin/AdminUsers.tsx:360
  'admin.AdminUsers.total_earned': { en: 'Total Earned', fr: 'Total gagne' }, // components/admin/AdminUsers.tsx:394
  'admin.AdminUsers.total_spent': { en: 'Total Spent', fr: 'Total depense' }, // components/admin/AdminUsers.tsx:398
  'admin.AdminUsers.readings_2': { en: 'Readings', fr: 'Lectures' }, // components/admin/AdminUsers.tsx:402
  'admin.AdminUsers.login_streak': { en: 'Login Streak', fr: 'Jours consecutifs' }, // components/admin/AdminUsers.tsx:406
  'admin.AdminUsers.last_login': { en: 'Last Login', fr: 'Derniere connexion' }, // components/admin/AdminUsers.tsx:410
  'admin.AdminUsers.achievements': { en: 'Achievements', fr: 'Realisations' }, // components/admin/AdminUsers.tsx:414
  'admin.BlogPostEditor.new_post': { en: 'New Post', fr: 'Nouvel article' }, // components/admin/BlogPostEditor.tsx:206
  'admin.BlogPostEditor.edit_post': { en: 'Edit Post', fr: 'Modifier article' }, // components/admin/BlogPostEditor.tsx:207
  'admin.BlogPostEditor.title': { en: 'Title', fr: 'Titre' }, // components/admin/BlogPostEditor.tsx:228
  'admin.BlogPostEditor.excerpt': { en: 'Excerpt', fr: 'Extrait' }, // components/admin/BlogPostEditor.tsx:240
  'admin.BlogPostEditor.content': { en: 'Content', fr: 'Contenu' }, // components/admin/BlogPostEditor.tsx:255
  'admin.BlogPostEditor.settings': { en: 'Settings', fr: 'Paramètres' }, // components/admin/BlogPostEditor.tsx:291
  'admin.BlogPostEditor.status': { en: 'Status', fr: 'Statut' }, // components/admin/BlogPostEditor.tsx:305
  'admin.BlogPostEditor.draft': { en: 'Draft', fr: 'Brouillon' }, // components/admin/BlogPostEditor.tsx:310
  'admin.BlogPostEditor.published': { en: 'Published', fr: 'Publié' }, // components/admin/BlogPostEditor.tsx:311
  'admin.BlogPostEditor.archived': { en: 'Archived', fr: 'Archivé' }, // components/admin/BlogPostEditor.tsx:312
  'admin.BlogPostEditor.author': { en: 'Author', fr: 'Auteur' }, // components/admin/BlogPostEditor.tsx:317
  'admin.BlogPostEditor.featured': { en: 'Featured', fr: 'À la une' }, // components/admin/BlogPostEditor.tsx:324
  'admin.BlogPostEditor.read_time_min': { en: 'Read time (min)', fr: 'Temps lecture (min)' }, // components/admin/BlogPostEditor.tsx:333
  'admin.BlogPostEditor.cover_image': { en: 'Cover Image', fr: 'Image couverture' }, // components/admin/BlogPostEditor.tsx:346
  'admin.BlogPostEditor.categories': { en: 'Categories', fr: 'Catégories' }, // components/admin/BlogPostEditor.tsx:368
  'admin.BlogPostEditor.no_categories_yet': { en: 'No categories yet', fr: 'Aucune catégorie' }, // components/admin/BlogPostEditor.tsx:378
  'admin.BlogPostEditor.no_tags_yet': { en: 'No tags yet', fr: 'Aucun tag' }, // components/admin/BlogPostEditor.tsx:394
  'admin.ImportArticle.close': { en: 'Close', fr: 'Fermer' }, // components/admin/ImportArticle.tsx:341
  'admin.ImportArticle.import_tarot_article': {
    en: 'Import Tarot Article',
    fr: 'Importer un Article Tarot',
  }, // components/admin/ImportArticle.tsx:349
  'admin.ImportArticle.preview_article': {
    en: 'Preview article',
    fr: "Prévisualiser l'article",
  }, // components/admin/ImportArticle.tsx:367
  'admin.ImportArticle.preview': { en: 'Preview', fr: 'Aperçu' }, // components/admin/ImportArticle.tsx:370
  'admin.ImportArticle.validating': { en: 'Validating...', fr: 'Validation...' }, // components/admin/ImportArticle.tsx:383
  'admin.ImportArticle.validate': { en: 'Validate', fr: 'Valider' }, // components/admin/ImportArticle.tsx:388
  'admin.ImportArticle.updating': { en: 'Updating...', fr: 'Mise à jour...' }, // components/admin/ImportArticle.tsx:404
  'admin.ImportArticle.importing': { en: 'Importing...', fr: 'Importation...' }, // components/admin/ImportArticle.tsx:405
  'admin.ImportArticle.update_article': { en: 'Update Article', fr: 'Mettre à jour' }, // components/admin/ImportArticle.tsx:411
  'admin.ImportArticle.import_article': { en: 'Import Article', fr: 'Importer' }, // components/admin/ImportArticle.tsx:412
  'admin.ImportArticle.save_despite_validation': {
    en: 'Save despite validation errors',
    fr: 'Enregistrer malgré les erreurs',
  }, // components/admin/ImportArticle.tsx:424
  'admin.ImportArticle.forcing': { en: 'Forcing...', fr: 'Forçage...' }, // components/admin/ImportArticle.tsx:429
  'admin.ImportArticle.force_save': { en: 'Force Save', fr: 'Forcer' }, // components/admin/ImportArticle.tsx:434
  'admin.ImportArticle.json_editor': { en: 'JSON Editor', fr: 'Éditeur JSON' }, // components/admin/ImportArticle.tsx:450
  'admin.ImportArticle.article_json': { en: 'Article JSON', fr: "JSON de l'Article" }, // components/admin/ImportArticle.tsx:470
  'admin.ImportArticle.format_json': { en: 'Format JSON', fr: 'Formater JSON' }, // components/admin/ImportArticle.tsx:476
  'admin.ImportArticle.paste_your_article': {
    en: 'Paste your article JSON here...',
    fr: "Collez votre JSON d'article ici...",
  }, // components/admin/ImportArticle.tsx:483
  'admin.ImportArticle.valid_json': { en: 'Valid JSON', fr: 'JSON Valide' }, // components/admin/ImportArticle.tsx:513
  'admin.ImportArticle.validation_failed': {
    en: 'Validation Failed',
    fr: 'Validation Échouée',
  }, // components/admin/ImportArticle.tsx:518
  'admin.ImportArticle.words': { en: 'Words', fr: 'Mots' }, // components/admin/ImportArticle.tsx:531
  'admin.ImportArticle.faqs': { en: 'FAQs', fr: 'FAQs' }, // components/admin/ImportArticle.tsx:539
  'admin.ImportArticle.answerfirst': { en: 'Answer-First', fr: 'Réponse Direct' }, // components/admin/ImportArticle.tsx:553
  'admin.ImportArticle.errors': { en: 'Errors:', fr: 'Erreurs:' }, // components/admin/ImportArticle.tsx:564
  'admin.ImportArticle.warnings': { en: 'Warnings:', fr: 'Avertissements:' }, // components/admin/ImportArticle.tsx:583
  'admin.ImportArticle.hide': { en: 'Hide', fr: 'Masquer' }, // components/admin/ImportArticle.tsx:591
  'admin.ImportArticle.show': { en: 'Show', fr: 'Afficher' }, // components/admin/ImportArticle.tsx:592
  'admin.ImportArticle.preview_generated_schema': {
    en: 'Preview Generated Schema',
    fr: 'Aperçu du Schéma Généré',
  }, // components/admin/ImportArticle.tsx:612
  'admin.ImportArticle.article_imported_successfully': {
    en: 'Article Imported Successfully',
    fr: 'Article Importé avec Succès',
  }, // components/admin/ImportArticle.tsx:640
  'admin.ImportArticle.status': { en: 'Status:', fr: 'Statut:' }, // components/admin/ImportArticle.tsx:650
  'admin.ImportArticle.view': { en: 'View', fr: 'Voir' }, // components/admin/ImportArticle.tsx:666
  'admin.ImportArticle.preview_2': { en: 'Preview', fr: 'Aperçu' }, // components/admin/ImportArticle.tsx:667
  'admin.ImportArticle.imported_with_warnings': {
    en: 'Imported with warnings:',
    fr: 'Importé avec avertissements:',
  }, // components/admin/ImportArticle.tsx:676
  'admin.ImportArticle.import_failed': { en: 'Import Failed', fr: 'Importation Échouée' }, // components/admin/ImportArticle.tsx:693
  'admin.ImportArticle.article_preview': { en: 'Article Preview', fr: "Aperçu de l'Article" }, // components/admin/ImportArticle.tsx:737
  'admin.ImportArticle.faq': { en: 'FAQ', fr: 'Questions Fréquentes' }, // components/admin/ImportArticle.tsx:799
  'admin.ImportArticle.close_2': { en: 'Close', fr: 'Fermer' }, // components/admin/ImportArticle.tsx:840
  'admin.TarotArticleEditor.title': { en: 'Title', fr: 'Titre' }, // components/admin/TarotArticleEditor.tsx:194
  'admin.TarotArticleEditor.excerpt': { en: 'Excerpt', fr: 'Extrait' }, // components/admin/TarotArticleEditor.tsx:201
  'admin.TarotArticleEditor.content': { en: 'Content', fr: 'Contenu' }, // components/admin/TarotArticleEditor.tsx:208
  'admin.TarotArticleEditor.featured_image': { en: 'Featured Image', fr: 'Image principale' }, // components/admin/TarotArticleEditor.tsx:224
  'admin.TarotArticleEditor.categories': { en: 'Categories', fr: 'Catégories' }, // components/admin/TarotArticleEditor.tsx:245
  'admin.TarotArticleEditor.no_categories': { en: 'No categories', fr: 'Aucune catégorie' }, // components/admin/TarotArticleEditor.tsx:257
  'admin.TarotArticleEditor.no_tags': { en: 'No tags', fr: 'Aucun tag' }, // components/admin/TarotArticleEditor.tsx:274
  'admin.TarotArticleEditor.related_cards': { en: 'Related Cards', fr: 'Cartes liées' }, // components/admin/TarotArticleEditor.tsx:291
  'admin.TarotArticleEditor.one_slug_per': {
    en: 'One slug per line...',
    fr: 'Un slug par ligne...',
  }, // components/admin/TarotArticleEditor.tsx:302
  'admin.TarotCategoriesManager.delete_this_category': {
    en: 'Delete this category?',
    fr: 'Supprimer cette catégorie?',
  }, // components/admin/TarotCategoriesManager.tsx:91
  'admin.TarotCategoriesManager.new_category': { en: 'New Category', fr: 'Nouvelle catégorie' }, // components/admin/TarotCategoriesManager.tsx:120
  'admin.TarotCategoriesManager.edit': { en: 'Edit', fr: 'Modifier' }, // components/admin/TarotCategoriesManager.tsx:147
  'admin.TarotCategoriesManager.no_categories_yet': {
    en: 'No categories yet',
    fr: 'Aucune catégorie',
  }, // components/admin/TarotCategoriesManager.tsx:160
  'admin.TarotCategoriesManager.new_category_2': {
    en: 'New Category',
    fr: 'Nouvelle catégorie',
  }, // components/admin/TarotCategoriesManager.tsx:177
  'admin.TarotCategoriesManager.edit_category': {
    en: 'Edit Category',
    fr: 'Modifier catégorie',
  }, // components/admin/TarotCategoriesManager.tsx:177
  'admin.TarotCategoriesManager.name': { en: 'Name', fr: 'Nom' }, // components/admin/TarotCategoriesManager.tsx:185
  'admin.TarotCategoriesManager.cancel': { en: 'Cancel', fr: 'Annuler' }, // components/admin/TarotCategoriesManager.tsx:223
  'admin.TarotCategoriesManager.save': { en: 'Save', fr: 'Enregistrer' }, // components/admin/TarotCategoriesManager.tsx:230
  'admin.TarotFAQManager.question': { en: 'Question', fr: 'Question' }, // components/admin/TarotFAQManager.tsx:43
  'admin.TarotFAQManager.enter_question': {
    en: 'Enter question...',
    fr: 'Entrez la question...',
  }, // components/admin/TarotFAQManager.tsx:49
  'admin.TarotFAQManager.answer': { en: 'Answer', fr: 'Réponse' }, // components/admin/TarotFAQManager.tsx:62
  'admin.TarotFAQManager.enter_answer': { en: 'Enter answer...', fr: 'Entrez la réponse...' }, // components/admin/TarotFAQManager.tsx:67
  'admin.TarotFAQManager.add_faq': { en: 'Add FAQ', fr: 'Ajouter FAQ' }, // components/admin/TarotFAQManager.tsx:80
  'admin.TarotFAQManager.no_faq_items': { en: 'No FAQ items yet', fr: 'Aucune FAQ' }, // components/admin/TarotFAQManager.tsx:85
  'admin.TarotMediaManager.delete_this_image': {
    en: 'Delete this image?',
    fr: 'Supprimer cette image?',
  }, // components/admin/TarotMediaManager.tsx:94
  'admin.TarotMediaManager.upload_to': { en: 'Upload to:', fr: 'Dossier:' }, // components/admin/TarotMediaManager.tsx:164
  'admin.TarotMediaManager.upload_images': { en: 'Upload Images', fr: 'Telecharger images' }, // components/admin/TarotMediaManager.tsx:207
  'admin.TarotMediaManager.copy_url': { en: 'Copy URL', fr: 'Copier URL' }, // components/admin/TarotMediaManager.tsx:228
  'admin.TarotMediaManager.delete': { en: 'Delete', fr: 'Supprimer' }, // components/admin/TarotMediaManager.tsx:235
  'admin.TarotMediaManager.no_images_uploaded': {
    en: 'No images uploaded yet',
    fr: 'Aucune image',
  }, // components/admin/TarotMediaManager.tsx:258
  'admin.TarotTagsManager.delete_this_tag': { en: 'Delete this tag?', fr: 'Supprimer ce tag?' }, // components/admin/TarotTagsManager.tsx:87
  'admin.TarotTagsManager.new_tag': { en: 'New Tag', fr: 'Nouveau tag' }, // components/admin/TarotTagsManager.tsx:116
  'admin.TarotTagsManager.no_tags_yet': { en: 'No tags yet', fr: 'Aucun tag' }, // components/admin/TarotTagsManager.tsx:146
  'admin.TarotTagsManager.new_tag_2': { en: 'New Tag', fr: 'Nouveau tag' }, // components/admin/TarotTagsManager.tsx:163
  'admin.TarotTagsManager.edit_tag': { en: 'Edit Tag', fr: 'Modifier tag' }, // components/admin/TarotTagsManager.tsx:163
  'admin.TarotTagsManager.name': { en: 'Name', fr: 'Nom' }, // components/admin/TarotTagsManager.tsx:171
  'admin.TarotTagsManager.cancel': { en: 'Cancel', fr: 'Annuler' }, // components/admin/TarotTagsManager.tsx:200
  'admin.TarotTagsManager.save': { en: 'Save', fr: 'Enregistrer' }, // components/admin/TarotTagsManager.tsx:207
  'admin.BlogImportModal.import_articles_from': {
    en: 'Import Articles from JSON',
    fr: 'Importer articles depuis JSON',
  }, // components/admin/blog/BlogImportModal.tsx:134
  'admin.BlogImportModal.import_complete': { en: 'Import Complete', fr: 'Import terminé' }, // components/admin/blog/BlogImportModal.tsx:157
  'admin.BlogImportModal.imported': { en: 'Imported', fr: 'Importés' }, // components/admin/blog/BlogImportModal.tsx:166
  'admin.BlogImportModal.skipped': { en: 'Skipped', fr: 'Ignorés' }, // components/admin/blog/BlogImportModal.tsx:173
  'admin.BlogImportModal.errors': { en: 'Errors', fr: 'Erreurs' }, // components/admin/blog/BlogImportModal.tsx:179
  'admin.BlogImportModal.skipped_already_exist': {
    en: 'Skipped (already exist):',
    fr: 'Ignorés (existent déjà):',
  }, // components/admin/blog/BlogImportModal.tsx:184
  'admin.BlogImportModal.created_categories': {
    en: 'Created categories:',
    fr: 'Catégories créées:',
  }, // components/admin/blog/BlogImportModal.tsx:192
  'admin.BlogImportModal.created_tags': { en: 'Created tags:', fr: 'Tags créés:' }, // components/admin/blog/BlogImportModal.tsx:200
  'admin.BlogImportModal.errors_2': { en: 'Errors:', fr: 'Erreurs:' }, // components/admin/blog/BlogImportModal.tsx:209
  'admin.BlogImportModal.upload_json_file': {
    en: 'Upload JSON file',
    fr: 'Télécharger fichier JSON',
  }, // components/admin/blog/BlogImportModal.tsx:239
  'admin.BlogImportModal.or_paste_json': { en: 'or paste JSON', fr: 'ou coller JSON' }, // components/admin/blog/BlogImportModal.tsx:249
  'admin.BlogImportModal.importing': { en: 'Importing...', fr: 'Import en cours...' }, // components/admin/blog/BlogImportModal.tsx:309
  'admin.BlogImportModal.import': { en: 'Import', fr: 'Importer' }, // components/admin/blog/BlogImportModal.tsx:314
  'admin.BlogMediaTab.delete_image': { en: 'Delete Image', fr: 'Supprimer l' }, // components/admin/blog/BlogMediaTab.tsx:80
  'admin.BlogMediaTab.failed_to_delete': {
    en: 'Failed to delete media',
    fr: 'Échec de la suppression',
  }, // components/admin/blog/BlogMediaTab.tsx:93
  'admin.BlogMediaTab.upload_images': { en: 'Upload Images', fr: 'Telecharger images' }, // components/admin/blog/BlogMediaTab.tsx:120
  'admin.BlogMediaTab.copy_url': { en: 'Copy URL', fr: 'Copier URL' }, // components/admin/blog/BlogMediaTab.tsx:144
  'admin.BlogMediaTab.delete': { en: 'Delete', fr: 'Supprimer' }, // components/admin/blog/BlogMediaTab.tsx:155
  'admin.BlogMediaTab.no_images_uploaded': {
    en: 'No images uploaded yet',
    fr: 'Aucune image telecharge',
  }, // components/admin/blog/BlogMediaTab.tsx:167
  'admin.BlogPostsTab.move_to_trash': { en: 'Move to Trash', fr: 'Déplacer vers la corbeille' }, // components/admin/blog/BlogPostsTab.tsx:182
  'admin.BlogPostsTab.failed_to_delete': {
    en: 'Failed to delete post',
    fr: 'Échec de la suppression',
  }, // components/admin/blog/BlogPostsTab.tsx:195
  'admin.BlogPostsTab.search_posts': { en: 'Search posts...', fr: 'Rechercher...' }, // components/admin/blog/BlogPostsTab.tsx:243
  'admin.BlogPostsTab.all_status': { en: 'All Status', fr: 'Tous les statuts' }, // components/admin/blog/BlogPostsTab.tsx:252
  'admin.BlogPostsTab.draft': { en: 'Draft', fr: 'Brouillon' }, // components/admin/blog/BlogPostsTab.tsx:253
  'admin.BlogPostsTab.published': { en: 'Published', fr: 'Publie' }, // components/admin/blog/BlogPostsTab.tsx:254
  'admin.BlogPostsTab.archived': { en: 'Archived', fr: 'Archive' }, // components/admin/blog/BlogPostsTab.tsx:255
  'admin.BlogPostsTab.import_json': { en: 'Import JSON', fr: 'Importer JSON' }, // components/admin/blog/BlogPostsTab.tsx:262
  'admin.BlogPostsTab.new_post': { en: 'New Post', fr: 'Nouvel article' }, // components/admin/blog/BlogPostsTab.tsx:269
  'admin.BlogPostsTab.title': { en: 'Title', fr: 'Titre' }, // components/admin/blog/BlogPostsTab.tsx:285
  'admin.BlogPostsTab.status': { en: 'Status', fr: 'Statut' }, // components/admin/blog/BlogPostsTab.tsx:288
  'admin.BlogPostsTab.categories': { en: 'Categories', fr: 'Categories' }, // components/admin/blog/BlogPostsTab.tsx:291
  'admin.BlogPostsTab.views': { en: 'Views', fr: 'Vues' }, // components/admin/blog/BlogPostsTab.tsx:294
  'admin.BlogPostsTab.updated': { en: 'Updated', fr: 'Mis a jour' }, // components/admin/blog/BlogPostsTab.tsx:297
  'admin.BlogPostsTab.actions': { en: 'Actions', fr: 'Actions' }, // components/admin/blog/BlogPostsTab.tsx:300
  'admin.BlogPostsTab.edit': { en: 'Edit', fr: 'Modifier' }, // components/admin/blog/BlogPostsTab.tsx:382
  'admin.BlogPostsTab.delete': { en: 'Delete', fr: 'Supprimer' }, // components/admin/blog/BlogPostsTab.tsx:389
  'admin.BlogTaxonomyTab.delete_category': {
    en: 'Delete Category',
    fr: 'Supprimer la catégorie',
  }, // components/admin/blog/BlogTaxonomyTab.tsx:150
  'admin.BlogTaxonomyTab.failed_to_delete': {
    en: 'Failed to delete category',
    fr: 'Échec de la suppression',
  }, // components/admin/blog/BlogTaxonomyTab.tsx:163
  'admin.BlogTaxonomyTab.delete_tag': { en: 'Delete Tag', fr: 'Supprimer le tag' }, // components/admin/blog/BlogTaxonomyTab.tsx:213
  'admin.BlogTaxonomyTab.failed_to_delete_2': {
    en: 'Failed to delete tag',
    fr: 'Échec de la suppression',
  }, // components/admin/blog/BlogTaxonomyTab.tsx:226
  'admin.BlogTaxonomyTab.new_category': { en: 'New Category', fr: 'Nouvelle categorie' }, // components/admin/blog/BlogTaxonomyTab.tsx:242
  'admin.BlogTaxonomyTab.edit': { en: 'Edit', fr: 'Modifier' }, // components/admin/blog/BlogTaxonomyTab.tsx:285
  'admin.BlogTaxonomyTab.color': { en: 'Color', fr: 'Couleur' }, // components/admin/blog/BlogTaxonomyTab.tsx:333
  'admin.BlogTaxonomyTab.cancel': { en: 'Cancel', fr: 'Annuler' }, // components/admin/blog/BlogTaxonomyTab.tsx:403
  'admin.BlogTaxonomyTab.new_tag': { en: 'New Tag', fr: 'Nouveau tag' }, // components/admin/blog/BlogTaxonomyTab.tsx:437
  'admin.BlogTaxonomyTab.cancel_2': { en: 'Cancel', fr: 'Annuler' }, // components/admin/blog/BlogTaxonomyTab.tsx:538
  'admin.BlogTrashTab.failed_to_restore': {
    en: 'Failed to restore post',
    fr: 'Échec de la restauration',
  }, // components/admin/blog/BlogTrashTab.tsx:78
  'admin.BlogTrashTab.permanently_delete': {
    en: 'Permanently Delete',
    fr: 'Supprimer définitivement',
  }, // components/admin/blog/BlogTrashTab.tsx:84
  'admin.BlogTrashTab.failed_to_delete': {
    en: 'Failed to delete post',
    fr: 'Échec de la suppression',
  }, // components/admin/blog/BlogTrashTab.tsx:97
  'admin.BlogTrashTab.empty_trash': { en: 'Empty Trash', fr: 'Vider la corbeille' }, // components/admin/blog/BlogTrashTab.tsx:105
  'admin.BlogTrashTab.failed_to_empty': {
    en: 'Failed to empty trash',
    fr: 'Échec du vidage de la corbeille',
  }, // components/admin/blog/BlogTrashTab.tsx:119
  'admin.BlogTrashTab.empty_trash_2': { en: 'Empty Trash', fr: 'Vider la corbeille' }, // components/admin/blog/BlogTrashTab.tsx:135
  'admin.BlogTrashTab.trash_is_empty': { en: 'Trash is empty', fr: 'La corbeille est vide' }, // components/admin/blog/BlogTrashTab.tsx:148
  'admin.BlogTrashTab.title': { en: 'Title', fr: 'Titre' }, // components/admin/blog/BlogTrashTab.tsx:163
  'admin.BlogTrashTab.original_slug': { en: 'Original Slug', fr: 'Slug original' }, // components/admin/blog/BlogTrashTab.tsx:166
  'admin.BlogTrashTab.deleted': { en: 'Deleted', fr: 'Supprimé' }, // components/admin/blog/BlogTrashTab.tsx:169
  'admin.BlogTrashTab.actions': { en: 'Actions', fr: 'Actions' }, // components/admin/blog/BlogTrashTab.tsx:172
  'admin.BlogTrashTab.restore': { en: 'Restore', fr: 'Restaurer' }, // components/admin/blog/BlogTrashTab.tsx:195
  'admin.BlogTrashTab.restore_2': { en: 'Restore', fr: 'Restaurer' }, // components/admin/blog/BlogTrashTab.tsx:198
  'admin.BlogTrashTab.delete_permanently': {
    en: 'Delete permanently',
    fr: 'Supprimer définitivement',
  }, // components/admin/blog/BlogTrashTab.tsx:204
  'admin.CoverImageSection.uploading': { en: 'Uploading...', fr: 'Envoi...' }, // components/admin/editor/CoverImageSection.tsx:78
  'admin.CoverImageSection.upload_image': { en: 'Upload Image', fr: 'Télécharger image' }, // components/admin/editor/CoverImageSection.tsx:83
  'admin.CoverImageSection.or_use_url': { en: 'or use URL', fr: 'ou utiliser URL' }, // components/admin/editor/CoverImageSection.tsx:96
  'admin.CoverImageSection.or_select_from': {
    en: 'Or select from library',
    fr: 'Ou choisir depuis bibliothèque',
  }, // components/admin/editor/CoverImageSection.tsx:114
  'admin.EditorTopBar.back': { en: 'Back', fr: 'Retour' }, // components/admin/editor/EditorTopBar.tsx:30
  'admin.EditorTopBar.view': { en: 'View', fr: 'Voir' }, // components/admin/editor/EditorTopBar.tsx:104
  'admin.EditorTopBar.preview': { en: 'Preview', fr: 'Aperçu' }, // components/admin/editor/EditorTopBar.tsx:105
  'admin.EditorTopBar.save': { en: 'Save', fr: 'Enregistrer' }, // components/admin/editor/EditorTopBar.tsx:121
  'admin.EditorTopBar.unpublish': { en: 'Unpublish', fr: 'Dépublier' }, // components/admin/editor/EditorTopBar.tsx:141
  'admin.EditorTopBar.publish': { en: 'Publish', fr: 'Publier' }, // components/admin/editor/EditorTopBar.tsx:142
  'admin.TaxonomySelector.none_available': { en: 'None available', fr: 'Aucun disponible' }, // components/admin/editor/TaxonomySelector.tsx:47
  'blog.BlogList.enus': { en: 'en-US', fr: 'fr-FR' }, // components/blog/BlogList.tsx:103
  'blog.BlogList.mystic_insights': { en: 'Mystic Insights', fr: 'Revelations Mystiques' }, // components/blog/BlogList.tsx:115
  'blog.BlogList.featured_articles': { en: 'Featured Articles', fr: 'Articles a la Une' }, // components/blog/BlogList.tsx:129
  'blog.BlogList.filtering_by': { en: 'Filtering by:', fr: 'Filtrer par:' }, // components/blog/BlogList.tsx:252
  'blog.BlogList.nameen': { en: 'nameEn', fr: 'nameFr' }, // components/blog/BlogList.tsx:259
  'blog.BlogList.nameen_2': { en: 'nameEn', fr: 'nameFr' }, // components/blog/BlogList.tsx:268
  'blog.BlogList.filtered_articles': { en: 'Filtered Articles', fr: 'Articles Filtres' }, // components/blog/BlogList.tsx:279
  'blog.BlogList.all_articles': { en: 'All Articles', fr: 'Tous les Articles' }, // components/blog/BlogList.tsx:280
  'blog.BlogList.no_articles_found': { en: 'No articles found.', fr: 'Aucun article trouve.' }, // components/blog/BlogList.tsx:290
  'blog.BlogList.page_page_of': {
    en: 'Page ${page} of ${totalPages}',
    fr: 'Page ${page} sur ${totalPages}',
  }, // components/blog/BlogList.tsx:361
  'blog.BlogPost.enus': { en: 'en_US', fr: 'fr_FR' }, // components/blog/BlogPost.tsx:103
  'blog.BlogPost.enus_2': { en: 'en-US', fr: 'fr-FR' }, // components/blog/BlogPost.tsx:197
  'blog.BlogPost.article_not_found': { en: 'Article Not Found', fr: 'Article Non Trouve' }, // components/blog/BlogPost.tsx:262
  'blog.BlogPost.back_to_blog': { en: 'Back to Blog', fr: 'Retour au Blog' }, // components/blog/BlogPost.tsx:268
  'blog.BlogPost.preview_mode': { en: 'Preview Mode', fr: 'Mode Apercu' }, // components/blog/BlogPost.tsx:286
  'blog.BlogPost.back_to_blog_2': { en: 'Back to Blog', fr: 'Retour au Blog' }, // components/blog/BlogPost.tsx:301
  'blog.BlogPost.read': { en: 'read', fr: 'lecture' }, // components/blog/BlogPost.tsx:343
  'blog.BlogPost.views': { en: 'views', fr: 'vues' }, // components/blog/BlogPost.tsx:347
  'blog.BlogPost.share': { en: 'Share:', fr: 'Partager:' }, // components/blog/BlogPost.tsx:355
  'blog.BlogPost.tags': { en: 'Tags:', fr: 'Tags:' }, // components/blog/BlogPost.tsx:440
  'blog.BlogPost.related_articles': { en: 'Related Articles', fr: 'Articles Similaires' }, // components/blog/BlogPost.tsx:465
  'profile.AchievementCard.enus': { en: 'en-US', fr: 'fr-FR' }, // components/profile/AchievementCard.tsx:103
  'profile.AchievementCard.unlocked': { en: 'Unlocked: ', fr: 'Débloqué: ' }, // components/profile/AchievementCard.tsx:143
  'profile.AchievementCard.progress': { en: 'Progress: ', fr: 'Progrès: ' }, // components/profile/AchievementCard.tsx:149
  'profile.AchievementCard.new': { en: 'NEW!', fr: 'NOUVEAU!' }, // components/profile/AchievementCard.tsx:172
  'profile.AchievementCard.unlocked_2': { en: 'Unlocked', fr: 'Débloqué' }, // components/profile/AchievementCard.tsx:225
  'profile.AchievementCard.credits': { en: 'credits', fr: 'crédits' }, // components/profile/AchievementCard.tsx:228
  'profile.AchievementCard.credits_2': { en: 'credits', fr: 'crédits' }, // components/profile/AchievementCard.tsx:233
  'profile.ReadingFilters.search_by_question': {
    en: 'Search by question...',
    fr: 'Rechercher par question...',
  }, // components/profile/ReadingFilters.tsx:67
  'profile.ReadingFilters.all_spreads': { en: 'All Spreads', fr: 'Tous les tirages' }, // components/profile/ReadingFilters.tsx:94
  'profile.ReadingFilters.newest': { en: 'Newest', fr: 'Récent' }, // components/profile/ReadingFilters.tsx:117
  'profile.ReadingFilters.oldest': { en: 'Oldest', fr: 'Ancien' }, // components/profile/ReadingFilters.tsx:118
  'profile.ReadingFilters.date_range': { en: 'Date Range', fr: 'Période' }, // components/profile/ReadingFilters.tsx:127
  'profile.ReadingFilters.readings': { en: 'readings', fr: 'lectures' }, // components/profile/ReadingFilters.tsx:158
  'profile.ReadingFilters.clear_filters': { en: 'Clear filters', fr: 'Effacer les filtres' }, // components/profile/ReadingFilters.tsx:169
  'profile.ReadingHistoryCard.today': { en: 'Today', fr: 'Aujourd' }, // components/profile/ReadingHistoryCard.tsx:22
  'profile.ReadingHistoryCard.yesterday': { en: 'Yesterday', fr: 'Hier' }, // components/profile/ReadingHistoryCard.tsx:23
  'profile.ReadingHistoryCard.diffdays_days_ago': {
    en: '${diffDays} days ago',
    fr: 'Il y a ${diffDays} jours',
  }, // components/profile/ReadingHistoryCard.tsx:24
  'profile.ReadingHistoryCard.enus': { en: 'en-US', fr: 'fr-FR' }, // components/profile/ReadingHistoryCard.tsx:26
  'profile.ReadingHistoryCard.cards': { en: 'cards', fr: 'cartes' }, // components/profile/ReadingHistoryCard.tsx:78
  'profile.ReadingHistoryCard.cards_drawn': { en: 'Cards Drawn', fr: 'Cartes Tirées' }, // components/profile/ReadingHistoryCard.tsx:123
  'profile.ReadingHistoryCard.positions': { en: 'Positions', fr: 'Positions' }, // components/profile/ReadingHistoryCard.tsx:145
  'profile.ReadingHistoryCard.interpretation': { en: 'Interpretation', fr: 'Interprétation' }, // components/profile/ReadingHistoryCard.tsx:175
  'profile.ReadingHistoryCard.followup_questions': {
    en: 'Follow-up Questions',
    fr: 'Questions de Suivi',
  }, // components/profile/ReadingHistoryCard.tsx:208
  'profile.ReadingHistoryCard.your_reflection': {
    en: 'Your Reflection',
    fr: 'Votre Réflexion',
  }, // components/profile/ReadingHistoryCard.tsx:231
  'profile.TransactionFilters.type': { en: 'Type', fr: 'Type' }, // components/profile/TransactionFilters.tsx:53
  'profile.TransactionFilters.date_range': { en: 'Date Range', fr: 'Période' }, // components/profile/TransactionFilters.tsx:76
  'profile.TransactionFilters.transactions': { en: 'transactions', fr: 'transactions' }, // components/profile/TransactionFilters.tsx:107
  'profile.TransactionFilters.clear_filters': {
    en: 'Clear filters',
    fr: 'Effacer les filtres',
  }, // components/profile/TransactionFilters.tsx:118
  'profile.TransactionItem.today': { en: 'Today', fr: 'Aujourd' }, // components/profile/TransactionItem.tsx:74
  'profile.TransactionItem.yesterday': { en: 'Yesterday', fr: 'Hier' }, // components/profile/TransactionItem.tsx:75
  'profile.TransactionItem.diffdaysd_ago': {
    en: '${diffDays}d ago',
    fr: 'Il y a ${diffDays}j',
  }, // components/profile/TransactionItem.tsx:76
  'profile.TransactionItem.enus': { en: 'en-US', fr: 'fr-FR' }, // components/profile/TransactionItem.tsx:78
  'reading.OracleChat.ask_the_oracle': { en: 'Ask the Oracle', fr: 'Demandez à l' }, // components/reading/OracleChat.tsx:47
  'reading.OracleChat.balance': { en: 'Balance:', fr: 'Solde:' }, // components/reading/OracleChat.tsx:51
  'reading.OracleChat.ask_a_followup': {
    en: 'Ask a follow-up question...',
    fr: 'Posez une question de suivi...',
  }, // components/reading/OracleChat.tsx:98
  'reading.OracleChat.free': { en: 'Free', fr: 'Gratuit' }, // components/reading/OracleChat.tsx:110
  'reading.OracleChat.credit': { en: 'Credit', fr: 'Crédit' }, // components/reading/OracleChat.tsx:111
  'reading.ReadingShufflePhase.shuffling_the_deck': {
    en: 'Shuffling the deck...',
    fr: 'Mélange des cartes...',
  }, // components/reading/ReadingShufflePhase.tsx:288
  'reading.ReadingShufflePhase.draw_cards': { en: 'Draw Cards', fr: 'Tirer les Cartes' }, // components/reading/ReadingShufflePhase.tsx:316
  'reading.DrawingPhase.draw_your_cards': { en: 'Draw Your Cards', fr: 'Tirez Vos Cartes' }, // components/reading/phases/DrawingPhase.tsx:48
  'reading.DrawingPhase.remaining': { en: 'remaining', fr: 'restantes' }, // components/reading/phases/DrawingPhase.tsx:57
  'reading.DrawingPhase.tap': { en: 'TAP', fr: 'TOUCHER' }, // components/reading/phases/DrawingPhase.tsx:106
  'reading.InterpretationPhase.r': { en: ' (R)', fr: ' (R)' }, // components/reading/phases/InterpretationPhase.t...
  'reading.InterpretationPhase.the_oracle_speaks': {
    en: 'The Oracle Speaks',
    fr: "L'Oracle Parle",
  }, // components/reading/phases/InterpretationPhase.t...
  'reading.InterpretationPhase.start_new_reading': {
    en: 'Start New Reading',
    fr: 'Nouvelle Lecture',
  }, // components/reading/phases/InterpretationPhase.t...
  'reading.QuestionIntroPhase.cards': { en: 'cards', fr: 'cartes' }, // components/reading/phases/QuestionIntroPhase.ts...
  'reading.QuestionIntroPhase.credits': { en: 'credits', fr: 'crédits' }, // components/reading/phases/QuestionIntroPhase.ts...
  'reading.QuestionIntroPhase.your_question': { en: 'Your Question', fr: 'Votre Question' }, // components/reading/phases/QuestionIntroPhase.ts...
  'reading.QuestionIntroPhase.what_weighs_on': {
    en: 'What weighs on your heart?',
    fr: "Qu'est-ce qui pèse sur votre cœur?",
  }, // components/reading/phases/QuestionIntroPhase.ts...
  'reading.QuestionIntroPhase.use_general_guidance': {
    en: 'Use General Guidance',
    fr: 'Guidance Générale',
  }, // components/reading/phases/QuestionIntroPhase.ts...
  'reading.QuestionIntroPhase.advanced_options': {
    en: 'Advanced Options',
    fr: 'Options Avancées',
  }, // components/reading/phases/QuestionIntroPhase.ts...
  'reading.QuestionIntroPhase.begin_reading': {
    en: 'Begin Reading',
    fr: 'Commencer la Lecture',
  }, // components/reading/phases/QuestionIntroPhase.ts...
  'reading.QuestionIntroPhase.credits_2': { en: 'credits', fr: 'crédits' }, // components/reading/phases/QuestionIntroPhase.ts...
  'reading.RevealingPhase.the_cards_are': {
    en: 'The cards are laid.',
    fr: 'Les cartes sont posées.',
  }, // components/reading/phases/RevealingPhase.tsx:51
  'reading.RevealingPhase.reversed': { en: 'Reversed', fr: 'Renversée' }, // components/reading/phases/RevealingPhase.tsx:87
  'reading.RevealingPhase.reveal_interpretation': {
    en: 'Reveal Interpretation',
    fr: 'Révéler l',
  }, // components/reading/phases/RevealingPhase.tsx:105
  'rewards.AchievementUnlockModal.achievement_unlocked': {
    en: 'Achievement Unlocked!',
    fr: 'Succès Débloqué !',
  }, // components/rewards/AchievementUnlockModal.tsx:171
  'rewards.AchievementUnlockModal.credits': { en: 'credits', fr: 'crédits' }, // components/rewards/AchievementUnlockModal.tsx:203
  'rewards.AchievementUnlockModal.awesome': { en: 'Awesome!', fr: 'Super !' }, // components/rewards/AchievementUnlockModal.tsx:214
  'rewards.DailyBonusCard.daily_bonus': { en: 'Daily Bonus', fr: 'Bonus Quotidien' }, // components/rewards/DailyBonusCard.tsx:153
  'rewards.DailyBonusCard.day_streak': { en: 'day streak', fr: 'jours consécutifs' }, // components/rewards/DailyBonusCard.tsx:159
  'rewards.DailyBonusCard.credits': { en: 'credits', fr: 'crédits' }, // components/rewards/DailyBonusCard.tsx:172
  'rewards.DailyBonusCard.7day_streak_bonus': {
    en: '7-day streak bonus: +5',
    fr: 'Bonus 7 jours: +5',
  }, // components/rewards/DailyBonusCard.tsx:181
  'rewards.DailyBonusCard.bonus_claimed': { en: 'Bonus Claimed!', fr: 'Bonus Réclamé !' }, // components/rewards/DailyBonusCard.tsx:196
  'rewards.DailyBonusCard.claiming': { en: 'Claiming...', fr: 'Réclamation...' }, // components/rewards/DailyBonusCard.tsx:220
  'rewards.DailyBonusCard.claim_bonus': { en: 'Claim Bonus', fr: 'Réclamer le Bonus' }, // components/rewards/DailyBonusCard.tsx:225
  'rewards.DailyBonusCard.next_bonus_in': { en: 'Next bonus in', fr: 'Prochain bonus dans' }, // components/rewards/DailyBonusCard.tsx:239
  'rewards.DailyBonusPopup.bonus_claimed': { en: 'Bonus Claimed!', fr: 'Bonus Réclamé !' }, // components/rewards/DailyBonusPopup.tsx:149
  'rewards.DailyBonusPopup.daily_bonus_available': {
    en: 'Daily Bonus Available!',
    fr: 'Bonus Quotidien Disponible !',
  }, // components/rewards/DailyBonusPopup.tsx:150
  'rewards.DailyBonusPopup.day_streak': { en: 'day streak', fr: 'jours consécutifs' }, // components/rewards/DailyBonusPopup.tsx:159
  'rewards.DailyBonusPopup.credits': { en: 'credits', fr: 'crédits' }, // components/rewards/DailyBonusPopup.tsx:171
  'rewards.DailyBonusPopup.includes_7day_streak': {
    en: 'Includes 7-day streak bonus!',
    fr: 'Inclut le bonus de 7 jours !',
  }, // components/rewards/DailyBonusPopup.tsx:179
  'rewards.DailyBonusPopup.credits_added_to': {
    en: 'Credits added to your account!',
    fr: 'Crédits ajoutés à votre compte !',
  }, // components/rewards/DailyBonusPopup.tsx:201
  'rewards.DailyBonusPopup.claiming': { en: 'Claiming...', fr: 'Réclamation...' }, // components/rewards/DailyBonusPopup.tsx:221
  'rewards.DailyBonusPopup.claim_your_bonus': {
    en: 'Claim Your Bonus',
    fr: 'Réclamer Votre Bonus',
  }, // components/rewards/DailyBonusPopup.tsx:226
  'rewards.DailyBonusPopup.maybe_later': { en: 'Maybe later', fr: 'Peut-être plus tard' }, // components/rewards/DailyBonusPopup.tsx:238
  'rewards.ReadingCompleteCelebration.mystery_bonus': {
    en: 'Mystery Bonus!',
    fr: 'Bonus Mystère !',
  }, // components/rewards/ReadingCompleteCelebration.t...
  'rewards.ReadingCompleteCelebration.credits': { en: 'credits', fr: 'crédits' }, // components/rewards/ReadingCompleteCelebration.t...
  'tarot.TarotCardsOverview.try_again': { en: 'Try Again', fr: 'Réessayer' }, // components/tarot/TarotCardsOverview.tsx:106
  'tarot.TarotCardsOverview.complete_guide': { en: 'Complete Guide', fr: 'Guide Complet' }, // components/tarot/TarotCardsOverview.tsx:137
  'tarot.TarotCardsOverview.the_tarot_deck': { en: 'The Tarot Deck', fr: 'Le Tarot' }, // components/tarot/TarotCardsOverview.tsx:142
  'tarot.TarotCardsOverview.ready_to_explore': {
    en: 'Ready to explore the full deck?',
    fr: 'Prêt à explorer le jeu complet ?',
  }, // components/tarot/TarotCardsOverview.tsx:208
  'tarot.TarotCardsOverview.browse_all_cards': {
    en: 'Browse All Cards',
    fr: 'Parcourir Toutes les Cartes',
  }, // components/tarot/TarotCardsOverview.tsx:213
  'tarot.TarotCardsOverview.get_a_reading': { en: 'Get a Reading', fr: 'Faire un Tirage' }, // components/tarot/TarotCardsOverview.tsx:217
  'tarot.TarotCategorySection.view_all_count': {
    en: 'View All ${count}',
    fr: 'Voir les ${count}',
  }, // components/tarot/TarotCategorySection.tsx:156
  'services.openrouterService.reversed': { en: '(Reversed)', fr: '(Renversée)' }, // services/openrouterService.ts:289
  'services.openrouterService.english': { en: 'English', fr: 'French' }, // services/openrouterService.ts:310
  'services.openrouterService.general_guidance': {
    en: 'General guidance',
    fr: 'Guidance générale',
  }, // services/openrouterService.ts:336
  'services.openrouterService.english_2': { en: 'English', fr: 'French' }, // services/openrouterService.ts:428
  'services.openrouterService.english_3': { en: 'English', fr: 'French' }, // services/openrouterService.ts:485
  'services.openrouterService.english_4': { en: 'English', fr: 'French' }, // services/openrouterService.ts:543
};
