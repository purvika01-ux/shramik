import { useEffect } from 'react'
import { X } from 'lucide-react'

/**
 * Bottom sheet on phones, centred dialog on larger screens.
 * stackFooter: footer buttons one under the other on phones (for long labels like "Yes, clear everything").
 */
export default function Modal({ open, onClose, title, children, footer, size = 'md', stackFooter = false }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null
  const width = size === 'sm' ? 'sm:max-w-md' : 'sm:max-w-lg'

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4 print:hidden" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} />
      <div className={`relative flex max-h-[92vh] w-full flex-col rounded-t-3xl bg-white shadow-xl sm:rounded-2xl ${width}`}>
        {/* drag-handle look on phones */}
        <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-slate-200 sm:hidden" />
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 py-3 pl-5 pr-3">
          <h2 className="min-w-0 text-lg font-bold leading-snug text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="grid size-11 shrink-0 place-items-center rounded-xl text-slate-500 hover:bg-slate-100"
            aria-label="Close / बंद"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className={`overflow-y-auto px-5 pt-5 ${footer ? 'pb-5' : 'pb-[max(2rem,env(safe-area-inset-bottom))]'}`}>{children}</div>
        {footer && (
          <div className={`border-t border-slate-100 px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] ${stackFooter ? 'flex flex-col-reverse gap-2.5 sm:flex-row sm:gap-3' : 'flex gap-3'}`}>
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
