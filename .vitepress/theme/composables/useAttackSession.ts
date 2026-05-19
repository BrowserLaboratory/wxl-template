import { useChallengePersistence, type AttackSession, type AttackEvent } from './useChallengePersistence'
import type { TrafficEntry } from './useTrafficLog'

export type { AttackSession, AttackEvent }

export interface ChallengeExportInfo {
  difficulty?: string
  category?: string
  backend?: string
  description?: string
  fullDescription?: string
}

interface SessionExportPayload {
  meta: {
    systemPrompt: string
    timezone: string
    exportedAt: string
  }
  challenge: {
    slug: string
    title: string
    difficulty?: string
    category?: string
    backend?: string
    description?: string
    fullDescription?: string
  }
  session: {
    startedAt: number
    solvedAt: number | null
    events: AttackEvent[]
  }
}

const WRITEUP_SYSTEM_PROMPT = [
  'You are a CTF (Capture The Flag) writeup assistant.',
  'You will receive a structured attack session JSON file containing the challenge description,',
  'HTTP request/response history, terminal commands, code executions, pentest notes, flag attempts, and timing information.',
  'The event timeline may include seven event types:',
  'challenge_start (session begins),',
  'http_request (with source: browser/repeater/terminal/code indicating where the request originated;',
  'code-sourced requests also carry an executionId linking them to their originating code_execution event),',
  'terminal_command (wxlsh shell commands with their output and error status),',
  'code_execution (Python code run in the Code Editor with output, error status, duration in ms, and executionId),',
  'note (learner-written pentest notes in markdown, with id, content, and optional updatedAt),',
  'flag_attempt (submitted flags with correctness),',
  'and challenge_solved (successful completion).',
  'Your task is to produce a clear, educational writeup in Traditional Chinese (繁體中文) with the following structure:\n',
  '1. **題目概述** (Challenge Overview): Summarize the challenge name, difficulty, category, and what the challenge is about based on the description.',
  '2. **解題思路** (Approach): Explain the vulnerability identified and the attack strategy. Incorporate any learner notes (note events) as first-hand observations from the attacker\'s perspective. Consider terminal commands and code executions as part of the attacker\'s methodology.',
  '3. **攻擊步驟** (Attack Steps): Walk through the key events step by step — including HTTP requests, terminal commands (e.g., curl, decode, encode), Python code executions, and relevant notes — explaining what was done and what was discovered.',
  '4. **Flag 取得** (Flag Capture): Describe how the correct flag was finally obtained.',
  '5. **學習重點** (Key Takeaways): Summarize what security concepts this challenge demonstrates.\n',
  'Use the timestamps and timezone provided to reference when events occurred if relevant.',
  'Focus on clarity and educational value.',
].join(' ')

export function useAttackSession(challengeSlug: string, challengeTitle: string) {
  const { saveAttackSession, loadAttackSession } = useChallengePersistence()
  let session: AttackSession | null = null

  async function init(): Promise<void> {
    const existing = await loadAttackSession(challengeSlug)

    if (existing && existing.solvedAt === null) {
      // Resume unsolved session
      session = existing
      return
    }

    // Create new session (first visit or solved session re-visit)
    const now = Date.now()
    session = {
      challengeSlug,
      challengeTitle,
      startedAt: now,
      solvedAt: null,
      events: [{ type: 'challenge_start', timestamp: now }],
    }
    await saveAttackSession(session)
  }

  async function addHttpEvent(entry: TrafficEntry, source: 'browser' | 'repeater' | 'terminal' | 'code', executionId?: string | null): Promise<void> {
    if (!session) return
    const event: Extract<AttackEvent, { type: 'http_request' }> = {
      type: 'http_request',
      timestamp: Date.now(),
      source,
      id: entry.id,
      method: entry.method,
      url: entry.url,
      requestHeaders: entry.requestHeaders,
      requestBody: entry.requestBody,
      status: entry.status,
      responseHeaders: entry.responseHeaders,
      responseBody: entry.responseBody,
      duration: entry.duration,
    }
    if (executionId) event.executionId = executionId
    session.events.push(event)
    await saveAttackSession(session)
  }

  async function addTerminalCommand(command: string, output: string, error: boolean): Promise<void> {
    if (!session) return
    session.events.push({ type: 'terminal_command', timestamp: Date.now(), command, output, error })
    await saveAttackSession(session)
  }

  async function addCodeExecution(code: string, output: string, error: boolean, duration: number, executionId: string): Promise<void> {
    if (!session) return
    session.events.push({ type: 'code_execution', timestamp: Date.now(), executionId, code, output, error, duration })
    await saveAttackSession(session)
  }

  async function addNoteEvent(id: string, content: string): Promise<void> {
    if (!session) return
    session.events.push({ type: 'note', timestamp: Date.now(), id, content, updatedAt: null })
    await saveAttackSession(session)
  }

  async function updateNoteEvent(id: string, content: string): Promise<void> {
    if (!session) return
    const ev = session.events.find(e => e.type === 'note' && (e as any).id === id) as Extract<AttackEvent, { type: 'note' }> | undefined
    if (!ev) return
    ev.content = content
    ev.updatedAt = Date.now()
    await saveAttackSession(session)
  }

  async function addFlagAttempt(submitted: string, correct: boolean): Promise<void> {
    if (!session) return
    const now = Date.now()
    session.events.push({ type: 'flag_attempt', timestamp: now, submitted, correct })
    if (correct) {
      session.events.push({ type: 'challenge_solved', timestamp: now })
      session.solvedAt = now
    }
    await saveAttackSession(session)
  }

  function exportSession(challengeInfo: ChallengeExportInfo): void {
    if (!session) return

    const now = new Date()
    // ISO 8601 with timezone offset (e.g. 2026-03-23T14:30:00+08:00)
    const off = -now.getTimezoneOffset()
    const sign = off >= 0 ? '+' : '-'
    const offH = String(Math.floor(Math.abs(off) / 60)).padStart(2, '0')
    const offM = String(Math.abs(off) % 60).padStart(2, '0')
    const pad2 = (n: number) => String(n).padStart(2, '0')
    const exportedAt = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}` +
      `T${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}${sign}${offH}:${offM}`
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

    const challenge: SessionExportPayload['challenge'] = {
      slug: session.challengeSlug,
      title: session.challengeTitle,
    }
    if (challengeInfo.difficulty !== undefined) challenge.difficulty = challengeInfo.difficulty
    if (challengeInfo.category !== undefined) challenge.category = challengeInfo.category
    if (challengeInfo.backend !== undefined) challenge.backend = challengeInfo.backend
    if (challengeInfo.description !== undefined) challenge.description = challengeInfo.description
    if (challengeInfo.fullDescription !== undefined) challenge.fullDescription = challengeInfo.fullDescription

    const payload: SessionExportPayload = {
      meta: {
        systemPrompt: WRITEUP_SYSTEM_PROMPT,
        timezone,
        exportedAt,
      },
      challenge,
      session: {
        startedAt: session.startedAt,
        solvedAt: session.solvedAt,
        events: session.events,
      },
    }

    const json = JSON.stringify(payload, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const pad = (n: number) => String(n).padStart(2, '0')
    const ts = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
    const filename = `attack-session-${challengeSlug}-${ts}.json`

    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  function getSession(): AttackSession | null {
    return session
  }

  return { init, getSession, addHttpEvent, addTerminalCommand, addCodeExecution, addNoteEvent, updateNoteEvent, addFlagAttempt, exportSession }
}
