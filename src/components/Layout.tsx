import { useEffect, useState } from 'react';
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  BarChart3,
  BookOpen,
  Brain,
  GraduationCap,
  Layers,
  Menu,
  Target,
  X,
} from 'lucide-react';

const NAV = [
  { to: '/', label: 'Головна', icon: Activity, end: true },
  { to: '/quiz', label: 'Вгадай препарат', icon: Brain, end: false },
  { to: '/cards', label: 'Повторення', icon: Layers, end: false },
  { to: '/exam', label: 'Складний іспит', icon: GraduationCap, end: false },
  { to: '/weak', label: 'Слабкі місця', icon: Target, end: false },
  { to: '/catalog', label: 'Каталог', icon: BookOpen, end: false },
  { to: '/stats', label: 'Статистика', icon: BarChart3, end: false },
];

export default function Layout() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  // навігація кнопками «назад/вперед» теж має закривати мобільне меню
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // поки меню відкрите, сторінка під ним не скролиться
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-ink-950/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6">
          <Link to="/" className="group flex items-center gap-2.5" onClick={() => setOpen(false)}>
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-mint-400 to-violet-500 text-ink-950 shadow-lg shadow-violet-500/25">
              <Activity className="h-5 w-5" strokeWidth={2.5} />
            </span>
            <span className="text-lg font-extrabold tracking-tight">
              Patho<span className="bg-gradient-to-r from-mint-300 to-violet-300 bg-clip-text text-transparent">Quiz</span>
            </span>
          </Link>

          <nav className="ml-auto hidden items-center gap-1 lg:flex">
            {NAV.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-white/10 text-mint-300'
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>

          <button
            type="button"
            aria-label={open ? 'Закрити меню' : 'Відкрити меню'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="ml-auto grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5 lg:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        <AnimatePresence>
          {open && (
            <motion.nav
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden border-t border-white/10 lg:hidden"
            >
              <div className="mx-auto grid w-full max-w-6xl gap-1 px-4 py-3 sm:px-6">
                {NAV.map(({ to, label, icon: Icon, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      `flex min-h-[48px] items-center gap-2.5 rounded-xl px-3 text-sm font-medium ${
                        isActive ? 'bg-white/10 text-mint-300' : 'text-slate-300 hover:bg-white/5'
                      }`
                    }
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </NavLink>
                ))}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-5 sm:px-6 sm:py-10">
        <Outlet />
      </main>

      <footer className="border-t border-white/10 px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-center text-xs text-slate-500 sm:px-6">
        PathoQuiz · дані та зображення взяті з «Патоморфологія препарати.pdf»
      </footer>
    </div>
  );
}
