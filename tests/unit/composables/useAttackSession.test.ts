import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mock useChallengePersistence ─────────────────────────────────────────────
let savedSessions: Record<string, any> = {}
const mockSaveAttackSession = vi.fn(async (session: any) => {
  savedSessions[session.challengeSlug] = structuredClone(session)
})
const mockLoadAttackSession = vi.fn(async (slug: string) => {
  return savedSessions[slug] ?? null
})

vi.mock('../../../.vitepress/theme/composables/useChallengePersistence', () => ({
  useChallengePersistence: () => ({
    saveAttackSession: mockSaveAttackSession,
    loadAttackSession: mockLoadAttackSession,
    saveNote: vi.fn(),
    loadNotesBySlug: vi.fn(async () => []),
    deleteNote: vi.fn(),
  }),
}))

beforeEach(() => {
  savedSessions = {}
  mockSaveAttackSession.mockClear()
  mockLoadAttackSession.mockClear()
  vi.restoreAllMocks()
})

describe('useAttackSession', () => {
  it('creates a new session with challenge_start event on first visit', async () => {
    const { useAttackSession } = await import('../../../.vitepress/theme/composables/useAttackSession')
    const session = useAttackSession('sqli-demo', 'SQL Injection Demo')
    await session.init()

    expect(mockLoadAttackSession).toHaveBeenCalledWith('sqli-demo')
    expect(mockSaveAttackSession).toHaveBeenCalled()
    const saved = mockSaveAttackSession.mock.calls[0][0]
    expect(saved.challengeSlug).toBe('sqli-demo')
    expect(saved.challengeTitle).toBe('SQL Injection Demo')
    expect(saved.solvedAt).toBeNull()
    expect(saved.events).toHaveLength(1)
    expect(saved.events[0].type).toBe('challenge_start')
  })

  it('resumes existing unsolved session without adding a new challenge_start event', async () => {
    const existingSession = {
      challengeSlug: 'xss-demo',
      challengeTitle: 'XSS Demo',
      startedAt: 1000,
      solvedAt: null,
      events: [{ type: 'challenge_start', timestamp: 1000 }],
    }
    savedSessions['xss-demo'] = existingSession

    const { useAttackSession } = await import('../../../.vitepress/theme/composables/useAttackSession')
    const session = useAttackSession('xss-demo', 'XSS Demo')
    await session.init()

    // Should NOT have saved a new session (just resumed)
    expect(mockSaveAttackSession).not.toHaveBeenCalled()
    // The internal session should be the existing one
    const exported = session.getSession()
    expect(exported?.startedAt).toBe(1000)
    expect(exported?.events).toHaveLength(1)
  })

  it('addHttpEvent appends http_request event with source attribution', async () => {
    const { useAttackSession } = await import('../../../.vitepress/theme/composables/useAttackSession')
    const session = useAttackSession('sqli-demo', 'SQL Injection Demo')
    await session.init()

    const entry = {
      id: 1, timestamp: Date.now(), method: 'GET', url: 'https://challenge-sqli.localhost/',
      requestHeaders: [['Host', 'challenge-sqli.localhost']] as [string, string][],
      requestBody: null, status: 200,
      responseHeaders: [['Content-Type', 'text/html']] as [string, string][],
      responseBody: '<html></html>', duration: 42,
    }
    await session.addHttpEvent(entry, 'browser')

    const s = session.getSession()!
    expect(s.events).toHaveLength(2) // challenge_start + http_request
    const httpEvent = s.events[1]
    expect(httpEvent.type).toBe('http_request')
    expect((httpEvent as any).source).toBe('browser')
    expect((httpEvent as any).method).toBe('GET')
    expect((httpEvent as any).status).toBe(200)

    // Should have been persisted
    expect(mockSaveAttackSession).toHaveBeenCalledTimes(2) // init + addHttpEvent
  })

  it('addHttpEvent with repeater source', async () => {
    const { useAttackSession } = await import('../../../.vitepress/theme/composables/useAttackSession')
    const session = useAttackSession('test', 'Test')
    await session.init()

    const entry = {
      id: 2, timestamp: Date.now(), method: 'POST', url: 'https://challenge-test.localhost/login',
      requestHeaders: [] as [string, string][],
      requestBody: 'user=admin', status: 302,
      responseHeaders: [] as [string, string][],
      responseBody: '', duration: 10,
    }
    await session.addHttpEvent(entry, 'repeater')

    const httpEvent = session.getSession()!.events[1]
    expect((httpEvent as any).source).toBe('repeater')
    expect((httpEvent as any).requestBody).toBe('user=admin')
  })

  it('addFlagAttempt records incorrect flag attempt without solving', async () => {
    const { useAttackSession } = await import('../../../.vitepress/theme/composables/useAttackSession')
    const session = useAttackSession('test', 'Test')
    await session.init()

    await session.addFlagAttempt('CTF{wrong}', false)

    const s = session.getSession()!
    expect(s.events).toHaveLength(2) // challenge_start + flag_attempt
    const flagEvent = s.events[1]
    expect(flagEvent.type).toBe('flag_attempt')
    expect((flagEvent as any).submitted).toBe('CTF{wrong}')
    expect((flagEvent as any).correct).toBe(false)
    expect(s.solvedAt).toBeNull()
  })

  it('addFlagAttempt with correct=true appends challenge_solved and sets solvedAt', async () => {
    const { useAttackSession } = await import('../../../.vitepress/theme/composables/useAttackSession')
    const session = useAttackSession('test', 'Test')
    await session.init()

    await session.addFlagAttempt('CTF{correct}', true)

    const s = session.getSession()!
    expect(s.events).toHaveLength(3) // challenge_start + flag_attempt + challenge_solved
    expect(s.events[1].type).toBe('flag_attempt')
    expect((s.events[1] as any).correct).toBe(true)
    expect(s.events[2].type).toBe('challenge_solved')
    expect(s.solvedAt).toBeTypeOf('number')
    expect(s.solvedAt).toBeGreaterThan(0)
  })

  it('exportSession triggers browser download with correct filename', async () => {
    const { useAttackSession } = await import('../../../.vitepress/theme/composables/useAttackSession')
    const session = useAttackSession('sqli-demo', 'SQL Injection Demo')
    await session.init()

    // Mock DOM elements for Blob download
    const clickSpy = vi.fn()
    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue({
      href: '',
      download: '',
      click: clickSpy,
    } as any)
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test')
    const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

    session.exportSession({})

    expect(createElementSpy).toHaveBeenCalledWith('a')
    expect(createObjectURLSpy).toHaveBeenCalled()
    expect(clickSpy).toHaveBeenCalled()
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:test')

    // Verify filename pattern
    const anchor = createElementSpy.mock.results[0].value
    expect(anchor.download).toMatch(/^attack-session-sqli-demo-\d{8}-\d{6}\.json$/)

    createElementSpy.mockRestore()
    createObjectURLSpy.mockRestore()
    revokeObjectURLSpy.mockRestore()
  })

  it('exportSession produces layered JSON with meta/challenge/session structure', async () => {
    const { useAttackSession } = await import('../../../.vitepress/theme/composables/useAttackSession')
    const session = useAttackSession('sqli-demo', 'SQL Injection Demo')
    await session.init()

    let capturedBlob: Blob | null = null
    const clickSpy = vi.fn()
    vi.spyOn(document, 'createElement').mockReturnValue({ href: '', download: '', click: clickSpy } as any)
    vi.spyOn(URL, 'createObjectURL').mockImplementation((blob: Blob) => {
      capturedBlob = blob
      return 'blob:test'
    })
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

    session.exportSession({
      difficulty: 'easy',
      category: 'web',
      backend: 'flask',
      description: 'A short description',
      fullDescription: '# SQL Injection Demo\n\nFull body.',
    })

    expect(capturedBlob).not.toBeNull()
    const text = await capturedBlob!.text()
    const payload = JSON.parse(text)

    // meta section
    expect(payload.meta).toBeDefined()
    expect(typeof payload.meta.systemPrompt).toBe('string')
    expect(payload.meta.systemPrompt.length).toBeGreaterThan(0)
    expect(typeof payload.meta.timezone).toBe('string')
    expect(payload.meta.timezone.length).toBeGreaterThan(0)
    expect(typeof payload.meta.exportedAt).toBe('string')
    // ISO 8601 with timezone offset
    expect(payload.meta.exportedAt).toMatch(/T\d{2}:\d{2}:\d{2}[+-]/)

    // challenge section
    expect(payload.challenge.slug).toBe('sqli-demo')
    expect(payload.challenge.title).toBe('SQL Injection Demo')
    expect(payload.challenge.difficulty).toBe('easy')
    expect(payload.challenge.category).toBe('web')
    expect(payload.challenge.backend).toBe('flask')
    expect(payload.challenge.description).toBe('A short description')
    expect(payload.challenge.fullDescription).toBe('# SQL Injection Demo\n\nFull body.')

    // session section
    expect(payload.session).toBeDefined()
    expect(typeof payload.session.startedAt).toBe('number')
    expect(Array.isArray(payload.session.events)).toBe(true)

    // Old flat structure should NOT be at top-level
    expect(payload.challengeSlug).toBeUndefined()
    expect(payload.events).toBeUndefined()
  })

  it('exportSession omits undefined optional challenge fields', async () => {
    const { useAttackSession } = await import('../../../.vitepress/theme/composables/useAttackSession')
    const session = useAttackSession('test', 'Test Challenge')
    await session.init()

    let capturedBlob: Blob | null = null
    vi.spyOn(document, 'createElement').mockReturnValue({ href: '', download: '', click: vi.fn() } as any)
    vi.spyOn(URL, 'createObjectURL').mockImplementation((blob: Blob) => { capturedBlob = blob; return 'blob:test' })
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

    session.exportSession({})

    const text = await capturedBlob!.text()
    const payload = JSON.parse(text)
    expect(payload.challenge.slug).toBe('test')
    expect(payload.challenge.title).toBe('Test Challenge')
    // Optional fields absent from challengeInfo should not appear
    expect(payload.challenge.difficulty).toBeUndefined()
    expect(payload.challenge.description).toBeUndefined()
  })

  it('addTerminalCommand appends terminal_command event', async () => {
    const { useAttackSession } = await import('../../../.vitepress/theme/composables/useAttackSession')
    const session = useAttackSession('test', 'Test')
    await session.init()

    await session.addTerminalCommand('help', 'Available commands: ...', false)

    const s = session.getSession()!
    expect(s.events).toHaveLength(2) // challenge_start + terminal_command
    const ev = s.events[1]
    expect(ev.type).toBe('terminal_command')
    expect((ev as any).command).toBe('help')
    expect((ev as any).output).toBe('Available commands: ...')
    expect((ev as any).error).toBe(false)
    expect(mockSaveAttackSession).toHaveBeenCalledTimes(2) // init + addTerminalCommand
  })

  it('addTerminalCommand records error commands', async () => {
    const { useAttackSession } = await import('../../../.vitepress/theme/composables/useAttackSession')
    const session = useAttackSession('test', 'Test')
    await session.init()

    await session.addTerminalCommand('foo', 'wxlsh: command not found: foo', true)

    const ev = session.getSession()!.events[1]
    expect(ev.type).toBe('terminal_command')
    expect((ev as any).error).toBe(true)
  })

  it('addCodeExecution appends code_execution event', async () => {
    const { useAttackSession } = await import('../../../.vitepress/theme/composables/useAttackSession')
    const session = useAttackSession('test', 'Test')
    await session.init()

    await session.addCodeExecution('print("hello")', 'hello\n', false, 150)

    const s = session.getSession()!
    expect(s.events).toHaveLength(2) // challenge_start + code_execution
    const ev = s.events[1]
    expect(ev.type).toBe('code_execution')
    expect((ev as any).code).toBe('print("hello")')
    expect((ev as any).output).toBe('hello\n')
    expect((ev as any).error).toBe(false)
    expect((ev as any).duration).toBe(150)
    expect(mockSaveAttackSession).toHaveBeenCalledTimes(2)
  })

  it('addCodeExecution records error with duration', async () => {
    const { useAttackSession } = await import('../../../.vitepress/theme/composables/useAttackSession')
    const session = useAttackSession('test', 'Test')
    await session.init()

    await session.addCodeExecution('x', 'Error:\nNameError: name \'x\' is not defined', true, 50)

    const ev = session.getSession()!.events[1]
    expect(ev.type).toBe('code_execution')
    expect((ev as any).error).toBe(true)
    expect((ev as any).duration).toBe(50)
  })

  it('addHttpEvent accepts terminal and code sources', async () => {
    const { useAttackSession } = await import('../../../.vitepress/theme/composables/useAttackSession')
    const session = useAttackSession('test', 'Test')
    await session.init()

    const entry = {
      id: 1, timestamp: Date.now(), method: 'GET', url: 'https://challenge-test.localhost/',
      requestHeaders: [] as [string, string][],
      requestBody: null, status: 200,
      responseHeaders: [] as [string, string][],
      responseBody: 'ok', duration: 10,
    }
    await session.addHttpEvent(entry, 'terminal')
    await session.addHttpEvent({ ...entry, id: 2 }, 'code')

    const events = session.getSession()!.events
    expect((events[1] as any).source).toBe('terminal')
    expect((events[2] as any).source).toBe('code')
  })

  it('addCodeExecution includes executionId in event', async () => {
    const { useAttackSession } = await import('../../../.vitepress/theme/composables/useAttackSession')
    const session = useAttackSession('test', 'Test')
    await session.init()

    await session.addCodeExecution('print("x")', 'x\n', false, 100, 'exec-uuid-1')

    const ev = session.getSession()!.events[1]
    expect(ev.type).toBe('code_execution')
    expect((ev as any).executionId).toBe('exec-uuid-1')
    expect((ev as any).code).toBe('print("x")')
  })

  it('addHttpEvent with source=code and executionId links to code execution', async () => {
    const { useAttackSession } = await import('../../../.vitepress/theme/composables/useAttackSession')
    const session = useAttackSession('test', 'Test')
    await session.init()

    const entry = {
      id: 1, timestamp: Date.now(), method: 'GET', url: 'https://challenge-test.localhost/',
      requestHeaders: [] as [string, string][],
      requestBody: null, status: 200,
      responseHeaders: [] as [string, string][],
      responseBody: 'ok', duration: 10,
    }
    await session.addHttpEvent(entry, 'code', 'exec-uuid-1')

    const ev = session.getSession()!.events[1]
    expect(ev.type).toBe('http_request')
    expect((ev as any).executionId).toBe('exec-uuid-1')
  })

  it('addHttpEvent with source=browser has no executionId', async () => {
    const { useAttackSession } = await import('../../../.vitepress/theme/composables/useAttackSession')
    const session = useAttackSession('test', 'Test')
    await session.init()

    const entry = {
      id: 1, timestamp: Date.now(), method: 'GET', url: 'https://challenge-test.localhost/',
      requestHeaders: [] as [string, string][],
      requestBody: null, status: 200,
      responseHeaders: [] as [string, string][],
      responseBody: 'ok', duration: 10,
    }
    await session.addHttpEvent(entry, 'browser')

    const ev = session.getSession()!.events[1]
    expect((ev as any).executionId).toBeUndefined()
  })

  it('addNoteEvent appends note event to session', async () => {
    const { useAttackSession } = await import('../../../.vitepress/theme/composables/useAttackSession')
    const session = useAttackSession('test', 'Test')
    await session.init()

    await session.addNoteEvent('note-1', 'my first note')

    const s = session.getSession()!
    expect(s.events).toHaveLength(2)
    const ev = s.events[1]
    expect(ev.type).toBe('note')
    expect((ev as any).id).toBe('note-1')
    expect((ev as any).content).toBe('my first note')
    expect((ev as any).updatedAt).toBeNull()
    expect(mockSaveAttackSession).toHaveBeenCalledTimes(2)
  })

  it('updateNoteEvent updates content and updatedAt on existing note event', async () => {
    const { useAttackSession } = await import('../../../.vitepress/theme/composables/useAttackSession')
    const session = useAttackSession('test', 'Test')
    await session.init()
    await session.addNoteEvent('note-1', 'original')

    await session.updateNoteEvent('note-1', 'revised')

    const ev = session.getSession()!.events.find(e => e.type === 'note' && (e as any).id === 'note-1')
    expect(ev).toBeDefined()
    expect((ev as any).content).toBe('revised')
    expect((ev as any).updatedAt).toBeTypeOf('number')
  })

  it('updateNoteEvent is a no-op for nonexistent id', async () => {
    const { useAttackSession } = await import('../../../.vitepress/theme/composables/useAttackSession')
    const session = useAttackSession('test', 'Test')
    await session.init()

    // Should not throw
    await expect(session.updateNoteEvent('ghost-id', 'text')).resolves.toBeUndefined()
  })

  it('exportSession systemPrompt references note event type', async () => {
    const { useAttackSession } = await import('../../../.vitepress/theme/composables/useAttackSession')
    const session = useAttackSession('sqli-demo', 'SQL Injection Demo')
    await session.init()

    let capturedBlob: Blob | null = null
    vi.spyOn(document, 'createElement').mockReturnValue({ href: '', download: '', click: vi.fn() } as any)
    vi.spyOn(URL, 'createObjectURL').mockImplementation((blob: Blob) => { capturedBlob = blob; return 'blob:test' })
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

    session.exportSession({})

    const text = await capturedBlob!.text()
    const payload = JSON.parse(text)
    expect(payload.meta.systemPrompt).toContain('note')
  })

  it('creates a new session overwriting solved session on re-visit', async () => {
    const solvedSession = {
      challengeSlug: 'csrf-demo',
      challengeTitle: 'CSRF Demo',
      startedAt: 1000,
      solvedAt: 2000,
      events: [
        { type: 'challenge_start', timestamp: 1000 },
        { type: 'challenge_solved', timestamp: 2000 },
      ],
    }
    savedSessions['csrf-demo'] = solvedSession

    const { useAttackSession } = await import('../../../.vitepress/theme/composables/useAttackSession')
    const session = useAttackSession('csrf-demo', 'CSRF Demo')
    await session.init()

    // Should have created a new session overwriting the solved one
    expect(mockSaveAttackSession).toHaveBeenCalled()
    const saved = mockSaveAttackSession.mock.calls[0][0]
    expect(saved.solvedAt).toBeNull()
    expect(saved.events).toHaveLength(1)
    expect(saved.events[0].type).toBe('challenge_start')
    expect(saved.startedAt).not.toBe(1000) // New startedAt
  })
})
