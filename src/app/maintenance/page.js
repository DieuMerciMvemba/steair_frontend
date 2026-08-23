"use client";
import { useState, useEffect } from 'react';
import { 
  Activity, Cpu, Clock, MapPin, User, PlusCircle, History, CheckCircle, AlertTriangle, 
  Menu, X, Home, FileText, MessageSquare, LogOut, LogIn, Signal, Compass, BarChart3
} from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useToast } from '../../hooks/useToast';
import { ToastContainer } from '../../components/Toast';

export default function MaintenancePage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const { success, error: showToastError, toasts, removeToast } = useToast();

  const [logs, setLogs] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    stationId: '',
    technicianName: '',
    description: '',
    action: '',
    result: '',
    status: 'RESOLVED'
  });

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

  const loadData = async () => {
    if (!user || (user.role !== 'admin' && user.role !== 'tech')) return;
    setLoading(true);
    try {
      const [logsRes, stationsRes] = await Promise.all([
        axios.get('/api/maintenance'),
        axios.get('/api/stations')
      ]);
      setLogs(logsRes.data || []);
      const stationsList = stationsRes.data || [];
      setStations(stationsList);
      
      // Initialiser la station par défaut du formulaire
      if (stationsList.length > 0) {
        setFormData(prev => ({
          ...prev,
          stationId: stationsList[0].id,
          technicianName: user?.username || ''
        }));
      }
    } catch (err) {
      showToastError('Impossible de charger l\'historique d\'interventions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'tech')) {
      loadData();
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.stationId || !formData.description || !formData.action || !formData.result) {
      showToastError('Veuillez remplir tous les champs requis');
      return;
    }

    setSubmitting(true);
    try {
      await axios.post('/api/maintenance', formData);
      success('Fiche d\'intervention enregistrée');
      // Réinitialiser les champs de saisie du formulaire
      setFormData(prev => ({
        ...prev,
        description: '',
        action: '',
        result: '',
        status: 'RESOLVED'
      }));
      // Recharger l'historique
      loadData();
    } catch (err) {
      showToastError('Échec de l\'enregistrement de la fiche d\'intervention');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || !user || (user.role !== 'admin' && user.role !== 'tech')) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <Activity className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm">Chargement du panneau de maintenance...</p>
        </div>
      </div>
    );
  }

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
        <Link href="/diagnostics" className="flex items-center gap-4 px-4 py-3 rounded-xl text-slate-300 hover:bg-white/5 hover:text-white transition-all text-sm font-medium">
          <Signal className="w-4 h-4 text-indigo-400" />
          Santé & Alertes
        </Link>
        {user && (user.role === 'admin' || user.role === 'tech' || user.role === 'researcher') && (
          <Link href="/analysis" className="flex items-center gap-4 px-4 py-3 rounded-xl text-slate-300 hover:bg-white/5 hover:text-white transition-all text-sm font-medium">
            <BarChart3 className="w-4 h-4 text-indigo-400" />
            Analyse Climatique
          </Link>
        )}

        <button onClick={() => setSidebarOpen(false)} className="w-full flex items-center gap-4 px-4 py-3 rounded-xl bg-white/10 text-white transition-all text-sm font-semibold text-left">
          <Cpu className="w-4 h-4 text-indigo-400" />
          Maintenance
        </button>

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
              Registre de Maintenance
            </h2>
          </div>
          <div className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
            ● KongoClim Tech
          </div>
        </header>

        {/* Espace central */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
            
            {/* Formulaire de création (1/3 de largeur) */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
              <h3 className="text-[#0f2042] font-bold text-md mb-6 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-indigo-500" />
                Nouvelle Intervention
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5 font-semibold">Station concernée</label>
                  <select
                    value={formData.stationId}
                    onChange={(e) => setFormData({ ...formData, stationId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:border-[#0f2042]"
                  >
                    {stations.map(st => (
                      <option key={st.id} value={st.id}>{st.name} ({st.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-500 mb-1.5 font-semibold">Technicien</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      required
                      value={formData.technicianName}
                      onChange={(e) => setFormData({ ...formData, technicianName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-slate-800 text-sm focus:outline-none focus:border-[#0f2042]"
                      placeholder="Ex: Patrick Kabeya"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-500 mb-1.5 font-semibold">Description du problème</label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows="2"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-800 text-sm focus:outline-none focus:border-[#0f2042]"
                    placeholder="Quels étaient les symptômes ?"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-500 mb-1.5 font-semibold">Action corrective effectuée</label>
                  <textarea
                    required
                    value={formData.action}
                    onChange={(e) => setFormData({ ...formData, action: e.target.value })}
                    rows="2"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-800 text-sm focus:outline-none focus:border-[#0f2042]"
                    placeholder="Qu'avez-vous fait ?"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-500 mb-1.5 font-semibold">Résultat & vérification</label>
                  <textarea
                    required
                    value={formData.result}
                    onChange={(e) => setFormData({ ...formData, result: e.target.value })}
                    rows="2"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-800 text-sm focus:outline-none focus:border-[#0f2042]"
                    placeholder="Quels sont les résultats du test ?"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-500 mb-1.5 font-semibold">État après intervention</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:border-[#0f2042]"
                  >
                    <option value="RESOLVED">Résolu (Remise en ligne)</option>
                    <option value="IN_PROGRESS">En cours (Rester en maintenance)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#0f2042] hover:bg-slate-800 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-center transition-all text-sm cursor-pointer shadow-lg shadow-indigo-950/10 mt-2"
                >
                  {submitting ? 'Enregistrement...' : 'Enregistrer l\'Intervention'}
                </button>
              </form>
            </div>

            {/* Historique des logs (2/3 de la page) */}
            <div className="xl:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-slate-100">
              <h3 className="text-[#0f2042] font-bold text-md mb-6 flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-500" />
                Registre des Interventions ({logs.length})
              </h3>

              {loading ? (
                <div className="h-48 flex justify-center items-center">
                  <Activity className="w-8 h-8 text-indigo-500 animate-spin" />
                </div>
              ) : logs.length === 0 ? (
                <div className="border border-slate-100 rounded-2xl p-10 text-center text-slate-400 font-medium">
                  Aucun rapport de maintenance enregistré pour le moment.
                </div>
              ) : (
                <div className="space-y-6">
                  {logs.map((log) => (
                    <div key={log.id} className="border border-slate-150 rounded-xl p-5 space-y-4 hover:border-slate-300 transition-colors">
                      <div className="flex justify-between items-start flex-wrap gap-2 border-b border-slate-100 pb-3">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest font-bold">Intervention</span>
                          <h4 className="font-extrabold text-sm text-slate-850 flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-slate-400" />
                            {log.station?.name} ({log.station?.code})
                          </h4>
                        </div>
                        <div className="flex items-center gap-2 text-right">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${
                            log.status === 'RESOLVED' 
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' 
                              : 'bg-amber-500/10 border-amber-500/20 text-amber-600'
                          }`}>
                            {log.status === 'RESOLVED' ? 'RÉSOLU' : 'EN COURS'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(log.createdAt).toLocaleString('fr-FR')}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">PROBLÈME SIGNALÉ</span>
                          <p className="text-slate-700 font-medium">{log.description}</p>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">ACTION CORRECTIVE</span>
                          <p className="text-slate-700 font-medium">{log.action}</p>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">RÉSULTAT DES TESTS</span>
                          <p className="text-slate-700 font-medium">{log.result}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 bg-slate-50/50 p-2.5 rounded-xl border border-slate-150 w-fit">
                        <User className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Fiche rédigée par : <span className="font-bold text-slate-700">{log.technicianName}</span></span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </main>
      </div>
    </div>
  );
}
