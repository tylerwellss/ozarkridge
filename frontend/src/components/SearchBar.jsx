import './SearchBar.css'

export function SearchBar({ onSearch, isLoading, query, onQueryChange, mode }) {
  const handleSubmit = (e) => {
    e.preventDefault()
    if (query.trim()) {
      onSearch(query)
    }
  }

  return (
    <form className="search-bar" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder={
          mode === 'ai'
            ? 'Ask naturally, e.g. something warm for cold nights at camp'
            : 'Search products by keyword...'
        }
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        disabled={isLoading}
        className="search-input"
      />
      <button type="submit" disabled={isLoading} className="search-button">
        {isLoading ? 'Searching...' : 'Search'}
      </button>
    </form>
  )
}
