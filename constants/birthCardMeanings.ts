// constants/birthCardMeanings.ts
// Birth Card meanings and calculation logic for the Birth Cards feature
// Soul Cards and Personality Cards are derived from the birth date through numerological reduction

/**
 * Interface for Birth Card meaning data
 * Each Major Arcana (0-21) has specific meanings when appearing as a Soul Card vs Personality Card
 */
export interface BirthCardMeaning {
  id: number; // 0-21 for Major Arcana
  nameEn: string;
  nameFr: string;
  soulMeaningEn: string;
  soulMeaningFr: string;
  personalityMeaningEn: string;
  personalityMeaningFr: string;
}

/**
 * Year Card configuration for the current year
 * The Year Card is calculated by reducing the year to a single Major Arcana
 * 2026: 2+0+2+6 = 10 (Wheel of Fortune)
 */
export const YEAR_CARD_2026 = {
  year: 2026,
  cardId: 10, // 2+0+2+6 = 10 (Wheel of Fortune)
  meaningEn:
    'The Wheel of Fortune governs 2026, bringing cycles of change, karmic turning points, and unexpected opportunities. This year favors those who embrace uncertainty and flow with life\'s rhythms rather than resist them. Major life chapters may close as new ones begin - trust the cosmic timing.',
  meaningFr:
    'La Roue de Fortune gouverne 2026, apportant des cycles de changement, des tournants karmiques et des opportunites inattendues. Cette annee favorise ceux qui embrassent l\'incertitude et suivent les rythmes de la vie plutot que de leur resister. Des chapitres majeurs peuvent se clore tandis que de nouveaux commencent - faites confiance au timing cosmique.',
};

/**
 * Complete Birth Card meanings for all 22 Major Arcana
 * Each card has distinct interpretations for Soul (inner purpose) vs Personality (outer expression)
 */
export const BIRTH_CARD_MEANINGS: BirthCardMeaning[] = [
  {
    id: 0,
    nameEn: 'The Fool',
    nameFr: 'Le Mat',
    soulMeaningEn:
      'Your soul chose the path of pure potential and unlimited possibility. You came here to learn the art of beginning, to embrace the unknown with childlike wonder, and to trust the journey even when you cannot see the destination. Your deepest lesson is to release fear and leap into life.',
    soulMeaningFr:
      'Votre ame a choisi le chemin du potentiel pur et de la possibilite illimitee. Vous etes venu ici pour apprendre l\'art du commencement, pour embrasser l\'inconnu avec l\'emerveillement d\'un enfant, et pour faire confiance au voyage meme quand vous ne pouvez voir la destination. Votre lecon la plus profonde est de liberer la peur et de vous lancer dans la vie.',
    personalityMeaningEn:
      'Others see you as spontaneous, free-spirited, and refreshingly unconventional. You naturally inspire people to take chances and think outside established patterns. Your presence often brings a sense of new beginnings and fresh perspectives to any situation.',
    personalityMeaningFr:
      'Les autres vous voient comme spontane, libre d\'esprit et rafraichissant de non-conformisme. Vous inspirez naturellement les gens a prendre des risques et a penser en dehors des schemas etablis. Votre presence apporte souvent un sentiment de nouveaux departs et de perspectives fraiches.',
  },
  {
    id: 1,
    nameEn: 'The Magician',
    nameFr: 'Le Bateleur',
    soulMeaningEn:
      'Your soul incarnated to master the art of manifestation and conscious creation. You came here to learn how to channel universal energy into tangible form, to bridge the spiritual and material worlds. Your deepest lesson is understanding that you have all the tools you need - the power lies in how you use them.',
    soulMeaningFr:
      'Votre ame s\'est incarnee pour maitriser l\'art de la manifestation et de la creation consciente. Vous etes venu ici pour apprendre a canaliser l\'energie universelle en forme tangible, pour relier les mondes spirituel et materiel. Votre lecon la plus profonde est de comprendre que vous avez tous les outils necessaires - le pouvoir reside dans la facon dont vous les utilisez.',
    personalityMeaningEn:
      'Others perceive you as resourceful, capable, and naturally skilled at bringing ideas to life. You project an aura of competence and focused willpower. People often turn to you when they need someone who can make things happen and transform vision into reality.',
    personalityMeaningFr:
      'Les autres vous percoivent comme plein de ressources, capable et naturellement doue pour donner vie aux idees. Vous projetez une aura de competence et de volonte concentree. Les gens se tournent souvent vers vous quand ils ont besoin de quelqu\'un qui peut faire bouger les choses et transformer la vision en realite.',
  },
  {
    id: 2,
    nameEn: 'The High Priestess',
    nameFr: 'La Papesse',
    soulMeaningEn:
      'Your soul chose the path of deep intuition and sacred mystery. You came here to access hidden knowledge, to trust your inner voice above external noise, and to understand that the most profound truths often cannot be spoken. Your deepest lesson is learning to honor the wisdom that arises from stillness and receptivity.',
    soulMeaningFr:
      'Votre ame a choisi le chemin de l\'intuition profonde et du mystere sacre. Vous etes venu ici pour acceder aux connaissances cachees, pour faire confiance a votre voix interieure au-dessus du bruit exterieur, et pour comprendre que les verites les plus profondes ne peuvent souvent pas etre exprimees. Votre lecon la plus profonde est d\'apprendre a honorer la sagesse qui emerge du calme et de la receptivite.',
    personalityMeaningEn:
      'Others sense a depth and mystery about you that invites curiosity. You project an aura of quiet wisdom and intuitive knowing. People often confide in you, sensing that you understand more than you say and hold space for the unspoken.',
    personalityMeaningFr:
      'Les autres ressentent une profondeur et un mystere en vous qui invitent a la curiosite. Vous projetez une aura de sagesse tranquille et de savoir intuitif. Les gens se confient souvent a vous, sentant que vous comprenez plus que vous ne dites et que vous gardez l\'espace pour le non-dit.',
  },
  {
    id: 3,
    nameEn: 'The Empress',
    nameFr: "L'Imperatrice",
    soulMeaningEn:
      'Your soul incarnated to embody creative abundance and nurturing love. You came here to learn the power of growth, fertility in all its forms, and the profound strength found in gentleness. Your deepest lesson is understanding that true abundance flows from giving and receiving in harmony with nature\'s rhythms.',
    soulMeaningFr:
      'Votre ame s\'est incarnee pour incarner l\'abondance creative et l\'amour nourricier. Vous etes venu ici pour apprendre le pouvoir de la croissance, la fertilite sous toutes ses formes, et la force profonde trouvee dans la douceur. Votre lecon la plus profonde est de comprendre que la vraie abondance coule du donner et recevoir en harmonie avec les rythmes de la nature.',
    personalityMeaningEn:
      'Others experience you as warm, nurturing, and naturally abundant. You project an aura of creative fertility and sensory appreciation. People are drawn to your ability to make environments feel welcoming and to help things flourish.',
    personalityMeaningFr:
      'Les autres vous experimentent comme chaleureux, nourricier et naturellement abondant. Vous projetez une aura de fertilite creative et d\'appreciation sensorielle. Les gens sont attires par votre capacite a rendre les environnements accueillants et a aider les choses a s\'epanouir.',
  },
  {
    id: 4,
    nameEn: 'The Emperor',
    nameFr: "L'Empereur",
    soulMeaningEn:
      'Your soul chose the path of structure, authority, and protective leadership. You came here to learn how to build lasting foundations, to exercise power responsibly, and to understand that true strength includes the discipline to maintain order. Your deepest lesson is balancing authority with wisdom and control with compassion.',
    soulMeaningFr:
      'Votre ame a choisi le chemin de la structure, de l\'autorite et du leadership protecteur. Vous etes venu ici pour apprendre a construire des fondations durables, a exercer le pouvoir de maniere responsable, et a comprendre que la vraie force inclut la discipline pour maintenir l\'ordre. Votre lecon la plus profonde est d\'equilibrer l\'autorite avec la sagesse et le controle avec la compassion.',
    personalityMeaningEn:
      'Others see you as a natural leader with inherent authority and stability. You project strength, reliability, and the ability to take charge when needed. People instinctively look to you for guidance and feel secure in your presence.',
    personalityMeaningFr:
      'Les autres vous voient comme un leader naturel avec une autorite inherente et une stabilite. Vous projetez la force, la fiabilite et la capacite de prendre les choses en main quand necessaire. Les gens se tournent instinctivement vers vous pour etre guides et se sentent en securite en votre presence.',
  },
  {
    id: 5,
    nameEn: 'The Hierophant',
    nameFr: 'Le Pape',
    soulMeaningEn:
      'Your soul incarnated to bridge tradition and spiritual wisdom. You came here to learn the value of established teachings, to find the sacred within structured paths, and to potentially become a teacher yourself. Your deepest lesson is discerning which traditions carry timeless truth and which need to evolve.',
    soulMeaningFr:
      'Votre ame s\'est incarnee pour relier la tradition et la sagesse spirituelle. Vous etes venu ici pour apprendre la valeur des enseignements etablis, pour trouver le sacre dans les chemins structures, et pour potentiellement devenir vous-meme un enseignant. Votre lecon la plus profonde est de discerner quelles traditions portent une verite intemporelle et lesquelles doivent evoluer.',
    personalityMeaningEn:
      'Others perceive you as wise, traditional, and spiritually grounded. You project an aura of moral authority and trustworthiness. People often seek your counsel on matters of ethics, meaning, and the right way to approach life\'s challenges.',
    personalityMeaningFr:
      'Les autres vous percoivent comme sage, traditionnel et spirituellement ancre. Vous projetez une aura d\'autorite morale et de fiabilite. Les gens recherchent souvent vos conseils sur les questions d\'ethique, de sens et la bonne facon d\'aborder les defis de la vie.',
  },
  {
    id: 6,
    nameEn: 'The Lovers',
    nameFr: "L'Amoureux",
    soulMeaningEn:
      'Your soul chose the path of sacred relationship and meaningful choice. You came here to learn about love in its highest form, to understand the alchemy of union, and to face the crossroads where heart and head must align. Your deepest lesson is learning that every choice shapes who you become.',
    soulMeaningFr:
      'Votre ame a choisi le chemin de la relation sacree et du choix significatif. Vous etes venu ici pour apprendre l\'amour dans sa forme la plus elevee, pour comprendre l\'alchimie de l\'union, et pour faire face aux carrefours ou le coeur et la tete doivent s\'aligner. Votre lecon la plus profonde est d\'apprendre que chaque choix faconne qui vous devenez.',
    personalityMeaningEn:
      'Others experience you as harmonious, relationship-oriented, and capable of deep connection. You project warmth and an ability to bring people together. People are drawn to your capacity for creating meaningful bonds and helping others navigate matters of the heart.',
    personalityMeaningFr:
      'Les autres vous experimentent comme harmonieux, oriente vers les relations et capable de connexion profonde. Vous projetez de la chaleur et une capacite a rassembler les gens. Les gens sont attires par votre capacite a creer des liens significatifs et a aider les autres a naviguer les affaires de coeur.',
  },
  {
    id: 7,
    nameEn: 'The Chariot',
    nameFr: 'Le Chariot',
    soulMeaningEn:
      'Your soul incarnated to master willpower and directed movement. You came here to learn how to harness opposing forces, to achieve victory through determined focus, and to understand that true progress requires inner alignment. Your deepest lesson is discovering that the greatest conquests are those over your own nature.',
    soulMeaningFr:
      'Votre ame s\'est incarnee pour maitriser la volonte et le mouvement dirige. Vous etes venu ici pour apprendre a maitriser les forces opposees, a atteindre la victoire par une concentration determinee, et a comprendre que le vrai progres necessite un alignement interieur. Votre lecon la plus profonde est de decouvrir que les plus grandes conquetes sont celles sur votre propre nature.',
    personalityMeaningEn:
      'Others see you as driven, ambitious, and capable of remarkable achievement. You project an aura of determination and forward momentum. People respect your ability to overcome obstacles and reach destinations that others might abandon.',
    personalityMeaningFr:
      'Les autres vous voient comme motive, ambitieux et capable de realisations remarquables. Vous projetez une aura de determination et d\'elan vers l\'avant. Les gens respectent votre capacite a surmonter les obstacles et a atteindre des destinations que d\'autres pourraient abandonner.',
  },
  {
    id: 8,
    nameEn: 'Strength',
    nameFr: 'La Force',
    soulMeaningEn:
      'Your soul chose the path of gentle power and courageous heart. You came here to learn that true strength lies in patience and compassion, not force. Your deepest lesson is understanding that the wildest aspects of yourself can be embraced and transformed through love rather than suppression.',
    soulMeaningFr:
      'Votre ame a choisi le chemin de la puissance douce et du coeur courageux. Vous etes venu ici pour apprendre que la vraie force reside dans la patience et la compassion, pas dans la force. Votre lecon la plus profonde est de comprendre que les aspects les plus sauvages de vous-meme peuvent etre embrasses et transformes par l\'amour plutot que la suppression.',
    personalityMeaningEn:
      'Others perceive you as calm under pressure, genuinely brave, and capable of handling difficult situations with grace. You project quiet confidence and inner fortitude. People feel safe around you, sensing your ability to meet challenges without losing your center.',
    personalityMeaningFr:
      'Les autres vous percoivent comme calme sous pression, vraiment courageux et capable de gerer les situations difficiles avec grace. Vous projetez une confiance tranquille et une force interieure. Les gens se sentent en securite autour de vous, sentant votre capacite a relever les defis sans perdre votre centre.',
  },
  {
    id: 9,
    nameEn: 'The Hermit',
    nameFr: "L'Hermite",
    soulMeaningEn:
      'Your soul incarnated to seek wisdom through solitude and inner illumination. You came here to learn that the answers you seek are found within, that periods of withdrawal are essential for growth, and that true guidance comes from your own inner light. Your deepest lesson is becoming your own teacher.',
    soulMeaningFr:
      'Votre ame s\'est incarnee pour chercher la sagesse a travers la solitude et l\'illumination interieure. Vous etes venu ici pour apprendre que les reponses que vous cherchez se trouvent en vous, que les periodes de retrait sont essentielles a la croissance, et que la vraie guidance vient de votre propre lumiere interieure. Votre lecon la plus profonde est de devenir votre propre enseignant.',
    personalityMeaningEn:
      'Others see you as wise, introspective, and someone who has journeyed deep within. You project thoughtfulness and the energy of someone who values quality over quantity in relationships. People seek you out when they need perspective or space to reflect.',
    personalityMeaningFr:
      'Les autres vous voient comme sage, introspectif et quelqu\'un qui a voyage profondement en lui-meme. Vous projetez de la reflexion et l\'energie de quelqu\'un qui valorise la qualite plutot que la quantite dans les relations. Les gens vous recherchent quand ils ont besoin de perspective ou d\'espace pour reflechir.',
  },
  {
    id: 10,
    nameEn: 'Wheel of Fortune',
    nameFr: 'La Roue de Fortune',
    soulMeaningEn:
      'Your soul chose the path of cycles, karma, and destined turning points. You came here to understand the great wheel of cause and effect, to embrace life\'s inevitable changes, and to find your center amid constant motion. Your deepest lesson is learning to flow with fate while still exercising your free will.',
    soulMeaningFr:
      'Votre ame a choisi le chemin des cycles, du karma et des tournants destines. Vous etes venu ici pour comprendre la grande roue de cause et effet, pour embrasser les changements inevitables de la vie, et pour trouver votre centre au milieu du mouvement constant. Votre lecon la plus profonde est d\'apprendre a couler avec le destin tout en exercant votre libre arbitre.',
    personalityMeaningEn:
      'Others experience you as adaptable, fortunate, and somehow in tune with life\'s timing. You project the energy of someone who understands that things come in cycles. People notice how you navigate changes with a certain equanimity.',
    personalityMeaningFr:
      'Les autres vous experimentent comme adaptable, chanceux et en quelque sorte en phase avec le timing de la vie. Vous projetez l\'energie de quelqu\'un qui comprend que les choses viennent par cycles. Les gens remarquent comment vous naviguez les changements avec une certaine equanimite.',
  },
  {
    id: 11,
    nameEn: 'Justice',
    nameFr: 'La Justice',
    soulMeaningEn:
      'Your soul incarnated to embody fairness, truth, and karmic balance. You came here to learn the precise nature of cause and effect, to stand for what is right even when difficult, and to understand that every action carries consequences. Your deepest lesson is developing discernment that serves the highest good.',
    soulMeaningFr:
      'Votre ame s\'est incarnee pour incarner l\'equite, la verite et l\'equilibre karmique. Vous etes venu ici pour apprendre la nature precise de la cause et l\'effet, pour defendre ce qui est juste meme quand c\'est difficile, et pour comprendre que chaque action porte des consequences. Votre lecon la plus profonde est de developper un discernement qui sert le plus grand bien.',
    personalityMeaningEn:
      'Others perceive you as fair, balanced, and committed to truth. You project integrity and the ability to see all sides of a situation. People trust your judgment and often turn to you to help resolve disputes or make difficult decisions.',
    personalityMeaningFr:
      'Les autres vous percoivent comme juste, equilibre et engage envers la verite. Vous projetez de l\'integrite et la capacite de voir tous les cotes d\'une situation. Les gens font confiance a votre jugement et se tournent souvent vers vous pour aider a resoudre des conflits ou prendre des decisions difficiles.',
  },
  {
    id: 12,
    nameEn: 'The Hanged Man',
    nameFr: 'Le Pendu',
    soulMeaningEn:
      'Your soul chose the path of surrender and sacred pause. You came here to learn that sometimes the greatest progress comes from letting go, that a completely different perspective can transform everything, and that sacrifice often leads to enlightenment. Your deepest lesson is finding freedom in release.',
    soulMeaningFr:
      'Votre ame a choisi le chemin de l\'abandon et de la pause sacree. Vous etes venu ici pour apprendre que parfois le plus grand progres vient du lacher-prise, qu\'une perspective completement differente peut tout transformer, et que le sacrifice mene souvent a l\'illumination. Votre lecon la plus profonde est de trouver la liberte dans l\'abandon.',
    personalityMeaningEn:
      'Others see you as someone who sees the world differently, patient and willing to wait for the right moment. You project an air of quiet acceptance and non-attachment. People are often surprised by the wisdom that comes from your alternative viewpoint.',
    personalityMeaningFr:
      'Les autres vous voient comme quelqu\'un qui voit le monde differemment, patient et pret a attendre le bon moment. Vous projetez un air d\'acceptation tranquille et de non-attachement. Les gens sont souvent surpris par la sagesse qui vient de votre point de vue alternatif.',
  },
  {
    id: 13,
    nameEn: 'Death',
    nameFr: 'La Mort',
    soulMeaningEn:
      'Your soul incarnated to master the profound art of transformation and endings that birth new beginnings. You came here to learn that nothing truly dies, only changes form, and that releasing the old is essential for growth. Your deepest lesson is embracing impermanence as the doorway to renewal.',
    soulMeaningFr:
      'Votre ame s\'est incarnee pour maitriser l\'art profond de la transformation et des fins qui donnent naissance a de nouveaux commencements. Vous etes venu ici pour apprendre que rien ne meurt vraiment, tout change seulement de forme, et que liberer l\'ancien est essentiel pour la croissance. Votre lecon la plus profonde est d\'embrasser l\'impermanence comme la porte du renouveau.',
    personalityMeaningEn:
      'Others sense in you a profound understanding of life\'s cycles and an unusual comfort with change. You project the energy of transformation itself. People often find you during their own times of transition, drawn to your acceptance of life\'s endings and beginnings.',
    personalityMeaningFr:
      'Les autres ressentent en vous une comprehension profonde des cycles de la vie et un confort inhabituel avec le changement. Vous projetez l\'energie de la transformation elle-meme. Les gens vous trouvent souvent pendant leurs propres temps de transition, attires par votre acceptation des fins et des commencements de la vie.',
  },
  {
    id: 14,
    nameEn: 'Temperance',
    nameFr: 'Temperance',
    soulMeaningEn:
      'Your soul chose the path of sacred balance and alchemical blending. You came here to learn the art of moderation, to harmonize opposites, and to understand that patience and gradual refinement create lasting transformation. Your deepest lesson is finding the middle way that honors all parts of existence.',
    soulMeaningFr:
      'Votre ame a choisi le chemin de l\'equilibre sacre et du melange alchimique. Vous etes venu ici pour apprendre l\'art de la moderation, pour harmoniser les opposes, et pour comprendre que la patience et le raffinement graduel creent une transformation durable. Votre lecon la plus profonde est de trouver la voie du milieu qui honore toutes les parties de l\'existence.',
    personalityMeaningEn:
      'Others perceive you as balanced, moderate, and skilled at finding harmony. You project an aura of calm integration and measured approach. People value your ability to blend different perspectives and bring opposing forces into cooperation.',
    personalityMeaningFr:
      'Les autres vous percoivent comme equilibre, modere et habile a trouver l\'harmonie. Vous projetez une aura d\'integration calme et d\'approche mesuree. Les gens apprecient votre capacite a melanger differentes perspectives et a amener les forces opposees a cooperer.',
  },
  {
    id: 15,
    nameEn: 'The Devil',
    nameFr: 'Le Diable',
    soulMeaningEn:
      'Your soul incarnated to understand the shadow and the chains we create for ourselves. You came here to learn about attachment, temptation, and the illusion of bondage. Your deepest lesson is recognizing that what seems to imprison you often holds no real power - the key to freedom has always been in your hands.',
    soulMeaningFr:
      'Votre ame s\'est incarnee pour comprendre l\'ombre et les chaines que nous creons pour nous-memes. Vous etes venu ici pour apprendre l\'attachement, la tentation et l\'illusion de l\'esclavage. Votre lecon la plus profonde est de reconnaitre que ce qui semble vous emprisonner n\'a souvent aucun pouvoir reel - la cle de la liberte a toujours ete dans vos mains.',
    personalityMeaningEn:
      'Others sense in you a raw honesty and comfort with life\'s darker aspects. You project authenticity and an understanding of human nature\'s complexities. People appreciate your lack of pretense and your ability to discuss difficult topics openly.',
    personalityMeaningFr:
      'Les autres ressentent en vous une honnetete brute et un confort avec les aspects plus sombres de la vie. Vous projetez de l\'authenticite et une comprehension des complexites de la nature humaine. Les gens apprecient votre absence de pretention et votre capacite a discuter ouvertement des sujets difficiles.',
  },
  {
    id: 16,
    nameEn: 'The Tower',
    nameFr: 'La Maison Dieu',
    soulMeaningEn:
      'Your soul chose the path of sudden awakening and necessary destruction. You came here to learn that some structures must fall for truth to emerge, that crisis can be a powerful teacher, and that what seems like catastrophe often clears the way for authentic rebuilding. Your deepest lesson is trusting the lightning strike of revelation.',
    soulMeaningFr:
      'Votre ame a choisi le chemin de l\'eveil soudain et de la destruction necessaire. Vous etes venu ici pour apprendre que certaines structures doivent tomber pour que la verite emerge, que la crise peut etre un enseignant puissant, et que ce qui semble etre une catastrophe degage souvent le chemin pour une reconstruction authentique. Votre lecon la plus profonde est de faire confiance a l\'eclair de la revelation.',
    personalityMeaningEn:
      'Others experience you as someone who catalyzes change and speaks uncomfortable truths. You project the energy of breakthrough and transformation. People may initially find you disruptive, but often recognize later that you helped break what needed breaking.',
    personalityMeaningFr:
      'Les autres vous experimentent comme quelqu\'un qui catalyse le changement et dit des verites inconfortables. Vous projetez l\'energie de la percee et de la transformation. Les gens peuvent initialement vous trouver perturbateur, mais reconnaissent souvent plus tard que vous avez aide a briser ce qui devait etre brise.',
  },
  {
    id: 17,
    nameEn: 'The Star',
    nameFr: "L'Etoile",
    soulMeaningEn:
      'Your soul incarnated to bring hope, healing, and renewal after darkness. You came here to learn that even after the greatest losses, faith can be restored, and that you carry a light that can guide both yourself and others through difficult times. Your deepest lesson is maintaining hope as an active spiritual practice.',
    soulMeaningFr:
      'Votre ame s\'est incarnee pour apporter l\'espoir, la guerison et le renouveau apres l\'obscurite. Vous etes venu ici pour apprendre que meme apres les plus grandes pertes, la foi peut etre restauree, et que vous portez une lumiere qui peut vous guider vous-meme et les autres a travers les moments difficiles. Votre lecon la plus profonde est de maintenir l\'espoir comme une pratique spirituelle active.',
    personalityMeaningEn:
      'Others see you as a source of hope, inspiration, and calm assurance. You project serenity and a quality of gentle radiance. People are drawn to your optimism and your ability to help them see possibilities they had forgotten existed.',
    personalityMeaningFr:
      'Les autres vous voient comme une source d\'espoir, d\'inspiration et d\'assurance calme. Vous projetez la serenite et une qualite de rayonnement doux. Les gens sont attires par votre optimisme et votre capacite a les aider a voir des possibilites qu\'ils avaient oublie exister.',
  },
  {
    id: 18,
    nameEn: 'The Moon',
    nameFr: 'La Lune',
    soulMeaningEn:
      'Your soul chose the path of deep intuition and navigating the unconscious. You came here to learn that not everything can be known through logic, that fears must be faced in the dark, and that the journey through uncertainty develops profound inner knowing. Your deepest lesson is trusting what you sense beyond rational understanding.',
    soulMeaningFr:
      'Votre ame a choisi le chemin de l\'intuition profonde et de la navigation de l\'inconscient. Vous etes venu ici pour apprendre que tout ne peut pas etre connu par la logique, que les peurs doivent etre affrontees dans l\'obscurite, et que le voyage a travers l\'incertitude developpe un savoir interieur profond. Votre lecon la plus profonde est de faire confiance a ce que vous ressentez au-dela de la comprehension rationnelle.',
    personalityMeaningEn:
      'Others sense in you a deep connection to the unseen realms and the cycles of emotion. You project mystery and heightened sensitivity. People often find you attuned to undercurrents they cannot articulate, sensing what lies beneath surfaces.',
    personalityMeaningFr:
      'Les autres ressentent en vous une connexion profonde aux royaumes invisibles et aux cycles de l\'emotion. Vous projetez le mystere et une sensibilite accrue. Les gens vous trouvent souvent en phase avec des courants sous-jacents qu\'ils ne peuvent articuler, sentant ce qui se trouve sous les surfaces.',
  },
  {
    id: 19,
    nameEn: 'The Sun',
    nameFr: 'Le Soleil',
    soulMeaningEn:
      'Your soul incarnated to radiate joy, vitality, and authentic self-expression. You came here to learn that happiness is a birthright, that your inner child holds sacred wisdom, and that shining your light benefits everyone around you. Your deepest lesson is allowing yourself to experience and share genuine joy.',
    soulMeaningFr:
      'Votre ame s\'est incarnee pour rayonner la joie, la vitalite et l\'expression authentique de soi. Vous etes venu ici pour apprendre que le bonheur est un droit de naissance, que votre enfant interieur detient une sagesse sacree, et que faire briller votre lumiere beneficie a tous autour de vous. Votre lecon la plus profonde est de vous permettre de vivre et de partager une joie authentique.',
    personalityMeaningEn:
      'Others experience you as warm, vital, and naturally uplifting. You project positivity and an infectious enthusiasm for life. People are drawn to your light and often feel better simply by being in your presence.',
    personalityMeaningFr:
      'Les autres vous experimentent comme chaleureux, vital et naturellement edifiant. Vous projetez de la positivite et un enthousiasme contagieux pour la vie. Les gens sont attires par votre lumiere et se sentent souvent mieux simplement en etant en votre presence.',
  },
  {
    id: 20,
    nameEn: 'Judgement',
    nameFr: 'Le Jugement',
    soulMeaningEn:
      'Your soul chose the path of awakening, resurrection, and answering your true calling. You came here to learn that there comes a moment when you must rise to who you truly are, that past patterns can be released through forgiveness, and that your soul has a specific purpose calling you home. Your deepest lesson is heeding your inner calling above all.',
    soulMeaningFr:
      'Votre ame a choisi le chemin de l\'eveil, de la resurrection et de repondre a votre vraie vocation. Vous etes venu ici pour apprendre qu\'il arrive un moment ou vous devez vous elever vers qui vous etes vraiment, que les schemas passes peuvent etre liberes par le pardon, et que votre ame a un but specifique qui vous appelle. Votre lecon la plus profonde est d\'ecouter votre appel interieur avant tout.',
    personalityMeaningEn:
      'Others perceive you as someone who has experienced significant transformation and awakening. You project the energy of rebirth and renewed purpose. People sense your commitment to living authentically and are inspired by your willingness to answer life\'s deeper calls.',
    personalityMeaningFr:
      'Les autres vous percoivent comme quelqu\'un qui a vecu une transformation et un eveil significatifs. Vous projetez l\'energie de la renaissance et du but renouvele. Les gens sentent votre engagement a vivre authentiquement et sont inspires par votre volonte de repondre aux appels plus profonds de la vie.',
  },
  {
    id: 21,
    nameEn: 'The World',
    nameFr: 'Le Monde',
    soulMeaningEn:
      'Your soul incarnated to experience completion, wholeness, and the integration of all life\'s lessons. You came here to learn that fulfillment comes from embracing the entire journey, that you contain within you all the wisdom of the Major Arcana, and that endings are also celebrations. Your deepest lesson is embodying the dance of accomplished being.',
    soulMeaningFr:
      'Votre ame s\'est incarnee pour experimenter l\'achevement, la totalite et l\'integration de toutes les lecons de la vie. Vous etes venu ici pour apprendre que l\'accomplissement vient d\'embrasser le voyage entier, que vous contenez en vous toute la sagesse des Arcanes Majeurs, et que les fins sont aussi des celebrations. Votre lecon la plus profonde est d\'incarner la danse de l\'etre accompli.',
    personalityMeaningEn:
      'Others see you as accomplished, integrated, and somehow complete in yourself. You project success and the wisdom that comes from having traveled far. People sense your broad perspective and are drawn to your ability to bring things to fulfilling conclusion.',
    personalityMeaningFr:
      'Les autres vous voient comme accompli, integre et en quelque sorte complet en vous-meme. Vous projetez le succes et la sagesse qui vient d\'avoir voyage loin. Les gens sentent votre perspective large et sont attires par votre capacite a amener les choses a une conclusion satisfaisante.',
  },
];

/**
 * Sum digits of a number until it's a single digit or in range 1-22
 */
function reduceToTarot(num: number): number {
  // First reduce to 1-22 range for Major Arcana
  while (num > 22) {
    num = num
      .toString()
      .split('')
      .reduce((acc, digit) => acc + parseInt(digit, 10), 0);
  }
  return num;
}

/**
 * Calculate Birth Cards from a birth date
 *
 * The calculation process:
 * 1. Sum all digits of the full birth date (DD + MM + YYYY)
 * 2. Reduce to 1-22 range (if > 22, sum digits again) - this is the PERSONALITY Card
 * 3. For Soul Card: if Personality Card is 10-22, sum its digits to get single digit
 * 4. If Personality Card is 1-9, Soul and Personality are the same (unified)
 *
 * Examples:
 * - Total = 16 → Personality = The Tower (16), Soul = The Chariot (7)
 * - Total = 5 → Personality = The Hierophant (5), Soul = The Hierophant (5) [unified]
 * - Total = 22 → Personality = The Fool (0/22), Soul = The Emperor (4)
 *
 * @param day - Day of birth (1-31)
 * @param month - Month of birth (1-12)
 * @param year - Year of birth (e.g., 1990)
 * @returns Object containing soulCard and personalityCard numbers (0-21)
 */
export function calculateBirthCards(
  day: number,
  month: number,
  year: number
): {
  soulCard: number;
  personalityCard: number;
} {
  // Combine into full date string and sum all digits
  const dateStr = `${day}${month}${year}`;
  let sum = dateStr.split('').reduce((acc, digit) => acc + parseInt(digit, 10), 0);

  // Reduce to tarot range (1-22)
  sum = reduceToTarot(sum);

  // Personality Card is the first reduction (what you show the world)
  // Convert 22 to 0 for The Fool
  const personalityCard = sum === 22 ? 0 : sum;

  // Soul Card: if Personality is 10-21 or 0 (Fool), reduce to single digit
  // This is your inner essence
  let soulCard = personalityCard;
  if (personalityCard >= 10 || personalityCard === 0) {
    // For The Fool (0), use 22 for reduction: 2+2 = 4 (Emperor)
    const valueToReduce = personalityCard === 0 ? 22 : personalityCard;
    soulCard = valueToReduce
      .toString()
      .split('')
      .reduce((acc, digit) => acc + parseInt(digit, 10), 0);
  }

  return { soulCard, personalityCard };
}

/**
 * Calculate the Year Card for a specific year combined with birth month/day
 * This shows the personal theme for that year based on the individual's birth date
 *
 * @param day - Day of birth
 * @param month - Month of birth
 * @param targetYear - The year to calculate for (e.g., 2026)
 * @returns The Year Card number (0-21)
 */
export function calculateYearCard(day: number, month: number, targetYear: number): number {
  const dateStr = `${day}${month}${targetYear}`;
  let sum = dateStr.split('').reduce((acc, digit) => acc + parseInt(digit, 10), 0);
  sum = reduceToTarot(sum);
  return sum === 22 ? 0 : sum;
}

/**
 * Get the meaning data for a specific Birth Card
 *
 * @param cardId - The Major Arcana card ID (0-21)
 * @returns The BirthCardMeaning object or undefined if not found
 */
export function getBirthCardMeaning(cardId: number): BirthCardMeaning | undefined {
  return BIRTH_CARD_MEANINGS.find((card) => card.id === cardId);
}

/**
 * Get all birth card information for a birth date at a specific depth
 *
 * @param day - Day of birth
 * @param month - Month of birth
 * @param year - Year of birth
 * @param depth - Reading depth (1 = Soul only, 2 = Soul + Personality, 3 = + Year Card)
 * @returns Object with card IDs and meanings based on depth
 */
export function getBirthCardReading(
  day: number,
  month: number,
  year: number,
  depth: 1 | 2 | 3
): {
  soulCard: { id: number; meaning: BirthCardMeaning | undefined };
  personalityCard?: { id: number; meaning: BirthCardMeaning | undefined };
  yearCard?: { id: number; meaning: BirthCardMeaning | undefined; yearMeaning: typeof YEAR_CARD_2026 };
} {
  const { soulCard, personalityCard } = calculateBirthCards(day, month, year);

  const result: ReturnType<typeof getBirthCardReading> = {
    soulCard: { id: soulCard, meaning: getBirthCardMeaning(soulCard) },
  };

  if (depth >= 2) {
    result.personalityCard = { id: personalityCard, meaning: getBirthCardMeaning(personalityCard) };
  }

  if (depth >= 3) {
    const yearCardId = calculateYearCard(day, month, YEAR_CARD_2026.year);
    result.yearCard = {
      id: yearCardId,
      meaning: getBirthCardMeaning(yearCardId),
      yearMeaning: YEAR_CARD_2026,
    };
  }

  return result;
}
