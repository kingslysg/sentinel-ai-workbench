from fastapi import FastAPI
from .models import AskRequest, AskResponse, Citation
from .retrieval import MockVectorStore

app = FastAPI(title="Sentinel RAG Demo", version="0.1.0")
store = MockVectorStore()


@app.get("/health")
async def health():
    return {"ok": True, "provider": "mock", "retrieval": "local-token-overlap"}


@app.post("/ask", response_model=AskResponse)
async def ask(request: AskRequest):
    passages = await store.search(request.question)
    joined = " ".join(p["text"] for p in passages)
    q = request.question.lower()
    if any(word in q for word in ("risk", "concentrat", "exposure")):
        answer = "The demo portfolio has a moderate growth tilt. Technology represents 46.2% of holdings, around 8 percentage points above benchmark, and NVIDIA is the largest position at 18.4%. Review against the stated risk profile."
    elif any(word in q for word in ("q4", "quarter", "northstar", "underperform")):
        answer = "Northstar Growth gained 6.3% in Q4 2025, compared with 3.1% for its benchmark. AI infrastructure names led returns, while consumer discretionary positions lagged."
    elif "21.4%" in joined or any(word in q for word in ("performance", "return", "year")):
        answer = "The Northstar Growth portfolio returned 21.4% over the past 12 months, ahead of its benchmark at 11.2%. NVIDIA and Microsoft were the largest contributors."
    else:
        answer = "I could not find a supporting passage in the fictional demo knowledge base. Try asking about performance, Q4 returns, or concentration risk."
    return AskResponse(answer=answer, citations=[Citation(title=p["title"], page=p["page"], excerpt=p["text"], score=p["score"]) for p in passages])
