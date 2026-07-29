interface LegendDotProps { color: string; label: string }

export function LegendDot({ color, label }: LegendDotProps) {
  return (
    <div className="flex items-center gap-2 text-sm text-stone-400">
      <div className={`w-4 h-4 rounded-full shrink-0 ${color}`} />
      <span>{label}</span>
    </div>
  )
}
