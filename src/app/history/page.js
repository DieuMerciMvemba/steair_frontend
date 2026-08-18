"use client";
import { useState, useEffect, useMemo, useCallback } from 'react'
import { Calendar, Filter, ChevronDown, X, BarChart3, Table, Activity, ChevronLeft, ChevronRight } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import axios from 'axios'
import Link from 'next/link'
import { useToast } from '../../hooks/useToast'
import { ToastContainer } from '../../components/Toast'

export default function HistoryPage() {
  const { success, error: showToastError, toasts, removeToast } = useToast()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState('24h')
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' })
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    minTemp: '',
    maxTemp: '',
    minHumidity: '',
    maxHumidity: '',
    alertOnly: false
  })
  const [viewMode, setViewMode] = useState('charts') // charts, table
  const [stats, setStats] = useState(null)
  const [backendError, setBackendError] = useState(null)
  const [consecutiveErrors, setConsecutiveErrors] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 25

  // Reset page when period or filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedPeriod, customDateRange, filters])

  const periods = [
    { id: '24h', label: '24 Heures', hours: 24 },
    { id: '7d', label: '7 Jours', hours: 24 * 7 },
    { id: '30d', label: '30 Jours', hours: 24 * 30 },
    { id: 'custom', label: 'Personnalisé', hours: null }
  ]

  useEffect(() => {
    if (selectedPeriod !== 'custom') {
      const period = periods.find(p => p.id === selectedPeriod)
      if (period && period.hours) {
        const end = new Date()
        const start = new Date(end.getTime() - period.hours * 60 * 60 * 1000)
        setCustomDateRange({
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0]
        })
      }
    }
  }, [selectedPeriod])

  const calculateStats = (historyData) => {
    if (!historyData || historyData.length === 0) {
      setStats(null)
      return
    }

    const temps = historyData.map(d => d.temperature)
    const humidity = historyData.map(d => d.humidity)
    const pressure = historyData.filter(d => d.pressure_hpa).map(d => d.pressure_hpa)

    setStats({
      totalRecords: historyData.length,
      temperature: {
        min: Math.min(...temps),
        max: Math.max(...temps),
        avg: temps.reduce((a, b) => a + b, 0) / temps.length
      },
      humidity: {
        min: Math.min(...humidity),
        max: Math.max(...humidity),
        avg: humidity.reduce((a, b) => a + b, 0) / humidity.length
      },
      pressure: pressure.length > 0 ? {
        min: Math.min(...pressure),
        max: Math.max(...pressure),
        avg: pressure.reduce((a, b) => a + b, 0) / pressure.length
      } : null,
      alertCount: historyData.filter(d => d.alert_active).length
    })
  }

  const fetchData = useCallback(async () => {
    if (!customDateRange.start || !customDateRange.end) return

    setLoading(true)
    try {
      let url = `/api/history?start=${customDateRange.start}&end=${customDateRange.end}&limit=1000`
      if (filters.minTemp) url += `&minTemp=${filters.minTemp}`
      if (filters.maxTemp) url += `&maxTemp=${filters.maxTemp}`
      if (filters.minHumidity) url += `&minHumidity=${filters.minHumidity}`
      if (filters.maxHumidity) url += `&maxHumidity=${filters.maxHumidity}`
      if (filters.alertOnly) url += `&alertOnly=true`

      const response = await axios.get(url)
      setData(response.data.data || [])
      calculateStats(response.data.data || [])
      setBackendError(null)
      setConsecutiveErrors(0)
    } catch (err) {
      setConsecutiveErrors(prev => {
        const nextErrors = prev + 1
        setBackendError('Alerte de connexion - Vérifiez le backend')
        return nextErrors
      })
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [customDateRange, filters])

  useEffect(() => {
    if (backendError) {
      showToastError(backendError)
    }
  }, [backendError, showToastError])

  useEffect(() => {
    fetchData()
  }, [customDateRange, filters, fetchData])

  const resetFilters = () => {
    setFilters({
      minTemp: '',
      maxTemp: '',
      minHumidity: '',
      maxHumidity: '',
      alertOnly: false
    })
  }

  const chartData = useMemo(() => {
    return data.map(item => ({
      time: new Date(item.timestamp).toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }),
      temperature: item.temperature,
      humidity: item.humidity,
      pressure: item.pressure_hpa,
      alert: item.alert_active
    })).reverse()
  }, [data])

  const totalPages = Math.ceil(data.length / itemsPerPage)

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return data.slice(start, start + itemsPerPage)
  }, [data, currentPage])

  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-12">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Header Title */}
      <section className="mb-12">
        <span className="glass-pill px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase mb-4 inline-block">
          Analyses de Relevés
        </span>
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-4">Historique de la Station</h1>
        <p className="text-slate-400 max-w-2xl">
          Visualisez l'évolution du climat intérieur ou local sur des périodes définies et appliquez des filtres.
        </p>
      </section>

      {/* Period Selection */}
      <div className="glass-card rounded-2xl p-6 mb-8">
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <span className="text-slate-300 text-sm font-medium">Sélectionner la Période :</span>
          <div className="flex gap-2 flex-wrap">
            {periods.map(period => (
              <button
                key={period.id}
                onClick={() => setSelectedPeriod(period.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                  selectedPeriod === period.id
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>

        {selectedPeriod === 'custom' && (
          <div className="flex gap-4 items-end flex-wrap">
            <div>
              <label className="block text-xs text-slate-400 mb-2">Date début</label>
              <input
                type="date"
                value={customDateRange.start}
                onChange={(e) => setCustomDateRange({ ...customDateRange, start: e.target.value })}
                className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-indigo-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-2">Date fin</label>
              <input
                type="date"
                value={customDateRange.end}
                onChange={(e) => setCustomDateRange({ ...customDateRange, end: e.target.value })}
                className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-indigo-500 text-sm"
              />
            </div>
            <button
              onClick={fetchData}
              disabled={!customDateRange.start || !customDateRange.end}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed rounded-xl transition-colors font-semibold text-sm cursor-pointer"
            >
              Appliquer
            </button>
          </div>
        )}
      </div>

      {/* Filters Button */}
      <div className="glass-card rounded-2xl p-6 mb-8">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors cursor-pointer text-sm font-semibold"
        >
          <Filter className="w-4 h-4 text-indigo-400" />
          <span>Filtres de Données</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>

        {showFilters && (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-2">Température min (°C)</label>
              <input
                type="number"
                value={filters.minTemp}
                onChange={(e) => setFilters({ ...filters, minTemp: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                placeholder="-10"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-2">Température max (°C)</label>
              <input
                type="number"
                value={filters.maxTemp}
                onChange={(e) => setFilters({ ...filters, maxTemp: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                placeholder="50"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-2">Humidité min (%)</label>
              <input
                type="number"
                value={filters.minHumidity}
                onChange={(e) => setFilters({ ...filters, minHumidity: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                placeholder="10"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-2">Humidité max (%)</label>
              <input
                type="number"
                value={filters.maxHumidity}
                onChange={(e) => setFilters({ ...filters, maxHumidity: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                placeholder="100"
              />
            </div>
            <div className="sm:col-span-2 flex items-center gap-2 mt-4">
              <input
                type="checkbox"
                id="alertOnly"
                checked={filters.alertOnly}
                onChange={(e) => setFilters({ ...filters, alertOnly: e.target.checked })}
                className="w-4 h-4 rounded bg-slate-900 border-slate-800 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="alertOnly" className="text-sm text-slate-300">Uniquement les alertes actives</label>
            </div>
            <div className="sm:col-span-2 flex justify-end gap-2 mt-4">
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-colors flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                Réinitialiser
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View Selector */}
      <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('charts')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all flex items-center gap-2 cursor-pointer ${
              viewMode === 'charts' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Graphique
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all flex items-center gap-2 cursor-pointer ${
              viewMode === 'table' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <Table className="w-4 h-4" />
            Tableau
          </button>
        </div>
        <div className="text-xs text-slate-500">
          {data.length} enregistrements trouvés
        </div>
      </div>

      {/* Content View */}
      {loading ? (
        <div className="h-64 flex justify-center items-center">
          <Activity className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      ) : viewMode === 'charts' ? (
        <div className="glass-card rounded-2xl p-6">
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#475569" fontSize={11} />
              <YAxis stroke="#475569" fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.9)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line type="monotone" dataKey="temperature" stroke="#f87171" strokeWidth={2} name="Température (°C)" dot={false} />
              <Line type="monotone" dataKey="humidity" stroke="#60a5fa" strokeWidth={2} name="Humidité (%)" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-slate-900/50 text-slate-400 border-b border-white/5">
                <tr>
                  <th className="px-6 py-4 font-semibold">Date & Heure</th>
                  <th className="px-6 py-4 font-semibold">Temp.</th>
                  <th className="px-6 py-4 font-semibold">Humidité</th>
                  <th className="px-6 py-4 font-semibold">Pression</th>
                  <th className="px-6 py-4 font-semibold">Alerte</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paginatedData.map((measure) => (
                  <tr key={measure.id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="px-6 py-4 text-slate-300 font-mono">
                      {new Date(measure.timestamp).toLocaleString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 font-semibold text-white">{measure.temperature.toFixed(1)}°C</td>
                    <td className="px-6 py-4">{measure.humidity.toFixed(0)}%</td>
                    <td className="px-6 py-4">{measure.pressure_hpa ? `${measure.pressure_hpa.toFixed(0)} hPa` : '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        measure.alert_active ? 'bg-rose-500/10 text-rose-400' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {measure.alert_active ? 'Active' : 'Non'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center p-4 border-t border-white/5 bg-slate-950/30 text-xs sm:text-sm">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Précédent</span>
              </button>
              <span className="text-slate-400 font-medium">
                Page {currentPage} sur {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                <span>Suivant</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
