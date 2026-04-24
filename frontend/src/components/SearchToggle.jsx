import './SearchToggle.css'

export function SearchToggle({ mode, onChange }) {
  return (
    <div className="search-toggle" role="tablist" aria-label="Search mode">
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'keyword'}
        className={`toggle-button ${mode === 'keyword' ? 'active' : ''}`}
        onClick={() => onChange('keyword')}
      >
        Keyword
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'ai'}
        className={`toggle-button ${mode === 'ai' ? 'active' : ''}`}
        onClick={() => onChange('ai')}
      >
        AI
      </button>
    </div>
  )
}
