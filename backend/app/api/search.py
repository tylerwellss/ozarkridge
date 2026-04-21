from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db

router = APIRouter(prefix="/search", tags=["search"])


@router.get("/keyword")
async def keyword_search(
    q: str,
    page: int = 1,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
):
    q = q.strip()
    page = max(page, 1)
    limit = min(max(limit, 1), 20)
    offset = (page - 1) * limit

    if len(q) < 3:
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
                "pattern": f"%{q}%",
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
                "q": q,
                "limit": limit,
                "offset": offset,
            },
        )

    rows = result.mappings().all()
    return {
        "query": q,
        "page": page,
        "limit": limit,
        "results": rows,
    }