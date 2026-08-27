'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DripdropApiError, fetchInvitePreview } from '@/lib/dripdrop-api'

interface InviteCodePanelProps {
  onSubmit: (code: string) => Promise<void>
  error?: string | null
  className?: string
}

export function InviteCodePanel({ onSubmit, error, className = '' }: InviteCodePanelProps) {
  const [inviteInput, setInviteInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const code = inviteInput.trim().toUpperCase()
    if (!code) return

    setIsSubmitting(true)
    setLocalError(null)

    try {
      const preview = await fetchInvitePreview(code)
      if (preview.expired || preview.status !== 'pending') {
        setLocalError('This invite code is no longer valid.')
        return
      }

      await onSubmit(code)
      setInviteInput('')
    } catch (err) {
      if (err instanceof DripdropApiError) {
        setLocalError(err.message)
      } else {
        setLocalError('Invalid invite code')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const displayError = localError || error

  return (
    <div
      className={`w-full rounded-xl border border-border bg-card px-4 py-3 text-center ${className}`}
    >
      <p className="text-sm font-medium text-foreground">Have an invite code?</p>
      <p className="mt-1 text-xs text-muted-foreground">Enter a code to skip the waitlist</p>

      <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-2">
        <div className="flex gap-2">
          <Input
            placeholder="Invite code"
            value={inviteInput}
            onChange={(e) => {
              setInviteInput(e.target.value.toUpperCase())
              setLocalError(null)
            }}
            className="h-9 bg-background/80 text-xs uppercase"
            disabled={isSubmitting}
          />
          <Button
            type="submit"
            disabled={isSubmitting || !inviteInput.trim()}
            className="h-9 shrink-0 rounded-full px-4 text-xs font-semibold"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
          </Button>
        </div>
        {displayError && <p className="text-left text-xs text-red-500">{displayError}</p>}
      </form>
    </div>
  )
}
