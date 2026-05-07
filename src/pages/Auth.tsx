import { useState } from 'react'
import { PrimaryButton } from '../components/ui'
import { supabase } from '../lib/supabase'

type AuthState = 'idle' | 'sending' | 'sent' | 'error'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [authState, setAuthState] = useState<AuthState>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!supabase || !email.trim()) return

    setAuthState('sending')
    setErrorMessage('')

    const { error } = await supabase.auth.signInWithOtp({ email: email.trim() })

    if (error) {
      setAuthState('error')
      setErrorMessage(error.message)
    } else {
      setAuthState('sent')
    }
  }

  return (
    <div className="min-h-screen bg-stone-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-stone-800 border border-stone-700 rounded-2xl p-8 space-y-6">

        <div>
          <h1 className="text-2xl font-bold text-stone-100 mb-1">Sign in</h1>
          <p className="text-sm text-stone-500">
            Enter your email — we'll send a magic link.
          </p>
        </div>

        {!supabase ? (
          <div className="bg-stone-700/50 border border-stone-600 rounded-lg px-4 py-3">
            <p className="text-stone-300 text-sm">
              Auth is not configured. Add{' '}
              <code className="font-mono text-terra-300">VITE_SUPABASE_URL</code> and{' '}
              <code className="font-mono text-terra-300">VITE_SUPABASE_ANON_KEY</code>{' '}
              to your <code className="font-mono text-terra-300">.env</code> file to enable sync.
            </p>
          </div>
        ) : authState === 'sent' ? (
          <div className="bg-sage-900/30 border border-sage-700/60 rounded-lg px-4 py-3 space-y-1">
            <p className="text-sage-300 font-semibold text-sm">Check your inbox</p>
            <p className="text-stone-400 text-xs">
              We sent a magic link to <span className="text-stone-200">{email}</span>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="auth-email"
                className="text-[11px] font-medium text-stone-400 tracking-wide"
              >
                Email address
              </label>
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="w-full bg-stone-800 border border-stone-700 text-stone-200 rounded-lg px-3 py-2
                  text-sm focus:outline-none focus:border-stone-500 focus:ring-1 focus:ring-stone-500/40
                  transition-colors duration-150 placeholder:text-stone-600"
              />
            </div>

            {authState === 'error' && (
              <div className="bg-brick-900/30 border border-brick-800/60 rounded-lg px-3 py-2">
                <p className="text-brick-300 text-xs">{errorMessage || 'Something went wrong. Please try again.'}</p>
              </div>
            )}

            <PrimaryButton
              type="submit"
              disabled={authState === 'sending' || !email.trim()}
              className="w-full justify-center"
            >
              {authState === 'sending' ? 'Sending…' : 'Send link'}
            </PrimaryButton>
          </form>
        )}

      </div>
    </div>
  )
}
