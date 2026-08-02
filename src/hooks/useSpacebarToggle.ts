import { useEffect, useRef } from 'react'

/**
 * Space toggles playback.
 *
 * The listener is registered once and reads the latest `toggle` through a ref,
 * so it never closes over a stale callback. Keys pressed while a form control
 * or button has focus are left alone — space is that control's own activation
 * key, and stealing it would break the tempo and labels toggles.
 */
export function useSpacebarToggle(toggle: () => void): void {
  const toggleRef = useRef(toggle)
  useEffect(() => { toggleRef.current = toggle }, [toggle])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'SELECT' || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON') return
      e.preventDefault()
      toggleRef.current()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])
}
