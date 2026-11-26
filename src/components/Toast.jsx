import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { CheckCircle2, AlertCircle, X } from 'lucide-react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), [])

  const show = useCallback(
    (message, type = 'success') => {
      const id = ++idRef.current
      setToasts((t) => [...t.slice(-2), { id, message, type }])
      setTimeout(() => dismiss(id), type === 'error' ? 4500 : 3000)
    },
    [dismiss],
  )

  const toast = useRef({}).current
  toast.success = (m) => show(m, 'success')
  toast.error = (m) => show(m, 'error')

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-40 z-[60] flex flex-col items-center gap-2 px-4 md:bottom-auto md:left-auto md:right-6 md:top-6 md:items-end print:hidden">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${
              t.type === 'error' ? 'bg-red-600 text-white' : 'bg-slate-900 text-white'
            }`}
          >
            {t.type === 'error' ? (
              <AlertCircle className="mt-0.5 size-5 shrink-0" />
            ) : (
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-green-400" />
            )}
            <span className="flex-1">{t.message}</span>
            <button onClick={() => dismiss(t.id)} className="opacity-70 hover:opacity-100" aria-label="Dismiss">
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
