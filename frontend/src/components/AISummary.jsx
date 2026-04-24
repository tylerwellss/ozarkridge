import './AISummary.css'

export function AISummary({ mode, summary, isLoading, hasQuery }) {
  if (mode !== 'ai' || !hasQuery) {
    return null
  }

  return (
    <section className="ai-summary" aria-live="polite">
      <div className="ai-summary-label">AI-powered summary</div>
      {isLoading ? (
        <div className="ai-summary-loading">
          <span className="dot" />
          <span className="dot" />
          <span className="dot" />
          Searching with AI...
        </div>
      ) : (
        <p className="ai-summary-text">{summary || 'No summary was returned for this query.'}</p>
      )}
    </section>
  )
}
