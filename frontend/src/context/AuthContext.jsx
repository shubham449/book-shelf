import { createContext, useContext, useState, useEffect } from 'react'
import pb from '../lib/pocketbase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(pb.authStore.model)

  useEffect(() => {
    return pb.authStore.onChange((_token, model) => {
      setUser(model)
    })
  }, [])

  const login = (email, password) =>
    pb.collection('users').authWithPassword(email, password)

  const logout = () => pb.authStore.clear()

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
