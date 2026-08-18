"use client";
import { useState, useEffect } from 'react'
import { Thermometer, Droplets, Gauge, CloudRain, Activity, ArrowLeft } from 'lucide-react'
import axios from 'axios'
import Link from 'next/link'

export default function Interpretation() {
  const [realtimeData, setRealtimeData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRealtime = async () => {
      try {
        const response = await axios.get('/api/realtime')
        setRealtimeData(response.data)
        setLoading(false)
      } catch (err) {
        console.error('Erreur:', err)
        setLoading(false)
      }
    }

    fetchRealtime()
    const interval = setInterval(fetchRealtime, 3000)
    return () => clearInterval(interval)
  }, [])

  const getTemperatureLevel = (temp) => {
    if (temp < 18) return { level: 'Très fraîche', color: 'text-cyan-400', bg: 'bg-cyan-500/5', border: 'border-cyan-500/10' }
    if (temp < 22) return { level: 'Fraîche', color: 'text-blue-400', bg: 'bg-blue-500/5', border: 'border-blue-500/10' }
    if (temp < 28) return { level: 'Agréable', color: 'text-emerald-400', bg: 'bg-emerald-500/5', border: 'border-emerald-500/10' }
    if (temp < 32) return { level: 'Chaude', color: 'text-amber-400', bg: 'bg-amber-500/5', border: 'border-amber-500/10' }
    if (temp < 36) return { level: 'Très chaude', color: 'text-orange-400', bg: 'bg-orange-500/5', border: 'border-orange-500/10' }
    return { level: 'Chaleur extrême', color: 'text-red-400', bg: 'bg-red-500/5', border: 'border-red-500/10' }
  }

  const getHumidityLevel = (humidity) => {
    if (humidity < 30) return { level: 'Très sèche', color: 'text-yellow-400', bg: 'bg-yellow-500/5', border: 'border-yellow-500/10' }
    if (humidity < 50) return { level: 'Sèche', color: 'text-amber-400', bg: 'bg-amber-500/5', border: 'border-amber-500/10' }
    if (humidity < 70) return { level: 'Confortable', color: 'text-emerald-400', bg: 'bg-emerald-500/5', border: 'border-emerald-500/10' }
    if (humidity < 85) return { level: 'Humide', color: 'text-blue-400', bg: 'bg-blue-500/5', border: 'border-blue-500/10' }
    if (humidity < 95) return { level: 'Très humide', color: 'text-indigo-400', bg: 'bg-indigo-500/5', border: 'border-indigo-500/10' }
    return { level: 'Saturée', color: 'text-purple-400', bg: 'bg-purple-500/5', border: 'border-purple-500/10' }
  }

  const getPressureLevel = (pressure) => {
    if (pressure > 1025) return { level: 'Très haute pression', color: 'text-emerald-400', bg: 'bg-emerald-500/5', border: 'border-emerald-500/10', desc: 'Temps généralement stable' }
    if (pressure > 1015) return { level: 'Haute pression', color: 'text-teal-400', bg: 'bg-teal-500/5', border: 'border-teal-500/10', desc: 'Temps stable probable' }
    if (pressure > 1005) return { level: 'Normale', color: 'text-slate-400', bg: 'bg-slate-500/5', border: 'border-slate-500/10', desc: 'Conditions standard' }
    if (pressure > 995) return { level: 'Basse pression', color: 'text-orange-400', bg: 'bg-orange-500/5', border: 'border-orange-500/10', desc: 'Temps perturbé possible' }
    return { level: 'Très basse pression', color: 'text-red-400', bg: 'bg-red-500/5', border: 'border-red-500/10', desc: 'Temps perturbé probable' }
  }

  const getRainState = (val) => {
    if (val === 1) return { level: 'Averses détectées', color: 'text-rose-400', bg: 'bg-rose-500/5', border: 'border-rose-500/10' }
    return { level: 'Temps sec', color: 'text-emerald-400', bg: 'bg-emerald-500/5', border: 'border-emerald-500/10' }
  }

  const getWeatherCondition = (data) => {
    const { temperature, humidity, pressure_hpa, rain_analog } = data
    
    if (humidity > 95 && temperature < 25 && rain_analog === 0) {
      return { condition: 'Brouillard', icon: '🌫', color: 'text-slate-400', bg: 'bg-slate-500/5', border: 'border-slate-500/10', message: 'Visibilité potentiellement réduite' }
    }
    if (humidity > 85 && pressure_hpa < 1000 && temperature > 28) {
      return { condition: 'Risque d\'orage', icon: '⛈', color: 'text-yellow-400', bg: 'bg-yellow-500/5', border: 'border-yellow-500/10', message: 'Conditions favorables aux orages' }
    }
    if (rain_analog === 1) {
      return { condition: 'Pluie', icon: '🌧', color: 'text-blue-400', bg: 'bg-blue-500/5', border: 'border-blue-500/10', message: 'Précipitations en cours' }
    }
    if (rain_analog === 0 && humidity > 80) {
      return { condition: 'Nuageux', icon: '☁', color: 'text-slate-400', bg: 'bg-slate-500/5', border: 'border-slate-500/10', message: 'Ciel majoritairement couvert' }
    }
    if (rain_analog === 0 && humidity >= 60 && humidity <= 80) {
      return { condition: 'Partiellement nuageux', icon: '🌤', color: 'text-amber-400', bg: 'bg-amber-500/5', border: 'border-amber-500/10', message: 'Alternance de soleil et de nuages' }
    }
    if (rain_analog === 0 && humidity < 70 && pressure_hpa >= 1005 && temperature > 28) {
      return { condition: 'Ensoleillé', icon: '☀', color: 'text-yellow-400', bg: 'bg-yellow-500/5', border: 'border-yellow-500/10', message: 'Ciel dégagé et fort ensoleillement' }
    }
    return { condition: 'Conditions mixtes', icon: '🌥', color: 'text-slate-400', bg: 'bg-slate-500/5', border: 'border-slate-500/10', message: 'Conditions météo variables' }
  }

  const getComfortIndex = (temperature, humidity) => {
    if (temperature >= 22 && temperature <= 28 && humidity >= 40 && humidity <= 70) {
      return { level: 'Excellent', color: 'text-emerald-400', bg: 'bg-emerald-500/5', border: 'border-emerald-500/10' }
    }
    if (temperature >= 20 && temperature <= 32 && humidity >= 30 && humidity <= 80) {
      return { level: 'Bon', color: 'text-teal-400', bg: 'bg-teal-500/5', border: 'border-teal-500/10' }
    }
    if (temperature >= 18 && temperature <= 35 && humidity >= 20 && humidity <= 90) {
      return { level: 'Moyen', color: 'text-amber-400', bg: 'bg-amber-500/5', border: 'border-amber-500/10' }
    }
    if (temperature > 35 || humidity > 90) {
      return { level: 'Mauvais', color: 'text-orange-400', bg: 'bg-orange-500/5', border: 'border-orange-500/10' }
    }
    return { level: 'Critique', color: 'text-red-400', bg: 'bg-red-500/5', border: 'border-red-500/10' }
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Activity className="w-12 h-12 text-indigo-500 animate-spin" />
          <div className="text-slate-400 text-sm font-semibold tracking-widest uppercase">Analyse des indices...</div>
        </div>
      </div>
    )
  }

  if (!realtimeData) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-slate-400 font-medium">
        Aucune donnée disponible pour l'interprétation.
      </div>
    )
  }

  const tempLevel = getTemperatureLevel(realtimeData.temperature)
  const humidityLevel = getHumidityLevel(realtimeData.humidity)
  const pressureLevel = getPressureLevel(realtimeData.pressure_hpa)
  const rainState = getRainState(realtimeData.rain_analog)
  const weatherCondition = getWeatherCondition(realtimeData)
  const comfortIndex = getComfortIndex(realtimeData.temperature, realtimeData.humidity)

  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-12">
      
      {/* Title Header */}
      <section className="mb-16">
        <span className="glass-pill px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase mb-4 inline-block">
          Moteur Clinique & Météo
        </span>
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-4">Interprétation Climatique</h1>
        <p className="text-slate-400 max-w-2xl">
          Analyse croisée des indices de température, humidité et pression barométrique calibrée pour Kinshasa.
        </p>
      </section>

      {/* Main Condition Header */}
      <section className="mb-12">
        <div className={`glass-card rounded-3xl p-8 border-2 ${weatherCondition.border} ${weatherCondition.bg} flex flex-col md:flex-row md:items-center justify-between gap-6`}>
          <div className="flex items-center gap-6">
            <span className="text-6xl">{weatherCondition.icon}</span>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">{weatherCondition.condition}</h2>
              <p className={`text-base font-semibold ${weatherCondition.color}`}>{weatherCondition.message}</p>
            </div>
          </div>
          <div className="flex flex-col items-start md:items-end gap-1">
            <span className="text-xs text-slate-500 uppercase tracking-widest font-mono">Dernière mesure</span>
            <span className="text-sm text-slate-300 font-mono">{new Date(realtimeData.timestamp).toLocaleTimeString()}</span>
          </div>
        </div>
      </section>

      {/* Comfort Index */}
      <section className="mb-16">
        <h2 className="text-lg font-bold mb-6 text-slate-300">Indice de Confort</h2>
        <div className={`glass-card rounded-2xl p-6 border-2 ${comfortIndex.border} ${comfortIndex.bg} flex justify-between items-center`}>
          <span className="text-slate-400 text-sm font-medium">Climat Global Rssenti</span>
          <span className={`text-xl font-bold ${comfortIndex.color}`}>{comfortIndex.level}</span>
        </div>
      </section>

      {/* Diagnostic Cards */}
      <section className="mb-16">
        <h2 className="text-lg font-bold mb-6 text-slate-300">Indicateurs Détaillés</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Temperature card */}
          <div className={`glass-card rounded-2xl p-6 border-2 ${tempLevel.border} ${tempLevel.bg}`}>
            <div className="flex items-center justify-between mb-6">
              <span className="text-slate-400 text-sm font-medium">Température</span>
              <div className="p-2 bg-rose-500/10 rounded-xl">
                <Thermometer className="w-5 h-5 text-rose-400" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-2">{realtimeData.temperature.toFixed(1)}°C</div>
            <div className={`text-sm font-semibold ${tempLevel.color}`}>{tempLevel.level}</div>
          </div>

          {/* Humidity card */}
          <div className={`glass-card rounded-2xl p-6 border-2 ${humidityLevel.border} ${humidityLevel.bg}`}>
            <div className="flex items-center justify-between mb-6">
              <span className="text-slate-400 text-sm font-medium">Humidité</span>
              <div className="p-2 bg-blue-500/10 rounded-xl">
                <Droplets className="w-5 h-5 text-blue-400" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-2">{realtimeData.humidity.toFixed(0)}%</div>
            <div className={`text-sm font-semibold ${humidityLevel.color}`}>{humidityLevel.level}</div>
          </div>

          {/* Pressure card */}
          <div className={`glass-card rounded-2xl p-6 border-2 ${pressureLevel.border} ${pressureLevel.bg}`}>
            <div className="flex items-center justify-between mb-6">
              <span className="text-slate-400 text-sm font-medium">Pression barométrique</span>
              <div className="p-2 bg-amber-500/10 rounded-xl">
                <Gauge className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-2">
              {realtimeData.pressure_hpa ? `${realtimeData.pressure_hpa.toFixed(0)} hPa` : '--'}
            </div>
            <div className={`text-sm font-semibold ${pressureLevel.color} mb-1`}>{pressureLevel.level}</div>
            <p className="text-xs text-slate-500">{pressureLevel.desc}</p>
          </div>

          {/* Rain card */}
          <div className={`glass-card rounded-2xl p-6 border-2 ${rainState.border} ${rainState.bg}`}>
            <div className="flex items-center justify-between mb-6">
              <span className="text-slate-400 text-sm font-medium">État Pluie</span>
              <div className="p-2 bg-indigo-500/10 rounded-xl">
                <CloudRain className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-2">
              {realtimeData.rain_analog === 1 ? 'Actives (1)' : 'Inactives (0)'}
            </div>
            <div className={`text-sm font-semibold ${rainState.color}`}>{rainState.level}</div>
          </div>

        </div>
      </section>
    </div>
  )
}
