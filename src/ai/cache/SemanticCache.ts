import { normalizeQuery } from '../nlp/normalizeQuery'
import type { AskResponse } from '../types'

type Entry = { terms: Set<string>; value: AskResponse; savedAt: number }
/** In-memory semantic-like cache for the demo. It compares normalized token overlap (not embeddings). */
export class SemanticCache {
  private entries: Entry[] = []
  constructor(private readonly threshold = 0.72, private readonly ttlMs = 5 * 60_000, private readonly maxEntries = 50) {}
  get(query: string, namespace = ''): { value: AskResponse; similarity: number } | undefined {
    const now = Date.now(); this.entries = this.entries.filter(e => now - e.savedAt < this.ttlMs)
    const terms = new Set([...normalizeQuery(query).terms, `dataset:${namespace}`])
    let best: { entry: Entry; score: number } | undefined
    for (const entry of this.entries) {
      const union = new Set([...terms, ...entry.terms]).size
      const score = union ? [...terms].filter(t => entry.terms.has(t)).length / union : 0
      if (score >= this.threshold && (!best || score > best.score)) best = { entry, score }
    }
    return best ? { value: best.entry.value, similarity: best.score } : undefined
  }
  set(query: string, value: AskResponse, namespace = '') {
    this.entries.unshift({ terms: new Set([...normalizeQuery(query).terms, `dataset:${namespace}`]), value, savedAt: Date.now() })
    this.entries = this.entries.slice(0, this.maxEntries)
  }
  get size() { return this.entries.length }
}
