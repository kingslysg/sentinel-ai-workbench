import type { RetrievedChunk, VectorStore } from '../types'

/** Milvus adapter contract. Point this at a trusted server-side Milvus service; never expose credentials in Vite. */
export class MilvusVectorStore implements VectorStore {
  constructor(
    private readonly endpoint: string,
    private readonly collection: string,
    private readonly embedQuery: (query: string) => Promise<number[]>,
    private readonly apiKey?: string,
    private readonly vectorField = 'embedding',
  ) {}
  async search(query: string, limit = 3): Promise<RetrievedChunk[]> {
    const vector = await this.embedQuery(query)
    const response = await fetch(`${this.endpoint.replace(/\/$/, '')}/v2/vectordb/entities/search`, {
      method: 'POST', headers: { 'content-type': 'application/json', ...(this.apiKey ? { authorization: `Bearer ${this.apiKey}` } : {}) },
      body: JSON.stringify({ collectionName: this.collection, data: [vector], annsField: this.vectorField, limit, outputFields: ['title','page','text','tags'] }),
    })
    if (!response.ok) throw new Error(`Milvus search failed (${response.status})`)
    const payload = await response.json() as { data?: Array<Record<string, unknown> & { entity?: Record<string, unknown> }> }
    return (payload.data ?? []).map(row => {
      const entity = row.entity ?? row
      return { id: String(row.id ?? entity.id), title: String(entity.title), page: Number(entity.page), text: String(entity.text), tags: Array.isArray(entity.tags) ? entity.tags.map(String) : [], score: Number(row.distance ?? row.score ?? 0) }
    })
  }
}
