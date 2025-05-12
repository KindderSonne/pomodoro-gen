
export type PomodoroPhase = 'work' | 'break' | 'longbreak';

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
}

export interface PomodoroSession {
  id: string;
  startTime: number;
  endTime: number | null;
  phase: PomodoroPhase;
  taskId?: string;
}

export interface DailyStat {
  date: string; // YYYY-MM-DD format
  count: number;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artist: string;
  albumArt: string;
  uri: string;
}
