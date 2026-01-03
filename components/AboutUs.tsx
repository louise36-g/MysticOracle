import React from 'react';
import { useApp } from '../context/AppContext';
import { Moon, Sparkles, Heart, Shield, Zap, Users } from 'lucide-react';
import { motion } from 'framer-motion';

interface AboutUsProps {
  onNavigate: (view: string) => void;
}

const AboutUs: React.FC<AboutUsProps> = ({ onNavigate }) => {
  const { language } = useApp();

  const values = [
    {
      icon: <Sparkles className="w-6 h-6" />,
      titleEn: 'AI-Powered Wisdom',
      titleFr: 'Sagesse Assistée par IA',
      descEn: 'We combine ancient tarot traditions with modern AI to provide meaningful, personalized readings.',
      descFr: 'Nous combinons les traditions anciennes du tarot avec l\'IA moderne pour offrir des lectures personnalisées et significatives.'
    },
    {
      icon: <Heart className="w-6 h-6" />,
      titleEn: 'Compassionate Guidance',
      titleFr: 'Guidance Bienveillante',
      descEn: 'Every reading is delivered with empathy and care, supporting you on your personal journey.',
      descFr: 'Chaque lecture est délivrée avec empathie et soin, vous accompagnant dans votre parcours personnel.'
    },
    {
      icon: <Shield className="w-6 h-6" />,
      titleEn: 'Privacy First',
      titleFr: 'Confidentialité Avant Tout',
      descEn: 'Your spiritual journey is personal. We protect your data with the highest security standards.',
      descFr: 'Votre voyage spirituel est personnel. Nous protégeons vos données avec les plus hauts standards de sécurité.'
    },
    {
      icon: <Zap className="w-6 h-6" />,
      titleEn: 'Instant Insights',
      titleFr: 'Insights Instantanés',
      descEn: 'Get clarity when you need it most, with readings available 24/7 at your fingertips.',
      descFr: 'Obtenez de la clarté quand vous en avez le plus besoin, avec des lectures disponibles 24h/24.'
    }
  ];

  return (
    <div className="min-h-[80vh] py-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-tr from-amber-400 to-purple-600 mb-6">
            <Moon className="w-10 h-10 text-white fill-current" />
          </div>
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-100 to-purple-200 mb-4">
            {language === 'en' ? 'About MysticOracle' : 'À Propos de MysticOracle'}
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            {language === 'en'
              ? 'Where ancient wisdom meets modern technology to illuminate your path.'
              : 'Là où la sagesse ancienne rencontre la technologie moderne pour éclairer votre chemin.'}
          </p>
        </motion.div>

        {/* Our Story */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-800/30 border border-white/10 rounded-2xl p-8 mb-12"
        >
          <h2 className="text-2xl font-heading text-purple-200 mb-4 flex items-center gap-3">
            <Users className="w-6 h-6 text-purple-400" />
            {language === 'en' ? 'Our Story' : 'Notre Histoire'}
          </h2>
          <div className="prose prose-invert max-w-none">
            <p className="text-slate-300 leading-relaxed mb-4">
              {language === 'en'
                ? 'MysticOracle was born from a simple belief: that the timeless wisdom of tarot should be accessible to everyone, anytime they need guidance. We created a platform that honors the rich traditions of tarot reading while embracing the possibilities of artificial intelligence.'
                : 'MysticOracle est né d\'une croyance simple : la sagesse intemporelle du tarot devrait être accessible à tous, à tout moment où ils ont besoin de guidance. Nous avons créé une plateforme qui honore les riches traditions de la lecture du tarot tout en embrassant les possibilités de l\'intelligence artificielle.'}
            </p>
            <p className="text-slate-300 leading-relaxed">
              {language === 'en'
                ? 'Our AI has been trained on centuries of tarot interpretation, symbolism, and meaning, allowing it to provide readings that are both insightful and personally relevant. Whether you seek clarity on love, career, or life\'s bigger questions, MysticOracle is here to guide you.'
                : 'Notre IA a été formée sur des siècles d\'interprétation, de symbolisme et de signification du tarot, lui permettant de fournir des lectures à la fois perspicaces et personnellement pertinentes. Que vous cherchiez de la clarté sur l\'amour, la carrière ou les grandes questions de la vie, MysticOracle est là pour vous guider.'}
            </p>
          </div>
        </motion.section>

        {/* Our Values */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-heading text-purple-200 mb-8 text-center">
            {language === 'en' ? 'Our Values' : 'Nos Valeurs'}
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="bg-slate-800/30 border border-white/10 rounded-xl p-6 hover:border-purple-500/30 transition-colors"
              >
                <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
                  {value.icon}
                </div>
                <h3 className="text-lg font-heading text-purple-100 mb-2">
                  {language === 'en' ? value.titleEn : value.titleFr}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {language === 'en' ? value.descEn : value.descFr}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Disclaimer */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-6 text-center"
        >
          <p className="text-amber-200/80 text-sm">
            {language === 'en'
              ? 'MysticOracle is intended for entertainment and personal reflection purposes only. Our AI-generated readings should not be considered professional advice for medical, legal, financial, or psychological matters.'
              : 'MysticOracle est destiné uniquement à des fins de divertissement et de réflexion personnelle. Nos lectures générées par IA ne doivent pas être considérées comme des conseils professionnels pour des questions médicales, juridiques, financières ou psychologiques.'}
          </p>
        </motion.section>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="text-center mt-12"
        >
          <p className="text-slate-400 mb-4">
            {language === 'en' ? 'Ready to begin your journey?' : 'Prêt à commencer votre voyage ?'}
          </p>
          <button
            onClick={() => onNavigate('home')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-amber-600 rounded-xl text-white font-medium hover:from-purple-500 hover:to-amber-500 transition-all shadow-lg hover:shadow-purple-500/25"
          >
            <Sparkles className="w-5 h-5" />
            {language === 'en' ? 'Start Your Reading' : 'Commencer Votre Lecture'}
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default AboutUs;
