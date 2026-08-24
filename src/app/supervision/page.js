"use client";
import { useState, useEffect } from 'react';
import { 
  Activity, Compass, Plus, Trash2, Edit2, ShieldAlert, Key, MapPin, CheckCircle, 
  Menu, X, Home, FileText, MessageSquare, LogOut, LogIn, Signal, Cpu, Copy, BarChart3,
  User, Settings, Wrench, Power
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

  // Onglet actif : 'stations' | 'users' | 'settings' | 'retention' | 'audit'
  const [activeTab, setActiveTab] = useState('stations');

  // Form State pour nouvelle station
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    location: '',
    latitude: '',
    longitude: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [createdApiKey, setCreatedApiKey] = useState(null);

  // States Edition Station
  const [editingStation, setEditingStation] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: '', location: '', latitude: '', longitude: '' });

  // States Gestion des Utilisateurs
  const [usersList, setUsersList] = useState([]);
  const [userForm, setUserForm] = useState({ email: '', name: '', password: '', role: 'public' });
  const [creatingUser, setCreatingUser] = useState(false);

  // States Configuration & Seuils
  const [settings, setSettings] = useState({
    temp_threshold_critical_high: '40.0',
    battery_threshold_critical_low: '3.4',
    retention_days: '30'
  });
  const [savingSettings, setSavingSettings] = useState(false);

  // States Rétention & Nettoyage
  const [cleaningNow, setCleaningNow] = useState(false);
  const [cleanupDays, setCleanupDays] = useState('30');

  // States Logs d'Audit
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

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
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      const res = await axios.get('/api/stations');
      setStations(res.data || []);
    } catch (err) {
      showToastError('Impossible de charger les stations');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      const res = await axios.get('/api/users');
      setUsersList(res.data || []);
    } catch (err) {
      showToastError('Erreur de chargement des utilisateurs');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!userForm.email || !userForm.name || !userForm.password) {
      showToastError('Veuillez remplir tous les champs');
      return;
    }
    setCreatingUser(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      await axios.post('/api/users', userForm);
      success(`Utilisateur "${userForm.email}" créé avec succès !`);
      setUserForm({ email: '', name: '', password: '', role: 'public' });
      loadUsers();
    } catch (err) {
      showToastError(err.response?.data?.message || "Erreur lors de la création de l'utilisateur");
    } finally {
      setCreatingUser(false);
    }
  };

  const handleUpdateUserRole = async (id, email, newRole) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      await axios.put(`/api/users/${id}`, { role: newRole });
      success(`Rôle de ${email} mis à jour en "${newRole}"`);
      loadUsers();
    } catch (err) {
      showToastError("Erreur lors de la modification du rôle");
    }
  };

  const handleDeleteUser = async (id, email) => {
    if (email === user?.email) {
      showToastError("Vous ne pouvez pas supprimer votre propre compte !");
      return;
    }
    if (!confirm(`Supprimer définitivement le compte de ${email} ?`)) return;
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      await axios.delete(`/api/users/${id}`);
      success(`Utilisateur ${email} supprimé`);
      loadUsers();
    } catch (err) {
      showToastError("Erreur lors de la suppression de l'utilisateur");
    }
  };

  const loadSettings = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      const res = await axios.get('/api/settings');
      if (res.data) setSettings(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      await axios.post('/api/settings', settings);
      success("Configuration système enregistrée !");
      loadSettings();
    } catch (err) {
      showToastError("Erreur d'enregistrement des seuils");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleTriggerCleanup = async () => {
    if (!confirm(`Voulez-vous vraiment supprimer toutes les données météo antérieures à ${cleanupDays} jours ? Cette action libère de l'espace disque.`)) return;
    setCleaningNow(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      const res = await axios.delete(`/api/cleanup?days=${cleanupDays}`);
      success(res.data?.message || "Purge terminée");
      loadAuditLogs();
    } catch (err) {
      showToastError("Erreur lors du nettoyage de la base de données");
    } finally {
      setCleaningNow(false);
    }
  };

  const loadAuditLogs = async () => {
    setLoadingLogs(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      const res = await axios.get('/api/audit-logs');
      setAuditLogs(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleToggleStationActive = async (id, name, activeState) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      await axios.put(`/api/stations/${id}`, { active: !activeState });
      success(activeState ? `Station ${name} désactivée` : `Station ${name} réactivée`);
      loadStations();
    } catch (err) {
      showToastError("Impossible de modifier le statut de la station");
    }
  };

  const handleStartEdit = (st) => {
    setEditingStation(st);
    setEditFormData({
      name: st.name,
      location: st.location,
      latitude: st.latitude || '',
      longitude: st.longitude || ''
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingStation) return;
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      const payload = {
        name: editFormData.name,
        location: editFormData.location,
        latitude: editFormData.latitude ? parseFloat(editFormData.latitude) : null,
        longitude: editFormData.longitude ? parseFloat(editFormData.longitude) : null
      };
      await axios.put(`/api/stations/${editingStation.id}`, payload);
      success(`Station "${editingStation.code}" modifiée avec succès !`);
      setEditingStation(null);
      loadStations();
    } catch (err) {
      showToastError("Erreur d'édition de la station");
    }
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      if (activeTab === 'stations') loadStations();
      if (activeTab === 'users') loadUsers();
      if (activeTab === 'settings') loadSettings();
      if (activeTab === 'retention') loadSettings();
      if (activeTab === 'audit') loadAuditLogs();
    }
  }, [user, activeTab]);

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
              Espace Administration
            </h2>
          </div>
          <div className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
            ● SuperAdmin Mode
          </div>
        </header>

        {/* Tab navigation bar */}
        <div className="bg-white border-b border-slate-200 px-6 py-2.5 flex items-center gap-2 overflow-x-auto shrink-0 shadow-sm">
          {[
            { id: 'stations', label: 'Stations Météo', icon: Cpu },
            { id: 'users', label: 'Utilisateurs & Rôles', icon: User },
            { id: 'settings', label: 'Seuils & Alertes', icon: Settings },
            { id: 'retention', label: 'Rétention & Purge', icon: Trash2 },
            { id: 'audit', label: 'Logs d\'Audit', icon: FileText }
          ].map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === t.id
                    ? 'bg-[#0f2042] border-[#0f2042] text-white'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            )
          })}
        </div>

        {/* Espace central */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Dialog Affichage Clé d'API après création */}
          {createdApiKey && (
            <div className="bg-emerald-50 border border-emerald-600 text-[#0f2042] p-5 rounded-2xl flex flex-col gap-3.5 shadow-md relative overflow-hidden mb-6 animate-in fade-in duration-200">
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
                className="absolute top-4 right-4 p-1 hover:bg-white/40 rounded-lg text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* RENDERING DÉPENDANT DES ONGLETS */}

          {activeTab === 'stations' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
              
              {/* Formulaire Station */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                <h3 className="text-[#0f2042] font-bold text-sm mb-6 flex items-center gap-2 uppercase tracking-wider">
                  {editingStation ? <Edit2 className="w-5 h-5 text-indigo-500" /> : <Plus className="w-5 h-5 text-indigo-500" />}
                  {editingStation ? 'Modifier la Station' : 'Ajouter une Station Météo'}
                </h3>

                {editingStation ? (
                  <form onSubmit={handleSaveEdit} className="space-y-4">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1.5 font-semibold">Code unique (Lecture seule)</label>
                      <input
                        type="text"
                        disabled
                        value={editingStation.code}
                        className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-400 text-sm focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1.5 font-semibold">Nom de la station</label>
                      <input
                        type="text"
                        required
                        value={editFormData.name}
                        onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:border-[#0f2042]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1.5 font-semibold">Emplacement</label>
                      <input
                        type="text"
                        required
                        value={editFormData.location}
                        onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:border-[#0f2042]"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-slate-500 mb-1.5 font-semibold">Latitude</label>
                        <input
                          type="number"
                          step="any"
                          value={editFormData.latitude}
                          onChange={(e) => setEditFormData({ ...editFormData, latitude: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1.5 font-semibold">Longitude</label>
                        <input
                          type="number"
                          step="any"
                          value={editFormData.longitude}
                          onChange={(e) => setEditFormData({ ...editFormData, longitude: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        type="submit"
                        className="flex-1 bg-[#0f2042] hover:bg-slate-800 text-white font-semibold py-2.5 rounded-xl text-xs text-center transition-all cursor-pointer"
                      >
                        Enregistrer
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingStation(null)}
                        className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold py-2.5 rounded-xl text-xs text-center transition-all cursor-pointer"
                      >
                        Annuler
                      </button>
                    </div>
                  </form>
                ) : (
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
                      <label className="block text-xs text-slate-500 mb-1.5 font-semibold">Emplacement</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <MapPin className="w-4 h-4" />
                        </span>
                        <input
                          type="text"
                          required
                          value={formData.location}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-slate-800 text-sm focus:outline-none"
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
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:outline-none"
                          placeholder="-11.660"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1.5 font-semibold">Longitude</label>
                        <input
                          type="number"
                          step="any"
                          value={formData.longitude}
                          onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:outline-none"
                          placeholder="27.479"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-[#0f2042] hover:bg-slate-800 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-center transition-all text-xs cursor-pointer shadow-lg mt-2"
                    >
                      {submitting ? 'Création...' : 'Créer la Station & Clé d\'API'}
                    </button>
                  </form>
                )}
              </div>

              {/* Liste des stations */}
              <div className="xl:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                <h3 className="text-[#0f2042] font-bold text-sm mb-6 uppercase tracking-wider">
                  Parc des Stations ({stations.length})
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
                    <table className="w-full text-xs text-left">
                      <thead className="text-xs uppercase bg-[#0f2042] text-white">
                        <tr>
                          <th className="px-5 py-3 font-semibold">Code / Nom</th>
                          <th className="px-5 py-3 font-semibold">Emplacement</th>
                          <th className="px-5 py-3 font-semibold">Coordonnées</th>
                          <th className="px-5 py-3 font-semibold">Santé</th>
                          <th className="px-5 py-3 font-semibold">Service</th>
                          <th className="px-5 py-3 font-semibold text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150">
                        {stations.map((st) => (
                          <tr key={st.id} className={`hover:bg-slate-50 transition-colors ${!st.active ? 'opacity-55 bg-slate-50/50' : ''}`}>
                            <td className="px-5 py-3">
                              <span className="text-[10px] font-mono text-indigo-500 font-bold block">{st.code}</span>
                              <span className="font-bold text-slate-800">{st.name}</span>
                            </td>
                            <td className="px-5 py-3 font-medium text-slate-600">{st.location}</td>
                            <td className="px-5 py-3 text-slate-500 font-mono text-[10px]">
                              {st.latitude != null ? st.latitude.toFixed(4) : '--'}, {st.longitude != null ? st.longitude.toFixed(4) : '--'}
                            </td>
                            <td className="px-5 py-3">
                              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${getStatusBgClass(st.status)}`}>
                                {st.status}
                              </span>
                            </td>
                            <td className="px-5 py-3">
                              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                                st.active
                                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'
                                  : 'bg-rose-500/10 border-rose-500/20 text-rose-600'
                              }`}>
                                {st.active ? 'ACTIVÉE' : 'DÉSACTIVÉE'}
                              </span>
                            </td>
                            <td className="px-5 py-3">
                              <div className="flex gap-1.5 justify-center">
                                <button
                                  onClick={() => handleToggleStationActive(st.id, st.name, st.active)}
                                  className={`p-2 border rounded-xl transition-colors cursor-pointer ${
                                    st.active 
                                      ? 'bg-amber-50 hover:bg-amber-100 border-amber-200/50 text-amber-600' 
                                      : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200/50 text-emerald-600'
                                  }`}
                                  title={st.active ? "Désactiver la station" : "Activer la station"}
                                >
                                  <Power className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleStartEdit(st)}
                                  className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 transition-colors cursor-pointer"
                                  title="Modifier la station"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
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
          )}

          {activeTab === 'users' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start animate-in fade-in duration-200">
              {/* Création utilisateur */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                <h3 className="text-[#0f2042] font-bold text-sm mb-6 flex items-center gap-2 uppercase tracking-wider">
                  <User className="w-5 h-5 text-indigo-500" />
                  Créer un Utilisateur
                </h3>

                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1.5 font-semibold">Nom complet</label>
                    <input
                      type="text"
                      required
                      value={userForm.name}
                      onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:border-[#0f2042]"
                      placeholder="Ex: Patrick Kabeya"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1.5 font-semibold">Adresse Email</label>
                    <input
                      type="email"
                      required
                      value={userForm.email}
                      onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:border-[#0f2042]"
                      placeholder="Ex: patrick@steair.cd"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1.5 font-semibold">Mot de passe temporaire</label>
                    <input
                      type="password"
                      required
                      value={userForm.password}
                      onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:border-[#0f2042]"
                      placeholder="Mot de passe"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1.5 font-semibold">Rôle & Droits d'accès</label>
                    <select
                      value={userForm.role}
                      onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:border-[#0f2042]"
                    >
                      <option value="public">Public (Lecture seule)</option>
                      <option value="researcher">Researcher (Analyses & Exports)</option>
                      <option value="tech">Tech (Maintenance & Santé)</option>
                      <option value="admin">Admin (Configuration & Supervision)</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={creatingUser}
                    className="w-full bg-[#0f2042] hover:bg-slate-800 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-center transition-all text-xs cursor-pointer shadow-lg mt-2"
                  >
                    {creatingUser ? 'Création...' : 'Créer le Compte'}
                  </button>
                </form>
              </div>

              {/* Liste utilisateurs */}
              <div className="xl:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                <h3 className="text-[#0f2042] font-bold text-sm mb-6 uppercase tracking-wider">
                  Comptes & Attribution des Rôles ({usersList.length})
                </h3>

                <div className="overflow-x-auto border border-slate-100 rounded-xl">
                  <table className="w-full text-xs text-left">
                    <thead className="text-xs uppercase bg-[#0f2042] text-white">
                      <tr>
                        <th className="px-5 py-3 font-semibold">Utilisateur</th>
                        <th className="px-5 py-3 font-semibold">Email</th>
                        <th className="px-5 py-3 font-semibold">Date d'inscription</th>
                        <th className="px-5 py-3 font-semibold">Rôle</th>
                        <th className="px-5 py-3 text-center font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150">
                      {usersList.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-3 font-bold text-slate-800">{u.name}</td>
                          <td className="px-5 py-3 text-slate-600 font-mono">{u.email}</td>
                          <td className="px-5 py-3 text-slate-450 font-mono">{new Date(u.createdAt).toLocaleDateString('fr-FR')}</td>
                          <td className="px-5 py-3">
                            <select
                              value={u.role}
                              onChange={(e) => handleUpdateUserRole(u.id, u.email, e.target.value)}
                              disabled={u.email === user?.email}
                              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-bold text-xs text-[#0f2042] focus:outline-none"
                            >
                              <option value="public">Public</option>
                              <option value="researcher">Researcher</option>
                              <option value="tech">Tech</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                          <td className="px-5 py-3 text-center">
                            <button
                              onClick={() => handleDeleteUser(u.id, u.email)}
                              disabled={u.email === user?.email}
                              className="p-2 bg-rose-50 hover:bg-rose-100 disabled:opacity-30 border border-rose-200/50 rounded-xl text-rose-600 transition-colors cursor-pointer"
                              title="Révoquer l'utilisateur"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-2xl bg-white rounded-xl p-6 shadow-sm border border-slate-100 animate-in fade-in duration-200">
              <h3 className="text-[#0f2042] font-bold text-sm mb-6 flex items-center gap-2 uppercase tracking-wider">
                <Settings className="w-5 h-5 text-indigo-500" />
                Configuration des Seuils d'Alertes
              </h3>

              <form onSubmit={handleSaveSettings} className="space-y-5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-600">Seuil de Température Critique (°C)</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={settings.temp_threshold_critical_high}
                      onChange={(e) => setSettings({ ...settings, temp_threshold_critical_high: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#0f2042]"
                    />
                    <span className="text-[10px] text-slate-400 block">Température à partir de laquelle une alerte de canicule environnementale est déclenchée.</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-600">Tension de Batterie Critique (V)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={settings.battery_threshold_critical_low}
                      onChange={(e) => setSettings({ ...settings, battery_threshold_critical_low: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#0f2042]"
                    />
                    <span className="text-[10px] text-slate-400 block">Tension minimale de batterie en dessous de laquelle l'alerte technique est levée.</span>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={savingSettings}
                    className="bg-[#0f2042] hover:bg-slate-800 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl transition-all shadow-md cursor-pointer"
                  >
                    {savingSettings ? 'Enregistrement...' : 'Enregistrer la Configuration'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'retention' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start animate-in fade-in duration-200">
              
              {/* Rétention config */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                <h3 className="text-[#0f2042] font-bold text-sm mb-6 flex items-center gap-2 uppercase tracking-wider">
                  <Trash2 className="w-5 h-5 text-indigo-500" />
                  Politique de Rétention des Données
                </h3>

                <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-600">Durée de conservation des mesures (Jours)</label>
                    <input
                      type="number"
                      required
                      value={settings.retention_days}
                      onChange={(e) => setSettings({ ...settings, retention_days: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-400 block">Nombre de jours avant que les anciennes mesures orphelines ou archivées ne soient purgées.</span>
                  </div>

                  <button
                    type="submit"
                    disabled={savingSettings}
                    className="bg-[#0f2042] hover:bg-slate-800 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-md cursor-pointer"
                  >
                    {savingSettings ? 'Enregistrement...' : 'Mettre à jour la politique'}
                  </button>
                </form>
              </div>

              {/* Nettoyage Manuel */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                <h3 className="text-[#0f2042] font-bold text-sm mb-6 flex items-center gap-2 uppercase tracking-wider">
                  <Wrench className="w-5 h-5 text-indigo-500" />
                  Purge & Nettoyage Immédiat
                </h3>

                <div className="space-y-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-600">Supprimer les relevés plus vieux que (Jours) :</label>
                    <input
                      type="number"
                      value={cleanupDays}
                      onChange={(e) => setCleanupDays(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                    />
                  </div>

                  <button
                    onClick={handleTriggerCleanup}
                    disabled={cleaningNow}
                    className="bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-rose-900/10 cursor-pointer"
                  >
                    {cleaningNow ? 'Nettoyage...' : 'Lancer le nettoyage immédiat'}
                  </button>
                </div>
              </div>

            </div>
          )}

          {activeTab === 'audit' && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 animate-in fade-in duration-200">
              <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
                <h3 className="text-[#0f2042] font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-500" />
                  Journal d'Audit du Système
                </h3>
                <button
                  onClick={loadAuditLogs}
                  className="bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold px-3 py-1.5 rounded-xl text-xs cursor-pointer transition-all"
                >
                  Rafraîchir
                </button>
              </div>

              {loadingLogs ? (
                <div className="h-48 flex justify-center items-center">
                  <Activity className="w-8 h-8 text-indigo-500 animate-spin" />
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="border border-slate-100 rounded-2xl p-10 text-center text-slate-400 font-medium">
                  Aucun événement d'audit enregistré.
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-100 rounded-xl">
                  <table className="w-full text-xs text-left">
                    <thead className="text-xs uppercase bg-[#0f2042] text-white">
                      <tr>
                        <th className="px-5 py-3 font-semibold w-[200px]">Action</th>
                        <th className="px-5 py-3 font-semibold">Détails</th>
                        <th className="px-5 py-3 font-semibold w-[180px]">Par</th>
                        <th className="px-5 py-3 font-semibold w-[150px]">Date / Heure</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 font-mono">
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-3 font-bold">
                            <span className={`px-2 py-0.5 rounded-md text-[9px] ${
                              log.action.includes('CREATE') 
                                ? 'bg-emerald-500/10 text-emerald-600'
                                : log.action.includes('DELETE')
                                  ? 'bg-rose-500/10 text-rose-600'
                                  : 'bg-indigo-500/10 text-indigo-600'
                            }`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-slate-700 font-sans text-xs">{log.details}</td>
                          <td className="px-5 py-3 text-slate-500 text-[10px]">{log.userEmail || 'système'}</td>
                          <td className="px-5 py-3 text-slate-450 text-[10px]">{new Date(log.createdAt).toLocaleString('fr-FR')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
