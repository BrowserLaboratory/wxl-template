export type BackendType = 'flask' | 'fastapi' | 'php'

export const LEGACY_FIELDS = ['fs_key', 'fsKeyParts', 'encryptedFs', 'flag_verifier'] as const
export const VALID_TOOLS = ['browser', 'network', 'repeater', 'terminal', 'code'] as const
export const VALID_COMMANDS = ['dirb', 'dirsearch', 'sqlmap', 'jwt', 'hydra', 'nmap'] as const

export interface ChallengeConfig {
  title: string
  backend: BackendType
  app: string
  /** @deprecated Use src/ auto-scan instead. Kept for backward compatibility during migration. */
  fs?: Record<string, string>
  source_visible: boolean
  packages: string[]
  wasmModule?: string
  /** Relative path to flag file under src/. Defaults to "flag.txt". */
  flag?: string
  /** Array of valid tab IDs to enable for this challenge. */
  tools?: (typeof VALID_TOOLS)[number][]
  /** Tier 5 command allowlist. Use 'all' to allow every command. */
  commands?: string[] | 'all'
  // optional metadata
  difficulty?: string
  category?: string
  description?: string
  date?: string
  tags?: string[]
}

const REQUIRED: (keyof ChallengeConfig)[] = ['title', 'backend', 'app']
const VALID_BACKENDS: BackendType[] = ['flask', 'fastapi', 'php']

export function validateChallengeConfig(raw: unknown): ChallengeConfig {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('challenge config must be an object')
  }
  const obj = raw as Record<string, unknown>

  for (const field of REQUIRED) {
    if (obj[field] === undefined || obj[field] === null) {
      throw new Error(`missing required field: ${field}`)
    }
  }

  if (!VALID_BACKENDS.includes(obj.backend as BackendType)) {
    throw new Error(`backend must be one of ${VALID_BACKENDS.join(', ')}, got: ${obj.backend}`)
  }

  // Deprecated field warning
  if (obj.fs !== undefined) {
    console.warn("deprecated field 'fs' — use src/ auto-scan instead")
  }

  // Validate flag
  if (obj.flag !== undefined && typeof obj.flag !== 'string') {
    throw new Error(`flag must be a string, got: ${typeof obj.flag}`)
  }

  // Validate tools
  if (obj.tools !== undefined) {
    if (!Array.isArray(obj.tools)) {
      throw new Error('tools must be an array of valid tab IDs')
    }
    for (const tool of obj.tools as string[]) {
      if (!(VALID_TOOLS as readonly string[]).includes(tool)) {
        throw new Error(`invalid tools entry: ${tool}. Must be one of ${VALID_TOOLS.join(', ')}`)
      }
    }
  }

  // Validate commands
  if (obj.commands !== undefined) {
    if (obj.commands !== 'all') {
      if (!Array.isArray(obj.commands)) {
        throw new Error("commands must be 'all' or an array of valid command names")
      }
      for (const cmd of obj.commands as string[]) {
        if (!(VALID_COMMANDS as readonly string[]).includes(cmd)) {
          throw new Error(`invalid command: ${cmd}. Must be one of ${VALID_COMMANDS.join(', ')}`)
        }
      }
    }
  }

  return {
    title: obj.title as string,
    backend: obj.backend as BackendType,
    app: obj.app as string,
    fs: obj.fs as Record<string, string> | undefined,
    source_visible: (obj.source_visible as boolean) ?? false,
    packages: (Array.isArray(obj.packages) ? obj.packages : []) as string[],
    wasmModule: obj.wasmModule as string | undefined,
    flag: (obj.flag as string) ?? undefined,
    tools: obj.tools as (typeof VALID_TOOLS)[number][] | undefined,
    commands: obj.commands as string[] | 'all' | undefined,
    difficulty: obj.difficulty as string | undefined,
    category: obj.category as string | undefined,
    description: obj.description as string | undefined,
    date: obj.date as string | undefined,
    tags: (Array.isArray(obj.tags) ? obj.tags : undefined) as string[] | undefined,
  }
}
