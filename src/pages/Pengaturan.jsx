import React, { useState, useEffect } from 'react'
import { 
  Settings, 
  Download, 
  Upload, 
  Key, 
  Database, 
  Shield, 
  Save,
  AlertTriangle,
  CheckCircle,
  Info,
  RefreshCw,
  Clock,
  FileText
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import toast from 'react-hot-toast'

const Pengaturan = () => {
  const { user, updateUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('general')
  const [settings, setSettings] = useState({})
  const [backupHistory, setBackupHistory] = useState([])
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [saving, setSaving] = useState(false)
  const [backupLoading, setBackupLoading] = useState(false)

  useEffect(() => {
    fetchSettings()
    fetchBackupHistory()
  }, [])

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')

      if (error) throw error

      const settingsObj = {}
      data?.forEach(setting => {
        settingsObj[setting.key] = setting.value
      })

      setSettings(settingsObj)
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast.error('Gagal memuat pengaturan')
    } finally {
      setLoading(false)
    }
  }

  const fetchBackupHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('backup_history')
        .select(`
          *,
          users!inner(nama)
        `)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      setBackupHistory(data || [])
    } catch (error) {
      console.error('Error fetching backup history:', error)
    }
  }

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const saveSettings = async () => {
    try {
      setSaving(true)
      
      for (const [key, value] of Object.entries(settings)) {
        const { error } = await supabase
          .from('settings')
          .upsert({ key, value }, { onConflict: 'key' })

        if (error) throw error
      }

      toast.success('Pengaturan berhasil disimpan')
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Gagal menyimpan pengaturan')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Password baru tidak cocok')
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password minimal 6 karakter')
      return
    }

    try {
      setSaving(true)
      
      // Update user password
      const updateData = {
        password: passwordData.newPassword
      }

      await updateUser(updateData)
      
      setIsPasswordModalOpen(false)
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (error) {
      console.error('Error changing password:', error)
      toast.error('Gagal mengubah password')
    } finally {
      setSaving(false)
    }
  }

  const handleBackup = async () => {
    try {
      setBackupLoading(true)
      
      // Get all data for backup
      const [
        usersResult,
        siswaResult,
        mataPelajaranResult,
        guruMataPelajaranResult,
        jenisPenilaianResult,
        profilLembagaResult,
        jurnalResult,
        presensiSiswaResult,
        presensiGuruResult,
        nilaiResult,
        settingsResult
      ] = await Promise.all([
        supabase.from('users').select('*'),
        supabase.from('siswa').select('*'),
        supabase.from('mata_pelajaran').select('*'),
        supabase.from('guru_mata_pelajaran').select('*'),
        supabase.from('jenis_penilaian').select('*'),
        supabase.from('profil_lembaga').select('*'),
        supabase.from('jurnal').select('*'),
        supabase.from('presensi_siswa').select('*'),
        supabase.from('presensi_guru').select('*'),
        supabase.from('nilai').select('*'),
        supabase.from('settings').select('*')
      ])

      const backupData = {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        data: {
          users: usersResult.data || [],
          siswa: siswaResult.data || [],
          mata_pelajaran: mataPelajaranResult.data || [],
          guru_mata_pelajaran: guruMataPelajaranResult.data || [],
          jenis_penilaian: jenisPenilaianResult.data || [],
          profil_lembaga: profilLembagaResult.data || [],
          jurnal: jurnalResult.data || [],
          presensi_siswa: presensiSiswaResult.data || [],
          presensi_guru: presensiGuruResult.data || [],
          nilai: nilaiResult.data || [],
          settings: settingsResult.data || []
        }
      }

      // Create blob and download
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `backup_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      // Save backup history
      const filename = `backup_${new Date().toISOString().split('T')[0]}.json`
      await supabase
        .from('backup_history')
        .insert({
          filename,
          backup_url: '', // Could be stored in cloud storage
          created_by: user.id
        })

      toast.success('Backup berhasil diunduh')
      fetchBackupHistory()
      setIsBackupModalOpen(false)
    } catch (error) {
      console.error('Error creating backup:', error)
      toast.error('Gagal membuat backup')
    } finally {
      setBackupLoading(false)
    }
  }

  const handleRestore = async (file) => {
    try {
      const text = await file.text()
      const backupData = JSON.parse(text)

      if (!backupData.data) {
        throw new Error('Format backup tidak valid')
      }

      // Confirmation dialog would be shown here
      // For now, just show success message
      toast.success('Format backup valid. Fitur restore akan segera hadir.')
    } catch (error) {
      console.error('Error restoring backup:', error)
      toast.error('Format backup tidak valid')
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Pengaturan</h1>
          <p className="text-gray-600">Kelola konfigurasi dan keamanan sistem</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button 
            onClick={() => setIsPasswordModalOpen(true)}
            className="btn btn-secondary flex items-center space-x-2"
          >
            <Key className="w-4 h-4" />
            <span>Ganti Password</span>
          </button>
          <button 
            onClick={saveSettings}
            disabled={saving}
            className="btn btn-primary flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Menyimpan...' : 'Simpan Pengaturan'}</span>
          </button>
        </div>
      </div>

      {/* Warning Card */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Perhatian
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>• Perubahan pengaturan akan mempengaruhi seluruh sistem</p>
              <p>• Backup data secara berkala untuk mencegah kehilangan data</p>
              <p>• Jangan bagikan password admin kepada orang yang tidak berwenang</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('general')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'general'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Umum
            </button>
            <button
              onClick={() => setActiveTab('backup')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'backup'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Backup & Restore
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'security'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Keamanan
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Pengaturan Umum</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nama Aplikasi
                    </label>
                    <input
                      type="text"
                      value={settings.app_name || ''}
                      onChange={(e) => handleSettingChange('app_name', e.target.value)}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Versi Aplikasi
                    </label>
                    <input
                      type="text"
                      value={settings.app_version || ''}
                      onChange={(e) => handleSettingChange('app_version', e.target.value)}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Maksimal Ukuran File (bytes)
                    </label>
                    <input
                      type="number"
                      value={settings.max_file_size || ''}
                      onChange={(e) => handleSettingChange('max_file_size', e.target.value)}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Jadwal Backup (Cron)
                    </label>
                    <input
                      type="text"
                      value={settings.backup_schedule || ''}
                      onChange={(e) => handleSettingChange('backup_schedule', e.target.value)}
                      className="input"
                      placeholder="0 2 * * *"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Informasi Sistem</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <Info className="h-5 w-5 text-blue-500 mr-2" />
                      <span className="text-sm font-medium text-gray-900">Environment</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Development</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 text-green-500 mr-2" />
                      <span className="text-sm font-medium text-gray-900">Last Backup</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {backupHistory.length > 0 
                        ? new Date(backupHistory[0].created_at).toLocaleString('id-ID')
                        : 'Belum ada backup'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Backup & Restore */}
          {activeTab === 'backup' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Backup Data</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <Database className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">
                        Backup Data Lengkap
                      </h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <p>Backup akan mencakup semua data: users, siswa, mata pelajaran, jurnal, presensi, nilai, dan pengaturan.</p>
                      </div>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setIsBackupModalOpen(true)}
                  className="btn btn-primary flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Buat Backup Sekarang</span>
                </button>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Restore Data</h3>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <div className="text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-4">
                      <label htmlFor="restore-file" className="cursor-pointer">
                        <span className="mt-2 block text-sm font-medium text-gray-900">
                          Klik untuk upload file backup
                        </span>
                        <input
                          id="restore-file"
                          name="restore-file"
                          type="file"
                          accept=".json"
                          className="sr-only"
                          onChange={(e) => e.target.files[0] && handleRestore(e.target.files[0])}
                        />
                      </label>
                      <p className="mt-1 text-xs text-gray-500">Format: JSON</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Riwayat Backup</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tanggal
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Filename
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Dibuat Oleh
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {backupHistory.map((backup) => (
                        <tr key={backup.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(backup.created_at).toLocaleString('id-ID')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {backup.filename}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {backup.users.nama}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {backupHistory.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p>Belum ada riwayat backup</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Keamanan Akun</h3>
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Password Admin</h4>
                        <p className="text-sm text-gray-600">Terakhir diubah: Belum pernah</p>
                      </div>
                      <button 
                        onClick={() => setIsPasswordModalOpen(true)}
                        className="btn btn-secondary flex items-center space-x-2"
                      >
                        <Key className="w-4 h-4" />
                        <span>Ubah Password</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Informasi Keamanan</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900">Database Security</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Row Level Security (RLS) diaktifkan</p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <Shield className="h-5 w-5 text-green-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900">API Security</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Supabase Auth terkonfigurasi</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Rekomendasi Keamanan</h3>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <CheckCircle className="h-5 w-5 text-green-400 mt-0.5" />
                    </div>
                    <div className="text-sm text-gray-700">
                      <p>Ganti password admin secara berkala (minimal 3 bulan sekali)</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <CheckCircle className="h-5 w-5 text-green-400 mt-0.5" />
                    </div>
                    <div className="text-sm text-gray-700">
                      <p>Gunakan password yang kuat (minimal 8 karakter dengan kombinasi huruf, angka, dan simbol)</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <CheckCircle className="h-5 w-5 text-green-400 mt-0.5" />
                    </div>
                    <div className="text-sm text-gray-700">
                      <p>Backup data secara berkala untuk mencegah kehilangan data</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <CheckCircle className="h-5 w-5 text-green-400 mt-0.5" />
                    </div>
                    <div className="text-sm text-gray-700">
                      <p>Monitor aktivitas login yang mencurigakan</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Password Change Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="Ganti Password Admin"
        size="md"
      >
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password Baru
            </label>
            <input
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              required
              className="input"
              placeholder="Masukkan password baru"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Konfirmasi Password Baru
            </label>
            <input
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              required
              className="input"
              placeholder="Konfirmasi password baru"
            />
          </div>

          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Tips Password:</strong> Gunakan minimal 6 karakter dengan kombinasi huruf besar, kecil, dan angka.
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setIsPasswordModalOpen(false)}
              className="btn btn-secondary"
            >
              Batal
            </button>
            <button type="submit" disabled={saving} className="btn btn-primary">
              {saving ? 'Menyimpan...' : 'Ubah Password'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Backup Confirmation Modal */}
      <Modal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        title="Konfirmasi Backup"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Informasi Backup
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>• Backup akan mengunduh file JSON dengan semua data sistem</p>
                  <p>• Proses backup mungkin memakan waktu beberapa detik</p>
                  <p>• File backup akan disimpan di perangkat Anda</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => setIsBackupModalOpen(false)}
              className="btn btn-secondary"
            >
              Batal
            </button>
            <button 
              onClick={handleBackup} 
              disabled={backupLoading}
              className="btn btn-primary flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>{backupLoading ? 'Membuat Backup...' : 'Buat Backup'}</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Pengaturan