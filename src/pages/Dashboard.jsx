import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  ClipboardList, 
  FileText, 
  Calendar,
  TrendingUp,
  Clock,
  UserCheck,
  BarChart3,
  Activity,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

const Dashboard = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState({})
  const [recentData, setRecentData] = useState([])
  const [loading, setLoading] = useState(true)

  const quickAccessItems = [
    // Menu untuk semua role
    {
      title: 'Rekapitulasi',
      description: 'Laporan dan rekap data',
      icon: FileText,
      color: 'bg-indigo-500',
      path: '/rekapitulasi',
      role: 'all'
    },
    // Menu khusus admin
    {
      title: 'Manajemen Guru',
      description: 'Kelola data guru dan staf',
      icon: Users,
      color: 'bg-blue-500',
      path: '/manajemen-guru',
      role: 'admin'
    },
    {
      title: 'Manajemen Siswa',
      description: 'Kelola data siswa',
      icon: GraduationCap,
      color: 'bg-green-500',
      path: '/manajemen-siswa',
      role: 'admin'
    },
    {
      title: 'Mata Pelajaran',
      description: 'Atur mata pelajaran',
      icon: BookOpen,
      color: 'bg-purple-500',
      path: '/mata-pelajaran',
      role: 'admin'
    },
    {
      title: 'Manajemen Penilaian',
      description: 'Kelola jenis penilaian',
      icon: ClipboardList,
      color: 'bg-orange-500',
      path: '/manajemen-penilaian',
      role: 'admin'
    },
    {
      title: 'Profil Lembaga',
      description: 'Informasi lembaga',
      icon: FileText,
      color: 'bg-pink-500',
      path: '/profil-lembaga',
      role: 'admin'
    },
    {
      title: 'Pengaturan',
      description: 'Pengaturan sistem',
      icon: FileText,
      color: 'bg-gray-500',
      path: '/pengaturan',
      role: 'admin'
    },
    // Menu untuk guru non-supervisor
    {
      title: 'Jurnal & Presensi',
      description: 'Input jurnal dan presensi',
      icon: Calendar,
      color: 'bg-teal-500',
      path: '/jurnal-presensi',
      role: 'guru'
    },
    {
      title: 'Penilaian',
      description: 'Input nilai siswa',
      icon: TrendingUp,
      color: 'bg-red-500',
      path: '/penilaian',
      role: 'guru'
    },
    // Menu untuk user (guru dan supervisor)
    {
      title: 'Profil',
      description: 'Kelola profil pribadi',
      icon: UserCheck,
      color: 'bg-cyan-500',
      path: '/profil',
      role: 'user'
    }
  ]

  useEffect(() => {
    fetchDashboardData()
  }, [user])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      if (user?.role === 'admin') {
        await fetchAdminData()
      } else if (user?.role === 'supervisor') {
        await fetchSupervisorData()
      } else if (user?.role === 'guru') {
        await fetchGuruData()
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Terjadi kesalahan saat memuat data')
    } finally {
      setLoading(false)
    }
  }

  const fetchAdminData = async () => {
    const [
      guruResult,
      siswaResult,
      mataPelajaranResult,
      jurnalResult,
      loginData
    ] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact' }).neq('role', 'admin'),
      supabase.from('siswa').select('id', { count: 'exact' }),
      supabase.from('mata_pelajaran').select('id', { count: 'exact' }),
      supabase.from('jurnal').select('id', { count: 'exact' }).eq('tanggal', new Date().toISOString().split('T')[0]),
      supabase
        .from('login_logs')
        .select(`
          user_id,
          login_time,
          users!inner(username, nama)
        `)
        .order('login_time', { ascending: false })
        .limit(10)
    ])

    setStats({
      totalGuru: guruResult.count || 0,
      totalSiswa: siswaResult.count || 0,
      totalMataPelajaran: mataPelajaranResult.count || 0,
      totalJurnalHariIni: jurnalResult.count || 0
    })

    setRecentData(loginData || [])
  }

  const fetchSupervisorData = async () => {
    // Fetch statistics for supervisor
    const [
      jurnalResult,
      presensiResult,
      nilaiResult
    ] = await Promise.all([
      supabase.from('jurnal').select('id', { count: 'exact' }).gte('tanggal', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]),
      supabase.from('presensi_siswa').select('id', { count: 'exact' }).gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      supabase.from('nilai').select('nilai', { count: 'exact', head: false }).gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    ])

    const avgNilai = nilaiResult.data?.length > 0 
      ? (nilaiResult.data.reduce((sum, n) => sum + n.nilai, 0) / nilaiResult.data.length).toFixed(1)
      : 0

    setStats({
      totalJurnalMinggu: jurnalResult.count || 0,
      totalPresensiMinggu: presensiResult.count || 0,
      rataRataNilai: avgNilai,
      totalNilai: nilaiResult.data?.length || 0
    })

    // Fetch recent activities
    const { data: activities } = await supabase
      .from('jurnal')
      .select(`
        *,
        users!inner(nama)
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    setRecentData(activities || [])
  }

  const fetchGuruData = async () => {
    // Fetch data specific to logged-in guru
    const [
      jurnalResult,
      presensiResult,
      nilaiResult,
      jurnalRecent
    ] = await Promise.all([
      supabase.from('jurnal').select('id', { count: 'exact' }).eq('guru_id', user.id),
      supabase.from('presensi_siswa').select('id', { count: 'exact' }).in(
        'jurnal_id',
        supabase.from('jurnal').select('id').eq('guru_id', user.id)
      ),
      supabase.from('nilai').select('id', { count: 'exact' }).eq('guru_id', user.id),
      supabase
        .from('jurnal')
        .select('*')
        .eq('guru_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)
    ])

    setStats({
      totalJurnal: jurnalResult.count || 0,
      totalPresensi: presensiResult.count || 0,
      totalNilai: nilaiResult.count || 0
    })

    setRecentData(jurnalRecent || [])
  }

  const filteredQuickAccess = quickAccessItems.filter(item => {
    if (item.role === 'all') return true
    if (item.role === 'user' && (user?.role === 'supervisor' || user?.role === 'guru')) return true
    if (item.role === user?.role) return true
    return false
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Dashboard {user?.role === 'admin' ? 'Admin' : user?.role === 'supervisor' ? 'Supervisor' : 'Guru'}
        </h1>
        <p className="text-gray-600">
          Selamat datang kembali, {user?.nama}!
        </p>
      </div>

      {/* Stats Cards - Admin */}
      {user?.role === 'admin' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Guru</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalGuru}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
                <GraduationCap className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Siswa</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalSiswa}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-100 rounded-lg p-3">
                <BookOpen className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Mata Pelajaran</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalMataPelajaran}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-orange-100 rounded-lg p-3">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Jurnal Hari Ini</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalJurnalHariIni}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards - Supervisor */}
      {user?.role === 'supervisor' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Jurnal Minggu Ini</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalJurnalMinggu}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
                <UserCheck className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Presensi Minggu Ini</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalPresensiMinggu}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-100 rounded-lg p-3">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rata-rata Nilai</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.rataRataNilai}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-orange-100 rounded-lg p-3">
                <BarChart3 className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Nilai</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalNilai}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards - Guru */}
      {user?.role === 'guru' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Jurnal</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalJurnal}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
                <UserCheck className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Presensi</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalPresensi}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-100 rounded-lg p-3">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Nilai</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalNilai}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Access */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Akses Cepat</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredQuickAccess.map((item, index) => {
            const Icon = item.icon
            return (
              <Link
                key={index}
                to={item.path}
                className="flex items-center space-x-3 p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all"
              >
                <div className={`flex-shrink-0 ${item.color} rounded-lg p-2`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.title}</p>
                  <p className="text-xs text-gray-500">{item.description}</p>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {user?.role === 'admin' ? '10 Login Terakhir' : 
             user?.role === 'supervisor' ? 'Aktivitas Terkini' :
             '10 Jurnal Terakhir'}
          </h2>
          {user?.role === 'admin' ? (
            <Clock className="h-5 w-5 text-gray-400" />
          ) : user?.role === 'supervisor' ? (
            <Activity className="h-5 w-5 text-gray-400" />
          ) : (
            <FileText className="h-5 w-5 text-gray-400" />
          )}
        </div>
        
        {recentData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {user?.role === 'admin' && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Username
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nama
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Waktu Login
                      </th>
                    </>
                  )}
                  {user?.role === 'supervisor' && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Guru
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Kegiatan
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tanggal
                      </th>
                    </>
                  )}
                  {user?.role === 'guru' && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tanggal
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Materi/Kegiatan
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentData.map((item, index) => (
                  <tr key={index}>
                    {user?.role === 'admin' && (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.username}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.nama}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(item.login_time).toLocaleString('id-ID')}
                        </td>
                      </>
                    )}
                    {user?.role === 'supervisor' && (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.users.nama}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            item.status === 'pengajar' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(item.created_at).toLocaleString('id-ID')}
                        </td>
                      </>
                    )}
                    {user?.role === 'guru' && (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(item.tanggal).toLocaleDateString('id-ID')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            item.status === 'pengajar' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-md truncate">
                          {item.materi_kegiatan}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            {user?.role === 'admin' ? (
              <UserCheck className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            ) : user?.role === 'supervisor' ? (
              <Activity className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            ) : (
              <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            )}
            <p>Belum ada data {user?.role === 'admin' ? 'login' : user?.role === 'supervisor' ? 'aktivitas' : 'jurnal'}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard