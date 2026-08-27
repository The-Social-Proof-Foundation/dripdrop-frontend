'use client'

import {
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
  type TouchEvent,
} from 'react'
import { useTheme } from 'next-themes'
import { LogOut } from 'lucide-react'

type HoldSignOutButtonProps = {
  onConfirm: () => void
  holdDuration?: number
  text?: string
  holdText?: string
  icon?: ReactNode
  className?: string
}

export function HoldSignOutButton({
  onConfirm,
  holdDuration = 650,
  text = 'Sign Out',
  holdText = 'Keep holding...',
  icon = <LogOut className="mx-2 h-4 w-4 shrink-0" />,
  className = '',
}: Readonly<HoldSignOutButtonProps>) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const [isHolding, setIsHolding] = useState(false)
  const [progress, setProgress] = useState(0)
  const actionFiredRef = useRef(false)
  const isHoldingRef = useRef(false)
  const startTimeRef = useRef(0)
  const rafRef = useRef(0)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const progressColor = isDark ? 'rgba(248, 113, 113, 0.62)' : 'rgba(220, 38, 38, 0.48)'
  const holdingBgColor = isDark ? 'rgba(248, 113, 113, 0.16)' : 'rgba(220, 38, 38, 0.14)'

  const clearHold = () => {
    cancelAnimationFrame(rafRef.current)
    isHoldingRef.current = false
    setIsHolding(false)
    setProgress(0)
    startTimeRef.current = 0
  }

  const tick = () => {
    const elapsed = performance.now() - startTimeRef.current
    const next = Math.min(100, (elapsed / holdDuration) * 100)
    setProgress(next)
    if (next >= 100) {
      if (!actionFiredRef.current) {
        actionFiredRef.current = true
        clearHold()
        onConfirm()
      }
      return
    }
    rafRef.current = requestAnimationFrame(tick)
  }

  const handleHoldStart = (
    e: MouseEvent<HTMLButtonElement> | TouchEvent<HTMLButtonElement>,
  ) => {
    e.preventDefault()
    e.stopPropagation()
    actionFiredRef.current = false
    isHoldingRef.current = true
    setIsHolding(true)
    setProgress(0)
    startTimeRef.current = performance.now()
    rafRef.current = requestAnimationFrame(tick)
  }

  const handleHoldEnd = (
    e: MouseEvent<HTMLButtonElement> | TouchEvent<HTMLButtonElement>,
  ) => {
    e.stopPropagation()
    if (isHoldingRef.current && !actionFiredRef.current) {
      clearHold()
    }
    buttonRef.current?.blur()
  }

  return (
    <button
      ref={buttonRef}
      type="button"
      className={`relative w-full touch-none overflow-hidden ${className}`}
      style={isHolding ? { backgroundColor: holdingBgColor } : undefined}
      onMouseDown={handleHoldStart}
      onMouseUp={handleHoldEnd}
      onMouseLeave={handleHoldEnd}
      onTouchStart={handleHoldStart}
      onTouchEnd={handleHoldEnd}
      onTouchCancel={handleHoldEnd}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 z-[1]"
        style={{
          width: `${progress}%`,
          backgroundColor: progressColor,
          transition: 'width 75ms linear',
        }}
      />
      <span className="relative z-[2] flex w-full select-none items-center gap-2">
        {icon}
        <span>{isHolding ? holdText : text}</span>
      </span>
    </button>
  )
}
