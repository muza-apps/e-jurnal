import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  BookOpen, 
  ClipboardList, 
  FileText, 
  Settings, 
  UserCheck,
  Calendar,
  Award,
  Building
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const BottomNavbar = () => {
  const { user } = useAuth()
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
      title: 'Guru',
      icon: Users,
      path: '/manajemen-guru',
      roles: ['admin']
    },
    {
      title: 'Siswa',
      icon: GraduationCap,
      path: '/manajemen-siswa',
      roles: ['admin']
    },
    // Menu untuk guru non-supervisor
    {
      title: 'Jurnal',
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
    // Menu untuk semua role
    {
      title: 'Rekap',
      icon: FileText,
      path: '/rekapitulasi',
      roles: ['admin', 'supervisor', 'guru']
    },
    // Menu untuk user
    {
      title: 'Profil',
      icon: UserCheck,
      path: '/profil',
      roles: ['supervisor', 'guru']
    },
    // Menu khusus admin
    {
      title: 'Pengaturan',
      icon: Settings,
      path: '/pengaturan',
      roles: ['admin']
    }
  ]

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(user?.role)
  )

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 md:hidden">
      <div className="flex justify-around items-center h-16 px-2">
        {filteredMenuItems.slice(0, 5).map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex flex-col items-center justify-center space-y-1 px-2 py-1 rounded-lg transition-colors min-w-0 flex-1
                ${isActive 
                  ? 'text-primary-600' 
                  : 'text-gray-500 hover:text-gray-700'
                }
              `}
              title={item.title}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium truncate w-full text-center">
                {item.title}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export default BottomNavbar