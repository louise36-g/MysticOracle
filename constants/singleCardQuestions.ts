// constants/singleCardQuestions.ts

export type SingleCardCategory =
  | 'general'
  | 'love'
  | 'career'
  | 'decision'
  | 'healing';

export interface CategoryConfig {
  id: SingleCardCategory;
  labelEn: string;
  labelFr: string;
  iconName: string; // Lucide icon name
}

export interface CuratedQuestion {
  id: string;
  textEn: string;
  textFr: string;
}

export const SINGLE_CARD_CATEGORIES: CategoryConfig[] = [
  { id: 'general', labelEn: 'General Guidance', labelFr: 'Guidance Générale', iconName: 'Sparkles' },
  { id: 'love', labelEn: 'Love & Relationships', labelFr: 'Amour & Relations', iconName: 'Heart' },
  { id: 'career', labelEn: 'Career & Purpose', labelFr: 'Carrière & Vocation', iconName: 'Briefcase' },
  { id: 'decision', labelEn: 'Decision-Making', labelFr: 'Prise de Décision', iconName: 'Scale' },
  { id: 'healing', labelEn: 'Healing & Growth', labelFr: 'Guérison & Croissance', iconName: 'Leaf' },
];

export const SINGLE_CARD_QUESTIONS: Record<SingleCardCategory, CuratedQuestion[]> = {
  general: [
    { id: 'gen1', textEn: 'What do I most need to understand about this situation right now?', textFr: 'Que dois-je comprendre de cette situation en ce moment?' },
    { id: 'gen2', textEn: 'What energy is surrounding this issue?', textFr: 'Quelle énergie entoure cette situation?' },
    { id: 'gen3', textEn: 'What is being asked of me at this time?', textFr: "Qu'est-ce qui m'est demandé en ce moment?" },
    { id: 'gen4', textEn: 'What am I not seeing clearly?', textFr: 'Que ne vois-je pas clairement?' },
    { id: 'gen5', textEn: 'What would support my highest good in this situation?', textFr: "Qu'est-ce qui soutiendrait mon plus grand bien dans cette situation?" },
  ],
  love: [
    { id: 'love1', textEn: 'What is the deeper dynamic between me and this person?', textFr: 'Quelle est la dynamique profonde entre cette personne et moi?' },
    { id: 'love2', textEn: 'What can I learn from this connection?', textFr: 'Que puis-je apprendre de cette connexion?' },
    { id: 'love3', textEn: 'What role do I play in the current state of this relationship?', textFr: "Quel rôle je joue dans l'état actuel de cette relation?" },
    { id: 'love4', textEn: 'What would help me move forward in a healthy way?', textFr: "Qu'est-ce qui m'aiderait à avancer sainement?" },
    { id: 'love5', textEn: 'What is this relationship teaching me about myself?', textFr: "Que m'apprend cette relation sur moi-même?" },
  ],
  career: [
    { id: 'car1', textEn: 'What direction is most aligned with me right now?', textFr: 'Quelle direction est la plus alignée avec moi en ce moment?' },
    { id: 'car2', textEn: 'What strengths should I be leaning into at work?', textFr: "Sur quelles forces devrais-je m'appuyer au travail?" },
    { id: 'car3', textEn: 'What is blocking my progress, and how can I address it?', textFr: "Qu'est-ce qui bloque ma progression et comment y remédier?" },
    { id: 'car4', textEn: 'What opportunities am I overlooking?', textFr: 'Quelles opportunités est-ce que je néglige?' },
    { id: 'car5', textEn: 'What would success look like for me in this phase of my career?', textFr: 'À quoi ressemblerait le succès dans cette phase de ma carrière?' },
  ],
  decision: [
    { id: 'dec1', textEn: 'What are the key factors I should consider before deciding?', textFr: 'Quels sont les facteurs clés à considérer avant de décider?' },
    { id: 'dec2', textEn: 'What is the potential outcome if I choose this path?', textFr: 'Quel est le résultat potentiel si je choisis cette voie?' },
    { id: 'dec3', textEn: 'What fears or beliefs are influencing my choice?', textFr: 'Quelles peurs ou croyances influencent mon choix?' },
    { id: 'dec4', textEn: 'What would help me feel more confident in my decision?', textFr: "Qu'est-ce qui m'aiderait à me sentir plus confiant dans ma décision?" },
    { id: 'dec5', textEn: 'What is the long-term lesson connected to this choice?', textFr: 'Quelle est la leçon à long terme liée à ce choix?' },
  ],
  healing: [
    { id: 'heal1', textEn: 'What needs healing or attention within me right now?', textFr: "Qu'est-ce qui a besoin de guérison ou d'attention en moi maintenant?" },
    { id: 'heal2', textEn: 'What pattern am I being asked to release?', textFr: 'Quel schéma suis-je invité à libérer?' },
    { id: 'heal3', textEn: 'What would help me feel more balanced and grounded?', textFr: "Qu'est-ce qui m'aiderait à me sentir plus équilibré et ancré?" },
    { id: 'heal4', textEn: 'What inner strength can I draw on?', textFr: "Sur quelle force intérieure puis-je m'appuyer?" },
    { id: 'heal5', textEn: 'How can I best support my own growth at this time?', textFr: 'Comment puis-je soutenir ma propre croissance en ce moment?' },
  ],
};

// Helper text shown when user chooses to write their own question
export const CUSTOM_QUESTION_HELPER = {
  en: 'Open-ended questions work best. Try "What can I learn from..." or "What do I need to understand about..."',
  fr: 'Les questions ouvertes fonctionnent mieux. Essayez "Que puis-je apprendre de..." ou "Que dois-je comprendre de..."',
};

// Link to blog article about asking good questions
export const QUESTION_GUIDE_LINK = '/blog/how-to-ask-good-tarot-questions';
