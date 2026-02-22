// constants/categoryQuestions.ts
// Category-specific suggested questions for each depth level

import type { ReadingCategory } from '../types';

interface SuggestedQuestion {
  id: string;
  textEn: string;
  textFr: string;
}

type QuestionsByDepth = Partial<Record<number, SuggestedQuestion[]>>;

const CATEGORY_QUESTIONS: Partial<Record<ReadingCategory, QuestionsByDepth>> = {
  // ============================================
  // GENERAL GUIDANCE
  // ============================================
  general: {
    1: [
      {
        id: 'gen_1_1',
        textEn: 'What energy most needs my attention right now?',
        textFr: 'Quelle énergie a le plus besoin de mon attention en ce moment ?',
      },
      {
        id: 'gen_1_2',
        textEn: 'What is my inner wisdom inviting me to see today?',
        textFr: "Que m'invite à voir ma sagesse intérieure aujourd'hui ?",
      },
      {
        id: 'gen_1_3',
        textEn: 'What is the most important thing for me to understand in this moment?',
        textFr: 'Quelle est la chose la plus importante à comprendre en ce moment ?',
      },
    ],
    2: [
      {
        id: 'gen_2_1',
        textEn: 'What is holding me back, and what will help me move forward?',
        textFr: "Qu'est-ce qui me retient, et qu'est-ce qui m'aidera à avancer ?",
      },
      {
        id: 'gen_2_2',
        textEn: 'What do I need to release, and what do I need to embrace?',
        textFr: 'De quoi dois-je me libérer, et que dois-je accueillir ?',
      },
      {
        id: 'gen_2_3',
        textEn: 'What is my head telling me, and what is my heart telling me?',
        textFr: 'Que me dit ma tête, et que me dit mon cœur ?',
      },
    ],
    3: [
      {
        id: 'gen_3_1',
        textEn: 'What is the story of where I am right now?',
        textFr: "Quelle est l'histoire de là où j'en suis en ce moment ?",
      },
      {
        id: 'gen_3_2',
        textEn: 'What is this moment in my life truly asking of me?',
        textFr: "Que me demande véritablement ce moment de ma vie ?",
      },
      {
        id: 'gen_3_3',
        textEn: 'What is ready to shift in my life right now?',
        textFr: "Qu'est-ce qui est prêt à changer dans ma vie en ce moment ?",
      },
    ],
    5: [
      {
        id: 'gen_5_1',
        textEn: 'What do I most need to understand about where I am right now?',
        textFr: "Que dois-je comprendre avant tout sur là où j'en suis ?",
      },
      {
        id: 'gen_5_2',
        textEn: 'What is truly at the heart of what I am going through?',
        textFr: "Qu'est-ce qui se trouve véritablement au cœur de ce que je traverse ?",
      },
      {
        id: 'gen_5_3',
        textEn: 'What is ready to shift in my life if I am willing to look honestly?',
        textFr: "Qu'est-ce qui est prêt à changer dans ma vie si j'accepte de regarder honnêtement ?",
      },
    ],
    7: [
      {
        id: 'gen_7_1',
        textEn: 'What deeper pattern in my life is asking to be seen and understood?',
        textFr: 'Quel schéma profond dans ma vie demande à être vu et compris ?',
      },
      {
        id: 'gen_7_2',
        textEn: 'What truth about myself am I ready to face with compassion and courage?',
        textFr: 'Quelle vérité sur moi-même suis-je prêt(e) à affronter avec compassion et courage ?',
      },
      {
        id: 'gen_7_3',
        textEn: 'What is my soul genuinely calling me toward right now?',
        textFr: "Vers quoi mon âme m'appelle-t-elle véritablement en ce moment ?",
      },
    ],
    10: [
      {
        id: 'gen_10_1',
        textEn: 'What is the full story of where I am, and where my path is leading me?',
        textFr: "Quelle est l'histoire complète de là où j'en suis, et où mon chemin me mène ?",
      },
      {
        id: 'gen_10_2',
        textEn: 'What do I most need to understand about this chapter of my life?',
        textFr: 'Que dois-je comprendre avant tout sur ce chapitre de ma vie ?',
      },
      {
        id: 'gen_10_3',
        textEn: 'What would change in my life if I fully trusted my own inner wisdom?',
        textFr: "Qu'est-ce qui changerait dans ma vie si je faisais pleinement confiance à ma sagesse intérieure ?",
      },
    ],
  },

  // ============================================
  // SPIRITUAL / WELLBEING
  // ============================================
  life_path: {
    1: [
      {
        id: 'sp_1_1',
        textEn: 'What is my spirit most needing right now?',
        textFr: "De quoi mon esprit a-t-il le plus besoin en ce moment ?",
      },
      {
        id: 'sp_1_2',
        textEn: 'What is my inner wisdom inviting me to connect with today?',
        textFr: "À quoi ma sagesse intérieure m'invite-t-elle à me connecter aujourd'hui ?",
      },
      {
        id: 'sp_1_3',
        textEn: 'What spiritual energy is present in my life at this moment?',
        textFr: 'Quelle énergie spirituelle est présente dans ma vie en ce moment ?',
      },
    ],
    2: [
      {
        id: 'sp_2_1',
        textEn: 'What is disconnecting me from my spiritual path, and what will help me reconnect?',
        textFr: "Qu'est-ce qui me déconnecte de mon chemin spirituel, et qu'est-ce qui m'aidera à me reconnecter ?",
      },
      {
        id: 'sp_2_2',
        textEn: 'What is my soul releasing, and what is it welcoming in?',
        textFr: "De quoi mon âme se libère-t-elle, et qu'accueille-t-elle ?",
      },
      {
        id: 'sp_2_3',
        textEn: 'What is blocking my inner peace, and what will restore it?',
        textFr: "Qu'est-ce qui bloque ma paix intérieure, et qu'est-ce qui la restaurera ?",
      },
    ],
    3: [
      {
        id: 'sp_3_1',
        textEn: 'What is the current story of my spiritual journey?',
        textFr: "Quelle est l'histoire actuelle de mon parcours spirituel ?",
      },
      {
        id: 'sp_3_2',
        textEn: 'Where is my soul truly leading me right now?',
        textFr: 'Où mon âme me guide-t-elle véritablement en ce moment ?',
      },
      {
        id: 'sp_3_3',
        textEn: 'What is my spirit ready to transform?',
        textFr: 'Que mon esprit est-il prêt à transformer ?',
      },
    ],
    5: [
      {
        id: 'sp_5_1',
        textEn: 'What does my soul most need me to understand right now?',
        textFr: "Que mon âme a-t-elle le plus besoin que je comprenne en ce moment ?",
      },
      {
        id: 'sp_5_2',
        textEn: 'What spiritual truth is ready to emerge in my life?',
        textFr: 'Quelle vérité spirituelle est prête à émerger dans ma vie ?',
      },
      {
        id: 'sp_5_3',
        textEn: 'What is my inner self genuinely calling me to explore?',
        textFr: "Que mon moi intérieur m'appelle-t-il véritablement à explorer ?",
      },
    ],
    7: [
      {
        id: 'sp_7_1',
        textEn: 'What deeper spiritual awakening is quietly unfolding within me?',
        textFr: 'Quel éveil spirituel plus profond se déploie silencieusement en moi ?',
      },
      {
        id: 'sp_7_2',
        textEn: 'What is my soul ready to heal, release and transform?',
        textFr: 'Que mon âme est-elle prête à guérir, libérer et transformer ?',
      },
      {
        id: 'sp_7_3',
        textEn: 'What would my life look like if I fully honoured my spiritual path?',
        textFr: "À quoi ressemblerait ma vie si j'honorais pleinement mon chemin spirituel ?",
      },
    ],
    10: [
      {
        id: 'sp_10_1',
        textEn: 'What is the full story of my spiritual journey and where it is leading me?',
        textFr: "Quelle est l'histoire complète de mon parcours spirituel et où il me mène ?",
      },
      {
        id: 'sp_10_2',
        textEn: 'What does my soul most need to understand about this season of my life?',
        textFr: "Que mon âme a-t-elle le plus besoin de comprendre sur cette saison de ma vie ?",
      },
      {
        id: 'sp_10_3',
        textEn: 'What would open up in my life if I truly listened to my inner spiritual wisdom?',
        textFr: "Que s'ouvrirait-il dans ma vie si j'écoutais véritablement ma sagesse spirituelle intérieure ?",
      },
    ],
  },

  // ============================================
  // PERSONAL GROWTH
  // ============================================
  growth: {
    1: [
      {
        id: 'gr_1_1',
        textEn: 'What aspect of myself is most ready to grow right now?',
        textFr: 'Quel aspect de moi-même est le plus prêt à grandir en ce moment ?',
      },
      {
        id: 'gr_1_2',
        textEn: 'What is life inviting me to learn about myself today?',
        textFr: "Qu'est-ce que la vie m'invite à apprendre sur moi-même aujourd'hui ?",
      },
      {
        id: 'gr_1_3',
        textEn: 'What quality within me is waiting to be acknowledged and developed?',
        textFr: "Quelle qualité en moi attend d'être reconnue et développée ?",
      },
    ],
    2: [
      {
        id: 'gr_2_1',
        textEn: 'What old version of myself am I being asked to release, and who am I becoming?',
        textFr: 'Quelle ancienne version de moi-même suis-je invité(e) à libérer, et qui suis-je en train de devenir ?',
      },
      {
        id: 'gr_2_2',
        textEn: 'What is holding my growth back, and what will set it free?',
        textFr: "Qu'est-ce qui freine ma croissance, et qu'est-ce qui la libérera ?",
      },
      {
        id: 'gr_2_3',
        textEn: 'What pattern am I repeating, and what would it mean to finally break it?',
        textFr: 'Quel schéma suis-je en train de répéter, et que signifierait de le briser enfin ?',
      },
    ],
    3: [
      {
        id: 'gr_3_1',
        textEn: 'What is the story of who I am becoming?',
        textFr: "Quelle est l'histoire de qui je suis en train de devenir ?",
      },
      {
        id: 'gr_3_2',
        textEn: 'Where is my personal journey truly leading me?',
        textFr: 'Où mon parcours personnel me mène-t-il véritablement ?',
      },
      {
        id: 'gr_3_3',
        textEn: 'What within me is ready to transform and grow?',
        textFr: "Qu'est-ce qui en moi est prêt à se transformer et à grandir ?",
      },
    ],
    5: [
      {
        id: 'gr_5_1',
        textEn: 'What is the most important truth about myself that I am ready to face?',
        textFr: 'Quelle est la vérité la plus importante sur moi-même que je suis prêt(e) à affronter ?',
      },
      {
        id: 'gr_5_2',
        textEn: 'What chapter of my personal growth is genuinely ready to begin?',
        textFr: 'Quel chapitre de mon développement personnel est véritablement prêt à commencer ?',
      },
      {
        id: 'gr_5_3',
        textEn: 'What would change in my life if I fully believed in my own potential?',
        textFr: "Qu'est-ce qui changerait dans ma vie si je croyais pleinement en mon propre potentiel ?",
      },
    ],
    7: [
      {
        id: 'gr_7_1',
        textEn: 'What deeper pattern of growth is trying to emerge in my life right now?',
        textFr: 'Quel schéma de croissance plus profond cherche à émerger dans ma vie en ce moment ?',
      },
      {
        id: 'gr_7_2',
        textEn: 'What am I truly capable of that I have not yet allowed myself to become?',
        textFr: 'De quoi suis-je véritablement capable que je ne me suis pas encore permis(e) de devenir ?',
      },
      {
        id: 'gr_7_3',
        textEn: 'What would my life look like if I stepped fully into my own power?',
        textFr: "À quoi ressemblerait ma vie si j'entrais pleinement dans ma propre puissance ?",
      },
    ],
    10: [
      {
        id: 'gr_10_1',
        textEn: 'What is the full story of who I am becoming and what my growth is leading me toward?',
        textFr: "Quelle est l'histoire complète de qui je suis en train de devenir et vers quoi ma croissance me mène ?",
      },
      {
        id: 'gr_10_2',
        textEn: 'What do I most need to understand about this transformative chapter of my life?',
        textFr: 'Que dois-je comprendre avant tout sur ce chapitre transformateur de ma vie ?',
      },
      {
        id: 'gr_10_3',
        textEn: 'What would become possible if I committed fully to my own growth and healing?',
        textFr: "Que deviendrait possible si je m'engageais pleinement dans ma propre croissance et guérison ?",
      },
    ],
  },
};

/**
 * Get category-specific suggested questions for a given category and depth.
 * Returns null if no specific questions are defined (falls back to existing system).
 */
export function getCategoryQuestions(
  category: ReadingCategory,
  depth: number
): SuggestedQuestion[] | null {
  const categoryData = CATEGORY_QUESTIONS[category];
  if (!categoryData) return null;
  return categoryData[depth] ?? null;
}
