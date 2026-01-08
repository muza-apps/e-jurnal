import React, { useState, useEffect } from 'react'
import { 
  Calendar, 
  Users, 
  Upload, 
  Save, 
  Search, 
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Camera
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { uploadImage } from '../lib/cloudinary'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import toast from 'react-hot-toast'

const JurnalPresensi = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('jurnal')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [jurnalList, setJurnalList] = useState([])
  const [siswaList, setSiswaList] = useState([])
  const [presensiData, setPresensiData] = useState({})
  const [formData, setFormData] = useState({
    status: 'pengajar',
    tanggal: selectedDate,
    materi_kegiatan: ''
  })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [selectedJurnal, setSelectedJurnal] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterKelas, setFilterKelas] = useState('')

  useEffect(() => {
    fetchJurnalList()
    if (activeTab === 'presensi' && selectedJurnal) {
      fetchSiswaForPresensi()
    }
  }, [selectedDate, activeTab, selectedJurnal])

  const fetchJurnalList = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('jurnal')
        .select('*')
        .eq('guru_id', user.id)
        .order('tanggal', { ascending: false })

      if (error) throw error
      setJurnalList(data || [])
    } catch (error) {
      console.error('Error fetching jurnal:', error)
      toast.error('Gagal memuat data jurnal')
    } finally {
      setLoading(false)
    }
  }

  const fetchSiswaForPresensi = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('siswa')
        .select('*')
        .order('kelas, nama')

      if (error) throw error

      setSiswaList(data || [])

      // Initialize presensi data
      const initialPresensi = {}
      data?.forEach(siswa => {
        initialPresensi[siswa.id] = {
          status: 'hadir',
          bukti_url: null
        }
      })
      setPresensiData(initialPresensi)
    } catch (error) {
      console.error('Error fetching siswa:', error)
      toast.error('Gagal memuat data siswa')
    } finally {
      setLoading(false)
    }
  }

  const handleJurnalSubmit = async (e) => {
    e.preventDefault()
    try {
      setSaving(true)

      const submitData = {
        ...formData,
        guru_id: user.id,
        tanggal: selectedDate
      }

      if (selectedJurnal) {
        // Update
        const { error } = await supabase
          .from('jurnal')
          .update(submitData)
          .eq('id', selectedJurnal.id)

        if (error) throw error
        toast.success('Jurnal berhasil diperbarui')
      } else {
        // Insert
        const { error } = await supabase
          .from('jurnal')
          .insert(submitData)

        if (error) throw error
        toast.success('Jurnal berhasil disimpan')
      }

      setIsModalOpen(false)
      resetForm()
      fetchJurnalList()
    } catch (error) {
      console.error('Error saving jurnal:', error)
      toast.error('Gagal menyimpan jurnal')
    } finally {
      setSaving(false)
    }
  }

  const handlePresensiSubmit = async () => {
    if (!selectedJurnal) {
      toast.error('Pilih jurnal terlebih dahulu')
      return
    }

    try {
      setSaving(true)

      // Prepare presensi data for bulk insert
      const presensiRecords = Object.entries(presensiData).map(([siswaId, data]) => ({
        jurnal_id: selectedJurnal.id,
        siswa_id: siswaId,
        status: data.status,
        bukti_url: data.bukti_url
      }))

      // Delete existing presensi for this jurnal
      await supabase
        .from('presensi_siswa')
        .delete()
        .eq('jurnal_id', selectedJurnal.id)

      // Insert new presensi data
      const { error } = await supabase
        .from('presensi_siswa')
        .insert(presensiRecords)

      if (error) throw error
      toast.success('Presensi berhasil disimpan')
    } catch (error) {
      console.error('Error saving presensi:', error)
      toast.error('Gagal menyimpan presensi')
    } finally {
      setSaving(false)
    }
  }

  const handlePresensiChange = (siswaId, field, value) => {
    setPresensiData(prev => ({
      ...prev,
      [siswaId]: {
        ...prev[siswaId],
        [field]: value
      }
    }))
  }

  const handleFileUpload = async (siswaId, file) => {
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5MB')
      return
    }

    try {
      const buktiUrl = await uploadImage(file, 'bukti-presensi')
      handlePresensiChange(siswaId, 'bukti_url', buktiUrl)
      toast.success('Bukti berhasil diupload')
    } catch (error) {
      console.error('Error uploading file:', error)
      toast.error('Gagal mengupload bukti')
    }
  }

  const handleDeleteJurnal = async () => {
    try {
      const { error } = await supabase
        .from('jurnal')
        .delete()
        .eq('id', selectedJurnal.id)

      if (error) throw error
      toast.success('Jurnal berhasil dihapus')
      setIsConfirmOpen(false)
      setSelectedJurnal(null)
      fetchJurnalList()
    } catch (error) {
      console.error('Error deleting jurnal:', error)
      toast.error('Gagal menghapus jurnal')
    }
  }

  const resetForm = () => {
    setFormData({
      status: 'pengajar',
      tanggal: selectedDate,
      materi_kegiatan: ''
    })
    setSelectedJurnal(null)
  }

  const openModal = (jurnal = null) => {
    if (jurnal) {
      setFormData({
        status: jurnal.status,
        tanggal: jurnal.tanggal,
        materi_kegiatan: jurnal.materi_kegiatan
      })
      setSelectedJurnal(jurnal)
    } else {
      resetForm()
    }
    setIsModalOpen(true)
  }

  const openConfirmDialog = (jurnal) => {
    setSelectedJurnal(jurnal)
    setIsConfirmOpen(true)
  }

  const selectJurnalForPresensi = (jurnal) => {
    setSelectedJurnal(jurnal)
    setActiveTab('presensi')
    fetchSiswaForPresensi()
  }

  const filteredSiswa = siswaList.filter(siswa => 
    siswa.nama.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (!filterKelas || siswa.kelas === filterKelas)
  )

  const uniqueKelas = [...new Set(siswaList.map(s => s.kelas))].sort()

  const presensiStats = {
    hadir: Object.values(presensiData).filter(p => p.status === 'hadir').length,
    alpha: Object.values(presensiData).filter(p => p.status === 'alpha').length,
    sakit: Object.values(presensiData).filter(p => p.status === 'sakit').length,
    izin: Object.values(presensiData).filter(p => p.status === 'izin').length
  }

  if (loading && activeTab === 'jurnal') {
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
          <h1 className="text-2xl font-bold text-gray-900">Jurnal & Presensi</h1>
          <p className="text-gray-600">Input jurnal harian dan presensi siswa</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button 
            onClick={() => openModal()}
            className="btn btn-primary flex items-center space-x-2"
          >
            <FileText className="w-4 h-4" />
            <span>Buat Jurnal</span>
          </button>
        </div>
      </div>

      {/* Date Selector */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Tanggal:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('jurnal')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'jurnal'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Data Jurnal
            </button>
            <button
              onClick={() => setActiveTab('presensi')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'presensi'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Presensi Siswa
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Jurnal Tab */}
          {activeTab === 'jurnal' && (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tanggal
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Materi/Kegiatan
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {jurnalList.map((jurnal) => (
                      <tr key={jurnal.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(jurnal.tanggal).toLocaleDateString('id-ID')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            jurnal.status === 'pengajar' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                          }`}>
                            {jurnal.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-md truncate">
                          {jurnal.materi_kegiatan}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => openModal(jurnal)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => selectJurnalForPresensi(jurnal)}
                              className="text-green-600 hover:text-green-800"
                            >
                              Presensi
                            </button>
                            <button
                              onClick={() => openConfirmDialog(jurnal)}
                              className="text-red-600 hover:text-red-800"
                            >
                              Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {jurnalList.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>Belum ada data jurnal</p>
                  <button
                    onClick={() => openModal()}
                    className="mt-4 btn btn-primary"
                  >
                    Buat Jurnal Pertama
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Presensi Tab */}
          {activeTab === 'presensi' && (
            <div className="space-y-6">
              {/* Jurnal Selector */}
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pilih Jurnal:
                </label>
                <select
                  value={selectedJurnal?.id || ''}
                  onChange={(e) => {
                    const jurnal = jurnalList.find(j => j.id === e.target.value)
                    if (jurnal) {
                      selectJurnalForPresensi(jurnal)
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Pilih jurnal</option>
                  {jurnalList.map(jurnal => (
                    <option key={jurnal.id} value={jurnal.id}>
                      {new Date(jurnal.tanggal).toLocaleDateString('id-ID')} - {jurnal.status} - {jurnal.materi_kegiatan.substring(0, 50)}...
                    </option>
                  ))}
                </select>
              </div>

              {selectedJurnal && (
                <>
                  {/* Presensi Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                        <div>
                          <p className="text-sm font-medium text-green-800">Hadir</p>
                          <p className="text-lg font-bold text-green-900">{presensiStats.hadir}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <XCircle className="h-5 w-5 text-red-600 mr-2" />
                        <div>
                          <p className="text-sm font-medium text-red-800">Alpha</p>
                          <p className="text-lg font-bold text-red-900">{presensiStats.alpha}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                        <div>
                          <p className="text-sm font-medium text-yellow-800">Sakit</p>
                          <p className="text-lg font-bold text-yellow-900">{presensiStats.sakit}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <AlertCircle className="h-5 w-5 text-blue-600 mr-2" />
                        <div>
                          <p className="text-sm font-medium text-blue-800">Izin</p>
                          <p className="text-lg font-bold text-blue-900">{presensiStats.izin}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Search and Filter */}
                  <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="text"
                          placeholder="Cari siswa..."
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
                      {uniqueKelas.map(kelas => (
                        <option key={kelas} value={kelas}>{kelas}</option>
                      ))}
                    </select>
                  </div>

                  {/* Presensi Table */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            NIS
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Nama
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Kelas
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Bukti
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
                              {siswa.kelas}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <select
                                value={presensiData[siswa.id]?.status || 'hadir'}
                                onChange={(e) => handlePresensiChange(siswa.id, 'status', e.target.value)}
                                className="px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                              >
                                <option value="hadir">Hadir</option>
                                <option value="alpha">Alpha</option>
                                <option value="sakit">Sakit</option>
                                <option value="izin">Izin</option>
                              </select>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {(presensiData[siswa.id]?.status === 'sakit' || presensiData[siswa.id]?.status === 'izin') && (
                                <div className="flex items-center space-x-2">
                                  <label className="cursor-pointer">
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => e.target.files[0] && handleFileUpload(siswa.id, e.target.files[0])}
                                      className="hidden"
                                    />
                                    <div className="flex items-center space-x-1 text-blue-600 hover:text-blue-800">
                                      <Camera className="w-4 h-4" />
                                      <span>Upload</span>
                                    </div>
                                  </label>
                                  {presensiData[siswa.id]?.bukti_url && (
                                    <a
                                      href={presensiData[siswa.id]?.bukti_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-green-600 hover:text-green-800"
                                    >
                                      Lihat
                                    </a>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end">
                    <button
                      onClick={handlePresensiSubmit}
                      disabled={saving}
                      className="btn btn-primary flex items-center space-x-2"
                    >
                      <Save className="w-4 h-4" />
                      <span>{saving ? 'Menyimpan...' : 'Simpan Presensi'}</span>
                    </button>
                  </div>
                </>
              )}

              {!selectedJurnal && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>Pilih jurnal terlebih dahulu untuk mengisi presensi</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Jurnal Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedJurnal ? 'Edit Jurnal' : 'Buat Jurnal Baru'}
        size="md"
      >
        <form onSubmit={handleJurnalSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="input"
            >
              <option value="pengajar">Pengajar</option>
              <option value="piket">Piket</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tanggal
            </label>
            <input
              type="date"
              value={formData.tanggal}
              onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
              required
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Materi/Kegiatan
            </label>
            <textarea
              value={formData.materi_kegiatan}
              onChange={(e) => setFormData({ ...formData, materi_kegiatan: e.target.value })}
              rows={4}
              required
              className="input"
              placeholder="Jelaskan materi atau kegiatan yang dilakukan..."
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
        onConfirm={handleDeleteJurnal}
        title="Hapus Jurnal"
        message={`Apakah Anda yakin ingin menghapus jurnal ini? Semua data presensi terkait juga akan dihapus.`}
        type="danger"
      />
    </div>
  )
}

export default JurnalPresensi