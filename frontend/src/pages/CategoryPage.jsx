import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ProductGrid } from '../components/ProductGrid'
import './ProductDetail.css'
import './CategoryPage.css'

const CATEGORY_META = {
  tents:         { label: 'Tents',         icon: '⛺' },
  sleeping_bags: { label: 'Sleeping Bags', icon: '🛌' },
  footwear:      { label: 'Footwear',      icon: '👟' },
  apparel:       { label: 'Apparel',       icon: '🧥' },
  packs:         { label: 'Packs',         icon: '🎒' },
  camp_kitchen:  { label: 'Camp Kitchen',  icon: '🍳' },
  accessories:   { label: 'Accessories',   icon: '🔦' },
}

function formatCategory(cat) {
  const meta = CATEGORY_META[cat]
  if (meta) return meta.label
  return cat.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

const PAGE_SIZE = 20

export function CategoryPage() {
  const { name } = useParams()
  const [products, setProducts] = useState([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setProducts([])
    setPage(1)
    setHasMore(true)
    setError(null)
  }, [name])

  useEffect(() => {
    setLoading(true)
    fetch(`/api/products?category=${encodeURIComponent(name)}&page=${page}&limit=${PAGE_SIZE}`)
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load products (${r.status})`)
        return r.json()
      })
      .then((data) => {
        const items = Array.isArray(data) ? data : data.results || []
        setProducts((prev) => (page === 1 ? items : [...prev, ...items]))
        setHasMore(items.length === PAGE_SIZE)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [name, page])

  const meta = CATEGORY_META[name] || {}
  const label = formatCategory(name)

  return (
    <div className="category-page">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span className="breadcrumb-sep">›</span>
        <Link to="/categories">Categories</Link>
        <span className="breadcrumb-sep">›</span>
        <span className="breadcrumb-current">{label}</span>
      </nav>

      <div className="category-page-header">
        <span className="category-page-icon">{meta.icon || '🏕️'}</span>
        <h1 className="category-page-title">{label}</h1>
      </div>

      {error && <div className="error-message">{error}</div>}

      <ProductGrid
        products={products}
        isLoading={loading && page === 1}
        hasSearched={true}
      />

      {!loading && hasMore && (
        <div className="load-more-row">
          <button className="load-more-btn" onClick={() => setPage((p) => p + 1)}>
            Load more
          </button>
        </div>
      )}

      {loading && page > 1 && (
        <div className="load-more-row">
          <span className="loading-more-text">Loading…</span>
        </div>
      )}
    </div>
  )
}
