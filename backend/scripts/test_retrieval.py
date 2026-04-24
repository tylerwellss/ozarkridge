from llama_index.core import Settings, VectorStoreIndex, StorageContext
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.vector_stores.chroma import ChromaVectorStore
import chromadb

# Configure LlamaIndex (same as ingest.py)
Settings.embed_model = HuggingFaceEmbedding(model_name="BAAI/bge-small-en-v1.5")
Settings.llm = None

def load_index() -> VectorStoreIndex:
    """Load the persisted ChromaDB index."""
    # Connect to the persisted ChromaDB
    chroma_client = chromadb.PersistentClient(path="./chroma_db")
    
    # Get the existing collection
    chroma_collection = chroma_client.get_collection(name="ozark_ridge_products")
    
    # Wrap it in LlamaIndex's ChromaVectorStore
    vector_store = ChromaVectorStore(chroma_collection=chroma_collection)
    
    # Create index from the existing vector store
    index = VectorStoreIndex.from_vector_store(vector_store)
    
    return index

def test_query(index: VectorStoreIndex, query: str, top_k: int = 5):
    """Run a test query and print results."""
    print(f"\n{'='*80}")
    print(f"Query: '{query}'")
    print(f"{'='*80}")
    
    # Create a retriever
    retriever = index.as_retriever(similarity_top_k=top_k)
    
    # Retrieve results
    results = retriever.retrieve(query)
    
    print(f"\nTop {len(results)} results:")
    for i, result in enumerate(results, 1):
        print(f"\n{i}. Score: {result.score:.4f}")
        print(f"   Product ID: {result.metadata.get('product_id')}")
        print(f"   Category: {result.metadata.get('category')}")
        print(f"   Brand: {result.metadata.get('brand')}")
        print(f"   Price: ${result.metadata.get('price')}")
        # Print first 150 chars of the text
        print(f"   Text: {result.text[:150]}...")

def main():
    print("Loading ChromaDB index...")
    index = load_index()
    print("✓ Index loaded")
    
    # Test queries
    test_queries = [
        "waterproof 2-person tent",
        "warm sleeping bag for winter camping",
        "lightweight trail running shoe",
        "camp stove for boiling water",
    ]
    
    for query in test_queries:
        test_query(index, query, top_k=5)
    
    print("\n" + "="*80)
    print("Test complete!")

if __name__ == "__main__":
    main()