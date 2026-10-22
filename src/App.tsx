import { FormEvent, useEffect, useState } from 'react'
import { Activity, ArrowDown, ArrowUpRight, BookOpen, Boxes, BriefcaseBusiness, Check, ChevronDown, ChevronRight, CircleHelp, Code2, Database, FileText, Layers3, LockKeyhole, MessageSquareText, Network, Plus, Search, Send, ShieldCheck, Sparkles, Zap } from 'lucide-react'
import type { AskResponse, DemoDatasetId, TraceStep } from './ai/types'
import { PortfolioRagService } from './ai/rag/askPortfolio'
import { LocalVectorStore } from './ai/vector/LocalVectorStore'
import { MockBedrockProvider } from './ai/llm/MockBedrockProvider'

const localRag = new PortfolioRagService(new LocalVectorStore(), new MockBedrockProvider())
const datasets: Array<{ id: DemoDatasetId; title: string; detail: string; docs: string; icon: typeof FileText; prompts: string[] }> = [
  { id: 'portfolio', title: 'Northstar portfolio', detail: 'Quarterly review · allocation · attribution', docs: '4 fictional docs', icon: BriefcaseBusiness, prompts: ['How did Northstar perform in Q4?', 'What are the biggest concentration risks?', 'What drove the 12 month return?'] },
  { id: 'market', title: 'Market briefings', detail: 'AI infrastructure · sector monitor', docs: '2 fictional docs', icon: Activity, prompts: ['What is the AI infrastructure outlook?', 'Which sectors led in Q4?', 'What market risks should I monitor?'] },
  { id: 'client-guide', title: 'Investor guide', detail: 'Risk profile · key investing terms', docs: '2 fictional docs', icon: BookOpen, prompts: ['Explain the client risk profile.', 'What does concentration risk mean?', 'How should I interpret a benchmark?'] },
]
const stackGroups = [
  { label: 'PRODUCT UI', items: ['React', 'TypeScript', 'Vite', 'Recharts', 'Lucide'] },
  { label: 'API & GRAPHQL', items: ['Node.js', 'Express', 'Apollo Server', 'Apollo Client', 'GraphQL'] },
  { label: 'AI & RETRIEVAL', items: ['Python', 'FastAPI', 'Pydantic', 'NLP', 'RAG'] },
  { label: 'MODEL & TRUST', items: ['Amazon Bedrock', 'Portkey', 'Lakera Guard', 'NeMo Guardrails'] },
  { label: 'DATA & CACHE', items: ['Milvus adapter', 'Vector indexing', 'Semantic cache', 'Fictional seed corpus'] },
]

const stages = [
  { key: 'Lakera Guard', title: 'Safety screen', icon: ShieldCheck, note: 'Input threat check' },
  { key: 'NeMo Guardrails', title: 'Policy rails', icon: LockKeyhole, note: 'Allowed topic + behavior' },
  { key: 'Semantic cache', title: 'Semantic cache', icon: Zap, note: 'Reuse similar answers' },
  { key: 'NLP query', title: 'NLP analysis', icon: MessageSquareText, note: 'Normalize + infer intent' },
  { key: 'Milvus vector', title: 'Vector search', icon: Database, note: 'Rank relevant passages' },
  { key: 'Portkey router', title: 'Model routing', icon: Network, note: 'Choose model provider' },
  { key: 'Amazon Bedrock', title: 'LLM response', icon: Sparkles, note: 'Grounded generation' },
]

function traceFor(result: AskResponse | null, stageKey: string): TraceStep | undefined {
  return result?.trace.find((step) => step.name.startsWith(stageKey))
}

export default function App() {
  const [datasetId, setDatasetId] = useState<DemoDatasetId>('portfolio')
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<AskResponse | null>(null)
  const [asked, setAsked] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeStage, setActiveStage] = useState(-1)
  const [apiOnline, setApiOnline] = useState(false)
  const [activeNav, setActiveNav] = useState('Overview')
  const [sourcesOpen, setSourcesOpen] = useState(true)
  const [notice, setNotice] = useState('')

  useEffect(() => { fetch('http://localhost:8787/api/health').then(r => { if (r.ok) setApiOnline(true) }).catch(() => setApiOnline(false)) }, [])
  const selectedDataset = datasets.find(d => d.id === datasetId)!

  function goTo(id: string, label: string) {
    setActiveNav(label)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  async function ask(text = query) {
    if (!text.trim() || loading) return
    setQuery(text); setAsked(text); setLoading(true); setResult(null); setActiveStage(0)
    const pulse = window.setInterval(() => setActiveStage(stage => (stage + 1) % stages.length), 520)
    try {
      let next: AskResponse
      if (apiOnline) {
        const response = await fetch('http://localhost:8787/api/ai/ask', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ question: text, portfolioId: 'northstar-growth', datasetId }) })
        if (!response.ok) throw new Error('The local API did not respond')
        next = await response.json() as AskResponse
      } else {
        next = await localRag.ask({ question: text, portfolioId: 'northstar-growth', datasetId })
      }
      setResult(next)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not complete the demo query')
      const fallback = await localRag.ask({ question: text, datasetId })
      setResult(fallback)
    } finally { window.clearInterval(pulse); setLoading(false); setActiveStage(-1) }
  }

  function onSubmit(event: FormEvent) { event.preventDefault(); void ask() }
  const statusText = apiOnline ? 'Node API connected' : 'Browser RAG ready'

  return <div className="portfolio-shell">
    <aside className="portfolio-sidebar">
      <button className="kb-brand" onClick={() => goTo('overview', 'Overview')}><span className="kb-monogram">KB<span>✳</span></span><span>kingsly<span className="brand-period">.</span></span></button>
      <div className="side-caption">PORTFOLIO</div>
      <nav className="portfolio-nav">
        <button className={activeNav === 'Overview' ? 'selected' : ''} onClick={() => goTo('overview', 'Overview')}><Layers3 size={16}/>Overview</button>
        <button className={activeNav === 'AI Workbench' ? 'selected' : ''} onClick={() => goTo('workbench', 'AI Workbench')}><Sparkles size={16}/>AI Workbench<span className="new-tag">LIVE</span></button>
        <button className={activeNav === 'Architecture' ? 'selected' : ''} onClick={() => goTo('architecture', 'Architecture')}><Network size={16}/>Architecture</button>
        <button className={activeNav === 'Projects' ? 'selected' : ''} onClick={() => goTo('datasets', 'Projects')}><Boxes size={16}/>Demo datasets<span className="nav-count">3</span></button>
      </nav>
      <div className="sidebar-bottom"><div className="story-card"><span className="story-spark">✳</span><strong>Built to tell a story.</strong><p>A working showcase of the systems, ideas, and details between.</p><button onClick={() => goTo('architecture', 'Architecture')}>Explore the stack <ArrowUpRight size={13}/></button></div><div className="sidebar-profile"><span className="profile-mini">KB</span><span><strong>Kingsly Bose</strong><small>Certified Full-Stack Engineer</small></span><ChevronDown size={14}/></div></div>
    </aside>

    <main className="portfolio-main">
      <header className="portfolio-topbar"><div className="crumb"><span>Portfolio</span><ChevronRight size={13}/><strong>{activeNav}</strong></div><div className="topbar-right"><span className={`service-pill ${apiOnline ? 'connected' : ''}`}><i/>{statusText}</span><button className="top-search" onClick={() => goTo('workbench', 'AI Workbench')}><Search size={14}/> Try the AI demo <kbd>↵</kbd></button><span className="top-profile">KB</span></div></header>

      <div className="portfolio-content">
        <section className="intro-section" id="overview">
          <div className="intro-copy"><div className="overline"><span/> FULL-STACK ENGINEER · AI PORTFOLIO DEMO</div><h1>Hi, I’m <em>Kingsly Bose.</em></h1><p>Building connected, data-driven applications — from a thoughtful UI to grounded AI answers.</p><div className="intro-actions"><button className="primary-link" onClick={() => goTo('workbench', 'AI Workbench')}>Try the AI workbench <ArrowUpRight size={15}/></button><span className="fictional-note"><LockKeyhole size={12}/> Fictional demo data</span></div></div>
          <div className="hero-feature"><div className="hero-orbit orbit-one"/><div className="hero-orbit orbit-two"/><div className="hero-kb">KB<span>✳</span></div><div className="hero-label-top">FEATURED END-TO-END DEMO</div><div className="hero-label-side">AI<br/>STACK <b>07</b></div><div className="hero-label-bottom">KINGSly BOSE · FULL STACK</div><div className="hero-cross">✳</div></div>
        </section>

        <section className="stack-overview" id="architecture">
          <div className="section-heading"><div><div className="section-kicker"><span/> THE FULL-STACK SHOWCASE</div><h2>One project. Seven layers. One connected experience.</h2><p>A question moves through each layer, retrieves fictional evidence, then returns a cited response.</p></div><div className="flow-status"><span/> END-TO-END FLOW</div></div>
          <div className="stack-chip-row">{['React + TypeScript','Apollo Client','Node.js + GraphQL','Python + FastAPI','Milvus vector search','Amazon Bedrock','Portkey · Lakera · NeMo'].map((item,i)=><span className={`stack-chip chip-${i}`} key={item}>{item}</span>)}</div>
          <div className="architecture-map">
            <div className="architecture-node frontend-node"><span className="node-num">01</span><span className="node-symbol">UI</span><div><strong>React + TypeScript</strong><small>Chat UI · presets · trace view</small></div><span className="node-tech">CLIENT</span></div>
            <div className="map-arrow"><span>GraphQL / REST</span><ArrowDown size={14}/></div>
            <div className="architecture-node api-node"><span className="node-num">02</span><span className="node-symbol">API</span><div><strong>Node.js + Apollo</strong><small>GraphQL portfolio · RAG endpoint</small></div><span className="node-tech">GATEWAY</span></div>
            <div className="branch-row"><span className="branch-left">Portfolio data · GraphQL</span><span className="branch-right">AI question · REST</span></div>
            <div className="service-row"><div className="architecture-node service-node"><span className="node-num">03A</span><span className="node-symbol">DB</span><div><strong>Apollo Client</strong><small>Typed portfolio queries</small></div><span className="node-tech">CLIENT CACHE</span></div><div className="architecture-node service-node"><span className="node-num">03B</span><span className="node-symbol">PY</span><div><strong>Python · FastAPI</strong><small>Alternative RAG service · Pydantic</small></div><span className="node-tech">AI SERVICE</span></div></div>
            <div className="map-arrow"><span>Context · retrieval · model</span><ArrowDown size={14}/></div>
            <div className="architecture-node data-node"><span className="node-num">04</span><span className="node-symbol"><Database size={14}/></span><div><strong>RAG + vector index</strong><small>Seeded docs · local vector mock · Milvus adapter</small></div><span className="node-tech">RETRIEVAL</span></div>
            <div className="map-arrow"><span>Grounded prompt · routed model call</span><ArrowDown size={14}/></div>
            <div className="architecture-node model-node"><span className="node-num">05</span><span className="node-symbol"><Sparkles size={14}/></span><div><strong>Bedrock · Portkey · Guardrails</strong><small>Mock Bedrock active · Portkey/Lakera/NeMo simulated</small></div><span className="node-tech">LLM</span></div>
            <div className="response-bar"><Code2 size={14}/><span>07 · GROUNDED ANSWER</span><strong>Citations + pipeline trace + cache status</strong><span className="back-link">↖ BACK TO WORKBENCH</span></div>
          </div>
          <div className="stack-detail-grid">{stackGroups.map(group=><div className="stack-detail" key={group.label}><small>{group.label}</small><div>{group.items.map(item=><span key={item}>{item}</span>)}</div></div>)}</div>
          <p className="integration-note"><i/> Demo mode is honest about the boundary: local token ranking and mock Bedrock are active; Milvus, live Bedrock, Portkey, Lakera, and NeMo are integration adapters or simulated checks.</p>
        </section>

        <section className="workbench-section" id="workbench">
          <div className="section-heading workbench-heading"><div><div className="section-kicker"><span/> SENTINEL AI · INTERACTIVE DEMO</div><h2>Ask a question. Follow every layer.</h2><p>Choose a fictional dataset, ask in your own words, and inspect how the answer is assembled.</p></div><div className="runtime-badge"><i/>{statusText}</div></div>
          <div className="workbench-grid">
            <aside className="dataset-panel" id="datasets"><div className="panel-overline">KNOWLEDGE BASE <span>{datasets.length} DATASETS</span></div><h3>Choose your context</h3><p className="dataset-hint">Answers are grounded in the selected fictional documents.</p><div className="dataset-list">{datasets.map(ds=>{const Icon=ds.icon;return <button className={`dataset-option ${datasetId===ds.id?'dataset-active':''}`} key={ds.id} onClick={()=>{setDatasetId(ds.id);setResult(null);setAsked('')}}><span className="dataset-icon"><Icon size={15}/></span><span className="dataset-copy"><strong>{ds.title}</strong><small>{ds.detail}</small><em>{ds.docs}</em></span>{datasetId===ds.id&&<Check size={15} className="dataset-check"/>}</button>})}</div><div className="preset-block"><div className="preset-head">TRY A PRESET <ChevronDown size={13}/></div>{selectedDataset.prompts.map(prompt=><button className="preset-question" key={prompt} onClick={()=>void ask(prompt)} disabled={loading}>{prompt}<ChevronRight size={13}/></button>)}</div><div className="dataset-disclaimer"><LockKeyhole size={13}/><span>All content is fictional.<br/>No personal data or live accounts.</span></div></aside>

            <div className="chat-panel"><div className="chat-top"><div className="chat-title-icon"><Sparkles size={16}/></div><div><strong>Ask Sentinel</strong><small>Grounded portfolio intelligence</small></div><span className="model-badge"><i/>{apiOnline?'Node API':'Local AI'}</span><button className="new-chat" onClick={()=>{setAsked('');setResult(null);setQuery('')}}><Plus size={14}/> New chat</button></div>
              <div className="chat-transcript">
                {!asked&&!loading?<div className="welcome-prompt"><div className="welcome-star">✳</div><h3>Your sources are ready.</h3><p>Ask a question or pick a preset. I’ll find supporting passages and show the path from your prompt to the answer.</p><div className="welcome-tech"><span><Database size={12}/> {selectedDataset.docs}</span><span><Activity size={12}/> 7 AI layers</span></div></div>:<><div className="user-bubble"><span className="user-avatar">KB</span><div><small>Kingsly · {selectedDataset.title}</small><p>{asked}</p></div></div>{loading?<div className="assistant-loading"><div className="assistant-avatar"><Sparkles size={14}/></div><div><strong>Following the request through the stack…</strong><span><i/><i/><i/></span></div></div>:result&&<div className="assistant-message"><div className="assistant-avatar"><Sparkles size={14}/></div><div className="message-content"><div className="message-meta"><strong>Sentinel</strong><span>{result.provider}</span></div><p className="answer-copy">{result.answer.split(/(\*\*.*?\*\*)/g).map((part,index)=>part.startsWith('**')?<strong key={index}>{part.slice(2,-2)}</strong>:part)}</p><div className="answer-flags"><span className={result.safety.passed?'flag-ok':'flag-blocked'}><ShieldCheck size={12}/>{result.safety.passed?'Safety passed':'Safety blocked'}</span><span><Database size={12}/>{result.citations.length} retrieved sources</span><span className={result.cache.hit?'cache-hit':''}><Zap size={12}/>{result.cache.hit?'Semantic cache hit':'Cache miss'}</span></div>{result.citations.length>0&&<div className="citations"><button className="citations-toggle" onClick={()=>setSourcesOpen(!sourcesOpen)}><FileText size={13}/> Sources used <span>{result.citations.length}</span><ChevronDown size={13} className={sourcesOpen?'':'closed'}/></button>{sourcesOpen&&result.citations.map(c=><div className="source-card" key={`${c.title}-${c.page}`}><div><strong>{c.title}</strong><span>Page {c.page} · match {(c.score*100).toFixed(0)}%</span></div><p>{c.excerpt}</p></div>)}</div>}</div></div>}</>}
              </div>
              <form className="chat-composer" onSubmit={onSubmit}><textarea value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();void ask()}}} placeholder={`Ask about ${selectedDataset.title.toLowerCase()}…`} rows={2}/><div className="composer-footer"><span><kbd>↵</kbd> to send <kbd>⇧ ↵</kbd> new line</span><button type="submit" disabled={!query.trim()||loading}><span>{loading?'Thinking':'Ask Sentinel'}</span><Send size={14}/></button></div></form>
              <div className="chat-footnote"><LockKeyhole size={11}/> Private demo · Educational only · AI can make mistakes</div>
            </div>

            <aside className="trace-panel"><div className="trace-head"><div><div className="panel-overline">REQUEST INSPECTOR</div><h3>AI pipeline</h3></div><span className="trace-layer-count">07 LAYERS</span></div><div className="trace-subhead">{loading?'PROCESSING REQUEST':result?'COMPLETED REQUEST':'READY FOR A QUESTION'}</div><div className="layer-list">{stages.map((stage,index)=>{const Icon=stage.icon;const trace=traceFor(result,stage.key);const isActive=loading&&activeStage===index;const status=trace?.status==='passed'?'done':trace?.status==='blocked'?'blocked':trace?.status==='info'?'skipped':isActive?'active':'idle';return <div className={`layer-row layer-${status}`} key={stage.key}><span className="layer-index">{String(index+1).padStart(2,'0')}</span><span className="layer-icon"><Icon size={14}/></span><span className="layer-label"><strong>{stage.title}</strong><small>{trace?.detail??stage.note}</small></span><span className="layer-status">{isActive?<span className="loading-ring"/>:status==='done'?<Check size={13}/>:status==='blocked'?'BLOCKED':status==='skipped'?'SKIPPED':status==='idle'?'WAITING':'—'}</span></div>})}</div><div className="trace-summary"><div className="trace-summary-top"><span><Activity size={13}/> EXECUTION TRACE</span>{result&&<span>{result.trace.reduce((n,s)=>n+s.durationMs,0)} ms</span>}</div>{result?<div className="trace-events">{result.trace.map((step,i)=><div key={`${step.name}-${i}`}><i className={step.status==='blocked'?'event-blocked':''}/><span>{step.name}</span><small>{step.durationMs}ms</small></div>)}</div>:<p>Run a prompt to see each stage light up, with retrieval matches and provider decisions.</p>}</div><div className="trace-runtime"><span><i/> {apiOnline?'Node + TypeScript API':'Browser RAG runtime'}</span><span>MOCK PROVIDERS</span></div></aside>
          </div>
        </section>

        <footer className="portfolio-footer"><span>© 2026 Kingsly Bose · Full-Stack Engineer</span><span>Built with curiosity, grounded in evidence.</span><button onClick={()=>setNotice('This is a fictional portfolio showcase.')}><CircleHelp size={13}/> About this demo</button></footer>
      </div>
    </main>
    {notice&&<div className="notice-toast"><span>{notice}</span><button onClick={()=>setNotice('')}>×</button></div>}
  </div>
}
