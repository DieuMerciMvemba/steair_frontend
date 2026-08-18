"use client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export function WeatherChart({ data, dataKey, color, name, unit }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 font-sans">
        Aucune donnée disponible
      </div>
    )
  }

  const chartData = data.map(item => ({
    time: new Date(item.timestamp).toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
    value: item[dataKey],
    fullTimestamp: item.timestamp
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis 
          dataKey="time" 
          stroke="#475569"
          fontSize={11}
        />
        <YAxis 
          stroke="#475569"
          fontSize={11}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px'
          }}
          itemStyle={{ color: '#f8fafc' }}
          labelStyle={{ color: '#64748b' }}
          formatter={(value) => [`${value}${unit}`, name]}
          labelFormatter={(label) => {
            const dataPoint = chartData.find(d => d.time === label)
            return dataPoint ? new Date(dataPoint.fullTimestamp).toLocaleString('fr-FR') : label
          }}
        />
        <Legend 
          wrapperStyle={{ color: '#94a3b8', fontSize: '12px' }}
        />
        <Line 
          type="monotone" 
          dataKey="value" 
          stroke={color} 
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 5 }}
          name={name}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function MultiLineChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 font-sans">
        Aucune donnée disponible
      </div>
    )
  }

  const chartData = data.map(item => ({
    time: new Date(item.timestamp).toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
    temperature: item.temperature,
    humidity: item.humidity,
    fullTimestamp: item.timestamp
  }))

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis 
          dataKey="time" 
          stroke="#475569"
          fontSize={11}
        />
        <YAxis 
          stroke="#475569"
          fontSize={11}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px'
          }}
          itemStyle={{ color: '#f8fafc' }}
          labelStyle={{ color: '#64748b' }}
          labelFormatter={(label) => {
            const dataPoint = chartData.find(d => d.time === label)
            return dataPoint ? new Date(dataPoint.fullTimestamp).toLocaleString('fr-FR') : label
          }}
        />
        <Legend 
          wrapperStyle={{ color: '#94a3b8', fontSize: '12px' }}
        />
        <Line 
          type="monotone" 
          dataKey="temperature" 
          stroke="#f87171" 
          strokeWidth={2.5}
          dot={false}
          name="Température (°C)"
        />
        <Line 
          type="monotone" 
          dataKey="humidity" 
          stroke="#60a5fa" 
          strokeWidth={2.5}
          dot={false}
          name="Humidité (%)"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
