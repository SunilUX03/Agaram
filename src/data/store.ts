import { buildSeed, type Db } from './seed';

const KEY = 'agaram-demo-db-v1';
const SESSION = 'agaram-demo-session';
const VERSION_DAY = () => new Date().toISOString().slice(0, 10);

// Demo only: the mock database and session live in browser storage (see README).
let db: Db | null = null;

function load(): Db {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { day: string; db: Db };
      if (parsed.day === VERSION_DAY()) return parsed.db; // dates are relative to today, so reseed each day
    }
  } catch {
    /* ignore and reseed */
  }
  return buildSeed();
}

export const getDb = (): Db => (db ??= load());
export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify({ day: VERSION_DAY(), db: getDb() }));
  } catch {
    /* storage unavailable: the demo still works in memory */
  }
}
export function resetDb() {
  db = buildSeed();
  save();
}
export const nextId = (prefix: string) => `${prefix}-${++getDb().seq}`;

/** Demo switches (brief, section 3). */
export const demo = { forceLoading: false, forceEmpty: false, forceError: false };
const listeners = new Set<() => void>();
export const onDemoChange = (fn: () => void) => (
  listeners.add(fn),
  () => void listeners.delete(fn)
);
export const setDemo = (patch: Partial<typeof demo>) => {
  Object.assign(demo, patch);
  listeners.forEach((l) => l());
};

export const session = {
  get active() {
    try {
      return sessionStorage.getItem(SESSION) === '1' || localStorage.getItem(SESSION) === '1';
    } catch {
      return false;
    }
  },
  start() {
    try {
      localStorage.setItem(SESSION, '1');
    } catch {
      /* ignore */
    }
  },
  end() {
    try {
      localStorage.removeItem(SESSION);
      sessionStorage.removeItem(SESSION);
    } catch {
      /* ignore */
    }
  },
};
