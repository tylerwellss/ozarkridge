from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.db.database import get_db

router = APIRouter(prefix="/products", tags=["products"])

@router.get("")
async def list_products(category: str | None = None, page: int = 1, limit: int = 20, db: AsyncSession = Depends(get_db)):
    if category:
        result = await db.execute(
            text("SELECT * FROM products WHERE category = :category LIMIT :limit OFFSET :offset"),
            {"category": category, "limit": limit, "offset": (page - 1) * limit}
        )
    else:
        result = await db.execute(
            text("SELECT * FROM products LIMIT :limit OFFSET :offset"),
            {"limit": limit, "offset": (page - 1) * limit}
        )
    return result.mappings().all()

@router.get("/categories")
async def list_categories(db: AsyncSession = Depends(get_db)):
    result = await db.execute(text("SELECT DISTINCT category FROM products"))
    categories = [row["category"] for row in result.mappings().all()]
    return categories

@router.get("/{product_id}")
async def get_product(product_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(text("SELECT * FROM products WHERE id = :id"), {"id": product_id})
    product = result.mappings().first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product
