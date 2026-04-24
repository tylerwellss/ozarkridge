import { useEffect, useRef, useState } from 'react'
import { SearchBar } from '../components/SearchBar'
import { SearchToggle } from '../components/SearchToggle'
import { AISummary } from '../components/AISummary'
import { ProductGrid } from '../components/ProductGrid'

export function SearchPage() {
  const [results, setResults] = useState([])
  const [query, setQuery] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')
  const [searchMode, setSearchMode] = useState('keyword')
  const [aiSummary, setAiSummary] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const hasInitializedFromUrl = useRef(false)

  const updateUrlState = (nextQuery, nextMode) => {
    const params = new URLSearchParams(window.location.search)
    if (nextQuery) {
      params.set('q', nextQuery)
    } else {
      params.delete('q')
    }
    params.set('mode', nextMode)
    const qs = params.toString()
    window.history.replaceState({}, '', `/search${qs ? `?${qs}` : ''}`)
  }

  const runSearch = async (searchQuery, modeOverride) => {
    const trimmedQuery = searchQuery.trim()
    if (!trimmedQuery) return

    const modeToUse = modeOverride ?? searchMode
    setSubmittedQuery(trimmedQuery)
    setIsLoading(true)
    setError(null)
    setAiSummary('')
    updateUrlState(trimmedQuery, modeToUse)

    try {
      let response
      if (modeToUse === 'ai') {
        response = await fetch('/api/search/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: trimmedQuery }),
        })
      } else {
        const params = new URLSearchParams({ q: trimmedQuery })
        response = await fetch(`/api/search/keyword?${params}`)
      }

      if (!response.ok) throw new Error(`Search failed (${response.status})`)

      const data = await response.json()
      if (modeToUse === 'ai') {
        setAiSummary(data.summary || '')
        setResults(data.products || [])
      } else {
        setResults(data.results || [])
      }
    } catch (err) {
      setError(err.message)
      setResults([])
      setAiSummary('')
    } finally {
      setIsLoading(false)
    }
  }

  const handleModeChange = async (nextMode) => {
    if (nextMode === searchMode) return
    setSearchMode(nextMode)
    updateUrlState(query, nextMode)
    if (submittedQuery) await runSearch(submittedQuery, nextMode)
  }

  useEffect(() => {
    if (hasInitializedFromUrl.current) return
    const params = new URLSearchParams(window.location.search)
    const modeFromUrl = params.get('mode')
    const queryFromUrl = (params.get('q') || '').trim()
    if (modeFromUrl === 'ai' || modeFromUrl === 'keyword') setSearchMode(modeFromUrl)
    if (queryFromUrl) {
      setQuery(queryFromUrl)
      void runSearch(queryFromUrl, modeFromUrl === 'ai' ? 'ai' : 'keyword')
    }
    hasInitializedFromUrl.current = true
  }, [])

  return (
    <div className="search-page">
      <SearchToggle mode={searchMode} onChange={handleModeChange} />
      <SearchBar
        onSearch={(q) => runSearch(q)}
        isLoading={isLoading}
        query={query}
        onQueryChange={setQuery}
        mode={searchMode}
      />

      <AISummary
        mode={searchMode}
        summary={aiSummary}
        isLoading={isLoading && searchMode === 'ai'}
        hasQuery={Boolean(submittedQuery)}
      />

      {error && <div className="error-message">Error: {error}</div>}

      {submittedQuery && !isLoading && (
        <div className="search-info">
          <span className={`mode-chip mode-${searchMode}`}>
            {searchMode === 'ai' ? 'AI mode' : 'Keyword mode'}
          </span>
          Showing results for "<strong>{submittedQuery}</strong>" ({results.length} found)
        </div>
      )}

      <ProductGrid
        products={results}
        isLoading={isLoading}
        mode={searchMode}
        hasSearched={Boolean(submittedQuery)}
      />
    </div>
  )
}
