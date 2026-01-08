import React, { useState, useEffect } from 'react'
import { 
  Download, 
  FileText, 
  Users, 
  Calendar, 
  TrendingUp, 
  Filter,
  Search,
  BarChart3,
  BookOpen,
  UserCheck,
  Clock
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { exportToPDF, exportToExcel, formatDate } from '../utils/exportUtils'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

const Rekapitulasi = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('presensi-siswa')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterData, setFilterData] = useState({
    kelas: '',
    tanggal_mulai: '',
    tanggal_selesai: '',
    mata_pelajaran_id: '',
    semester: '',
    tahun_ajaran: ''
  })
  const [rekapData, setRekapData] = useState([])
  const [stats, setStats] = useState({})
  const [kelasList, setKelasList] = useState([])
  const [mataPelajaranList, setMataPelajaranList] = useState([])
  const [exportLoading, setExportLoading] = useState(false)

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    if (activeTab) {
      fetchRekapData()
    }
  }, [activeTab, filterData])

  const fetchInitialData = async () => {
    try {
      const [siswaResult, mataPelajaranResult] = await Promise.all([
        supabase.from('siswa').select('kelas'),
        supabase.from('mata_pelajaran').select('*')
      ])

      if (siswaResult.data) {
        const uniqueKelas = [...new Set(siswaResult.data.map(s => s.kelas))].sort()
        setKelasList(uniqueKelas)
      }

      if (mataPelajaranResult.data) {
        setMataPelajaranList(mataPelajaranResult.data)
      }
    } catch (error) {
      console.error('Error fetching initial data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRekapData = async () => {
    try {
      setLoading(true)
      let data = []
      let statsData = {}

      switch (activeTab) {
        case 'presensi-siswa':
          await fetchPresensiSiswa()
          break
        case 'presensi-guru':
          await fetchPresensiGuru()
          break
        case 'jurnal':
          await fetchJurnalData()
          break
        case 'nilai':
          await fetchNilaiData()
          break
        default:
          break
      }
    } catch (error) {
      console.error('Error fetching rekap data:', error)
      toast.error('Gagal memuat data rekapitulasi')
    } finally {
      setLoading(false)
    }
  }

  const fetchPresensiSiswa = async () => {
    try {
      const { data, error } = await supabase.rpc('get_rekap_presensi_siswa', {
        p_kelas: filterData.kelas || null,
        p_tanggal_mulai: filterData.tanggal_mulai || null,
        p_tanggal_selesai: filterData.tanggal_selesai || null
      })

      if (error) throw error

      setRekapData(data || [])
      
      // Calculate stats
      const totalSiswa = data?.length || 0
      const totalHadir = data?.reduce((sum, s) => sum + s.total_hadir, 0) || 0
      const totalAlpha = data?.reduce((sum, s) => sum + s.total_alpha, 0) || 0
      const totalSakit = data?.reduce((sum, s) => sum + s.total_sakit, 0) || 0
      const totalIzin = data?.reduce((sum, s) => sum + s.total_izin, 0) || 0

      setStats({
        totalSiswa,
        totalHadir,
        totalAlpha,
        totalSakit,
        totalIzin,
        persentaseHadir: totalSiswa > 0 ? ((totalHadir / (totalHadir + totalAlpha + totalSakit + totalIzin)) * 100).toFixed(1) : 0
      })
    } catch (error) {
      console.error('Error fetching presensi siswa:', error)
      throw error
    }
  }

  const fetchPresensiGuru = async () => {
    try {
      let query = supabase
        .from('presensi_guru')
        .select(`
          *,
          users!inner(nama, role)
        `)

      if (filterData.tanggal_mulai) {
        query = query.gte('tanggal', filterData.tanggal_mulai)
      }
      if (filterData.tanggal_selesai) {
        query = query.lte('tanggal', filterData.tanggal_selesai)
      }

      const { data, error } = await query.order('tanggal', { ascending: false })

      if (error) throw error

      setRekapData(data || [])

      // Calculate stats
      const totalPresensi = data?.length || 0
      const hadir = data?.filter(p => p.status === 'hadir').length || 0
      const alpha = data?.filter(p => p.status === 'alpha').length || 0
      const sakit = data?.filter(p => p.status === 'sakit').length || 0
      const izin = data?.filter(p => p.status === 'izin').length || 0

      setStats({
        totalPresensi,
        hadir,
        alpha,
        sakit,
        izin,
        persentaseHadir: totalPresensi > 0 ? ((hadir / totalPresensi) * 100).toFixed(1) : 0
      })
    } catch (error) {
      console.error('Error fetching presensi guru:', error)
      throw error
    }
  }

  const fetchJurnalData = async () => {
    try {
      let query = supabase
        .from('jurnal')
        .select(`
          *,
          users!inner(nama)
        `)

      if (filterData.tanggal_mulai) {
        query = query.gte('tanggal', filterData.tanggal_mulai)
      }
      if (filterData.tanggal_selesai) {
        query = query.lte('tanggal', filterData.tanggal_selesai)
      }

      const { data, error } = await query.order('tanggal', { ascending: false })

      if (error) throw error

      setRekapData(data || [])

      // Calculate stats
      const totalJurnal = data?.length || 0
      const jurnalPengajar = data?.filter(j => j.status === 'pengajar').length || 0
      const jurnalPiket = data?.filter(j => j.status === 'piket').length || 0

      setStats({
        totalJurnal,
        jurnalPengajar,
        jurnalPiket
      })
    } catch (error) {
      console.error('Error fetching jurnal data:', error)
      throw error
    }
  }

  const fetchNilaiData = async () => {
    try {
      const { data, error } = await supabase.rpc('get_rekap_nilai_siswa', {
        p_kelas: filterData.kelas || null,
        p_mata_pelajaran_id: filterData.mata_pelajaran_id || null,
        p_semester: filterData.semester || null,
        p_tahun_ajaran: filterData.tahun_ajaran || null
      })

      if (error) throw error

      setRekapData(data || [])

      // Calculate stats
      const totalNilai = data?.length || 0
      const rataRata = data?.length > 0 
        ? (data.reduce((sum, n) => sum + parseFloat(n.nilai), 0) / data.length).toFixed(2)
        : 0

      setStats({
        totalNilai,
        rataRata,
        nilaiTertinggi: data?.length > 0 ? Math.max(...data.map(n => parseFloat(n.nilai))) : 0,
        nilaiTerendah: data?.length > 0 ? Math.min(...data.map(n => parseFloat(n.nilai))) : 0
      })
    } catch (error) {
      console.error('Error fetching nilai data:', error)
      throw error
    }
  }

  const handleExportPDF = async () => {
    setExportLoading(true)
    try {
      const filename = `Rekap_${activeTab}_${new Date().toISOString().split('T')[0]}.pdf`
      const title = `Rekapitulasi ${activeTab.replace('-', ' ').toUpperCase()}`
      await exportToPDF('rekap-table', filename, title)
    } catch (error) {
      console.error('Error exporting PDF:', error)
      toast.error('Gagal mengekspor PDF')
    } finally {
      setExportLoading(false)
    }
  }

  const handleExportExcel = () => {
    try {
      let exportData = []
      let filename = ''

      switch (activeTab) {
        case 'presensi-siswa':
          exportData = rekapData.map(item => ({
            NIS: item.nis,
            Nama: item.nama,
            Kelas: item.kelas,
            'Total Hadir': item.total_hadir,
            'Total Alpha': item.total_alpha,
            'Total Sakit': item.total_sakit,
            'Total Izin': item.total_izin
          }))
          filename = `Rekap_Presensi_Siswa_${new Date().toISOString().split('T')[0]}.xlsx`
          break
        case 'presensi-guru':
          exportData = rekapData.map(item => ({
            Tanggal: formatDate(item.tanggal, 'dateOnly'),
            'Nama Guru': item.users.nama,
            Status: item.status,
            Role: item.users.role
          }))
          filename = `Rekap_Presensi_Guru_${new Date().toISOString().split('T')[0]}.xlsx`
          break
        case 'jurnal':
          exportData = rekapData.map(item => ({
            Tanggal: formatDate(item.tanggal, 'dateOnly'),
            'Nama Guru': item.users.nama,
            Status: item.status,
            'Materi/Kegiatan': item.materi_kegiatan
          }))
          filename = `Rekap_Jurnal_${new Date().toISOString().split('T')[0]}.xlsx`
          break
        case 'nilai':
          exportData = rekapData.map(item => ({
            NIS: item.nis,
            Nama: item.nama,
            Kelas: item.kelas,
            'Mata Pelajaran': item.mata_pelajaran,
            'Jenis Penilaian': item.jenis_penilaian,
            Nilai: item.nilai
          }))
          filename = `Rekap_Nilai_${new Date().toISOString().split('T')[0]}.xlsx`
          break
      }

      exportToExcel(exportData, filename)
      toast.success('Data berhasil diexport ke Excel')
    } catch (error) {
      console.error('Error exporting Excel:', error)
      toast.error('Gagal mengekspor Excel')
    }
  }

  const filteredData = rekapData.filter(item => {
    if (!searchTerm) return true
    
    switch (activeTab) {
      case 'presensi-siswa':
        return item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
               item.nis.toLowerCase().includes(searchTerm.toLowerCase()) ||
               item.kelas.toLowerCase().includes(searchTerm.toLowerCase())
      case 'presensi-guru':
        return item.users.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
               item.status.toLowerCase().includes(searchTerm.toLowerCase())
      case 'jurnal':
        return item.users.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
               item.materi_kegiatan.toLowerCase().includes(searchTerm.toLowerCase())
      case 'nilai':
        return item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
               item.mata_pelajaran.toLowerCase().includes(searchTerm.toLowerCase()) ||
               item.jenis_penilaian.toLowerCase().includes(searchTerm.toLowerCase())
      default:
        return true
    }
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rekapitulasi</h1>
          <p className="text-gray-600">Laporan lengkap data kehadiran, jurnal, dan penilaian</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button 
            onClick={handleExportExcel}
            className="btn btn-secondary flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export Excel</span>
          </button>
          <button 
            onClick={handleExportPDF}
            disabled={exportLoading}
            className="btn btn-primary flex items-center space-x-2"
          >
            <FileText className="w-4 h-4" />
            <span>{exportLoading ? 'Mengekspor...' : 'Export PDF'}</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {activeTab === 'presensi-siswa' && (
          <>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Siswa</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalSiswa || 0}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
                  <UserCheck className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Hadir</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalHadir || 0}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-red-100 rounded-lg p-3">
                  <Clock className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Alpha</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalAlpha || 0}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-purple-100 rounded-lg p-3">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">% Kehadiran</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.persentaseHadir || 0}%</p>
                </div>
              </div>
            </div>
          </>
        )}
        
        {activeTab === 'presensi-guru' && (
          <>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Presensi</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalPresensi || 0}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
                  <UserCheck className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Hadir</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.hadir || 0}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-red-100 rounded-lg p-3">
                  <Clock className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Alpha</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.alpha || 0}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-purple-100 rounded-lg p-3">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">% Kehadiran</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.persentaseHadir || 0}%</p>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'jurnal' && (
          <>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Jurnal</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalJurnal || 0}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
                  <BookOpen className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pengajar</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.jurnalPengajar || 0}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-orange-100 rounded-lg p-3">
                  <UserCheck className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Piket</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.jurnalPiket || 0}</p>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'nilai' && (
          <>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Nilai</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalNilai || 0}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Rata-rata</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.rataRata || 0}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-purple-100 rounded-lg p-3">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Tertinggi</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.nilaiTertinggi || 0}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-red-100 rounded-lg p-3">
                  <Clock className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Terendah</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.nilaiTerendah || 0}</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Cari data..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          {(activeTab === 'presensi-siswa' || activeTab === 'nilai') && (
            <select
              value={filterData.kelas}
              onChange={(e) => setFilterData({ ...filterData, kelas: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Semua Kelas</option>
              {kelasList.map(kelas => (
                <option key={kelas} value={kelas}>{kelas}</option>
              ))}
            </select>
          )}

          {activeTab === 'nilai' && (
            <>
              <select
                value={filterData.mata_pelajaran_id}
                onChange={(e) => setFilterData({ ...filterData, mata_pelajaran_id: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Semua Mata Pelajaran</option>
                {mataPelajaranList.map(mp => (
                  <option key={mp.id} value={mp.id}>{mp.nama}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Semester"
                value={filterData.semester}
                onChange={(e) => setFilterData({ ...filterData, semester: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </>
          )}

          {(activeTab === 'presensi-siswa' || activeTab === 'presensi-guru' || activeTab === 'jurnal') && (
            <>
              <input
                type="date"
                value={filterData.tanggal_mulai}
                onChange={(e) => setFilterData({ ...filterData, tanggal_mulai: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <input
                type="date"
                value={filterData.tanggal_selesai}
                onChange={(e) => setFilterData({ ...filterData, tanggal_selesai: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('presensi-siswa')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'presensi-siswa'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Presensi Siswa
            </button>
            <button
              onClick={() => setActiveTab('presensi-guru')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'presensi-guru'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Presensi Guru
            </button>
            <button
              onClick={() => setActiveTab('jurnal')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'jurnal'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Jurnal
            </button>
            <button
              onClick={() => setActiveTab('nilai')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'nilai'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Nilai
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Table */}
          <div id="rekap-table" className="overflow-x-auto">
            {activeTab === 'presensi-siswa' && (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NIS</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kelas</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hadir</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alpha</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sakit</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Izin</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredData.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.nis}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.nama}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.kelas}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">{item.total_hadir}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">{item.total_alpha}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">{item.total_sakit}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">{item.total_izin}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'presensi-guru' && (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Guru</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredData.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(item.tanggal, 'dateOnly')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.users.nama}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 capitalize">{item.users.role}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          item.status === 'hadir' ? 'bg-green-100 text-green-800' :
                          item.status === 'alpha' ? 'bg-red-100 text-red-800' :
                          item.status === 'sakit' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>{item.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'jurnal' && (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guru</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Materi/Kegiatan</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredData.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(item.tanggal, 'dateOnly')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.users.nama}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          item.status === 'pengajar' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                        }`}>{item.status}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-md truncate">{item.materi_kegiatan}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'nilai' && (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NIS</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kelas</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mata Pelajaran</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jenis Penilaian</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nilai</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredData.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.nis}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.nama}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.kelas}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.mata_pelajaran}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.jenis_penilaian}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                          parseFloat(item.nilai) >= 80 ? 'bg-green-100 text-green-800' :
                          parseFloat(item.nilai) >= 60 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>{item.nilai}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {filteredData.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>Tidak ada data yang ditemukan</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Rekapitulasi