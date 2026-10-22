import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { PortfolioRagService } from '../src/ai/rag/askPortfolio'
import { LocalVectorStore } from '../src/ai/vector/LocalVectorStore'
import { MockBedrockProvider } from '../src/ai/llm/MockBedrockProvider'
import type { AskRequest } from '../src/ai/types'
import { mountGraphql } from './graphql'

const app = express(); app.use(cors({ origin: process.env.WEB_ORIGIN ?? 'http://localhost:5173' })); app.use(express.json({ limit: '32kb' }))
const rag = new PortfolioRagService(new LocalVectorStore(), new MockBedrockProvider())
app.get('/api/health', (_req, res) => res.json({ ok: true, mode: 'mock', vectorStore: 'local-token-overlap', provider: 'mock-bedrock' }))
app.post('/api/ai/ask', async (req, res) => {
  const body = req.body as Partial<AskRequest>
  if (typeof body.question !== 'string' || body.question.trim().length < 2 || body.question.length > 1000) return res.status(400).json({ error: 'question must be 2–1000 characters' })
  try { res.json(await rag.ask({ question: body.question, portfolioId: body.portfolioId, datasetId: body.datasetId })) }
  catch (error) { console.error('RAG request failed', error); res.status(500).json({ error: 'Unable to answer this question right now' }) }
})
const port = Number(process.env.API_PORT ?? 8787)
await mountGraphql(app)
app.listen(port, () => console.log(`Sentinel demo API listening at http://localhost:${port}`))
