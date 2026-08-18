import { useState } from 'react'
import axios from 'axios'

export function useFileExport() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const exportJSON = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await axios.get('/api/export/json', { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `station_meteo_export_${new Date().toISOString().split('T')[0]}.json`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      return true
    } catch (err) {
      const errorMsg = 'Erreur lors de l\'export JSON'
      setError(errorMsg)
      console.error(errorMsg, err)
      return false
    } finally {
      setLoading(false)
    }
  }

  const exportExcel = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await axios.get('/api/export/excel', { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `station_meteo_export_${new Date().toISOString().split('T')[0]}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      return true
    } catch (err) {
      const errorMsg = 'Erreur lors de l\'export Excel'
      setError(errorMsg)
      console.error(errorMsg, err)
      return false
    } finally {
      setLoading(false)
    }
  }

  return { exportJSON, exportExcel, loading, error }
}
