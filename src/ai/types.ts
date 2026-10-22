export type DemoDatasetId = 'portfolio' | 'market' | 'client-guide'
export type DocumentChunk = { id: string; title: string; page: number; text: string; tags: string[]; datasetId?: DemoDatasetId }
export type RetrievedChunk = DocumentChunk & { score: number }
export type TraceStep = { name: string; status: 'passed' | 'info' | 'blocked'; detail: string; durationMs: number }
export type AskRequest = { question: string; portfolioId?: string; datasetId?: DemoDatasetId }
export type AskResponse = {
  answer: string
  citations: Array<{ title: string; page: number; excerpt: string; score: number }>
  trace: TraceStep[]
  cache: { hit: boolean; similarity?: number }
  provider: string
  safety: { passed: boolean; labels: string[] }
}

export interface VectorStore { search(query: string, limit?: number, datasetId?: DemoDatasetId): Promise<RetrievedChunk[]> }
export interface LlmProvider { readonly name: string; answer(question: string, context: RetrievedChunk[]): Promise<string> }
