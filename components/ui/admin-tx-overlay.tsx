'use client'

import { cn } from '@/lib/utils'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { SuccessCheck } from '@/components/ui/success-check'
import { TextSwap } from '@/components/ui/text-swap'

export type AdminTxPhase = 'processing' | 'success' | null

const statusLabelClass = 'text-sm font-space-grotesk text-[hsl(var(--muted-foreground))]'

type AdminTxOverlayProps = {
  phase: Exclude<AdminTxPhase, null>
  processingText?: string
  successText?: string
  className?: string
  /** Cover the viewport. Dialog callers stay inside their card. */
  fullscreen?: boolean
}

export function AdminTxOverlay({
  phase,
  processingText = 'Processing transaction...',
  successText = 'Transaction complete',
  className,
  fullscreen = false,
}: AdminTxOverlayProps) {
  const label = phase === 'success' ? successText : processingText

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center bg-[color-mix(in_srgb,hsl(var(--background))_72%,transparent)] backdrop-blur-sm',
        fullscreen ? 'fixed inset-0 z-[80]' : 'absolute inset-0 z-30 rounded-lg',
        className,
      )}
      role={fullscreen ? 'status' : undefined}
      aria-live={fullscreen ? 'polite' : undefined}
      aria-label={fullscreen ? label : undefined}
    >
      {phase === 'success' ? (
        <>
          <SuccessCheck size={88} />
          <div className="mt-8 text-center">
            <TextSwap text={successText} className={statusLabelClass} />
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center gap-2 px-6">
          <LoadingSpinner tone="muted" />
          <TextSwap text={processingText} className={statusLabelClass} />
        </div>
      )}
    </div>
  )
}
