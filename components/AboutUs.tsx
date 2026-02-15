import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Moon, Sparkles, Heart, Brain, Compass, Palette } from 'lucide-react';
import { motion } from 'framer-motion';
import { ROUTES } from '../routes/routes';

const AboutUs: React.FC = () => {
  const { language } = useApp();

  const content = {
    en: {
      title: 'About Me',
      intro: 'For many decades, my life has been guided by a deep passion for personal development, introspection, and healing the wounded inner child. I have always been drawn to understanding what lies beneath the surface — our emotions, our patterns, and the stories we tell ourselves — and to finding compassionate ways to reconnect with our inner truth.',
      discoveringTarot: 'Discovering Tarot',
      discoveringTarotP1: 'When I discovered the Tarot, I did not experience it as a tool of divination or prediction. That aspect of Tarot has never truly resonated with me. I do not believe that our lives are fixed or written in advance. I believe we create our own destinies through the choices we make and the actions we take.',
      discoveringTarotP2: 'For me, the Tarot is something entirely different.',
      discoveringTarotHighlight: 'The Tarot is, in my experience, the introspection tool par excellence.',
      discoveringTarotP3: 'It helps us explore the energy surrounding a situation or feeling and gently guides us inward — back to ourselves. The cards do not tell us what will happen; they help us understand what is happening within us right now.',
      // New personal journey section
      myJourneyTitle: 'My Journey With Tarot',
      myJourneyP1: 'I began working seriously with Tarot in 2017, after my mother passed away. It was a very dark time for me. I felt lost in a way I hadn\'t experienced before; unsure of who I was without her, unsure of where I was going.',
      myJourneyP2: 'During that period, Tarot became something steady. I would sit with the cards quietly, sometimes not even asking a clear question. I just needed something that helped me make sense of what I was feeling. And slowly, the images began to speak, not in dramatic predictions, but in gentle reflections.',
      myJourneyP3: 'I didn\'t experience Tarot as something that told me the future. Instead, it helped me understand the present. It showed me where I was holding grief in my body. It revealed patterns I had inherited. It helped me see where I was being hard on myself, and where I needed compassion instead.',
      myJourneyP4: 'Over time, this became a daily practice. I studied the symbolism of the Rider–Waite–Smith deck more deeply, not in an academic way, but through lived experience. I began to notice how consistently the archetypes mirrored real emotional processes; loss, resilience, fear, renewal. The cards became less mysterious and more like old friends pointing gently toward truth.',
      myJourneyP5: 'As I began to heal, I felt a quiet calling to share this approach with others. Alongside my work in energy healing and personal development, I started supporting people one-to-one, using Tarot as a reflective tool rather than a predictive one. Again and again, I saw how powerful it was when someone recognised themselves in a card, when they realised the answer wasn\'t outside them after all.',
      myJourneyP6: 'For me, Tarot is a mirror. It doesn\'t dictate destiny. It doesn\'t remove responsibility. It simply highlights what is already present and invites us to look a little more honestly, and a little more kindly, at ourselves.',
      myJourneyP7: 'It helped me find my way back to myself.',
      myJourneyP8: 'And that is why I share it.',
      whatTarotAllows: 'What Tarot Allows Us To Do',
      whatTarotAllowsIntro: 'Through this process, the Tarot allows us to:',
      tarotBenefit1: 'uncover hidden emotions and unconscious patterns',
      tarotBenefit2: 'recognise the voice of our wounded inner child',
      tarotBenefit3: 'step out of cycles of criticism, judgement, and self-blame',
      tarotBenefit4: 'reconnect with our inner wisdom and personal truth',
      answersQuote: 'The answers are never outside of us. The Tarot simply helps us listen more clearly.',
      imageryTitle: 'The Imagery',
      imageryText: 'The imagery you see throughout this site is a lovingly modernised rendering of the classic Rider-Waite-Smith deck — the most widely recognised and trusted Tarot deck in the world. While the visuals have been gently refreshed for a contemporary feel, the original symbolism, colours, and meaning of each card have been faithfully preserved. Every detail that makes this deck so powerful as a tool for reflection remains intact. You will find the same rich visual language that has guided seekers for over a century — simply presented in a way that feels welcoming and accessible to modern eyes.',
      backgroundP1: 'Alongside Tarot, I have worked for many years in energy healing and self-help coaching, supporting people one-to-one on their journey of growth and healing. While this work was deeply meaningful, the Covid period brought both frustration and clarity.',
      backgroundP2: 'I realised how limiting the traditional model could be: booking appointments, travelling, sitting for a session, then returning to daily life — often with the best intentions, yet gradually placing the insights on the back burner as life\'s demands took over.',
      backgroundP3: 'Covid became the catalyst for something new. I wanted to create a way for people to access guidance from the comfort of their own home, at any time of the day or night — without pressure, without appointments, and without needing to "know" Tarot.',
      aiTitle: 'How Technology Supports This Space',
      aiP1: 'This website uses artificial intelligence as a support tool — not to redefine or reinterpret the Tarot, but to help organise and express the meanings of the cards in a clear and accessible way.',
      aiP2: 'The foundations remain rooted in traditional Tarot symbolism, particularly the Rider–Waite–Smith system that I have studied and worked with in my own practice. The meanings themselves are not altered or reinvented. Instead, the technology helps to:',
      aiBenefit1: 'clarify how a card\'s meaning shifts depending on the position in which it appears',
      aiBenefit2: 'explore the relationships between cards within a spread',
      aiBenefit3: 'reflect their combined themes back into the question being asked',
      aiP3: 'In this way, the system acts more like an assistant — helping to articulate patterns and connections — while the heart of the interpretation remains grounded in established Tarot wisdom and reflective practice.',
      aiQuote: 'The insight does not come from the technology itself. It emerges from the dialogue between the symbolism of the cards, the intention behind the question, and your own inner awareness. The role of technology here is simply to help that dialogue flow more smoothly.',
      notFortune: 'This is not a fortune-telling site.',
      notPredicting: 'This is not about predicting the future.',
      notMysticMeg: 'And it is certainly not a modern version of Mystic Meg.',
      selfExplorationTitle: 'A Space for Self-Exploration',
      selfExplorationIntro: 'This space exists to support you in real, meaningful self-exploration. Here, you can:',
      selfExplorationBenefit1: 'choose a category that reflects what you\'re experiencing',
      selfExplorationBenefit2: 'ask your own question or be guided by carefully designed prompts',
      selfExplorationBenefit3: 'receive insight that helps you reflect, realign, and move forward',
      selfExplorationP2: 'You do not need to memorise all 78 Tarot cards or understand their traditional meanings — everything you need is already here. The Tarot becomes a mirror, helping you access the answers that already reside within you.',
      intentionP1: 'My intention is simple and heartfelt:',
      intentionHighlight: 'to guide, support, and empower you on your path toward deeper understanding and self-realisation.',
      intentionP2: 'This is a space for curiosity, compassion, and growth — a place to pause, reflect, and reconnect with your full potential.',
      finalQuote1: 'You already hold the answers.',
      finalQuote2: 'The Tarot is simply the doorway.',
      readyToBegin: 'Ready to begin your journey?',
      startReading: 'Start Your Reading',
    },
    fr: {
      title: 'À propos de moi',
      intro: 'Depuis plusieurs décennies, ma vie est guidée par une passion profonde pour le développement personnel, l\'introspection et la guérison de l\'enfant intérieur blessé. J\'ai toujours été attirée par ce qui se cache sous la surface — nos émotions, nos schémas, les histoires que nous nous racontons — et par la recherche de voies empreintes de compassion pour nous reconnecter à notre vérité intérieure.',
      discoveringTarot: 'Découvrir le Tarot',
      discoveringTarotP1: 'Lorsque j\'ai découvert le Tarot, je ne l\'ai pas perçu comme un outil de divination ou de prédiction. Cet aspect du Tarot ne m\'a jamais vraiment parlé. Je ne crois pas que nos vies soient figées ou écrites à l\'avance. Je crois que nous créons notre propre destinée à travers les choix que nous faisons et les actions que nous entreprenons.',
      discoveringTarotP2: 'Pour moi, le Tarot est tout autre chose.',
      discoveringTarotHighlight: 'Le Tarot est, selon mon expérience, l\'outil d\'introspection par excellence.',
      discoveringTarotP3: 'Il nous aide à explorer l\'énergie qui entoure une situation ou un ressenti, et nous guide doucement vers l\'intérieur — vers nous-mêmes. Les cartes ne nous disent pas ce qui va arriver ; elles nous aident à comprendre ce qui se passe en nous, ici et maintenant.',
      // New personal journey section
      myJourneyTitle: 'Mon Parcours Avec le Tarot',
      myJourneyP1: 'J\'ai commencé à travailler sérieusement avec le Tarot en 2017, après le décès de ma mère. C\'était une période très sombre pour moi. Je me sentais perdue d\'une façon que je n\'avais jamais connue auparavant ; incertaine de qui j\'étais sans elle, incertaine de ma direction.',
      myJourneyP2: 'Pendant cette période, le Tarot est devenu quelque chose de stable. Je m\'asseyais tranquillement avec les cartes, parfois sans même poser de question claire. J\'avais simplement besoin de quelque chose qui m\'aide à donner un sens à ce que je ressentais. Et lentement, les images ont commencé à parler, non pas en prédictions dramatiques, mais en réflexions douces.',
      myJourneyP3: 'Je n\'ai pas vécu le Tarot comme quelque chose qui me disait l\'avenir. Au contraire, il m\'a aidée à comprendre le présent. Il m\'a montré où je retenais le chagrin dans mon corps. Il a révélé des schémas dont j\'avais hérité. Il m\'a aidée à voir où j\'étais dure envers moi-même, et où j\'avais besoin de compassion à la place.',
      myJourneyP4: 'Avec le temps, c\'est devenu une pratique quotidienne. J\'ai étudié le symbolisme du Tarot Rider–Waite–Smith plus profondément, non pas de manière académique, mais à travers l\'expérience vécue. J\'ai commencé à remarquer à quel point les archétypes reflétaient constamment de vrais processus émotionnels ; la perte, la résilience, la peur, le renouveau. Les cartes sont devenues moins mystérieuses et plus comme de vieux amis pointant doucement vers la vérité.',
      myJourneyP5: 'En commençant à guérir, j\'ai ressenti un appel discret à partager cette approche avec les autres. Parallèlement à mon travail en soins énergétiques et développement personnel, j\'ai commencé à accompagner des personnes individuellement, utilisant le Tarot comme outil de réflexion plutôt que de prédiction. Encore et encore, j\'ai vu à quel point c\'était puissant quand quelqu\'un se reconnaissait dans une carte, quand il réalisait que la réponse n\'était pas à l\'extérieur après tout.',
      myJourneyP6: 'Pour moi, le Tarot est un miroir. Il ne dicte pas le destin. Il ne supprime pas la responsabilité. Il met simplement en lumière ce qui est déjà présent et nous invite à regarder un peu plus honnêtement, et un peu plus gentiment, vers nous-mêmes.',
      myJourneyP7: 'Il m\'a aidée à retrouver mon chemin vers moi-même.',
      myJourneyP8: 'Et c\'est pourquoi je le partage.',
      whatTarotAllows: 'Ce que le Tarot nous permet',
      whatTarotAllowsIntro: 'À travers ce processus, le Tarot nous permet de :',
      tarotBenefit1: 'mettre au jour des émotions enfouies et des schémas inconscients',
      tarotBenefit2: 'reconnaître la voix de notre enfant intérieur blessé',
      tarotBenefit3: 'sortir des cycles de critique, de jugement et de culpabilité envers soi-même',
      tarotBenefit4: 'renouer avec notre sagesse intérieure et notre vérité personnelle',
      answersQuote: 'Les réponses ne sont jamais à l\'extérieur de nous. Le Tarot nous aide simplement à écouter plus clairement.',
      imageryTitle: 'Les Images',
      imageryText: 'Les images que vous découvrez sur ce site sont une version modernisée, réalisée avec soin, du célèbre Tarot Rider-Waite-Smith — un des jeux de Tarot le plus reconnu et le plus respecté au monde. Bien que les visuels aient été délicatement actualisés pour une sensibilité contemporaine, le symbolisme, les couleurs et la signification de chaque carte ont été fidèlement préservés. Chaque détail qui fait de ce jeu un outil si puissant pour la réflexion reste intact. Vous y retrouverez le même langage visuel riche qui guide les chercheurs de sens depuis plus d\'un siècle — simplement présenté d\'une manière accueillante et accessible aux regards d\'aujourd\'hui.',
      backgroundP1: 'Parallèlement au Tarot, je pratique depuis de nombreuses années les soins énergétiques et l\'accompagnement en développement personnel, soutenant des personnes dans leur cheminement de croissance et de guérison. Bien que ce travail ait été profondément porteur de sens, la période du Covid a apporté à la fois frustration et clarté.',
      backgroundP2: 'J\'ai pris conscience des limites du modèle traditionnel : prendre rendez-vous, se déplacer, s\'installer pour une séance, puis retourner à sa vie quotidienne — souvent avec les meilleures intentions, mais en laissant progressivement les prises de conscience de côté, rattrapée par les exigences du quotidien.',
      backgroundP3: 'Le Covid est devenu le catalyseur d\'un renouveau. Je voulais créer un moyen pour chacun d\'accéder à une guidance depuis le confort de son foyer, à toute heure du jour ou de la nuit — sans pression, sans rendez-vous, et sans avoir besoin de « connaître » le Tarot.',
      aiTitle: 'Comment la technologie soutient cet espace',
      aiP1: 'Ce site utilise l\'intelligence artificielle comme outil de soutien — non pas pour redéfinir ou réinterpréter le Tarot, mais pour aider à organiser et exprimer les significations des cartes de manière claire et accessible.',
      aiP2: 'Les fondements restent ancrés dans le symbolisme traditionnel du Tarot, particulièrement le système Rider–Waite–Smith que j\'ai étudié et avec lequel j\'ai travaillé dans ma propre pratique. Les significations elles-mêmes ne sont ni altérées ni réinventées. La technologie aide plutôt à :',
      aiBenefit1: 'clarifier comment la signification d\'une carte change selon la position dans laquelle elle apparaît',
      aiBenefit2: 'explorer les relations entre les cartes au sein d\'un tirage',
      aiBenefit3: 'refléter leurs thèmes combinés en lien avec la question posée',
      aiP3: 'De cette façon, le système agit davantage comme un assistant — aidant à articuler les schémas et les connexions — tandis que le cœur de l\'interprétation reste ancré dans la sagesse établie du Tarot et la pratique réflexive.',
      aiQuote: 'L\'insight ne vient pas de la technologie elle-même. Il émerge du dialogue entre le symbolisme des cartes, l\'intention derrière la question et votre propre conscience intérieure. Le rôle de la technologie ici est simplement d\'aider ce dialogue à se dérouler plus harmonieusement.',
      notFortune: 'Ceci n\'est pas un site de voyance.',
      notPredicting: 'Il ne s\'agit pas de prédire l\'avenir.',
      notMysticMeg: 'Et ce n\'est certainement pas une version moderne de Madame Irma.',
      selfExplorationTitle: 'Un espace d\'exploration de soi',
      selfExplorationIntro: 'Cet espace existe pour vous accompagner dans une exploration de soi authentique et porteuse de sens. Ici, vous pouvez :',
      selfExplorationBenefit1: 'choisir une catégorie qui reflète ce que vous vivez',
      selfExplorationBenefit2: 'poser votre propre question ou vous laisser guider par des suggestions soigneusement élaborées',
      selfExplorationBenefit3: 'recevoir un éclairage qui vous aide à réfléchir, à vous réaligner et à avancer',
      selfExplorationP2: 'Vous n\'avez pas besoin de mémoriser les 78 cartes du Tarot ni de comprendre leurs significations traditionnelles — tout ce dont vous avez besoin est déjà ici. Le Tarot devient un miroir, vous aidant à accéder aux réponses qui résident déjà en vous.',
      intentionP1: 'Mon intention est simple et sincère :',
      intentionHighlight: 'vous guider, vous soutenir et vous accompagner sur votre chemin vers une compréhension plus profonde et la réalisation de soi.',
      intentionP2: 'Cet espace est dédié à la curiosité, à la compassion et à l\'épanouissement — un lieu pour faire une pause, réfléchir et renouer avec tout votre potentiel.',
      finalQuote1: 'Vous détenez déjà les réponses.',
      finalQuote2: 'Le Tarot n\'est que la porte d\'entrée.',
      readyToBegin: 'Prête à commencer votre voyage ?',
      startReading: 'Commencez votre tirage',
    },
  };

  const t = content[language];

  return (
    <div className="min-h-[80vh] py-16 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-tr from-amber-400 to-purple-600 mb-6">
            <Moon className="w-10 h-10 text-white fill-current" />
          </div>
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-100 to-purple-200 mb-4">
            {t.title}
          </h1>
        </motion.div>

        {/* Main Story */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="prose prose-invert max-w-none mb-12"
        >
          <p className="text-slate-300 leading-relaxed text-lg mb-6">
            {t.intro}
          </p>
        </motion.section>

        {/* What Tarot Means */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-slate-800/30 border border-white/10 rounded-2xl p-8 mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Compass className="w-5 h-5 text-purple-400" />
            </div>
            <h2 className="text-xl font-heading text-purple-200">
              {t.discoveringTarot}
            </h2>
          </div>
          <div className="space-y-4 text-slate-300 leading-relaxed">
            <p>
              {t.discoveringTarotP1}
            </p>
            <p>
              {t.discoveringTarotP2} <strong className="text-purple-200">{t.discoveringTarotHighlight}</strong> {t.discoveringTarotP3}
            </p>
          </div>
        </motion.section>

        {/* My Journey With Tarot - NEW Personal Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.17 }}
          className="bg-gradient-to-br from-rose-900/20 to-slate-900/40 border border-rose-500/20 rounded-2xl p-8 mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-rose-500/20 flex items-center justify-center">
              <Heart className="w-5 h-5 text-rose-400" />
            </div>
            <h2 className="text-xl font-heading text-rose-200">
              {t.myJourneyTitle}
            </h2>
          </div>
          <div className="space-y-4 text-slate-300 leading-relaxed">
            <p>{t.myJourneyP1}</p>
            <p>{t.myJourneyP2}</p>
            <p>{t.myJourneyP3}</p>
            <p>{t.myJourneyP4}</p>
            <p>{t.myJourneyP5}</p>
            <p className="text-rose-200/90 italic">{t.myJourneyP6}</p>
            <p className="text-rose-200 font-medium">{t.myJourneyP7}</p>
            <p className="text-rose-200 font-medium">{t.myJourneyP8}</p>
          </div>
        </motion.section>

        {/* What Tarot Allows */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-purple-900/20 to-slate-900/40 border border-purple-500/20 rounded-2xl p-8 mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Heart className="w-5 h-5 text-amber-400" />
            </div>
            <h2 className="text-xl font-heading text-amber-200">
              {t.whatTarotAllows}
            </h2>
          </div>
          <p className="text-slate-300 leading-relaxed mb-4">
            {t.whatTarotAllowsIntro}
          </p>
          <ul className="space-y-3 text-slate-300">
            <li className="flex items-start gap-3">
              <span className="text-purple-400 mt-1">•</span>
              <span>{t.tarotBenefit1}</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-purple-400 mt-1">•</span>
              <span>{t.tarotBenefit2}</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-purple-400 mt-1">•</span>
              <span>{t.tarotBenefit3}</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-purple-400 mt-1">•</span>
              <span>{t.tarotBenefit4}</span>
            </li>
          </ul>
          <p className="text-purple-200 font-medium mt-6 text-center italic">
            {t.answersQuote}
          </p>
        </motion.section>

        {/* Imagery Section - NEW */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          className="bg-slate-800/30 border border-white/10 rounded-2xl p-8 mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-rose-500/20 flex items-center justify-center">
              <Palette className="w-5 h-5 text-rose-400" />
            </div>
            <h2 className="text-xl font-heading text-rose-200">
              {t.imageryTitle}
            </h2>
          </div>
          <p className="text-slate-300 leading-relaxed">
            {t.imageryText}
          </p>
        </motion.section>

        {/* Background & COVID */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="prose prose-invert max-w-none mb-8"
        >
          <div className="space-y-4 text-slate-300 leading-relaxed">
            <p>
              {t.backgroundP1}
            </p>
            <p>
              {t.backgroundP2}
            </p>
            <p>
              {t.backgroundP3}
            </p>
          </div>
        </motion.section>

        {/* How AI Supports */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-800/30 border border-white/10 rounded-2xl p-8 mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <Brain className="w-5 h-5 text-cyan-400" />
            </div>
            <h2 className="text-xl font-heading text-cyan-200">
              {t.aiTitle}
            </h2>
          </div>
          <div className="space-y-4 text-slate-300 leading-relaxed">
            <p>
              {t.aiP1}
            </p>
            <p>
              {t.aiP2}
            </p>
            <ul className="space-y-2 ml-4">
              <li className="flex items-start gap-3">
                <span className="text-cyan-400 mt-1">•</span>
                <span>{t.aiBenefit1}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-cyan-400 mt-1">•</span>
                <span>{t.aiBenefit2}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-cyan-400 mt-1">•</span>
                <span>{t.aiBenefit3}</span>
              </li>
            </ul>
            <p>
              {t.aiP3}
            </p>
            <p className="text-cyan-200 font-medium italic">
              {t.aiQuote}
            </p>
          </div>
        </motion.section>

        {/* What This Is NOT */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-6 mb-8"
        >
          <div className="text-center space-y-2">
            <p className="text-amber-200/90 font-medium">{t.notFortune}</p>
            <p className="text-amber-200/90 font-medium">{t.notPredicting}</p>
            <p className="text-amber-200/90 font-medium">{t.notMysticMeg}</p>
          </div>
        </motion.section>

        {/* What You Can Do */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-emerald-900/20 to-slate-900/40 border border-emerald-500/20 rounded-2xl p-8 mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-emerald-400" />
            </div>
            <h2 className="text-xl font-heading text-emerald-200">
              {t.selfExplorationTitle}
            </h2>
          </div>
          <p className="text-slate-300 leading-relaxed mb-4">
            {t.selfExplorationIntro}
          </p>
          <ul className="space-y-3 text-slate-300 mb-6">
            <li className="flex items-start gap-3">
              <span className="text-emerald-400 mt-1">•</span>
              <span>{t.selfExplorationBenefit1}</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-emerald-400 mt-1">•</span>
              <span>{t.selfExplorationBenefit2}</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-emerald-400 mt-1">•</span>
              <span>{t.selfExplorationBenefit3}</span>
            </li>
          </ul>
          <p className="text-slate-300 leading-relaxed">
            {t.selfExplorationP2}
          </p>
        </motion.section>

        {/* Intention Statement */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="text-center mb-12"
        >
          <div className="space-y-4 max-w-2xl mx-auto">
            <p className="text-lg text-slate-300 leading-relaxed">
              {t.intentionP1} <strong className="text-purple-200">{t.intentionHighlight}</strong>
            </p>
            <p className="text-slate-300 leading-relaxed">
              {t.intentionP2}
            </p>
            <div className="pt-6 border-t border-white/10 mt-6">
              <p className="text-xl font-heading text-amber-200 mb-2">
                {t.finalQuote1}
              </p>
              <p className="text-purple-300 italic">
                {t.finalQuote2}
              </p>
            </div>
          </div>
        </motion.section>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center"
        >
          <p className="text-slate-400 mb-4">
            {t.readyToBegin}
          </p>
          <Link to={ROUTES.READING}>
            <button className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-amber-600 rounded-xl text-white font-medium hover:from-purple-500 hover:to-amber-500 transition-all shadow-lg hover:shadow-purple-500/25">
              <Sparkles className="w-5 h-5" />
              {t.startReading}
            </button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default AboutUs;
