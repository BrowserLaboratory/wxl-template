import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mock idb ─────────────────────────────────────────────────────────────────
// We use an in-memory store to simulate IndexedDB without a real browser IDB.
let codeScripts: Record<string, any> = {}
let terminalHistory: Array<{ id: number; command: string; timestamp: number }> = []
let attackSessions: Record<string, any> = {}
let pentestNotes: Record<string, any> = {}
let historyCounter = 0
let createdStores: string[] = []
let createdIndexes: Array<{ store: string; name: string; keyPath: string }> = []

vi.mock('idb', () => ({
  openDB: vi.fn(async (_name: string, _version: number, { upgrade }: any) => {
    // Track which stores exist to simulate objectStoreNames.contains
    const existingStores = new Set<string>()
    const mockDb = {
      objectStoreNames: { contains: (name: string) => existingStores.has(name) },
      createObjectStore: vi.fn((name: string, _opts?: any) => {
        existingStores.add(name)
        createdStores.push(name)
        return {
          createIndex: vi.fn((indexName: string, keyPath: string) => {
            createdIndexes.push({ store: name, name: indexName, keyPath })
          }),
        }
      }),
    }
    upgrade?.(mockDb)
    return {
      put(store: string, value: any) {
        if (store === 'code-scripts') codeScripts[value.id] = value
        if (store === 'terminal-history') {
          const id = ++historyCounter
          terminalHistory.push({ ...value, id })
          return id
        }
        if (store === 'attack-sessions') {
          attackSessions[value.challengeSlug] = value
          return value.challengeSlug
        }
        if (store === 'pentest-notes') {
          pentestNotes[value.id] = value
          return value.id
        }
        return value.id
      },
      get(store: string, key: string) {
        if (store === 'code-scripts') return codeScripts[key] ?? null
        if (store === 'attack-sessions') return attackSessions[key] ?? null
        if (store === 'pentest-notes') return pentestNotes[key] ?? null
        return null
      },
      getAll(store: string) {
        if (store === 'code-scripts') return Object.values(codeScripts)
        if (store === 'terminal-history') return [...terminalHistory]
        if (store === 'attack-sessions') return Object.values(attackSessions)
        if (store === 'pentest-notes') return Object.values(pentestNotes)
        return []
      },
      getAllFromIndex(store: string, _index: string, query: any) {
        if (store === 'pentest-notes') {
          return Object.values(pentestNotes).filter((n: any) => n.challengeSlug === query)
        }
        return []
      },
      delete(store: string, key: string) {
        if (store === 'code-scripts') delete codeScripts[key]
        if (store === 'attack-sessions') delete attackSessions[key]
        if (store === 'pentest-notes') delete pentestNotes[key]
      },
    }
  }),
}))

beforeEach(() => {
  codeScripts = {}
  terminalHistory = []
  attackSessions = {}
  pentestNotes = {}
  historyCounter = 0
  createdStores = []
  createdIndexes = []
  vi.resetModules()
})

describe('useChallengePersistence', () => {
  it('opens challenge-tools DB at version 3 on first use', async () => {
    const { openDB } = await import('idb')
    const { useChallengePersistence } = await import('../../../.vitepress/theme/composables/useChallengePersistence')
    const { listScripts } = useChallengePersistence()
    await listScripts()  // triggers lazy DB open
    expect(openDB).toHaveBeenCalledWith('challenge-tools', 3, expect.any(Object))
  })

  it('saveScript stores script and returns an id', async () => {
    const { useChallengePersistence } = await import('../../../.vitepress/theme/composables/useChallengePersistence')
    const { saveScript } = useChallengePersistence()
    const id = await saveScript('my-exploit', "print('hello')")
    expect(typeof id).toBe('string')
    expect(id.length).toBeGreaterThan(0)
    expect(codeScripts[id]).toBeDefined()
    expect(codeScripts[id].name).toBe('my-exploit')
    expect(codeScripts[id].content).toBe("print('hello')")
  })

  it('listScripts returns scripts sorted by updatedAt descending', async () => {
    const { useChallengePersistence } = await import('../../../.vitepress/theme/composables/useChallengePersistence')
    const { saveScript, listScripts } = useChallengePersistence()

    const id1 = await saveScript('first', 'code1')
    // Wait a tick to ensure different timestamps
    await new Promise(r => setTimeout(r, 2))
    const id2 = await saveScript('second', 'code2')

    const scripts = await listScripts()
    expect(scripts).toHaveLength(2)
    // More recently updated should be first
    expect(scripts[0].id).toBe(id2)
    expect(scripts[1].id).toBe(id1)
  })

  it('loadScript returns content by id', async () => {
    const { useChallengePersistence } = await import('../../../.vitepress/theme/composables/useChallengePersistence')
    const { saveScript, loadScript } = useChallengePersistence()

    const id = await saveScript('test', 'content123')
    const content = await loadScript(id)
    expect(content).toBe('content123')
  })

  it('loadScript returns null for unknown id', async () => {
    const { useChallengePersistence } = await import('../../../.vitepress/theme/composables/useChallengePersistence')
    const { loadScript } = useChallengePersistence()
    const content = await loadScript('nonexistent-uuid')
    expect(content).toBeNull()
  })

  it('deleteScript removes the script', async () => {
    const { useChallengePersistence } = await import('../../../.vitepress/theme/composables/useChallengePersistence')
    const { saveScript, deleteScript, listScripts } = useChallengePersistence()

    const id = await saveScript('to-delete', 'bye')
    await deleteScript(id)
    const scripts = await listScripts()
    expect(scripts.find(s => s.id === id)).toBeUndefined()
  })

  it('appendHistory stores commands in order', async () => {
    const { useChallengePersistence } = await import('../../../.vitepress/theme/composables/useChallengePersistence')
    const { appendHistory, loadHistory } = useChallengePersistence()

    await appendHistory('curl /a')
    await appendHistory('curl /b')
    await appendHistory('curl /c')

    const history = await loadHistory()
    expect(history).toEqual(['curl /a', 'curl /b', 'curl /c'])
  })

  it('appendHistory deduplicates consecutive identical commands', async () => {
    const { useChallengePersistence } = await import('../../../.vitepress/theme/composables/useChallengePersistence')
    const { appendHistory, loadHistory } = useChallengePersistence()

    await appendHistory('curl /a')
    await appendHistory('curl /a')  // duplicate
    await appendHistory('curl /b')
    await appendHistory('curl /b')  // duplicate

    const history = await loadHistory()
    expect(history).toEqual(['curl /a', 'curl /b'])
  })

  it('loadHistory respects limit', async () => {
    const { useChallengePersistence } = await import('../../../.vitepress/theme/composables/useChallengePersistence')
    const { appendHistory, loadHistory } = useChallengePersistence()

    for (let i = 0; i < 10; i++) {
      await appendHistory(`cmd${i}`)
    }

    const history = await loadHistory(3)
    expect(history).toHaveLength(3)
    // Should be the last 3
    expect(history).toEqual(['cmd7', 'cmd8', 'cmd9'])
  })

  // ─── v2: attack-sessions store ──────────────────────────────────────────────

  it('creates attack-sessions store on initialization', async () => {
    const { useChallengePersistence } = await import('../../../.vitepress/theme/composables/useChallengePersistence')
    const { listScripts } = useChallengePersistence()
    await listScripts() // triggers DB open
    expect(createdStores).toContain('attack-sessions')
  })

  it('creates all four stores on fresh install (v0 → v3)', async () => {
    const { useChallengePersistence } = await import('../../../.vitepress/theme/composables/useChallengePersistence')
    const { listScripts } = useChallengePersistence()
    await listScripts()
    expect(createdStores).toContain('code-scripts')
    expect(createdStores).toContain('terminal-history')
    expect(createdStores).toContain('attack-sessions')
    expect(createdStores).toContain('pentest-notes')
  })

  it('creates by-slug index on pentest-notes store', async () => {
    const { useChallengePersistence } = await import('../../../.vitepress/theme/composables/useChallengePersistence')
    const { listScripts } = useChallengePersistence()
    await listScripts()
    const idx = createdIndexes.find(i => i.store === 'pentest-notes' && i.name === 'by-slug')
    expect(idx).toBeDefined()
    expect(idx?.keyPath).toBe('challengeSlug')
  })

  it('saveAttackSession persists session and loadAttackSession retrieves it', async () => {
    const { useChallengePersistence } = await import('../../../.vitepress/theme/composables/useChallengePersistence')
    const { saveAttackSession, loadAttackSession } = useChallengePersistence()

    const session = {
      challengeSlug: 'sqli-demo',
      challengeTitle: 'SQL Injection Demo',
      startedAt: Date.now(),
      solvedAt: null,
      events: [{ type: 'challenge_start' as const, timestamp: Date.now() }],
    }
    await saveAttackSession(session)
    const loaded = await loadAttackSession('sqli-demo')
    expect(loaded).toEqual(session)
  })

  it('loadAttackSession returns null for unknown slug', async () => {
    const { useChallengePersistence } = await import('../../../.vitepress/theme/composables/useChallengePersistence')
    const { loadAttackSession } = useChallengePersistence()
    const result = await loadAttackSession('nonexistent-slug')
    expect(result).toBeNull()
  })

  it('saveAttackSession overwrites existing session for same slug (upsert)', async () => {
    const { useChallengePersistence } = await import('../../../.vitepress/theme/composables/useChallengePersistence')
    const { saveAttackSession, loadAttackSession } = useChallengePersistence()

    const session1 = {
      challengeSlug: 'xss-demo',
      challengeTitle: 'XSS Demo',
      startedAt: 1000,
      solvedAt: null,
      events: [{ type: 'challenge_start' as const, timestamp: 1000 }],
    }
    await saveAttackSession(session1)

    const session2 = { ...session1, startedAt: 2000, solvedAt: 3000 }
    await saveAttackSession(session2)

    const loaded = await loadAttackSession('xss-demo')
    expect(loaded?.startedAt).toBe(2000)
    expect(loaded?.solvedAt).toBe(3000)
  })

  it('v1 → v3 migration preserves existing stores and adds attack-sessions + pentest-notes', async () => {
    // Simulate v1 DB that already has code-scripts and terminal-history
    const { openDB } = await import('idb')
    const mockOpenDB = openDB as ReturnType<typeof vi.fn>
    mockOpenDB.mockImplementationOnce(async (_name: string, _version: number, { upgrade }: any) => {
      const existingStores = new Set(['code-scripts', 'terminal-history'])
      const mockDb = {
        objectStoreNames: { contains: (name: string) => existingStores.has(name) },
        createObjectStore: vi.fn((name: string) => {
          existingStores.add(name)
          createdStores.push(name)
          return { createIndex: vi.fn((n: string, kp: string) => { createdIndexes.push({ store: name, name: n, keyPath: kp }) }) }
        }),
      }
      upgrade?.(mockDb)
      return {
        put: vi.fn(),
        get: vi.fn(() => null),
        getAll: vi.fn(() => []),
        getAllFromIndex: vi.fn(() => []),
        delete: vi.fn(),
      }
    })

    vi.resetModules()
    const mod = await import('../../../.vitepress/theme/composables/useChallengePersistence')
    const { listScripts } = mod.useChallengePersistence()
    await listScripts()

    // Only new stores should be created; existing stores should NOT be recreated
    expect(createdStores).toContain('attack-sessions')
    expect(createdStores).toContain('pentest-notes')
    expect(createdStores).not.toContain('code-scripts')
    expect(createdStores).not.toContain('terminal-history')
  })

  it('v2 → v3 migration preserves existing stores and only adds pentest-notes', async () => {
    const { openDB } = await import('idb')
    const mockOpenDB = openDB as ReturnType<typeof vi.fn>
    mockOpenDB.mockImplementationOnce(async (_name: string, _version: number, { upgrade }: any) => {
      const existingStores = new Set(['code-scripts', 'terminal-history', 'attack-sessions'])
      const mockDb = {
        objectStoreNames: { contains: (name: string) => existingStores.has(name) },
        createObjectStore: vi.fn((name: string) => {
          existingStores.add(name)
          createdStores.push(name)
          return { createIndex: vi.fn((n: string, kp: string) => { createdIndexes.push({ store: name, name: n, keyPath: kp }) }) }
        }),
      }
      upgrade?.(mockDb)
      return {
        put: vi.fn(),
        get: vi.fn(() => null),
        getAll: vi.fn(() => []),
        getAllFromIndex: vi.fn(() => []),
        delete: vi.fn(),
      }
    })

    vi.resetModules()
    const mod = await import('../../../.vitepress/theme/composables/useChallengePersistence')
    const { listScripts } = mod.useChallengePersistence()
    await listScripts()

    expect(createdStores).toContain('pentest-notes')
    expect(createdStores).not.toContain('code-scripts')
    expect(createdStores).not.toContain('terminal-history')
    expect(createdStores).not.toContain('attack-sessions')
  })

  // ─── v3: pentest-notes store ─────────────────────────────────────────────────

  it('saveNote persists note to IndexedDB', async () => {
    const { useChallengePersistence } = await import('../../../.vitepress/theme/composables/useChallengePersistence')
    const { saveNote } = useChallengePersistence()
    const note = { id: 'note-1', challengeSlug: 'sqli-demo', content: 'test note', createdAt: Date.now(), updatedAt: null }
    await saveNote(note)
    expect(pentestNotes['note-1']).toEqual(note)
  })

  it('loadNotesBySlug returns only notes for the given slug', async () => {
    const { useChallengePersistence } = await import('../../../.vitepress/theme/composables/useChallengePersistence')
    const { saveNote, loadNotesBySlug } = useChallengePersistence()
    const now = Date.now()
    await saveNote({ id: 'n1', challengeSlug: 'sqli-demo', content: 'a', createdAt: now, updatedAt: null })
    await saveNote({ id: 'n2', challengeSlug: 'php-demo',  content: 'b', createdAt: now, updatedAt: null })

    const notes = await loadNotesBySlug('sqli-demo')
    expect(notes).toHaveLength(1)
    expect(notes[0].id).toBe('n1')
  })

  it('loadNotesBySlug returns empty array when no notes exist', async () => {
    const { useChallengePersistence } = await import('../../../.vitepress/theme/composables/useChallengePersistence')
    const { loadNotesBySlug } = useChallengePersistence()
    const notes = await loadNotesBySlug('nonexistent-challenge')
    expect(notes).toEqual([])
  })

  it('deleteNote removes note from the store', async () => {
    const { useChallengePersistence } = await import('../../../.vitepress/theme/composables/useChallengePersistence')
    const { saveNote, deleteNote, loadNotesBySlug } = useChallengePersistence()
    await saveNote({ id: 'del-1', challengeSlug: 'test', content: 'bye', createdAt: Date.now(), updatedAt: null })
    await deleteNote('del-1')
    const notes = await loadNotesBySlug('test')
    expect(notes.find(n => n.id === 'del-1')).toBeUndefined()
  })

  it('saveNote performs upsert (second save overwrites first)', async () => {
    const { useChallengePersistence } = await import('../../../.vitepress/theme/composables/useChallengePersistence')
    const { saveNote, loadNotesBySlug } = useChallengePersistence()
    const base = { id: 'upsert-1', challengeSlug: 'test', content: 'original', createdAt: 1000, updatedAt: null }
    await saveNote(base)
    await saveNote({ ...base, content: 'updated', updatedAt: 2000 })
    const notes = await loadNotesBySlug('test')
    expect(notes).toHaveLength(1)
    expect(notes[0].content).toBe('updated')
    expect(notes[0].updatedAt).toBe(2000)
  })
})
