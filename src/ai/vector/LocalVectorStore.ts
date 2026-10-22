import { demoDocuments } from '../data/demoDocuments'
import { normalizeQuery } from '../nlp/normalizeQuery'
import type { DemoDatasetId, RetrievedChunk, VectorStore } from '../types'

/**
 * Dependency-free local retrieval mock. Uses weighted token overlap, not neural embeddings.
 * Swap this adapter for MilvusVectorStore once embeddings and a Milvus endpoint are configured.
 */
export class LocalVectorStore implements VectorStore {
  async search(query: string, limit = 3, datasetId?: DemoDatasetId): Promise<RetrievedChunk[]> {
    const { terms } = normalizeQuery(query)
    return demoDocuments.filter(doc => !datasetId || doc.datasetId === datasetId).map(doc => {
      const body = normalizeQuery(doc.text).terms
      const tags = doc.tags.flatMap(tag => normalizeQuery(tag).terms)
      const matches = terms.reduce((sum, term) => sum + (tags.includes(term) ? 2 : 0) + (body.includes(term) ? 1 : 0), 0)
      const score = terms.length ? Math.min(matches / (terms.length * 2), 0.99) : 0
      return { ...doc, score }
    }).filter(item => item.score > 0).sort((a,b) => b.score-a.score).slice(0,limit)
  }
}
