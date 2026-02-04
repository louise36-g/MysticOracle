// constants/dailyQuotes.ts
// 365 inspirational quotes for the "Thought for Today" feature

export interface DailyQuote {
  id: number;
  textEn: string;
  textFr: string;
  author: string;
}

export const DAILY_QUOTES: DailyQuote[] = [
  {
    id: 1,
    textEn: "The attempt to escape from pain is what creates more pain.",
    textFr: "La tentative de fuir la douleur est précisément ce qui en crée davantage.",
    author: "Gabor Maté"
  },
  {
    id: 2,
    textEn: "Owning our story can be hard but not nearly as difficult as spending our lives running from it.",
    textFr: "Assumer notre histoire peut être difficile, mais cela l'est bien moins que de passer sa vie à la fuir.",
    author: "Brené Brown"
  },
  {
    id: 3,
    textEn: "Peace requires that we listen to what is alive in us before reacting.",
    textFr: "La paix exige que nous écoutions ce qui est vivant en nous avant de réagir.",
    author: "Thomas d'Ansembourg"
  },
  {
    id: 4,
    textEn: "Listening is making meaning from sound.",
    textFr: "Écouter, c'est donner du sens aux sons.",
    author: "Julian Treasure"
  },
  {
    id: 5,
    textEn: "The goal is not power over others, but power to be ourselves.",
    textFr: "Le but n'est pas d'avoir du pouvoir sur les autres, mais le pouvoir d'être soi-même.",
    author: "Amy Cuddy"
  },
  {
    id: 6,
    textEn: "If you're not prepared to be wrong, you'll never come up with anything original.",
    textFr: "Si vous n'êtes pas prêt à vous tromper, vous ne produirez jamais rien d'original.",
    author: "Sir Ken Robinson"
  },
  {
    id: 7,
    textEn: "Inner peace is not something you find; it is something you create.",
    textFr: "La paix intérieure n'est pas quelque chose que l'on trouve, c'est quelque chose que l'on crée.",
    author: "Sadhguru"
  },
  {
    id: 8,
    textEn: "Fulfillment comes from progress, not from achievement.",
    textFr: "L'accomplissement vient du progrès, non de la réussite en soi.",
    author: "Simon Sinek"
  },
  {
    id: 9,
    textEn: "In the midst of movement and chaos, keep stillness inside of you.",
    textFr: "Au milieu du mouvement et du chaos, cultivez l'immobilité intérieure.",
    author: "Deepak Chopra"
  },
  {
    id: 10,
    textEn: "We mistake being busy for being alive.",
    textFr: "Nous confondons souvent le fait d'être occupés avec le fait d'être vivants.",
    author: "Tim Urban"
  },
  {
    id: 11,
    textEn: "Trauma is not what happens to you; it is what happens inside you.",
    textFr: "Le traumatisme n'est pas ce qui vous arrive, mais ce qui se passe à l'intérieur de vous.",
    author: "Gabor Maté"
  },
  {
    id: 12,
    textEn: "Connection is why we're here; it is what gives purpose and meaning to our lives.",
    textFr: "Le lien est la raison de notre présence ici ; c'est lui qui donne sens et direction à nos vies.",
    author: "Brené Brown"
  },
  {
    id: 13,
    textEn: "What we do not express does not disappear; it transforms.",
    textFr: "Ce que nous n'exprimons pas ne disparaît pas : cela se transforme.",
    author: "Thomas d'Ansembourg"
  },
  {
    id: 14,
    textEn: "Silence is where we hear what matters.",
    textFr: "C'est dans le silence que l'essentiel se fait entendre.",
    author: "Julian Treasure"
  },
  {
    id: 15,
    textEn: "When we feel powerful, we are more present.",
    textFr: "Lorsque nous nous sentons forts intérieurement, nous sommes plus présents.",
    author: "Amy Cuddy"
  },
  {
    id: 16,
    textEn: "Creativity is a process, not an event.",
    textFr: "La créativité est un processus, pas un événement isolé.",
    author: "Sir Ken Robinson"
  },
  {
    id: 17,
    textEn: "Your life is your responsibility, not your entitlement.",
    textFr: "Votre vie est votre responsabilité, non un dû.",
    author: "Sadhguru"
  },
  {
    id: 18,
    textEn: "Trust is built in small moments.",
    textFr: "La confiance se construit dans les petits moments.",
    author: "Simon Sinek"
  },
  {
    id: 19,
    textEn: "Attention energizes; intention transforms.",
    textFr: "L'attention dynamise ; l'intention transforme.",
    author: "Deepak Chopra"
  },
  {
    id: 20,
    textEn: "Awareness is the antidote to autopilot.",
    textFr: "La conscience est l'antidote au pilotage automatique.",
    author: "Tim Urban"
  },
  {
    id: 21,
    textEn: "Compassion is not a luxury; it is a necessity.",
    textFr: "La compassion n'est pas un luxe ; c'est une nécessité.",
    author: "Gabor Maté"
  },
  {
    id: 22,
    textEn: "Vulnerability is the birthplace of love, belonging, and joy.",
    textFr: "La vulnérabilité est le berceau de l'amour, de l'appartenance et de la joie.",
    author: "Brené Brown"
  },
  {
    id: 23,
    textEn: "Authenticity begins when we stop betraying ourselves.",
    textFr: "L'authenticité commence lorsque nous cessons de nous trahir.",
    author: "Thomas d'Ansembourg"
  },
  {
    id: 24,
    textEn: "We listen through filters, not facts.",
    textFr: "Nous écoutons à travers des filtres, non à travers des faits.",
    author: "Julian Treasure"
  },
  {
    id: 25,
    textEn: "Confidence grows when we act before we feel ready.",
    textFr: "La confiance grandit lorsque nous agissons avant de nous sentir prêts.",
    author: "Amy Cuddy"
  },
  {
    id: 26,
    textEn: "Learning flourishes when curiosity leads.",
    textFr: "L'apprentissage s'épanouit lorsque la curiosité guide.",
    author: "Sir Ken Robinson"
  },
  {
    id: 27,
    textEn: "If you are not willing to change, nothing will change.",
    textFr: "Si vous n'êtes pas prêt à changer, rien ne changera.",
    author: "Sadhguru"
  },
  {
    id: 28,
    textEn: "Meaning is not found in what you do, but in why you do it.",
    textFr: "Le sens ne se trouve pas dans ce que vous faites, mais dans la raison pour laquelle vous le faites.",
    author: "Simon Sinek"
  },
  {
    id: 29,
    textEn: "The highest form of intelligence is the ability to observe without evaluating.",
    textFr: "La forme la plus élevée d'intelligence est la capacité d'observer sans juger.",
    author: "Deepak Chopra"
  },
  {
    id: 30,
    textEn: "Procrastination is less about laziness and more about fear.",
    textFr: "La procrastination est moins une question de paresse qu'une question de peur.",
    author: "Tim Urban"
  },
  {
    id: 31,
    textEn: "We suffer not because of what happens to us, but because of our resistance to feeling.",
    textFr: "Nous souffrons non pas à cause de ce qui nous arrive, mais à cause de notre résistance à ressentir.",
    author: "Gabor Maté"
  },
  {
    id: 32,
    textEn: "Courage starts with showing up and letting ourselves be seen.",
    textFr: "Le courage commence lorsque nous osons nous montrer tels que nous sommes.",
    author: "Brené Brown"
  },
  {
    id: 33,
    textEn: "When we slow down, we can finally hear what matters.",
    textFr: "Lorsque nous ralentissons, nous pouvons enfin entendre ce qui compte vraiment.",
    author: "Thomas d'Ansembourg"
  },
  {
    id: 34,
    textEn: "Understanding begins where judgment ends.",
    textFr: "La compréhension commence là où le jugement s'arrête.",
    author: "Julian Treasure"
  },
  {
    id: 35,
    textEn: "Small changes in how we see ourselves can change everything.",
    textFr: "De petits changements dans la façon dont nous nous percevons peuvent tout transformer.",
    author: "Amy Cuddy"
  },
  {
    id: 36,
    textEn: "We grow into ourselves by exploring, not by conforming.",
    textFr: "Nous devenons pleinement nous-mêmes en explorant, non en nous conformant.",
    author: "Sir Ken Robinson"
  },
  {
    id: 37,
    textEn: "The quality of your life is determined by how you experience it, not by what you accumulate.",
    textFr: "La qualité de votre vie dépend de la manière dont vous la vivez, non de ce que vous accumulez.",
    author: "Sadhguru"
  },
  {
    id: 38,
    textEn: "Consistency builds trust more reliably than intensity.",
    textFr: "La constance construit la confiance plus sûrement que l'intensité.",
    author: "Simon Sinek"
  },
  {
    id: 39,
    textEn: "Every choice you make plants a seed in consciousness.",
    textFr: "Chaque choix que vous faites plante une graine dans la conscience.",
    author: "Deepak Chopra"
  },
  {
    id: 40,
    textEn: "We delay living while preparing to live.",
    textFr: "Nous retardons le fait de vivre en nous préparant à vivre.",
    author: "Tim Urban"
  },
  {
    id: 41,
    textEn: "Authenticity is the daily practice of letting go of who we think we should be.",
    textFr: "L'authenticité est la pratique quotidienne qui consiste à renoncer à l'image de ce que nous croyons devoir être.",
    author: "Gabor Maté"
  },
  {
    id: 42,
    textEn: "We cannot selectively numb emotion; when we numb the painful emotions, we also numb the positive.",
    textFr: "Nous ne pouvons pas anesthésier sélectivement nos émotions : en engourdissant la douleur, nous engourdissons aussi la joie.",
    author: "Brené Brown"
  },
  {
    id: 43,
    textEn: "Listening to ourselves is the beginning of responsibility.",
    textFr: "S'écouter soi-même est le début de la responsabilité.",
    author: "Thomas d'Ansembourg"
  },
  {
    id: 44,
    textEn: "Noise is not just sound; it is the absence of meaning.",
    textFr: "Le bruit n'est pas seulement du son ; c'est l'absence de sens.",
    author: "Julian Treasure"
  },
  {
    id: 45,
    textEn: "Presence is the ability to trust ourselves in the moment.",
    textFr: "La présence est la capacité de se faire confiance dans l'instant.",
    author: "Amy Cuddy"
  },
  {
    id: 46,
    textEn: "True learning invites uncertainty.",
    textFr: "Le véritable apprentissage invite l'incertitude.",
    author: "Sir Ken Robinson"
  },
  {
    id: 47,
    textEn: "If you pay enough attention, everything becomes a teacher.",
    textFr: "Si vous portez suffisamment attention, toute chose devient un enseignement.",
    author: "Sadhguru"
  },
  {
    id: 48,
    textEn: "Progress happens when we commit to the long game.",
    textFr: "Le progrès apparaît lorsque nous nous engageons sur le long terme.",
    author: "Simon Sinek"
  },
  {
    id: 49,
    textEn: "Stillness is the altar of spirit.",
    textFr: "L'immobilité est l'autel de l'esprit.",
    author: "Deepak Chopra"
  },
  {
    id: 50,
    textEn: "Self-awareness is uncomfortable because it removes our favorite excuses.",
    textFr: "La conscience de soi est inconfortable parce qu'elle nous prive de nos excuses préférées.",
    author: "Tim Urban"
  },
  {
    id: 51,
    textEn: "Healing begins when we stop judging our own pain.",
    textFr: "La guérison commence lorsque nous cessons de juger notre propre douleur.",
    author: "Gabor Maté"
  },
  {
    id: 52,
    textEn: "Belonging does not require us to change who we are; it requires us to be who we are.",
    textFr: "L'appartenance ne nous demande pas de changer qui nous sommes, mais d'être pleinement qui nous sommes.",
    author: "Brené Brown"
  },
  {
    id: 53,
    textEn: "Emotions are messengers, not obstacles.",
    textFr: "Les émotions sont des messagères, non des obstacles.",
    author: "Thomas d'Ansembourg"
  },
  {
    id: 54,
    textEn: "Truth is often spoken quietly.",
    textFr: "La vérité s'exprime souvent à voix basse.",
    author: "Julian Treasure"
  },
  {
    id: 55,
    textEn: "When we stop performing, we start connecting.",
    textFr: "Lorsque nous cessons de jouer un rôle, la connexion devient possible.",
    author: "Amy Cuddy"
  },
  {
    id: 56,
    textEn: "Imagination is intelligence at play.",
    textFr: "L'imagination est l'intelligence en mouvement.",
    author: "Sir Ken Robinson"
  },
  {
    id: 57,
    textEn: "Your inner experience is the only place where life actually happens.",
    textFr: "Votre expérience intérieure est le seul endroit où la vie se déroule réellement.",
    author: "Sadhguru"
  },
  {
    id: 58,
    textEn: "A clear sense of purpose steadies us in uncertainty.",
    textFr: "Un sens clair du but nous stabilise dans l'incertitude.",
    author: "Simon Sinek"
  },
  {
    id: 59,
    textEn: "When you let go of certainty, you step into possibility.",
    textFr: "Lorsque vous lâchez la certitude, vous entrez dans le champ des possibles.",
    author: "Deepak Chopra"
  },
  {
    id: 60,
    textEn: "Most regret comes from things we were too afraid to try.",
    textFr: "La plupart des regrets viennent de ce que nous avons eu trop peur d'essayer.",
    author: "Tim Urban"
  },
  {
    id: 61,
    textEn: "We heal in connection, not in isolation.",
    textFr: "Nous guérissons dans le lien, pas dans l'isolement.",
    author: "Gabor Maté"
  },
  {
    id: 62,
    textEn: "Shame loses power when it is spoken.",
    textFr: "La honte perd son pouvoir lorsqu'elle est exprimée.",
    author: "Brené Brown"
  },
  {
    id: 63,
    textEn: "Choosing awareness is choosing freedom.",
    textFr: "Choisir la conscience, c'est choisir la liberté.",
    author: "Thomas d'Ansembourg"
  },
  {
    id: 64,
    textEn: "Listening creates the space where change can occur.",
    textFr: "L'écoute crée l'espace dans lequel le changement peut advenir.",
    author: "Julian Treasure"
  },
  {
    id: 65,
    textEn: "Self-trust grows through brave, imperfect action.",
    textFr: "La confiance en soi grandit à travers des actions courageuses et imparfaites.",
    author: "Amy Cuddy"
  },
  {
    id: 66,
    textEn: "Creativity thrives when we allow ourselves to experiment.",
    textFr: "La créativité s'épanouit lorsque nous nous autorisons à expérimenter.",
    author: "Sir Ken Robinson"
  },
  {
    id: 67,
    textEn: "If you are willing to learn, life will teach you everything.",
    textFr: "Si vous êtes disposé à apprendre, la vie vous enseignera tout.",
    author: "Sadhguru"
  },
  {
    id: 68,
    textEn: "Leadership begins with listening.",
    textFr: "Le leadership commence par l'écoute.",
    author: "Simon Sinek"
  },
  {
    id: 69,
    textEn: "Awareness is the greatest agent for change.",
    textFr: "La conscience est le plus puissant agent de transformation.",
    author: "Deepak Chopra"
  },
  {
    id: 70,
    textEn: "Comfort is a convincing storyteller.",
    textFr: "Le confort est un narrateur très convaincant.",
    author: "Tim Urban"
  },
  {
    id: 71,
    textEn: "Understanding ourselves requires compassion, not criticism.",
    textFr: "Se comprendre soi-même demande de la compassion, non de la critique.",
    author: "Gabor Maté"
  },
  {
    id: 72,
    textEn: "We are most powerful when we are fully ourselves.",
    textFr: "Nous sommes les plus puissants lorsque nous sommes pleinement nous-mêmes.",
    author: "Brené Brown"
  },
  {
    id: 73,
    textEn: "Slowness allows depth to emerge.",
    textFr: "La lenteur permet à la profondeur d'émerger.",
    author: "Thomas d'Ansembourg"
  },
  {
    id: 74,
    textEn: "Meaning lives beneath the words.",
    textFr: "Le sens se trouve sous les mots.",
    author: "Julian Treasure"
  },
  {
    id: 75,
    textEn: "Courage often feels like uncertainty.",
    textFr: "Le courage ressemble souvent à de l'incertitude.",
    author: "Amy Cuddy"
  },
  {
    id: 76,
    textEn: "Finding your path often means leaving the familiar.",
    textFr: "Trouver sa voie implique souvent de quitter le familier.",
    author: "Sir Ken Robinson"
  },
  {
    id: 77,
    textEn: "Life becomes profound when you take responsibility for how you feel.",
    textFr: "La vie devient profonde lorsque vous prenez la responsabilité de ce que vous ressentez.",
    author: "Sadhguru"
  },
  {
    id: 78,
    textEn: "Trust grows where honesty is practiced.",
    textFr: "La confiance grandit là où l'honnêteté est pratiquée.",
    author: "Simon Sinek"
  },
  {
    id: 79,
    textEn: "The present moment is where transformation occurs.",
    textFr: "C'est dans le moment présent que la transformation a lieu.",
    author: "Deepak Chopra"
  },
  {
    id: 80,
    textEn: "We often confuse motion with progress.",
    textFr: "Nous confondons souvent le mouvement avec le progrès.",
    author: "Tim Urban"
  },
  {
    id: 81,
    textEn: "The body speaks the mind's unspoken truths.",
    textFr: "Le corps exprime les vérités que l'esprit ne formule pas.",
    author: "Gabor Maté"
  },
  {
    id: 82,
    textEn: "Curiosity is a powerful antidote to fear.",
    textFr: "La curiosité est un puissant antidote à la peur.",
    author: "Brené Brown"
  },
  {
    id: 83,
    textEn: "Respect begins with self-respect.",
    textFr: "Le respect commence par le respect de soi.",
    author: "Thomas d'Ansembourg"
  },
  {
    id: 84,
    textEn: "Listening is an act of generosity.",
    textFr: "Écouter est un acte de générosité.",
    author: "Julian Treasure"
  },
  {
    id: 85,
    textEn: "Our posture shapes our inner experience.",
    textFr: "Notre posture façonne notre expérience intérieure.",
    author: "Amy Cuddy"
  },
  {
    id: 86,
    textEn: "Growth asks us to stay open.",
    textFr: "La croissance nous invite à rester ouverts.",
    author: "Sir Ken Robinson"
  },
  {
    id: 87,
    textEn: "When you become conscious, choice becomes possible.",
    textFr: "Lorsque vous devenez conscient, le choix devient possible.",
    author: "Sadhguru"
  },
  {
    id: 88,
    textEn: "Clarity comes from commitment.",
    textFr: "La clarté naît de l'engagement.",
    author: "Simon Sinek"
  },
  {
    id: 89,
    textEn: "Every ending is a doorway.",
    textFr: "Chaque fin est une porte.",
    author: "Deepak Chopra"
  },
  {
    id: 90,
    textEn: "Awareness changes the game.",
    textFr: "La conscience change la donne.",
    author: "Tim Urban"
  },
  {
    id: 91,
    textEn: "We are shaped not only by what happened, but by what did not happen.",
    textFr: "Nous sommes façonnés non seulement par ce qui est arrivé, mais aussi par ce qui n'est pas arrivé.",
    author: "Gabor Maté"
  },
  {
    id: 92,
    textEn: "Self-respect means knowing we are worthy of care and connection.",
    textFr: "Le respect de soi consiste à savoir que nous méritons le soin et la relation.",
    author: "Brené Brown"
  },
  {
    id: 93,
    textEn: "Inner peace grows when we stop abandoning ourselves.",
    textFr: "La paix intérieure grandit lorsque nous cessons de nous abandonner nous-mêmes.",
    author: "Thomas d'Ansembourg"
  },
  {
    id: 94,
    textEn: "Attention is the rarest and purest form of generosity.",
    textFr: "L'attention est la forme la plus rare et la plus pure de générosité.",
    author: "Julian Treasure"
  },
  {
    id: 95,
    textEn: "When we believe we belong, we are braver.",
    textFr: "Lorsque nous croyons appartenir, nous devenons plus courageux.",
    author: "Amy Cuddy"
  },
  {
    id: 96,
    textEn: "Education is meant to awaken curiosity.",
    textFr: "L'éducation est destinée à éveiller la curiosité.",
    author: "Sir Ken Robinson"
  },
  {
    id: 97,
    textEn: "How you experience life is determined by how consciously you live.",
    textFr: "La manière dont vous vivez la vie dépend du degré de conscience avec lequel vous vivez.",
    author: "Sadhguru"
  },
  {
    id: 98,
    textEn: "Trust grows when actions align with values.",
    textFr: "La confiance grandit lorsque les actions s'alignent avec les valeurs.",
    author: "Simon Sinek"
  },
  {
    id: 99,
    textEn: "The present moment is a field of infinite possibility.",
    textFr: "Le moment présent est un champ de possibilités infinies.",
    author: "Deepak Chopra"
  },
  {
    id: 100,
    textEn: "We overestimate what fear is protecting us from.",
    textFr: "Nous surestimons ce contre quoi la peur prétend nous protéger.",
    author: "Tim Urban"
  },
  {
    id: 101,
    textEn: "Healing is the return to wholeness.",
    textFr: "Guérir, c'est revenir à l'intégrité.",
    author: "Gabor Maté"
  },
  {
    id: 102,
    textEn: "Clear is kind; unclear is unkind.",
    textFr: "La clarté est une forme de bienveillance ; le flou ne l'est pas.",
    author: "Brené Brown"
  },
  {
    id: 103,
    textEn: "Listening deeply is an act of love.",
    textFr: "Écouter profondément est un acte d'amour.",
    author: "Thomas d'Ansembourg"
  },
  {
    id: 104,
    textEn: "We hear what we expect to hear.",
    textFr: "Nous entendons ce que nous nous attendons à entendre.",
    author: "Julian Treasure"
  },
  {
    id: 105,
    textEn: "Confidence grows from aligned action.",
    textFr: "La confiance naît d'actions alignées.",
    author: "Amy Cuddy"
  },
  {
    id: 106,
    textEn: "Creativity requires the courage to be uncertain.",
    textFr: "La créativité demande le courage de l'incertitude.",
    author: "Sir Ken Robinson"
  },
  {
    id: 107,
    textEn: "Once you are conscious, compulsions lose their grip.",
    textFr: "Lorsque la conscience est présente, les compulsions perdent leur emprise.",
    author: "Sadhguru"
  },
  {
    id: 108,
    textEn: "Purpose gives resilience.",
    textFr: "Le sens donne de la résilience.",
    author: "Simon Sinek"
  },
  {
    id: 109,
    textEn: "Letting go creates space for grace.",
    textFr: "Lâcher prise crée l'espace pour la grâce.",
    author: "Deepak Chopra"
  },
  {
    id: 110,
    textEn: "Our future selves are strangers we rarely consult.",
    textFr: "Nos futurs nous-mêmes sont des inconnus que nous consultons rarement.",
    author: "Tim Urban"
  },
  {
    id: 111,
    textEn: "The more we deny our emotions, the more they control us.",
    textFr: "Plus nous nions nos émotions, plus elles prennent le contrôle.",
    author: "Gabor Maté"
  },
  {
    id: 112,
    textEn: "Belonging begins with self-acceptance.",
    textFr: "L'appartenance commence par l'acceptation de soi.",
    author: "Brené Brown"
  },
  {
    id: 113,
    textEn: "Awareness transforms reaction into choice.",
    textFr: "La conscience transforme la réaction en choix.",
    author: "Thomas d'Ansembourg"
  },
  {
    id: 114,
    textEn: "Meaning is shaped by what we attend to.",
    textFr: "Le sens se façonne à travers ce à quoi nous portons attention.",
    author: "Julian Treasure"
  },
  {
    id: 115,
    textEn: "When we act with integrity, confidence follows.",
    textFr: "Lorsque nous agissons avec intégrité, la confiance suit.",
    author: "Amy Cuddy"
  },
  {
    id: 116,
    textEn: "Growth happens when we question assumptions.",
    textFr: "La croissance apparaît lorsque nous remettons en question nos présupposés.",
    author: "Sir Ken Robinson"
  },
  {
    id: 117,
    textEn: "Responsibility is the source of freedom.",
    textFr: "La responsabilité est la source de la liberté.",
    author: "Sadhguru"
  },
  {
    id: 118,
    textEn: "Consistency builds credibility.",
    textFr: "La constance construit la crédibilité.",
    author: "Simon Sinek"
  },
  {
    id: 119,
    textEn: "Conscious choice is the beginning of change.",
    textFr: "Le choix conscient est le début du changement.",
    author: "Deepak Chopra"
  },
  {
    id: 120,
    textEn: "Most change happens quietly.",
    textFr: "La plupart des transformations se produisent dans le silence.",
    author: "Tim Urban"
  },
  {
    id: 121,
    textEn: "Compassion dissolves resistance.",
    textFr: "La compassion dissout la résistance.",
    author: "Gabor Maté"
  },
  {
    id: 122,
    textEn: "Boundaries are the distance at which I can love you and myself.",
    textFr: "Les limites sont la distance à laquelle je peux t'aimer tout en m'aimant moi-même.",
    author: "Brené Brown"
  },
  {
    id: 123,
    textEn: "Self-empathy is the gateway to empathy for others.",
    textFr: "L'auto-empathie est la porte d'entrée vers l'empathie pour les autres.",
    author: "Thomas d'Ansembourg"
  },
  {
    id: 124,
    textEn: "Listening changes relationships.",
    textFr: "L'écoute transforme les relations.",
    author: "Julian Treasure"
  },
  {
    id: 125,
    textEn: "Alignment between values and actions creates calm.",
    textFr: "L'alignement entre les valeurs et les actions crée le calme.",
    author: "Amy Cuddy"
  },
  {
    id: 126,
    textEn: "Finding meaning often requires unlearning.",
    textFr: "Trouver du sens demande souvent de désapprendre.",
    author: "Sir Ken Robinson"
  },
  {
    id: 127,
    textEn: "Clarity comes when attention is undivided.",
    textFr: "La clarté apparaît lorsque l'attention est entière.",
    author: "Sadhguru"
  },
  {
    id: 128,
    textEn: "Trust deepens through consistency.",
    textFr: "La confiance s'approfondit grâce à la constance.",
    author: "Simon Sinek"
  },
  {
    id: 129,
    textEn: "Every moment is an opportunity to begin again.",
    textFr: "Chaque instant est une occasion de recommencer.",
    author: "Deepak Chopra"
  },
  {
    id: 130,
    textEn: "Fear often exaggerates consequences.",
    textFr: "La peur exagère souvent les conséquences.",
    author: "Tim Urban"
  },
  {
    id: 131,
    textEn: "True strength is softness toward oneself.",
    textFr: "La véritable force réside dans la douceur envers soi-même.",
    author: "Gabor Maté"
  },
  {
    id: 132,
    textEn: "Courage is contagious.",
    textFr: "Le courage est contagieux.",
    author: "Brené Brown"
  },
  {
    id: 133,
    textEn: "When we care for our needs, conflict softens.",
    textFr: "Lorsque nous prenons soin de nos besoins, les conflits s'adoucissent.",
    author: "Thomas d'Ansembourg"
  },
  {
    id: 134,
    textEn: "Sound shapes emotion.",
    textFr: "Le son façonne l'émotion.",
    author: "Julian Treasure"
  },
  {
    id: 135,
    textEn: "Embodiment changes how we relate to fear.",
    textFr: "L'ancrage corporel transforme notre relation à la peur.",
    author: "Amy Cuddy"
  },
  {
    id: 136,
    textEn: "The courage to try sustains creativity.",
    textFr: "Le courage d'essayer nourrit la créativité.",
    author: "Sir Ken Robinson"
  },
  {
    id: 137,
    textEn: "When perception changes, experience changes.",
    textFr: "Lorsque la perception change, l'expérience change.",
    author: "Sadhguru"
  },
  {
    id: 138,
    textEn: "Purpose is a stabilizing force.",
    textFr: "Le sens est une force stabilisatrice.",
    author: "Simon Sinek"
  },
  {
    id: 139,
    textEn: "Stillness restores balance.",
    textFr: "L'immobilité rétablit l'équilibre.",
    author: "Deepak Chopra"
  },
  {
    id: 140,
    textEn: "We underestimate how adaptable we are.",
    textFr: "Nous sous-estimons notre capacité d'adaptation.",
    author: "Tim Urban"
  },
  {
    id: 141,
    textEn: "The body holds wisdom the mind resists.",
    textFr: "Le corps détient une sagesse à laquelle l'esprit résiste.",
    author: "Gabor Maté"
  },
  {
    id: 142,
    textEn: "We rise by practicing compassion.",
    textFr: "Nous nous élevons en pratiquant la compassion.",
    author: "Brené Brown"
  },
  {
    id: 143,
    textEn: "Gentleness reveals truth.",
    textFr: "La douceur révèle la vérité.",
    author: "Thomas d'Ansembourg"
  },
  {
    id: 144,
    textEn: "Listening is where trust begins.",
    textFr: "L'écoute est le point de départ de la confiance.",
    author: "Julian Treasure"
  },
  {
    id: 145,
    textEn: "Small acts of bravery reshape identity.",
    textFr: "De petits actes de courage transforment l'identité.",
    author: "Amy Cuddy"
  },
  {
    id: 146,
    textEn: "Creativity lives in curiosity.",
    textFr: "La créativité vit dans la curiosité.",
    author: "Sir Ken Robinson"
  },
  {
    id: 147,
    textEn: "Consciousness is the foundation of freedom.",
    textFr: "La conscience est le fondement de la liberté.",
    author: "Sadhguru"
  },
  {
    id: 148,
    textEn: "Progress depends on patience.",
    textFr: "Le progrès dépend de la patience.",
    author: "Simon Sinek"
  },
  {
    id: 149,
    textEn: "Change begins with awareness.",
    textFr: "Le changement commence par la conscience.",
    author: "Deepak Chopra"
  },
  {
    id: 150,
    textEn: "We grow by questioning defaults.",
    textFr: "Nous grandissons en remettant en question les évidences.",
    author: "Tim Urban"
  },
  {
    id: 151,
    textEn: "Compassion reconnects us with ourselves.",
    textFr: "La compassion nous reconnecte à nous-mêmes.",
    author: "Gabor Maté"
  },
  {
    id: 152,
    textEn: "Belonging is the opposite of fitting in.",
    textFr: "L'appartenance est l'opposé de la conformité.",
    author: "Brené Brown"
  },
  {
    id: 153,
    textEn: "Presence transforms communication.",
    textFr: "La présence transforme la communication.",
    author: "Thomas d'Ansembourg"
  },
  {
    id: 154,
    textEn: "Listening is a skill we can practice.",
    textFr: "L'écoute est une compétence que nous pouvons cultiver.",
    author: "Julian Treasure"
  },
  {
    id: 155,
    textEn: "Self-belief grows through experience.",
    textFr: "La confiance en soi se développe par l'expérience.",
    author: "Amy Cuddy"
  },
  {
    id: 156,
    textEn: "Originality flourishes with encouragement.",
    textFr: "L'originalité s'épanouit avec l'encouragement.",
    author: "Sir Ken Robinson"
  },
  {
    id: 157,
    textEn: "Life responds to awareness.",
    textFr: "La vie répond à la conscience.",
    author: "Sadhguru"
  },
  {
    id: 158,
    textEn: "Trust is built through reliability.",
    textFr: "La confiance se construit par la fiabilité.",
    author: "Simon Sinek"
  },
  {
    id: 159,
    textEn: "The unknown holds creative potential.",
    textFr: "L'inconnu recèle un potentiel créatif.",
    author: "Deepak Chopra"
  },
  {
    id: 160,
    textEn: "Our assumptions quietly shape our lives.",
    textFr: "Nos suppositions façonnent silencieusement nos vies.",
    author: "Tim Urban"
  },
  {
    id: 161,
    textEn: "Healing requires honesty.",
    textFr: "La guérison exige de l'honnêteté.",
    author: "Gabor Maté"
  },
  {
    id: 162,
    textEn: "Self-compassion opens the door to growth.",
    textFr: "L'auto-compassion ouvre la voie à la croissance.",
    author: "Brené Brown"
  },
  {
    id: 163,
    textEn: "Listening inwardly creates clarity.",
    textFr: "L'écoute intérieure crée la clarté.",
    author: "Thomas d'Ansembourg"
  },
  {
    id: 164,
    textEn: "Sound can calm or disturb.",
    textFr: "Le son peut apaiser ou perturber.",
    author: "Julian Treasure"
  },
  {
    id: 165,
    textEn: "Our bodies influence our beliefs.",
    textFr: "Nos corps influencent nos croyances.",
    author: "Amy Cuddy"
  },
  {
    id: 166,
    textEn: "Creativity is cultivated through trust.",
    textFr: "La créativité se cultive par la confiance.",
    author: "Sir Ken Robinson"
  },
  {
    id: 167,
    textEn: "When awareness grows, suffering diminishes.",
    textFr: "Lorsque la conscience grandit, la souffrance diminue.",
    author: "Sadhguru"
  },
  {
    id: 168,
    textEn: "Purpose gives direction in chaos.",
    textFr: "Le sens donne une direction dans le chaos.",
    author: "Simon Sinek"
  },
  {
    id: 169,
    textEn: "Silence reconnects us to ourselves.",
    textFr: "Le silence nous reconnecte à nous-mêmes.",
    author: "Deepak Chopra"
  },
  {
    id: 170,
    textEn: "Change feels slower while it's happening.",
    textFr: "Le changement semble plus lent pendant qu'il est en cours.",
    author: "Tim Urban"
  },
  {
    id: 171,
    textEn: "Compassion is the medicine.",
    textFr: "La compassion est le remède.",
    author: "Gabor Maté"
  },
  {
    id: 172,
    textEn: "We heal by being seen.",
    textFr: "Nous guérissons en étant vus.",
    author: "Brené Brown"
  },
  {
    id: 173,
    textEn: "Choice begins with awareness.",
    textFr: "Le choix commence avec la conscience.",
    author: "Thomas d'Ansembourg"
  },
  {
    id: 174,
    textEn: "Listening alters perception.",
    textFr: "L'écoute modifie la perception.",
    author: "Julian Treasure"
  },
  {
    id: 175,
    textEn: "Confidence grows when we honor our values.",
    textFr: "La confiance grandit lorsque nous honorons nos valeurs.",
    author: "Amy Cuddy"
  },
  {
    id: 176,
    textEn: "Creativity expands with permission.",
    textFr: "La créativité s'élargit lorsqu'on s'en donne la permission.",
    author: "Sir Ken Robinson"
  },
  {
    id: 177,
    textEn: "Inner responsibility creates freedom.",
    textFr: "La responsabilité intérieure crée la liberté.",
    author: "Sadhguru"
  },
  {
    id: 178,
    textEn: "Consistency creates trust.",
    textFr: "La constance crée la confiance.",
    author: "Simon Sinek"
  },
  {
    id: 179,
    textEn: "Awareness awakens possibility.",
    textFr: "La conscience éveille les possibles.",
    author: "Deepak Chopra"
  },
  {
    id: 180,
    textEn: "We change by noticing.",
    textFr: "Nous changeons en portant attention.",
    author: "Tim Urban"
  },
  {
    id: 181,
    textEn: "The present moment is the only place where life exists.",
    textFr: "Le moment présent est le seul endroit où la vie existe.",
    author: "Eckhart Tolle"
  },
  {
    id: 182,
    textEn: "Where focus goes, energy flows.",
    textFr: "Là où va l'attention, l'énergie circule.",
    author: "Tony Robbins"
  },
  {
    id: 183,
    textEn: "If you don't get a miracle, become one.",
    textFr: "Si vous n'obtenez pas de miracle, devenez-en un.",
    author: "Nick Vujicic"
  },
  {
    id: 184,
    textEn: "Every thought we think is creating our future.",
    textFr: "Chaque pensée que nous avons est en train de créer notre avenir.",
    author: "Louise Hay"
  },
  {
    id: 185,
    textEn: "Compare yourself to who you were yesterday, not to who someone else is today.",
    textFr: "Comparez-vous à la personne que vous étiez hier, pas à celle que quelqu'un d'autre est aujourd'hui.",
    author: "Jordan Peterson"
  },
  {
    id: 186,
    textEn: "You have to trust that the dots will somehow connect.",
    textFr: "Vous devez faire confiance au fait que les points finiront par se relier.",
    author: "Chris Gardner"
  },
  {
    id: 187,
    textEn: "Financial freedom is available to those who learn about it and work for it.",
    textFr: "La liberté financière est accessible à ceux qui l'étudient et qui travaillent pour l'obtenir.",
    author: "Robert Kiyosaki"
  },
  {
    id: 188,
    textEn: "When you want to succeed as bad as you want to breathe, then you'll be successful.",
    textFr: "Lorsque vous voulez réussir autant que vous voulez respirer, alors vous réussirez.",
    author: "Eric Thomas"
  },
  {
    id: 189,
    textEn: "Where there is ruin, there is hope for a treasure.",
    textFr: "Là où il y a ruine, il y a l'espoir d'un trésor.",
    author: "Rumi"
  },
  {
    id: 190,
    textEn: "To one who has faith, no explanation is necessary.",
    textFr: "Pour celui qui a la foi, aucune explication n'est nécessaire.",
    author: "Thomas Aquinas"
  },
  {
    id: 191,
    textEn: "The important thing is not to stop questioning.",
    textFr: "L'essentiel est de ne jamais cesser de questionner.",
    author: "Albert Einstein"
  },
  {
    id: 192,
    textEn: "Life is a tragedy when seen in close-up, but a comedy in long-shot.",
    textFr: "La vie est une tragédie vue de près, mais une comédie vue de loin.",
    author: "Charlie Chaplin"
  },
  {
    id: 193,
    textEn: "No matter what people tell you, words and ideas can change the world.",
    textFr: "Quoi que l'on vous dise, les mots et les idées peuvent changer le monde.",
    author: "Robin Williams"
  },
  {
    id: 194,
    textEn: "Be kind to everyone, even if it hurts.",
    textFr: "Soyez bienveillant envers chacun, même lorsque cela fait mal.",
    author: "Keanu Reeves"
  },
  {
    id: 195,
    textEn: "Awareness is the greatest agent for change.",
    textFr: "La conscience est le plus grand agent de changement.",
    author: "Eckhart Tolle"
  },
  {
    id: 196,
    textEn: "It is in your moments of decision that your destiny is shaped.",
    textFr: "C'est dans vos moments de décision que votre destinée se façonne.",
    author: "Tony Robbins"
  },
  {
    id: 197,
    textEn: "Challenges are there to strengthen you, not stop you.",
    textFr: "Les défis sont là pour vous renforcer, pas pour vous arrêter.",
    author: "Nick Vujicic"
  },
  {
    id: 198,
    textEn: "You have the power to heal your life.",
    textFr: "Vous avez le pouvoir de guérir votre vie.",
    author: "Louise Hay"
  },
  {
    id: 199,
    textEn: "Pursue what is meaningful, not what is expedient.",
    textFr: "Poursuivez ce qui a du sens, pas ce qui est simplement commode.",
    author: "Jordan Peterson"
  },
  {
    id: 200,
    textEn: "Don't ever let somebody tell you you can't do something.",
    textFr: "Ne laissez jamais quelqu'un vous dire que vous ne pouvez pas faire quelque chose.",
    author: "Chris Gardner"
  },
  {
    id: 201,
    textEn: "The size of your success is measured by the strength of your desire.",
    textFr: "L'ampleur de votre réussite se mesure à la force de votre désir.",
    author: "Robert Kiyosaki"
  },
  {
    id: 202,
    textEn: "Pain is temporary. It may last a minute, or a day, or a year, but it will subside.",
    textFr: "La douleur est temporaire. Elle peut durer une minute, un jour ou un an, mais elle finira par s'apaiser.",
    author: "Eric Thomas"
  },
  {
    id: 203,
    textEn: "Yesterday I was clever, so I wanted to change the world. Today I am wise, so I am changing myself.",
    textFr: "Hier j'étais intelligent, alors je voulais changer le monde. Aujourd'hui je suis sage, alors je me change moi-même.",
    author: "Rumi"
  },
  {
    id: 204,
    textEn: "Wonder is the desire for knowledge.",
    textFr: "L'émerveillement est le désir de connaître.",
    author: "Thomas Aquinas"
  },
  {
    id: 205,
    textEn: "Imagination is more important than knowledge.",
    textFr: "L'imagination est plus importante que le savoir.",
    author: "Albert Einstein"
  },
  {
    id: 206,
    textEn: "You'll never find a rainbow if you're looking down.",
    textFr: "Vous ne trouverez jamais d'arc-en-ciel si vous regardez toujours vers le bas.",
    author: "Charlie Chaplin"
  },
  {
    id: 207,
    textEn: "You're only given a little spark of madness. You mustn't lose it.",
    textFr: "On ne vous donne qu'une petite étincelle de folie. Ne la perdez surtout pas.",
    author: "Robin Williams"
  },
  {
    id: 208,
    textEn: "Sometimes simple things are the most difficult to achieve.",
    textFr: "Parfois, les choses les plus simples sont les plus difficiles à accomplir.",
    author: "Keanu Reeves"
  },
  {
    id: 209,
    textEn: "To love is to recognize yourself in another.",
    textFr: "Aimer, c'est se reconnaître soi-même en l'autre.",
    author: "Eckhart Tolle"
  },
  {
    id: 210,
    textEn: "Setting goals is the first step in turning the invisible into the visible.",
    textFr: "Fixer des objectifs est la première étape pour rendre visible l'invisible.",
    author: "Tony Robbins"
  },
  {
    id: 211,
    textEn: "It's a lie to think you're not good enough.",
    textFr: "Croire que vous n'êtes pas à la hauteur est un mensonge.",
    author: "Nick Vujicic"
  },
  {
    id: 212,
    textEn: "Self-approval and self-acceptance are the keys to positive change.",
    textFr: "L'approbation de soi et l'acceptation de soi sont les clés du changement positif.",
    author: "Louise Hay"
  },
  {
    id: 213,
    textEn: "Responsibility is what gives life meaning.",
    textFr: "La responsabilité est ce qui donne du sens à la vie.",
    author: "Jordan Peterson"
  },
  {
    id: 214,
    textEn: "You have a dream, you got to protect it.",
    textFr: "Lorsque vous avez un rêve, vous devez le protéger.",
    author: "Chris Gardner"
  },
  {
    id: 215,
    textEn: "Learning is the beginning of wealth.",
    textFr: "L'apprentissage est le commencement de la richesse.",
    author: "Robert Kiyosaki"
  },
  {
    id: 216,
    textEn: "You owe you an explanation.",
    textFr: "Vous vous devez des explications.",
    author: "Eric Thomas"
  },
  {
    id: 217,
    textEn: "Why are you so busy with this or that good or bad; pay attention to how things blend.",
    textFr: "Pourquoi êtes-vous si occupé par le bien ou le mal ? Observez plutôt comment les choses se mêlent.",
    author: "Rumi"
  },
  {
    id: 218,
    textEn: "Faith has to do with things that are not seen.",
    textFr: "La foi concerne ce qui ne se voit pas.",
    author: "Thomas Aquinas"
  },
  {
    id: 219,
    textEn: "A calm and modest life brings more happiness than the pursuit of success.",
    textFr: "Une vie calme et modeste apporte plus de bonheur que la poursuite du succès.",
    author: "Albert Einstein"
  },
  {
    id: 220,
    textEn: "Nothing is permanent in this wicked world — not even our troubles.",
    textFr: "Rien n'est permanent dans ce monde — pas même nos difficultés.",
    author: "Charlie Chaplin"
  },
  {
    id: 221,
    textEn: "Everyone you meet is fighting a battle you know nothing about.",
    textFr: "Chaque personne que vous rencontrez mène un combat dont vous ne savez rien.",
    author: "Robin Williams"
  },
  {
    id: 222,
    textEn: "Grief and loss are things that never go away, but they soften.",
    textFr: "Le chagrin et la perte ne disparaissent jamais vraiment, mais ils s'adoucissent avec le temps.",
    author: "Keanu Reeves"
  },
  {
    id: 223,
    textEn: "Life will give you whatever experience is most helpful for the evolution of your consciousness.",
    textFr: "La vie vous offrira l'expérience la plus utile à l'évolution de votre conscience.",
    author: "Eckhart Tolle"
  },
  {
    id: 224,
    textEn: "Your past does not equal your future.",
    textFr: "Votre passé ne détermine pas votre avenir.",
    author: "Tony Robbins"
  },
  {
    id: 225,
    textEn: "You don't know what you can achieve until you try.",
    textFr: "Vous ne savez pas ce que vous pouvez accomplir tant que vous n'essayez pas.",
    author: "Nick Vujicic"
  },
  {
    id: 226,
    textEn: "The point of power is always in the present moment.",
    textFr: "Le point de pouvoir se situe toujours dans le moment présent.",
    author: "Louise Hay"
  },
  {
    id: 227,
    textEn: "Tell the truth — or, at least, don't lie.",
    textFr: "Dites la vérité — ou, à défaut, ne mentez pas.",
    author: "Jordan Peterson"
  },
  {
    id: 228,
    textEn: "The world is your oyster. It's up to you to find the pearls.",
    textFr: "Le monde est à vous. À vous d'y trouver les perles.",
    author: "Chris Gardner"
  },
  {
    id: 229,
    textEn: "Your mind is your most powerful asset.",
    textFr: "Votre esprit est votre atout le plus puissant.",
    author: "Robert Kiyosaki"
  },
  {
    id: 230,
    textEn: "When you feel like quitting, remember why you started.",
    textFr: "Lorsque vous avez envie d'abandonner, rappelez-vous pourquoi vous avez commencé.",
    author: "Eric Thomas"
  },
  {
    id: 231,
    textEn: "What you seek is seeking you.",
    textFr: "Ce que vous cherchez vous cherche également.",
    author: "Rumi"
  },
  {
    id: 232,
    textEn: "Good can exist without evil, whereas evil cannot exist without good.",
    textFr: "Le bien peut exister sans le mal, tandis que le mal ne peut exister sans le bien.",
    author: "Thomas Aquinas"
  },
  {
    id: 233,
    textEn: "Try not to become a man of success, but rather a man of value.",
    textFr: "Essayez de ne pas devenir une personne de succès, mais plutôt une personne de valeur.",
    author: "Albert Einstein"
  },
  {
    id: 234,
    textEn: "Failure is unimportant. It takes courage to make a fool of yourself.",
    textFr: "L'échec n'est pas important. Il faut du courage pour accepter de se ridiculiser.",
    author: "Charlie Chaplin"
  },
  {
    id: 235,
    textEn: "I think the saddest people always try their hardest to make people happy.",
    textFr: "Je crois que les personnes les plus tristes sont souvent celles qui s'efforcent le plus de rendre les autres heureux.",
    author: "Robin Williams"
  },
  {
    id: 236,
    textEn: "Someone once told me the definition of hell: on your last day on earth, the person you became meets the person you could have become.",
    textFr: "Quelqu'un m'a dit un jour que l'enfer, c'est lorsque, à la fin de votre vie, la personne que vous êtes devenu rencontre celle que vous auriez pu devenir.",
    author: "Keanu Reeves"
  },
  {
    id: 237,
    textEn: "Realize deeply that the present moment is all you ever have.",
    textFr: "Réalisez profondément que le moment présent est tout ce que vous avez réellement.",
    author: "Eckhart Tolle"
  },
  {
    id: 238,
    textEn: "Life is happening for you, not to you.",
    textFr: "La vie se déroule pour vous, et non contre vous.",
    author: "Tony Robbins"
  },
  {
    id: 239,
    textEn: "Fear is the biggest disability of all.",
    textFr: "La peur est le plus grand des handicaps.",
    author: "Nick Vujicic"
  },
  {
    id: 240,
    textEn: "I am in the process of positive change.",
    textFr: "Je suis engagé dans un processus de changement positif.",
    author: "Louise Hay"
  },
  {
    id: 241,
    textEn: "Meaning is found in responsibility.",
    textFr: "Le sens se trouve dans la responsabilité.",
    author: "Jordan Peterson"
  },
  {
    id: 242,
    textEn: "You are capable of more than you think.",
    textFr: "Vous êtes capable de bien plus que vous ne le pensez.",
    author: "Chris Gardner"
  },
  {
    id: 243,
    textEn: "Your future is created by what you do today, not tomorrow.",
    textFr: "Votre avenir se crée par ce que vous faites aujourd'hui, pas demain.",
    author: "Robert Kiyosaki"
  },
  {
    id: 244,
    textEn: "Average is not an option.",
    textFr: "La médiocrité n'est pas une option.",
    author: "Eric Thomas"
  },
  {
    id: 245,
    textEn: "Stop acting so small. You are the universe in ecstatic motion.",
    textFr: "Cessez de vous rapetisser. Vous êtes l'univers en mouvement extatique.",
    author: "Rumi"
  },
  {
    id: 246,
    textEn: "There is nothing on this earth more to be prized than true friendship.",
    textFr: "Il n'y a rien sur cette terre de plus précieux que la véritable amitié.",
    author: "Thomas Aquinas"
  },
  {
    id: 247,
    textEn: "The measure of intelligence is the ability to change.",
    textFr: "La mesure de l'intelligence est la capacité de changer.",
    author: "Albert Einstein"
  },
  {
    id: 248,
    textEn: "Smile, though your heart is aching.",
    textFr: "Souriez, même lorsque votre cœur est douloureux.",
    author: "Charlie Chaplin"
  },
  {
    id: 249,
    textEn: "You're not perfect, sport. And let me save you the suspense: this girl you've met, she's not perfect either.",
    textFr: "Tu n'es pas parfait, mon grand. Et pour t'épargner le suspense : la personne que tu as rencontrée ne l'est pas non plus.",
    author: "Robin Williams"
  },
  {
    id: 250,
    textEn: "Luxury is the ability to experience quality.",
    textFr: "Le luxe, c'est la capacité à faire l'expérience de la qualité.",
    author: "Keanu Reeves"
  },
  {
    id: 251,
    textEn: "Acceptance of the unacceptable is the greatest source of grace.",
    textFr: "L'acceptation de l'inacceptable est la plus grande source de grâce.",
    author: "Eckhart Tolle"
  },
  {
    id: 252,
    textEn: "It's not what we do once in a while that shapes our lives, but what we do consistently.",
    textFr: "Ce n'est pas ce que nous faisons de temps en temps qui façonne nos vies, mais ce que nous faisons avec constance.",
    author: "Tony Robbins"
  },
  {
    id: 253,
    textEn: "Strength grows when you decide not to quit.",
    textFr: "La force grandit lorsque vous décidez de ne pas abandonner.",
    author: "Nick Vujicic"
  },
  {
    id: 254,
    textEn: "I forgive myself for not being perfect.",
    textFr: "Je me pardonne de ne pas être parfait.",
    author: "Louise Hay"
  },
  {
    id: 255,
    textEn: "Set your house in perfect order before you criticize the world.",
    textFr: "Mettez de l'ordre dans votre propre maison avant de critiquer le monde.",
    author: "Jordan Peterson"
  },
  {
    id: 256,
    textEn: "Success is a continuous journey, not a destination.",
    textFr: "Le succès est un chemin continu, pas une destination.",
    author: "Chris Gardner"
  },
  {
    id: 257,
    textEn: "Don't let fear of losing be greater than the excitement of winning.",
    textFr: "Ne laissez pas la peur de perdre être plus grande que l'enthousiasme de gagner.",
    author: "Robert Kiyosaki"
  },
  {
    id: 258,
    textEn: "You can't cheat the grind.",
    textFr: "On ne peut pas tricher avec l'effort.",
    author: "Eric Thomas"
  },
  {
    id: 259,
    textEn: "Set your life on fire. Seek those who fan your flames.",
    textFr: "Mettez le feu à votre vie. Cherchez ceux qui attisent vos flammes.",
    author: "Rumi"
  },
  {
    id: 260,
    textEn: "Sorrow can be alleviated by good sleep, a bath and a glass of wine.",
    textFr: "La tristesse peut être apaisée par un bon sommeil, un bain et un verre de vin.",
    author: "Thomas Aquinas"
  },
  {
    id: 261,
    textEn: "Peace cannot be kept by force; it can only be achieved by understanding.",
    textFr: "La paix ne peut être maintenue par la force ; elle ne peut être atteinte que par la compréhension.",
    author: "Albert Einstein"
  },
  {
    id: 262,
    textEn: "To truly laugh, you must be able to take your pain and play with it.",
    textFr: "Pour rire véritablement, il faut savoir prendre sa douleur et jouer avec elle.",
    author: "Charlie Chaplin"
  },
  {
    id: 263,
    textEn: "The human spirit is more powerful than any drug.",
    textFr: "L'esprit humain est plus puissant que n'importe quelle drogue.",
    author: "Robin Williams"
  },
  {
    id: 264,
    textEn: "If you have been brutally broken but still have the courage to be gentle to others, then you deserve nothing but love.",
    textFr: "Si vous avez été brisé mais que vous trouvez encore le courage d'être doux avec les autres, alors vous méritez tout l'amour.",
    author: "Keanu Reeves"
  },
  {
    id: 265,
    textEn: "Surrender is the simple but profound wisdom of yielding to rather than opposing the flow of life.",
    textFr: "L'abandon est la sagesse simple mais profonde qui consiste à suivre le courant de la vie plutôt que de lui résister.",
    author: "Eckhart Tolle"
  },
  {
    id: 266,
    textEn: "Problems are gifts that make us stronger.",
    textFr: "Les problèmes sont des cadeaux qui nous rendent plus forts.",
    author: "Tony Robbins"
  },
  {
    id: 267,
    textEn: "Attitude determines direction.",
    textFr: "L'attitude détermine la direction.",
    author: "Nick Vujicic"
  },
  {
    id: 268,
    textEn: "Love is the great miracle cure.",
    textFr: "L'amour est le grand remède miracle.",
    author: "Louise Hay"
  },
  {
    id: 269,
    textEn: "The purpose of life is finding the largest burden that you can bear.",
    textFr: "Le but de la vie est de trouver le fardeau le plus lourd que vous puissiez porter.",
    author: "Jordan Peterson"
  },
  {
    id: 270,
    textEn: "You are defined by what you do when it matters most.",
    textFr: "Vous êtes défini par ce que vous faites lorsque cela compte vraiment.",
    author: "Chris Gardner"
  },
  {
    id: 271,
    textEn: "Whatever the present moment contains, accept it as if you had chosen it.",
    textFr: "Quoi que contienne le moment présent, acceptez-le comme si vous l'aviez choisi.",
    author: "Eckhart Tolle"
  },
  {
    id: 272,
    textEn: "When you let go of who you are, you become who you might be.",
    textFr: "Lorsque vous lâchez l'idée de ce que vous êtes, vous devenez ce que vous pourriez être.",
    author: "Rumi"
  },
  {
    id: 273,
    textEn: "Learn from yesterday, live for today, hope for tomorrow.",
    textFr: "Apprenez d'hier, vivez aujourd'hui, espérez pour demain.",
    author: "Albert Einstein"
  },
  {
    id: 274,
    textEn: "In the infinity of life, all is perfect, whole, and complete.",
    textFr: "Dans l'infinité de la vie, tout est parfait, entier et complet.",
    author: "Louise Hay"
  },
  {
    id: 275,
    textEn: "The simple act of paying attention can take you a long way.",
    textFr: "Le simple fait de porter attention peut vous mener très loin.",
    author: "Keanu Reeves"
  },
  {
    id: 276,
    textEn: "Better to illuminate than merely to shine.",
    textFr: "Mieux vaut éclairer que simplement briller.",
    author: "Thomas Aquinas"
  },
  {
    id: 277,
    textEn: "Sometimes you have to specifically go out of your way to get back on the right path.",
    textFr: "Parfois, il faut faire un détour conscient pour revenir sur le bon chemin.",
    author: "Robin Williams"
  },
  {
    id: 278,
    textEn: "It's your unlimited power to care and to love that can make the biggest difference.",
    textFr: "C'est votre capacité illimitée à prendre soin et à aimer qui peut faire la plus grande différence.",
    author: "Tony Robbins"
  },
  {
    id: 279,
    textEn: "Hope is being able to see that there is light despite all of the darkness.",
    textFr: "L'espoir, c'est voir qu'il existe une lumière malgré toute l'obscurité.",
    author: "Nick Vujicic"
  },
  {
    id: 280,
    textEn: "Life could be wonderful if people would leave you alone.",
    textFr: "La vie pourrait être merveilleuse si les gens vous laissaient tranquille.",
    author: "Charlie Chaplin"
  },
  {
    id: 281,
    textEn: "Acknowledging the good that is already in your life is the foundation for all abundance.",
    textFr: "Reconnaître le bien déjà présent dans votre vie est le fondement de toute abondance.",
    author: "Eckhart Tolle"
  },
  {
    id: 282,
    textEn: "Sell your cleverness and buy bewilderment; cleverness is mere opinion.",
    textFr: "Vendez votre habileté et achetez l'émerveillement ; l'habileté n'est qu'opinion.",
    author: "Rumi"
  },
  {
    id: 283,
    textEn: "In the middle of difficulty lies opportunity.",
    textFr: "Au cœur de la difficulté se trouve l'opportunité.",
    author: "Albert Einstein"
  },
  {
    id: 284,
    textEn: "Deep at the center of my being, there is an infinite well of love.",
    textFr: "Au plus profond de mon être, se trouve une source infinie d'amour.",
    author: "Louise Hay"
  },
  {
    id: 285,
    textEn: "Energy doesn't lie. If something feels off, it probably is.",
    textFr: "L'énergie ne ment pas. Si quelque chose semble faux, c'est probablement le cas.",
    author: "Keanu Reeves"
  },
  {
    id: 286,
    textEn: "The things that we love tell us what we are.",
    textFr: "Les choses que nous aimons disent qui nous sommes.",
    author: "Thomas Aquinas"
  },
  {
    id: 287,
    textEn: "You're only given a little spark of madness. You mustn't lose it.",
    textFr: "On ne vous donne qu'une petite étincelle de folie. Ne la perdez pas.",
    author: "Robin Williams"
  },
  {
    id: 288,
    textEn: "Life is not about waiting for the storm to pass, it's about learning to dance in the rain.",
    textFr: "La vie ne consiste pas à attendre que l'orage passe, mais à apprendre à danser sous la pluie.",
    author: "Tony Robbins"
  },
  {
    id: 289,
    textEn: "If you can't get a miracle, become one.",
    textFr: "Si vous ne pouvez pas obtenir de miracle, devenez-en un.",
    author: "Nick Vujicic"
  },
  {
    id: 290,
    textEn: "We think too much and feel too little.",
    textFr: "Nous pensons trop et ressentons trop peu.",
    author: "Charlie Chaplin"
  },
  {
    id: 291,
    textEn: "Sometimes letting things go is an act of far greater power than defending or hanging on.",
    textFr: "Parfois, laisser aller est un acte de bien plus grande puissance que se défendre ou s'accrocher.",
    author: "Eckhart Tolle"
  },
  {
    id: 292,
    textEn: "Why are you busy with this or that good or bad; pay attention to how things blend.",
    textFr: "Pourquoi êtes-vous si occupé par le bien ou le mal ? Portez plutôt attention à la manière dont les choses se mêlent.",
    author: "Rumi"
  },
  {
    id: 293,
    textEn: "A person who never made a mistake never tried anything new.",
    textFr: "Une personne qui n'a jamais fait d'erreur n'a jamais rien essayé de nouveau.",
    author: "Albert Einstein"
  },
  {
    id: 294,
    textEn: "I trust the process of life.",
    textFr: "J'ai confiance dans le processus de la vie.",
    author: "Louise Hay"
  },
  {
    id: 295,
    textEn: "Sometimes the smallest step in the right direction ends up being the biggest step of your life.",
    textFr: "Parfois, le plus petit pas dans la bonne direction devient le plus grand pas de votre vie.",
    author: "Keanu Reeves"
  },
  {
    id: 296,
    textEn: "Joy is the infallible sign of the presence of God.",
    textFr: "La joie est le signe infaillible de la présence de Dieu.",
    author: "Thomas Aquinas"
  },
  {
    id: 297,
    textEn: "You're not wrong for feeling the way you do.",
    textFr: "Vous n'avez pas tort de ressentir ce que vous ressentez.",
    author: "Robin Williams"
  },
  {
    id: 298,
    textEn: "What you link pain to and what you link pleasure to shapes your destiny.",
    textFr: "Ce que vous associez à la douleur et ce que vous associez au plaisir façonne votre destinée.",
    author: "Tony Robbins"
  },
  {
    id: 299,
    textEn: "Life without limbs is not life without purpose.",
    textFr: "Une vie sans membres n'est pas une vie sans sens.",
    author: "Nick Vujicic"
  },
  {
    id: 300,
    textEn: "Failure is unimportant. It takes courage to make a fool of yourself.",
    textFr: "L'échec n'est pas important. Il faut du courage pour accepter de se ridiculiser.",
    author: "Charlie Chaplin"
  },
  {
    id: 301,
    textEn: "You are here to enable the divine purpose of the universe to unfold.",
    textFr: "Vous êtes ici pour permettre au dessein divin de l'univers de se déployer.",
    author: "Eckhart Tolle"
  },
  {
    id: 302,
    textEn: "Let yourself be silently drawn by the strange pull of what you really love.",
    textFr: "Laissez-vous attirer silencieusement par l'étrange appel de ce que vous aimez vraiment.",
    author: "Rumi"
  },
  {
    id: 303,
    textEn: "Only a life lived for others is a life worthwhile.",
    textFr: "Seule une vie vécue pour les autres mérite d'être vécue.",
    author: "Albert Einstein"
  },
  {
    id: 304,
    textEn: "I am willing to release the need to be perfect.",
    textFr: "Je suis prêt à renoncer au besoin d'être parfait.",
    author: "Louise Hay"
  },
  {
    id: 305,
    textEn: "Respect yourself enough to walk away from anything that no longer serves you.",
    textFr: "Respectez-vous suffisamment pour vous éloigner de ce qui ne vous sert plus.",
    author: "Keanu Reeves"
  },
  {
    id: 306,
    textEn: "Love takes up where knowledge leaves off.",
    textFr: "L'amour prend le relais là où le savoir s'arrête.",
    author: "Thomas Aquinas"
  },
  {
    id: 307,
    textEn: "The bravest thing you can do is ask for help.",
    textFr: "La chose la plus courageuse que vous puissiez faire est de demander de l'aide.",
    author: "Robin Williams"
  },
  {
    id: 308,
    textEn: "Your identity shapes your destiny.",
    textFr: "Votre identité façonne votre destinée.",
    author: "Tony Robbins"
  },
  {
    id: 309,
    textEn: "No matter how bad it gets, you can always find something to be grateful for.",
    textFr: "Peu importe la difficulté, il y a toujours quelque chose pour lequel être reconnaissant.",
    author: "Nick Vujicic"
  },
  {
    id: 310,
    textEn: "A day without laughter is a day wasted.",
    textFr: "Une journée sans rire est une journée perdue.",
    author: "Charlie Chaplin"
  },
  {
    id: 311,
    textEn: "The moment you accept what troubles you've been given, the door will open.",
    textFr: "Dès l'instant où vous acceptez les épreuves qui vous ont été données, la porte s'ouvre.",
    author: "Rumi"
  },
  {
    id: 312,
    textEn: "Peace comes from within. Do not seek it without.",
    textFr: "La paix vient de l'intérieur. Ne la cherchez pas à l'extérieur.",
    author: "Buddha"
  },
  {
    id: 313,
    textEn: "A happy life consists in the tranquillity of mind.",
    textFr: "Une vie heureuse consiste en la tranquillité de l'esprit.",
    author: "Cicero"
  },
  {
    id: 314,
    textEn: "Sometimes you have to let go of who you were to become who you will be.",
    textFr: "Parfois, il faut abandonner ce que l'on était pour devenir ce que l'on sera.",
    author: "Eckhart Tolle"
  },
  {
    id: 315,
    textEn: "What we achieve inwardly will change outer reality.",
    textFr: "Ce que nous accomplissons intérieurement transforme la réalité extérieure.",
    author: "Plutarch"
  },
  {
    id: 316,
    textEn: "Life isn't about finding yourself. Life is about creating yourself.",
    textFr: "La vie ne consiste pas à se trouver, mais à se créer.",
    author: "George Bernard Shaw"
  },
  {
    id: 317,
    textEn: "You are not a drop in the ocean. You are the entire ocean in a drop.",
    textFr: "Vous n'êtes pas une goutte dans l'océan. Vous êtes l'océan tout entier dans une goutte.",
    author: "Rumi"
  },
  {
    id: 318,
    textEn: "The quieter you become, the more you are able to hear.",
    textFr: "Plus vous devenez silencieux, plus vous êtes capable d'entendre.",
    author: "Rumi"
  },
  {
    id: 319,
    textEn: "Nothing can dim the light which shines from within.",
    textFr: "Rien ne peut éteindre la lumière qui brille de l'intérieur.",
    author: "Maya Angelou"
  },
  {
    id: 320,
    textEn: "The privilege of a lifetime is to become who you truly are.",
    textFr: "Le privilège d'une vie est de devenir pleinement soi-même.",
    author: "Carl Jung"
  },
  {
    id: 321,
    textEn: "Turn your wounds into wisdom.",
    textFr: "Transformez vos blessures en sagesse.",
    author: "Oprah Winfrey"
  },
  {
    id: 322,
    textEn: "What lies behind us and what lies before us are tiny matters compared to what lies within us.",
    textFr: "Ce qui se trouve derrière nous et devant nous est peu de chose comparé à ce qui se trouve en nous.",
    author: "Ralph Waldo Emerson"
  },
  {
    id: 323,
    textEn: "Life can only be understood backwards; but it must be lived forwards.",
    textFr: "La vie ne peut être comprise qu'en regardant en arrière, mais elle doit être vécue en avant.",
    author: "Søren Kierkegaard"
  },
  {
    id: 324,
    textEn: "To live is the rarest thing in the world. Most people exist, that is all.",
    textFr: "Vivre est la chose la plus rare au monde. La plupart des gens se contentent d'exister.",
    author: "Oscar Wilde"
  },
  {
    id: 325,
    textEn: "Knowing yourself is the beginning of all wisdom.",
    textFr: "Se connaître soi-même est le commencement de toute sagesse.",
    author: "Aristotle"
  },
  {
    id: 326,
    textEn: "Do not dwell in the past, do not dream of the future, concentrate the mind on the present moment.",
    textFr: "Ne vous attardez pas sur le passé, ne rêvez pas du futur, concentrez votre esprit sur le moment présent.",
    author: "Buddha"
  },
  {
    id: 327,
    textEn: "We are not human beings having a spiritual experience. We are spiritual beings having a human experience.",
    textFr: "Nous ne sommes pas des êtres humains vivant une expérience spirituelle, mais des êtres spirituels vivant une expérience humaine.",
    author: "Pierre Teilhard de Chardin"
  },
  {
    id: 328,
    textEn: "Do what you can, with what you have, where you are.",
    textFr: "Faites ce que vous pouvez, avec ce que vous avez, là où vous êtes.",
    author: "Theodore Roosevelt"
  },
  {
    id: 329,
    textEn: "He who has a why to live can bear almost any how.",
    textFr: "Celui qui a un pourquoi peut supporter presque n'importe quel comment.",
    author: "Friedrich Nietzsche"
  },
  {
    id: 330,
    textEn: "Happiness is not something ready made. It comes from your own actions.",
    textFr: "Le bonheur n'est pas quelque chose de prêt à l'emploi. Il découle de vos propres actions.",
    author: "Dalai Lama"
  },
  {
    id: 331,
    textEn: "Life is really simple, but we insist on making it complicated.",
    textFr: "La vie est vraiment simple, mais nous insistons pour la compliquer.",
    author: "Confucius"
  },
  {
    id: 332,
    textEn: "Where there is love there is life.",
    textFr: "Là où il y a de l'amour, il y a de la vie.",
    author: "Mahatma Gandhi"
  },
  {
    id: 333,
    textEn: "The soul becomes dyed with the color of its thoughts.",
    textFr: "L'âme se colore de la teinte de ses pensées.",
    author: "Marcus Aurelius"
  },
  {
    id: 334,
    textEn: "What you do makes a difference, and you have to decide what kind of difference you want to make.",
    textFr: "Ce que vous faites fait une différence, et c'est à vous de décider quelle différence vous voulez faire.",
    author: "Jane Goodall"
  },
  {
    id: 335,
    textEn: "Simplicity is the ultimate sophistication.",
    textFr: "La simplicité est la sophistication suprême.",
    author: "Leonardo da Vinci"
  },
  {
    id: 336,
    textEn: "Be yourself; everyone else is already taken.",
    textFr: "Soyez vous-même ; tous les autres sont déjà pris.",
    author: "Oscar Wilde"
  },
  {
    id: 337,
    textEn: "When you change the way you look at things, the things you look at change.",
    textFr: "Lorsque vous changez votre façon de regarder les choses, les choses que vous regardez changent.",
    author: "Wayne Dyer"
  },
  {
    id: 338,
    textEn: "The wound is the place where the Light enters you.",
    textFr: "La blessure est l'endroit par lequel la lumière entre en vous.",
    author: "Rumi"
  },
  {
    id: 339,
    textEn: "Act as if what you do makes a difference. It does.",
    textFr: "Agissez comme si ce que vous faisiez faisait une différence. C'est le cas.",
    author: "William James"
  },
  {
    id: 340,
    textEn: "You are enough just as you are.",
    textFr: "Vous êtes suffisant tel que vous êtes.",
    author: "Meghan Markle"
  },
  {
    id: 341,
    textEn: "The best way out is always through.",
    textFr: "La meilleure issue passe toujours par le fait de traverser.",
    author: "Robert Frost"
  },
  {
    id: 342,
    textEn: "We don't see things as they are, we see them as we are.",
    textFr: "Nous ne voyons pas les choses telles qu'elles sont, mais telles que nous sommes.",
    author: "Anaïs Nin"
  },
  {
    id: 343,
    textEn: "The meaning of life is to give life meaning.",
    textFr: "Le sens de la vie est de donner un sens à la vie.",
    author: "Viktor Frankl"
  },
  {
    id: 344,
    textEn: "It is never too late to be what you might have been.",
    textFr: "Il n'est jamais trop tard pour devenir ce que vous auriez pu être.",
    author: "George Eliot"
  },
  {
    id: 345,
    textEn: "In the end, we will remember not the words of our enemies, but the silence of our friends.",
    textFr: "À la fin, nous ne nous souviendrons pas des paroles de nos ennemis, mais du silence de nos amis.",
    author: "Martin Luther King Jr."
  },
  {
    id: 346,
    textEn: "Live as if you were to die tomorrow. Learn as if you were to live forever.",
    textFr: "Vivez comme si vous deviez mourir demain. Apprenez comme si vous deviez vivre toujours.",
    author: "Mahatma Gandhi"
  },
  {
    id: 347,
    textEn: "The only real mistake is the one from which we learn nothing.",
    textFr: "La seule véritable erreur est celle dont nous n'apprenons rien.",
    author: "Henry Ford"
  },
  {
    id: 348,
    textEn: "Happiness depends upon ourselves.",
    textFr: "Le bonheur dépend de nous-mêmes.",
    author: "Aristotle"
  },
  {
    id: 349,
    textEn: "If you want to conquer fear, don't sit at home and think about it. Go out and get busy.",
    textFr: "Si vous voulez vaincre la peur, ne restez pas chez vous à y penser. Sortez et passez à l'action.",
    author: "Dale Carnegie"
  },
  {
    id: 350,
    textEn: "What lies behind you and what lies in front of you pales in comparison to what lies inside of you.",
    textFr: "Ce qui se trouve derrière vous et devant vous pâlit en comparaison de ce qui se trouve en vous.",
    author: "Ralph Waldo Emerson"
  },
  {
    id: 351,
    textEn: "To be yourself in a world that is constantly trying to make you something else is the greatest accomplishment.",
    textFr: "Être soi-même dans un monde qui cherche constamment à vous transformer est le plus grand accomplissement.",
    author: "Ralph Waldo Emerson"
  },
  {
    id: 352,
    textEn: "Do not go where the path may lead, go instead where there is no path and leave a trail.",
    textFr: "N'allez pas là où le chemin mène, allez plutôt là où il n'y a pas de chemin et laissez une trace.",
    author: "Ralph Waldo Emerson"
  },
  {
    id: 353,
    textEn: "When one door of happiness closes, another opens.",
    textFr: "Lorsqu'une porte du bonheur se ferme, une autre s'ouvre.",
    author: "Helen Keller"
  },
  {
    id: 354,
    textEn: "Keep your face always toward the sunshine—and shadows will fall behind you.",
    textFr: "Gardez toujours votre visage tourné vers le soleil, et les ombres tomberont derrière vous.",
    author: "Walt Whitman"
  },
  {
    id: 355,
    textEn: "The future belongs to those who believe in the beauty of their dreams.",
    textFr: "L'avenir appartient à ceux qui croient en la beauté de leurs rêves.",
    author: "Eleanor Roosevelt"
  },
  {
    id: 356,
    textEn: "What we think, we become.",
    textFr: "Nous devenons ce que nous pensons.",
    author: "Buddha"
  },
  {
    id: 357,
    textEn: "Be the change that you wish to see in the world.",
    textFr: "Soyez le changement que vous souhaitez voir dans le monde.",
    author: "Mahatma Gandhi"
  },
  {
    id: 358,
    textEn: "Not everything that is faced can be changed, but nothing can be changed until it is faced.",
    textFr: "Tout ce qui est affronté ne peut pas être changé, mais rien ne peut être changé tant que ce n'est pas affronté.",
    author: "James Baldwin"
  },
  {
    id: 359,
    textEn: "The purpose of our lives is to be happy.",
    textFr: "Le but de notre vie est d'être heureux.",
    author: "Dalai Lama"
  },
  {
    id: 360,
    textEn: "What you get by achieving your goals is not as important as what you become by achieving your goals.",
    textFr: "Ce que vous obtenez en atteignant vos objectifs est moins important que ce que vous devenez en les atteignant.",
    author: "Zig Ziglar"
  },
  {
    id: 361,
    textEn: "You must be the change you wish to see in your life.",
    textFr: "Vous devez être le changement que vous souhaitez voir dans votre vie.",
    author: "Mahatma Gandhi"
  },
  {
    id: 362,
    textEn: "Your vision will become clear only when you look into your heart.",
    textFr: "Votre vision deviendra claire lorsque vous regarderez dans votre cœur.",
    author: "Carl Jung"
  },
  {
    id: 363,
    textEn: "Do not wait for leaders; do it alone, person to person.",
    textFr: "N'attendez pas les leaders ; agissez vous-même, de personne à personne.",
    author: "Mother Teresa"
  },
  {
    id: 364,
    textEn: "The greatest discovery of any generation is that a human being can alter his life by altering his attitude.",
    textFr: "La plus grande découverte de toute génération est qu'un être humain peut transformer sa vie en changeant son attitude.",
    author: "William James"
  },
  {
    id: 365,
    textEn: "This is the real secret of life — to be completely engaged with what you are doing in the here and now.",
    textFr: "Voici le véritable secret de la vie : être pleinement engagé dans ce que vous faites ici et maintenant.",
    author: "Alan Watts"
  }
];

/**
 * Get the quote for today based on day of year.
 * Everyone sees the same quote on the same day.
 */
export function getTodaysQuote(): DailyQuote {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  const index = (dayOfYear - 1) % DAILY_QUOTES.length;
  return DAILY_QUOTES[index];
}
