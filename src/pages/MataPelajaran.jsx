import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Search, BookOpen, Users, Calendar } from 'lucide-react'
import { supabase } from '../lib/supabase'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import toast from 'react-hot-toast'

const MataPelajaran = () => {
  const [mataPelajaranList, setMataPelajaranList] = useState([])
  const [guruList, setGuruList] = useState([])
  const [guruMataPelajaranList, setGuruMataPelajaranList] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('mata-pelajaran')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [formData, setFormData] = useState({
    kode: '',
    nama: ''
  })
  const [assignmentData, setAssignmentData] = useState({
    guru_id: '',
    mata_pelajaran_id: '',
    kelas: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [
        mataPelajaranResult,
        guruResult,
        assignmentResult
      ] = await Promise.all([
        supabase.from('mata_pelajaran').select('*').order('nama'),
        supabase.from('users').select('*').neq('role', 'admin').order('nama'),
        supabase
          .from('guru_mata_pelajaran')
          .select(`
            *,
            mata_pelajaran!inner(nama, kode),
            users!inner(nama)
          `)
          .order('kelas')
      ])

      if (mataPelajaranResult.error) throw mataPelajaranResult.error
      if (guruResult.error) throw guruResult.error
      if (assignmentResult.error) throw assignmentResult.error

      setMataPelajaranList(mataPelajaranResult.data || [])
      setGuruList(guruResult.data || [])
      setGuruMataPelajaranList(assignmentResult.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitMataPelajaran = async (e) => {
    e.preventDefault()
    try {
      if (selectedItem) {
        // Update
        const { error } = await supabase
          .from('mata_pelajaran')
          .update(formData)
          .eq('id', selectedItem.id)

        if (error) throw error
        toast.success('Mata pelajaran berhasil diperbarui')
      } else {
        // Insert
        const { error } = await supabase
          .from('mata_pelajaran')
          .insert(formData)

        if (error) throw error
        toast.success('Mata pelajaran berhasil ditambahkan')
      }

      setIsModalOpen(false)
      resetForm()
      fetchData()
    } catch (error) {
      console.error('Error saving mata pelajaran:', error)
      if (error.code === '23505') {
        toast.error('Kode mata pelajaran sudah terdaftar')
      } else {
        toast.error('Gagal menyimpan mata pelajaran')
      }
    }
  }

  const handleSubmitAssignment = async (e) => {
    e.preventDefault()
    try {
      const { error } = await supabase
        .from('guru_mata_pelajaran')
        .insert(assignmentData)

      if (error) throw error
      toast.success('Alokasi guru berhasil ditambahkan')
      setIsAssignmentModalOpen(false)
      resetAssignmentForm()
      fetchData()
    } catch (error) {
      console.error('Error saving assignment:', error)
      if (error.code === '23505') {
        toast.error('Guru sudah di alokasikan untuk mata pelajaran dan kelas ini')
      } else {
        toast.error('Gagal menyimpan alokasi')
      }
    }
  }

  const handleDeleteMataPelajaran = async () => {
    try {
      const { error } = await supabase
        .from('mata_pelajaran')
        .delete()
        .eq('id', selectedItem.id)

      if (error) throw error
      toast.success('Mata pelajaran berhasil dihapus')
      setIsConfirmOpen(false)
      setSelectedItem(null)
      fetchData()
    } catch (error) {
      console.error('Error deleting mata pelajaran:', error)
      toast.error('Gagal menghapus mata pelajaran')
    }
  }

  const handleDeleteAssignment = async () => {
    try {
      const { error } = await supabase
        .from('guru_mata_pelajaran')
        .delete()
        .eq('id', selectedItem.id)

      if (error) throw error
      toast.success('Alokasi guru berhasil dihapus')
      setIsConfirmOpen(false)
      setSelectedItem(null)
      fetchData()
    } catch (error) {
      console.error('Error deleting assignment:', error)
      toast.error('Gagal menghapus alokasi')
    }
  }

  const resetForm = () => {
    setFormData({
      kode: '',
      nama: ''
    })
    setSelectedItem(null)
  }

  const resetAssignmentForm = () => {
    setAssignmentData({
      guru_id: '',
      mata_pelajaran_id: '',
      kelas: ''
    })
    setSelectedItem(null)
  }

  const openModal = (mataPelajaran = null) => {
    if (mataPelajaran) {
      setFormData({
        kode: mataPelajaran.kode,
        nama: mataPelajaran.nama
      })
      setSelectedItem(mataPelajaran)
    } else {
      resetForm()
    }
    setIsModalOpen(true)
  }

  const openAssignmentModal = () => {
    resetAssignmentForm()
    setIsAssignmentModalOpen(true)
  }

  const openConfirmDialog = (item, type) => {
    setSelectedItem(item)
    setIsConfirmOpen(true)
  }

  const filteredMataPelajaran = mataPelajaranList.filter(mp =>
    mp.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mp.kode.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredAssignments = guruMataPelajaranList.filter(assignment =>
    assignment.mata_pelajaran.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assignment.users.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assignment.kelas.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Mata Pelajaran</h1>
          <p className="text-gray-600">Kelola mata pelajaran dan alokasi guru</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button 
            onClick={openAssignmentModal}
            className="btn btn-secondary flex items-center space-x-2"
          >
            <Users className="w-4 h-4" />
            <span>Alokasi Guru</span>
          </button>
          <button 
            onClick={() => openModal()}
            className="btn btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Mata Pelajaran</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Mata Pelajaran</p>
              <p className="text-2xl font-semibold text-gray-900">{mataPelajaranList.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Guru</p>
              <p className="text-2xl font-semibold text-gray-900">{guruList.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-purple-100 rounded-lg p-3">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Alokasi</p>
              <p className="text-2xl font-semibold text-gray-900">{guruMataPelajaranList.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('mata-pelajaran')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'mata-pelajaran'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Mata Pelajaran
            </button>
            <button
              onClick={() => setActiveTab('alokasi')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'alokasi'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Alokasi Guru
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={`Cari ${activeTab === 'mata-pelajaran' ? 'mata pelajaran' : 'alokasi'}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Mata Pelajaran Tab */}
          {activeTab === 'mata-pelajaran' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kode
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mata Pelajaran
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Jumlah Guru
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredMataPelajaran.map((mp) => {
                    const guruCount = guruMataPelajaranList.filter(gmp => gmp.mata_pelajaran_id === mp.id).length
                    return (
                      <tr key={mp.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {mp.kode}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {mp.nama}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                            {guruCount} guru
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => openModal(mp)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openConfirmDialog(mp, 'mata-pelajaran')}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Alokasi Tab */}
          {activeTab === 'alokasi' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Guru
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mata Pelajaran
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
                  {filteredAssignments.map((assignment) => (
                    <tr key={assignment.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {assignment.users.nama}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <span className="font-medium">{assignment.mata_pelajaran.nama}</span>
                          <span className="text-gray-500 ml-2">({assignment.mata_pelajaran.kode})</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                          {assignment.kelas}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <button
                          onClick={() => openConfirmDialog(assignment, 'alokasi')}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Empty State */}
          {((activeTab === 'mata-pelajaran' && filteredMataPelajaran.length === 0) ||
            (activeTab === 'alokasi' && filteredAssignments.length === 0)) && (
            <div className="text-center py-8 text-gray-500">
              <BookOpen className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>Tidak ada data yang ditemukan</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Mata Pelajaran */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedItem ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran'}
        size="md"
      >
        <form onSubmit={handleSubmitMataPelajaran} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kode Mata Pelajaran
            </label>
            <input
              type="text"
              value={formData.kode}
              onChange={(e) => setFormData({ ...formData, kode: e.target.value.toUpperCase() })}
              required
              className="input"
              placeholder="Contoh: MTK, BIND, BING"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama Mata Pelajaran
            </label>
            <input
              type="text"
              value={formData.nama}
              onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
              required
              className="input"
              placeholder="Contoh: Matematika"
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
              {selectedItem ? 'Update' : 'Simpan'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Alokasi Guru */}
      <Modal
        isOpen={isAssignmentModalOpen}
        onClose={() => setIsAssignmentModalOpen(false)}
        title="Alokasi Guru ke Mata Pelajaran"
        size="md"
      >
        <form onSubmit={handleSubmitAssignment} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Guru
            </label>
            <select
              value={assignmentData.guru_id}
              onChange={(e) => setAssignmentData({ ...assignmentData, guru_id: e.target.value })}
              required
              className="input"
            >
              <option value="">Pilih Guru</option>
              {guruList.map(guru => (
                <option key={guru.id} value={guru.id}>{guru.nama}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mata Pelajaran
            </label>
            <select
              value={assignmentData.mata_pelajaran_id}
              onChange={(e) => setAssignmentData({ ...assignmentData, mata_pelajaran_id: e.target.value })}
              required
              className="input"
            >
              <option value="">Pilih Mata Pelajaran</option>
              {mataPelajaranList.map(mp => (
                <option key={mp.id} value={mp.id}>{mp.nama} ({mp.kode})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kelas
            </label>
            <input
              type="text"
              value={assignmentData.kelas}
              onChange={(e) => setAssignmentData({ ...assignmentData, kelas: e.target.value })}
              required
              className="input"
              placeholder="Contoh: X-1, XI-2, XII-3"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setIsAssignmentModalOpen(false)}
              className="btn btn-secondary"
            >
              Batal
            </button>
            <button type="submit" className="btn btn-primary">
              Simpan Alokasi
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={selectedItem?.mata_pelajaran ? handleDeleteAssignment : handleDeleteMataPelajaran}
        title={`Hapus ${selectedItem?.mata_pelajaran ? 'Alokasi' : 'Mata Pelajaran'}`}
        message={`Apakah Anda yakin ingin menghapus ${selectedItem?.mata_pelajaran ? 'alokasi' : 'mata pelajaran'} ini?`}
        type="danger"
      />
    </div>
  )
}

export default MataPelajaran