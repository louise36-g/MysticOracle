import React from 'react';
import { SignUp } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../routes/routes';
import AuthLayout from './AuthLayout';
import { useApp } from '../../context/AppContext';

const clerkAppearance = {
  variables: {
    colorPrimary: '#a855f7',
    colorBackground: 'transparent',
    colorText: '#fef3c7',
    colorTextSecondary: '#c4b5fd',
    colorInputBackground: '#3b2667',
    colorInputText: '#ffffff',
    borderRadius: '0.75rem',
  },
  elements: {
    rootBox: 'w-full',
    card: 'bg-transparent shadow-none p-0',
    headerTitle: 'hidden',
    headerSubtitle: 'hidden',
    main: 'gap-4',
    socialButtonsBlockButton: '!bg-purple-900/60 !border-purple-400/40 hover:!bg-purple-800/70 !text-white [&_*]:!text-white !py-4 !text-lg !min-h-[52px]',
    socialButtonsBlockButtonText: '!text-white !font-medium !text-lg',
    socialButtonsBlockButtonArrow: '!text-white',
    socialButtonsIconButton: '!w-7 !h-7',
    socialButtons: 'gap-3',
    dividerLine: 'bg-purple-400/30',
    dividerText: 'text-purple-300',
    formFieldLabel: 'text-purple-200',
    formFieldInput: 'bg-purple-900/50 border-purple-400/40 text-white placeholder:text-purple-300/60 focus:border-amber-400 focus:ring-amber-400',
    formButtonPrimary: 'bg-gradient-to-r from-purple-600 to-amber-600 hover:from-purple-500 hover:to-amber-500 text-white font-semibold',
    footerActionLink: 'text-amber-400 hover:text-amber-300',
    footer: '!hidden',
    footerPages: '!hidden',
    footerAction: '!hidden',
    cardFooter: '!hidden',
    cardFooterAction: '!hidden',
    cardFooterActionText: '!hidden',
    poweredBy: '!hidden',
    identityPreviewEditButton: 'text-amber-400 hover:text-amber-300',
    formFieldAction: 'text-amber-400 hover:text-amber-300',
    alert: 'bg-red-900/50 border-red-500/50 text-red-200',
    alertText: 'text-red-200',
    alternativeMethodsBlockButton: 'bg-purple-900/60 border-purple-400/40 hover:bg-purple-800/70 text-purple-200',
    otpCodeFieldInput: 'bg-purple-900/50 border-purple-400/40 text-white',
  },
};

const SignUpPage: React.FC = () => {
  const { language } = useApp();

  const title = language === 'fr' ? 'Commencez votre voyage' : 'Begin Your Journey';
  const subtitle = language === 'fr'
    ? 'Les cartes attendent votre présence'
    : 'The cards await your presence';

  return (
    <AuthLayout title={title} subtitle={subtitle}>
      {/* Already have account - prominent placement */}
      <div className="mb-2 p-3 text-center bg-purple-800/40 rounded-xl border border-purple-400/30">
        <span className="text-purple-200">
          {language === 'fr' ? 'Déjà un compte ?' : 'Already have an account?'}
        </span>{' '}
        <Link to={ROUTES.SIGN_IN} className="text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-2">
          {language === 'fr' ? 'Se connecter' : 'Sign in'}
        </Link>
      </div>

      <SignUp
        appearance={clerkAppearance}
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        forceRedirectUrl="/"
      />
    </AuthLayout>
  );
};

export default SignUpPage;
