import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import Modal from './Modal'
import { Button } from './ui'
import { useLang } from '../i18n/LanguageContext'

const ConfirmContext = createContext(null)

/**
 * Usage:
 *   const confirm = useConfirm()
 *   if (await confirm({ title, message, confirmText, danger: true })) { ... }
 */
export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null)
  const resolver = useRef(null)

  const confirm = useCallback((options) => {
    setState(options)
    return new Promise((resolve) => {
      resolver.current = resolve
    })
  }, [])

  const close = (result) => {
    resolver.current?.(result)
    resolver.current = null
    setState(null)
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <ConfirmationDialog
        open={!!state}
        title={state?.title}
        message={state?.message}
        confirmText={state?.confirmText}
        cancelText={state?.cancelText}
        danger={state?.danger}
        onConfirm={() => close(true)}
        onCancel={() => close(false)}
      />
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  return useContext(ConfirmContext)
}

export default function ConfirmationDialog({ open, title, message, confirmText, cancelText, danger, onConfirm, onCancel }) {
  const { t } = useLang()
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title || t('confirm.title')}
      size="sm"
      stackFooter
      footer={
        <>
          <Button variant="secondary" size="lg" className="flex-1" onClick={onCancel}>
            {cancelText || t('common.cancel')}
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} size="lg" className="flex-1" onClick={onConfirm} autoFocus>
            {confirmText || t('confirm.yes')}
          </Button>
        </>
      }
    >
      <div className="flex gap-3.5">
        <div className={`grid size-11 shrink-0 place-items-center rounded-full ${danger ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
          <AlertTriangle className="size-5" />
        </div>
        <div className="min-w-0 pt-2 text-[15px] leading-relaxed text-slate-700">{message}</div>
      </div>
    </Modal>
  )
}
