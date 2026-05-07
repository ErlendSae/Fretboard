import React from 'react'

interface Props { children: React.ReactNode }
interface State { error: Error | null }

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null }
  static getDerivedStateFromError(error: Error): State { return { error } }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-stone-900 flex flex-col items-center justify-center gap-6 px-6 text-center">
          <p className="text-stone-400 text-sm max-w-sm">
            Something went wrong. Try refreshing — if the issue persists, check that mic permissions are granted.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-terra-500 hover:bg-terra-400 active:scale-95 text-white font-bold px-6 py-2.5 rounded-xl transition-all duration-150"
          >
            Refresh
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
