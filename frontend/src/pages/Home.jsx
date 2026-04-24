import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ProductCard } from '../components/ProductCard'
import './Home.css'

const CATEGORY_META = {
  tents:         { label: 'Tents',         icon: '⛺', desc: 'Backpacking & car camping shelter' },
  sleeping_bags: { label: 'Sleeping Bags', icon: '🛌', desc: 'Down & synthetic insulation' },
  footwear:      { label: 'Footwear',      icon: '👟', desc: 'Boots, trail runners & sandals' },
  apparel:       { label: 'Apparel',       icon: '🧥', desc: 'Jackets, base layers & pants' },
  packs:         { label: 'Packs',         icon: '🎒', desc: 'Backpacking & daypacks' },
  camp_kitchen:  { label: 'Camp Kitchen',  icon: '🍳', desc: 'Stoves, cooksets & water filters' },
  accessories:   { label: 'Accessories',   icon: '🔦', desc: 'Headlamps, poles & more' },
}

function formatCategory(cat) {
  const meta = CATEGORY_META[cat]
  if (meta) return meta.label
  return cat.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function Home() {
  const [categories, setCategories] = useState([])
  const [featured, setFeatured] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/products/categories').then((r) => r.json()),
      fetch('/api/products?limit=8').then((r) => r.json()),
    ])
      .then(([cats, prods]) => {
        setCategories(Array.isArray(cats) ? cats : [])
        setFeatured(Array.isArray(prods) ? prods : prods.results || [])
      })
      .catch(() => setError('Could not load content. Make sure the backend is running.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="home">
      {/* Hero */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-badge">AI-Powered Search</div>
          <h1 className="hero-title">
            Gear Up.<br />Get Outside.
          </h1>
          <p className="hero-sub">
            Find exactly what you need with natural language search — or browse thousands of
            products across every outdoor category.
          </p>
          <div className="hero-actions">
            <Link to="/search?mode=ai" className="hero-btn primary">Try AI Search</Link>
            <Link to="/categories" className="hero-btn secondary">Browse Categories</Link>
          </div>
        </div>
      </section>

      <div className="home-container">
        {error && <div className="error-message">{error}</div>}

        {/* Categories */}
        <section className="home-section">
          <div className="home-section-header">
            <h2 className="home-section-title">Shop by Category</h2>
            <Link to="/categories" className="home-see-all">All categories →</Link>
          </div>
          <div className="category-grid">
            {loading
              ? Array.from({ length: 7 }).map((_, i) => <div key={i} className="category-skeleton" />)
              : categories.map((cat) => {
                  const meta = CATEGORY_META[cat] || {}
                  return (
                    <Link key={cat} to={`/categories/${cat}`} className="category-card">
                      <span className="cat-icon">{meta.icon || '🏕️'}</span>
                      <span className="cat-label">{formatCategory(cat)}</span>
                      {meta.desc && <span className="cat-desc">{meta.desc}</span>}
                    </Link>
                  )
                })}
          </div>
        </section>

        {/* Featured products */}
        <section className="home-section">
          <div className="home-section-header">
            <h2 className="home-section-title">Featured Gear</h2>
            <Link to="/search" className="home-see-all">Shop all →</Link>
          </div>
          <div className="featured-grid">
            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="product-skeleton feat-skeleton" />
                ))
              : featured.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
          </div>
        </section>
      </div>
    </div>
  )
}
