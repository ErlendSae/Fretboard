export interface Preferences {
  __v: 1;
  lastScale: string;
  lastKey: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tuning: string;
  muted: boolean;
  reduceMotion: boolean;
}

export interface PageStats {
  sessionsPlayed: number;
  bestStreak: number;
  avgAccuracy: number;
  lastPlayedAt: string;
  totalAnswered: number;
  totalCorrect: number;
}

export interface AppStats {
  __v: 1;
  noteTrainer: PageStats;
}

export interface Session {
  id: string;
  page: 'noteTrainer';
  startedAt: string;
  endedAt: string;
  rounds: number;
  correct: number;
  bestStreakInSession: number;
  config: Record<string, unknown>;
}

export interface SessionLog {
  __v: 1;
  sessions: Session[];
}

export interface DrillProgress {
  packId: string;
  bestAccuracy: number;
  completed: boolean;
  attempts: number;
}
