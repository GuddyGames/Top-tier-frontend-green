import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home as HomeIcon, Trophy, BookOpen, CheckSquare, Wallet as WalletIcon, CircleUser, Settings, Menu as MenuIcon, LogIn, LineChart, X as CloseIcon } from 'lucide-react';
import { useAuth } from './auth/AuthContext';
import Home from './pages/Home.jsx';
import Leaderboard from './pages/Leaderboard.jsx';
import Terminal from './pages/Terminal.jsx';
import Learn from './pages/Learn.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Profile from './pages/Profile.jsx';
import Referrals from './pages/Referrals.jsx';
import Wallet from './pages/Wallet.jsx';
import Auth from './pages/Auth.jsx';
import Admin from './pages/Admin.jsx';
import Tasks from './pages/Tasks.jsx';
import SplashScreen from './components/SplashScreen.jsx';
import BrandLogo from './components/BrandLogo.jsx';

const PUBLIC_TABS = [
  { key: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  { key: 'learn', label: 'Learn', icon: BookOpen },
  { key: 'tasks', label: 'Tasks', icon: CheckSquare },
];

const AUTH_TABS = [
  { key: 'home', label: 'Home', icon: HomeIcon },
  { key: 'tasks', label: 'Tasks', icon: CheckSquare },
  { key: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  { key: 'wallet', label: 'Wallet', icon: WalletIcon },
  { key: 'profile', label: 'Profile', icon: CircleUser },
];

const PAGE_COMPONENTS = { leaderboard: Leaderboard, terminal: Terminal, learn: Learn, dashboard: Dashboard, profile: Profile, admin: Admin, tasks: Tasks, referrals: Referrals, wallet: Wallet };

export default function App() {
  const { user, authReady } = useAuth();
  const referralCode = new URLSearchParams(window.location.search).get('ref') || '';
  const initialTab = user ? 'home' : referralCode ? 'home' : 'leaderboard';
  const [tab, setTab] = useState(initialTab);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const historyRef = useRef([initialTab]);
  const touchStartRef = useRef(null);

  if (!authReady) return <SplashScreen />;
  const isAdmin = user?.role === 'admin';
  const tabs = user ? AUTH_TABS : PUBLIC_TABS;

  const navigate = (next, replace = false) => {
    if (next === 'admin' && !isAdmin) return;
    setTab((current) => {
      if (current === next) return current;
      historyRef.current = replace ? [next] : [...historyRef.current, next].slice(-20);
      return next;
    });
    setDrawerOpen(false);
  };

  const handleTouchStart = (event) => {
    const touch = event.touches[0];
    if (touch) touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };
  const handleTouchEnd = (event) => {
    const start = touchStartRef.current;
    const touch = event.changedTouches[0];
    touchStartRef.current = null;
    if (!start || !touch) return;
    if (start.x <= 32 && touch.clientX - start.x >= 70 && Math.abs(touch.clientY - start.y) <= 90) setDrawerOpen(true);
  };

  const needsAuth = ['home', 'terminal', 'dashboard', 'profile', 'admin', 'tasks', 'referrals', 'wallet'].includes(tab);
  if (!user && needsAuth) return <Auth initialMode={referralCode ? 'signup' : 'login'} referralCode={referralCode} onDone={() => navigate('home')} />;
  const PageComponent = PAGE_COMPONENTS[tab];

  if (typeof window !== 'undefined' && !window.__topTierNavigationBound) {
    window.__topTierNavigationBound = true;
    window.addEventListener('top-tier:navigate', (event) => { if (event.detail) navigate(event.detail); });
  }

  return (
    <div className="min-h-screen bg-[#030914] font-body text-ink-primary" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <AnimatePresence>
        {drawerOpen && <>
          <motion.button aria-label="Close navigation" className="fixed inset-0 z-[60] bg-black/50 md:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDrawerOpen(false)} />
          <motion.aside className="fixed left-0 top-0 z-[70] flex h-full w-[min(86vw,340px)] flex-col border-r border-[#12365A] bg-[#030914] p-5 shadow-2xl md:hidden" initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', stiffness: 320, damping: 30 }}>
            <div className="flex items-center justify-between"><button onClick={() => navigate(isAdmin ? 'admin' : user ? 'home' : 'leaderboard')}><BrandLogo markClassName="h-9 w-9" textClassName="text-base" /></button><button onClick={() => setDrawerOpen(false)} aria-label="Close navigation" className="grid h-10 w-10 place-items-center rounded-xl border border-[#12365A]"><CloseIcon className="h-5 w-5" /></button></div>
            <div className="mt-6 space-y-1">
              {tabs.map((t) => <button key={t.key} onClick={() => navigate(t.key)} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium hover:bg-[#071426]"><t.icon className="h-5 w-5" /><span>{t.label}</span></button>)}
              {user && <button onClick={() => navigate('learn')} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium hover:bg-[#071426]"><BookOpen className="h-5 w-5" /><span>Learn</span></button>}
              {user && <button onClick={() => navigate('terminal')} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium hover:bg-[#071426]"><LineChart className="h-5 w-5" /><span>Terminal</span></button>}
              {isAdmin && <button onClick={() => navigate('admin')} className="flex w-full items-center gap-3 rounded-xl bg-brand-blue/10 px-4 py-3 text-left text-sm font-semibold text-brand-cyan"><Settings className="h-5 w-5" /><span>Control room</span></button>}
            </div>
          </motion.aside>
        </>}
      </AnimatePresence>

      <main className="mx-auto min-h-[calc(100vh-1px)] max-w-6xl pb-24 md:pb-8">
        <AnimatePresence mode="wait"><motion.div key={tab} initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -14 }} transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}>
          {tab === 'auth' ? <Auth initialMode="signup" referralCode={referralCode} onDone={() => navigate('home', true)} /> : tab === 'home' ? <Home goToTerminal={() => navigate('terminal')} goToLearn={() => navigate('learn')} isAdmin={isAdmin} goToAdmin={() => navigate('admin')} /> : tab === 'admin' && !isAdmin ? null : PageComponent && <PageComponent />}
        </motion.div></AnimatePresence>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#030914]/90 px-1 pb-[calc(9px+env(safe-area-inset-bottom))] pt-2 shadow-[0_-14px_38px_rgba(0,0,0,.25)] backdrop-blur-2xl md:hidden">
        <div className="mx-auto flex max-w-xl items-center justify-around gap-1 rounded-2xl border border-white/10 bg-white/[0.02] p-1 shadow-inner shadow-black/20">
          {(user ? AUTH_TABS : PUBLIC_TABS).map((t) => <button key={t.key} onClick={() => navigate(t.key)} className="group relative flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[9px] font-semibold transition duration-200 active:scale-95">{tab === t.key && <motion.span layoutId="mobile-nav-pill" className="absolute inset-0 rounded-xl border border-brand-blue/25 bg-gradient-to-b from-brand-blue/20 to-brand-blue/5" />}<t.icon className={`relative h-[18px] w-[18px] ${tab === t.key ? 'scale-110 text-brand-cyan' : 'text-ink-muted group-hover:text-white'}`} strokeWidth={tab === t.key ? 2.25 : 2} /><span className={`relative whitespace-nowrap ${tab === t.key ? 'font-bold text-brand-cyan' : 'text-ink-muted group-hover:text-white'}`}>{t.label}</span></button>)}
          <button onClick={() => setDrawerOpen(true)} className="group relative flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[9px] font-semibold text-ink-muted"><MenuIcon className="h-[18px] w-[18px]" /><span>Menu</span></button>
          {!user && <button onClick={() => navigate('home')} className="group relative flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[9px] font-semibold text-brand-cyan"><LogIn className="h-[18px] w-[18px]" /><span>Log in</span></button>}
        </div>
      </nav>
    </div>
  );
}
