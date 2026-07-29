import React, { useState } from 'react'
import { SlidersHorizontal } from 'lucide-react'

interface NeckPageLayoutProps {
  /** h1 content — the page's subject, e.g. "A Minor Pentatonic". */
  title: React.ReactNode
  /** Optional one-liner under the heading. Omit unless the concept needs it. */
  subtitle?: React.ReactNode
  /**
   * Sidebar body. Rendered twice (desktop aside + mobile sheet), so it must
   * contain no `id` attributes — use LabeledField for labelled controls.
   */
  controls: React.ReactNode
  /** Pinned below the controls in both the sidebar and the sheet. */
  footer: React.ReactNode
  /** aria-label for the mobile controls dialog. */
  sheetLabel: string
  /** Main column content, below the heading. */
  children: React.ReactNode
}

/**
 * The shell shared by Explorer and CAGED: a fixed-width desktop sidebar that
 * becomes a bottom sheet below `md`, wrapped around a scrolling main column.
 * Owns only the sheet's open/closed state.
 */
export default function NeckPageLayout({
  title, subtitle, controls, footer, sheetLabel, children,
}: NeckPageLayoutProps) {
  const [sheetOpen, setSheetOpen] = useState(false)

  return (
    <div className="flex h-full">

      {/* ── Sidebar — desktop only ──────────────────────────────────────────── */}
      <aside className="hidden md:flex w-52 shrink-0 border-r border-stone-200/10 bg-stone-900/60 flex-col px-4 py-6">
        <div className="flex-1 overflow-y-auto space-y-6 pr-1">{controls}</div>
        {footer}
      </aside>

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      {/* pb-20 below md keeps the last row clear of the floating Controls
          button, which sits above the bottom tab bar. */}
      <div className="flex-1 min-w-0 overflow-auto px-4 sm:px-6 pt-4 sm:pt-6 pb-20 md:pb-6 space-y-4 sm:space-y-6">
        <div className="animate-fade-up">
          <h1 className="font-display font-semibold text-stone-200 text-[2.375rem] leading-[1.05] tracking-[-0.02em]">
            {title}
          </h1>
          {subtitle && <p className="text-stone-400 text-sm mt-2">{subtitle}</p>}
        </div>
        {children}
      </div>

      {/* ── Mobile: floating Controls button (above the bottom tab bar) ─────── */}
      <button
        onClick={() => setSheetOpen(true)}
        aria-label="Open controls"
        // Floats over the page content, so it needs a shadow and an opaque fill
        // to read as "above" rather than colliding with the cards underneath.
        className="fixed bottom-[4.5rem] left-4 z-40 md:hidden flex items-center gap-1.5
          bg-stone-950/95 backdrop-blur border border-stone-200/20 text-stone-200 text-sm px-3.5 py-2 rounded-full
          shadow-lg shadow-black/60
          active:scale-95 transition-transform duration-100"
      >
        <SlidersHorizontal size={14} strokeWidth={1.5} aria-hidden="true" />
        Controls
      </button>

      {/* ── Mobile: bottom sheet backdrop ───────────────────────────────────── */}
      {sheetOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          aria-hidden="true"
          onClick={() => setSheetOpen(false)}
        />
      )}

      {/* ── Mobile: bottom sheet panel ──────────────────────────────────────── */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={sheetLabel}
        className={`fixed inset-x-0 bottom-0 z-40 md:hidden bg-stone-950 border-t border-stone-200/10
          rounded-t-2xl px-4 pt-4 pb-8 overflow-y-auto max-h-[70vh]
          transition-transform duration-300 ease-out
          ${sheetOpen ? 'translate-y-0' : 'translate-y-full'}`}
      >
        {/* Drag handle */}
        <div className="w-10 h-1 bg-stone-700 rounded-full mx-auto mb-4" aria-hidden="true" />

        {/* Close button — accessible fallback for the backdrop tap */}
        <button
          onClick={() => setSheetOpen(false)}
          aria-label="Close controls"
          className="absolute top-3 right-4 text-stone-500 hover:text-stone-300 active:text-stone-200
            p-1 transition-colors duration-150 min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <span aria-hidden="true" className="text-lg leading-none">×</span>
        </button>

        <div className="space-y-6">
          {controls}
          {footer}
        </div>
      </div>

    </div>
  )
}
