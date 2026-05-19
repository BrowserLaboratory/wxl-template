import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { UserVfs } from '../../../.vitepress/theme/composables/useUserVfs'

describe('UserVfs', () => {
  let vfs: UserVfs

  beforeEach(async () => {
    // Fresh VFS per test with unique slug
    vfs = new UserVfs(`test-${Date.now()}-${Math.random()}`)
    await vfs.init()
  })

  it('writes and reads a file', async () => {
    await vfs.writeFile('/home/hacker/test.txt', 'hello world')
    const content = await vfs.readFile('/home/hacker/test.txt')
    expect(content).toBe('hello world')
  })

  it('returns null for non-existent file', async () => {
    const content = await vfs.readFile('/home/hacker/nope.txt')
    expect(content).toBeNull()
  })

  it('lists files in a directory', async () => {
    await vfs.writeFile('/home/hacker/a.txt', 'a')
    await vfs.writeFile('/home/hacker/b.txt', 'b')
    const files = await vfs.listDir('/home/hacker/')
    expect(files).toContain('a.txt')
    expect(files).toContain('b.txt')
  })

  it('creates nested directories via mkdir', async () => {
    await vfs.mkdir('/home/hacker/scripts')
    await vfs.writeFile('/home/hacker/scripts/exploit.py', 'print("pwned")')
    const files = await vfs.listDir('/home/hacker/scripts/')
    expect(files).toContain('exploit.py')
  })

  it('deletes a file', async () => {
    await vfs.writeFile('/home/hacker/del.txt', 'delete me')
    await vfs.deleteFile('/home/hacker/del.txt')
    const content = await vfs.readFile('/home/hacker/del.txt')
    expect(content).toBeNull()
  })

  it('checks if a file exists', async () => {
    expect(await vfs.exists('/home/hacker/x.txt')).toBe(false)
    await vfs.writeFile('/home/hacker/x.txt', 'exists')
    expect(await vfs.exists('/home/hacker/x.txt')).toBe(true)
  })

  it('isolates files per slug', async () => {
    const vfs2 = new UserVfs('other-slug')
    await vfs2.init()
    await vfs.writeFile('/home/hacker/secret.txt', 'slug1 only')
    const content = await vfs2.readFile('/home/hacker/secret.txt')
    expect(content).toBeNull()
  })
})
