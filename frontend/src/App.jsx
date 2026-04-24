import { NavLink, Route, Routes } from 'react-router-dom'
import { Home } from './pages/Home'
import { SearchPage } from './pages/SearchPage'
import { ProductDetail } from './pages/ProductDetail'
import { CategoriesPage } from './pages/CategoriesPage'
import { CategoryPage } from './pages/CategoryPage'
import { ChatWidget } from './components/ChatWidget'
import './App.css'

function App() {
  return (
    <div className="app">
      <header className="app-nav">
        <div className="nav-container">
          <NavLink to="/" className="nav-logo">
            <span className="nav-logo-icon">⛺</span>
            <span className="nav-logo-text">Ozark Ridge</span>
          </NavLink>
          <nav className="nav-links">
            <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' nav-active' : ''}`}>Home</NavLink>
            <NavLink to="/categories" className={({ isActive }) => `nav-link${isActive ? ' nav-active' : ''}`}>Categories</NavLink>
            <NavLink to="/search" className={({ isActive }) => `nav-link${isActive ? ' nav-active' : ''}`}>Search</NavLink>
          </nav>
        </div>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/categories/:name" element={<CategoryPage />} />
          <Route path="/products/:id" element={<ProductDetail />} />
        </Routes>
      </main>

      <ChatWidget />
    </div>
  )
}

export default App
