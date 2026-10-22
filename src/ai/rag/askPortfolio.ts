import { SemanticCache } from '../cache/SemanticCache'
import { normalizeQuery } from '../nlp/normalizeQuery'
import { screenPrompt } from '../safety/screenPrompt'
import type { AskRequest, AskResponse, LlmProvider, VectorStore } from '../types'

export class PortfolioRagService {
  constructor(private readonly vectors: VectorStore, private readonly llm: LlmProvider, private readonly cache = new SemanticCache()) {}
  async ask({ question, datasetId = 'portfolio' }: AskRequest): Promise<AskResponse> {
    const safety = screenPrompt(question)
    if (!safety.passed) return { answer: 'I can’t help with instructions that attempt to override safety rules. Ask about portfolio performance, market research, or risk instead.', citations: [], cache: { hit: false }, provider: this.llm.name, safety, trace: [
      { name: 'Lakera Guard · demo screen', status: 'blocked', detail: 'Prompt injection indicator found by local heuristic', durationMs: 1 },
      { name: 'NeMo Guardrails · demo policy', status: 'info', detail: 'Stopped before retrieval or generation', durationMs: 0 },
      { name: 'Semantic cache', status: 'info', detail: 'Skipped after safety block', durationMs: 0 },
      { name: 'NLP query analysis', status: 'info', detail: 'Skipped after safety block', durationMs: 0 },
      { name: 'Milvus vector search · local mock', status: 'info', detail: 'Skipped after safety block', durationMs: 0 },
      { name: 'Portkey router · simulated', status: 'info', detail: 'Skipped after safety block', durationMs: 0 },
      { name: 'Amazon Bedrock · mock', status: 'info', detail: 'Skipped after safety block', durationMs: 0 },
    ] }
    const cached = this.cache.get(question, datasetId)
    if (cached) return { ...cached.value, cache: { hit: true, similarity: cached.similarity }, trace: [
      { name: 'Lakera Guard · demo screen', status: 'passed', detail: 'Input screen passed', durationMs: 1 },
      { name: 'NeMo Guardrails · demo policy', status: 'passed', detail: 'Allowed informational portfolio query', durationMs: 1 },
      { name: 'Semantic cache', status: 'passed', detail: `Cache hit · similarity ${(cached.similarity * 100).toFixed(0)}%`, durationMs: 1 },
      { name: 'NLP query analysis', status: 'info', detail: 'Reused prior answer; retrieval skipped', durationMs: 0 },
      { name: 'Milvus vector search · local mock', status: 'info', detail: 'Reused prior answer; vector search skipped', durationMs: 0 },
      { name: 'Portkey router · simulated', status: 'info', detail: 'Reused cached response; model call skipped', durationMs: 0 },
      { name: 'Amazon Bedrock · mock', status: 'info', detail: 'Reused cached response; model call skipped', durationMs: 0 },
    ] }
    const nlpStarted = Date.now(); const nlp = normalizeQuery(question)
    const retrievalStarted = Date.now(); const chunks = await this.vectors.search(question, 3, datasetId)
    const answerStarted = Date.now(); const answer = await this.llm.answer(question, chunks)
    const response: AskResponse = {
      answer,
      citations: chunks.map(c => ({ title: c.title, page: c.page, excerpt: c.text, score: c.score })),
      cache: { hit: false }, provider: this.llm.name, safety,
      trace: [
        { name: 'Lakera Guard · demo screen', status: 'passed', detail: 'Input screen passed', durationMs: 1 },
        { name: 'NeMo Guardrails · demo policy', status: 'passed', detail: 'Allowed informational portfolio query', durationMs: 1 },
        { name: 'Semantic cache', status: 'info', detail: 'Cache miss', durationMs: 1 },
        { name: 'NLP query analysis', status: 'passed', detail: `${nlp.intent} intent · ${nlp.terms.length} normalized terms`, durationMs: Math.max(1, retrievalStarted - nlpStarted) },
        { name: 'Milvus vector search · local mock', status: chunks.length ? 'passed' : 'info', detail: `Local index returned ${chunks.length} passages for ${datasetId}`, durationMs: Math.max(1, answerStarted - retrievalStarted) },
        { name: 'Portkey router · simulated', status: 'passed', detail: 'Selected configured mock provider', durationMs: 1 },
        { name: 'Amazon Bedrock · mock', status: 'passed', detail: `${this.llm.name} · ${Date.now() - answerStarted}ms`, durationMs: Math.max(1, Date.now() - answerStarted) },
      ],
    }
    this.cache.set(question, response, datasetId)
    return response
  }
}
