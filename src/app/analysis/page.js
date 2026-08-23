"use client";
import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Activity, BarChart3, Calendar, CheckCircle, Compass, Cpu, FileJson, FileSpreadsheet, 
  Home, Info, LogOut, MessageSquare, Menu, MapPin, Signal, TrendingUp, X, Filter, ChevronDown, FileText
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Link from 'next/link';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useToast } from '../../hooks/useToast';
import { ToastContainer } from '../../components/Toast';
import { useFileExport } from '../../hooks/useFileExport';

export default function AnalysisPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const { success, error: showToastError, toasts, removeToast } = useToast();
  const { exportJSON, exportExcel } = useFileExport();

  const [stations, setStations] = useState([]);
  const [selectedStationIds, setSelectedStationIds] = useState([]);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedVariables, setSelectedVariables] = useState({
    temp: true,
    humidity: true,
    pressure: false,
    rain: false
  });

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [stats, setStats] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const currentRole = user?.role || 'public';

  // Security check: Only Researcher and above can access
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'admin' && user.role !== 'tech' && user.role !== 'researcher') {
        router.push('/dashboard');
      }
    }
  }, [user, authLoading, router]);

  // Load list of stations
  useEffect(() => {
    async function loadStations() {
      try {
        const res = await axios.get('/api/stations');
        const list = res.data || [];
        setStations(list);
        if (list.length > 0) {
          // Select first station by default
          setSelectedStationIds([list[0].id]);
        }
      } catch (err) {
        showToastError('Impossible de charger les stations');
      }
    }
    if (user) {
      // Set default date range to last 7 days
      const end = new Date();
      const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
      setDateRange({
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0]
      });
      loadStations();
    }
  }, [user]);

  // Toggle station selection
  const handleStationToggle = (stationId) => {
    setSelectedStationIds(prev => {
      if (prev.includes(stationId)) {
        if (prev.length === 1) return prev; // Keep at least one selected
        return prev.filter(id => id !== stationId);
      } else {
        return [...prev, stationId];
      }
    });
  };

  // Fetch comparative data
  const fetchAnalysisData = useCallback(async () => {
    if (selectedStationIds.length === 0 || !dateRange.start || !dateRange.end) return;

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
      const stationParam = selectedStationIds.join(',');
      const url = `/api/history?start=${dateRange.start}&end=${dateRange.end}&limit=2000&stationId=${stationParam}`;
      
      const response = await axios.get(url);
      const rawData = response.data.data || [];
      setData(rawData);

      // Calculate statistics by station
      const newStats = {};
      selectedStationIds.forEach(id => {
        const stationMeasures = rawData.filter(m => m.stationId === id);
        const stationInfo = stations.find(s => s.id === id);
        
        if (stationMeasures.length > 0) {
          const temps = stationMeasures.map(m => m.temperature).filter(v => v != null);
          const hums = stationMeasures.map(m => m.humidity).filter(v => v != null);
          const press = stationMeasures.map(m => m.pressure).filter(v => v != null);

          newStats[id] = {
            name: stationInfo?.name || stationInfo?.code || 'Station',
            code: stationInfo?.code || 'ST',
            count: stationMeasures.length,
            temperature: temps.length > 0 ? {
              min: Math.min(...temps),
              max: Math.max(...temps),
              avg: temps.reduce((a, b) => a + b, 0) / temps.length
            } : null,
            humidity: hums.length > 0 ? {
              min: Math.min(...hums),
              max: Math.max(...hums),
              avg: hums.reduce((a, b) => a + b, 0) / hums.length
            } : null,
            pressure: press.length > 0 ? {
              min: Math.min(...press),
              max: Math.max(...press),
              avg: press.reduce((a, b) => a + b, 0) / press.length
            } : null
          };
        }
      });
      setStats(newStats);
    } catch (err) {
      showToastError('Erreur lors du chargement des données analytiques');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedStationIds, dateRange, stations]);

  useEffect(() => {
    if (selectedStationIds.length > 0 && dateRange.start && dateRange.end && stations.length > 0) {
      fetchAnalysisData();
    }
  }, [selectedStationIds, dateRange, stations, fetchAnalysisData]);

  // Format Recharts comparative data
  const chartData = useMemo(() => {
    if (data.length === 0) return [];
    
    // Group records by timestamp (or approximate interval)
    // For clean display, we map timestamps to unique date-times
    const timeMap = {};
    
    data.forEach(item => {
      const timeStr = new Date(item.timestamp).toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      if (!timeMap[timeStr]) {
        timeMap[timeStr] = { time: timeStr };
      }
      
      const st = stations.find(s => s.id === item.stationId);
      const label = st ? st.code : 'ST';
      
      timeMap[timeStr][`temp_${label}`] = item.temperature;
      timeMap[timeStr][`hum_${label}`] = item.humidity;
      timeMap[timeStr][`pres_${label}`] = item.pressure;
      timeMap[timeStr][`rain_${label}`] = item.rain;
    });

    return Object.values(timeMap).reverse();
  }, [data, stations]);

  // Export handlers
  const handleExportJSON = async () => {
    const result = await exportJSON(selectedStationIds.join(','));
    if (result) success('Export JSON réussi');
    else showToastError('Échec de l\'export JSON');
  };

  const handleExportExcel = async () => {
    const result = await exportExcel(selectedStationIds.join(','));
    if (result) success('Export Excel réussi');
    else showToastError('Échec de l\'export Excel');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full text-white">
      <div className="p-6 border-b border-slate-750 flex flex-col items-center text-center">
        <div className="w-20 h-20 bg-slate-700/50 rounded-full border-2 border-indigo-400/30 flex items-center justify-center mb-4 overflow-hidden relative shadow-inner">
          <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-300 font-bold text-xl uppercase">
            {user?.username ? user.username.substring(0, 2) : 'GP'}
          </div>
        </div>
        <h3 className="font-bold text-lg tracking-wide uppercase truncate max-w-full">
          {user?.username || 'Visiteur'}
        </h3>
        <span className="text-xs text-slate-400 truncate max-w-full mb-2">
          {user?.email || 'Lecteur public'}
        </span>
        <span className="text-[10px] uppercase font-bold tracking-widest bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full border border-indigo-500/30">
          {currentRole === 'admin' ? 'SuperAdmin' : currentRole === 'tech' ? 'Technicien' : 'Chercheur'}
        </span>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        <Link href="/" className="flex items-center gap-4 px-4 py-3 rounded-xl text-slate-300 hover:bg-white/5 hover:text-white transition-all text-sm font-medium">
          <Home className="w-4 h-4 text-indigo-400" />
          Carte Réseau
        </Link>
        <Link href="/dashboard" className="flex items-center gap-4 px-4 py-3 rounded-xl text-slate-300 hover:bg-white/5 hover:text-white transition-all text-sm font-medium">
          <Activity className="w-4 h-4 text-indigo-400" />
          Dashboard
        </Link>
        <Link href="/history" className="flex items-center gap-4 px-4 py-3 rounded-xl text-slate-300 hover:bg-white/5 hover:text-white transition-all text-sm font-medium">
          <FileText className="w-4 h-4 text-indigo-400" />
          Historique
        </Link>
        
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

        <button onClick={() => setSidebarOpen(false)} className="w-full flex items-center gap-4 px-4 py-3 rounded-xl bg-white/10 text-white transition-all text-sm font-semibold text-left">
          <BarChart3 className="w-4 h-4 text-indigo-400" />
          Analyse Climatique
        </button>

        <Link href="/interpretation" className="flex items-center gap-4 px-4 py-3 rounded-xl text-slate-300 hover:bg-white/5 hover:text-white transition-all text-sm font-medium">
          <MessageSquare className="w-4 h-4 text-indigo-400" />
          Interprétation
        </Link>
      </nav>

      <div className="p-4 border-t border-slate-750">
        <button onClick={logout} className="w-full flex items-center justify-center gap-3 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/25 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer">
          <LogOut className="w-4 h-4" />
          Déconnexion
        </button>
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
            <h2 className="text-lg font-bold text-[#0f2042] tracking-wide">
              Analyse Climatique Comparative
            </h2>
          </div>
          <div className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
            ● KongoClim Researcher
          </div>
        </header>

        {/* Espace central */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Formulaire de Sélection (Premium, Grid Layout) */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* 1. Sélection des Stations (Multi-select via Checkboxes) */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-[#0f2042] uppercase tracking-wider">Stations à comparer</label>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 max-h-40 overflow-y-auto space-y-2">
                  {stations.map(st => (
                    <div key={st.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`st-${st.id}`}
                        checked={selectedStationIds.includes(st.id)}
                        onChange={() => handleStationToggle(st.id)}
                        className="w-4 h-4 rounded bg-slate-100 border-slate-350 text-[#0f2042] focus:ring-[#0f2042]"
                      />
                      <label htmlFor={`st-${st.id}`} className="text-xs font-semibold text-slate-700 cursor-pointer">
                        {st.name} ({st.code})
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Sélection de la Période */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-[#0f2042] uppercase tracking-wider">Période d'analyse</label>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1 font-semibold">Date de début</label>
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-800 focus:outline-none focus:border-[#0f2042] text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1 font-semibold">Date de fin</label>
                    <input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-800 focus:outline-none focus:border-[#0f2042] text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Variables Climatiques */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-[#0f2042] uppercase tracking-wider">Variables à tracer</label>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="var-temp"
                      checked={selectedVariables.temp}
                      onChange={(e) => setSelectedVariables({ ...selectedVariables, temp: e.target.checked })}
                      className="w-4 h-4 rounded bg-slate-100 border-slate-350 text-[#0f2042] focus:ring-[#0f2042]"
                    />
                    <label htmlFor="var-temp" className="text-xs font-semibold text-slate-700 cursor-pointer">☑ Température (°C)</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="var-hum"
                      checked={selectedVariables.humidity}
                      onChange={(e) => setSelectedVariables({ ...selectedVariables, humidity: e.target.checked })}
                      className="w-4 h-4 rounded bg-slate-100 border-slate-350 text-[#0f2042] focus:ring-[#0f2042]"
                    />
                    <label htmlFor="var-hum" className="text-xs font-semibold text-slate-700 cursor-pointer">☑ Humidité (%)</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="var-pres"
                      checked={selectedVariables.pressure}
                      onChange={(e) => setSelectedVariables({ ...selectedVariables, pressure: e.target.checked })}
                      className="w-4 h-4 rounded bg-slate-100 border-slate-350 text-[#0f2042] focus:ring-[#0f2042]"
                    />
                    <label htmlFor="var-pres" className="text-xs font-semibold text-slate-700 cursor-pointer">☐ Pression (hPa)</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="var-rain"
                      checked={selectedVariables.rain}
                      onChange={(e) => setSelectedVariables({ ...selectedVariables, rain: e.target.checked })}
                      className="w-4 h-4 rounded bg-slate-100 border-slate-350 text-[#0f2042] focus:ring-[#0f2042]"
                    />
                    <label htmlFor="var-rain" className="text-xs font-semibold text-slate-700 cursor-pointer">☐ Pluie (0/1)</label>
                  </div>
                </div>
              </div>

            </div>

            {/* Export Actions */}
            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button onClick={handleExportJSON} className="flex items-center gap-2 bg-[#0f2042] hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all cursor-pointer">
                <FileJson className="w-4 h-4" />
                Export JSON Sélection
              </button>
              <button onClick={handleExportExcel} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all cursor-pointer">
                <FileSpreadsheet className="w-4 h-4" />
                Export Excel Sélection
              </button>
            </div>
          </div>

          {/* Section d'affichage des graphiques temporels */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
            <h3 className="text-[#0f2042] font-bold text-md mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-500" />
              Courbes Comparatives de Télémétrie
            </h3>

            {loading ? (
              <div className="h-72 flex justify-center items-center">
                <Activity className="w-8 h-8 text-indigo-500 animate-spin" />
              </div>
            ) : data.length === 0 ? (
              <div className="h-72 flex items-center justify-center text-slate-400 font-medium bg-slate-50 border border-slate-100 rounded-xl">
                Aucun relevé disponible pour les paramètres de sélection.
              </div>
            ) : (
              <div className="bg-[#fcfdfe] p-4 rounded-xl border border-slate-100">
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
                    <Legend wrapperStyle={{ fontSize: '11px' }} />

                    {/* Tracer dynamiquement les lignes pour chaque station sélectionnée */}
                    {selectedStationIds.map((id, index) => {
                      const st = stations.find(s => s.id === id);
                      if (!st) return null;
                      const label = st.code;
                      const colors = ['#f87171', '#60a5fa', '#34d399', '#fbbf24', '#a78bfa', '#ec4899'];
                      
                      return (
                        <div key={id}>
                          {selectedVariables.temp && (
                            <Line 
                              type="monotone" 
                              dataKey={`temp_${label}`} 
                              stroke={colors[(index * 2) % colors.length]} 
                              strokeWidth={2} 
                              name={`Température ${label} (°C)`} 
                              dot={false} 
                            />
                          )}
                          {selectedVariables.humidity && (
                            <Line 
                              type="monotone" 
                              dataKey={`hum_${label}`} 
                              stroke={colors[(index * 2 + 1) % colors.length]} 
                              strokeWidth={2} 
                              name={`Humidité ${label} (%)`} 
                              dot={false} 
                            />
                          )}
                          {selectedVariables.pressure && (
                            <Line 
                              type="monotone" 
                              dataKey={`pres_${label}`} 
                              stroke="#6b7280" 
                              strokeWidth={1.5} 
                              name={`Pression ${label} (hPa)`} 
                              dot={false} 
                            />
                          )}
                          {selectedVariables.rain && (
                            <Line 
                              type="monotone" 
                              dataKey={`rain_${label}`} 
                              stroke="#a855f7" 
                              strokeWidth={1} 
                              name={`Pluie ${label} (0/1)`} 
                              dot={false} 
                            />
                          )}
                        </div>
                      );
                    })}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Tableau de statistiques comparatif */}
          {Object.keys(stats).length > 0 && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
              <h3 className="text-[#0f2042] font-bold text-md mb-6">Résumé Statistique Comparatif</h3>
              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-[#0f2042] text-white">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Station (Code)</th>
                      <th className="px-6 py-4 font-semibold text-center">Relevés</th>
                      <th className="px-6 py-4 font-semibold text-center">Température Min / Max / Moy</th>
                      <th className="px-6 py-4 font-semibold text-center">Humidité Min / Max / Moy</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold">
                    {Object.entries(stats).map(([id, stat]) => (
                      <tr key={id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="text-[10px] font-mono text-indigo-500 block font-bold">{stat.code}</span>
                          <span className="text-slate-800">{stat.name}</span>
                        </td>
                        <td className="px-6 py-4 text-center text-slate-500 font-mono">{stat.count}</td>
                        <td className="px-6 py-4 text-center text-slate-700 font-mono text-xs">
                          {stat.temperature 
                            ? `${stat.temperature.min.toFixed(1)}°C / ${stat.temperature.max.toFixed(1)}°C / ${stat.temperature.avg.toFixed(1)}°C` 
                            : '--'
                          }
                        </td>
                        <td className="px-6 py-4 text-center text-slate-700 font-mono text-xs">
                          {stat.humidity 
                            ? `${stat.humidity.min.toFixed(0)}% / ${stat.humidity.max.toFixed(0)}% / ${stat.humidity.avg.toFixed(0)}%` 
                            : '--'
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
