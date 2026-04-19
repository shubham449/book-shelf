import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginScreen from './screens/LoginScreen'
import LibraryScreen from './screens/LibraryScreen'
import AddBookScreen from './screens/AddBookScreen'
import BookDetailScreen from './screens/BookDetailScreen'

function RequireAuth({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginScreen />} />
      <Route path="/" element={<RequireAuth><LibraryScreen /></RequireAuth>} />
      <Route path="/add" element={<RequireAuth><AddBookScreen /></RequireAuth>} />
      <Route path="/book/:id" element={<RequireAuth><BookDetailScreen /></RequireAuth>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
