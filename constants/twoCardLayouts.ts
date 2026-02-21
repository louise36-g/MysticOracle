// constants/twoCardLayouts.ts

export type TwoCardLayoutId =
  | 'situation_guidance'
  | 'challenge_strength'
  | 'light_shadow'
  | 'question_answer'
  | 'inner_outer';

export interface TwoCardLayout {
  id: TwoCardLayoutId;
  labelEn: string;
  labelFr: string;
  taglineEn: string;
  taglineFr: string;
  positions: {
    en: [string, string];
    fr: [string, string];
  };
  /** Short position names for compact display */
  shortPositions: {
    en: [string, string];
    fr: [string, string];
  };
}

export interface TwoCardQuestion {
  id: string;
  textEn: string;
  textFr: string;
}

// Layout definitions
export const TWO_CARD_LAYOUTS: Record<TwoCardLayoutId, TwoCardLayout> = {
  situation_guidance: {
    id: 'situation_guidance',
    labelEn: 'Situation & Guidance',
    labelFr: 'Situation & Guidance',
    taglineEn: 'See where you stand and what step to take next. A clear snapshot of your current reality paired with direction.',
    taglineFr: 'Voyez où vous en êtes et quel pas faire ensuite. Un aperçu clair de votre réalité actuelle accompagné d\'une direction.',
    positions: {
      en: ['The Situation', 'The Guidance'],
      fr: ['La Situation', 'La Guidance'],
    },
    shortPositions: {
      en: ['Situation', 'Guidance'],
      fr: ['Situation', 'Guidance'],
    },
  },
  challenge_strength: {
    id: 'challenge_strength',
    labelEn: 'Challenge & Strength',
    labelFr: 'Défi & Force',
    taglineEn: 'Understand what you are facing and the inner resource you already have to meet it.',
    taglineFr: 'Comprenez ce que vous affrontez et la ressource intérieure que vous possédez déjà pour y faire face.',
    positions: {
      en: ['The Challenge', 'Your Strength'],
      fr: ['Le Défi', 'Votre Force'],
    },
    shortPositions: {
      en: ['Challenge', 'Strength'],
      fr: ['Défi', 'Force'],
    },
  },
  light_shadow: {
    id: 'light_shadow',
    labelEn: 'Light & Shadow',
    labelFr: 'Lumière & Ombre',
    taglineEn: 'Explore the visible and hidden sides of your situation. What shines and what remains unseen.',
    taglineFr: 'Explorez les côtés visible et caché de votre situation. Ce qui brille et ce qui reste invisible.',
    positions: {
      en: ['The Light', 'The Shadow'],
      fr: ['La Lumière', 'L\'Ombre'],
    },
    shortPositions: {
      en: ['Light', 'Shadow'],
      fr: ['Lumière', 'Ombre'],
    },
  },
  question_answer: {
    id: 'question_answer',
    labelEn: 'Question & Answer',
    labelFr: 'Question & Réponse',
    taglineEn: 'A direct dialogue with the cards. One card reflects your question, the other offers the universe\'s response.',
    taglineFr: 'Un dialogue direct avec les cartes. L\'une reflète votre question, l\'autre offre la réponse de l\'univers.',
    positions: {
      en: ['Your Question', 'The Answer'],
      fr: ['Votre Question', 'La Réponse'],
    },
    shortPositions: {
      en: ['Question', 'Answer'],
      fr: ['Question', 'Réponse'],
    },
  },
  inner_outer: {
    id: 'inner_outer',
    labelEn: 'Inner & Outer',
    labelFr: 'Intérieur & Extérieur',
    taglineEn: 'Bridge your inner world and outer reality. See how your feelings shape your circumstances.',
    taglineFr: 'Reliez votre monde intérieur et votre réalité extérieure. Voyez comment vos émotions façonnent vos circonstances.',
    positions: {
      en: ['Your Inner World', 'Your Outer Reality'],
      fr: ['Votre Monde Intérieur', 'Votre Réalité Extérieure'],
    },
    shortPositions: {
      en: ['Inner', 'Outer'],
      fr: ['Intérieur', 'Extérieur'],
    },
  },
};

// Suggested questions per layout (3 per layout)
export const TWO_CARD_LAYOUT_QUESTIONS: Record<TwoCardLayoutId, TwoCardQuestion[]> = {
  situation_guidance: [
    { id: 'tc_sg1', textEn: 'What do I most need to see and do right now?', textFr: 'Que dois-je voir et faire en ce moment ?' },
    { id: 'tc_sg2', textEn: 'Where am I stuck and what will help me move forward?', textFr: 'Où suis-je bloqué(e) et qu\'est-ce qui m\'aidera à avancer ?' },
    { id: 'tc_sg3', textEn: 'What is the truth of my situation and what step serves me best?', textFr: 'Quelle est la vérité de ma situation et quel pas me servira le mieux ?' },
  ],
  challenge_strength: [
    { id: 'tc_cs1', textEn: 'What challenge am I facing and what strength can I draw on?', textFr: 'Quel défi est-ce que j\'affronte et quelle force puis-je mobiliser ?' },
    { id: 'tc_cs2', textEn: 'What obstacle stands before me and what gift do I already carry?', textFr: 'Quel obstacle se dresse devant moi et quel don est-ce que je porte déjà ?' },
    { id: 'tc_cs3', textEn: 'What is testing me and where is my resilience hiding?', textFr: 'Qu\'est-ce qui me met à l\'épreuve et où se cache ma résilience ?' },
  ],
  light_shadow: [
    { id: 'tc_ls1', textEn: 'What am I seeing clearly and what am I avoiding?', textFr: 'Que vois-je clairement et qu\'est-ce que j\'évite ?' },
    { id: 'tc_ls2', textEn: 'What shines in my life and what hides beneath the surface?', textFr: 'Qu\'est-ce qui brille dans ma vie et qu\'est-ce qui se cache sous la surface ?' },
    { id: 'tc_ls3', textEn: 'What truth is in the open and what truth am I not ready to face?', textFr: 'Quelle vérité est au grand jour et quelle vérité ne suis-je pas prêt(e) à affronter ?' },
  ],
  question_answer: [
    { id: 'tc_qa1', textEn: 'What answer does the universe have for me today?', textFr: 'Quelle réponse l\'univers a-t-il pour moi aujourd\'hui ?' },
    { id: 'tc_qa2', textEn: 'What is the heart of my question and what wisdom awaits?', textFr: 'Quel est le cœur de ma question et quelle sagesse m\'attend ?' },
    { id: 'tc_qa3', textEn: 'What am I truly asking and what do I truly need to hear?', textFr: 'Que suis-je en train de demander vraiment et qu\'ai-je vraiment besoin d\'entendre ?' },
  ],
  inner_outer: [
    { id: 'tc_io1', textEn: 'How are my inner feelings shaping my outer world?', textFr: 'Comment mes sentiments intérieurs façonnent-ils mon monde extérieur ?' },
    { id: 'tc_io2', textEn: 'What lives inside me and how does it show up in my life?', textFr: 'Qu\'est-ce qui vit en moi et comment cela se manifeste-t-il dans ma vie ?' },
    { id: 'tc_io3', textEn: 'Where is there a gap between how I feel and what I show the world?', textFr: 'Où y a-t-il un écart entre ce que je ressens et ce que je montre au monde ?' },
  ],
};
