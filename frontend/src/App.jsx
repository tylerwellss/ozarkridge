import { useState } from 'react'
import { SearchBar } from './components/SearchBar'
import { ProductGrid } from './components/ProductGrid'
import './App.css'

function App() {
  const [results, setResults] = useState([])
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSearch = async (searchQuery) => {
    setQuery(searchQuery)
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({ q: searchQuery })
      const response = await fetch(`/api/search/keyword?${params}`)

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`)
      }

      const data = await response.json()
      setResults(data.results || [])
    } catch (err) {
      setError(err.message)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Ozark Ridge Outdoor Gear</h1>
        <p>Find the perfect gear for your next adventure</p>
      </header>

      <main className="app-main">
        <SearchBar onSearch={handleSearch} isLoading={isLoading} />

        {error && (
          <div className="error-message">
            Error: {error}
          </div>
        )}

        {query && (
          <div className="search-info">
            Showing results for "<strong>{query}</strong>" ({results.length} found)
          </div>
        )}

        <ProductGrid products={results} />
      </main>
    </div>
  )
}

export default App
