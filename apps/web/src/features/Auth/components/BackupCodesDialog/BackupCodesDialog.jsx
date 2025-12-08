import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/ui/dialog'
import { Button } from '@shared/ui/button'
import { Alert, AlertDescription } from '@shared/ui/alert'
import { CheckCircle2, Copy, Download } from 'lucide-react'

export function BackupCodesDialog({ open, onOpenChange, backupCodes }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    const text = backupCodes.join('\n')
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const text = `Chronos 2FA Backup Codes\n\nGenerated: ${new Date().toLocaleString()}\n\n${backupCodes.join('\n')}\n\nIMPORTANT: Each code can only be used once. Store these codes in a safe place.`
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chronos-backup-codes-${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="size-5 text-green-500" />
            2FA Enabled Successfully!
          </DialogTitle>
          <DialogDescription>
            Save these backup codes in a safe place. You can use them to access your
            account if you lose your authenticator device.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert>
            <AlertDescription>
              <strong>Important:</strong> Each backup code can only be used once.
              Store them securely!
            </AlertDescription>
          </Alert>

          <div className="rounded-lg border bg-muted p-4">
            <div className="grid grid-cols-2 gap-2 font-mono text-sm">
              {backupCodes.map((code) => (
                <div
                  key={code}
                  className="rounded bg-background px-3 py-2 text-center"
                >
                  {code}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleCopy}
              disabled={copied}
            >
              {copied ? (
                <>
                  <CheckCircle2 className="size-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="size-4" />
                  Copy Codes
                </>
              )}
            </Button>
            <Button variant="outline" className="flex-1" onClick={handleDownload}>
              <Download className="size-4" />
              Download
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
