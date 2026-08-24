"use client";
import { useState, useEffect } from 'react';
import { 
  Thermometer, Droplets, Gauge, CloudRain, ShieldAlert, Cpu, Activity, 
  TrendingUp, FileJson, FileSpreadsheet, Battery, Signal, 
  Trash2, Info, Compass, Menu, X, Home, FileText, MessageSquare, LogOut, LogIn, BarChart3
} from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';
import { useWeatherData } from '../../hooks/useWeatherData';
import { useFileExport } from '../../hooks/useFileExport';
import { useToast } from '../../hooks/useToast';
import { ToastContainer } from '../../components/Toast';
import { WeatherChart, MultiLineChart } from '../../components/WeatherChart';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const [stations, setStations] = useState([]);
  const [selectedStationId, setSelectedStationId] = useState('');
  const [cleanupDays, setCleanupDays] = useState(30);
  const [cleaning, setCleaning] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const { data, loading, error } = useWeatherData(selectedStationId);
  const { exportJSON, exportExcel } = useFileExport();
  const { toasts, success, error: showToastError, removeToast } = useToast();

  useEffect(() => {
    if (error) {
      showToastError(error);
    }
  }, [error, showToastError]);

  if (authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <Activity className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm">Chargement du tableau de bord...</p>
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

  const handleCleanup = async () => {
    try {
      setCleaning(true);
      const res = await axios.delete(`/api/cleanup?days=${cleanupDays}`);
      success(res.data.message || 'Nettoyage terminé');
    } catch (err) {
      showToastError(err.response?.data?.message || 'Erreur lors du nettoyage');
    } finally {
      setCleaning(false);
    }
  };

  const realtimeData = data?.realtime;
  const history = data?.history || [];
  const stats = data?.stats;

  const currentRole = user?.role || 'public';

  if (loading) {
    return (
      <div className="fixed inset-0 z-[110] bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Activity className="w-12 h-12 text-indigo-500 animate-spin" />
          <div className="text-slate-400 text-sm font-semibold tracking-widest uppercase">Initialisation...</div>
        </div>
      </div>
    );
  }

  // Calcul du pourcentage batterie pour le Doughnut (de 3.4V à 4.2V)
  const getBatteryPercentage = (v) => {
    if (!v) return 0;
    const pct = Math.round(((v - 3.4) / (4.2 - 3.4)) * 100);
    return Math.max(0, Math.min(100, pct));
  };
  
  const batteryPct = realtimeData?.batteryVoltage ? getBatteryPercentage(realtimeData.batteryVoltage) : 85;

  const SidebarContent = () => (
    <div className="flex flex-col h-full text-white">
      {/* Profil Utilisateur */}
      <div className="p-6 border-b border-slate-700/50 flex flex-col items-center text-center">
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
          {currentRole === 'admin' ? 'SuperAdmin' : currentRole === 'tech' ? 'Technicien' : currentRole === 'researcher' ? 'Chercheur' : 'Public'}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        <Link href="/" className="flex items-center gap-4 px-4 py-3 rounded-xl text-slate-300 hover:bg-white/5 hover:text-white transition-all text-sm font-medium">
          <Home className="w-4 h-4 text-indigo-400" />
          Carte Réseau
        </Link>
        <button onClick={() => setSidebarOpen(false)} className="w-full flex items-center gap-4 px-4 py-3 rounded-xl bg-white/10 text-white transition-all text-sm font-semibold text-left">
          <Activity className="w-4 h-4 text-indigo-400" />
          Dashboard
        </button>
        <Link href="/history" className="flex items-center gap-4 px-4 py-3 rounded-xl text-slate-300 hover:bg-white/5 hover:text-white transition-all text-sm font-medium">
          <FileText className="w-4 h-4 text-indigo-400" />
          Historique
        </Link>

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

      {/* 3. ZONE PRINCIPALE DE CONTENU */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header Bar mobile & desktop */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden text-slate-600 p-2 hover:bg-slate-100 rounded-xl transition-all">
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-bold text-[#0f2042] tracking-wide hidden sm:inline-block">
              {currentRole === 'admin' ? 'Supervision' : currentRole === 'tech' ? 'Technique' : currentRole === 'researcher' ? 'Analyse' : 'Météo'}
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
            ● Station
          </div>
        </header>

        {/* Espace central de défilement des cartes */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Alerte météo critique */}
          {realtimeData?.alertActive && (
            <div className="bg-rose-600 border border-rose-700 text-white p-4 rounded-xl flex items-center gap-3 shadow-md animate-pulse">
              <ShieldAlert className="w-6 h-6 text-white shrink-0" />
              <div className="text-sm font-semibold">
                ALERTE SYSTÈME ACTIVE : {
                  realtimeData?.batteryVoltage !== null && realtimeData?.batteryVoltage < 3.4
                    ? "Tension de batterie critique (< 3.4V) - Entretien requis."
                    : "Température de fonctionnement critique détectée."
                }
              </div>
            </div>
          )}

          {/* SECTION : Cartes de diagnostics (Grid) */}
          {realtimeData ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              
              {/* Temp BMP280 Card */}
              <div className="bg-[#0f2042] text-white rounded-xl p-6 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between h-36 relative overflow-hidden group">
                <div className="absolute right-4 top-4 p-2 bg-white/10 rounded-xl">
                  <Thermometer className="w-5 h-5 text-indigo-300" />
                </div>
                <div>
                  <span className="text-slate-300 text-xs font-bold uppercase tracking-wider block mb-1">Température (BMP280)</span>
                  <span className="text-3xl font-extrabold tracking-tight">
                    {realtimeData.temperatureBmp !== null && realtimeData.temperatureBmp !== undefined 
                      ? realtimeData.temperatureBmp.toFixed(1) 
                      : (realtimeData.temperature !== null && realtimeData.temperature !== undefined ? realtimeData.temperature.toFixed(1) : '--.-')
                    } <span className="text-base font-light text-slate-400">°C</span>
                  </span>
                </div>
                <div className="text-[10px] text-emerald-400 font-semibold tracking-wide">
                  ● Capteur Barométrique (Précis)
                </div>
              </div>

              {/* Temp DHT11 Card */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between h-36 relative">
                <div className="absolute right-4 top-4 p-2 bg-indigo-500/10 rounded-xl text-indigo-600">
                  <Thermometer className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-1">Température (DHT11)</span>
                  <span className="text-3xl font-extrabold text-[#0f2042]">
                    {realtimeData.temperatureDht !== null && realtimeData.temperatureDht !== undefined 
                      ? realtimeData.temperatureDht.toFixed(1) 
                      : '--.-'
                    } <span className="text-base font-light text-slate-400">°C</span>
                  </span>
                </div>
                <div className="text-[10px] text-indigo-500 font-semibold tracking-wide">
                  ● Capteur d'Humidité (Repli)
                </div>
              </div>

              {/* Humidité Card - Clean white card */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between h-36 relative">
                <div className="absolute right-4 top-4 p-2 bg-amber-500/10 rounded-xl text-amber-500">
                  <Droplets className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-1">Humidité</span>
                  <span className="text-3xl font-extrabold text-[#0f2042]">
                    {realtimeData.humidity !== null && realtimeData.humidity !== undefined 
                      ? realtimeData.humidity.toFixed(0) 
                      : '--'
                    } <span className="text-base font-light text-slate-400">%</span>
                  </span>
                </div>
                <div className="text-[10px] text-slate-500">
                  Relative de l'air (DHT11)
                </div>
              </div>

              {/* Pression Card - Clean white card */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between h-36 relative">
                <div className="absolute right-4 top-4 p-2 bg-amber-500/10 rounded-xl text-amber-500">
                  <Gauge className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-1">Pression</span>
                  <span className="text-3xl font-extrabold text-[#0f2042]">
                    {realtimeData.pressure ? realtimeData.pressure.toFixed(0) : '--'} <span className="text-base font-light text-slate-400">hPa</span>
                  </span>
                </div>
                <div className="text-[10px] text-slate-500">
                  Barométrique locale (BMP280)
                </div>
              </div>

              {/* Pluie / Averses Card - Clean white card */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between h-36 relative">
                <div className="absolute right-4 top-4 p-2 bg-amber-500/10 rounded-xl text-amber-500">
                  <CloudRain className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-1">Averses</span>
                  <span className="text-2xl font-extrabold text-[#0f2042]">
                    {realtimeData.rain === 1 ? 'Actives' : 'Inactives'}
                  </span>
                </div>
                <div className={`text-[10px] font-bold ${realtimeData.rain === 1 ? 'text-rose-500' : 'text-emerald-600'}`}>
                  {realtimeData.rain === 1 ? '● PLUIE EN COURS' : '● TEMPS SEC'}
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-white rounded-xl p-12 text-center text-slate-400 border border-slate-200 font-medium">
              Aucun capteur connecté
            </div>
          )}

          {/* GRAPHS & GAUGES SECTION (Columns layout) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Colonne Gauche/Milieu : Graphique Recharts */}
            <div className="lg:col-span-2 space-y-6">
              {(currentRole === 'researcher' || currentRole === 'admin' || currentRole === 'tech') ? (
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                  <h3 className="text-[#0f2042] font-bold text-md mb-6 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-amber-500" />
                    Analyse Combinée Température / Humidité
                  </h3>
                  <div className="bg-[#fcfdfe] p-4 rounded-xl border border-slate-100">
                    <MultiLineChart data={history} />
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl p-8 text-center border border-slate-150 flex flex-col items-center justify-center h-full">
                  <Info className="w-8 h-8 text-amber-500 mb-3" />
                  <h4 className="font-bold text-slate-800 mb-1">Graphiques et analyses restreints</h4>
                  <p className="text-xs text-slate-500 max-w-sm">
                    L'affichage des graphiques temporels et des exports nécessite un compte technique ou chercheur.
                  </p>
                </div>
              )}
            </div>

            {/* Colonne Droite : Doughnut de batterie et diagnostics GSM */}
            <div className="space-y-6">
              {/* Doughnut Card - matches the doughnut circular chart on the right side of the user's image */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 flex flex-col items-center text-center">
                <h3 className="text-[#0f2042] font-bold text-sm mb-4 uppercase tracking-wider w-full text-left">
                  Autonomie Solaire
                </h3>
                
                {/* SVG Doughnut chart */}
                <div className="relative w-36 h-36 mb-4 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" stroke="#f1f5f9" strokeWidth="12" fill="transparent" />
                    <circle cx="50" cy="50" r="40" stroke="#0f2042" strokeWidth="12" fill="transparent" 
                            strokeDasharray={2 * Math.PI * 40}
                            strokeDashoffset={2 * Math.PI * 40 * (1 - batteryPct / 100)} />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-[#0f2042]">{batteryPct}%</span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Charge</span>
                  </div>
                </div>

                <div className="w-full text-left space-y-2 border-t border-slate-100 pt-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Tension réelle :</span>
                    <span className="font-bold text-[#0f2042]">
                      {realtimeData?.batteryVoltage ? `${realtimeData.batteryVoltage.toFixed(2)} V` : '4.12 V'}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Source :</span>
                    <span className="font-semibold text-emerald-600">● Panneau Solaire</span>
                  </div>
                </div>
              </div>

              {/* Card GSM Network Diagnostics */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                <h3 className="text-[#0f2042] font-bold text-sm mb-4 uppercase tracking-wider">
                  Réseau Cellulaire
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-600">
                      <Signal className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Signal</span>
                      <span className="text-sm font-bold text-[#0f2042]">
                        {realtimeData?.gsmSignal !== null && realtimeData?.gsmSignal !== undefined
                          ? `${-113 + 2 * realtimeData.gsmSignal} dBm`
                          : '-65 dBm'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-600">
                      <Compass className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Opérateur</span>
                      <span className="text-sm font-semibold text-slate-700">
                        {realtimeData?.gsmOperator || 'Orange RDC'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* TABLEAU HISTORIQUE (Visible pour admin / tech / chercheur) */}
          {(currentRole === 'researcher' || currentRole === 'admin' || currentRole === 'tech') && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                <h3 className="text-[#0f2042] font-bold text-md">Historique de la Station</h3>
                <div className="flex gap-3">
                  <button onClick={handleExportJSON} className="flex items-center gap-2 bg-[#0f2042] hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all cursor-pointer">
                    <FileJson className="w-4 h-4" />
                    Export JSON
                  </button>
                  <button onClick={handleExportExcel} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all cursor-pointer">
                    <FileSpreadsheet className="w-4 h-4" />
                    Export Excel
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-[#0f2042] text-white">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Date & Heure</th>
                      <th className="px-6 py-4 font-semibold">Temp.</th>
                      <th className="px-6 py-4 font-semibold">Humidité</th>
                      <th className="px-6 py-4 font-semibold">Pression</th>
                      <th className="px-6 py-4 font-semibold">Pluie</th>
                      <th className="px-6 py-4 font-semibold">Alerte</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {history.map((measure) => (
                      <tr key={measure.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-slate-500 font-mono">
                          {new Date(measure.timestamp).toLocaleString('fr-FR')}
                        </td>
                        <td className="px-6 py-4 font-bold text-[#0f2042]">{measure.temperature.toFixed(1)}°C</td>
                        <td className="px-6 py-4 font-semibold text-slate-700">{measure.humidity.toFixed(0)}%</td>
                        <td className="px-6 py-4 text-slate-600">{measure.pressure ? `${measure.pressure.toFixed(0)} hPa` : '-'}</td>
                        <td className="px-6 py-4 text-slate-600">{measure.rain === 1 ? 'Pluie (1)' : 'Sec (0)'}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                            measure.alertActive 
                              ? 'bg-rose-100 text-rose-700' 
                              : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {measure.alertActive ? 'ALERTE' : 'NORMAL'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ZONE ADMINISTRATION : Nettoyage */}
          {currentRole === 'admin' && (
            <div className="bg-rose-50/50 border border-rose-200/60 p-6 rounded-xl">
              <h3 className="text-rose-900 font-bold text-sm mb-4 uppercase tracking-wider flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-rose-600" />
                Maintenance : Purge de Données
              </h3>
              <div className="flex flex-wrap items-center gap-4">
                <span className="text-xs text-slate-600">Supprimer les relevés antérieurs à :</span>
                <input
                  type="number"
                  value={cleanupDays}
                  onChange={(e) => setCleanupDays(parseInt(e.target.value))}
                  className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 w-20 text-center text-sm font-semibold focus:outline-none focus:border-rose-500"
                />
                <span className="text-xs text-slate-600">jours</span>
                <button
                  onClick={handleCleanup}
                  disabled={cleaning}
                  className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all disabled:opacity-50 cursor-pointer"
                >
                  {cleaning ? 'Exécution...' : 'Purger la base'}
                </button>
              </div>
            </div>
          )}

        </main>
      </div>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
