from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from pydantic import BaseModel
from anthropic import AsyncAnthropic
from typing import Optional

from app.core.config import settings
from app.db.database import get_db
from app.rag.retriever import retrieve_products
from app.rag.prompts import ASSISTANT_SYSTEM_PROMPT

router = APIRouter(prefix="/assistant", tags=["assistant"])

RETRIEVAL_TRIGGERS = [
    "recommend", "suggest", "pair", "compare", "alternative",
    "similar", "goes with", "loadout", "kit", "bundle",
    "other", "what else", "instead",
]


def needs_retrieval(message: str) -> bool:
    message_lower = message.lower()
    return any(trigger in message_lower for trigger in RETRIEVAL_TRIGGERS)


class Message(BaseModel):
    role: str
    content: str


class AssistantRequest(BaseModel):
    message: str
    history: list[Message] = []
    current_product_id: Optional[str] = None


@router.post("")
async def assistant(request: AssistantRequest, db: AsyncSession = Depends(get_db)):
    if not settings.anthropic_api_key:
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY is not configured")

    # Build current product context
    current_product_context = ""
    if request.current_product_id:
        result = await db.execute(
            text("SELECT * FROM products WHERE id = :id"),
            {"id": request.current_product_id},
        )
        row = result.mappings().first()
        if row:
            p = dict(row)
            attrs = ""
            if p.get("attributes"):
                attr_items = [f"{k.replace('_', ' ')}: {v}" for k, v in p["attributes"].items()]
                attrs = "\nSpecifications: " + ", ".join(attr_items) + "."
            tags = ""
            if p.get("tags"):
                tags = "\nTags: " + ", ".join(p["tags"]) + "."
            current_product_context = (
                f"\nCurrently viewing product:\n"
                f"Name: {p['name']}\n"
                f"Brand: {p['brand']}\n"
                f"Price: ${float(p['price']):.2f}\n"
                f"Category: {p['category']}\n"
                f"Description: {p['description']}"
                f"{attrs}"
                f"{tags}\n"
            )

    # Retrieve related products if message suggests cross-product intent
    retrieved_products_context = ""
    if needs_retrieval(request.message):
        retrieved = retrieve_products(request.message, top_k=5)
        product_ids = [r["product_id"] for r in retrieved if r["product_id"]]
        if product_ids:
            placeholders = ", ".join([f":id{i}" for i in range(len(product_ids))])
            result = await db.execute(
                text(f"SELECT * FROM products WHERE id IN ({placeholders})"),
                {f"id{i}": pid for i, pid in enumerate(product_ids)},
            )
            rows = result.mappings().all()
            lines = [
                f"- {p['name']} by {p['brand']}, ${float(p['price']):.2f} — {p['description'][:200]}"
                for p in [dict(r) for r in rows]
            ]
            retrieved_products_context = "\nRelated products from our catalog:\n" + "\n".join(lines) + "\n"

    system_prompt = ASSISTANT_SYSTEM_PROMPT.format(
        current_product_context=current_product_context,
        retrieved_products_context=retrieved_products_context,
    )

    messages = [{"role": msg.role, "content": msg.content} for msg in request.history]
    messages.append({"role": "user", "content": request.message})

    client = AsyncAnthropic(api_key=settings.anthropic_api_key)
    try:
        response = await client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1024,
            system=system_prompt,
            messages=messages,
        )
        return {"response": response.content[0].text}
    except Exception:
        raise HTTPException(status_code=503, detail="AI assistant is temporarily unavailable. Please try again.")
