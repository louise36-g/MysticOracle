import { Outlet } from 'react-router-dom';
import Header from '../Header';
import SubNav from '../SubNav';
import Footer from '../Footer';
import CookieConsent from '../CookieConsent';
import { Suspense } from 'react';

// Loading fallback for lazy-loaded routes
function PageLoader() {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-purple-300/70 text-sm">Loading...</p>
      </div>
    </div>
  );
}

// Temporary no-op handlers until remaining tasks convert Footer/CookieConsent to use router
const noOpNavigate = () => {};

export function RootLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex flex-col">
      <Header />
      <SubNav />
      <main className="flex-1">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer onNavigate={noOpNavigate} />
      <CookieConsent onNavigate={noOpNavigate} />
    </div>
  );
}
