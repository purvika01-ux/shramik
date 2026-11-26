import { useEffect, useRef, useState } from 'react'
import { RotateCcw, Eraser, Download, Upload, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Modal from './Modal'
import { Button } from './ui'
import { LanguageSwitch } from './Header'
import { Stepper } from './AttendanceList'
import { useData } from '../context/DataContext'
import { useLang } from '../i18n/LanguageContext'
import { useConfirm } from './ConfirmationDialog'
import { useToast } from './Toast'
import { makeBackup, readBackup } from '../utils/backup'
import { formatDateTime, todayISO } from '../utils/dateUtils'

const LAST_BACKUP_KEY = 'sahil-contractor:last-backup'

export default function SettingsSheet({ open, onClose }) {
  const { data, updateHoursPerDay, restoreData, resetDemoData, clearAllData } = useData()
  const { t } = useLang()
  const { user, logout } = useAuth()
  const confirm = useConfirm()
  const toast = useToast()
  const [hours, setHours] = useState(data.settings.hoursPerDay)
  const fileRef = useRef(null)
  const [lastBackup, setLastBackup] = useState(() => {
    try {
      return localStorage.getItem(LAST_BACKUP_KEY)
    } catch {
      return null
    }
  })

  useEffect(() => {
    if (open) setHours(data.settings.hoursPerDay)
  }, [open, data.settings.hoursPerDay])

  const saveHours = async () => {
    if (!(hours >= 1 && hours <= 24)) return toast.error(t('set.hoursErr'))
    if (!(await updateHoursPerDay(hours))) return
    toast.success(t('set.hoursSaved', { n: hours }))
  }

  // ---------- Backup ----------
  const onDownload = () => {
    const file = `Labour-Register-Backup-${todayISO()}.json`
    try {
      const blob = new Blob([makeBackup(data)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = file
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 2000)
      const stamp = formatDateTime(Date.now())
      try {
        localStorage.setItem(LAST_BACKUP_KEY, stamp)
      } catch {
        /* ignore */
      }
      setLastBackup(stamp)
      toast.success(t('set.downloaded', { file }))
    } catch (err) {
      console.error(err)
      toast.error(t('set.downloadFail'))
    }
  }

  const onPickFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow picking the same file again later
    if (!file) return
    if (file.size > 20 * 1024 * 1024) return toast.error(t('set.badFile'))
    const backup = readBackup(await file.text())
    if (!backup) return toast.error(t('set.badFile'))
    const d = backup.data
    const ok = await confirm({
      title: t('set.restoreTitle'),
      message: t('set.restoreMsg', {
        date: backup.exportedAt ? formatDateTime(Date.parse(backup.exportedAt)) : '—',
        n: d.labourers.length,
        d: Object.keys(d.attendance).length,
        t: d.transactions.length,
      }),
      confirmText: t('set.restoreYes'),
      danger: true,
    })
    if (!ok) return
    if (!(await restoreData(d))) return
    toast.success(t('set.restored'))
    onClose()
  }

  const onReset = async () => {
    if (!(await confirm({ title: t('set.reset'), message: t('set.resetMsg'), confirmText: t('set.resetYes'), danger: true }))) return
    if (!(await resetDemoData())) return
    toast.success(t('set.resetDone'))
    onClose()
  }

  const onClear = async () => {
    if (!(await confirm({ title: t('set.clear'), message: t('set.clearMsg'), confirmText: t('set.clearYes'), danger: true }))) return
    if (!(await clearAllData())) return
    toast.success(t('set.clearDone'))
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={t('set.title')}>
      <div className="space-y-7">
        <section className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4">
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-900">{user.name} {t('auth.roleContractor')}</p>
            <p className="truncate text-xs text-slate-500">{user.email}</p>
          </div>
          <Button variant="dangerOutline" size="sm" icon={LogOut} onClick={logout}>{t('auth.logout')}</Button>
        </section>

        <section>
          <h3 className="mb-2 text-sm font-bold text-slate-700">{t('set.language')}</h3>
          <LanguageSwitch />
        </section>

        <section>
          <h3 className="text-sm font-bold text-slate-700">{t('set.hours')}</h3>
          <p className="mb-3 mt-0.5 text-xs leading-relaxed text-slate-500">{t('set.hoursHint')}</p>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Stepper value={hours} min={1} max={24} label={t('set.hours')} t={t} onChange={setHours} />
            <Button variant="secondary" onClick={saveHours} disabled={hours === data.settings.hoursPerDay}>
              {t('set.saveHours')}
            </Button>
          </div>
        </section>

        <section className="rounded-2xl bg-green-50 p-4">
          <h3 className="text-sm font-bold text-slate-800">{t('set.backup')}</h3>
          <p className="mb-3 mt-0.5 text-xs text-slate-600">{t('set.backupHint')}</p>
          <div className="grid gap-3">
            <Button icon={Download} onClick={onDownload}>{t('set.download')}</Button>
            <Button variant="secondary" icon={Upload} onClick={() => fileRef.current?.click()}>{t('set.restore')}</Button>
            <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={onPickFile} data-testid="restore-input" />
          </div>
          {lastBackup && <p className="mt-2 text-xs text-slate-500">{t('set.lastBackup', { date: lastBackup })}</p>}
        </section>

        <section>
          <h3 className="text-sm font-bold text-slate-700">{t('set.data')}</h3>
          <p className="mb-3 mt-0.5 text-xs text-slate-500">{t('set.dataHint')}</p>
          <div className="grid gap-3">
            <Button variant="secondary" icon={RotateCcw} onClick={onReset}>{t('set.reset')}</Button>
            <Button variant="dangerOutline" icon={Eraser} onClick={onClear}>{t('set.clear')}</Button>
          </div>
        </section>
      </div>
    </Modal>
  )
}
