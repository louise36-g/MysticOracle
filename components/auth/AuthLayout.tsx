import React, { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { ROUTES } from '../../routes/routes';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Mystical background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-purple-950/50 to-slate-950" />
      <div className="absolute inset-0 bg-[url('/stars-bg.svg')] opacity-30" />

      {/* Animated orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <Link to={ROUTES.HOME} className="flex items-center justify-center gap-2 mb-8">
          <img
            src="/logos/celestiarcana-moon.png"
            alt="CelestiArcana"
            className="h-12 w-12 object-cover"
          />
          <span className="text-2xl font-heading font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-100 to-purple-200">
            CelestiArcana
          </span>
        </Link>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h1 className="text-2xl font-heading text-amber-100">{title}</h1>
            <Sparkles className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-slate-400">{subtitle}</p>
        </div>

        {/* Clerk component container */}
        <div className="bg-violet-950/70 backdrop-blur-md border border-purple-400/40 rounded-2xl p-6 shadow-2xl shadow-purple-500/20">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
