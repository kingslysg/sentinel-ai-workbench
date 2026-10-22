import re
from .documents import DOCUMENTS

STOP = {"a", "an", "and", "are", "did", "for", "how", "i", "in", "is", "my", "of", "the", "to", "what", "with", "your"}


def tokenize(text: str) -> set[str]:
    tokens = set(re.findall(r"[a-z0-9]+", text.lower())) - STOP
    if "returns" in tokens or "return" in tokens or "gained" in tokens:
        tokens.add("performance")
    if "concentration" in tokens or "exposure" in tokens:
        tokens.add("risk")
    if "q4" in tokens:
        tokens.add("quarter")
    return tokens


class MockVectorStore:
    """Zero-setup lexical retrieval mock, intentionally not described as embedding search."""

    async def search(self, query: str, limit: int = 3) -> list[dict]:
        terms = tokenize(query)
        ranked = []
        for doc in DOCUMENTS:
            body = tokenize(doc["text"])
            tags = tokenize(" ".join(doc["tags"]))
            score = sum((2 if term in tags else 0) + (1 if term in body else 0) for term in terms)
            score = min(score / max(1, len(terms) * 2), 0.99)
            if score > 0:
                ranked.append({**doc, "score": score})
        return sorted(ranked, key=lambda item: item["score"], reverse=True)[:limit]
