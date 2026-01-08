import React, { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import LoadingSpinner from './components/LoadingSpinner'

// Lazy load pages untuk code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'))
const ManajemenGuru = lazy(() => import('./pages/ManajemenGuru'))
const ManajemenSiswa = lazy(() => import('./pages/ManajemenSiswa'))
const MataPelajaran = lazy(() => import('./pages/MataPelajaran'))
const ManajemenPenilaian = lazy(() => import('./pages/ManajemenPenilaian'))
const ProfilLembaga = lazy(() => import('./pages/ProfilLembaga'))
const Rekapitulasi = lazy(() => import('./pages/Rekapitulasi'))
const Pengaturan = lazy(() => import('./pages/Pengaturan'))
const JurnalPresensi = lazy(() => import('./pages/JurnalPresensi'))
const Penilaian = lazy(() => import('./pages/Penilaian'))
const Profil = lazy(() => import('./pages/Profil'))

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return <Layout>{children}</Layout>
}

// Public Route Component
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
              <LoadingSpinner />
            </div>
          }>
            <Routes>
              {/* Public Routes */}
              <Route 
                path="/login" 
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                } 
              />

              {/* Protected Routes */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['admin', 'supervisor', 'guru']}>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />

              {/* Admin Routes */}
              <Route 
                path="/manajemen-guru" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <ManajemenGuru />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/manajemen-siswa" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <ManajemenSiswa />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/mata-pelajaran" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <MataPelajaran />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/manajemen-penilaian" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <ManajemenPenilaian />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/profil-lembaga" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <ProfilLembaga />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/pengaturan" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <Pengaturan />
                  </ProtectedRoute>
                } 
              />

              {/* Guru Routes */}
              <Route 
                path="/jurnal-presensi" 
                element={
                  <ProtectedRoute allowedRoles={['guru']}>
                    <JurnalPresensi />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/penilaian" 
                element={
                  <ProtectedRoute allowedRoles={['guru']}>
                    <Penilaian />
                  </ProtectedRoute>
                } 
              />

              {/* Shared Routes */}
              <Route 
                path="/rekapitulasi" 
                element={
                  <ProtectedRoute allowedRoles={['admin', 'supervisor', 'guru']}>
                    <Rekapitulasi />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/profil" 
                element={
                  <ProtectedRoute allowedRoles={['supervisor', 'guru']}>
                    <Profil />
                  </ProtectedRoute>
                } 
              />

              {/* Default redirect */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        </div>
      </AuthProvider>
    </Router>
  )
}

export default App