import Link from "next/link";
import { Cpu, Server, BarChart3, CloudRain, ShieldCheck, Thermometer } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="py-24 md:py-36 px-6 text-center max-w-4xl mx-auto flex flex-col items-center">
        {/* Pill Badge */}
        <div className="mb-6">
          <span className="glass-pill px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase">
            Édition Professionnelle
          </span>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-6 leading-tight">
          Surveillance climatique basée sur le{" "}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
            Multitâche IoT
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base md:text-xl text-slate-400 mb-10 max-w-2xl leading-relaxed">
          Une technologie qui s'efface au profit de l'expérience : la Station Météo intègre des capteurs de précision avec une architecture FreeRTOS et un stockage multi-base de données.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap gap-4 justify-center">
          <Link href="/dashboard" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium px-8 py-3.5 rounded-full transition-all shadow-lg shadow-indigo-900/30">
            Lancer le Dashboard
          </Link>
          <Link href="/history" className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 px-8 py-3.5 rounded-full transition-all">
            Consulter l'Historique
          </Link>
        </div>
      </section>

      {/* Feature Section */}
      <section className="py-24 bg-slate-950/40 border-t border-slate-900 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 flex flex-col items-center">
            <span className="glass-pill px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase mb-4">
              Architecture
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Un écosystème robuste et moderne</h2>
            <p className="text-slate-400 max-w-xl">
              Découvrez la synergie entre notre firmware embarqué de haute performance et notre suite d'applications cloud.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="glass-card p-8 rounded-2xl relative overflow-hidden group hover:border-indigo-500/30 transition-all duration-300">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-indigo-500/10 transition-colors"></div>
              <div className="p-3 bg-indigo-500/10 rounded-xl w-fit mb-6">
                <Cpu className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">ESP32 & FreeRTOS</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Le micrologiciel embarqué sépare la capture de données (Core 0) et le serveur web (Core 1) grâce au parallélisme FreeRTOS. Pas de blocage, même en charge.
              </p>
            </div>

            {/* Card 2 */}
            <div className="glass-card p-8 rounded-2xl relative overflow-hidden group hover:border-purple-500/30 transition-all duration-300">
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-purple-500/10 transition-colors"></div>
              <div className="p-3 bg-purple-500/10 rounded-xl w-fit mb-6">
                <Server className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Backend Sécurisé</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Node.js/Express collecte les relevés à intervalles réguliers et les sauvegarde de manière sécurisée avec support natif SQLite (développement) et PostgreSQL.
              </p>
            </div>

            {/* Card 3 */}
            <div className="glass-card p-8 rounded-2xl relative overflow-hidden group hover:border-pink-500/30 transition-all duration-300">
              <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-pink-500/10 transition-colors"></div>
              <div className="p-3 bg-pink-500/10 rounded-xl w-fit mb-6">
                <BarChart3 className="w-6 h-6 text-pink-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Next.js & Recharts</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Une interface SaaS de dernière génération pour visualiser les graphiques climatiques en temps réel, calculer l'indice de confort local, et exporter des données.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sensor Section */}
      <section className="py-24 px-6 max-w-5xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="glass-pill px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase mb-4 inline-block">
              Capteurs Physiques
            </span>
            <h2 className="text-3xl font-bold text-white mb-6">Précision chirurgicale sur vos relevés locaux</h2>
            <p className="text-slate-400 mb-6 leading-relaxed">
              La station connectée intègre des puces électroniques reconnues pour leur exactitude et leur rapidité d'intégration en milieu tropical :
            </p>
            <ul className="space-y-4">
              <li className="flex items-center gap-3">
                <div className="p-1.5 bg-indigo-500/15 rounded-lg text-indigo-400">
                  <Thermometer className="w-4 h-4" />
                </div>
                <span className="text-slate-300 text-sm">BMP280 : Température et Pression barométrique ultra-précise</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="p-1.5 bg-indigo-500/15 rounded-lg text-indigo-400">
                  <CloudRain className="w-4 h-4" />
                </div>
                <span className="text-slate-300 text-sm">DHT11 : Mesure rapide de l'humidité relative de l'air</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="p-1.5 bg-indigo-500/15 rounded-lg text-indigo-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className="text-slate-300 text-sm">Capteur Pluie (DO) : Détection binaire instantanée des averses</span>
              </li>
            </ul>
          </div>
          <div className="relative flex justify-center items-center">
            {/* Glow Background behind image/shape */}
            <div className="absolute w-72 h-72 bg-indigo-500/20 rounded-full blur-[80px] pointer-events-none"></div>
            <div className="glass-card p-8 rounded-2xl border border-white/10 w-full max-w-sm flex flex-col gap-6 relative z-10">
              <div className="text-slate-400 text-xs font-mono uppercase tracking-wider flex justify-between border-b border-white/5 pb-3">
                <span>Console Station</span>
                <span className="text-indigo-400">En Ligne</span>
              </div>
              <div className="flex flex-col gap-2 font-mono text-sm text-slate-300">
                <div className="flex justify-between">
                  <span>Température:</span>
                  <span className="text-white">28.4 °C</span>
                </div>
                <div className="flex justify-between">
                  <span>Humidité:</span>
                  <span className="text-white">62 %</span>
                </div>
                <div className="flex justify-between">
                  <span>Pression:</span>
                  <span className="text-white">1011.8 hPa</span>
                </div>
                <div className="flex justify-between">
                  <span>Pluie:</span>
                  <span className="text-emerald-400">Temps sec (0)</span>
                </div>
              </div>
              <Link href="/dashboard" className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2.5 rounded-lg text-center transition-all">
                Ouvrir le Moniteur
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
