import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Upload, Download, Search, Filter } from 'lucide-react'
import { supabase } from '../lib/supabase'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import toast from 'react-hot-toast'

const ManajemenGuru = () => {
  const [guruList, setGuruList] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [selectedGuru, setSelectedGuru] = useState(null)
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    nama: '',
    role: 'guru',
    is_supervisor: false,
    is_pengajar: false,
    is_wali_kelas: false,
    is_piket: false
  })

  useEffect(() => {
    fetchGuru()
  }, [])

  const fetchGuru = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .neq('role', 'admin')
        .order('created_at', { ascending: false })

      if (error) throw error
      setGuruList(data || [])
    } catch (error) {
      console.error('Error fetching guru:', error)
      toast.error('Gagal memuat data guru')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const submitData = {
        ...formData,
        password: formData.password || 'default123' // Default password
      }

      if (selectedGuru) {
        // Update
        const { error } = await supabase
          .from('users')
          .update(submitData)
          .eq('id', selectedGuru.id)

        if (error) throw error
        toast.success('Data guru berhasil diperbarui')
      } else {
        // Insert
        const { error } = await supabase
          .from('users')
          .insert(submitData)

        if (error) throw error
        toast.success('Data guru berhasil ditambahkan')
      }

      setIsModalOpen(false)
      resetForm()
      fetchGuru()
    } catch (error) {
      console.error('Error saving guru:', error)
      toast.error('Gagal menyimpan data guru')
    }
  }

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', selectedGuru.id)

      if (error) throw error
      toast.success('Data guru berhasil dihapus')
      setIsConfirmOpen(false)
      setSelectedGuru(null)
      fetchGuru()
    } catch (error) {
      console.error('Error deleting guru:', error)
      toast.error('Gagal menghapus data guru')
    }
  }

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      nama: '',
      role: 'guru',
      is_supervisor: false,
      is_pengajar: false,
      is_wali_kelas: false,
      is_piket: false
    })
    setSelectedGuru(null)
  }

  const openModal = (guru = null) => {
    if (guru) {
      setFormData({
        username: guru.username,
        password: '',
        nama: guru.nama,
        role: guru.role,
        is_supervisor: guru.is_supervisor,
        is_pengajar: guru.is_pengajar,
        is_wali_kelas: guru.is_wali_kelas,
        is_piket: guru.is_piket
      })
      setSelectedGuru(guru)
    } else {
      resetForm()
    }
    setIsModalOpen(true)
  }

  const openConfirmDialog = (guru) => {
    setSelectedGuru(guru)
    setIsConfirmOpen(true)
  }

  const filteredGuru = guruList.filter(guru =>
    guru.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guru.username.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Guru</h1>
          <p className="text-gray-600">Kelola data guru dan staf pengajar</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button className="btn btn-secondary flex items-center space-x-2">
            <Upload className="w-4 h-4" />
            <span>Import Excel</span>
          </button>
          <button 
            onClick={() => openModal()}
            className="btn btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Guru</span>
          </button>
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
                placeholder="Cari guru berdasarkan nama atau username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <button className="btn btn-secondary flex items-center space-x-2">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Username
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nama Lengkap
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tugas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredGuru.map((guru) => (
                <tr key={guru.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {guru.username}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {guru.nama}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 capitalize">
                      {guru.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex flex-wrap gap-1">
                      {guru.is_supervisor && (
                        <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                          Supervisor
                        </span>
                      )}
                      {guru.is_pengajar && (
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                          Pengajar
                        </span>
                      )}
                      {guru.is_wali_kelas && (
                        <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                          Wali Kelas
                        </span>
                      )}
                      {guru.is_piket && (
                        <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800">
                          Piket
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openModal(guru)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openConfirmDialog(guru)}
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
      </div>

      {/* Modal Form */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedGuru ? 'Edit Data Guru' : 'Tambah Data Guru'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password {selectedGuru && '(kosongkan jika tidak diubah)'}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required={!selectedGuru}
              className="input"
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
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="input"
            >
              <option value="guru">Guru</option>
              <option value="supervisor">Supervisor</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tugas
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_supervisor}
                  onChange={(e) => setFormData({ ...formData, is_supervisor: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm">Supervisor</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_pengajar}
                  onChange={(e) => setFormData({ ...formData, is_pengajar: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm">Pengajar</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_wali_kelas}
                  onChange={(e) => setFormData({ ...formData, is_wali_kelas: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm">Wali Kelas</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_piket}
                  onChange={(e) => setFormData({ ...formData, is_piket: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm">Piket</span>
              </label>
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
            <button type="submit" className="btn btn-primary">
              {selectedGuru ? 'Update' : 'Simpan'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Hapus Data Guru"
        message={`Apakah Anda yakin ingin menghapus data guru "${selectedGuru?.nama}"?`}
        type="danger"
      />
    </div>
  )
}

export default ManajemenGuru