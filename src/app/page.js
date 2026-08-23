"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import axios from "axios";
import { Cpu, Server, BarChart3, CloudRain, ShieldCheck, Thermometer, Radio, MapPin, Battery, Signal, ArrowRight, Eye } from "lucide-react";

export default function Home() {
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStations() {
      try {
        const res = await axios.get("/api/stations");
        setStations(res.data || []);
        if (res.data && res.data.length > 0) {
          // Par défaut, sélectionner la première station pour le panneau de prévisualisation
          setSelectedStation(res.data[0]);
        }
      } catch (err) {
        console.error("Erreur lors de la récupération des stations", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStations();
  }, []);

  // Projection de coordonnées RDC sur la carte SVG (pourcentage)
  const getCoordinates = (lat, lon) => {
    // RDC : Latitudes de 5.0 (Nord) à -13.5 (Sud), Longitudes de 12.0 (Ouest) à 31.5 (Est)
    const minLon = 12.0;
    const maxLon = 31.5;
    const minLat = -13.5;
    const maxLat = 5.0;

    const x = ((lon - minLon) / (maxLon - minLon)) * 100;
    const y = ((maxLat - lat) / (maxLat - minLat)) * 100;

    return {
      x: Math.min(Math.max(x, 5), 95),
      y: Math.min(Math.max(y, 5), 95)
    };
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "ONLINE":
        return "bg-emerald-500 shadow-emerald-500/50";
      case "DEGRADED":
        return "bg-amber-500 shadow-amber-500/50";
      case "MAINTENANCE":
        return "bg-orange-500 shadow-orange-500/50";
      default:
        return "bg-rose-500 shadow-rose-500/50";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "ONLINE":
        return "Opérationnelle";
      case "DEGRADED":
        return "Dégradée (Alerte)";
      case "MAINTENANCE":
        return "En Maintenance";
      default:
        return "Hors ligne";
    }
  };

  return (
    <div className="flex flex-col w-full px-4 md:px-8 max-w-7xl mx-auto gap-16 py-12">
      {/* Hero Section */}
      <section className="text-center max-w-4xl mx-auto flex flex-col items-center pt-8">
        <div className="mb-6">
          <span className="glass-pill px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase">
            Réseau National KongoClim
          </span>
        </div>

        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-6 leading-tight">
          Supervision du réseau de{" "}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
            stations météorologiques
          </span>
        </h1>

        <p className="text-base md:text-xl text-slate-400 mb-10 max-w-2xl leading-relaxed">
          Plateforme de collecte de données en temps réel, de diagnostic matériel et d'analyse climatique pour les stations météorologiques autonomes à bas coût en RDC.
        </p>

        <div className="flex flex-wrap gap-4 justify-center">
          <Link href="/dashboard" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium px-8 py-3.5 rounded-full transition-all shadow-lg shadow-indigo-900/30 flex items-center gap-2">
            Accéder au Dashboard <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/login" className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 px-8 py-3.5 rounded-full transition-all">
            Espace Technique
          </Link>
        </div>
      </section>

      {/* Network Supervision Map & Sidebar */}
      <section className="w-full">
        <div className="text-center mb-10 flex flex-col items-center">
          <span className="glass-pill px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase mb-3">
            Cartographie temps réel
          </span>
          <h2 className="text-2xl md:text-3xl font-bold text-white">État du Réseau en République Démocratique du Congo</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {/* SVG Map Container */}
          <div className="lg:col-span-2 glass-card rounded-2xl p-6 border border-white/10 min-h-[450px] relative flex flex-col justify-between overflow-hidden">
            <div className="absolute inset-0 bg-slate-950/20 pointer-events-none"></div>
            
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none"></div>

            {/* Stylized Map Header */}
            <div className="flex justify-between items-center relative z-10 border-b border-white/5 pb-3">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                Index Cartographique
              </span>
              <span className="text-[10px] bg-slate-900 px-2 py-1 rounded text-slate-500">
                {stations.length} stations enregistrées
              </span>
            </div>

            {/* High-tech stylized RDC SVG Map */}
            <div className="flex-1 w-full relative flex items-center justify-center my-6 min-h-[300px]">
              {/* RDC Border Outline Shape (Stylized polygon for high-tech aesthetic) */}
              <svg className="w-full h-full max-w-[500px] max-h-[350px] text-slate-850 opacity-20" viewBox="0 0 100 100" fill="currentColor">
                {/* A simplified high-tech polyline representing RDC borders */}
                <polygon points="35,15 48,12 60,18 72,12 85,25 90,45 80,65 65,85 50,92 38,82 25,85 10,75 8,55 18,40 28,30 22,18" />
              </svg>

              {/* Station Markers on Map */}
              {!loading && stations.map((station) => {
                const lat = station.latitude || -4.325;
                const lon = station.longitude || 15.322;
                const coords = getCoordinates(lat, lon);
                const isSelected = selectedStation?.id === station.id;

                return (
                  <button
                    key={station.id}
                    onClick={() => setSelectedStation(station)}
                    style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 group z-20 cursor-pointer focus:outline-none"
                  >
                    {/* Ring Pulse Animation */}
                    <span className={`absolute inline-flex h-6 w-6 rounded-full opacity-75 animate-ping -left-1.5 -top-1.5 ${
                      station.status === 'ONLINE' ? 'bg-emerald-400' :
                      station.status === 'DEGRADED' ? 'bg-amber-400' :
                      station.status === 'MAINTENANCE' ? 'bg-orange-400' : 'bg-rose-400'
                    }`}></span>

                    {/* Core Indicator Dot */}
                    <span className={`relative block h-3.5 w-3.5 rounded-full border-2 border-slate-950 ${getStatusColor(station.status)} ${
                      isSelected ? 'scale-125 border-white' : 'group-hover:scale-110'
                    } transition-transform`}></span>

                    {/* Popover label on Hover */}
                    <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 bg-slate-900 border border-white/10 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                      {station.name} ({station.code})
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Map Legend */}
            <div className="flex gap-4 text-[10px] font-mono justify-center border-t border-white/5 pt-3 relative z-10 text-slate-400">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Opérationnelle</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> Dégradée</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block"></span> En Maintenance</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span> Hors Ligne</span>
            </div>
          </div>

          {/* Station Panel Sidebar */}
          <div className="glass-card rounded-2xl p-6 border border-white/10 flex flex-col justify-between">
            {loading ? (
              <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
                Chargement des stations...
              </div>
            ) : selectedStation ? (
              <div className="flex-grow flex flex-col justify-between h-full gap-6">
                <div>
                  {/* Status Indicator */}
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest font-bold">
                      {selectedStation.code}
                    </span>
                    <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-2.5 py-1 text-[10px] text-white">
                      <span className={`w-2 h-2 rounded-full ${getStatusColor(selectedStation.status)}`}></span>
                      {getStatusLabel(selectedStation.status)}
                    </div>
                  </div>

                  {/* Name and Location */}
                  <h3 className="text-xl font-extrabold text-white mb-1">
                    {selectedStation.name}
                  </h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mb-6">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    {selectedStation.location} (Lat: {selectedStation.latitude?.toFixed(3)}, Lon: {selectedStation.longitude?.toFixed(3)})
                  </p>

                  {/* Diagnostic Details */}
                  <div className="space-y-3.5 border-t border-b border-white/5 py-4 mb-6">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Dernier contact :</span>
                      <span className="text-white font-medium">
                        {selectedStation.lastSeen ? new Date(selectedStation.lastSeen).toLocaleString('fr-FR') : 'Jamais connecté'}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Autonomie :</span>
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <Battery className="w-4 h-4 text-emerald-500" />
                        Solaire
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Type de modem :</span>
                      <span className="text-slate-200">GPRS (SIM800C)</span>
                    </div>
                  </div>
                </div>

                {/* Open Monitor CTA */}
                <div className="flex flex-col gap-3.5">
                  <Link
                    href={`/dashboard?stationId=${selectedStation.id}`}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-xl text-center transition-all text-sm flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Ouvrir le Moniteur
                  </Link>
                  <p className="text-[10px] text-slate-500 text-center">
                    Note : Les graphiques historiques nécessitent un compte Chercheur ou Technicien.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
                Aucune station à afficher.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section className="py-8 bg-slate-950/20 border-t border-white/5 rounded-2xl p-8 max-w-6xl mx-auto">
        <div className="text-center mb-12 flex flex-col items-center">
          <span className="glass-pill px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase mb-3">
            Fonctionnalités
          </span>
          <h2 className="text-2xl md:text-3xl font-bold text-white">Un écosystème robuste et complet</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-card p-8 rounded-2xl relative overflow-hidden group hover:border-indigo-500/30 transition-all duration-300">
            <div className="p-3 bg-indigo-500/10 rounded-xl w-fit mb-6">
              <Cpu className="w-6 h-6 text-indigo-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-3">ESP32 & FreeRTOS</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Firmware embarqué multitâche régulé par FreeRTOS. Assure la capture locale et l'envoi réseau sans bloquer la station météo.
            </p>
          </div>

          <div className="glass-card p-8 rounded-2xl relative overflow-hidden group hover:border-purple-500/30 transition-all duration-300">
            <div className="p-3 bg-purple-500/10 rounded-xl w-fit mb-6">
              <Server className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-3">Backend NestJS</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              API REST d'ingestion sécurisée par clé d'API. Moteur d'alertes automatiques techniques (batterie faible) et environnementales.
            </p>
          </div>

          <div className="glass-card p-8 rounded-2xl relative overflow-hidden group hover:border-pink-500/30 transition-all duration-300">
            <div className="p-3 bg-pink-500/10 rounded-xl w-fit mb-6">
              <BarChart3 className="w-6 h-6 text-pink-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-3">Next.js & Recharts</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Portail SaaS responsive et moderne de supervision cartographique, d'analyse climatique comparative et d'export de données.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
