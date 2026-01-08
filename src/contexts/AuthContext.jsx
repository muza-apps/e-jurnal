import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check active session
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) throw error
        
        if (session) {
          // Get user data from our users table
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()
          
          if (userError) throw userError
          setUser(userData)
        }
      } catch (error) {
        console.error('Error getting session:', error)
        toast.error('Terjadi kesalahan saat memuat sesi')
      } finally {
        setLoading(false)
      }
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          try {
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single()
            
            if (userError) throw userError
            setUser(userData)
          } catch (error) {
            console.error('Error getting user data:', error)
            setUser(null)
          }
        } else {
          setUser(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const login = async (username, password) => {
    try {
      setLoading(true)
      
      // Get user by username
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single()
      
      if (userError) throw userError
      
      // For simplicity, we'll use the user ID as email for Supabase auth
      // In production, you should implement proper authentication
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: `${userData.id}@example.com`, // Temporary email
        password: password
      })
      
      if (authError) {
        // If user doesn't exist in auth, create them
        if (authError.message.includes('Invalid login credentials')) {
          const { error: signUpError } = await supabase.auth.signUp({
            email: `${userData.id}@example.com`,
            password: password,
            options: {
              data: {
                user_id: userData.id
              }
            }
          })
          
          if (signUpError) throw signUpError
          
          // Try login again
          const { error: loginError } = await supabase.auth.signInWithPassword({
            email: `${userData.id}@example.com`,
            password: password
          })
          
          if (loginError) throw loginError
        } else {
          throw authError
        }
      }
      
      // Log login activity
      await supabase
        .from('login_logs')
        .insert({
          user_id: userData.id,
          ip_address: '127.0.0.1', // You can get real IP from request
          user_agent: navigator.userAgent
        })
      
      setUser(userData)
      toast.success('Login berhasil!')
      return true
    } catch (error) {
      console.error('Login error:', error)
      toast.error('Username atau password salah')
      return false
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      toast.success('Logout berhasil!')
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('Terjadi kesalahan saat logout')
    }
  }

  const updateUser = async (userData) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(userData)
        .eq('id', user.id)
        .select()
        .single()
      
      if (error) throw error
      
      setUser(data)
      toast.success('Profil berhasil diperbarui!')
      return data
    } catch (error) {
      console.error('Update user error:', error)
      toast.error('Terjadi kesalahan saat memperbarui profil')
      return null
    }
  }

  const value = {
    user,
    loading,
    login,
    logout,
    updateUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}