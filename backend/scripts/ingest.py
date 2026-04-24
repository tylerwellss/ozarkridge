from llama_index.core import Settings, Document, VectorStoreIndex, StorageContext
from llama_index.vector_stores.chroma import ChromaVectorStore
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy import select, text
import asyncio
import os
import chromadb
from dotenv import load_dotenv

# Load .env variables
load_dotenv()

# Tell LlamaIndex to use local embedding model
Settings.embed_model = HuggingFaceEmbedding(model_name="BAAI/bge-small-en-v1.5")

# We won't use LlamaIndex's LLM, so set it to None
Settings.llm = None

DATABASE_URL = os.getenv("DATABASE_URL")

async def fetch_all_products():
    if not DATABASE_URL:
        raise ValueError("DATABASE_URL environment variable is not set")
    engine = create_async_engine(DATABASE_URL)
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        result = await session.execute(text("SELECT * FROM products"))
        products = [dict(row) for row in result.mappings().all()]
    await engine.dispose() 
    return products

def build_document_text(product: dict) -> str:
    """Combine product fields into a single text string for embedding."""
    parts = [
        f"{product['name']} by {product['brand']}.",
        product['description'],
        f"Category: {product['category']}.",
    ]

    if product.get('tags'):
        parts.append(f"Tags: {', '.join(product['tags'])}.")

    if product.get('attributes'):
        attr_strings = [f"{k.replace('_', ' ')}: {v}" for k, v in product['attributes'].items()]
        parts.append(f"Specifications: {'. '.join(attr_strings)}.")

    return ' '.join(parts)

def create_documents(products: list[dict]) -> list[Document]:
    """Convert product dicts to LlamaIndex documents"""
    documents = []
    for product in products:
        doc = Document(
            text=build_document_text(product),
            metadata = {
                "product_id": str(product['id']),
                "price": float(product['price']),
                "category": product['category'],
                "brand": product['brand'],
                }
        )
        documents.append(doc)
    return documents

def create_index(documents: list[Document]) -> VectorStoreIndex:
    """Create ChromaDB index from documents."""

    # Create ChromaDB client with persistent storage
    chroma_client = chromadb.PersistentClient(path="./chroma_db")

    # Create or get the collection
    # If collection already exists, this will clear it and start fresh
    collection_name = "ozark_ridge_products"

    # Delete existing collection if it exists
    try:
        chroma_client.delete_collection(name=collection_name)
    except:
        pass # Collection doesn't exist yet, that's fine

    # Create collection
    chroma_collection = chroma_client.create_collection(name=collection_name)

    # Wrap ChromaDB collection in LLamaIndex ChromaVectorStore
    vector_store = ChromaVectorStore(chroma_collection=chroma_collection)

    # Create a storage context
    storage_context = StorageContext.from_defaults(vector_store=vector_store)

    # Build the index - this embeds all documents and stores them in ChromaDB
    print(f"Indexing {len(documents)} products...")
    index = VectorStoreIndex.from_documents(
        documents,
        storage_context=storage_context,
        show_progress=True
    )

    print(f"Indexed {len(documents)} products into ChromaDB collection '{collection_name}'.")
    return index

async def main():
    print("Starting ingestion pipeline...")

    # Step 1: Fetch products from Neon DB
    print("\n1. Fetching products from database...")
    products = await fetch_all_products()
    print(f"Fetched {len(products)} products.")

    # Step 2: Convert to LlamaIndex Documents
    print("\n2. Converting products to LlamaIndex Documents...")
    documents = create_documents(products)
    print(f"Created {len(documents)} documents.")

    # Step 3: Create ChromaDB index
    print("\n3. Creating ChromaDB index...")
    index = create_index(documents)

    print("\nIngestion pipeline completed successfully.")
    print(f"ChromaDB persisted to ./chroma_db directory.")

if __name__ == "__main__":
    asyncio.run(main())