// constants/twoCardLayouts.ts

export type TwoCardLayoutId =
  | 'yes_no'
  | 'situation_guidance'
  | 'challenge_strength'
  | 'light_shadow'
  | 'question_answer'
  | 'inner_outer'
  | 'for_and_against'
  | 'custom';

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
  yes_no: {
    id: 'yes_no',
    labelEn: 'Yes / No',
    labelFr: 'Oui / Non',
    taglineEn: 'A clear two-card answer to your yes-or-no question. One card leans toward yes, the other toward no — together they reveal the energy around your decision.',
    taglineFr: 'Une réponse claire en deux cartes à votre question oui/non. L\'une penche vers oui, l\'autre vers non — ensemble elles révèlent l\'énergie autour de votre décision.',
    positions: {
      en: ['Leaning Yes', 'Leaning No'],
      fr: ['Tendance Oui', 'Tendance Non'],
    },
    shortPositions: {
      en: ['Yes', 'No'],
      fr: ['Oui', 'Non'],
    },
  },
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
  for_and_against: {
    id: 'for_and_against',
    labelEn: 'For & Against',
    labelFr: 'Pour & Contre',
    taglineEn: 'Explore the energies supporting and resisting a decision. Tarot does not predict fixed outcomes but can illuminate the forces around a choice.',
    taglineFr: 'Explorez les énergies qui soutiennent et résistent à une décision. Le tarot ne prédit pas des résultats fixes mais peut éclairer les forces autour d\'un choix.',
    positions: {
      en: ['Energy For', 'Energy Against'],
      fr: ['Énergie Pour', 'Énergie Contre'],
    },
    shortPositions: {
      en: ['For', 'Against'],
      fr: ['Pour', 'Contre'],
    },
  },
  custom: {
    id: 'custom',
    labelEn: 'Your Layout',
    labelFr: 'Votre Tirage',
    taglineEn: 'Define your own card positions. Name each card\'s role to match the question you had in mind.',
    taglineFr: 'Définissez vos propres positions. Nommez le rôle de chaque carte selon la question que vous aviez en tête.',
    positions: {
      en: ['Card 1', 'Card 2'],
      fr: ['Carte 1', 'Carte 2'],
    },
    shortPositions: {
      en: ['Card 1', 'Card 2'],
      fr: ['Carte 1', 'Carte 2'],
    },
  },
};

// Suggested questions per layout (3 per layout)
export const TWO_CARD_LAYOUT_QUESTIONS: Record<TwoCardLayoutId, TwoCardQuestion[]> = {
  yes_no: [
    { id: 'tc_yn1', textEn: 'Should I move forward with this decision?', textFr: 'Dois-je avancer avec cette décision ?' },
    { id: 'tc_yn2', textEn: 'Is this the right path for me right now?', textFr: 'Est-ce le bon chemin pour moi en ce moment ?' },
    { id: 'tc_yn3', textEn: 'Will this choice bring me closer to what I need?', textFr: 'Ce choix me rapprochera-t-il de ce dont j\'ai besoin ?' },
  ],
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
  for_and_against: [
    { id: 'tc_fa1', textEn: 'What energies support and resist this decision?', textFr: 'Quelles énergies soutiennent et résistent à cette décision ?' },
    { id: 'tc_fa2', textEn: 'What is working for me and what is working against me right now?', textFr: 'Qu\'est-ce qui joue en ma faveur et qu\'est-ce qui joue contre moi en ce moment ?' },
    { id: 'tc_fa3', textEn: 'What forces are pulling me forward and what is holding me back?', textFr: 'Quelles forces me tirent en avant et qu\'est-ce qui me retient ?' },
  ],
  custom: [
    { id: 'tc_cu1', textEn: 'What do I need to understand about this situation?', textFr: 'Que dois-je comprendre de cette situation ?' },
    { id: 'tc_cu2', textEn: 'What is my heart telling me and what is my head telling me?', textFr: 'Que me dit mon cœur et que me dit ma tête ?' },
    { id: 'tc_cu3', textEn: 'What do I need to let go of and what do I need to embrace?', textFr: 'De quoi dois-je me libérer et qu\'est-ce que je dois accueillir ?' },
  ],
};
