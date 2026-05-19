import { createContentLoader } from 'vitepress'

export interface ChallengeData {
  id?: number | string
  title: string
  url: string
  difficulty?: 'easy' | 'medium' | 'hard' | 'mystery'
  category?: string
  date?: string | null
  tags?: string[]
  description?: string
}

export default createContentLoader('challenge/*/index.md', {
  excerpt: true,
  transform(raw): ChallengeData[] {
    return raw
      .map((page, idx) => ({
        id: page.frontmatter.id ?? idx+1,
        title: page.frontmatter.title ?? '網站攻防挑戰',
        url: page.url,
        difficulty: page.frontmatter.difficulty ?? "mystery",
        category: page.frontmatter.category ?? "綜合",
        date: page.frontmatter.date ?? null,
        tags: Array.isArray(page.frontmatter.tags) ? page.frontmatter.tags : [],
        description: page.frontmatter.description ?? '',
      }))
  },
})

declare const data: ChallengeData[]
export { data }
