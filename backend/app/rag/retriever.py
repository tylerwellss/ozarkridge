from llama_index.core import VectorStoreIndex, StorageContext
from llama_index.vector_stores.chroma import ChromaVectorStore
from llama_index.core import Settings
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
import chromadb
from pathlib import Path

# Configure the same embedding model used during ingestion
Settings.embed_model = HuggingFaceEmbedding(model_name="BAAI/bge-small-en-v1.5")
Settings.llm = None

BASE_DIR = Path(__file__).resolve().parents[2]
CHROMA_DB_PATH = str(BASE_DIR / "chroma_db")

def retrieve_products(query: str, top_k: int = 10) -> list[dict]:
    """Retrieve top-k products from ChromaDB based on query"""

    # load the persisted ChromaDB index
    chroma_client = chromadb.PersistentClient(path=CHROMA_DB_PATH)
    chroma_collection = chroma_client.get_collection(name="ozark_ridge_products")

    # Wrap in LlamaIndex's ChromaVectorStore
    vector_store = ChromaVectorStore(chroma_collection=chroma_collection)

    # Create index from existing vector store
    index = VectorStoreIndex.from_vector_store(vector_store)

    # Create retriever
    retriever = index.as_retriever(similarity_top_k=top_k)

    # Retrieve results
    results = retriever.retrieve(query)

    # Return as list of dicts with product_id, score, text
    return [
        {
            "product_id": result.metadata.get("product_id"),
            "score": result.score,
            "text": result.text,
        }
        for result in results
    ]