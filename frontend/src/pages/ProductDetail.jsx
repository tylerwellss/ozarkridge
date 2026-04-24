import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import './ProductDetail.css'

function formatLabel(key) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatCategory(str) {
  if (!str) return ''
  return str.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function Breadcrumb({ category, subcategory, name }) {
  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      <Link to="/">Home</Link>
      <span className="breadcrumb-sep">›</span>
      <Link to={`/search?q=${encodeURIComponent(category)}&mode=keyword`}>
        {formatCategory(category)}
      </Link>
      {subcategory && (
        <>
          <span className="breadcrumb-sep">›</span>
          <Link to={`/search?q=${encodeURIComponent(subcategory)}&mode=keyword`}>
            {formatCategory(subcategory)}
          </Link>
        </>
      )}
      <span className="breadcrumb-sep">›</span>
      <span className="breadcrumb-current">{name}</span>
    </nav>
  )
}

function SpecsTable({ attributes }) {
  const entries = Object.entries(attributes || {})
  if (entries.length === 0) return null
  return (
    <div className="specs-section">
      <h2 className="section-heading">Specifications</h2>
      <table className="specs-table">
        <tbody>
          {entries.map(([key, value]) => (
            <tr key={key}>
              <th>{formatLabel(key)}</th>
              <td>{String(value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ProductDetailSkeleton() {
  return (
    <div className="product-detail-skeleton">
      <div className="skeleton-breadcrumb" />
      <div className="product-detail-layout">
        <div className="skeleton-image" />
        <div className="skeleton-info">
          <div className="skeleton-line wide" />
          <div className="skeleton-line medium" />
          <div className="skeleton-line short" />
          <div className="skeleton-line wide" />
          <div className="skeleton-line wide" />
          <div className="skeleton-line medium" />
        </div>
      </div>
    </div>
  )
}

export function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setIsLoading(true)
    setError(null)

    fetch(`/api/products/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Product not found (${res.status})`)
        return res.json()
      })
      .then((data) => setProduct(data))
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false))
  }, [id])

  if (isLoading) return <ProductDetailSkeleton />

  if (error) {
    return (
      <div className="product-detail-error">
        <p>{error}</p>
        <button onClick={() => navigate(-1)} className="back-button">
          ← Go back
        </button>
      </div>
    )
  }

  if (!product) return null

  const imageUrl =
    product.image_url ||
    `https://placehold.co/600x500/e2e8f0/475569?text=${encodeURIComponent(product.category || 'product')}`

  return (
    <div className="product-detail">
      <Breadcrumb
        category={product.category}
        subcategory={product.subcategory}
        name={product.name}
      />

      <div className="product-detail-layout">
        {/* Left: image */}
        <div className="product-detail-image-col">
          <img
            className="product-detail-image"
            src={imageUrl}
            alt={product.name}
          />
        </div>

        {/* Right: info */}
        <div className="product-detail-info-col">
          <p className="detail-brand">{product.brand}</p>
          <h1 className="detail-name">{product.name}</h1>
          <p className="detail-price">${Number(product.price).toFixed(2)}</p>

          {product.tags && product.tags.length > 0 && (
            <div className="detail-tags">
              {product.tags.map((tag) => (
                <span key={tag} className="detail-tag">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="detail-description-section">
            <h2 className="section-heading">About this product</h2>
            <p className="detail-description">{product.description}</p>
          </div>

          <SpecsTable attributes={product.attributes} />
        </div>
      </div>

      <div className="detail-back">
        <button onClick={() => navigate(-1)} className="back-button">
          ← Back to results
        </button>
      </div>
    </div>
  )
}
