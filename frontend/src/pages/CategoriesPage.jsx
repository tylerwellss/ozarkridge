import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import './CategoriesPage.css'


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

export function CategoriesPage() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/products/categories')
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load categories (${r.status})`)
        return r.json()
      })
      .then(setCategories)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="categories-page">
      <h1 className="cats-title">Shop by Category</h1>
      <p className="cats-sub">Browse our full selection of outdoor gear by category.</p>

      {error && <div className="error-message">{error}</div>}

      <div className="cats-grid">
        {loading
          ? Array.from({ length: 7 }).map((_, i) => <div key={i} className="cat-card-skeleton" />)
          : categories.map((cat) => {
              const meta = CATEGORY_META[cat] || {}
              return (
                <Link key={cat} to={`/categories/${cat}`} className="cat-full-card">
                  <span className="cat-full-icon">{meta.icon || '🏕️'}</span>
                  <div className="cat-full-info">
                    <span className="cat-full-label">{formatCategory(cat)}</span>
                    {meta.desc && <span className="cat-full-desc">{meta.desc}</span>}
                  </div>
                  <span className="cat-full-arrow">→</span>
                </Link>
              )
            })}
      </div>
    </div>
  )
}
