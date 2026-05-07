import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, NavLink, Link } from 'react-router-dom'
import { BarChart2, Guitar, Layers, Music2, Mic } from 'lucide-react'
import Explorer from './pages/Explorer'
import Landing from './pages/Landing'
import CAGEDPage from './pages/CAGED'
import Progressions from './pages/Progressions'
import Quiz from './pages/Quiz'
import NotFound from './components/NotFound'
import { supabase } from './lib/supabase'

const Auth = lazy(() => import('./pages/Auth'))
const Stats = lazy(() => import('./pages/Stats'))

const NAV_LINKS = [
  { to: '/explore',      label: 'Explorer',    end: false, Icon: Guitar    },
  { to: '/caged',        label: 'CAGED',       end: false, Icon: Layers    },
  { to: '/progressions', label: 'Progressions',end: false, Icon: Music2    },
  { to: '/quiz',         label: 'Note Quiz',   end: false, Icon: Mic       },
  { to: '/stats',        label: 'Stats',       end: false, Icon: BarChart2 },
]

function LogoMark() {
  return (
    <svg width="26" height="26" viewBox="0 0 80 80" fill="none" aria-hidden="true">
      <rect width="80" height="80" rx="18" fill="#cf6a44"/>
      <rect x="20" y="14" width="6" height="52" rx="1.5" fill="#f5ead6"/>
      <rect x="54" y="14" width="6" height="52" rx="1.5" fill="#f5ead6"/>
      <circle cx="40" cy="40" r="7" fill="#f5ead6"/>
    </svg>
  )
}

export default function App() {
  useEffect(() => {
    const client = supabase
    if (!client) return
    const { data: { subscription } } = client.auth.onAuthStateChange(async (event) => {
      if (event !== 'SIGNED_IN') return
      const { data: { user } } = await client.auth.getUser()
      if (!user) return

      // Hydrate preferences from server
      const { data: prefRow } = await client
        .from('preferences')
        .select('data')
        .eq('user_id', user.id)
        .single()
      if (prefRow?.data) {
        try {
          const existing = JSON.parse(localStorage.getItem('fretboard.preferences') ?? '{}')
          localStorage.setItem('fretboard.preferences', JSON.stringify({ ...existing, ...prefRow.data }))
        } catch { /* ignore */ }
      }

      // Append server sessions not in local log
      const { data: serverSessions } = await client
        .from('sessions')
        .select('*')
        .eq('user_id', user.id)
      if (serverSessions && serverSessions.length > 0) {
        try {
          const localLog = JSON.parse(localStorage.getItem('fretboard.sessions') ?? '{"__v":1,"sessions":[]}')
          const localIds = new Set((localLog.sessions ?? []).map((s: { id: string }) => s.id))
          const toAdd = serverSessions
            .filter((s) => !localIds.has(s.id))
            .map((s) => ({
              id: s.id,
              page: s.page,
              startedAt: s.started_at,
              endedAt: s.ended_at,
              rounds: s.rounds,
              correct: s.correct,
              bestStreakInSession: s.best_streak,
              config: s.config ?? {},
            }))
          if (toAdd.length > 0) {
            localLog.sessions = [...(localLog.sessions ?? []), ...toAdd]
            localStorage.setItem('fretboard.sessions', JSON.stringify(localLog))
          }
        } catch { /* ignore */ }
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  return (
    <BrowserRouter>
      {/* ── Skip to content (keyboard / screen-reader) ───────────────────── */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[200] focus:bg-stone-900 focus:text-terra-400 focus:text-sm focus:font-medium focus:px-4 focus:py-2 focus:rounded-lg focus:ring-2 focus:ring-terra-500 focus:outline-none"
      >
        Skip to content
      </a>

      <div className="h-screen bg-stone-900 text-stone-200 flex overflow-hidden">

        {/* ── Desktop sidebar — hidden on mobile ──────────────────────────── */}
        <aside className="hidden md:flex w-52 shrink-0 flex-col bg-stone-800 border-r border-stone-200/10 h-screen">

          {/* Logo */}
          <div className="px-5 pt-5 pb-3">
            <Link to="/" className="flex items-center gap-2.5 group">
              <LogoMark />
              <span className="font-display font-bold text-stone-200 text-[20px] tracking-[-0.02em] group-hover:text-stone-100 transition-colors duration-150">
                Bånd
              </span>
            </Link>
          </div>

          {/* Nav links */}
          <nav className="flex flex-col gap-0.5 px-3 py-2 flex-1" aria-label="Main navigation">
            {NAV_LINKS.map(({ to, label, end, Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 border ${
                    isActive
                      ? 'bg-stone-700 text-stone-200 border-stone-200/20'
                      : 'text-stone-400 hover:text-stone-200 hover:bg-stone-700/40 border-transparent'
                  }`
                }
              >
                <Icon size={18} strokeWidth={1.5} aria-hidden="true" />
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Sign in + footer */}
          <div className="px-3 pb-2">
            <NavLink
              to="/auth"
              end={false}
              aria-label="Sign in to your account"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 border ${
                  isActive
                    ? 'bg-stone-700 text-stone-200 border-stone-200/20'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-700/40 border-transparent'
                }`
              }
            >
              Sign in
            </NavLink>
          </div>
          <p className="px-5 pb-4 text-xs text-stone-500 select-none">Made for guitarists</p>
        </aside>

        {/* ── Main content ────────────────────────────────────────────────── */}
        <main id="main-content" className="flex-1 flex flex-col overflow-auto pb-16 md:pb-0 min-w-0">
          <Suspense fallback={<div className="flex-1 bg-stone-900" />}>
            <Routes>
              <Route path="/"             element={<Landing />} />
              <Route path="/explore"      element={<Explorer />} />
              <Route path="/caged"        element={<CAGEDPage />} />
              <Route path="/progressions" element={<Progressions />} />
              <Route path="/quiz"         element={<Quiz />} />
              <Route path="/stats"        element={<Stats />} />
              <Route path="/auth"         element={<Auth />} />
              <Route path="*"             element={<NotFound />} />
            </Routes>
          </Suspense>
        </main>

        {/* ── Mobile bottom tab bar — hidden on desktop ───────────────────── */}
        <nav
          className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-stone-800/95 backdrop-blur border-t border-stone-200/10"
          aria-label="Main navigation"
        >
          <div className="flex items-stretch">
            {NAV_LINKS.map(({ to, label, end, Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex-1 flex flex-col items-center justify-center py-2 min-h-[44px] gap-0.5 transition-colors duration-150 ${
                    isActive ? 'text-terra-400' : 'text-stone-500 active:text-stone-300'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={20} aria-hidden="true" strokeWidth={isActive ? 2.5 : 1.5} />
                    <span className="text-[10px] leading-none font-medium">{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>

      </div>
    </BrowserRouter>
  )
}
