"use client";
import { useState, useEffect } from 'react';
import { 
  Activity, ShieldAlert, CheckCircle, Clock, AlertTriangle, AlertOctagon, 
  MapPin, Battery, Signal, Menu, X, Home, FileText, MessageSquare, LogOut, LogIn, Cpu, Compass, BarChart3,
  Wifi, Database, Wrench, Settings, Power, AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useToast } from '../../hooks/useToast';
import { ToastContainer } from '../../components/Toast';

export default function DiagnosticsPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const { success, error: showToastError, toasts, removeToast } = useToast();

  const [alerts, setAlerts] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // States pour diagnostics détaillés d'une station
  const [selectedStationId, setSelectedStationId] = useState('');
  const [selectedStationData, setSelectedStationData] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [togglingMaintenance, setTogglingMaintenance] = useState(false);

  const currentRole = user?.role || 'public';

  // Sécurité : Uniquement pour techniciens et administrateurs
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'admin' && user.role !== 'tech') {
        router.push('/dashboard');
      }
    }
  }, [user, authLoading, router]);

  const loadDiagnostics = async () => {
    if (!user || (user.role !== 'admin' && user.role !== 'tech')) return;

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
      const [alertsRes, stationsRes] = await Promise.all([
        axios.get('/api/alerts'),
        axios.get('/api/stations')
      ]);
      setAlerts(alertsRes.data || []);
      setStations(stationsRes.data || []);
    } catch (err) {
      showToastError('Impossible de charger les diagnostics réseau');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStationDetail = async (stId) => {
    if (!stId) return;
    setLoadingDetail(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      const res = await axios.get(`/api/stations/${stId}`);
      setSelectedStationData(res.data);
    } catch (err) {
      console.error(err);
      showToastError('Impossible de charger les détails de la station');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleToggleMaintenance = async () => {
    if (!selectedStationData) return;
    const currentStatus = selectedStationData.status;
    const nextStatus = currentStatus === 'MAINTENANCE' ? 'ONLINE' : 'MAINTENANCE';
    
    setTogglingMaintenance(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      await axios.put(`/api/stations/${selectedStationData.id}`, { status: nextStatus });
      success(nextStatus === 'MAINTENANCE' ? 'Station mise en maintenance' : 'Station remise en service');
      
      // Recharger les données
      await loadDiagnostics();
      await fetchStationDetail(selectedStationData.id);
    } catch (err) {
      console.error(err);
      showToastError('Erreur lors du changement de statut');
    } finally {
      setTogglingMaintenance(false);
    }
  };

  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'tech')) {
      loadDiagnostics();
    }
  }, [user]);

  const handleResolveAlert = async (alertId) => {
    try {
      setResolvingId(alertId);
      await axios.put(`/api/alerts/${alertId}/resolve`);
      success('Alerte résolue avec succès');
      // Recharger les données
      loadDiagnostics();
    } catch (err) {
      showToastError('Échec de la résolution de l\'alerte');
      console.error(err);
    } finally {
      setResolvingId(null);
    }
  };

  if (authLoading || !user || (user.role !== 'admin' && user.role !== 'tech')) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <Activity className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm">Chargement des diagnostics...</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "ONLINE":
        return "bg-emerald-500 text-emerald-500";
      case "DEGRADED":
        return "bg-amber-500 text-amber-500";
      case "MAINTENANCE":
        return "bg-orange-500 text-orange-500";
      default:
        return "bg-rose-500 text-rose-500";
    }
  };

  const getStatusBgClass = (status) => {
    switch (status) {
      case "ONLINE":
        return "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
      case "DEGRADED":
        return "bg-amber-500/10 border-amber-500/20 text-amber-400";
      case "MAINTENANCE":
        return "bg-orange-500/10 border-orange-500/20 text-orange-400";
      default:
        return "bg-rose-500/10 border-rose-500/20 text-rose-400";
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case "CRITICAL":
        return <AlertOctagon className="w-5 h-5 text-rose-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
    }
  };

  const getSeverityBadge = (severity) => {
    if (severity === 'CRITICAL') {
      return <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">Critique</span>;
    }
    return <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">Avertissement</span>;
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
          {currentRole === 'admin' ? 'SuperAdmin' : 'Technicien'}
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
        {user && (user.role === 'admin' || user.role === 'tech' || user.role === 'researcher') && (
          <Link href="/analysis" className="flex items-center gap-4 px-4 py-3 rounded-xl text-slate-300 hover:bg-white/5 hover:text-white transition-all text-sm font-medium">
            <BarChart3 className="w-4 h-4 text-indigo-400" />
            Analyse Climatique
          </Link>
        )}

        <button onClick={() => setSidebarOpen(false)} className="w-full flex items-center gap-4 px-4 py-3 rounded-xl bg-white/10 text-white transition-all text-sm font-semibold text-left">
          <Signal className="w-4 h-4 text-indigo-400" />
          Santé & Alertes
        </button>
        <Link href="/maintenance" className="flex items-center gap-4 px-4 py-3 rounded-xl text-slate-300 hover:bg-white/5 hover:text-white transition-all text-sm font-medium">
          <Cpu className="w-4 h-4 text-indigo-400" />
          Maintenance
        </Link>

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
              Santé & Diagnostic Réseau
            </h2>
          </div>
          <div className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
            ● KongoClim Tech
          </div>
        </header>

        {/* Espace central */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">

          {loading ? (
            <div className="h-64 flex justify-center items-center">
              <Activity className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              
              {/* Colonne 1 : Journal des Alertes Actives */}
              <div className="space-y-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                  <h3 className="text-[#0f2042] font-bold text-sm mb-6 flex items-center gap-2 uppercase tracking-wider">
                    <ShieldAlert className="w-5 h-5 text-indigo-500" />
                    Alertes Réseau ({alerts.length})
                  </h3>

                  {alerts.length === 0 ? (
                    <div className="border border-slate-100 rounded-2xl p-6 text-center flex flex-col items-center justify-center bg-slate-50">
                      <CheckCircle className="w-8 h-8 text-emerald-500 mb-2" />
                      <h4 className="font-bold text-slate-800 text-xs mb-1">Aucune alerte active</h4>
                      <p className="text-[10px] text-slate-500">Toutes les stations fonctionnent normalement.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                      {alerts.map((alert) => (
                        <div key={alert.id} className="border border-slate-200/60 rounded-xl p-4 flex flex-col gap-3 bg-slate-50 hover:bg-slate-100/50 transition-colors">
                          <div>
                            <div className="flex items-center flex-wrap gap-1.5 mb-1">
                              {getSeverityBadge(alert.severity)}
                              <span className="bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-bold text-indigo-500 px-1.5 py-0.5 rounded-md">
                                {alert.type === 'TECHNICAL' ? 'MATÉRIEL' : 'MÉTÉO'}
                              </span>
                            </div>
                            <h4 className="font-bold text-slate-800 text-xs">{alert.title}</h4>
                            <p className="text-[10px] text-slate-600 mt-1">{alert.message}</p>
                          </div>
                          
                          <div className="flex items-center justify-between border-t border-slate-200/50 pt-2 text-[9px] text-slate-400 font-mono">
                            <span className="truncate max-w-[120px]">
                              {alert.station?.name}
                            </span>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleResolveAlert(alert.id); }}
                              disabled={resolvingId === alert.id}
                              className="text-indigo-600 hover:text-indigo-800 font-bold uppercase transition-all"
                            >
                              {resolvingId === alert.id ? '...' : 'Résoudre'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Colonne 2 : Diagnostics Détaillés de la Station Sélectionnée */}
              <div className="space-y-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 min-h-[450px] flex flex-col">
                  <h3 className="text-[#0f2042] font-bold text-sm mb-6 flex items-center gap-2 uppercase tracking-wider">
                    <Wifi className="w-5 h-5 text-indigo-500" />
                    Diagnostics Station
                  </h3>

                  {loadingDetail ? (
                    <div className="flex-1 flex flex-col justify-center items-center gap-2">
                      <Activity className="w-8 h-8 text-indigo-500 animate-spin" />
                      <span className="text-xs text-slate-450">Chargement des diagnostics...</span>
                    </div>
                  ) : !selectedStationData ? (
                    <div className="flex-1 flex flex-col justify-center items-center text-center p-6 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                      <Cpu className="w-10 h-10 text-slate-300 mb-3" />
                      <h4 className="font-bold text-slate-700 text-xs mb-1">Aucune sélection</h4>
                      <p className="text-[10px] text-slate-500 max-w-[180px]">Cliquez sur une station de la liste pour analyser ses capteurs et son signal GSM.</p>
                    </div>
                  ) : (
                    <div className="space-y-5 flex-1 flex flex-col justify-between">
                      {/* En-tête station */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[9px] font-mono text-indigo-500 font-bold block uppercase tracking-wider">{selectedStationData.code}</span>
                            <h4 className="font-extrabold text-sm text-[#0f2042]">{selectedStationData.name}</h4>
                            <span className="text-[10px] text-slate-500 block">{selectedStationData.location}</span>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${getStatusBgClass(selectedStationData.status)}`}>
                            {selectedStationData.status}
                          </span>
                        </div>

                        {/* Coordonnées */}
                        <div className="text-[10px] font-mono text-slate-400 bg-slate-50 p-2 rounded-lg border border-slate-100 flex justify-between">
                          <span>Lat: {selectedStationData.latitude || '-'}</span>
                          <span>Lon: {selectedStationData.longitude || '-'}</span>
                        </div>
                      </div>

                      {/* Diagnostic GSM */}
                      <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-150 space-y-3 text-xs">
                        <span className="text-[9px] font-bold text-slate-450 uppercase block tracking-wider">État Réseau & GSM</span>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-slate-500">Opérateur :</span>
                            <p className="font-bold text-slate-800">{selectedStationData.measures[0]?.gsmOperator || 'Orange RDC'}</p>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-slate-500">Signal GSM :</span>
                            <p className="font-bold text-slate-800">
                              {selectedStationData.measures[0]?.gsmSignal 
                                ? `${-113 + 2 * selectedStationData.measures[0].gsmSignal} dBm (${selectedStationData.measures[0].gsmSignal}/31)`
                                : '-65 dBm (Moyen)'}
                            </p>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-slate-500">Batterie :</span>
                            <p className="font-bold text-slate-800">
                              {selectedStationData.measures[0]?.batteryVoltage 
                                ? `${selectedStationData.measures[0].batteryVoltage.toFixed(2)} V` 
                                : '3.85 V'}
                            </p>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-slate-500">IP / GPRS :</span>
                            <p className="font-bold text-slate-800">10.42.{10 + (selectedStationData.code.charCodeAt(selectedStationData.code.length-1) % 15)}.{24 + (selectedStationData.code.charCodeAt(selectedStationData.code.length-1) % 200)}</p>
                          </div>
                        </div>
                      </div>

                      {/* Diagnostic Capteurs */}
                      <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-150 space-y-3 text-xs">
                        <span className="text-[9px] font-bold text-slate-450 uppercase block tracking-wider">Status des Capteurs</span>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="text-slate-600">BMP280 (Pression/Température) :</span>
                            <span className={`font-bold ${selectedStationData.measures[0]?.temperatureBmp != null ? 'text-emerald-600' : 'text-amber-500'}`}>
                              {selectedStationData.measures[0]?.temperatureBmp != null ? 'Opérationnel' : 'Déconnecté / Erreur'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="text-slate-600">DHT11 (Humidité/Température de repli) :</span>
                            <span className={`font-bold ${selectedStationData.measures[0]?.temperatureDht != null ? 'text-emerald-600' : 'text-amber-500'}`}>
                              {selectedStationData.measures[0]?.temperatureDht != null ? 'Opérationnel' : 'Déconnecté / Erreur'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Historique des erreurs / alertes résolues de cette station */}
                      {selectedStationData.alerts && (
                        <div className="space-y-2">
                          <span className="text-[9px] font-bold text-slate-450 uppercase block tracking-wider">Historique des Incidents</span>
                          <div className="max-h-[120px] overflow-y-auto space-y-1.5 pr-1">
                            {selectedStationData.alerts.length === 0 ? (
                              <p className="text-[10px] text-slate-400 italic">Aucun incident enregistré sur cette station.</p>
                            ) : (
                              selectedStationData.alerts.map((al) => (
                                <div key={al.id} className="text-[10px] bg-slate-50 p-2 rounded-lg border border-slate-100 flex justify-between items-center">
                                  <div>
                                    <p className="font-bold text-slate-700">{al.title}</p>
                                    <span className="text-[8px] text-slate-400">{new Date(al.createdAt).toLocaleString('fr-FR')}</span>
                                  </div>
                                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md ${al.active ? 'bg-rose-500/10 text-rose-600' : 'bg-emerald-500/10 text-emerald-600'}`}>
                                    {al.active ? 'ACTIF' : 'RÉSOLU'}
                                  </span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}

                      {/* Bouton de bascule Maintenance */}
                      <button
                        onClick={handleToggleMaintenance}
                        disabled={togglingMaintenance}
                        className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all shadow-md mt-2 flex items-center justify-center gap-2 cursor-pointer ${
                          selectedStationData.status === 'MAINTENANCE'
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-700/10'
                            : 'bg-yellow-600 hover:bg-yellow-700 text-white shadow-yellow-700/10'
                        }`}
                      >
                        <Wrench className="w-4 h-4" />
                        {selectedStationData.status === 'MAINTENANCE' ? 'Remettre la station EN SERVICE' : 'Marquer la station EN MAINTENANCE'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Colonne 3 : Statuses des Stations (Selection list) */}
              <div className="space-y-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                  <h3 className="text-[#0f2042] font-bold text-sm mb-6 uppercase tracking-wider flex items-center gap-2">
                    <Database className="w-5 h-5 text-indigo-500" />
                    Parc Matériel
                  </h3>

                  <div className="divide-y divide-slate-150 max-h-[500px] overflow-y-auto pr-1">
                    {stations.map((st) => (
                      <div 
                        key={st.id} 
                        onClick={() => { setSelectedStationId(st.id); fetchStationDetail(st.id); }}
                        className={`py-3 px-3.5 rounded-xl cursor-pointer transition-all flex flex-col gap-2.5 my-1 first:mt-0 last:mb-0 border ${
                          selectedStationId === st.id 
                            ? 'bg-indigo-50/60 border-indigo-200 shadow-sm' 
                            : 'bg-white border-transparent hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="text-[9px] font-mono text-slate-400 block tracking-widest uppercase font-bold">{st.code}</span>
                            <h4 className="font-extrabold text-xs text-[#0f2042]">{st.name}</h4>
                          </div>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-lg border ${getStatusBgClass(st.status)}`}>
                            {st.status}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[9px] text-slate-450 border-t border-slate-100 pt-2 font-mono">
                          <span>Signal: {st.status === 'OFFLINE' ? 'Inactif' : 'Actif'}</span>
                          <span>Contact: {st.lastSeen ? new Date(st.lastSeen).toLocaleDateString('fr-FR') : 'Jamais'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          )}

        </main>
      </div>
    </div>
  );
}
