import { useEffect, useRef, useState } from 'react'
import { Link, useMatch } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import './ChatWidget.css'

function TypingIndicator() {
  return (
    <div className="chat-message assistant">
      <div className="chat-bubble typing-indicator">
        <span /><span /><span />
      </div>
    </div>
  )
}

// Parse markdown links [text](url) and return an array of strings and link objects
function parseChatLinks(text) {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
  const parts = []
  let lastIndex = 0
  let match
  while ((match = linkRegex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index))
    parts.push({ type: 'link', label: match[1], href: match[2] })
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex))
  return parts
}

function ChatBubble({ content }) {
  const parts = parseChatLinks(content)
  return (
    <div className="chat-bubble">
      {parts.map((part, i) =>
        typeof part === 'string' ? (
          part
        ) : (
          <Link key={i} to={part.href} className="chat-link">
            {part.label}
          </Link>
        ),
      )}
    </div>
  )
}

export function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const bottomRef = useRef(null)
  const { addToCart } = useCart()

  // Detect if we're on a product detail page and grab the product ID
  const match = useMatch('/products/:id')
  const currentProductId = match?.params?.id ?? null

  // Scroll to bottom when messages change
  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isLoading, open])

  async function sendMessage(e) {
    e.preventDefault()
    const text = input.trim()
    if (!text || isLoading) return

    const userMessage = { role: 'user', content: text }
    const updatedHistory = [...messages, userMessage]
    setMessages(updatedHistory)
    setInput('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages, // history before this message
          current_product_id: currentProductId,
        }),
      })
      if (!res.ok) throw new Error('Request failed')
      const data = await res.json()
      if (data.add_to_cart?.length) {
        data.add_to_cart.forEach((product) => addToCart(product))
      }
      setMessages([...updatedHistory, { role: 'assistant', content: data.response }])
    } catch {
      setMessages([
        ...updatedHistory,
        { role: 'assistant', content: "Sorry, I'm having trouble connecting right now. Please try again." },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="chat-widget">
      {open && (
        <div className="chat-panel">
          <div className="chat-header">
            <div className="chat-header-info">
              <span className="chat-header-icon">🏕️</span>
              <div>
                <p className="chat-header-title">Gear Assistant</p>
                <p className="chat-header-sub">
                  {currentProductId ? 'Viewing this product' : 'Ask me anything'}
                </p>
              </div>
            </div>
            <button className="chat-close-btn" onClick={() => setOpen(false)} aria-label="Close chat">
              ✕
            </button>
          </div>

          <div className="chat-messages">
            {messages.length === 0 && (
              <div className="chat-empty">
                <p>Hi! I'm your Ozark Ridge gear expert.</p>
                <p>
                  {currentProductId
                    ? 'Ask me about this product, or what to pair with it.'
                    : 'Ask me to recommend gear, build a loadout, or compare products.'}
                </p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`chat-message ${msg.role}`}>
                {msg.role === 'assistant' ? (
                  <ChatBubble content={msg.content} />
                ) : (
                  <div className="chat-bubble">{msg.content}</div>
                )}
              </div>
            ))}
            {isLoading && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>

          <form className="chat-input-row" onSubmit={sendMessage}>
            <input
              className="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about gear..."
              disabled={isLoading}
              autoComplete="off"
            />
            <button className="chat-send-btn" type="submit" disabled={isLoading || !input.trim()}>
              Send
            </button>
          </form>
        </div>
      )}

      <button
        className={`chat-toggle-btn ${open ? 'open' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close chat' : 'Open gear assistant'}
      >
        {open ? '✕' : '💬'}
      </button>
    </div>
  )
}
