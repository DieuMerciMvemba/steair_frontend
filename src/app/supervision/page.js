"use client";
import { useState, useEffect } from 'react';
import { 
  Activity, Compass, Plus, Trash2, Edit2, ShieldAlert, Key, MapPin, CheckCircle, 
  Menu, X, Home, FileText, MessageSquare, LogOut, LogIn, Signal, Cpu, Copy, BarChart3
} from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useToast } from '../../hooks/useToast';
import { ToastContainer } from '../../components/Toast';

export default function SupervisionPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const { success, error: showToastError, toasts, removeToast } = useToast();

  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    location: '',
    latitude: '',
    longitude: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [createdApiKey, setCreatedApiKey] = useState(null);

  const currentRole = user?.role || 'public';

  // Sécurité : Uniquement pour les administrateurs
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'admin') {
        router.push('/dashboard');
      }
    }
  }, [user, authLoading, router]);

  const loadStations = async () => {
    if (!user || user.role !== 'admin') return;
    setLoading(true);
    try {
      const res = await axios.get('/api/stations');
      setStations(res.data || []);
    } catch (err) {
      showToastError('Impossible de charger les stations');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      loadStations();
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.code || !formData.name || !formData.location) {
      showToastError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        code: formData.code,
        name: formData.name,
        location: formData.location,
        latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
        longitude: formData.longitude ? parseFloat(formData.longitude) : undefined
      };

      const res = await axios.post('/api/stations', payload);
      success('Station créée avec succès !');
      
      // Enregistrer la clé d'API générée pour l'afficher à l'admin
      setCreatedApiKey({
        code: res.data.code,
        apiKey: res.data.apiKey
      });

      // Réinitialiser le formulaire
      setFormData({
        code: '',
        name: '',
        location: '',
        latitude: '',
        longitude: ''
      });

      loadStations();
    } catch (err) {
      showToastError(err.response?.data?.message || 'Échec de la création de la station');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStation = async (id, name) => {
    if (!confirm(`Voulez-vous vraiment supprimer la station "${name}" ? Cette action est irréversible.`)) {
      return;
    }

    try {
      await axios.delete(`/api/stations/${id}`);
      success(`Station "${name}" supprimée`);
      loadStations();
    } catch (err) {
      showToastError('Impossible de supprimer la station');
      console.error(err);
    }
  };

  const handleCopyApiKey = () => {
    if (createdApiKey?.apiKey) {
      navigator.clipboard.writeText(createdApiKey.apiKey);
      success('Clé d\'API copiée dans le presse-papiers');
    }
  };

  if (authLoading || !user || user.role !== 'admin') {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <Activity className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm">Chargement du panneau d'administration...</p>
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
          SuperAdmin
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

        <Link href="/diagnostics" className="flex items-center gap-4 px-4 py-3 rounded-xl text-slate-300 hover:bg-white/5 hover:text-white transition-all text-sm font-medium">
          <Signal className="w-4 h-4 text-indigo-400" />
          Santé & Alertes
        </Link>
        <Link href="/maintenance" className="flex items-center gap-4 px-4 py-3 rounded-xl text-slate-300 hover:bg-white/5 hover:text-white transition-all text-sm font-medium">
          <Cpu className="w-4 h-4 text-indigo-400" />
          Maintenance
        </Link>
        <button onClick={() => setSidebarOpen(false)} className="w-full flex items-center gap-4 px-4 py-3 rounded-xl bg-white/10 text-white transition-all text-sm font-semibold text-left">
          <Compass className="w-4 h-4 text-indigo-400" />
          Supervision
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
              Administration des Stations
            </h2>
          </div>
          <div className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
            ● SuperAdmin Mode
          </div>
        </header>

        {/* Espace central */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Dialog Affichage Clé d'API après création */}
          {createdApiKey && (
            <div className="bg-emerald-50 border border-emerald-600 text-[#0f2042] p-5 rounded-2xl flex flex-col gap-3.5 shadow-md relative overflow-hidden">
              <div className="flex gap-3 items-start">
                <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-extrabold text-sm text-slate-800">Station météo créée avec succès !</h4>
                  <p className="text-xs text-slate-600">
                    Voici la clé d'API unique pour la station <span className="font-bold text-slate-800">{createdApiKey.code}</span>. Copiez-la et injectez-la dans le firmware de l'ESP32.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-white border border-slate-200 p-3 rounded-xl justify-between max-w-lg mt-1 shadow-inner">
                <span className="font-mono text-xs font-semibold select-all text-slate-800 break-all">{createdApiKey.apiKey}</span>
                <button
                  onClick={handleCopyApiKey}
                  className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors cursor-pointer shrink-0"
                  title="Copier la clé"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => setCreatedApiKey(null)}
                className="absolute top-4 right-4 p-1 hover:bg-white/40 rounded-lg text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
            
            {/* Formulaire d'ajout de station (1/3 de largeur) */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
              <h3 className="text-[#0f2042] font-bold text-md mb-6 flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-500" />
                Ajouter une Station Météo
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5 font-semibold">Code unique (ESP32 identifier)</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:border-[#0f2042]"
                    placeholder="Ex: ST-002"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-500 mb-1.5 font-semibold">Nom de la station</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:border-[#0f2042]"
                    placeholder="Ex: Station Lubumbashi"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-500 mb-1.5 font-semibold">Emplacement (Ville / Quartier)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <MapPin className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      required
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:border-[#0f2042]"
                      placeholder="Ex: Haut-Katanga / Lubumbashi"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1.5 font-semibold">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:border-[#0f2042]"
                      placeholder="Ex: -11.660"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1.5 font-semibold">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:border-[#0f2042]"
                      placeholder="Ex: 27.479"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#0f2042] hover:bg-slate-800 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-center transition-all text-sm cursor-pointer shadow-lg shadow-indigo-950/10 mt-2"
                >
                  {submitting ? 'Création...' : 'Créer la Station & Clé d\'API'}
                </button>
              </form>
            </div>

            {/* Liste des stations existantes (2/3 de largeur) */}
            <div className="xl:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-slate-100">
              <h3 className="text-[#0f2042] font-bold text-md mb-6">
                Parc des Stations Enregistrées ({stations.length})
              </h3>

              {loading ? (
                <div className="h-48 flex justify-center items-center">
                  <Activity className="w-8 h-8 text-indigo-500 animate-spin" />
                </div>
              ) : stations.length === 0 ? (
                <div className="border border-slate-100 rounded-2xl p-10 text-center text-slate-400 font-medium">
                  Aucune station enregistrée.
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-100 rounded-xl">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-[#0f2042] text-white">
                      <tr>
                        <th className="px-6 py-4 font-semibold">Code / Nom</th>
                        <th className="px-6 py-4 font-semibold">Emplacement</th>
                        <th className="px-6 py-4 font-semibold">Coordonnées</th>
                        <th className="px-6 py-4 font-semibold">État</th>
                        <th className="px-6 py-4 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {stations.map((st) => (
                        <tr key={st.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <span className="text-[10px] font-mono text-indigo-500 font-bold block">{st.code}</span>
                            <span className="font-bold text-slate-800">{st.name}</span>
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-600">{st.location}</td>
                          <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                            {st.latitude != null ? st.latitude.toFixed(4) : '--'}, {st.longitude != null ? st.longitude.toFixed(4) : '--'}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${getStatusBgClass(st.status)}`}>
                              {st.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleDeleteStation(st.id, st.name)}
                                className="p-2 bg-rose-50 hover:bg-rose-100 border border-rose-200/50 rounded-xl text-rose-600 transition-colors cursor-pointer"
                                title="Supprimer la station"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>

        </main>
      </div>
    </div>
  );
}
