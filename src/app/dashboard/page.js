"use client";
import { useState, useEffect } from 'react';
import { 
  Thermometer, Droplets, Gauge, CloudRain, ShieldAlert, Cpu, Activity, 
  TrendingUp, FileJson, FileSpreadsheet, ShieldCheck, Battery, Signal, 
  Trash2, Info, Compass 
} from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';
import { useWeatherData } from '../../hooks/useWeatherData';
import { useFileExport } from '../../hooks/useFileExport';
import { useToast } from '../../hooks/useToast';
import { ToastContainer } from '../../components/Toast';
import { WeatherChart, MultiLineChart } from '../../components/WeatherChart';
import { useAuth } from '../../hooks/useAuth';

export default function Dashboard() {
  const { user } = useAuth();
  const { data, loading, error, consecutiveErrors } = useWeatherData();
  const { exportJSON, exportExcel } = useFileExport();
  const { toasts, success, error: showToastError, removeToast } = useToast();

  const [cleanupDays, setCleanupDays] = useState(30);
  const [cleaning, setCleaning] = useState(false);

  useEffect(() => {
    if (error) {
      showToastError(error);
    }
  }, [error, showToastError]);

  const handleExportJSON = async () => {
    const result = await exportJSON();
    if (result) {
      success('Export JSON réussi');
    } else {
      showToastError('Échec de l\'export JSON');
    }
  };

  const handleExportExcel = async () => {
    const result = await exportExcel();
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

  // Calcul du confort thermique local
  const getComfortDetails = (temp, hum) => {
    if (temp >= 22 && temp <= 28 && hum >= 40 && hum <= 70) {
      return { status: 'Excellent', style: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300', desc: 'Indice idéal pour Kinshasa.' };
    }
    if (temp >= 20 && temp <= 32 && hum >= 30 && hum <= 80) {
      return { status: 'Bon', style: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300', desc: 'Conditions confortables.' };
    }
    if (temp >= 18 && temp <= 35 && hum >= 20 && hum <= 90) {
      return { status: 'Moyen', style: 'bg-amber-500/10 border-amber-500/20 text-amber-300', desc: 'Chaleur ou humidité modérée.' };
    }
    return { status: 'Critique / Vigilance', style: 'bg-rose-500/10 border-rose-500/20 text-rose-300', desc: 'Vigilance forte humidité ou chaleur extrême.' };
  };

  const currentRole = user?.role || 'public'; // Par défaut, espace public si non connecté

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Activity className="w-12 h-12 text-indigo-500 animate-spin" />
          <div className="text-slate-400 text-sm font-semibold tracking-widest uppercase">Initialisation...</div>
        </div>
      </div>
    );
  }

  const comfort = realtimeData ? getComfortDetails(realtimeData.temperature, realtimeData.humidity) : null;

  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-12">
      
      {/* Alerte météo active */}
      {realtimeData?.alert_active && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-200 p-4 rounded-2xl mb-8 flex items-center gap-3 animate-pulse">
          <ShieldAlert className="w-6 h-6 text-rose-400" />
          <div className="text-sm">
            <span className="font-bold">⚠️ ALERTE CRITIQUE :</span> Conditions climatiques intenses détectées par la station (Précipitations en cours).
          </div>
        </div>
      )}

      {/* Header avec indicateur d'espace actif */}
      <section className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-8">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <span className="glass-pill px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase">
              Espace : {currentRole === 'admin' ? 'SuperAdmin National' : currentRole === 'tech' ? 'Technicien / Opérateur' : currentRole === 'researcher' ? 'Scientifique / Data' : 'Grand Public'}
            </span>
            {!user && (
              <span className="bg-white/5 border border-white/10 px-3 py-1 rounded-full text-[10px] text-slate-400 font-medium">
                Lecture seule (Connectez-vous pour plus de rôles)
              </span>
            )}
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-2">Moniteur KongoClim</h1>
          <p className="text-slate-400 max-w-xl">
            Surveillance en temps réel et télémétrie distante sécurisée.
          </p>
        </div>

        {comfort && (
          <div className={`border p-4 rounded-2xl max-w-xs flex flex-col gap-1 ${comfort.style}`}>
            <span className="text-xs uppercase font-bold tracking-wider">Confort Climatique</span>
            <span className="text-lg font-bold">{comfort.status}</span>
            <span className="text-xs opacity-80">{comfort.desc}</span>
          </div>
        )}
      </section>

      {/* Section 1 : Relevés en Temps Réel (Tous les rôles) */}
      <section className="mb-12">
        {realtimeData ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Temp Card */}
            <div className="glass-card rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/20 group">
              <div className="flex items-center justify-between mb-4">
                <span className="text-slate-400 text-sm font-medium">Température</span>
                <div className="p-2 bg-rose-500/10 rounded-xl group-hover:bg-rose-500/20 transition-colors">
                  <Thermometer className="w-5 h-5 text-rose-400" />
                </div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white">{realtimeData.temperature.toFixed(1)}</span>
                <span className="text-lg text-slate-500 font-light">°C</span>
              </div>
            </div>

            {/* Hum Card */}
            <div className="glass-card rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/20 group">
              <div className="flex items-center justify-between mb-4">
                <span className="text-slate-400 text-sm font-medium">Humidité</span>
                <div className="p-2 bg-blue-500/10 rounded-xl group-hover:bg-blue-500/20 transition-colors">
                  <Droplets className="w-5 h-5 text-blue-400" />
                </div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white">{realtimeData.humidity.toFixed(0)}</span>
                <span className="text-lg text-slate-500 font-light">%</span>
              </div>
            </div>

            {/* Press Card */}
            <div className="glass-card rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/20 group">
              <div className="flex items-center justify-between mb-4">
                <span className="text-slate-400 text-sm font-medium">Pression</span>
                <div className="p-2 bg-amber-500/10 rounded-xl group-hover:bg-amber-500/20 transition-colors">
                  <Gauge className="w-5 h-5 text-amber-400" />
                </div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white">
                  {realtimeData.pressure ? realtimeData.pressure.toFixed(0) : '--'}
                </span>
                <span className="text-lg text-slate-500 font-light">hPa</span>
              </div>
            </div>

            {/* Rain Card */}
            <div className="glass-card rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/20 group">
              <div className="flex items-center justify-between mb-4">
                <span className="text-slate-400 text-sm font-medium">Averses</span>
                <div className="p-2 bg-indigo-500/10 rounded-xl group-hover:bg-indigo-500/20 transition-colors">
                  <CloudRain className="w-5 h-5 text-indigo-400" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white">
                  {realtimeData.rain === 1 ? 'Actives (1)' : 'Inactives (0)'}
                </span>
              </div>
              <div className={`mt-3 text-xs font-semibold tracking-wide ${realtimeData.rain === 1 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {realtimeData.rain === 1 ? '● PLUIE EN COURS' : '● TEMPS SEC'}
              </div>
            </div>

          </div>
        ) : (
          <div className="glass-card rounded-2xl p-12 text-center text-slate-400 font-medium">
            Aucun capteur connecté
          </div>
        )}
      </section>

      {/* ESPACE TECHNICIEN : Panel Diagnostics */}
      {currentRole === 'tech' && (
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-6 text-indigo-400 flex items-center gap-2">
            <Cpu className="w-5 h-5" /> Télémétrie GSM & Énergie (SIM800C)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card rounded-2xl p-6 flex items-center gap-4">
              <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
                <Signal className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-400 block uppercase font-semibold">Signal Cellulaire</span>
                <span className="text-xl font-bold text-white">
                  {realtimeData?.gsmSignal !== null && realtimeData?.gsmSignal !== undefined
                    ? `${-113 + 2 * realtimeData.gsmSignal} dBm (${realtimeData.gsmSignal}/31)`
                    : 'Hors Ligne'}
                </span>
                <span className="text-xs text-emerald-400 block">
                  ● Opérateur : {realtimeData?.gsmOperator || 'Non Détecté'}
                </span>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-6 flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
                <Battery className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-400 block uppercase font-semibold">Alimentation Solaire</span>
                <span className="text-xl font-bold text-white">
                  {realtimeData?.batteryVoltage !== null && realtimeData?.batteryVoltage !== undefined
                    ? `${realtimeData.batteryVoltage.toFixed(2)} V`
                    : 'Indisponible'}
                </span>
                <span className="text-xs text-emerald-400 block">
                  {realtimeData?.batteryVoltage && realtimeData.batteryVoltage > 3.6
                    ? '● Tension Normale (Li-ion)'
                    : '● Charge Critique (< 3.6V)'}
                </span>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-6 flex items-center gap-4">
              <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400">
                <Compass className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-400 block uppercase font-semibold">Géolocalisation LBS (CellID)</span>
                <span className="text-md font-bold text-white font-mono">
                  {realtimeData?.lbsLat && realtimeData?.lbsLon
                    ? `LAT: ${realtimeData.lbsLat.toFixed(4)}, LON: ${realtimeData.lbsLon.toFixed(4)}`
                    : 'Recherche GSM...'}
                </span>
                <span className="text-xs text-slate-500 block">Calculé sans module GPS physique</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ESPACE SUPERADMIN : Panel de contrôle global */}
      {currentRole === 'admin' && (
        <section className="mb-12 bg-indigo-950/20 border border-indigo-500/10 p-6 rounded-2xl">
          <h2 className="text-lg font-bold mb-4 text-white flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-indigo-400" />
            Zone Administration : Maintenance Base de Données
          </h2>
          <div className="flex flex-wrap items-center gap-4">
            <div className="text-sm text-slate-300">
              Supprimer les métriques antérieures à :
            </div>
            <input
              type="number"
              value={cleanupDays}
              onChange={(e) => setCleanupDays(parseInt(e.target.value))}
              className="bg-slate-950 border border-white/10 rounded-xl px-4 py-2 w-20 text-center text-sm text-white focus:outline-none focus:border-indigo-500"
            />
            <span className="text-sm text-slate-300">jours</span>
            <button
              onClick={handleCleanup}
              disabled={cleaning}
              className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-rose-900/20 cursor-pointer disabled:opacity-50"
            >
              {cleaning ? 'Nettoyage...' : 'Exécuter le Nettoyage'}
            </button>
          </div>
        </section>
      )}

      {/* ESPACE CHERCHEUR / B2B / ADMIN : Graphiques et Exports */}
      {(currentRole === 'researcher' || currentRole === 'admin' || currentRole === 'tech') && (
        <>
          {/* Graphiques */}
          <section className="mb-12">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-300">
              <TrendingUp className="w-5 h-5 text-indigo-400" />
              Graphiques Climatiques Temporels
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-md font-semibold mb-6 text-slate-300">Température</h3>
                <WeatherChart data={history} dataKey="temperature" color="#f87171" name="Température" unit="°C" />
              </div>
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-md font-semibold mb-6 text-slate-300">Humidité</h3>
                <WeatherChart data={history} dataKey="humidity" color="#60a5fa" name="Humidité" unit="%" />
              </div>
              <div className="glass-card rounded-2xl p-6 lg:col-span-2">
                <h3 className="text-md font-semibold mb-6 text-slate-300">Analyse Combinée (Multivariée)</h3>
                <MultiLineChart data={history} />
              </div>
            </div>
          </section>

          {/* Exports boutons */}
          <section className="mb-12 flex flex-wrap gap-4 border-t border-white/5 pt-8">
            <button onClick={handleExportJSON} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-6 py-3 rounded-xl transition-all shadow-md shadow-indigo-900/20 cursor-pointer">
              <FileJson className="w-4 h-4" />
              Télécharger Export JSON
            </button>
            <button onClick={handleExportExcel} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-6 py-3 rounded-xl transition-all shadow-md shadow-emerald-900/20 cursor-pointer">
              <FileSpreadsheet className="w-4 h-4" />
              Télécharger Export Excel (Multi-onglets)
            </button>
          </section>

          {/* Table d'Historique des relevés */}
          <section>
            <h2 className="text-xl font-bold mb-6 text-slate-300">Historique des 100 derniers relevés</h2>
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-slate-900/50 text-slate-400 border-b border-white/5">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Date & Heure</th>
                      <th className="px-6 py-4 font-semibold">Temp.</th>
                      <th className="px-6 py-4 font-semibold">Humidité</th>
                      <th className="px-6 py-4 font-semibold">Pression</th>
                      <th className="px-6 py-4 font-semibold">Pluie</th>
                      <th className="px-6 py-4 font-semibold">Alerte</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {history.map((measure) => (
                      <tr key={measure.id} className="hover:bg-white/[0.01] transition-colors">
                        <td className="px-6 py-4 text-slate-300 font-mono">
                          {new Date(measure.timestamp).toLocaleString('fr-FR')}
                        </td>
                        <td className="px-6 py-4 font-semibold text-white">{measure.temperature.toFixed(1)}°C</td>
                        <td className="px-6 py-4">{measure.humidity.toFixed(0)}%</td>
                        <td className="px-6 py-4">{measure.pressure ? `${measure.pressure.toFixed(0)} hPa` : '-'}</td>
                        <td className="px-6 py-4">{measure.rain === 1 ? 'Pluie (1)' : 'Sec (0)'}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                            measure.alertActive 
                              ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' 
                              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          }`}>
                            {measure.alertActive ? 'ALERTE' : 'NORMAL'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 border-t border-white/5 bg-slate-950/30 text-xs text-slate-500 flex justify-between items-center">
                <span>{history.length} relevés affichés</span>
                <span>Total base : {stats?.totalMeasures || 0}</span>
              </div>
            </div>
          </section>
        </>
      )}

      {/* Informations de limitation si Grand Public */}
      {currentRole === 'public' && (
        <section className="bg-indigo-950/10 border border-white/5 rounded-2xl p-6 flex gap-4 max-w-xl">
          <Info className="w-6 h-6 text-indigo-400 shrink-0" />
          <div className="text-sm">
            <h4 className="font-bold text-white mb-1">Accès aux outils d'analyse et diagnostics</h4>
            <p className="text-slate-400 leading-relaxed">
              Pour des raisons de limitation de bande passante et d'usage réseau (GPRS), l'accès aux graphiques combinés, diagnostics de tension et de réseau GSM, ainsi qu'aux exports Excel nécessite un compte technique ou universitaire. Connectez-vous ou inscrivez-vous en haut à droite.
            </p>
          </div>
        </section>
      )}

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
