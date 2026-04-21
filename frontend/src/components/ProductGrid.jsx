import { ProductCard } from './ProductCard'
import './ProductGrid.css'

export function ProductGrid({ products }) {
  if (!products || products.length === 0) {
    return <div className="empty-state">No products found. Try a different search.</div>
  }

  return (
    <div className="product-grid">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
