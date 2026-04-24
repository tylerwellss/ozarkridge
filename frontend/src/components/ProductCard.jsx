import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import './ProductCard.css'

export function ProductCard({ product }) {
  const { addToCart } = useCart()
  const [added, setAdded] = useState(false)

  const imageUrl =
    product.image_url ||
    `https://placehold.co/400x400/e2e8f0/475569?text=${encodeURIComponent(product.category || 'product')}`

  function handleAddToCart() {
    addToCart(product)
    setAdded(true)
    setTimeout(() => setAdded(false), 1200)
  }

  return (
    <div className="product-card">
      <Link to={`/products/${product.id}`} className="product-card-link">
        <div className="product-image">
          <img src={imageUrl} alt={product.name} />
        </div>
        <div className="product-info">
          <p className="product-brand">{product.brand}</p>
          <h3 className="product-name">{product.name}</h3>
          <p className="product-price">${Number(product.price).toFixed(2)}</p>
          <p className="product-description">{product.description?.substring(0, 110)}…</p>
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
      </Link>
      <div className="product-card-footer">
        <button
          className={`add-to-cart-btn${added ? ' added' : ''}`}
          onClick={handleAddToCart}
        >
          {added ? '✓ Added' : 'Add to Cart'}
        </button>
      </div>
    </div>
  )
}
