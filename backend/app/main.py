from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.db.database import check_db_connection
from app.api.products import router as products_router
from app.api.search import router as search_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    await check_db_connection()
    print("Database connection verified.")
    yield


app = FastAPI(title="Ozark Ridge API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok"}

app.include_router(products_router)
app.include_router(search_router)