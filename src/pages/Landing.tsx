import { Link } from 'react-router-dom'
import { Layers, Map, Mic, Music2 } from 'lucide-react'

// ─── Static fretboard preview ─────────────────────────────────────────────────
// Represents ~5 frets / 6 strings. No audio, no React state.
// Colors map directly to DESIGN_SYSTEM fretboard tokens.

const STRINGS = 6
const FRETS = 5
const STRING_HEIGHTS = [1, 1, 1.5, 1.5, 2, 2.5] // px, thinnest on top

// A handful of note-marker positions [stringIndex, fretIndex, variant]
const PREVIEW_DOTS: Array<[number, number, 'root' | 'scale' | 'chord']> = [
  [4, 2, 'root'],
  [3, 2, 'chord'],
  [2, 2, 'scale'],
  [1, 3, 'scale'],
  [4, 4, 'chord'],
  [5, 4, 'scale'],
]

const DOT_COLOR: Record<'root' | 'scale' | 'chord', string> = {
  root:  '#f5ead6', // --ink-cream
  scale: '#f0b89a', // --terra-200  scale tone / peach
  chord: '#e8b15c', // --sun-400    chord tone / honey gold
}

function FretboardPreview() {
  const W = 480
  const H = 120
  const paddingX = 32
  const paddingY = 16
  const fretW = (W - paddingX * 2) / FRETS
  const stringH = (H - paddingY * 2) / (STRINGS - 1)
  const nutX = paddingX

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      aria-hidden="true"
      className="w-full max-w-xl"
      style={{ filter: 'drop-shadow(0 8px 32px rgba(0,0,0,0.5))' }}
    >
      {/* Wood neck background */}
      <defs>
        <linearGradient id="wood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#2c1404" /> {/* --wood-deep */}
          <stop offset="50%"  stopColor="#5a2e10" /> {/* --wood-mid  */}
          <stop offset="100%" stopColor="#2c1404" /> {/* --wood-deep */}
        </linearGradient>
        <clipPath id="neck-clip">
          <rect x="0" y="0" width={W} height={H} rx="8" />
        </clipPath>
      </defs>

      <rect x="0" y="0" width={W} height={H} rx="8" fill="url(#wood)" />

      {/* Nut */}
      <rect x={nutX - 4} y={paddingY - 2} width={5} height={H - paddingY * 2 + 4}
        fill="#f5ead6" opacity="0.85" rx="1" clipPath="url(#neck-clip)" />

      {/* Fret lines */}
      {Array.from({ length: FRETS }, (_, i) => {
        const x = paddingX + fretW * (i + 1)
        return (
          <line key={i} x1={x} y1={paddingY - 2} x2={x} y2={H - paddingY + 2}
            stroke="#c89d5a" strokeOpacity="0.5" strokeWidth="1" /> /* --wood-fret */
        )
      })}

      {/* Strings */}
      {Array.from({ length: STRINGS }, (_, i) => {
        const y = paddingY + stringH * i
        return (
          <line key={i} x1={nutX} y1={y} x2={W - paddingX / 2} y2={y}
            stroke="#ead7b8" strokeOpacity="0.75" strokeWidth={STRING_HEIGHTS[i]} /> /* --wood-string */
        )
      })}

      {/* Inlay dots at fret 3 */}
      {[2, 4].map((si) => (
        <circle key={si}
          cx={paddingX + fretW * 2.5}
          cy={paddingY + stringH * si}
          r={3.5}
          fill="#d4b88a" fillOpacity="0.3" /* --wood-inlay */
        />
      ))}

      {/* Note markers */}
      {PREVIEW_DOTS.map(([si, fi, variant], idx) => {
        const cx = paddingX + fretW * fi - fretW / 2
        const cy = paddingY + stringH * si
        return (
          <g key={idx}>
            <circle cx={cx} cy={cy} r={9} fill={DOT_COLOR[variant]} opacity="0.92" />
          </g>
        )
      })}
    </svg>
  )
}

// ─── Feature cards ────────────────────────────────────────────────────────────

interface FeatureCardProps {
  icon: React.ReactNode
  label: string
  description: string
  to: string
  delay: string
}

function FeatureCard({ icon, label, description, to, delay }: FeatureCardProps) {
  return (
    <Link
      to={to}
      className="group animate-fade-up bg-stone-800 border border-stone-200/10 rounded-[18px] px-6 py-6
        flex flex-col gap-3 hover:border-stone-200/20 hover:bg-stone-800/80
        transition-all duration-150 active:scale-95"
      style={{ animationDelay: delay }}
    >
      <div className="text-stone-400 group-hover:text-stone-300 transition-colors duration-150">
        {icon}
      </div>
      <div>
        <p className="text-stone-200 font-semibold text-[15px] mb-1">{label}</p>
        <p className="text-[14px] text-stone-400 leading-[1.55]">{description}</p>
      </div>
      <span className="text-[11px] text-terra-400 mt-auto">
        Open &rarr;
      </span>
    </Link>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="flex-1 flex flex-col items-center justify-center gap-10 px-6 py-20 text-center">

        <div className="animate-fade-up" style={{ animationDelay: '0ms' }}>
          <FretboardPreview />
        </div>

        <div className="animate-fade-up space-y-5 max-w-[760px]" style={{ animationDelay: '80ms' }}>
          <h1
            className="font-display font-bold text-stone-200 leading-[1.02] tracking-[-0.035em]"
            style={{ fontSize: 'clamp(3rem, 8vw, 6rem)', fontVariationSettings: '"opsz" 144' }}
          >
            Learn the neck.
          </h1>
          <p
            className="font-display font-normal text-stone-300 leading-[1.55] max-w-[560px] mx-auto"
            style={{ fontSize: '17px', fontVariationSettings: '"opsz" 18', letterSpacing: '-0.005em' }}
          >
            Scales, ear training, and chord progressions for guitarists who want to stop guessing.
          </p>
        </div>

        <div
          className="animate-fade-up flex flex-wrap justify-center gap-3"
          style={{ animationDelay: '160ms' }}
        >
          <Link
            to="/explore"
            className="animate-pulse-terra bg-terra-500 hover:bg-terra-400 active:bg-terra-600 active:scale-95
              text-stone-200 font-bold px-8 py-3.5 rounded-[14px] transition-all duration-150"
          >
            Start exploring
          </Link>
          <Link
            to="/quiz"
            className="bg-stone-700 hover:bg-stone-700/80 active:scale-95 text-stone-300
              font-semibold px-8 py-3.5 rounded-[10px] transition-all duration-150
              border border-stone-200/20 hover:border-stone-200/30"
          >
            Train your ear
          </Link>
        </div>

      </section>

      {/* ── Feature blocks ───────────────────────────────────────────────── */}
      <section className="px-6 pb-16 max-w-4xl mx-auto w-full">
        <p
          className="animate-fade-up text-[11px] font-semibold text-stone-500 tracking-[0.12em] uppercase mb-6 text-center"
          style={{ animationDelay: '200ms' }}
        >
          Practice modes
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FeatureCard
            icon={<Map size={20} strokeWidth={1.5} />}
            label="Explorer"
            description="Visualize any scale across the full fretboard. Pick a key and scale, then try a position."
            to="/explore"
            delay="240ms"
          />
          <FeatureCard
            icon={<Layers size={20} strokeWidth={1.5} />}
            label="CAGED"
            description="Learn the five shapes that tile the entire neck. Understand where you are in any key, anywhere on the fretboard."
            to="/caged"
            delay="300ms"
          />
          <FeatureCard
            icon={<Music2 size={20} strokeWidth={1.5} />}
            label="Progressions"
            description="Build chord progressions in any key. Hear the seven diatonic chords and see how they connect."
            to="/progressions"
            delay="360ms"
          />
          <FeatureCard
            icon={<Mic size={20} strokeWidth={1.5} />}
            label="Note Quiz"
            description="Train your ear. The app calls a note — you find it on your guitar, the mic checks the pitch."
            to="/quiz"
            delay="420ms"
          />
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-stone-800 px-6 py-5 flex items-center justify-between gap-4 flex-wrap">
        <span className="text-stone-600 text-sm font-medium select-none">Bånd</span>
        <span className="text-stone-600 text-sm">Made for guitarists</span>
        <a
          href="https://github.com/erlendsaeveraas/fretboardApp"
          target="_blank"
          rel="noopener noreferrer"
          className="text-stone-600 text-sm hover:text-stone-400 transition-colors duration-150"
        >
          Source &rarr;
        </a>
      </footer>

    </div>
  )
}
