import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Upload, Download, Search, Filter, Users, GraduationCap } from 'lucide-react'
import { supabase } from '../lib/supabase'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import { generateExcelTemplate, parseExcelFile, exportToExcel } from '../utils/exportUtils'
import toast from 'react-hot-toast'

const ManajemenSiswa = () => {
  const [siswaList, setSiswaList] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterKelas, setFilterKelas] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [selectedSiswa, setSelectedSiswa] = useState(null)
  const [formData, setFormData] = useState({
    nis: '',
    nama: '',
    kelas: ''
  })
  const [kelasList, setKelasList] = useState([])

  useEffect(() => {
    fetchSiswa()
  }, [])

  const fetchSiswa = async () => {
    try {
      let query = supabase
        .from('siswa')
        .select('*')
        .order('kelas', { ascending: true })

      if (filterKelas) {
        query = query.eq('kelas', filterKelas)
      }

      const { data, error } = await query

      if (error) throw error
      setSiswaList(data || [])

      // Extract unique kelas for filter
      const uniqueKelas = [...new Set(data?.map(s => s.kelas) || [])].sort()
      setKelasList(uniqueKelas)
    } catch (error) {
      console.error('Error fetching siswa:', error)
      toast.error('Gagal memuat data siswa')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (selectedSiswa) {
        // Update
        const { error } = await supabase
          .from('siswa')
          .update(formData)
          .eq('id', selectedSiswa.id)

        if (error) throw error
        toast.success('Data siswa berhasil diperbarui')
      } else {
        // Insert
        const { error } = await supabase
          .from('siswa')
          .insert(formData)

        if (error) throw error
        toast.success('Data siswa berhasil ditambahkan')
      }

      setIsModalOpen(false)
      resetForm()
      fetchSiswa()
    } catch (error) {
      console.error('Error saving siswa:', error)
      if (error.code === '23505') {
        toast.error('NIS sudah terdaftar')
      } else {
        toast.error('Gagal menyimpan data siswa')
      }
    }
  }

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('siswa')
        .delete()
        .eq('id', selectedSiswa.id)

      if (error) throw error
      toast.success('Data siswa berhasil dihapus')
      setIsConfirmOpen(false)
      setSelectedSiswa(null)
      fetchSiswa()
    } catch (error) {
      console.error('Error deleting siswa:', error)
      toast.error('Gagal menghapus data siswa')
    }
  }

  const handleImportExcel = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      const data = await parseExcelFile(file)
      
      if (data.length === 0) {
        toast.error('File Excel kosong')
        return
      }

      // Validate required columns
      const requiredColumns = ['nis', 'nama', 'kelas']
      const firstRow = data[0]
      const missingColumns = requiredColumns.filter(col => !(col in firstRow))
      
      if (missingColumns.length > 0) {
        toast.error(`Kolom yang diperlukan: ${missingColumns.join(', ')}`)
        return
      }

      // Process data
      const processedData = data.map(row => ({
        nis: String(row.nis).trim(),
        nama: String(row.nama).trim(),
        kelas: String(row.kelas).trim()
      })).filter(row => row.nis && row.nama && row.kelas)

      if (processedData.length === 0) {
        toast.error('Tidak ada data valid untuk diimport')
        return
      }

      // Insert to database
      const { error } = await supabase
        .from('siswa')
        .insert(processedData)

      if (error) throw error
      
      toast.success(`${processedData.length} data siswa berhasil diimport`)
      fetchSiswa()
      
      // Reset file input
      e.target.value = ''
    } catch (error) {
      console.error('Error importing Excel:', error)
      toast.error('Gagal mengimport file Excel')
    }
  }

  const handleExportExcel = () => {
    const exportData = siswaList.map(siswa => ({
      NIS: siswa.nis,
      Nama: siswa.nama,
      Kelas: siswa.kelas
    }))
    
    exportToExcel(exportData, `Data_Siswa_${new Date().toISOString().split('T')[0]}.xlsx`)
    toast.success('Data berhasil diexport')
  }

  const downloadTemplate = () => {
    generateExcelTemplate(['nis', 'nama', 'kelas'], 'Template_Import_Siswa.xlsx')
    toast.success('Template berhasil diunduh')
  }

  const resetForm = () => {
    setFormData({
      nis: '',
      nama: '',
      kelas: ''
    })
    setSelectedSiswa(null)
  }

  const openModal = (siswa = null) => {
    if (siswa) {
      setFormData({
        nis: siswa.nis,
        nama: siswa.nama,
        kelas: siswa.kelas
      })
      setSelectedSiswa(siswa)
    } else {
      resetForm()
    }
    setIsModalOpen(true)
  }

  const openConfirmDialog = (siswa) => {
    setSelectedSiswa(siswa)
    setIsConfirmOpen(true)
  }

  const filteredSiswa = siswaList.filter(siswa => {
    const matchesSearch = siswa.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         siswa.nis.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesKelas = !filterKelas || siswa.kelas === filterKelas
    return matchesSearch && matchesKelas
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
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Siswa</h1>
          <p className="text-gray-600">Kelola data siswa</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button 
            onClick={downloadTemplate}
            className="btn btn-secondary flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Template</span>
          </button>
          <label className="btn btn-secondary flex items-center space-x-2 cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>Import Excel</span>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleImportExcel}
              className="hidden"
            />
          </label>
          <button 
            onClick={handleExportExcel}
            className="btn btn-secondary flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          <button 
            onClick={() => openModal()}
            className="btn btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Siswa</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Siswa</p>
              <p className="text-2xl font-semibold text-gray-900">{siswaList.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
              <GraduationCap className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Kelas</p>
              <p className="text-2xl font-semibold text-gray-900">{kelasList.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-purple-100 rounded-lg p-3">
              <Filter className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Filter Aktif</p>
              <p className="text-2xl font-semibold text-gray-900">
                {filterKelas || 'Semua'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Cari siswa berdasarkan nama atau NIS..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <select
            value={filterKelas}
            onChange={(e) => setFilterKelas(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Semua Kelas</option>
            {kelasList.map(kelas => (
              <option key={kelas} value={kelas}>{kelas}</option>
            ))}
          </select>
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
                  Nama Lengkap
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kelas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSiswa.map((siswa) => (
                <tr key={siswa.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {siswa.nis}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {siswa.nama}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                      {siswa.kelas}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openModal(siswa)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openConfirmDialog(siswa)}
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
        
        {filteredSiswa.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <GraduationCap className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>Tidak ada data siswa yang ditemukan</p>
          </div>
        )}
      </div>

      {/* Modal Form */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedSiswa ? 'Edit Data Siswa' : 'Tambah Data Siswa'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              NIS
            </label>
            <input
              type="text"
              value={formData.nis}
              onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
              required
              className="input"
              placeholder="Nomor Induk Siswa"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama Lengkap
            </label>
            <input
              type="text"
              value={formData.nama}
              onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
              required
              className="input"
              placeholder="Nama lengkap siswa"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kelas
            </label>
            <input
              type="text"
              value={formData.kelas}
              onChange={(e) => setFormData({ ...formData, kelas: e.target.value })}
              required
              className="input"
              placeholder="Contoh: X-1, XI-2, XII-3"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn btn-secondary"
            >
              Batal
            </button>
            <button type="submit" className="btn btn-primary">
              {selectedSiswa ? 'Update' : 'Simpan'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Hapus Data Siswa"
        message={`Apakah Anda yakin ingin menghapus data siswa "${selectedSiswa?.nama}" (${selectedSiswa?.nis})?`}
        type="danger"
      />
    </div>
  )
}

export default ManajemenSiswa