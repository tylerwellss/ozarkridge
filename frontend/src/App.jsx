import { Link, Route, Routes } from 'react-router-dom'
import { SearchPage } from './pages/SearchPage'
import { ProductDetail } from './pages/ProductDetail'
import { ChatWidget } from './components/ChatWidget'
import './App.css'

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <Link to="/" className="app-header-link">
          <h1>Ozark Ridge Outdoor Gear</h1>
        </Link>
        <p>Find the perfect gear for your next adventure</p>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<SearchPage />} />
          <Route path="/products/:id" element={<ProductDetail />} />
        </Routes>
      </main>

      <ChatWidget />
    </div>
  )
}

export default App
