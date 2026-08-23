import { useState, useEffect, useCallback, useRef } from 'react'
import axios from 'axios'

// Intervalle de base : 10 secondes (backend limite à 500 req/15min depuis .env)
const BASE_INTERVAL_MS = 10_000
const MAX_BACKOFF_MS   = 120_000

export function useWeatherData(stationId) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [consecutiveErrors, setConsecutiveErrors] = useState(0)
  const [rateLimited, setRateLimited] = useState(false)

  // Refs pour éviter les stale closures dans setTimeout
  const mountedRef            = useRef(true)
  const timerRef              = useRef(null)
  const backoffRef            = useRef(BASE_INTERVAL_MS)
  const consecutiveErrorsRef  = useRef(0)

  const scheduleLoop = useCallback((fn, delay) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(fn, delay)
  }, [])

  const fetchData = useCallback(async (reschedule) => {
    if (!mountedRef.current) return

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      if (mountedRef.current) {
        setLoading(false);
      }
      return;
    }

    if (!axios.defaults.headers.common['Authorization']) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    try {
      const buster = Date.now();
      const stParam = stationId ? `&stationId=${stationId}` : '';
      const [realtime, history, stats] = await Promise.all([
        axios.get(`/api/realtime?_cb=${buster}${stParam}`, { timeout: 8000 }),
        axios.get(`/api/history?limit=100&_cb=${buster}${stParam}`, { timeout: 8000 }),
        axios.get(`/api/stats?_cb=${buster}${stParam}`, { timeout: 8000 })
      ])

      if (!mountedRef.current) return

      setData({
        realtime: realtime.data,
        history: history.data.data ?? [],
        stats: stats.data
      })
      setError(null)
      setRateLimited(false)
      consecutiveErrorsRef.current = 0
      setConsecutiveErrors(0)
      backoffRef.current = BASE_INTERVAL_MS

    } catch (err) {
      if (!mountedRef.current) return

      const status = err.response?.status

      if (status === 429) {
        // Backoff exponentiel : double à chaque 429, cap à 120s
        backoffRef.current = Math.min(backoffRef.current * 2, MAX_BACKOFF_MS)
        const waitSec = Math.round(backoffRef.current / 1000)
        setRateLimited(true)
        setError(`Alerte : Limite de requêtes atteinte — nouvelle tentative dans ${waitSec}s`)
        console.warn(`[useWeatherData] 429 — backoff porté à ${backoffRef.current}ms`)
      } else {
        backoffRef.current = BASE_INTERVAL_MS // reset backoff pour erreurs non-429
        consecutiveErrorsRef.current += 1
        setConsecutiveErrors(consecutiveErrorsRef.current)
        setRateLimited(false)

        const n = consecutiveErrorsRef.current
        if (status === 500) {
          setError('Alerte serveur (500) — Vérifiez les logs du backend')
        } else if (status === 503) {
          setError('Alerte : Backend indisponible (503)')
        } else if (!status) {
          // Erreur réseau (backend éteint, CORS, timeout)
          if (n < 3)       setError('Alerte connexion — Backend injoignable')
          else if (n < 8)  setError('Alerte persistante — Relancez le backend avec `npm start`')
          else              setError('Alerte critique — Backend hors ligne depuis plusieurs minutes')
        } else {
          setError(`Alerte inattendue (HTTP ${status})`)
        }

        console.error(`[useWeatherData] HTTP ${status ?? 'ERR_NETWORK'} — tentative #${n}`)
      }
    } finally {
      if (mountedRef.current) setLoading(false)
    }

    // Planifier le prochain appel avec le backoff courant
    if (mountedRef.current && reschedule) {
      scheduleLoop(() => fetchData(true), backoffRef.current)
    }
  }, [scheduleLoop, stationId])

  useEffect(() => {
    mountedRef.current = true
    // Premier appel immédiat, puis boucle auto-planifiée
    fetchData(true)

    return () => {
      mountedRef.current = false
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [fetchData, stationId])

  return { data, loading, error, rateLimited, refetch: () => fetchData(false), consecutiveErrors }
}
