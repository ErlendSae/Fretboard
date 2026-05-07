import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import {
  GhostButton,
  InfoCard,
  PageWrapper,
  SectionHeader,
} from '../components/ui'
import { clearSessions, getSessions, getStats } from '../lib/store'
import type { Session } from '../lib/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PAGE_LABELS: Record<Session['page'], string> = {
  noteTrainer: 'Note Quiz',
}

function formatDate(iso: string): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  } catch {
    return '—'
  }
}

function formatAccuracy(correct: number, rounds: number): string {
  if (rounds === 0) return '—'
  return `${Math.round((correct / rounds) * 100)}%`
}

// ─── Stat card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  title: string
  bestStreak: number
  sessionsPlayed: number
  avgAccuracy: number
  lastPlayedAt: string
}

function StatCard({ title, bestStreak, sessionsPlayed, avgAccuracy, lastPlayedAt }: StatCardProps) {
  return (
    <div className="bg-stone-800 border border-stone-700 rounded-xl px-5 py-4 space-y-3 flex-1 min-w-[160px]">
      <p className="text-[11px] font-medium text-stone-400 tracking-wide">{title}</p>
      <div className="space-y-1.5">
        <div className="flex justify-between items-baseline gap-2">
          <span className="text-xs text-stone-500">Best streak</span>
          <span className="text-stone-100 font-semibold tabular-nums">{bestStreak}</span>
        </div>
        <div className="flex justify-between items-baseline gap-2">
          <span className="text-xs text-stone-500">Sessions</span>
          <span className="text-stone-100 font-semibold tabular-nums">{sessionsPlayed}</span>
        </div>
        <div className="flex justify-between items-baseline gap-2">
          <span className="text-xs text-stone-500">Avg accuracy</span>
          <span className="text-stone-100 font-semibold tabular-nums">
            {sessionsPlayed > 0 ? `${Math.round(avgAccuracy * 100)}%` : '—'}
          </span>
        </div>
        <div className="flex justify-between items-baseline gap-2">
          <span className="text-xs text-stone-500">Last played</span>
          <span className="text-stone-400 text-xs tabular-nums">{formatDate(lastPlayedAt)}</span>
        </div>
      </div>
    </div>
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function Stats() {
  const stats = getStats()
  const recentSessions = getSessions({ limit: 10 })
  const chartSessions = getSessions({ limit: 20 })
  const [confirmClear, setConfirmClear] = useState(false)
  const [cleared, setCleared] = useState(false)

  const chartData = [...chartSessions].reverse().map((s, i) => ({
    index: i + 1,
    date: formatDate(s.endedAt),
    noteTrainer: s.page === 'noteTrainer' && s.rounds > 0
      ? Math.round((s.correct / s.rounds) * 100)
      : undefined,
  }))

  const hasAnySessions = recentSessions.length > 0

  function handleClear() {
    clearSessions()
    setConfirmClear(false)
    setCleared(true)
  }

  return (
    <PageWrapper>
      <SectionHeader
        title="Your Progress"
        subtitle="Practice history across all tools"
      />

      {/* Row 1: Stat card */}
      <div className="flex flex-wrap gap-4 animate-fade-up">
        <StatCard
          title="Note Quiz"
          bestStreak={stats.noteTrainer.bestStreak}
          sessionsPlayed={stats.noteTrainer.sessionsPlayed}
          avgAccuracy={stats.noteTrainer.avgAccuracy}
          lastPlayedAt={stats.noteTrainer.lastPlayedAt}
        />
      </div>

      {/* Row 2: Accuracy chart */}
      {hasAnySessions && chartData.length > 0 && (
        <div className="bg-stone-800 border border-stone-700 rounded-xl px-5 py-4 animate-fade-up">
          <p className="text-[11px] font-medium text-stone-400 tracking-wide mb-4">Accuracy over last 20 sessions</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
              <XAxis
                dataKey="date"
                tick={{ fill: '#78716c', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: '#78716c', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `${v}%`}
              />
              <Tooltip
                contentStyle={{
                  background: '#1c1917',
                  border: '1px solid #44403c',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#e7e5e4',
                }}
                formatter={(value) => [`${value}%`, '']}
              />
              <Line
                type="monotone"
                dataKey="noteTrainer"
                stroke="#fb7185"
                strokeWidth={2}
                dot={false}
                connectNulls
                name="Note Quiz"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Row 3: Recent sessions */}
      {hasAnySessions && (
        <div className="animate-fade-up">
          <p className="text-[11px] font-medium text-stone-400 tracking-wide mb-3">Recent sessions</p>
          <InfoCard>
            <div className="space-y-2">
              {recentSessions.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between gap-3 text-sm flex-wrap"
                >
                  <span className="text-stone-400 text-xs tabular-nums w-16 shrink-0">
                    {formatDate(s.endedAt)}
                  </span>
                  <span className="text-stone-300 flex-1 min-w-[100px]">
                    {PAGE_LABELS[s.page]}
                  </span>
                  <span className="text-stone-500 text-xs tabular-nums">
                    {s.rounds} rounds
                  </span>
                  <span className="text-stone-400 font-semibold tabular-nums text-xs">
                    {formatAccuracy(s.correct, s.rounds)}
                  </span>
                </div>
              ))}
            </div>
          </InfoCard>
        </div>
      )}

      {/* No data state */}
      {!hasAnySessions && !cleared && (
        <InfoCard>
          <p className="text-stone-400 text-sm">
            No practice sessions yet. Complete a session in{' '}
            <span className="text-stone-200">Note Quiz</span> to see your stats here.
          </p>
        </InfoCard>
      )}

      {cleared && (
        <InfoCard>
          <p className="text-stone-400 text-sm">All session data cleared.</p>
        </InfoCard>
      )}

      {/* Footer: clear data */}
      {hasAnySessions && (
        <div className="flex items-center gap-3 animate-fade-up">
          {confirmClear ? (
            <>
              <span className="text-xs text-stone-400">Are you sure? This cannot be undone.</span>
              <button
                onClick={handleClear}
                className="text-xs text-brick-400 hover:text-brick-300 transition-colors duration-150 px-2 py-1"
              >
                Yes, clear all
              </button>
              <GhostButton onClick={() => setConfirmClear(false)}>
                Cancel
              </GhostButton>
            </>
          ) : (
            <GhostButton onClick={() => setConfirmClear(true)}>
              Clear all data
            </GhostButton>
          )}
        </div>
      )}
    </PageWrapper>
  )
}
