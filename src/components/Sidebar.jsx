import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  BookOpen, 
  ClipboardList, 
  FileText, 
  Settings, 
  LogOut,
  Menu,
  X,
  UserCheck,
  Calendar,
  Award,
  Building
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const Sidebar = ({ isOpen, onToggle }) => {
  const { user, logout } = useAuth()
  const location = useLocation()

  const menuItems = [
    // Menu untuk semua role
    {
      title: 'Dashboard',
      icon: LayoutDashboard,
      path: '/dashboard',
      roles: ['admin', 'supervisor', 'guru']
    },
    // Menu khusus admin
    {
      title: 'Manajemen Guru',
      icon: Users,
      path: '/manajemen-guru',
      roles: ['admin']
    },
    {
      title: 'Manajemen Siswa',
      icon: GraduationCap,
      path: '/manajemen-siswa',
      roles: ['admin']
    },
    {
      title: 'Mata Pelajaran',
      icon: BookOpen,
      path: '/mata-pelajaran',
      roles: ['admin']
    },
    {
      title: 'Manajemen Penilaian',
      icon: ClipboardList,
      path: '/manajemen-penilaian',
      roles: ['admin']
    },
    {
      title: 'Profil Lembaga',
      icon: Building,
      path: '/profil-lembaga',
      roles: ['admin']
    },
    {
      title: 'Rekapitulasi',
      icon: FileText,
      path: '/rekapitulasi',
      roles: ['admin', 'supervisor', 'guru']
    },
    {
      title: 'Pengaturan',
      icon: Settings,
      path: '/pengaturan',
      roles: ['admin']
    },
    // Menu untuk guru non-supervisor
    {
      title: 'Jurnal & Presensi',
      icon: Calendar,
      path: '/jurnal-presensi',
      roles: ['guru']
    },
    {
      title: 'Penilaian',
      icon: Award,
      path: '/penilaian',
      roles: ['guru']
    },
    // Menu untuk user (guru dan supervisor)
    {
      title: 'Profil',
      icon: UserCheck,
      path: '/profil',
      roles: ['supervisor', 'guru']
    }
  ]

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(user?.role)
  )

  const handleLogout = () => {
    logout()
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-50
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-0
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Sistem Jurnal</h1>
                <p className="text-xs text-gray-500">Presensi & Penilaian</p>
              </div>
            </div>
            <button
              onClick={onToggle}
              className="lg:hidden p-1 rounded-md hover:bg-gray-100"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                {user?.foto_url ? (
                  <img 
                    src={user.foto_url} 
                    alt={user.nama}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <UserCheck className="w-5 h-5 text-gray-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.nama}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {user?.role}
                  {user?.is_supervisor && ' (Supervisor)'}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => onToggle()}
                  className={`
                    flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors
                    ${isActive 
                      ? 'bg-primary-50 text-primary-600 border-r-2 border-primary-600' 
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.title}</span>
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 w-full px-3 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default Sidebar