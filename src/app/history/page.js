"use client";
import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Calendar, Filter, ChevronDown, X, BarChart3, Table, Activity, Signal, Cpu, Compass,
  ChevronLeft, ChevronRight, Home, FileText, MessageSquare, LogOut, LogIn, Menu, FileJson, FileSpreadsheet
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import Link from 'next/link';
import { useToast } from '../../hooks/useToast';
import { ToastContainer } from '../../components/Toast';
import { useAuth } from '../../hooks/useAuth';
import { useFileExport } from '../../hooks/useFileExport';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';

export default function HistoryPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const { success, error: showToastError, toasts, removeToast } = useToast();
  const { exportJSON, exportExcel } = useFileExport();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stations, setStations] = useState([]);
  const [selectedStationId, setSelectedStationId] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('24h');
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filters, setFilters] = useState({
    minTemp: '',
    maxTemp: '',
    minHumidity: '',
    maxHumidity: '',
    alertOnly: false
  });
  const [filterParasites, setFilterParasites] = useState(true);
  const [dailyDate, setDailyDate] = useState('2026-09-21');
  const [dailySummary, setDailySummary] = useState(null);
  const [loadingDaily, setLoadingDaily] = useState(false);

  const [viewMode, setViewMode] = useState('daily'); // daily, charts, table
  const [stats, setStats] = useState(null);
  const [backendError, setBackendError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  const currentRole = user?.role || 'public';

  const fetchDailySummary = useCallback(async () => {
    if (!dailyDate) return;
    setLoadingDaily(true);
    try {
      let url = `/api/daily-summary?date=${dailyDate}&filterParasites=${filterParasites ? 'true' : 'false'}`;
      if (selectedStationId) url += `&stationId=${selectedStationId}`;
      const response = await axios.get(url);
      setDailySummary(response.data);
    } catch (err) {
      console.error("Erreur lors du chargement du bilan journalier", err);
    } finally {
      setLoadingDaily(false);
    }
  }, [dailyDate, selectedStationId, filterParasites]);

  useEffect(() => {
    if (user && viewMode === 'daily') {
      fetchDailySummary();
    }
  }, [user, viewMode, fetchDailySummary]);

  // Load stations on mount
  useEffect(() => {
    async function loadStations() {
      try {
        const res = await axios.get('/api/stations');
        const list = res.data || [];
        setStations(list);

        const params = new URLSearchParams(window.location.search);
        const urlStationId = params.get('stationId');

        if (urlStationId) {
          setSelectedStationId(urlStationId);
        } else if (list.length > 0) {
          setSelectedStationId(list[0].id);
        }
      } catch (err) {
        console.error("Erreur lors du chargement des stations", err);
      }
    }
    if (user) {
      loadStations();
    }
  }, [user]);

  // Reset page when period or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedPeriod, customDateRange, filters, selectedStationId]);

  const periods = [
    { id: '24h', label: '24 Heures', hours: 24 },
    { id: '7d', label: '7 Jours', hours: 24 * 7 },
    { id: '30d', label: '30 Jours', hours: 24 * 30 },
    { id: 'custom', label: 'Personnalisé', hours: null }
  ];

  useEffect(() => {
    if (selectedPeriod !== 'custom') {
      const period = periods.find(p => p.id === selectedPeriod);
      if (period && period.hours) {
        const end = new Date();
        const start = new Date(end.getTime() - period.hours * 60 * 60 * 1000);
        setCustomDateRange({
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0]
        });
      }
    }
  }, [selectedPeriod]);

  const calculateStats = (historyData) => {
    if (!historyData || historyData.length === 0) {
      setStats(null);
      return;
    }

    const temps = historyData.map(d => d.temperature);
    const humidity = historyData.map(d => d.humidity);
    const pressure = historyData.filter(d => d.pressure).map(d => d.pressure);

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
      alertCount: historyData.filter(d => d.alertActive).length
    });
  };

  const fetchData = useCallback(async () => {
    if (!customDateRange.start || !customDateRange.end) return;

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      setLoading(false);
      return;
    }

    if (!axios.defaults.headers.common['Authorization']) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    setLoading(true);
    try {
      let url = `/api/history?start=${customDateRange.start}&end=${customDateRange.end}&limit=1000`;
      if (selectedStationId) url += `&stationId=${selectedStationId}`;
      if (filters.minTemp) url += `&minTemp=${filters.minTemp}`;
      if (filters.maxTemp) url += `&maxTemp=${filters.maxTemp}`;
      if (filters.minHumidity) url += `&minHumidity=${filters.minHumidity}`;
      if (filters.maxHumidity) url += `&maxHumidity=${filters.maxHumidity}`;
      if (filters.alertOnly) url += `&alertOnly=true`;

      const response = await axios.get(url);
      setData(response.data.data || []);
      calculateStats(response.data.data || []);
      setBackendError(null);
    } catch (err) {
      setBackendError('Alerte de connexion - Vérifiez le backend');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [customDateRange, filters, selectedStationId]);

  useEffect(() => {
    if (backendError) {
      showToastError(backendError);
    }
  }, [backendError, showToastError]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [customDateRange, filters, selectedStationId, fetchData, user]);

  const resetFilters = () => {
    setFilters({
      minTemp: '',
      maxTemp: '',
      minHumidity: '',
      maxHumidity: '',
      alertOnly: false
    });
  };

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
      pressure: item.pressure,
      alert: item.alertActive
    })).reverse();
  }, [data]);

  const totalPages = Math.ceil(data.length / itemsPerPage);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return data.slice(start, start + itemsPerPage);
  }, [data, currentPage]);

  // ─── Early returns APRÈS tous les hooks ───────────────────────────────────
  if (authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <Activity className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm">Chargement de l'historique...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleExportJSON = async () => {
    const result = await exportJSON(selectedStationId);
    if (result) {
      success('Export JSON réussi');
    } else {
      showToastError('Échec de l\'export JSON');
    }
  };

  const handleExportExcel = async () => {
    const result = await exportExcel(selectedStationId);
    if (result) {
      success('Export Excel réussi');
    } else {
      showToastError('Échec de l\'export Excel');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex bg-[#090b14] text-slate-800 font-sans overflow-hidden p-2 md:p-3 gap-2 md:gap-3">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* SIDEBAR COMPONENT (DESKTOP & MOBILE) */}
      <Sidebar mobileOpen={sidebarOpen} setMobileOpen={setSidebarOpen} />

      {/* MAIN WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#f4f6f9] rounded-[24px] shadow-2xl border border-slate-800/20">
        
        {/* Top Header Bar */}
        <header className="h-14 md:h-16 bg-white border-b border-slate-200 px-3 md:px-6 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-2 md:gap-4 min-w-0">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden text-slate-600 p-1.5 hover:bg-slate-100 rounded-xl transition-all shrink-0">
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-sm md:text-lg font-bold text-[#0f2042] tracking-wide hidden sm:inline-block truncate">
              Historique
            </h2>
            {stations.length > 0 && (
              <select
                value={selectedStationId}
                onChange={(e) => setSelectedStationId(e.target.value)}
                className="bg-slate-100 border border-slate-200 rounded-xl px-2 md:px-3 py-1.5 text-[11px] md:text-xs font-bold text-[#0f2042] focus:outline-none focus:border-indigo-500 cursor-pointer shadow-sm max-w-[140px] md:max-w-none truncate"
              >
                {stations.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name} ({st.code})
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="text-[10px] md:text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 md:px-3 py-1 md:py-1.5 rounded-full border border-slate-200 shrink-0">
            KongoClim
          </div>
        </header>

        {/* Espace central */}
        <main className="flex-1 overflow-y-auto p-3 md:p-6 space-y-4 md:space-y-6">

          {/* Filtres de sélection de Période */}
          <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-slate-100">
            <div className="flex flex-wrap items-center gap-3 md:gap-4">
              <span className="text-[#0f2042] text-xs md:text-sm font-bold">Période :</span>
              <div className="flex gap-1.5 md:gap-2 flex-wrap">
                {periods.map(period => (
                  <button
                    key={period.id}
                    onClick={() => setSelectedPeriod(period.id)}
                    className={`px-3 md:px-4 py-1.5 md:py-2 rounded-xl text-[11px] md:text-xs font-bold transition-all cursor-pointer ${
                      selectedPeriod === period.id
                        ? 'bg-[#0f2042] text-white shadow-md'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {period.label}
                  </button>
                ))}
              </div>
            </div>

            {selectedPeriod === 'custom' && (
              <div className="flex gap-3 md:gap-4 items-end flex-wrap mt-4 border-t border-slate-100 pt-4">
                <div className="flex-1 min-w-[120px]">
                  <label className="block text-[11px] md:text-xs text-slate-500 mb-1.5 md:mb-2 font-semibold">Début</label>
                  <input
                    type="date"
                    value={customDateRange.start}
                    onChange={(e) => setCustomDateRange({ ...customDateRange, start: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 md:px-4 py-2 text-slate-800 focus:outline-none focus:border-[#0f2042] text-sm"
                  />
                </div>
                <div className="flex-1 min-w-[120px]">
                  <label className="block text-[11px] md:text-xs text-slate-500 mb-1.5 md:mb-2 font-semibold">Fin</label>
                  <input
                    type="date"
                    value={customDateRange.end}
                    onChange={(e) => setCustomDateRange({ ...customDateRange, end: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 md:px-4 py-2 text-slate-800 focus:outline-none focus:border-[#0f2042] text-sm"
                  />
                </div>
                <button
                  onClick={fetchData}
                  disabled={!customDateRange.start || !customDateRange.end}
                  className="px-5 md:px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed rounded-xl transition-all font-bold text-sm cursor-pointer"
                >
                  OK
                </button>
              </div>
            )}
          </div>

          {/* Section d'indicateurs de filtres additionnels */}
          <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-slate-100">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-[#0f2042] hover:text-slate-600 transition-colors cursor-pointer text-sm font-bold"
            >
              <Filter className="w-4 h-4 text-amber-500" />
              <span>Filtres de Données supplémentaires</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>

            {showFilters && (
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 border-t border-slate-100 pt-4">
                <div>
                  <label className="block text-xs text-slate-500 mb-2 font-semibold">Température min (°C)</label>
                  <input
                    type="number"
                    value={filters.minTemp}
                    onChange={(e) => setFilters({ ...filters, minTemp: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-800 text-sm focus:outline-none focus:border-[#0f2042]"
                    placeholder="-10"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-2 font-semibold">Température max (°C)</label>
                  <input
                    type="number"
                    value={filters.maxTemp}
                    onChange={(e) => setFilters({ ...filters, maxTemp: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-800 text-sm focus:outline-none focus:border-[#0f2042]"
                    placeholder="50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-2 font-semibold">Humidité min (%)</label>
                  <input
                    type="number"
                    value={filters.minHumidity}
                    onChange={(e) => setFilters({ ...filters, minHumidity: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-800 text-sm focus:outline-none focus:border-[#0f2042]"
                    placeholder="10"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-2 font-semibold">Humidité max (%)</label>
                  <input
                    type="number"
                    value={filters.maxHumidity}
                    onChange={(e) => setFilters({ ...filters, maxHumidity: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-800 text-sm focus:outline-none focus:border-[#0f2042]"
                    placeholder="100"
                  />
                </div>
                <div className="sm:col-span-2 flex items-center gap-2 mt-4">
                  <input
                    type="checkbox"
                    id="alertOnly"
                    checked={filters.alertOnly}
                    onChange={(e) => setFilters({ ...filters, alertOnly: e.target.checked })}
                    className="w-4 h-4 rounded bg-slate-100 border-slate-350 text-[#0f2042] focus:ring-[#0f2042]"
                  />
                  <label htmlFor="alertOnly" className="text-sm font-semibold text-slate-700">Uniquement les alertes actives</label>
                </div>
                <div className="sm:col-span-4 flex items-center gap-2 mt-2 bg-amber-50/60 p-3 rounded-xl border border-amber-200/60">
                  <input
                    type="checkbox"
                    id="filterParasites"
                    checked={filterParasites}
                    onChange={(e) => setFilterParasites(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <label htmlFor="filterParasites" className="text-xs font-bold text-amber-900 cursor-pointer">
                    Filtrer automatiquement les anomalies d'initialisation (P &lt; 800 hPa / 22.23°C / 0% hum.)
                  </label>
                  <span className="text-[11px] text-amber-700 font-medium ml-auto hidden sm:inline">
                    ({filterParasites ? 'Données nettoyées pour rapports' : 'Télémétrie brute intégrale'})
                  </span>
                </div>
                <div className="sm:col-span-2 flex justify-end gap-2 mt-4">
                  <button
                    onClick={resetFilters}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-colors flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    Réinitialiser
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Section d'affichage des graphiques / tableaux */}
          <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-4 md:mb-6 flex-wrap gap-3 border-b border-slate-100 pb-3 md:pb-4">
              <div className="flex gap-1.5 md:gap-2 flex-wrap">
                <button
                  onClick={() => setViewMode('daily')}
                  className={`px-3 md:px-4 py-1.5 md:py-2 rounded-xl text-[11px] md:text-xs font-bold transition-all flex items-center gap-1.5 md:gap-2 cursor-pointer ${
                    viewMode === 'daily' ? 'bg-[#0f2042] text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-400" />
                  <span className="hidden sm:inline">Bilan</span> Journalier
                </button>
                <button
                  onClick={() => setViewMode('charts')}
                  className={`px-3 md:px-4 py-1.5 md:py-2 rounded-xl text-[11px] md:text-xs font-bold transition-all flex items-center gap-1.5 md:gap-2 cursor-pointer ${
                    viewMode === 'charts' ? 'bg-[#0f2042] text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  Graphique
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 md:px-4 py-1.5 md:py-2 rounded-xl text-[11px] md:text-xs font-bold transition-all flex items-center gap-1.5 md:gap-2 cursor-pointer ${
                    viewMode === 'table' ? 'bg-[#0f2042] text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Table className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  Tableau
                </button>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-[10px] md:text-xs font-bold text-slate-500 bg-slate-100 px-2.5 md:px-3 py-1 rounded-full border border-slate-200">
                  {viewMode === 'daily' && dailySummary ? `${dailySummary.validCount}/${dailySummary.totalCount}` : `${data.length} enreg.`}
                </div>
              </div>
            </div>

            {/* Ingestion & Export options */}
            {(currentRole === 'researcher' || currentRole === 'admin' || currentRole === 'tech') && (
              <div className="flex flex-wrap justify-end gap-2 md:gap-3 mb-4 md:mb-6">
                <button onClick={handleExportJSON} className="flex items-center gap-1.5 md:gap-2 bg-[#0f2042] hover:bg-slate-800 text-white text-[11px] md:text-xs font-semibold px-3 md:px-4 py-1.5 md:py-2 rounded-xl transition-all cursor-pointer">
                  <FileJson className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-400" />
                  JSON {filterParasites ? '(F)' : ''}
                </button>
                <button onClick={handleExportExcel} className="flex items-center gap-1.5 md:gap-2 bg-amber-500 hover:bg-amber-600 text-white text-[11px] md:text-xs font-semibold px-3 md:px-4 py-1.5 md:py-2 rounded-xl transition-all cursor-pointer shadow-sm">
                  <FileSpreadsheet className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  Excel {filterParasites ? '(F)' : ''}
                </button>
              </div>
            )}

            {/* VUE 1 : BILAN JOURNALIER STYLE WEATHER UNDERGROUND */}
            {viewMode === 'daily' ? (
              <div className="space-y-6">
                {/* Date Picker & Presets */}
                <div className="bg-[#f8fafc] p-3 md:p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-2 md:gap-3">
                    <label className="text-[11px] md:text-xs font-bold text-[#0f2042] shrink-0">Journée :</label>
                    <input
                      type="date"
                      value={dailyDate}
                      onChange={(e) => setDailyDate(e.target.value)}
                      className="bg-white border border-slate-300 rounded-xl px-2.5 md:px-3 py-1.5 text-sm font-semibold text-[#0f2042] focus:outline-none focus:border-[#0f2042] w-full sm:w-auto"
                    />
                  </div>
                  <div className="flex gap-1.5 md:gap-2 flex-wrap text-xs overflow-x-auto">
                    {['2026-09-19', '2026-09-20', '2026-09-21', '2026-09-22'].map((d) => (
                      <button
                        key={d}
                        onClick={() => setDailyDate(d)}
                        className={`px-2.5 md:px-3 py-1 rounded-lg font-bold transition-all shrink-0 ${
                          dailyDate === d ? 'bg-[#0f2042] text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {d.split('-').slice(1).join('/')}
                      </button>
                    ))}
                  </div>
                </div>

                {loadingDaily ? (
                  <div className="h-64 flex justify-center items-center">
                    <Activity className="w-8 h-8 text-indigo-500 animate-spin" />
                  </div>
                ) : !dailySummary ? (
                  <div className="h-48 flex justify-center items-center text-slate-400 font-medium">Aucune donnée trouvée pour cette date.</div>
                ) : (
                  <>
                    {/* Header Banner */}
                    <div className="bg-gradient-to-r from-[#0f2042] to-[#1e3a8a] text-white p-4 md:p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 md:gap-4">
                      <div>
                        <h3 className="text-sm md:text-base font-bold flex items-center gap-2">
                          <Calendar className="w-4 h-4 md:w-5 md:h-5 text-amber-400" />
                          {dailySummary.date} ({dailySummary.dayName})
                        </h3>
                        <p className="text-[11px] md:text-xs text-slate-300 mt-1">
                          {dailySummary.validCount} relevés valides / {dailySummary.totalCount} totaux
                        </p>
                      </div>
                      <div className="bg-white/10 backdrop-blur-md px-3 md:px-4 py-1.5 md:py-2 rounded-xl border border-white/20 text-[11px] md:text-xs font-semibold">
                        Biais ΔT : <span className="text-amber-300 font-bold">{dailySummary.summary.biasDelta !== null ? `+${dailySummary.summary.biasDelta} °C` : 'N/A'}</span>
                      </div>
                    </div>

                    {/* Cards min/max/moyenne des 2 capteurs — Design Pro Météo Clean */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                      {/* Temp BMP280 */}
                      <div className="bg-white p-3.5 md:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                        <div>
                          <div className="text-[10px] md:text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 md:mb-2">Temp. BMP280</div>
                          <div className="flex items-baseline gap-1 md:gap-2">
                            <span className="text-xl md:text-2xl font-black text-[#0f2042]">
                              {dailySummary.summary.temperatureBmp.avg !== null ? `${dailySummary.summary.temperatureBmp.avg}` : 'N/A'}
                            </span>
                            <span className="text-[10px] md:text-xs font-semibold text-slate-400">°C</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-1 md:gap-2 text-[10px] md:text-xs font-medium text-slate-600 mt-3 md:mt-4 pt-2 md:pt-3 border-t border-slate-100">
                          <div>Min: <strong className="text-slate-900 font-bold">{dailySummary.summary.temperatureBmp.min ?? '-'}</strong></div>
                          <div>Max: <strong className="text-slate-900 font-bold">{dailySummary.summary.temperatureBmp.max ?? '-'}</strong></div>
                        </div>
                      </div>

                      {/* Temp DHT22 */}
                      <div className="bg-white p-3.5 md:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                        <div>
                          <div className="text-[10px] md:text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 md:mb-2">Temp. DHT22</div>
                          <div className="flex items-baseline gap-1 md:gap-2">
                            <span className="text-xl md:text-2xl font-black text-[#0f2042]">
                              {dailySummary.summary.temperatureDht22.avg !== null ? `${dailySummary.summary.temperatureDht22.avg}` : 'N/A'}
                            </span>
                            <span className="text-[10px] md:text-xs font-semibold text-slate-400">°C</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-1 md:gap-2 text-[10px] md:text-xs font-medium text-slate-600 mt-3 md:mt-4 pt-2 md:pt-3 border-t border-slate-100">
                          <div>Min: <strong className="text-slate-900 font-bold">{dailySummary.summary.temperatureDht22.min ?? '-'}</strong></div>
                          <div>Max: <strong className="text-slate-900 font-bold">{dailySummary.summary.temperatureDht22.max ?? '-'}</strong></div>
                        </div>
                      </div>

                      {/* Humidité DHT22 */}
                      <div className="bg-white p-3.5 md:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                        <div>
                          <div className="text-[10px] md:text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 md:mb-2">Hum. DHT22</div>
                          <div className="flex items-baseline gap-1 md:gap-2">
                            <span className="text-xl md:text-2xl font-black text-[#0f2042]">
                              {dailySummary.summary.humidityDht22.avg !== null ? `${dailySummary.summary.humidityDht22.avg}` : 'N/A'}
                            </span>
                            <span className="text-[10px] md:text-xs font-semibold text-slate-400">%</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-1 md:gap-2 text-[10px] md:text-xs font-medium text-slate-600 mt-3 md:mt-4 pt-2 md:pt-3 border-t border-slate-100">
                          <div>Min: <strong className="text-slate-900 font-bold">{dailySummary.summary.humidityDht22.min ?? '-'}</strong></div>
                          <div>Max: <strong className="text-slate-900 font-bold">{dailySummary.summary.humidityDht22.max ?? '-'}</strong></div>
                        </div>
                      </div>

                      {/* Pression BMP280 */}
                      <div className="bg-white p-3.5 md:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                        <div>
                          <div className="text-[10px] md:text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 md:mb-2">Pression BMP</div>
                          <div className="flex items-baseline gap-1 md:gap-2">
                            <span className="text-xl md:text-2xl font-black text-[#0f2042]">
                              {dailySummary.summary.pressureBmp.avg !== null ? `${dailySummary.summary.pressureBmp.avg}` : 'N/A'}
                            </span>
                            <span className="text-[10px] md:text-xs font-semibold text-slate-400">hPa</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-1 md:gap-2 text-[10px] md:text-xs font-medium text-slate-600 mt-3 md:mt-4 pt-2 md:pt-3 border-t border-slate-100">
                          <div>Min: <strong className="text-slate-900 font-bold">{dailySummary.summary.pressureBmp.min ?? '-'}</strong></div>
                          <div>Max: <strong className="text-slate-900 font-bold">{dailySummary.summary.pressureBmp.max ?? '-'}</strong></div>
                        </div>
                      </div>
                    </div>

                    {/* Detailed Hourly Table */}
                    <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-xs -mx-1 md:mx-0">
                      <table className="w-full text-[10px] md:text-xs text-left min-w-[640px]">
                        <thead className="uppercase bg-[#0f2042] text-white">
                          <tr>
                            <th className="px-2.5 md:px-4 py-2.5 md:py-3 font-semibold">Heure</th>
                            <th className="px-2.5 md:px-4 py-2.5 md:py-3 font-semibold">T.BMP (°C)</th>
                            <th className="px-2.5 md:px-4 py-2.5 md:py-3 font-semibold">T.DHT (°C)</th>
                            <th className="px-2.5 md:px-4 py-2.5 md:py-3 font-semibold">ΔT (°C)</th>
                            <th className="px-2.5 md:px-4 py-2.5 md:py-3 font-semibold">Hum. (%)</th>
                            <th className="px-2.5 md:px-4 py-2.5 md:py-3 font-semibold">P (hPa)</th>
                            <th className="px-2.5 md:px-4 py-2.5 md:py-3 font-semibold">Pluie</th>
                            <th className="px-2.5 md:px-4 py-2.5 md:py-3 font-semibold">Statut</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {dailySummary.observations.map((obs) => (
                            <tr key={obs.id} className={`hover:bg-slate-50 transition-colors ${obs.isParasite ? 'bg-amber-50/40' : ''}`}>
                              <td className="px-2.5 md:px-4 py-2 md:py-3 font-mono font-bold text-slate-700">{obs.heure}</td>
                              <td className="px-2.5 md:px-4 py-2 md:py-3 font-bold text-amber-700">{obs.temperatureBmp !== null ? `${obs.temperatureBmp.toFixed(1)}` : '-'}</td>
                              <td className="px-2.5 md:px-4 py-2 md:py-3 font-bold text-sky-700">{obs.temperatureDht22 !== null ? `${obs.temperatureDht22.toFixed(1)}` : '-'}</td>
                              <td className="px-2.5 md:px-4 py-2 md:py-3 font-semibold text-slate-600">
                                {obs.deltaTemp !== null ? (
                                  <span className={obs.deltaTemp > 2 ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                                    {obs.deltaTemp > 0 ? `+${obs.deltaTemp}` : obs.deltaTemp}
                                  </span>
                                ) : '-'}
                              </td>
                              <td className="px-2.5 md:px-4 py-2 md:py-3 font-semibold text-emerald-700">{obs.humidityDht22 !== null ? `${obs.humidityDht22.toFixed(0)}` : '-'}</td>
                              <td className="px-2.5 md:px-4 py-2 md:py-3 text-indigo-900 font-mono">{obs.pressureBmp !== null ? `${obs.pressureBmp.toFixed(1)}` : '-'}</td>
                              <td className="px-2.5 md:px-4 py-2 md:py-3">
                                <span className={`px-2 md:px-2.5 py-0.5 rounded-md text-[10px] md:text-[11px] font-bold ${obs.rain ? 'bg-blue-100 text-blue-800 border border-blue-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                                  {obs.rain ? 'Pluie' : 'Sec'}
                                </span>
                              </td>
                              <td className="px-2.5 md:px-4 py-2 md:py-3">
                                {obs.isParasite ? (
                                  <span className="px-1.5 md:px-2 py-0.5 rounded-md text-[9px] md:text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                    Init
                                  </span>
                                ) : (
                                  <span className="px-1.5 md:px-2 py-0.5 rounded-md text-[9px] md:text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    OK
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            ) : viewMode === 'charts' ? (
              <div className="bg-[#fcfdfe] p-4 rounded-xl border border-slate-100">
                {data.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-slate-400 font-medium">Aucun relevé dans cette période.</div>
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="time" stroke="#475569" fontSize={11} />
                      <YAxis stroke="#475569" fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #cbd5e1',
                          borderRadius: '12px',
                          color: '#0f2042'
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Line type="monotone" dataKey="temperature" stroke="#f87171" strokeWidth={2.5} name="Température (°C)" dot={false} />
                      <Line type="monotone" dataKey="humidity" stroke="#60a5fa" strokeWidth={2.5} name="Humidité (%)" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            ) : (
              /* Vue Tableau */
              <div className="overflow-x-auto border border-slate-100 rounded-xl -mx-1 md:mx-0">
                <table className="w-full text-xs md:text-sm text-left min-w-[480px]">
                  <thead className="text-[10px] md:text-xs uppercase bg-[#0f2042] text-white">
                    <tr>
                      <th className="px-3 md:px-6 py-3 md:py-4 font-semibold">Date & Heure</th>
                      <th className="px-3 md:px-6 py-3 md:py-4 font-semibold">Temp.</th>
                      <th className="px-3 md:px-6 py-3 md:py-4 font-semibold">Hum.</th>
                      <th className="px-3 md:px-6 py-3 md:py-4 font-semibold">Pression</th>
                      <th className="px-3 md:px-6 py-3 md:py-4 font-semibold">Alerte</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedData.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-3 md:px-6 py-8 text-center text-slate-400 font-medium">
                          Aucune donnée trouvée.
                        </td>
                      </tr>
                    ) : (
                      paginatedData.map((measure) => (
                        <tr key={measure.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-3 md:px-6 py-3 md:py-4 text-slate-500 font-mono text-[11px] md:text-sm">
                            {new Date(measure.timestamp).toLocaleString('fr-FR')}
                          </td>
                          <td className="px-3 md:px-6 py-3 md:py-4 font-bold text-[#0f2042]">{measure.temperature.toFixed(1)}°C</td>
                          <td className="px-3 md:px-6 py-3 md:py-4 font-semibold text-slate-700">{measure.humidity.toFixed(0)}%</td>
                          <td className="px-3 md:px-6 py-3 md:py-4 text-slate-600">{measure.pressure ? `${measure.pressure.toFixed(0)} hPa` : '-'}</td>
                          <td className="px-3 md:px-6 py-3 md:py-4">
                            <span className={`px-2 md:px-2.5 py-0.5 md:py-1 rounded-lg text-[10px] md:text-xs font-bold ${
                              measure.alertActive 
                                ? 'bg-rose-100 text-rose-700' 
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              {measure.alertActive ? 'ALERTE' : 'OK'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                {/* Pagination Footer */}
                {totalPages > 1 && (
                  <div className="flex justify-between items-center p-4 border-t border-slate-100 bg-slate-50 text-xs sm:text-sm font-semibold">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Précédent</span>
                    </button>
                    <span className="text-slate-500 font-medium">
                      Page {currentPage} sur {totalPages}
                    </span>
                    <button
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    >
                      <span>Suivant</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

        </main>
      </div>
    </div>
  );
}
