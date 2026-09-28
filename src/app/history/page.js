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

  const SidebarContent = () => (
    <div className="flex flex-col h-full text-white">
      {/* Profil Utilisateur */}
      <div className="p-6 border-b border-slate-750 flex flex-col items-center text-center">
        <div className="w-20 h-20 bg-slate-700/50 rounded-full border-2 border-indigo-400/30 flex items-center justify-center mb-4 overflow-hidden relative shadow-inner">
          <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-300 font-bold text-xl uppercase">
            {user?.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2) : (user?.email ? user.email.substring(0, 2) : 'GP')}
          </div>
        </div>
        <h3 className="font-bold text-lg tracking-wide uppercase truncate max-w-full">
          {user?.name || user?.email || 'Visiteur'}
        </h3>
        <span className="text-xs text-slate-400 truncate max-w-full mb-2">
          {user?.email || 'Lecteur public'}
        </span>
        <span className="text-[10px] uppercase font-bold tracking-widest bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full border border-indigo-500/30">
          {currentRole === 'admin' ? 'SuperAdmin' : currentRole === 'tech' ? 'Technicien' : currentRole === 'researcher' ? 'Chercheur' : 'Public'}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        <Link href="/" className="flex items-center gap-4 px-4 py-3 rounded-xl text-slate-300 hover:bg-white/5 hover:text-white transition-all text-sm font-medium">
          <Home className="w-4 h-4 text-indigo-400" />
          Carte Réseau
        </Link>
        <Link href="/dashboard" className="flex items-center gap-4 px-4 py-3 rounded-xl text-slate-300 hover:bg-white/5 hover:text-white transition-all text-sm font-medium">
          <Activity className="w-4 h-4 text-indigo-400" />
          Dashboard
        </Link>
        <button onClick={() => setSidebarOpen(false)} className="w-full flex items-center gap-4 px-4 py-3 rounded-xl bg-white/10 text-white transition-all text-sm font-semibold text-left">
          <FileText className="w-4 h-4 text-indigo-400" />
          Historique
        </button>

        {user && (user.role === 'admin' || user.role === 'tech' || user.role === 'researcher') && (
          <Link href="/analysis" className="flex items-center gap-4 px-4 py-3 rounded-xl text-slate-300 hover:bg-white/5 hover:text-white transition-all text-sm font-medium">
            <BarChart3 className="w-4 h-4 text-indigo-400" />
            Analyse Climatique
          </Link>
        )}

        {user && (user.role === 'admin' || user.role === 'tech') && (
          <>
            <Link href="/diagnostics" className="flex items-center gap-4 px-4 py-3 rounded-xl text-slate-300 hover:bg-white/5 hover:text-white transition-all text-sm font-medium">
              <Signal className="w-4 h-4 text-indigo-400" />
              Santé & Alertes
            </Link>
            <Link href="/maintenance" className="flex items-center gap-4 px-4 py-3 rounded-xl text-slate-300 hover:bg-white/5 hover:text-white transition-all text-sm font-medium">
              <Cpu className="w-4 h-4 text-indigo-400" />
              Maintenance
            </Link>
          </>
        )}

        {user && user.role === 'admin' && (
          <Link href="/supervision" className="flex items-center gap-4 px-4 py-3 rounded-xl text-slate-300 hover:bg-white/5 hover:text-white transition-all text-sm font-medium">
            <Compass className="w-4 h-4 text-indigo-400" />
            Supervision
          </Link>
        )}

        <Link href="/interpretation" className="flex items-center gap-4 px-4 py-3 rounded-xl text-slate-300 hover:bg-white/5 hover:text-white transition-all text-sm font-medium">
          <MessageSquare className="w-4 h-4 text-indigo-400" />
          Interprétation
        </Link>
      </nav>

      {/* Déconnexion */}
      <div className="p-4 border-t border-slate-750">
        {user ? (
          <button onClick={logout} className="w-full flex items-center justify-center gap-3 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/25 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer">
            <LogOut className="w-4 h-4" />
            Déconnexion
          </button>
        ) : (
          <Link href="/login" className="w-full flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-950/40">
            <LogIn className="w-4 h-4" />
            Se Connecter
          </Link>
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex bg-[#f4f6f9] text-slate-800 font-sans overflow-hidden">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* 1. SIDEBAR DESKTOP */}
      <aside className="w-64 bg-[#0f2042] border-r border-slate-750 shrink-0 md:flex flex-col hidden shadow-2xl">
        <SidebarContent />
      </aside>

      {/* 2. SIDEBAR DRAWER MOBILE */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-[120] bg-black/60 md:hidden" onClick={() => setSidebarOpen(false)}>
          <aside className="w-64 bg-[#0f2042] h-full flex flex-col shadow-2xl animate-in slide-in-from-left duration-250" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-end p-4">
              <button onClick={() => setSidebarOpen(false)} className="text-white p-1.5 hover:bg-white/5 rounded-lg">
                <X className="w-6 h-6" />
              </button>
            </div>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* 3. MAIN WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden text-slate-600 p-2 hover:bg-slate-100 rounded-xl transition-all">
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-bold text-[#0f2042] tracking-wide hidden sm:inline-block">
              Historique des Relevés
            </h2>
            {stations.length > 0 && (
              <select
                value={selectedStationId}
                onChange={(e) => setSelectedStationId(e.target.value)}
                className="bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-[#0f2042] focus:outline-none focus:border-indigo-500 cursor-pointer shadow-sm"
              >
                {stations.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name} ({st.code})
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
            ● KongoClim Online
          </div>
        </header>

        {/* Espace central */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Filtres de sélection de Période */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-[#0f2042] text-sm font-bold">Période d'analyse :</span>
              <div className="flex gap-2 flex-wrap">
                {periods.map(period => (
                  <button
                    key={period.id}
                    onClick={() => setSelectedPeriod(period.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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
              <div className="flex gap-4 items-end flex-wrap mt-4 border-t border-slate-100 pt-4">
                <div>
                  <label className="block text-xs text-slate-500 mb-2 font-semibold">Date de début</label>
                  <input
                    type="date"
                    value={customDateRange.start}
                    onChange={(e) => setCustomDateRange({ ...customDateRange, start: e.target.value })}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-800 focus:outline-none focus:border-[#0f2042] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-2 font-semibold">Date de fin</label>
                  <input
                    type="date"
                    value={customDateRange.end}
                    onChange={(e) => setCustomDateRange({ ...customDateRange, end: e.target.value })}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-800 focus:outline-none focus:border-[#0f2042] text-sm"
                  />
                </div>
                <button
                  onClick={fetchData}
                  disabled={!customDateRange.start || !customDateRange.end}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed rounded-xl transition-all font-bold text-sm cursor-pointer"
                >
                  Appliquer
                </button>
              </div>
            )}
          </div>

          {/* Section d'indicateurs de filtres additionnels */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
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
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4 border-b border-slate-100 pb-4">
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setViewMode('daily')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    viewMode === 'daily' ? 'bg-[#0f2042] text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Calendar className="w-4 h-4 text-amber-400" />
                  Bilan Journalier (WU)
                </button>
                <button
                  onClick={() => setViewMode('charts')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    viewMode === 'charts' ? 'bg-[#0f2042] text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  Graphique
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    viewMode === 'table' ? 'bg-[#0f2042] text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Table className="w-4 h-4" />
                  Tableau Brut
                </button>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                  {viewMode === 'daily' && dailySummary ? `${dailySummary.validCount} / ${dailySummary.totalCount} relevés` : `${data.length} enregistrements`}
                </div>
              </div>
            </div>

            {/* Ingestion & Export options */}
            {(currentRole === 'researcher' || currentRole === 'admin' || currentRole === 'tech') && (
              <div className="flex justify-end gap-3 mb-6">
                <button onClick={handleExportJSON} className="flex items-center gap-2 bg-[#0f2042] hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all cursor-pointer">
                  <FileJson className="w-4 h-4 text-amber-400" />
                  Export JSON {filterParasites ? '(Filtré)' : '(Brut)'}
                </button>
                <button onClick={handleExportExcel} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all cursor-pointer shadow-sm">
                  <FileSpreadsheet className="w-4 h-4" />
                  Export Excel {filterParasites ? '(Filtré)' : '(Brut)'}
                </button>
              </div>
            )}

            {/* VUE 1 : BILAN JOURNALIER STYLE WEATHER UNDERGROUND */}
            {viewMode === 'daily' ? (
              <div className="space-y-6">
                {/* Date Picker & Presets */}
                <div className="bg-[#f8fafc] p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-bold text-[#0f2042]">Sélection de la Journée :</label>
                    <input
                      type="date"
                      value={dailyDate}
                      onChange={(e) => setDailyDate(e.target.value)}
                      className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-sm font-semibold text-[#0f2042] focus:outline-none focus:border-[#0f2042]"
                    />
                  </div>
                  <div className="flex gap-2 flex-wrap text-xs">
                    <span className="text-slate-500 font-semibold flex items-center">Presets :</span>
                    {['2026-09-19', '2026-09-20', '2026-09-21', '2026-09-22'].map((d) => (
                      <button
                        key={d}
                        onClick={() => setDailyDate(d)}
                        className={`px-3 py-1 rounded-lg font-bold transition-all ${
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
                    <div className="bg-gradient-to-r from-[#0f2042] to-[#1e3a8a] text-white p-5 rounded-2xl shadow-sm flex justify-between items-center flex-wrap gap-4">
                      <div>
                        <h3 className="text-base font-bold flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-amber-400" />
                          Journée du {dailySummary.date} ({dailySummary.dayName})
                        </h3>
                        <p className="text-xs text-slate-300 mt-1">
                          Station Météo SteAir Pro — {dailySummary.validCount} relevés valides sur {dailySummary.totalCount} mesures totales
                        </p>
                      </div>
                      <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 text-xs font-semibold">
                        Biais Thermique Moyen ΔT (BMP vs DHT22) : <span className="text-amber-300 font-bold">{dailySummary.summary.biasDelta !== null ? `+${dailySummary.summary.biasDelta} °C` : 'N/A'}</span>
                      </div>
                    </div>

                    {/* Cards min/max/moyenne des 2 capteurs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Temp BMP280 */}
                      <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-xl border border-amber-200/80 shadow-xs">
                        <div className="text-xs font-bold text-amber-900 mb-1">Température BMP280</div>
                        <div className="text-xl font-extrabold text-amber-950">
                          {dailySummary.summary.temperatureBmp.avg !== null ? `${dailySummary.summary.temperatureBmp.avg} °C` : 'N/A'}
                          <span className="text-xs font-normal text-amber-700 ml-1.5">(Moy)</span>
                        </div>
                        <div className="flex justify-between text-[11px] font-semibold text-amber-800 mt-3 pt-2 border-t border-amber-200/60">
                          <span>Min: <strong className="text-amber-950">{dailySummary.summary.temperatureBmp.min ?? '-'} °C</strong></span>
                          <span>Max: <strong className="text-amber-950">{dailySummary.summary.temperatureBmp.max ?? '-'} °C</strong></span>
                        </div>
                      </div>

                      {/* Temp DHT22 */}
                      <div className="bg-gradient-to-br from-sky-50 to-blue-50 p-4 rounded-xl border border-sky-200/80 shadow-xs">
                        <div className="text-xs font-bold text-sky-900 mb-1">Température DHT22</div>
                        <div className="text-xl font-extrabold text-sky-950">
                          {dailySummary.summary.temperatureDht22.avg !== null ? `${dailySummary.summary.temperatureDht22.avg} °C` : 'N/A'}
                          <span className="text-xs font-normal text-sky-700 ml-1.5">(Moy)</span>
                        </div>
                        <div className="flex justify-between text-[11px] font-semibold text-sky-800 mt-3 pt-2 border-t border-sky-200/60">
                          <span>Min: <strong className="text-sky-950">{dailySummary.summary.temperatureDht22.min ?? '-'} °C</strong></span>
                          <span>Max: <strong className="text-sky-950">{dailySummary.summary.temperatureDht22.max ?? '-'} °C</strong></span>
                        </div>
                      </div>

                      {/* Humidité DHT22 */}
                      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-4 rounded-xl border border-emerald-200/80 shadow-xs">
                        <div className="text-xs font-bold text-emerald-900 mb-1">Humidité DHT22</div>
                        <div className="text-xl font-extrabold text-emerald-950">
                          {dailySummary.summary.humidityDht22.avg !== null ? `${dailySummary.summary.humidityDht22.avg} %` : 'N/A'}
                          <span className="text-xs font-normal text-emerald-700 ml-1.5">(Moy)</span>
                        </div>
                        <div className="flex justify-between text-[11px] font-semibold text-emerald-800 mt-3 pt-2 border-t border-emerald-200/60">
                          <span>Min: <strong className="text-emerald-950">{dailySummary.summary.humidityDht22.min ?? '-'} %</strong></span>
                          <span>Max: <strong className="text-emerald-950">{dailySummary.summary.humidityDht22.max ?? '-'} %</strong></span>
                        </div>
                      </div>

                      {/* Pression BMP280 */}
                      <div className="bg-gradient-to-br from-indigo-50 to-slate-50 p-4 rounded-xl border border-indigo-200/80 shadow-xs">
                        <div className="text-xs font-bold text-indigo-900 mb-1">Pression BMP280</div>
                        <div className="text-xl font-extrabold text-indigo-950">
                          {dailySummary.summary.pressureBmp.avg !== null ? `${dailySummary.summary.pressureBmp.avg} hPa` : 'N/A'}
                          <span className="text-xs font-normal text-indigo-700 ml-1.5">(Moy)</span>
                        </div>
                        <div className="flex justify-between text-[11px] font-semibold text-indigo-800 mt-3 pt-2 border-t border-indigo-200/60">
                          <span>Min: <strong className="text-indigo-950">{dailySummary.summary.pressureBmp.min ?? '-'} hPa</strong></span>
                          <span>Max: <strong className="text-indigo-950">{dailySummary.summary.pressureBmp.max ?? '-'} hPa</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Detailed Hourly Table */}
                    <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-xs">
                      <table className="w-full text-xs text-left">
                        <thead className="uppercase bg-[#0f2042] text-white">
                          <tr>
                            <th className="px-4 py-3 font-semibold">Heure</th>
                            <th className="px-4 py-3 font-semibold">Temp. BMP280 (°C)</th>
                            <th className="px-4 py-3 font-semibold">Temp. DHT22 (°C)</th>
                            <th className="px-4 py-3 font-semibold">Écart ΔT (°C)</th>
                            <th className="px-4 py-3 font-semibold">Humidité DHT22 (%)</th>
                            <th className="px-4 py-3 font-semibold">Pression BMP280 (hPa)</th>
                            <th className="px-4 py-3 font-semibold">État Pluie</th>
                            <th className="px-4 py-3 font-semibold">Statut</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {dailySummary.observations.map((obs) => (
                            <tr key={obs.id} className={`hover:bg-slate-50 transition-colors ${obs.isParasite ? 'bg-amber-50/40' : ''}`}>
                              <td className="px-4 py-3 font-mono font-bold text-slate-700">{obs.heure}</td>
                              <td className="px-4 py-3 font-bold text-amber-700">{obs.temperatureBmp !== null ? `${obs.temperatureBmp.toFixed(1)} °C` : '-'}</td>
                              <td className="px-4 py-3 font-bold text-sky-700">{obs.temperatureDht22 !== null ? `${obs.temperatureDht22.toFixed(1)} °C` : '-'}</td>
                              <td className="px-4 py-3 font-semibold text-slate-600">
                                {obs.deltaTemp !== null ? (
                                  <span className={obs.deltaTemp > 2 ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                                    {obs.deltaTemp > 0 ? `+${obs.deltaTemp}` : obs.deltaTemp} °C
                                  </span>
                                ) : '-'}
                              </td>
                              <td className="px-4 py-3 font-semibold text-emerald-700">{obs.humidityDht22 !== null ? `${obs.humidityDht22.toFixed(0)} %` : '-'}</td>
                              <td className="px-4 py-3 text-indigo-900 font-mono">{obs.pressureBmp !== null ? `${obs.pressureBmp.toFixed(2)} hPa` : '-'}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${obs.rain ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-500'}`}>
                                  {obs.rain ? '🌧️ Pluie' : 'Sec'}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                {obs.isParasite ? (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                    ⚠️ Parasite/Init
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    ✅ Valide
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
              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-[#0f2042] text-white">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Date & Heure</th>
                      <th className="px-6 py-4 font-semibold">Temp.</th>
                      <th className="px-6 py-4 font-semibold">Humidité</th>
                      <th className="px-6 py-4 font-semibold">Pression</th>
                      <th className="px-6 py-4 font-semibold">Alerte</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedData.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-8 text-center text-slate-400 font-medium">
                          Aucune donnée trouvée.
                        </td>
                      </tr>
                    ) : (
                      paginatedData.map((measure) => (
                        <tr key={measure.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 text-slate-500 font-mono">
                            {new Date(measure.timestamp).toLocaleString('fr-FR')}
                          </td>
                          <td className="px-6 py-4 font-bold text-[#0f2042]">{measure.temperature.toFixed(1)}°C</td>
                          <td className="px-6 py-4 font-semibold text-slate-700">{measure.humidity.toFixed(0)}%</td>
                          <td className="px-6 py-4 text-slate-600">{measure.pressure ? `${measure.pressure.toFixed(0)} hPa` : '-'}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                              measure.alertActive 
                                ? 'bg-rose-100 text-rose-700' 
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              {measure.alertActive ? 'ALERTE' : 'NORMAL'}
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
