import { openDB, type IDBPDatabase } from 'idb'

interface ScriptEntry {
  id: string
  name: string
  content: string
  createdAt: number
  updatedAt: number
}

interface HistoryEntry {
  id?: number
  command: string
  timestamp: number
}

// ─── Attack Session types ──────────────────────────────────────────────────────

export type AttackEvent =
  | { type: 'challenge_start'; timestamp: number }
  | {
      type: 'http_request'; timestamp: number; source: 'browser' | 'repeater' | 'terminal' | 'code'
      id: number; method: string; url: string
      requestHeaders: [string, string][]; requestBody: string | null
      status: number; responseHeaders: [string, string][]; responseBody: string; duration: number
      executionId?: string
    }
  | { type: 'terminal_command'; timestamp: number; command: string; output: string; error: boolean }
  | { type: 'code_execution'; timestamp: number; executionId: string; code: string; output: string; error: boolean; duration: number }
  | { type: 'flag_attempt'; timestamp: number; submitted: string; correct: boolean }
  | { type: 'challenge_solved'; timestamp: number }
  | { type: 'note'; timestamp: number; id: string; content: string; updatedAt: number | null }

export interface NoteEntry {
  id: string
  challengeSlug: string
  content: string
  createdAt: number
  updatedAt: number | null
}

export interface AttackSession {
  challengeSlug: string
  challengeTitle: string
  startedAt: number
  solvedAt: number | null
  events: AttackEvent[]
}

interface ChallengeToolsDB {
  'code-scripts': ScriptEntry
  'terminal-history': HistoryEntry
  'attack-sessions': AttackSession
  'pentest-notes': NoteEntry
}

const DB_NAME = 'challenge-tools'
const DB_VERSION = 3

let dbPromise: Promise<IDBPDatabase<ChallengeToolsDB>> | null = null

function getDb(): Promise<IDBPDatabase<ChallengeToolsDB>> {
  if (!dbPromise) {
    dbPromise = openDB<ChallengeToolsDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('code-scripts')) {
          db.createObjectStore('code-scripts', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('terminal-history')) {
          db.createObjectStore('terminal-history', { keyPath: 'id', autoIncrement: true })
        }
        if (!db.objectStoreNames.contains('attack-sessions')) {
          db.createObjectStore('attack-sessions', { keyPath: 'challengeSlug' })
        }
        if (!db.objectStoreNames.contains('pentest-notes')) {
          const noteStore = db.createObjectStore('pentest-notes', { keyPath: 'id' })
          noteStore.createIndex('by-slug', 'challengeSlug', { unique: false })
        }
      },
    })
  }
  return dbPromise
}

function uuid(): string {
  return crypto.randomUUID()
}

export function useChallengePersistence() {
  // ─── Code Scripts ──────────────────────────────────────────────────────────

  async function saveScript(name: string, content: string): Promise<string> {
    const db = await getDb()
    const now = Date.now()
    const entry: ScriptEntry = { id: uuid(), name, content, createdAt: now, updatedAt: now }
    await db.put('code-scripts', entry)
    return entry.id
  }

  async function listScripts(): Promise<ScriptEntry[]> {
    const db = await getDb()
    const all = await db.getAll('code-scripts')
    return (all as ScriptEntry[]).sort((a, b) => b.updatedAt - a.updatedAt)
  }

  async function loadScript(id: string): Promise<string | null> {
    const db = await getDb()
    const entry = await db.get('code-scripts', id) as ScriptEntry | undefined
    return entry?.content ?? null
  }

  async function deleteScript(id: string): Promise<void> {
    const db = await getDb()
    await db.delete('code-scripts', id)
  }

  // ─── Terminal History ──────────────────────────────────────────────────────

  async function appendHistory(command: string): Promise<void> {
    const db = await getDb()
    const all = await db.getAll('terminal-history') as HistoryEntry[]
    // Deduplicate consecutive identical commands
    if (all.length > 0 && all[all.length - 1].command === command) return
    await db.put('terminal-history', { command, timestamp: Date.now() })
  }

  async function loadHistory(limit = 200): Promise<string[]> {
    const db = await getDb()
    const all = await db.getAll('terminal-history') as HistoryEntry[]
    const recent = all.slice(-limit)
    return recent.map(e => e.command)
  }

  // ─── Attack Sessions ────────────────────────────────────────────────────────

  async function saveAttackSession(session: AttackSession): Promise<void> {
    const db = await getDb()
    // Strip Vue reactive proxies — structured clone (used by IDB) cannot
    // handle Proxy objects that wrap trafficLog header arrays.
    const plain = JSON.parse(JSON.stringify(session)) as AttackSession
    await db.put('attack-sessions', plain)
  }

  async function loadAttackSession(slug: string): Promise<AttackSession | null> {
    const db = await getDb()
    const session = await db.get('attack-sessions', slug) as AttackSession | undefined
    return session ?? null
  }

  // ─── Pentest Notes ───────────────────────────────────────────────────────────

  async function saveNote(note: NoteEntry): Promise<void> {
    const db = await getDb()
    await db.put('pentest-notes', note)
  }

  async function loadNotesBySlug(slug: string): Promise<NoteEntry[]> {
    const db = await getDb()
    const notes = await db.getAllFromIndex('pentest-notes', 'by-slug', slug) as NoteEntry[]
    return notes.sort((a, b) => a.createdAt - b.createdAt)
  }

  async function deleteNote(id: string): Promise<void> {
    const db = await getDb()
    await db.delete('pentest-notes', id)
  }

  return { saveScript, listScripts, loadScript, deleteScript, appendHistory, loadHistory, saveAttackSession, loadAttackSession, saveNote, loadNotesBySlug, deleteNote }
}
