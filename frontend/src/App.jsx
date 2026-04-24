import { useState } from 'react'
import { NavLink, Route, Routes } from 'react-router-dom'
import { Home } from './pages/Home'
import { SearchPage } from './pages/SearchPage'
import { ProductDetail } from './pages/ProductDetail'
import { CategoriesPage } from './pages/CategoriesPage'
import { CategoryPage } from './pages/CategoryPage'
import { ChatWidget } from './components/ChatWidget'
import { CartDrawer } from './components/CartDrawer'
import { CartProvider, useCart } from './context/CartContext'
import './App.css'

function NavCartButton({ onClick }) {
  const { cartCount } = useCart()
  return (
    <button className="nav-cart-btn" onClick={onClick} aria-label={`Cart${cartCount > 0 ? `, ${cartCount} items` : ''}`}>
      🛒
      {cartCount > 0 && <span className="cart-badge">{cartCount > 99 ? '99+' : cartCount}</span>}
    </button>
  )
}

function AppInner() {
  const [cartOpen, setCartOpen] = useState(false)

  return (
    <div className="app">
      <header className="app-nav">
        <div className="nav-container">
          <NavLink to="/" className="nav-logo">
            <span className="nav-logo-icon">⛺</span>
            <span className="nav-logo-text">Ozark Ridge</span>
          </NavLink>
          <nav className="nav-links">
            <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' nav-active' : ''}`}>Home</NavLink>
            <NavLink to="/categories" className={({ isActive }) => `nav-link${isActive ? ' nav-active' : ''}`}>Categories</NavLink>
            <NavLink to="/search" className={({ isActive }) => `nav-link${isActive ? ' nav-active' : ''}`}>Search</NavLink>
            <NavCartButton onClick={() => setCartOpen(true)} />
          </nav>
        </div>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/categories/:name" element={<CategoryPage />} />
          <Route path="/products/:id" element={<ProductDetail />} />
        </Routes>
      </main>

      <ChatWidget />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  )
}

function App() {
  return (
    <CartProvider>
      <AppInner />
    </CartProvider>
  )
}

export default App
