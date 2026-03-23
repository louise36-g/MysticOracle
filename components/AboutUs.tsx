import React from 'react';
import { Helmet } from '@dr.pogodin/react-helmet';
import { useApp } from '../context/AppContext';
import LocalizedLink from './LocalizedLink';
import { Sparkles, Heart, Brain, Compass, Palette } from 'lucide-react';
import { motion } from 'framer-motion';
import { ROUTES } from '../routes/routes';
import { AuthorAvatar } from './shared/AuthorAvatar';
import { SEOTags } from '../utils/seo';

const AboutUs: React.FC = () => {
  const { language } = useApp();

  const content = {
    en: {
      title: 'About Me',
      intro: 'For many decades, my life has been guided by a deep interest in personal development, introspection, and healing the wounded inner child. I have always been drawn to what lies beneath the surface, our emotions, our patterns, and the stories we tell ourselves, and to finding more compassionate ways to reconnect with what feels true.',
      discoveringTarot: 'Discovering Tarot',
      discoveringTarotText: 'When I discovered Tarot, I did not experience it as a tool of prediction. That aspect never really resonated with me. I have always felt that our lives are shaped by the choices we make, rather than something fixed in advance. What I found instead was something quieter, and far more useful. Tarot became a way of looking inward. A way of exploring what was already present but not always fully seen.',
      discoveringTarotQuote: 'The cards do not tell us what will happen. They help us understand what is happening.',
      myJourneyTitle: 'My Journey With Tarot',
      myJourneyP1: 'I began working seriously with Tarot in 2017, after my mother passed away. It was a very dark time. I felt lost in a way I had not experienced before, unsure of who I was without her, unsure of where I was going.',
      myJourneyP2: 'During that period, Tarot became something I could return to. A place to sit when everything else felt uncertain. I would spend time with the cards, often without even asking a clear question. I just needed something that helped me make sense of what I was feeling. Slowly, the images began to reflect things back to me. Small recognitions, quiet understandings. It helped me see where I was holding grief. It showed me patterns I had inherited. It made me aware of how hard I was being on myself, and where I needed to soften instead.',
      myJourneyP3: 'Over time, this became a daily practice. I studied the Rider-Waite-Smith deck more closely, through experience rather than theory. I started to notice how consistently the archetypes mirrored real emotional processes. Loss, resilience, fear, renewal. The cards became less abstract, and more familiar. At some point, they stopped feeling separate from me, and more like a mirror.',
      myJourneyP4: 'As I began to heal, I felt a quiet pull to share this way of working with others. Alongside my work in energy healing and personal development, I started supporting people one to one, using Tarot as a reflective tool. Often, I saw the same moment happen. Someone would look at a card, pause, and then recognise something in themselves. The answer was already there, just waiting to be seen.',
      myJourneyP5: 'There was a more practical side to all of this as well. For part of each year, I live and travel through Europe in a small van. I love that way of life, but it comes with its own set of limitations. Space is limited. Surfaces are rarely stable. The wind has a habit of arriving at exactly the wrong moment, usually just after you have laid your cards out carefully. Public spaces are not much better. It is surprisingly difficult to find somewhere quiet enough to sit and reflect without being interrupted. I found myself wanting to draw a card and spend time with it properly, but often the conditions just were not there. No table, no stillness, no real sense of privacy. The moment would slip away.',
      myJourneyP6: 'And it brought something into focus. Tarot should be something you can turn to anywhere. It should not depend on a perfect setup or a particular kind of space.',
      myJourneyP7: 'There was another layer to it too. Even with the right conditions, the interpretation itself could feel heavy. Larger spreads like the Celtic Cross ask a lot of you. Holding ten cards in mind, remembering each position, interpreting each one in context, and then trying to bring it all together into something coherent takes real effort. For someone new to Tarot, it can feel like too much. What should be a moment of reflection starts to feel like something you have to get right.',
      myJourneyP8: 'I kept coming back to the same thought: it could be simpler. Not in a way that removes depth, but in a way that removes unnecessary weight. Something you could do anywhere. On a train. In a van. In a quiet moment late at night. Without needing to reach for books or question yourself at every step. A space where you bring your question and your cards, and the meaning unfolds in a way that feels clear, steady, and easy to sit with.',
      myJourneyP9: 'That idea stayed with me, and gradually became part of the foundation of this site.',
      myJourneyP10: 'For me, Tarot is a mirror. It reflects what is already present. It brings awareness to things that are easy to overlook. And sometimes, that small shift in awareness is enough to change how we move forward. It helped me find my way back to myself.',
      myJourneyP11: 'And that is why I share it.',
      whatTarotAllows: 'What Tarot Allows Us To Do',
      whatTarotAllowsIntro: 'In practice, Tarot can help us to:',
      tarotBenefit1: 'uncover emotions and patterns that are not immediately obvious',
      tarotBenefit2: 'recognise the voice of the wounded inner child',
      tarotBenefit3: 'step out of cycles of self-criticism and judgement',
      tarotBenefit4: 'reconnect with a clearer sense of inner direction',
      answersQuote: 'The answers are not outside us. Tarot helps bring them into view.',
      imageryTitle: 'The Imagery',
      imageryText: 'The imagery used throughout this site is based on a modern rendering of the Rider-Waite-Smith deck, the most widely recognised Tarot deck. The visuals have been gently updated, while the symbolism remains the same. The colours, structure, and meaning of each card are still grounded in the original system. So while it may feel more contemporary, the language of the cards is unchanged.',
      backgroundText: 'Alongside Tarot, I have spent many years working in energy healing and self development, supporting people one to one. It is work I value deeply, but over time I began to notice its limitations. Sessions would be booked, insights would emerge, and then life would resume. And often, those insights would fade as everyday demands took over. The Covid period made that even clearer. It led me to think differently about how this kind of support could exist. I wanted to create something people could return to in their own time, in their own space, without needing an appointment, and without needing prior knowledge of Tarot.',
      aiTitle: 'How Technology Supports This Space',
      aiText: 'This site uses artificial intelligence as a support tool. The interpretations remain grounded in traditional Rider-Waite-Smith symbolism. The structure and meaning of the cards stay intact. The technology helps organise and express those meanings more clearly. It allows the relationships between cards to be explored more easily, and helps reflect those connections back into the question being asked. It acts as a kind of support in the background, giving shape to the interpretation while leaving space for personal reflection.',
      aiQuote: 'The insight itself still comes from the interaction between you, the cards, and the question you bring.',
      notFortune: 'This is not a fortune telling site.',
      notPredicting: 'It is not about predicting the future.',
      notMysticMeg: 'And it is certainly not a modern version of Mystic Meg.',
      selfExplorationTitle: 'A Space for Self-Exploration',
      selfExplorationIntro: 'This space is here to support a more personal kind of exploration.',
      selfExplorationYouCan: 'You can:',
      selfExplorationBenefit1: 'choose a category that reflects what you are going through',
      selfExplorationBenefit2: 'ask your own question, or use one of the prompts provided',
      selfExplorationBenefit3: 'receive something that helps you reflect, adjust, and move forward',
      selfExplorationP2: 'You do not need to memorise the cards or study their meanings in advance. Everything you need is already here, ready for you to look into your Tarot mirror.',
      readyToBegin: 'Ready to begin your journey?',
      startReading: 'Start Your Reading',
    },
    fr: {
      title: 'À propos de moi',
      intro: 'Depuis de nombreuses décennies, ma vie est guidée par un profond intérêt pour le développement personnel, l\'introspection et la guérison de l\'enfant intérieur blessé. J\'ai toujours été attirée par ce qui se cache sous la surface — nos émotions, nos schémas, les histoires que nous nous racontons — et par la recherche de moyens plus bienveillants de nous reconnecter à ce qui semble vrai.',
      discoveringTarot: 'Découvrir le Tarot',
      discoveringTarotText: 'Lorsque j\'ai découvert le Tarot, je ne l\'ai pas vécu comme un outil de prédiction. Cet aspect n\'a jamais vraiment résonné en moi. J\'ai toujours senti que nos vies sont façonnées par les choix que nous faisons, plutôt que par quelque chose de fixé à l\'avance. Ce que j\'ai trouvé à la place était quelque chose de plus calme, et bien plus utile. Le Tarot est devenu une façon de regarder vers l\'intérieur. Une façon d\'explorer ce qui était déjà présent mais pas toujours pleinement visible.',
      discoveringTarotQuote: 'Les cartes ne nous disent pas ce qui va arriver. Elles nous aident à comprendre ce qui se passe.',
      myJourneyTitle: 'Mon parcours avec le Tarot',
      myJourneyP1: 'J\'ai commencé à travailler sérieusement avec le Tarot en 2017, après le décès de ma mère. Ce fut une période très sombre. Je me sentais perdue d\'une manière que je n\'avais jamais connue auparavant, incertaine de qui j\'étais sans elle, incertaine de la direction que prenait ma vie.',
      myJourneyP2: 'Durant cette période, le Tarot est devenu quelque chose vers lequel je pouvais revenir. Un endroit où m\'asseoir quand tout le reste semblait incertain. Je passais du temps avec les cartes, souvent sans même poser de question précise. J\'avais simplement besoin de quelque chose qui m\'aide à donner du sens à ce que je ressentais. Peu à peu, les images ont commencé à me renvoyer des reflets. De petites reconnaissances, des compréhensions silencieuses. Cela m\'a aidée à voir où je portais le deuil. Cela m\'a montré des schémas hérités. Cela m\'a rendue consciente de ma dureté envers moi-même, et de là où j\'avais besoin de m\'adoucir.',
      myJourneyP3: 'Avec le temps, cela est devenu une pratique quotidienne. J\'ai étudié le jeu Rider-Waite-Smith de plus près, à travers l\'expérience plutôt que la théorie. J\'ai commencé à remarquer combien les archétypes reflétaient fidèlement des processus émotionnels réels. La perte, la résilience, la peur, le renouveau. Les cartes sont devenues moins abstraites, et plus familières. À un moment donné, elles ont cessé de me sembler séparées de moi, et sont devenues davantage comme un miroir.',
      myJourneyP4: 'À mesure que je guérissais, j\'ai ressenti l\'appel discret de partager cette façon de travailler avec d\'autres. Parallèlement à mon travail en soin énergétique et en développement personnel, j\'ai commencé à accompagner des personnes en individuel, en utilisant le Tarot comme outil de réflexion. Souvent, je voyais le même moment se produire. Quelqu\'un regardait une carte, faisait une pause, puis reconnaissait quelque chose en lui-même. La réponse était déjà là, attendant simplement d\'être vue.',
      myJourneyP5: 'Il y avait aussi un aspect plus pratique à tout cela. Pendant une partie de l\'année, je vis et voyage à travers l\'Europe dans un petit van. J\'aime ce mode de vie, mais il a ses propres limites. L\'espace est limité. Les surfaces sont rarement stables. Le vent a l\'habitude d\'arriver exactement au mauvais moment, généralement juste après avoir soigneusement disposé vos cartes. Les espaces publics ne sont guère mieux. Il est étonnamment difficile de trouver un endroit assez calme pour s\'asseoir et réfléchir sans être interrompu. Je me retrouvais à vouloir tirer une carte et passer du temps avec elle correctement, mais souvent les conditions n\'étaient tout simplement pas réunies. Pas de table, pas de calme, pas de véritable intimité. Le moment s\'échappait.',
      myJourneyP6: 'Et cela a mis quelque chose en lumière. Le Tarot devrait être quelque chose vers lequel on peut se tourner n\'importe où. Il ne devrait pas dépendre d\'une installation parfaite ou d\'un type d\'espace particulier.',
      myJourneyP7: 'Il y avait aussi une autre dimension. Même dans les bonnes conditions, l\'interprétation elle-même pouvait sembler lourde. Les tirages plus grands comme la Croix Celtique demandent beaucoup. Garder dix cartes en tête, se souvenir de chaque position, interpréter chacune dans son contexte, puis essayer de tout rassembler en quelque chose de cohérent demande un réel effort. Pour quelqu\'un qui débute avec le Tarot, cela peut sembler trop. Ce qui devrait être un moment de réflexion commence à ressembler à quelque chose qu\'il faut réussir.',
      myJourneyP8: 'Je revenais sans cesse à la même pensée : cela pourrait être plus simple. Pas d\'une manière qui enlève la profondeur, mais d\'une manière qui enlève le poids inutile. Quelque chose que l\'on pourrait faire n\'importe où. Dans un train. Dans un van. Dans un moment de calme tard le soir. Sans avoir besoin de chercher des livres ou de se remettre en question à chaque étape. Un espace où vous apportez votre question et vos cartes, et le sens se dévoile d\'une manière claire, stable et facile à accueillir.',
      myJourneyP9: 'Cette idée est restée avec moi, et est progressivement devenue une partie des fondations de ce site.',
      myJourneyP10: 'Pour moi, le Tarot est un miroir. Il reflète ce qui est déjà présent. Il apporte une conscience des choses faciles à négliger. Et parfois, ce petit changement de conscience suffit à changer la façon dont nous avançons. Il m\'a aidée à retrouver mon propre chemin.',
      myJourneyP11: 'Et c\'est pour cela que je le partage.',
      whatTarotAllows: 'Ce que le Tarot nous permet de faire',
      whatTarotAllowsIntro: 'En pratique, le Tarot peut nous aider à :',
      tarotBenefit1: 'mettre en lumière des émotions et des schémas qui ne sont pas immédiatement évidents',
      tarotBenefit2: 'reconnaître la voix de l\'enfant intérieur blessé',
      tarotBenefit3: 'sortir des cycles d\'autocritique et de jugement',
      tarotBenefit4: 'nous reconnecter à un sens plus clair de direction intérieure',
      answersQuote: 'Les réponses ne sont pas à l\'extérieur de nous. Le Tarot aide à les rendre visibles.',
      imageryTitle: 'L\'imagerie',
      imageryText: 'Les images utilisées sur ce site sont basées sur un rendu moderne du jeu Rider-Waite-Smith, le jeu de Tarot le plus largement reconnu. Les visuels ont été doucement mis à jour, tandis que le symbolisme reste le même. Les couleurs, la structure et la signification de chaque carte sont toujours ancrées dans le système original. Ainsi, bien que l\'ensemble puisse paraître plus contemporain, le langage des cartes reste inchangé.',
      backgroundText: 'Parallèlement au Tarot, j\'ai passé de nombreuses années à travailler dans le soin énergétique et le développement personnel, accompagnant des personnes en individuel. C\'est un travail que je valorise profondément, mais avec le temps j\'ai commencé à en remarquer les limites. Des séances étaient réservées, des prises de conscience émergeaient, puis la vie reprenait son cours. Et souvent, ces prises de conscience s\'estompaient face aux exigences du quotidien. La période du Covid a rendu cela encore plus clair. Elle m\'a amenée à repenser la façon dont ce type d\'accompagnement pourrait exister. Je voulais créer quelque chose vers lequel les gens pourraient revenir à leur propre rythme, dans leur propre espace, sans avoir besoin de prendre rendez-vous, et sans avoir besoin de connaissances préalables du Tarot.',
      aiTitle: 'Comment la technologie soutient cet espace',
      aiText: 'Ce site utilise l\'intelligence artificielle comme outil de soutien. Les interprétations restent ancrées dans le symbolisme traditionnel Rider-Waite-Smith. La structure et la signification des cartes restent intactes. La technologie aide à organiser et exprimer ces significations plus clairement. Elle permet d\'explorer plus facilement les relations entre les cartes et aide à refléter ces connexions dans la question posée. Elle agit comme une sorte de soutien en arrière-plan, donnant forme à l\'interprétation tout en laissant place à la réflexion personnelle.',
      aiQuote: 'L\'éclairage vient toujours de l\'interaction entre vous, les cartes et la question que vous apportez.',
      notFortune: 'Ce n\'est pas un site de voyance.',
      notPredicting: 'Il ne s\'agit pas de prédire l\'avenir.',
      notMysticMeg: 'Et ce n\'est certainement pas une version moderne de Madame Irma.',
      selfExplorationTitle: 'Un espace d\'exploration de soi',
      selfExplorationIntro: 'Cet espace est là pour soutenir une forme d\'exploration plus personnelle.',
      selfExplorationYouCan: 'Vous pouvez :',
      selfExplorationBenefit1: 'choisir une catégorie qui reflète ce que vous traversez',
      selfExplorationBenefit2: 'poser votre propre question, ou utiliser l\'une des suggestions proposées',
      selfExplorationBenefit3: 'recevoir quelque chose qui vous aide à réfléchir, ajuster et avancer',
      selfExplorationP2: 'Vous n\'avez pas besoin de mémoriser les cartes ni d\'étudier leurs significations à l\'avance. Tout ce dont vous avez besoin est déjà ici, prêt pour que vous regardiez dans votre miroir de Tarot.',
      readyToBegin: 'Prête à commencer votre voyage ?',
      startReading: 'Commencez votre tirage',
    },
  };

  const t = content[language];

  return (
    <div className="min-h-[80vh] py-16 px-4">
      <Helmet>
        <title>About Us - CelestiArcana</title>
        <meta name="description" content="Learn about CelestiArcana, a reflective tarot space combining classical card interpretation with modern intuition for insight, clarity, and conscious growth." />
      </Helmet>
      <SEOTags path="/about" />
      <div className="max-w-3xl mx-auto">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex justify-center mb-6">
            <AuthorAvatar size="xl" showName={false} />
          </div>
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-100 to-purple-200 mb-4">
            {t.title}
          </h1>
        </motion.div>

        {/* Intro */}
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

        {/* Discovering Tarot */}
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
            <p>{t.discoveringTarotText}</p>
            <p className="text-purple-200 font-medium italic">{t.discoveringTarotQuote}</p>
          </div>
        </motion.section>

        {/* My Journey With Tarot */}
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
            <p>{t.myJourneyP6}</p>
            <p>{t.myJourneyP7}</p>
            <p>{t.myJourneyP8}</p>
            <p>{t.myJourneyP9}</p>
            <p className="text-rose-200/90 italic">{t.myJourneyP10}</p>
            <p className="text-rose-200 font-medium">{t.myJourneyP11}</p>
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

        {/* Imagery */}
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

        {/* Background */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="prose prose-invert max-w-none mb-8"
        >
          <p className="text-slate-300 leading-relaxed">
            {t.backgroundText}
          </p>
        </motion.section>

        {/* How Technology Supports */}
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
            <p>{t.aiText}</p>
            <p className="text-cyan-200 font-medium italic">{t.aiQuote}</p>
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

        {/* Self-Exploration */}
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
          <p className="text-slate-300 leading-relaxed mb-2">
            {t.selfExplorationIntro}
          </p>
          <p className="text-slate-300 leading-relaxed mb-4">
            {t.selfExplorationYouCan}
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

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="text-center"
        >
          <p className="text-slate-400 mb-4">
            {t.readyToBegin}
          </p>
          <LocalizedLink to={ROUTES.READING}>
            <button className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-amber-600 rounded-xl text-white font-medium hover:from-purple-500 hover:to-amber-500 transition-all shadow-lg hover:shadow-purple-500/25">
              <Sparkles className="w-5 h-5" />
              {t.startReading}
            </button>
          </LocalizedLink>
        </motion.div>
      </div>
    </div>
  );
};

export default AboutUs;
