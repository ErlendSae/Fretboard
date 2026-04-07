import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import Explorer from './pages/Explorer'
import Quiz from './pages/Quiz'
import ScaleQuiz from './pages/ScaleQuiz'
import Intervals from './pages/Intervals'
import Progressions from './pages/Progressions'

const NAV_LINKS = [
  { to: '/',              label: 'Explorer',     end: true  },
  { to: '/progressions',  label: 'Progressions', end: false },
  { to: '/quiz',          label: 'Note Quiz',    end: false },
  { to: '/scale-quiz',    label: 'Scale Quiz',   end: false },
  { to: '/intervals',     label: 'Intervals',    end: false },
]

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-stone-900 text-stone-200 flex flex-col">
        <nav className="bg-stone-950 border-b border-stone-800 px-6 py-3.5 flex items-center gap-6 overflow-x-auto">
          <span className="text-stone-100 font-bold text-lg tracking-tight mr-2 shrink-0 select-none">
            Fretboard
          </span>
          {NAV_LINKS.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors duration-150 shrink-0 ${
                  isActive
                    ? 'text-rose-400 border-b-2 border-rose-400 pb-0.5'
                    : 'text-stone-500 hover:text-stone-300'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/"              element={<Explorer />} />
            <Route path="/progressions"  element={<Progressions />} />
            <Route path="/quiz"          element={<Quiz />} />
            <Route path="/scale-quiz"    element={<ScaleQuiz />} />
            <Route path="/intervals"     element={<Intervals />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
