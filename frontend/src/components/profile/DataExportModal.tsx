import { useRef, useState } from 'react'
import { exportAllData, importAllData, clearAllForgedData, type ExportBundle } from './profileStorage'

interface DataExportModalProps {
  onClose: () => void
}

/**
 * Export / import / clear all FORGED localStorage data.
 * Useful for backup, device migration, or starting fresh.
 */
export function DataExportModal({ onClose }: DataExportModalProps) {
  const [importStatus, setImportStatus] = useState<string | null>(null)
  const [confirmClear, setConfirmClear] = useState<boolean>(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleExport = (): void => {
    const bundle = exportAllData()
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `forged-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const bundle = JSON.parse(reader.result as string) as ExportBundle
        if (bundle.version !== 1 || !bundle.data) {
          setImportStatus('Invalid backup file')
          return
        }
        const { imported, failed } = importAllData(bundle)
        setImportStatus(`Imported ${imported} keys${failed.length > 0 ? ` (${failed.length} failed)` : ''}. Reload to see changes.`)
      } catch {
        setImportStatus('Could not parse file')
      }
    }
    reader.readAsText(file)
  }

  const handleClear = (): void => {
    if (!confirmClear) {
      setConfirmClear(true)
      return
    }
    clearAllForgedData()
    setImportStatus('All FORGED data cleared. Reload the app.')
    setConfirmClear(false)
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center
        bg-black/50 backdrop-blur-sm px-3 py-4"
      onClick={onClose}
    >
      <div
        className="bg-forged-surface border border-forged-border rounded-t-2xl sm:rounded-2xl
          p-5 w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-black text-forged-text">Data & Privacy</h2>
            <p className="text-[11px] text-forged-text2">Export, import, or clear your local data</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center
              text-forged-text2 hover:text-forged-text transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={handleExport}
            className="w-full text-left bg-forged-bg border border-forged-border rounded-xl p-4
              hover:border-forged-purple/40 active:scale-[0.99] transition-all"
          >
            <p className="text-sm font-black text-forged-text">Export all data</p>
            <p className="text-[11px] text-forged-text2 mt-0.5">
              Download a JSON backup with your goals, daily checklist, body goals, and preferences.
            </p>
          </button>

          <button
            onClick={() => fileRef.current?.click()}
            className="w-full text-left bg-forged-bg border border-forged-border rounded-xl p-4
              hover:border-forged-purple/40 active:scale-[0.99] transition-all"
          >
            <p className="text-sm font-black text-forged-text">Import from backup</p>
            <p className="text-[11px] text-forged-text2 mt-0.5">
              Restore from a previously exported FORGED backup file.
            </p>
          </button>
          <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={handleImportFile} />

          <button
            onClick={handleClear}
            className={`w-full text-left rounded-xl p-4 border transition-all active:scale-[0.99]
              ${confirmClear
                ? 'bg-forged-red/10 border-forged-red'
                : 'bg-forged-bg border-forged-border hover:border-forged-red/40'}`}
          >
            <p className={`text-sm font-black ${confirmClear ? 'text-forged-red' : 'text-forged-text'}`}>
              {confirmClear ? 'Tap again to confirm' : 'Clear all local data'}
            </p>
            <p className="text-[11px] text-forged-text2 mt-0.5">
              {confirmClear
                ? 'This wipes goals, checklist, and profile preferences on this device. Backend data stays.'
                : 'Wipe every FORGED key from localStorage. Backend data is not affected.'}
            </p>
          </button>
          {confirmClear && (
            <button
              onClick={() => setConfirmClear(false)}
              className="text-[10px] text-forged-text2 font-bold py-1"
            >
              Cancel
            </button>
          )}

          {importStatus && (
            <div className="bg-forged-purple/10 border border-forged-purple/30 rounded-xl p-3 mt-2">
              <p className="text-xs text-forged-purple font-bold">{importStatus}</p>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-5 py-3 rounded-xl text-sm font-black
            bg-forged-surface2 text-forged-text2 border border-forged-border
            hover:text-forged-text active:scale-[0.98] transition-all"
        >
          Close
        </button>
      </div>
    </div>
  )
}