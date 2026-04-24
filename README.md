# Ozark Ridge

A mock outdoor gear retail website that demonstrates AI-powered product search and a floating AI assistant, built with FastAPI, React, LlamaIndex, ChromaDB, and Anthropic Claude.

## What it does

- **Keyword search** — Postgres full-text search (`tsvector`/`tsquery`) for traditional keyword matching
- **AI search** — Natural language semantic search using LlamaIndex + ChromaDB for retrieval and Claude for summarized, ranked results
- **Search toggle** — Side-by-side comparison of keyword vs. AI search on the same query
- **Product detail pages** — Full product info, specs table, tags, and breadcrumb navigation
- **Category browsing** — Browse products by category with load-more pagination
- **AI assistant** — Rufus-style floating chat widget, context-aware when viewing a product, with cross-product retrieval for pairing/loadout questions

## Stack

| Layer | Tool |
|---|---|
| Frontend | React + Vite |
| Backend | FastAPI + uvicorn |
| Database | Neon (Postgres), SQLAlchemy async + asyncpg |
| Vector store | ChromaDB (persisted locally) |
| Embeddings | `BAAI/bge-small-en-v1.5` via HuggingFace (local, no API cost) |
| RAG framework | LlamaIndex |
| AI inference | Anthropic Claude (`claude-sonnet-4-20250514`) |

## Project structure

```
ozarkridge/
├── frontend/          # React + Vite app (port 5173)
│   └── src/
│       ├── pages/     # Home, SearchPage, ProductDetail, CategoryPage, CategoriesPage
│       └── components/ # ProductCard, ProductGrid, SearchBar, SearchToggle, AISummary, ChatWidget
├── backend/
│   ├── app/
│   │   ├── api/       # products.py, search.py, assistant.py
│   │   ├── core/      # config.py (pydantic settings)
│   │   ├── db/        # database.py (async SQLAlchemy engine)
│   │   └── rag/       # retriever.py, prompts.py
│   └── scripts/
│       ├── generate_catalog.py  # generates ~1000 products from archetypes
│       ├── ingest.py            # embeds products into ChromaDB
│       └── test_retrieval.py    # sanity-check queries against ChromaDB
└── data/
    └── archetypes.json  # product archetypes used for catalog generation
```

## Local setup

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Create `backend/.env`:
```
DATABASE_URL=postgresql+asyncpg://...
ANTHROPIC_API_KEY=sk-ant-...
```

Start the server:
```bash
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Vite proxies `/api/*` → `http://localhost:8000`, so no CORS config needed during development.

### RAG ingestion (one-time)

```bash
cd backend
python scripts/ingest.py
```

This reads all products from Neon, embeds them with `bge-small-en-v1.5`, and writes them to `chroma_db/`. Only needs to be re-run if the product catalog changes.

## API endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `GET` | `/products` | Paginated product list, optional `?category=` filter |
| `GET` | `/products/categories` | List all distinct categories |
| `GET` | `/products/:id` | Single product by UUID |
| `GET` | `/search/keyword?q=` | Postgres FTS keyword search |
| `POST` | `/search/ai` | Semantic AI search (ChromaDB + Claude) |
| `POST` | `/assistant` | AI chat assistant with product context |
