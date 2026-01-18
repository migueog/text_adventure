'use client'

import { useEffect } from 'react'

export type ToastType = 'info' | 'warning' | 'error'

interface ToastProps {
  message: string
  type: ToastType
  duration: number
  onDismiss: () => void
}

/**
 * Toast notification component for temporary user feedback
 *
 * Auto-dismisses after specified duration and provides accessible
 * announcements via ARIA live regions
 */
export default function Toast({ message, type, duration, onDismiss }: ToastProps) {
  useEffect(() => {
    // Auto-dismiss after duration to prevent notification clutter
    const timer = setTimeout(onDismiss, duration)

    // Clean up timer on unmount to prevent memory leaks
    return () => clearTimeout(timer)
  }, [duration, onDismiss])

  // Use different ARIA roles for different severity levels
  const role = type === 'info' ? 'status' : 'alert'
  const ariaLive = type === 'info' ? 'polite' : 'assertive'

  return (
    <div
      role={role}
      aria-live={ariaLive}
      className={`toast toast-${type}`}
    >
      {message}
    </div>
  )
}
