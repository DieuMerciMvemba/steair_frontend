"use client";
import { useState, useEffect } from 'react';
import { 
  Activity, ShieldAlert, CheckCircle, Clock, AlertTriangle, AlertOctagon, 
  MapPin, Battery, Signal, Menu, X, Home, FileText, MessageSquare, LogOut, LogIn, Cpu, Compass
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
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
              
              {/* Colonne Gauche/Milieu : Journal des Alertes Actives (2/3 de largeur) */}
              <div className="xl:col-span-2 space-y-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                  <h3 className="text-[#0f2042] font-bold text-md mb-6 flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-indigo-500" />
                    Alertes Actives du Réseau ({alerts.length})
                  </h3>

                  {alerts.length === 0 ? (
                    <div className="border border-slate-100 rounded-2xl p-10 text-center flex flex-col items-center justify-center bg-slate-50">
                      <CheckCircle className="w-10 h-10 text-emerald-500 mb-3" />
                      <h4 className="font-bold text-slate-800 mb-1">Aucune alerte en cours</h4>
                      <p className="text-xs text-slate-500">Toutes les stations du réseau KongoClim fonctionnent normalement.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {alerts.map((alert) => (
                        <div key={alert.id} className="border border-slate-200/60 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 hover:bg-slate-100/50 transition-colors">
                          <div className="flex gap-4 items-start">
                            <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-sm shrink-0">
                              {getSeverityIcon(alert.severity)}
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center flex-wrap gap-2">
                                <h4 className="font-bold text-slate-800 text-sm">{alert.title}</h4>
                                {getSeverityBadge(alert.severity)}
                                <span className="bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold text-indigo-500 px-2 py-0.5 rounded-md">
                                  {alert.type === 'TECHNICAL' ? 'MATÉRIEL' : 'MÉTÉO'}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600">{alert.message}</p>
                              <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono mt-2">
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {alert.station?.name} ({alert.station?.code})
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {new Date(alert.createdAt).toLocaleString('fr-FR')}
                                </span>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => handleResolveAlert(alert.id)}
                            disabled={resolvingId === alert.id}
                            className="bg-[#0f2042] hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all whitespace-nowrap self-end sm:self-center cursor-pointer"
                          >
                            {resolvingId === alert.id ? 'Résolution...' : 'Marquer comme résolu'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Colonne Droite : Statuses des Stations (1/3 de largeur) */}
              <div className="space-y-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                  <h3 className="text-[#0f2042] font-bold text-md mb-6 uppercase tracking-wider">
                    Santé du Parc Matériel
                  </h3>

                  <div className="divide-y divide-slate-100">
                    {stations.map((st) => (
                      <div key={st.id} className="py-4 first:pt-0 last:pb-0 flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="text-[10px] font-mono text-slate-400 block tracking-widest uppercase font-bold">{st.code}</span>
                            <h4 className="font-extrabold text-sm text-[#0f2042]">{st.name}</h4>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-lg border ${getStatusBgClass(st.status)}`}>
                            {st.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                          <div className="flex items-center gap-1">
                            <Battery className="w-3.5 h-3.5 text-slate-450" />
                            <span>Panneau Solaire</span>
                          </div>
                          <div className="flex items-center gap-1 justify-end">
                            <Signal className="w-3.5 h-3.5 text-slate-450" />
                            <span>GPRS Active</span>
                          </div>
                          <div className="col-span-2 text-[9px] text-slate-400 border-t border-slate-200/60 pt-1 mt-1 font-mono text-center">
                            Dernier contact : {st.lastSeen ? new Date(st.lastSeen).toLocaleString('fr-FR') : 'Jamais connecté'}
                          </div>
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
