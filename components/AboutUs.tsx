import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Moon, Sparkles, Heart, Brain, Compass, Quote } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from '../context/TranslationContext';
import { ROUTES } from '../routes/routes';

const AboutUs: React.FC = () => {
  const { language } = useApp();
  const { t } = useTranslation();

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
            {t('about.AboutUs.title', 'About Us')}
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
            For many decades, my life has been guided by a deep passion for personal development, introspection, and healing the wounded inner child. I have always been drawn to understanding what lies beneath the surface — our emotions, our patterns, and the stories we tell ourselves — and to finding compassionate ways to reconnect with our inner truth.
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
              Discovering Tarot
            </h2>
          </div>
          <div className="space-y-4 text-slate-300 leading-relaxed">
            <p>
              When I discovered the Tarot, I did not experience it as a tool of divination or prediction. That aspect of Tarot has never truly resonated with me. I do not believe that our lives are fixed or written in advance. I believe we create our own destinies through the choices we make and the actions we take.
            </p>
            <p>
              For me, the Tarot is something entirely different. <strong className="text-purple-200">The Tarot is, in my experience, the introspection tool par excellence.</strong> It helps us explore the energy surrounding a situation or feeling and gently guides us inward — back to ourselves. The cards do not tell us what will happen; they help us understand what is happening within us right now.
            </p>
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
              What Tarot Allows Us To Do
            </h2>
          </div>
          <p className="text-slate-300 leading-relaxed mb-4">
            Through this process, the Tarot allows us to:
          </p>
          <ul className="space-y-3 text-slate-300">
            <li className="flex items-start gap-3">
              <span className="text-purple-400 mt-1">•</span>
              <span>uncover hidden emotions and unconscious patterns</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-purple-400 mt-1">•</span>
              <span>recognise the voice of our wounded inner child</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-purple-400 mt-1">•</span>
              <span>step out of cycles of criticism, judgement, and self-blame</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-purple-400 mt-1">•</span>
              <span>reconnect with our inner wisdom and personal truth</span>
            </li>
          </ul>
          <p className="text-purple-200 font-medium mt-6 text-center italic">
            The answers are never outside of us. The Tarot simply helps us listen more clearly.
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
              Alongside Tarot, I have worked for many years in energy healing and self-help coaching, supporting people one-to-one on their journey of growth and healing. While this work was deeply meaningful, the Covid period brought both frustration and clarity.
            </p>
            <p>
              I realised how limiting the traditional model could be: booking appointments, travelling, sitting for a session, then returning to daily life — often with the best intentions, yet gradually placing the insights on the back burner as life's demands took over.
            </p>
            <p>
              Covid became the catalyst for something new. I wanted to create a way for people to access guidance from the comfort of their own home, at any time of the day or night — without pressure, without appointments, and without needing to "know" Tarot.
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
              How AI Supports This Experience
            </h2>
          </div>
          <div className="space-y-4 text-slate-300 leading-relaxed">
            <p>
              This website uses artificial intelligence — not to interpret or reinvent the Tarot, but to support clarity, reflection, and connection.
            </p>
            <p>
              The meanings of the Tarot cards themselves are not altered. They remain consistent, rooted in traditional understanding. The role of AI here is to:
            </p>
            <ul className="space-y-2 ml-4">
              <li className="flex items-start gap-3">
                <span className="text-cyan-400 mt-1">•</span>
                <span>explain each card from the perspective of the position in which it was drawn</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-cyan-400 mt-1">•</span>
                <span>explore how the cards interact with one another as a whole</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-cyan-400 mt-1">•</span>
                <span>weave their messages back into the question you asked</span>
              </li>
            </ul>
            <p>
              In this way, the AI acts as a thoughtful guide — helping to articulate connections, highlight themes, and offer reflective insight — while always pointing you back to your own inner knowing.
            </p>
            <p className="text-cyan-200 font-medium italic">
              The wisdom does not come from the technology.<br />
              It comes from the conversation between the cards, the question, and you.
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
            <p className="text-amber-200/90 font-medium">This is not a fortune-telling site.</p>
            <p className="text-amber-200/90 font-medium">This is not about predicting the future.</p>
            <p className="text-amber-200/90 font-medium">And it is certainly not a modern version of Mystic Meg.</p>
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
              A Space for Self-Exploration
            </h2>
          </div>
          <p className="text-slate-300 leading-relaxed mb-4">
            This space exists to support you in real, meaningful self-exploration. Here, you can:
          </p>
          <ul className="space-y-3 text-slate-300 mb-6">
            <li className="flex items-start gap-3">
              <span className="text-emerald-400 mt-1">•</span>
              <span>choose a category that reflects what you're experiencing</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-emerald-400 mt-1">•</span>
              <span>ask your own question or be guided by carefully designed prompts</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-emerald-400 mt-1">•</span>
              <span>receive insight that helps you reflect, realign, and move forward</span>
            </li>
          </ul>
          <p className="text-slate-300 leading-relaxed">
            You do not need to memorise all 78 Tarot cards or understand their traditional meanings — everything you need is already here. The Tarot becomes a mirror, helping you access the answers that already reside within you.
          </p>
        </motion.section>

        {/* Intention Statement */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-500/20 mb-6">
            <Quote className="w-6 h-6 text-purple-400" />
          </div>
          <div className="space-y-4 max-w-2xl mx-auto">
            <p className="text-lg text-slate-300 leading-relaxed">
              My intention is simple and heartfelt: <strong className="text-purple-200">to guide, support, and empower you on your path toward deeper understanding and self-realisation.</strong>
            </p>
            <p className="text-slate-300 leading-relaxed">
              This is a space for curiosity, compassion, and growth — a place to pause, reflect, and reconnect with your full potential.
            </p>
            <div className="pt-6 border-t border-white/10 mt-6">
              <p className="text-xl font-heading text-amber-200 mb-2">
                You already hold the answers.
              </p>
              <p className="text-purple-300 italic">
                The Tarot is simply the doorway.
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
            {t('about.AboutUs.ready_to_begin', 'Ready to begin your journey?')}
          </p>
          <Link to={ROUTES.READING}>
            <button className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-amber-600 rounded-xl text-white font-medium hover:from-purple-500 hover:to-amber-500 transition-all shadow-lg hover:shadow-purple-500/25">
              <Sparkles className="w-5 h-5" />
              {t('about.AboutUs.start_reading', 'Start Your Reading')}
            </button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default AboutUs;
