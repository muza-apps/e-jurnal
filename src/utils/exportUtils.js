import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { supabase } from '../lib/supabase'

export const exportToPDF = async (elementId, filename, title = '') => {
  try {
    const element = document.getElementById(elementId)
    if (!element) {
      throw new Error('Element not found')
    }

    // Get profil lembaga untuk header
    const { data: profilLembaga } = await supabase
      .from('profil_lembaga')
      .select('*')
      .single()

    // Create canvas from element
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true
    })

    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('p', 'mm', 'a4')
    
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()
    const imgWidth = canvas.width
    const imgHeight = canvas.height
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)
    const imgX = (pdfWidth - imgWidth * ratio) / 2
    const imgY = 30 // Space for header

    // Add header dengan kop surat
    if (profilLembaga) {
      // Logo
      if (profilLembaga.logo_url) {
        try {
          const logoImg = new Image()
          logoImg.crossOrigin = 'anonymous'
          logoImg.src = profilLembaga.logo_url
          await new Promise((resolve, reject) => {
            logoImg.onload = resolve
            logoImg.onerror = reject
          })
          pdf.addImage(logoImg, 'JPEG', 15, 10, 20, 20)
        } catch (error) {
          console.log('Logo not loaded, using text only')
        }
      }

      // Text header
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'bold')
      pdf.text(profilLembaga.nama_yayasan || '', pdfWidth / 2, 15, { align: 'center' })
      
      pdf.setFontSize(14)
      pdf.text(profilLembaga.nama_lembaga || '', pdfWidth / 2, 20, { align: 'center' })
      
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      pdf.text(profilLembaga.alamat || '', pdfWidth / 2, 25, { align: 'center' })
      pdf.text(`${profilLembaga.kab_kota || ''} - ${profilLembaga.no_telepon || ''}`, pdfWidth / 2, 29, { align: 'center' })
      
      // Garis bawah header
      pdf.setLineWidth(0.5)
      pdf.line(15, 32, pdfWidth - 15, 32)
    }

    // Add title
    if (title) {
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'bold')
      pdf.text(title, pdfWidth / 2, 38, { align: 'center' })
    }

    // Add content
    pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio)

    // Add footer
    if (profilLembaga) {
      const footerY = pdfHeight - 25
      
      // Garis atas footer
      pdf.setLineWidth(0.5)
      pdf.line(15, footerY - 5, pdfWidth - 15, footerY - 5)
      
      // Footer text
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      pdf.text(`Mengetahui,`, pdfWidth / 2 - 40, footerY)
      pdf.text(`${profilLembaga.kab_kota}, ${new Date().toLocaleDateString('id-ID')}`, pdfWidth / 2 + 40, footerY)
      
      pdf.text(profilLembaga.nama_kepala || '', pdfWidth / 2 - 40, footerY + 15)
      pdf.text('NIP. ' + (profilLembaga.nip_kepala || ''), pdfWidth / 2 - 40, footerY + 20)
      
      pdf.text('(___________________________)', pdfWidth / 2 + 40, footerY + 15)
    }

    // Save PDF
    pdf.save(filename)
    return true
  } catch (error) {
    console.error('Error exporting PDF:', error)
    throw error
  }
}

export const exportToExcel = (data, filename) => {
  try {
    // Import XLSX dynamically to avoid SSR issues
    import('xlsx').then((XLSX) => {
      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Data')
      XLSX.writeFile(wb, filename)
    })
    return true
  } catch (error) {
    console.error('Error exporting Excel:', error)
    throw error
  }
}

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR'
  }).format(amount)
}

export const formatDate = (date, format = 'long') => {
  const options = {
    long: {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    },
    short: {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    },
    dateOnly: {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }
  }

  return new Date(date).toLocaleDateString('id-ID', options[format] || options.long)
}

export const generateExcelTemplate = (columns, filename) => {
  try {
    import('xlsx').then((XLSX) => {
      // Create template with column headers only
      const template = columns.map(col => ({ [col]: '' }))
      const ws = XLSX.utils.json_to_sheet(template)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Template')
      XLSX.writeFile(wb, filename)
    })
    return true
  } catch (error) {
    console.error('Error generating template:', error)
    throw error
  }
}

export const parseExcelFile = async (file) => {
  try {
    const data = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          import('xlsx').then((XLSX) => {
            const data = new Uint8Array(e.target.result)
            const workbook = XLSX.read(data, { type: 'array' })
            const sheetName = workbook.SheetNames[0]
            const worksheet = workbook.Sheets[sheetName]
            const jsonData = XLSX.utils.sheet_to_json(worksheet)
            resolve(jsonData)
          })
        } catch (error) {
          reject(error)
        }
      }
      reader.onerror = reject
      reader.readAsArrayBuffer(file)
    })
    
    return data
  } catch (error) {
    console.error('Error parsing Excel file:', error)
    throw error
  }
}