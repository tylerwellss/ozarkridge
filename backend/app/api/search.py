from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from pydantic import BaseModel
from anthropic import AsyncAnthropic
import json

from app.core.config import settings
from app.db.database import get_db
from app.rag.retriever import retrieve_products
from app.rag.prompts import AI_SEARCH_SYSTEM_PROMPT

router = APIRouter(prefix="/search", tags=["search"])

class AISearchRequest(BaseModel):
    query: str


@router.get("/keyword")
async def keyword_search(
    q: str,
    page: int = 1,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
):
    """Keyword/FTS search endpoint used by the React app."""
    query = q.strip()
    page = max(page, 1)
    limit = min(max(limit, 1), 20)
    offset = (page - 1) * limit

    if len(query) < 3:
        result = await db.execute(
            text(
                """
                SELECT *
                FROM products
                WHERE
                    name ILIKE :pattern
                    OR brand ILIKE :pattern
                    OR description ILIKE :pattern
                ORDER BY name
                LIMIT :limit OFFSET :offset
                """
            ),
            {
                "pattern": f"%{query}%",
                "limit": limit,
                "offset": offset,
            },
        )
    else:
        result = await db.execute(
            text(
                """
                SELECT *,
                       ts_rank(search_vector, plainto_tsquery('english', :q)) AS rank
                FROM products
                WHERE search_vector @@ plainto_tsquery('english', :q)
                ORDER BY rank DESC
                LIMIT :limit OFFSET :offset
                """
            ),
            {
                "q": query,
                "limit": limit,
                "offset": offset,
            },
        )

    rows = result.mappings().all()
    return {
        "query": query,
        "page": page,
        "limit": limit,
        "results": rows,
    }

@router.post("/ai")
async def ai_search(request: AISearchRequest, db: AsyncSession = Depends(get_db)):
    """AI-powered semantic search."""
    
    # Step 1: Retrieve top-k products from ChromaDB
    retrieved = retrieve_products(request.query, top_k=10)
    product_ids = [r["product_id"] for r in retrieved]
    
    # Step 2: Fetch full product records from Neon
    if not product_ids:
        return {"summary": "No products found.", "products": []}
    
    placeholders = ", ".join([f":id{i}" for i in range(len(product_ids))])
    query_sql = f"SELECT * FROM products WHERE id IN ({placeholders})"
    params = {f"id{i}": pid for i, pid in enumerate(product_ids)}
    
    result = await db.execute(text(query_sql), params)
    products = [dict(row) for row in result.mappings().all()]
    
    # Step 3: Format products for Claude
    products_context = "\n\n".join([
        f"ID: {p['id']}\n"
        f"Name: {p['name']}\n"
        f"Brand: {p['brand']}\n"
        f"Price: ${p['price']}\n"
        f"Description: {p['description']}\n"
        f"Tags: {', '.join(p.get('tags', []))}"
        for p in products
    ])
    
    # Step 4: Build prompt
    prompt = AI_SEARCH_SYSTEM_PROMPT.format(
        query=request.query,
        products_context=products_context
    )
    
    # Step 5: Call Claude
    if not settings.anthropic_api_key:
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY is not configured")

    client = AsyncAnthropic(api_key=settings.anthropic_api_key)
    
    try:
        response = await client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}]
        )
        
        # Step 6: Parse JSON response
        text_chunks = []
        for block in response.content:
            text_value = getattr(block, "text", None)
            if isinstance(text_value, str):
                text_chunks.append(text_value)

        response_text = "\n".join(text_chunks).strip()
        if not response_text:
            raise ValueError("Claude returned no text content")

        # Strip markdown fences if present
        if response_text.startswith("```json"):
            response_text = response_text.replace("```json", "").replace("```", "").strip()
        
        ai_result = json.loads(response_text)
        
        # Step 7: Reorder products by Claude's ranking
        ranked_products = []
        for pid in ai_result.get("product_ids", []):
            product = next((p for p in products if str(p["id"]) == str(pid)), None)
            if product:
                ranked_products.append(product)
        
        return {
            "summary": ai_result.get("summary", ""),
            "products": ranked_products
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI search failed: {str(e)}")