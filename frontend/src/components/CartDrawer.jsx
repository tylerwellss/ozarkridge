import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import './CartDrawer.css'

export function CartDrawer({ open, onClose }) {
  const { items, removeFromCart, updateQuantity, cartTotal } = useCart()

  return (
    <>
      <div className={`cart-backdrop ${open ? 'visible' : ''}`} onClick={onClose} />
      <div className={`cart-drawer ${open ? 'open' : ''}`} aria-modal="true" role="dialog" aria-label="Shopping cart">
        <div className="cart-drawer-header">
          <h2 className="cart-drawer-title">Shopping Cart</h2>
          <button onClick={onClose} className="cart-close-btn" aria-label="Close cart">✕</button>
        </div>

        {items.length === 0 ? (
          <div className="cart-empty">
            <span className="cart-empty-icon">🛒</span>
            <p>Your cart is empty.</p>
          </div>
        ) : (
          <>
            <ul className="cart-items">
              {items.map((item) => {
                const imageUrl =
                  item.image_url ||
                  `https://placehold.co/64x64/e2e8f0/475569?text=${encodeURIComponent(item.category || 'product')}`
                return (
                  <li key={item.id} className="cart-item">
                    <Link to={`/products/${item.id}`} onClick={onClose} className="cart-item-img-link">
                      <img src={imageUrl} alt={item.name} className="cart-item-img" />
                    </Link>
                    <div className="cart-item-info">
                      <Link to={`/products/${item.id}`} onClick={onClose} className="cart-item-name">
                        {item.name}
                      </Link>
                      <p className="cart-item-brand">{item.brand}</p>
                      <p className="cart-item-price">${Number(item.price).toFixed(2)}</p>
                    </div>
                    <div className="cart-item-actions">
                      <div className="cart-qty">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                      <button
                        className="cart-remove-btn"
                        onClick={() => removeFromCart(item.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>

            <div className="cart-footer">
              <div className="cart-total-row">
                <span>Total</span>
                <span className="cart-total-amount">${cartTotal.toFixed(2)}</span>
              </div>
              <button className="cart-checkout-btn" disabled>
                Checkout (demo only)
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}
