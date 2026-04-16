import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'

// Pages (we'll create these next)
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'

function App() {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('forged_token')
  )

  const isLoggedIn = !!token

  const handleLogin = (newToken: string) => {
    localStorage.setItem('forged_token', newToken)
    setToken(newToken)
  }

  const handleLogout = () => {
    localStorage.removeItem('forged_token')
    localStorage.removeItem('forged_user')
    setToken(null)
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={
          isLoggedIn ? <Navigate to="/" /> : <Login onLogin={handleLogin} />
        } />
        <Route path="/register" element={
          isLoggedIn ? <Navigate to="/" /> : <Register onLogin={handleLogin} />
        } />
        <Route path="/*" element={
          isLoggedIn ? <Dashboard onLogout={handleLogout} /> : <Navigate to="/login" />
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App