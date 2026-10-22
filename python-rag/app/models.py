from pydantic import BaseModel, Field


class AskRequest(BaseModel):
    question: str = Field(min_length=2, max_length=1000)
    portfolio_id: str = "northstar-growth"


class Citation(BaseModel):
    title: str
    page: int
    excerpt: str
    score: float


class AskResponse(BaseModel):
    answer: str
    citations: list[Citation]
    provider: str = "python-mock-bedrock"
    safety_passed: bool = True
