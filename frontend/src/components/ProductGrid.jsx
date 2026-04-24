import { ProductCard } from './ProductCard'
import './ProductGrid.css'

export function ProductGrid({ products, isLoading, mode, hasSearched }) {
  if (isLoading) {
    return (
      <div className="product-grid" aria-busy="true" aria-live="polite">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="product-skeleton" />
        ))}
      </div>
    )
  }

  if (hasSearched && (!products || products.length === 0)) {
    return <div className="empty-state">No products found. Try a different search.</div>
  }

  if (!hasSearched) {
    return (
      <div className="empty-state">
        {mode === 'ai'
          ? 'Switch to AI mode and ask a natural-language question to see semantic results.'
          : 'Search by keyword to browse products from the catalog.'}
      </div>
    )
  }

  return (
    <div className="product-grid">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
