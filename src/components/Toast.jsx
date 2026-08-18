import { useEffect } from 'react'
import { X, CheckCircle, AlertTriangle } from 'lucide-react'

export function Toast({ message, type = 'error', onClose, duration = 5000 }) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  const bgColor = {
    error: 'bg-red-500/10 border-red-500/20 text-red-200',
    success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200',
    warning: 'bg-amber-500/10 border-amber-500/20 text-amber-200',
    info: 'bg-blue-500/10 border-blue-500/20 text-blue-200'
  }[type]

  const Icon = {
    error: AlertTriangle,
    success: CheckCircle,
    warning: AlertTriangle,
    info: AlertTriangle
  }[type]

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-2xl ${bgColor} transition-all duration-300 animate-slide-in`}>
      <Icon className="w-5 h-5 flex-shrink-0" />
      <span className="text-sm font-medium">{message}</span>
      <button
        onClick={onClose}
        className="ml-2 hover:opacity-75 transition-opacity cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

export function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
          duration={toast.duration}
        />
      ))}
    </div>
  )
}
