/**
 * useFocusTrap — trap keyboard focus inside a container while `active`.
 *
 * Used for the provenance drawer on tablet/mobile (a modal slide-in). When the
 * trap activates it moves focus into the panel; while active, Tab/Shift+Tab cycle
 * within it and Escape calls `onEscape`; on deactivation focus returns to whatever
 * was focused before. No dependencies, no focus-stealing re-runs (the escape
 * callback is held in a ref so a fresh inline closure each render does not retrigger
 * the effect). On desktop the panel is non-modal, so callers pass `active = false`.
 */
import { useEffect, useRef, type RefObject } from 'react'

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

export function useFocusTrap(
  ref: RefObject<HTMLElement | null>,
  active: boolean,
  onEscape?: () => void,
) {
  const escapeRef = useRef(onEscape)
  escapeRef.current = onEscape

  useEffect(() => {
    if (!active) return
    const node = ref.current
    if (!node) return

    const previouslyFocused = document.activeElement as HTMLElement | null
    const focusable = () =>
      Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(el => el.offsetParent !== null)

    // Move focus into the panel (first control, or the panel itself as fallback).
    ;(focusable()[0] ?? node).focus()

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        escapeRef.current?.()
        return
      }
      if (e.key !== 'Tab') return
      const els = focusable()
      if (els.length === 0) {
        e.preventDefault()
        return
      }
      const first = els[0]
      const last = els[els.length - 1]
      const current = document.activeElement as HTMLElement
      if (e.shiftKey && (current === first || !node.contains(current))) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && current === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      previouslyFocused?.focus?.()
    }
  }, [active, ref])
}
