import './ProductCard.css'

export function ProductCard({ product }) {
  return (
    <div className="product-card">
      <div className="product-image">
        <img
          src={`https://placehold.co/400x400?text=${encodeURIComponent(product.name)}`}
          alt={product.name}
        />
      </div>
      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        <p className="product-brand">{product.brand}</p>
        <p className="product-price">${product.price}</p>
        <p className="product-description">{product.description?.substring(0, 100)}...</p>
        {product.tags && product.tags.length > 0 && (
          <div className="product-tags">
            {product.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="tag">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
