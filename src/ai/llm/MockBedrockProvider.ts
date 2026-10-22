import type { LlmProvider, RetrievedChunk } from '../types'

/** Deterministic fake provider. It simulates a Bedrock response without network access or credentials. */
export class MockBedrockProvider implements LlmProvider {
  readonly name = 'Bedrock mock · Claude-style response'
  async answer(question: string, context: RetrievedChunk[]): Promise<string> {
    const corpus = context.map(c => c.text).join(' ')
    const q = question.toLowerCase()
    if (!context.length) return 'I couldn’t find a supporting passage in the demo knowledge base. Try asking about Northstar Growth performance, Q4 returns, or portfolio concentration risk.'
    if (context[0].datasetId === 'market') return `The fictional market brief says ${context[0].text}`
    if (context[0].datasetId === 'client-guide' && /risk|profile|client/.test(q)) return 'The fictional client profile describes **moderate risk tolerance** and a long-term horizon. Review allocation decisions against liquidity needs and the approved investment policy. ' + context[0].text
    if (/risk|concentrat|exposure|allocation/.test(q)) return 'The demo portfolio has a **moderate growth tilt**. ' + (corpus.includes('46.2%') ? 'Technology represents 46.2% of holdings, around 8 percentage points above the benchmark, and NVIDIA is the largest position at 18.4%. ' : '') + 'Review these exposures against the stated risk profile before making decisions.'
    if (/quarter|q4|northstar|underperform/.test(q)) return 'Northstar Growth gained **6.3% in Q4 2025**, compared with 3.1% for its benchmark. AI infrastructure names led returns, while consumer discretionary positions lagged.'
    if (/performance|return|year|contribut/.test(q)) return 'The Northstar Growth portfolio returned **21.4%** over the past 12 months, ahead of its benchmark at **11.2%**. NVIDIA and Microsoft were the largest contributors. The largest headwind was an underweight in energy during Q2.'
    return `I found ${context.length} relevant passage${context.length === 1 ? '' : 's'} in the fictional portfolio research. ${context[0].text}`
  }
}
