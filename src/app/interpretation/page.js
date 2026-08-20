"use client";
import { useState, useEffect } from 'react';
import { 
  Thermometer, Droplets, Gauge, CloudRain, Activity, 
  Home, FileText, MessageSquare, LogOut, LogIn, Menu, X
} from 'lucide-react';
import axios from 'axios';
import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function Interpretation() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const [realtimeData, setRealtimeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <Activity className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm">Chargement de l'interprétation...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const currentRole = user?.role || 'public';

  useEffect(() => {
    const fetchRealtime = async () => {
      try {
        const response = await axios.get('/api/realtime');
        setRealtimeData(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Erreur:', err);
        setLoading(false);
      }
    };

    fetchRealtime();
    const interval = setInterval(fetchRealtime, 3000);
    return () => clearInterval(interval);
  }, []);

  const getTemperatureLevel = (temp) => {
    if (temp < 18) return { level: 'Très fraîche', color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-100' };
    if (temp < 22) return { level: 'Fraîche', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' };
    if (temp < 28) return { level: 'Agréable', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' };
    if (temp < 32) return { level: 'Chaude', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' };
    if (temp < 36) return { level: 'Très chaude', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' };
    return { level: 'Chaleur extrême', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' };
  };

  const getHumidityLevel = (humidity) => {
    if (humidity < 30) return { level: 'Très sèche', color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-100' };
    if (humidity < 50) return { level: 'Sèche', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' };
    if (humidity < 70) return { level: 'Confortable', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' };
    if (humidity < 85) return { level: 'Humide', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' };
    if (humidity < 95) return { level: 'Très humide', color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' };
    return { level: 'Saturée', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' };
  };

  const getPressureLevel = (pressure) => {
    if (pressure > 1025) return { level: 'Très haute pression', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', desc: 'Temps généralement très stable' };
    if (pressure > 1015) return { level: 'Haute pression', color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-100', desc: 'Temps stable probable' };
    if (pressure > 1005) return { level: 'Normale', color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-100', desc: 'Conditions standards' };
    if (pressure > 995) return { level: 'Basse pression', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100', desc: 'Temps perturbé possible' };
    return { level: 'Très basse pression', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100', desc: 'Temps perturbé probable' };
  };

  const getRainState = (val) => {
    if (val === 1) return { level: 'Averses actives', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' };
    return { level: 'Temps sec', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' };
  };

  const getWeatherCondition = (item) => {
    const { temperature, humidity, pressure, rain } = item;
    
    if (humidity > 95 && temperature < 25 && rain === 0) {
      return { condition: 'Brouillard', icon: '🌫', color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-100', message: 'Visibilité potentiellement réduite' };
    }
    if (humidity > 85 && pressure < 1000 && temperature > 28) {
      return { condition: 'Risque d\'orage', icon: '⛈', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', message: 'Conditions favorables aux orages à Kinshasa' };
    }
    if (rain === 1) {
      return { condition: 'Pluie en cours', icon: '🌧', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', message: 'Précipitations détectées par le capteur' };
    }
    if (rain === 0 && humidity > 80) {
      return { condition: 'Ciel Couvert / Humide', icon: '☁', color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-100', message: 'Ciel majoritairement couvert' };
    }
    if (rain === 0 && humidity >= 60 && humidity <= 80) {
      return { condition: 'Partiellement Nuageux', icon: '🌤', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', message: 'Alternance de soleil et de nuages' };
    }
    if (rain === 0 && humidity < 70 && pressure >= 1005 && temperature > 28) {
      return { condition: 'Ensoleillé / Sec', icon: '☀', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', message: 'Ciel dégagé et fort ensoleillement' };
    }
    return { condition: 'Conditions mixtes', icon: '🌥', color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-100', message: 'Conditions météo variables' };
  };

  const getComfortIndex = (temperature, humidity) => {
    if (temperature >= 22 && temperature <= 28 && humidity >= 40 && humidity <= 70) {
      return { level: 'Excellent', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' };
    }
    if (temperature >= 20 && temperature <= 32 && humidity >= 30 && humidity <= 80) {
      return { level: 'Bon', color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-100' };
    }
    if (temperature >= 18 && temperature <= 35 && humidity >= 20 && humidity <= 90) {
      return { level: 'Moyen', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' };
    }
    if (temperature > 35 || humidity > 90) {
      return { level: 'Mauvais', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' };
    }
    return { level: 'Critique', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' };
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[110] bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Activity className="w-12 h-12 text-indigo-500 animate-spin" />
          <div className="text-slate-400 text-sm font-semibold tracking-widest uppercase">Analyse des indices...</div>
        </div>
      </div>
    );
  }

  const tempLevel = realtimeData ? getTemperatureLevel(realtimeData.temperature) : null;
  const humidityLevel = realtimeData ? getHumidityLevel(realtimeData.humidity) : null;
  const pressureLevel = realtimeData ? getPressureLevel(realtimeData.pressure) : null;
  const rainState = realtimeData ? getRainState(realtimeData.rain) : null;
  const weatherCondition = realtimeData ? getWeatherCondition(realtimeData) : null;
  const comfortIndex = realtimeData ? getComfortIndex(realtimeData.temperature, realtimeData.humidity) : null;

  const SidebarContent = () => (
    <div className="flex flex-col h-full text-white">
      {/* Profil Utilisateur */}
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
          {currentRole === 'admin' ? 'SuperAdmin' : currentRole === 'tech' ? 'Technicien' : currentRole === 'researcher' ? 'Chercheur' : 'Public'}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        <Link href="/" className="flex items-center gap-4 px-4 py-3 rounded-xl text-slate-300 hover:bg-white/5 hover:text-white transition-all text-sm font-medium">
          <Home className="w-4 h-4 text-indigo-400" />
          Accueil
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
          <MessageSquare className="w-4 h-4 text-indigo-400" />
          Interprétation
        </button>
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

      {/* 3. MAIN WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden text-slate-600 p-2 hover:bg-slate-100 rounded-xl transition-all">
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-bold text-[#0f2042] tracking-wide">
              Analyse & Interprétation Climatique
            </h2>
          </div>
          <div className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
            ● KongoClim Online
          </div>
        </header>

        {/* Espace central de défilement */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">

          {!realtimeData ? (
            <div className="bg-white rounded-xl p-12 text-center text-slate-400 border border-slate-200 font-medium">
              Aucune donnée en direct pour l'interprétation.
            </div>
          ) : (
            <>
              {/* Main Weather Condition Banner */}
              <div className={`bg-white rounded-xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 border-l-4 ${weatherCondition.border.replace('border-', 'border-l-')}`}>
                <div className="flex items-center gap-6">
                  <span className="text-5xl">{weatherCondition.icon}</span>
                  <div>
                    <h2 className="text-xl font-bold text-[#0f2042] mb-1">{weatherCondition.condition}</h2>
                    <p className={`text-sm font-bold ${weatherCondition.color}`}>{weatherCondition.message}</p>
                  </div>
                </div>
                <div className="text-xs font-mono text-slate-500">
                  Capté à : {new Date(realtimeData.timestamp).toLocaleTimeString('fr-FR')}
                </div>
              </div>

              {/* Comfort Index Summary card */}
              <div className="bg-[#0f2042] text-white rounded-xl p-6 shadow-md flex justify-between items-center">
                <span className="text-slate-300 text-sm font-bold uppercase tracking-wider">Confort Climatique Ressenti</span>
                <span className={`text-lg font-black bg-white/10 px-4 py-1.5 rounded-xl border border-white/20 uppercase tracking-widest ${comfortIndex.color.replace('text-', 'text-')}`}>
                  {comfortIndex.level}
                </span>
              </div>

              {/* Diagnostic Cards grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Temperature level */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between h-40">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Analyse Température</span>
                    <div className="p-2 bg-rose-500/10 rounded-xl text-rose-500">
                      <Thermometer className="w-5 h-5" />
                    </div>
                  </div>
                  <div>
                    <span className="text-3xl font-extrabold text-[#0f2042]">{realtimeData.temperature.toFixed(1)}°C</span>
                    <span className={`text-sm font-bold block mt-1 ${tempLevel.color}`}>{tempLevel.level}</span>
                  </div>
                </div>

                {/* Humidity level */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between h-40">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Analyse Humidité</span>
                    <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500">
                      <Droplets className="w-5 h-5" />
                    </div>
                  </div>
                  <div>
                    <span className="text-3xl font-extrabold text-[#0f2042]">{realtimeData.humidity.toFixed(0)}%</span>
                    <span className={`text-sm font-bold block mt-1 ${humidityLevel.color}`}>{humidityLevel.level}</span>
                  </div>
                </div>

                {/* Pressure level */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between h-40">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Pression Barométrique</span>
                    <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500">
                      <Gauge className="w-5 h-5" />
                    </div>
                  </div>
                  <div>
                    <span className="text-3xl font-extrabold text-[#0f2042]">
                      {realtimeData.pressure ? `${realtimeData.pressure.toFixed(0)} hPa` : '-- hPa'}
                    </span>
                    <span className={`text-sm font-bold block mt-1 ${pressureLevel.color}`}>{pressureLevel.level}</span>
                  </div>
                </div>

                {/* Rain state */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between h-40">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Précipitations</span>
                    <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-500">
                      <CloudRain className="w-5 h-5" />
                    </div>
                  </div>
                  <div>
                    <span className="text-3xl font-extrabold text-[#0f2042]">
                      {realtimeData.rain === 1 ? 'Actives (1)' : 'Inactives (0)'}
                    </span>
                    <span className={`text-sm font-bold block mt-1 ${rainState.color}`}>{rainState.level}</span>
                  </div>
                </div>

              </div>
            </>
          )}

        </main>
      </div>
    </div>
  );
}
