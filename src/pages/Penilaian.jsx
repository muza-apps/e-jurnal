import React, { useState, useEffect } from 'react'
import { 
  TrendingUp, 
  Save, 
  Search, 
  Filter, 
  Plus,
  Edit2,
  Trash2,
  BookOpen,
  Users,
  GraduationCap,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import toast from 'react-hot-toast'

const Penilaian = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [nilaiList, setNilaiList] = useState([])
  const [siswaList, setSiswaList] = useState([])
  const [mataPelajaranList, setMataPelajaranList] = useState([])
  const [jenisPenilaianList, setJenisPenilaianList] = useState([])
  const [kelasList, setKelasList] = useState([])
  const [formData, setFormData] = useState({
    siswa_id: '',
    mata_pelajaran_id: '',
    jenis_penilaian_id: '',
    nilai: '',
    semester: '',
    tahun_ajaran: ''
  })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [selectedNilai, setSelectedNilai] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterData, setFilterData] = useState({
    kelas: '',
    mata_pelajaran_id: '',
    jenis_penilaian_id: '',
    semester: '',
    tahun_ajaran: ''
  })

  useEffect(() => {
    fetchInitialData()
    fetchNilaiList()
  }, [])

  useEffect(() => {
    if (formData.mata_pelajaran_id) {
      fetchSiswaForMataPelajaran()
    }
  }, [formData.mata_pelajaran_id])

  const fetchInitialData = async () => {
    try {
      const [
        guruMataPelajaranResult,
        jenisPenilaianResult,
        siswaResult
      ] = await Promise.all([
        supabase
          .from('guru_mata_pelajaran')
          .select(`
            *,
            mata_pelajaran!inner(nama, id)
          `)
          .eq('guru_id', user.id),
        supabase.from('jenis_penilaian').select('*'),
        supabase.from('siswa').select('kelas')
      ])

      if (guruMataPelajaranResult.data) {
        setMataPelajaranList(guruMataPelajaranResult.data)
      }

      if (jenisPenilaianResult.data) {
        setJenisPenilaianList(jenisPenilaianResult.data)
      }

      if (siswaResult.data) {
        const uniqueKelas = [...new Set(siswaResult.data.map(s => s.kelas))].sort()
        setKelasList(uniqueKelas)
      }
    } catch (error) {
      console.error('Error fetching initial data:', error)
      toast.error('Gagal memuat data awal')
    }
  }

  const fetchSiswaForMataPelajaran = async () => {
    try {
      if (!formData.mata_pelajaran_id) return

      const selectedMataPelajaran = mataPelajaranList.find(mp => mp.mata_pelajaran_id === formData.mata_pelajaran_id)
      if (!selectedMataPelajaran) return

      const { data, error } = await supabase
        .from('siswa')
        .select('*')
        .eq('kelas', selectedMataPelajaran.kelas)
        .order('nama')

      if (error) throw error
      setSiswaList(data || [])
    } catch (error) {
      console.error('Error fetching siswa:', error)
      toast.error('Gagal memuat data siswa')
    }
  }

  const fetchNilaiList = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('nilai')
        .select(`
          *,
          siswa!inner(nama, nis, kelas),
          mata_pelajaran!inner(nama),
          jenis_penilaian!inner(nama)
        `)
        .eq('guru_id', user.id)

      // Apply filters
      if (filterData.kelas) {
        query = query.eq('siswa.kelas', filterData.kelas)
      }
      if (filterData.mata_pelajaran_id) {
        query = query.eq('mata_pelajaran_id', filterData.mata_pelajaran_id)
      }
      if (filterData.jenis_penilaian_id) {
        query = query.eq('jenis_penilaian_id', filterData.jenis_penilaian_id)
      }
      if (filterData.semester) {
        query = query.eq('semester', filterData.semester)
      }
      if (filterData.tahun_ajaran) {
        query = query.eq('tahun_ajaran', filterData.tahun_ajaran)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error
      setNilaiList(data || [])
    } catch (error) {
      console.error('Error fetching nilai:', error)
      toast.error('Gagal memuat data nilai')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setSaving(true)

      const submitData = {
        ...formData,
        guru_id: user.id,
        nilai: parseFloat(formData.nilai)
      }

      if (selectedNilai) {
        // Update
        const { error } = await supabase
          .from('nilai')
          .update(submitData)
          .eq('id', selectedNilai.id)

        if (error) throw error
        toast.success('Nilai berhasil diperbarui')
      } else {
        // Insert
        const { error } = await supabase
          .from('nilai')
          .insert(submitData)

        if (error) throw error
        toast.success('Nilai berhasil ditambahkan')
      }

      setIsModalOpen(false)
      resetForm()
      fetchNilaiList()
    } catch (error) {
      console.error('Error saving nilai:', error)
      if (error.code === '23505') {
        toast.error('Nilai untuk siswa ini sudah ada')
      } else {
        toast.error('Gagal menyimpan nilai')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('nilai')
        .delete()
        .eq('id', selectedNilai.id)

      if (error) throw error
      toast.success('Nilai berhasil dihapus')
      setIsConfirmOpen(false)
      setSelectedNilai(null)
      fetchNilaiList()
    } catch (error) {
      console.error('Error deleting nilai:', error)
      toast.error('Gagal menghapus nilai')
    }
  }

  const resetForm = () => {
    setFormData({
      siswa_id: '',
      mata_pelajaran_id: '',
      jenis_penilaian_id: '',
      nilai: '',
      semester: '',
      tahun_ajaran: ''
    })
    setSelectedNilai(null)
    setSiswaList([])
  }

  const openModal = (nilai = null) => {
    if (nilai) {
      setFormData({
        siswa_id: nilai.siswa_id,
        mata_pelajaran_id: nilai.mata_pelajaran_id,
        jenis_penilaian_id: nilai.jenis_penilaian_id,
        nilai: nilai.nilai,
        semester: nilai.semester,
        tahun_ajaran: nilai.tahun_ajaran
      })
      setSelectedNilai(nilai)
    } else {
      resetForm()
    }
    setIsModalOpen(true)
  }

  const openConfirmDialog = (nilai) => {
    setSelectedNilai(nilai)
    setIsConfirmOpen(true)
  }

  const getNilaiColor = (nilai) => {
    if (nilai >= 80) return 'text-green-600 bg-green-50'
    if (nilai >= 60) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  const getNilaiLabel = (nilai) => {
    if (nilai >= 80) return 'A'
    if (nilai >= 70) return 'B'
    if (nilai >= 60) return 'C'
    if (nilai >= 50) return 'D'
    return 'E'
  }

  const filteredNilai = nilaiList.filter(nilai => {
    const matchesSearch = 
      nilai.siswa.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nilai.siswa.nis.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nilai.mata_pelajaran.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nilai.jenis_penilaian.nama.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  const stats = {
    totalNilai: nilaiList.length,
    rataRata: nilaiList.length > 0 
      ? (nilaiList.reduce((sum, n) => sum + n.nilai, 0) / nilaiList.length).toFixed(1)
      : 0,
    nilaiTertinggi: nilaiList.length > 0 ? Math.max(...nilaiList.map(n => n.nilai)) : 0,
    nilaiTerendah: nilaiList.length > 0 ? Math.min(...nilaiList.map(n => n.nilai)) : 0
  }

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
          <h1 className="text-2xl font-bold text-gray-900">Penilaian</h1>
          <p className="text-gray-600">Input nilai siswa</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button 
            onClick={() => openModal()}
            className="btn btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Input Nilai</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Nilai</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalNilai}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Rata-rata</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.rataRata}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-purple-100 rounded-lg p-3">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tertinggi</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.nilaiTertinggi}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-red-100 rounded-lg p-3">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Terendah</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.nilaiTerendah}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Cari nilai..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
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

          <select
            value={filterData.mata_pelajaran_id}
            onChange={(e) => setFilterData({ ...filterData, mata_pelajaran_id: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Semua Mata Pelajaran</option>
            {mataPelajaranList.map(mp => (
              <option key={mp.mata_pelajaran_id} value={mp.mata_pelajaran_id}>
                {mp.mata_pelajaran.nama}
              </option>
            ))}
          </select>

          <select
            value={filterData.jenis_penilaian_id}
            onChange={(e) => setFilterData({ ...filterData, jenis_penilaian_id: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Semua Jenis</option>
            {jenisPenilaianList.map(jp => (
              <option key={jp.id} value={jp.id}>{jp.nama}</option>
            ))}
          </select>

          <select
            value={filterData.semester}
            onChange={(e) => setFilterData({ ...filterData, semester: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Semua Semester</option>
            <option value="Ganjil">Ganjil</option>
            <option value="Genap">Genap</option>
          </select>

          <input
            type="text"
            placeholder="Tahun Ajaran"
            value={filterData.tahun_ajaran}
            onChange={(e) => setFilterData({ ...filterData, tahun_ajaran: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  NIS
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nama Siswa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kelas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mata Pelajaran
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Jenis Penilaian
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Semester
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nilai
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredNilai.map((nilai) => (
                <tr key={nilai.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {nilai.siswa.nis}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {nilai.siswa.nama}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                      {nilai.siswa.kelas}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {nilai.mata_pelajaran.nama}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {nilai.jenis_penilaian.nama}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {nilai.semester}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${getNilaiColor(nilai.nilai)}`}>
                        {nilai.nilai}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${getNilaiColor(nilai.nilai)}`}>
                        {getNilaiLabel(nilai.nilai)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openModal(nilai)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openConfirmDialog(nilai)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredNilai.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <TrendingUp className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>Belum ada data nilai</p>
          </div>
        )}
      </div>

      {/* Modal Form */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedNilai ? 'Edit Nilai' : 'Input Nilai Baru'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mata Pelajaran
              </label>
              <select
                value={formData.mata_pelajaran_id}
                onChange={(e) => setFormData({ ...formData, mata_pelajaran_id: e.target.value })}
                required
                className="input"
              >
                <option value="">Pilih Mata Pelajaran</option>
                {mataPelajaranList.map(mp => (
                  <option key={mp.mata_pelajaran_id} value={mp.mata_pelajaran_id}>
                    {mp.mata_pelajaran.nama} ({mp.kelas})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Jenis Penilaian
              </label>
              <select
                value={formData.jenis_penilaian_id}
                onChange={(e) => setFormData({ ...formData, jenis_penilaian_id: e.target.value })}
                required
                className="input"
              >
                <option value="">Pilih Jenis Penilaian</option>
                {jenisPenilaianList.map(jp => (
                  <option key={jp.id} value={jp.id}>{jp.nama}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Siswa
              </label>
              <select
                value={formData.siswa_id}
                onChange={(e) => setFormData({ ...formData, siswa_id: e.target.value })}
                required
                className="input"
                disabled={!formData.mata_pelajaran_id}
              >
                <option value="">Pilih Siswa</option>
                {siswaList.map(siswa => (
                  <option key={siswa.id} value={siswa.id}>
                    {siswa.nis} - {siswa.nama}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nilai (0-100)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.nilai}
                onChange={(e) => setFormData({ ...formData, nilai: e.target.value })}
                required
                className="input"
                placeholder="0-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Semester
              </label>
              <select
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                required
                className="input"
              >
                <option value="">Pilih Semester</option>
                <option value="Ganjil">Ganjil</option>
                <option value="Genap">Genap</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tahun Ajaran
              </label>
              <input
                type="text"
                value={formData.tahun_ajaran}
                onChange={(e) => setFormData({ ...formData, tahun_ajaran: e.target.value })}
                required
                className="input"
                placeholder="Contoh: 2023/2024"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn btn-secondary"
            >
              Batal
            </button>
            <button type="submit" disabled={saving} className="btn btn-primary">
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Hapus Nilai"
        message={`Apakah Anda yakin ingin menghapus nilai ini?`}
        type="danger"
      />
    </div>
  )
}

export default Penilaian