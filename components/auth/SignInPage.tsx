import React from 'react';
import { SignIn } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../routes/routes';
import AuthLayout from './AuthLayout';
import { useApp } from '../../context/AppContext';

const clerkAppearance = {
  variables: {
    colorPrimary: '#a855f7',
    colorBackground: 'transparent',
    colorText: '#fef3c7',
    colorTextSecondary: '#94a3b8',
    colorInputBackground: '#1e293b',
    colorInputText: '#ffffff',
    borderRadius: '0.75rem',
  },
  elements: {
    rootBox: 'w-full',
    card: 'bg-transparent shadow-none p-0',
    headerTitle: 'hidden',
    headerSubtitle: 'hidden',
    socialButtonsBlockButton: 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-white',
    socialButtonsBlockButtonText: 'text-white font-medium',
    dividerLine: 'bg-slate-700',
    dividerText: 'text-slate-500',
    formFieldLabel: 'text-slate-300',
    formFieldInput: 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-purple-500 focus:ring-purple-500',
    formButtonPrimary: 'bg-gradient-to-r from-purple-600 to-amber-600 hover:from-purple-500 hover:to-amber-500 text-white font-semibold',
    footerActionLink: 'text-amber-400 hover:text-amber-300',
    identityPreviewEditButton: 'text-amber-400 hover:text-amber-300',
    formFieldAction: 'text-amber-400 hover:text-amber-300',
    alert: 'bg-red-900/50 border-red-500/50 text-red-200',
    alertText: 'text-red-200',
  },
};

const SignInPage: React.FC = () => {
  const { language } = useApp();

  const title = language === 'fr' ? 'Bon retour' : 'Welcome Back';
  const subtitle = language === 'fr'
    ? 'Les mystères vous attendent'
    : 'The mysteries await you';

  return (
    <AuthLayout title={title} subtitle={subtitle}>
      <SignIn
        appearance={clerkAppearance}
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        forceRedirectUrl="/"
      />
      <div className="mt-6 text-center text-sm text-slate-400">
        {language === 'fr' ? 'Pas encore de compte ?' : "Don't have an account?"}{' '}
        <Link to={ROUTES.SIGN_UP} className="text-amber-400 hover:text-amber-300 font-medium">
          {language === 'fr' ? "S'inscrire" : 'Sign up'}
        </Link>
      </div>
    </AuthLayout>
  );
};

export default SignInPage;
