import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-stone-900 flex flex-col items-center justify-center gap-6 px-6 text-center">
      <span className="text-stone-600 text-7xl font-bold tabular-nums select-none">404</span>
      <div className="space-y-2">
        <h1 className="text-xl font-bold text-stone-100">Page not found</h1>
        <p className="text-stone-500 text-sm">This fret doesn&apos;t exist.</p>
      </div>
      <Link
        to="/"
        className="bg-terra-500 hover:bg-terra-400 active:scale-95 text-white font-bold px-6 py-2.5 rounded-xl transition-all duration-150"
      >
        Back to home
      </Link>
    </div>
  )
}
