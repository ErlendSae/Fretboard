import type { AppStats, PageStats, Preferences, Session, SessionLog } from './types'

// ─── Storage keys ─────────────────────────────────────────────────────────────

const KEY_PREFERENCES = 'fretboard.preferences'
const KEY_STATS = 'fretboard.stats'
const KEY_SESSIONS = 'fretboard.sessions'

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_PAGE_STATS: PageStats = {
  sessionsPlayed: 0,
  bestStreak: 0,
  avgAccuracy: 0,
  lastPlayedAt: '',
  totalAnswered: 0,
  totalCorrect: 0,
}

const DEFAULT_STATS: AppStats = {
  __v: 1,
  noteTrainer: { ...DEFAULT_PAGE_STATS },
}

const DEFAULT_PREFERENCES: Preferences = {
  __v: 1,
  lastScale: '',
  lastKey: '',
  difficulty: 'intermediate',
  tuning: 'standard',
  muted: false,
  reduceMotion: false,
}

const DEFAULT_SESSION_LOG: SessionLog = { __v: 1, sessions: [] }

// ─── Migration ────────────────────────────────────────────────────────────────

function migrate<T extends { __v: number }>(raw: unknown, current: T): T {
  if (!raw || typeof raw !== 'object') return current
  const data = raw as Record<string, unknown>
  if (!data.__v) return { ...current, ...data, __v: current.__v }
  return { ...current, ...data }
}

// ─── Safe JSON parse ──────────────────────────────────────────────────────────

function readLocal(key: string): unknown {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function writeLocal(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Silently ignore storage errors (quota exceeded, private browsing, etc.)
  }
}

// ─── UUID helper ──────────────────────────────────────────────────────────────

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

// ─── Preferences ─────────────────────────────────────────────────────────────

export function getPreferences(): Preferences {
  return migrate(readLocal(KEY_PREFERENCES), DEFAULT_PREFERENCES)
}

export function setPreferences(patch: Partial<Preferences>): void {
  const current = getPreferences()
  writeLocal(KEY_PREFERENCES, { ...current, ...patch })
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export function getStats(): AppStats {
  const raw = readLocal(KEY_STATS)
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_STATS }
  const data = raw as Record<string, unknown>

  const migratePageStats = (page: unknown): PageStats => {
    if (!page || typeof page !== 'object') return { ...DEFAULT_PAGE_STATS }
    return { ...DEFAULT_PAGE_STATS, ...(page as Record<string, unknown>) } as PageStats
  }

  return {
    __v: 1,
    noteTrainer: migratePageStats(data['noteTrainer']),
  }
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

function getSessionLog(): SessionLog {
  return migrate(readLocal(KEY_SESSIONS), DEFAULT_SESSION_LOG)
}

export function recordSession(session: Omit<Session, 'id'>): void {
  // Append to session log
  const log = getSessionLog()
  const newSession: Session = { ...session, id: generateId() }
  const updatedLog: SessionLog = {
    __v: 1,
    sessions: [...log.sessions, newSession],
  }
  writeLocal(KEY_SESSIONS, updatedLog)

  // Update aggregates atomically
  const stats = getStats()
  const page = session.page
  const pageStats = stats[page]

  const newTotalAnswered = pageStats.totalAnswered + session.rounds
  const newTotalCorrect = pageStats.totalCorrect + session.correct
  const newAvgAccuracy = newTotalAnswered > 0 ? newTotalCorrect / newTotalAnswered : 0

  const updatedPageStats: PageStats = {
    sessionsPlayed: pageStats.sessionsPlayed + 1,
    bestStreak: Math.max(pageStats.bestStreak, session.bestStreakInSession),
    avgAccuracy: newAvgAccuracy,
    lastPlayedAt: session.endedAt,
    totalAnswered: newTotalAnswered,
    totalCorrect: newTotalCorrect,
  }

  const updatedStats: AppStats = {
    ...stats,
    [page]: updatedPageStats,
  }
  writeLocal(KEY_STATS, updatedStats)
}

export function getSessions(opts?: {
  limit?: number
  page?: 'noteTrainer'
}): Session[] {
  const log = getSessionLog()
  let sessions = [...log.sessions].reverse() // most recent first

  if (opts?.page) {
    sessions = sessions.filter((s) => s.page === opts.page)
  }

  if (opts?.limit) {
    sessions = sessions.slice(0, opts.limit)
  }

  return sessions
}

export function clearSessions(): void {
  writeLocal(KEY_SESSIONS, DEFAULT_SESSION_LOG)
}
