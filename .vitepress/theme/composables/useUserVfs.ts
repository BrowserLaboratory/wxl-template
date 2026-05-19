import { openDB, type IDBPDatabase } from 'idb'

interface UserVfsDB {
  files: {
    key: string
    value: { path: string; content: string; isDir: boolean }
  }
}

/**
 * User-writable virtual filesystem backed by IndexedDB.
 * Each challenge slug gets its own isolated database.
 */
export class UserVfs {
  private db: IDBPDatabase<UserVfsDB> | null = null
  private readonly slug: string

  constructor(slug: string) {
    this.slug = slug
  }

  async init(): Promise<void> {
    this.db = await openDB<UserVfsDB>(`wxl-vfs-${this.slug}`, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('files')) {
          db.createObjectStore('files', { keyPath: 'path' })
        }
      },
    })
    // Ensure home directory exists
    await this.mkdir('/home/hacker')
  }

  async writeFile(path: string, content: string): Promise<void> {
    if (!this.db) throw new Error('VFS not initialized')
    await this.db.put('files', { path, content, isDir: false })
  }

  async readFile(path: string): Promise<string | null> {
    if (!this.db) throw new Error('VFS not initialized')
    const entry = await this.db.get('files', path)
    if (!entry || entry.isDir) return null
    return entry.content
  }

  async deleteFile(path: string): Promise<void> {
    if (!this.db) throw new Error('VFS not initialized')
    await this.db.delete('files', path)
  }

  async exists(path: string): Promise<boolean> {
    if (!this.db) throw new Error('VFS not initialized')
    const entry = await this.db.get('files', path)
    return entry !== undefined
  }

  async mkdir(path: string): Promise<void> {
    if (!this.db) throw new Error('VFS not initialized')
    const normalized = path.endsWith('/') ? path.slice(0, -1) : path
    if (await this.exists(normalized)) return
    await this.db.put('files', { path: normalized, content: '', isDir: true })
  }

  async listDir(dirPath: string): Promise<string[]> {
    if (!this.db) throw new Error('VFS not initialized')
    const normalized = dirPath.endsWith('/') ? dirPath.slice(0, -1) : dirPath
    const all = await this.db.getAll('files')
    const entries: string[] = []
    const prefix = normalized + '/'
    for (const entry of all) {
      if (entry.path.startsWith(prefix)) {
        const rest = entry.path.slice(prefix.length)
        // Only direct children (no further slashes)
        if (!rest.includes('/')) {
          entries.push(rest + (entry.isDir ? '/' : ''))
        }
      }
    }
    return entries.sort()
  }

  /** Get the current working directory (default: /home/hacker) */
  getHomePath(): string {
    return '/home/hacker'
  }
}
