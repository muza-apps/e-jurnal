import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Search, ClipboardList, FileText, Info } from 'lucide-react'
import { supabase } from '../lib/supabase'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import toast from 'react-hot-toast'

const ManajemenPenilaian = () => {
  const [penilaianList, setPenilaianList] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [selectedPenilaian, setSelectedPenilaian] = useState(null)
  const [formData, setFormData] = useState({
    nama: '',
    keterangan: ''
  })

  useEffect(() => {
    fetchPenilaian()
  }, [])

  const fetchPenilaian = async () => {
    try {
      const { data, error } = await supabase
        .from('jenis_penilaian')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setPenilaianList(data || [])
    } catch (error) {
      console.error('Error fetching penilaian:', error)
      toast.error('Gagal memuat data penilaian')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (selectedPenilaian) {
        // Update
        const { error } = await supabase
          .from('jenis_penilaian')
          .update(formData)
          .eq('id', selectedPenilaian.id)

        if (error) throw error
        toast.success('Jenis penilaian berhasil diperbarui')
      } else {
        // Insert
        const { error } = await supabase
          .from('jenis_penilaian')
          .insert(formData)

        if (error) throw error
        toast.success('Jenis penilaian berhasil ditambahkan')
      }

      setIsModalOpen(false)
      resetForm()
      fetchPenilaian()
    } catch (error) {
      console.error('Error saving penilaian:', error)
      toast.error('Gagal menyimpan data penilaian')
    }
  }

  const handleDelete = async () => {
    try {
      // Check if penilaian is being used in nilai table
      const { data: nilaiData, error: nilaiError } = await supabase
        .from('nilai')
        .select('id')
        .eq('jenis_penilaian_id', selectedPenilaian.id)
        .limit(1)

      if (nilaiError) throw nilaiError

      if (nilaiData && nilaiData.length > 0) {
        toast.error('Tidak dapat menghapus jenis penilaian yang sudah digunakan')
        setIsConfirmOpen(false)
        return
      }

      const { error } = await supabase
        .from('jenis_penilaian')
        .delete()
        .eq('id', selectedPenilaian.id)

      if (error) throw error
      toast.success('Jenis penilaian berhasil dihapus')
      setIsConfirmOpen(false)
      setSelectedPenilaian(null)
      fetchPenilaian()
    } catch (error) {
      console.error('Error deleting penilaian:', error)
      toast.error('Gagal menghapus data penilaian')
    }
  }

  const resetForm = () => {
    setFormData({
      nama: '',
      keterangan: ''
    })
    setSelectedPenilaian(null)
  }

  const openModal = (penilaian = null) => {
    if (penilaian) {
      setFormData({
        nama: penilaian.nama,
        keterangan: penilaian.keterangan || ''
      })
      setSelectedPenilaian(penilaian)
    } else {
      resetForm()
    }
    setIsModalOpen(true)
  }

  const openConfirmDialog = (penilaian) => {
    setSelectedPenilaian(penilaian)
    setIsConfirmOpen(true)
  }

  const getUsageCount = async (penilaianId) => {
    try {
      const { data, error } = await supabase
        .from('nilai')
        .select('id', { count: 'exact' })
        .eq('jenis_penilaian_id', penilaianId)

      if (error) throw error
      return data?.length || 0
    } catch (error) {
      console.error('Error getting usage count:', error)
      return 0
    }
  }

  const filteredPenilaian = penilaianList.filter(penilaian =>
    penilaian.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (penilaian.keterangan && penilaian.keterangan.toLowerCase().includes(searchTerm.toLowerCase()))
  )

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
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Penilaian</h1>
          <p className="text-gray-600">Kelola jenis penilaian untuk sistem penilaian siswa</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button 
            onClick={() => openModal()}
            className="btn btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Jenis Penilaian</span>
          </button>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <Info className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Informasi Penting
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>• Jenis penilaian yang ditambahkan akan tersedia untuk guru saat input nilai</p>
              <p>• Pastikan nama penilaian jelas dan mudah dipahami</p>
              <p>• Penilaian yang sudah digunakan tidak dapat dihapus</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
              <ClipboardList className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Jenis Penilaian</p>
              <p className="text-2xl font-semibold text-gray-900">{penilaianList.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Aktif Digunakan</p>
              <p className="text-2xl font-semibold text-gray-900">
                {penilaianList.filter(p => p.nama.toLowerCase().includes('uts') || p.nama.toLowerCase().includes('uas') || p.nama.toLowerCase().includes('tugas')).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Cari jenis penilaian..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                  Jenis Penilaian
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Keterangan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dibuat
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPenilaian.map((penilaian) => (
                <tr key={penilaian.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {penilaian.nama}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {penilaian.keterangan || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      penilaian.nama.toLowerCase().includes('uts') || 
                      penilaian.nama.toLowerCase().includes('uas')
                        ? 'bg-red-100 text-red-800'
                        : penilaian.nama.toLowerCase().includes('tugas')
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {penilaian.nama.toLowerCase().includes('uts') || 
                       penilaian.nama.toLowerCase().includes('uas')
                        ? 'Ujian'
                        : penilaian.nama.toLowerCase().includes('tugas')
                        ? 'Tugas'
                        : 'Lainnya'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(penilaian.created_at).toLocaleDateString('id-ID')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openModal(penilaian)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openConfirmDialog(penilaian)}
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

        {filteredPenilaian.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <ClipboardList className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>Tidak ada data penilaian yang ditemukan</p>
          </div>
        )}
      </div>

      {/* Default Penilaian Info */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Jenis Penilaian Standar</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">📝 Tugas Harian</h4>
            <p className="text-sm text-gray-600">Penilaian tugas yang diberikan setiap pertemuan</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">📋 UTS</h4>
            <p className="text-sm text-gray-600">Ujian Tengah Semester</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">📊 UAS</h4>
            <p className="text-sm text-gray-600">Ujian Akhir Semester</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">🔬 Praktikum</h4>
            <p className="text-sm text-gray-600">Penilaian praktikum mata pelajaran</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">📁 Portofolio</h4>
            <p className="text-sm text-gray-600">Penilaian kumpulan tugas selama semester</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">🤝 Partisipasi</h4>
            <p className="text-sm text-gray-600">Penilaian keaktifan dalam pembelajaran</p>
          </div>
        </div>
      </div>

      {/* Modal Form */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedPenilaian ? 'Edit Jenis Penilaian' : 'Tambah Jenis Penilaian'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama Jenis Penilaian
            </label>
            <input
              type="text"
              value={formData.nama}
              onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
              required
              className="input"
              placeholder="Contoh: Tugas Harian, UTS, UAS, Praktikum"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Keterangan
            </label>
            <textarea
              value={formData.keterangan}
              onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
              rows={3}
              className="input"
              placeholder="Jelaskan secara detail tentang jenis penilaian ini (opsional)"
            />
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-600">
              <strong>Tips:</strong> Gunakan nama yang jelas dan konsisten. 
              Contoh: "Tugas Harian", "UTS Ganjil", "UAS Genap", "Praktikum Kimia"
            </p>
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
              {selectedPenilaian ? 'Update' : 'Simpan'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Hapus Jenis Penilaian"
        message={`Apakah Anda yakin ingin menghapus jenis penilaian "${selectedPenilaian?.nama}"?`}
        type="danger"
      />
    </div>
  )
}

export default ManajemenPenilaian