import React, { useState, useEffect } from 'react'
import { Building, Camera, Save, Phone, Mail, MapPin, User, Calendar } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { uploadImage } from '../lib/cloudinary'
import toast from 'react-hot-toast'

const ProfilLembaga = () => {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [previewImage, setPreviewImage] = useState(null)
  const [formData, setFormData] = useState({
    logo_url: '',
    nama_yayasan: '',
    nama_lembaga: '',
    alamat: '',
    no_telepon: '',
    email: '',
    nama_kepala: '',
    nip_kepala: '',
    tahun_ajaran: '',
    kab_kota: ''
  })

  useEffect(() => {
    fetchProfilLembaga()
  }, [])

  const fetchProfilLembaga = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('profil_lembaga')
        .select('*')
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (data) {
        setFormData(data)
      }
    } catch (error) {
      console.error('Error fetching profil lembaga:', error)
      toast.error('Gagal memuat data profil lembaga')
    } finally {
      setLoading(false)
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Ukuran file maksimal 5MB')
        return
      }

      if (!file.type.startsWith('image/')) {
        toast.error('File harus berupa gambar')
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewImage(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      let updateData = { ...formData }

      // Upload logo jika ada
      if (previewImage) {
        const fileInput = document.getElementById('logo-input')
        const file = fileInput.files[0]
        if (file) {
          const logoUrl = await uploadImage(file, 'logo-lembaga')
          updateData.logo_url = logoUrl
        }
      }

      // Check if data exists
      const { data: existingData } = await supabase
        .from('profil_lembaga')
        .select('id')
        .single()

      if (existingData) {
        // Update existing data
        const { error } = await supabase
          .from('profil_lembaga')
          .update(updateData)
          .eq('id', existingData.id)

        if (error) throw error
        toast.success('Profil lembaga berhasil diperbarui')
      } else {
        // Insert new data
        const { error } = await supabase
          .from('profil_lembaga')
          .insert(updateData)

        if (error) throw error
        toast.success('Profil lembaga berhasil disimpan')
      }

      setPreviewImage(null)
      fetchProfilLembaga()
    } catch (error) {
      console.error('Error saving profil lembaga:', error)
      toast.error('Gagal menyimpan profil lembaga')
    } finally {
      setSaving(false)
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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profil Lembaga</h1>
        <p className="text-gray-600">Kelola informasi identitas lembaga pendidikan</p>
      </div>

      {/* Preview Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Preview Kop Surat</h2>
        <div className="border-2 border-gray-200 rounded-lg p-6 bg-gray-50">
          <div className="text-center space-y-2">
            {formData.logo_url && (
              <div className="flex justify-center mb-4">
                <img 
                  src={formData.logo_url} 
                  alt="Logo" 
                  className="h-16 w-16 object-contain"
                />
              </div>
            )}
            <h3 className="text-lg font-bold text-gray-900">{formData.nama_yayasan || 'Nama Yayasan'}</h3>
            <h2 className="text-xl font-bold text-gray-900">{formData.nama_lembaga || 'Nama Lembaga'}</h2>
            <p className="text-sm text-gray-600">{formData.alamat || 'Alamat Lembaga'}</p>
            <p className="text-sm text-gray-600">
              {formData.kab_kota || 'Kab/Kota'} - {formData.no_telepon || 'No. Telepon'}
            </p>
            <p className="text-sm text-gray-600">{formData.email || 'email@lembaga.sch.id'}</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Logo Upload */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Logo Lembaga</h2>
          <div className="flex items-center space-x-6">
            <div className="relative">
              <div className="w-32 h-32 bg-gray-200 rounded-lg overflow-hidden border-2 border-gray-300">
                {previewImage || formData.logo_url ? (
                  <img
                    src={previewImage || formData.logo_url}
                    alt="Logo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Building className="w-12 h-12 text-gray-400" />
                  </div>
                )}
              </div>
              <label
                htmlFor="logo-input"
                className="absolute bottom-0 right-0 bg-primary-600 text-white p-2 rounded-lg cursor-pointer hover:bg-primary-700 transition-colors"
              >
                <Camera className="w-4 h-4" />
              </label>
              <input
                id="logo-input"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Logo Lembaga</p>
              <p className="text-xs text-gray-500">
                Format: JPG, PNG. Maksimal: 5MB. Logo akan muncul di kop surat dan login page.
              </p>
            </div>
          </div>
        </div>

        {/* Informasi Yayasan dan Lembaga */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Informasi Yayasan dan Lembaga</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Yayasan
              </label>
              <input
                type="text"
                value={formData.nama_yayasan}
                onChange={(e) => setFormData({ ...formData, nama_yayasan: e.target.value })}
                className="input"
                placeholder="Contoh: Yayasan Pendidikan Harapan Bangsa"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Lembaga
              </label>
              <input
                type="text"
                value={formData.nama_lembaga}
                onChange={(e) => setFormData({ ...formData, nama_lembaga: e.target.value })}
                className="input"
                placeholder="Contoh: SMK Negeri 1 Jakarta"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alamat Lengkap
              </label>
              <textarea
                value={formData.alamat}
                onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                rows={3}
                className="input"
                placeholder="Jl. Pendidikan No. 123, Jakarta Pusat"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kabupaten/Kota
              </label>
              <input
                type="text"
                value={formData.kab_kota}
                onChange={(e) => setFormData({ ...formData, kab_kota: e.target.value })}
                className="input"
                placeholder="Contoh: Jakarta Pusat"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nomor Telepon
              </label>
              <input
                type="tel"
                value={formData.no_telepon}
                onChange={(e) => setFormData({ ...formData, no_telepon: e.target.value })}
                className="input"
                placeholder="Contoh: 021-12345678"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input"
                placeholder="info@lembaga.sch.id"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tahun Ajaran
              </label>
              <input
                type="text"
                value={formData.tahun_ajaran}
                onChange={(e) => setFormData({ ...formData, tahun_ajaran: e.target.value })}
                className="input"
                placeholder="Contoh: 2023/2024"
              />
            </div>
          </div>
        </div>

        {/* Informasi Kepala Lembaga */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Informasi Kepala Lembaga</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Kepala Lembaga
              </label>
              <input
                type="text"
                value={formData.nama_kepala}
                onChange={(e) => setFormData({ ...formData, nama_kepala: e.target.value })}
                className="input"
                placeholder="Contoh: Dr. Ahmad Wijaya, M.Pd"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                NIP Kepala Lembaga
              </label>
              <input
                type="text"
                value={formData.nip_kepala}
                onChange={(e) => setFormData({ ...formData, nip_kepala: e.target.value })}
                className="input"
                placeholder="Contoh: 198712311990031001"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Menyimpan...' : 'Simpan Profil'}</span>
          </button>
        </div>
      </form>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <Building className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Informasi Penting
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>• Profil lembaga akan digunakan untuk kop surat pada export PDF</p>
              <p>• Logo lembaga akan muncul di halaman login dan favicon aplikasi</p>
              <p>• Pastikan semua data diisi dengan benar dan lengkap</p>
              <p>• Data dapat diubah kapan saja melalui halaman ini</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilLembaga