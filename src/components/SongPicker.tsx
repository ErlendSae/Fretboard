import { useState } from 'react'
import { Check } from 'lucide-react'
import { GENRE_FAMILIES, familyOf, shortKeyLabel, type Song } from '../utils/songs'

const ALL = 'All'

interface SongPickerProps {
  songs: readonly Song[]
  selectedIndex: number
  onSelect: (index: number) => void
}

/**
 * The song chooser: a genre-family tab row over a list of full-width rows.
 *
 * Filtering by family rather than by the per-song genre is deliberate — there
 * are 16 genres across 24 songs, so genre-level tabs would mostly hold one
 * song each. Families hold 3–8, which is a readable list.
 */
export default function SongPicker({ songs, selectedIndex, onSelect }: SongPickerProps) {
  // Open on the selected song's family so the list starts short rather than
  // showing all 24 rows.
  const [family, setFamily] = useState(() => {
    const current = songs[selectedIndex]
    return current ? familyOf(current) : ALL
  })

  // Only offer families that actually contain songs.
  const tabs = [
    ALL,
    ...GENRE_FAMILIES.map(f => f.name).filter(name => songs.some(s => familyOf(s) === name)),
  ]

  const visible = songs
    .map((song, index) => ({ song, index }))
    .filter(({ song }) => family === ALL || familyOf(song) === family)

  return (
    <section className="space-y-3">
      <h2
        id="song-picker-label"
        className="text-[11px] font-semibold text-stone-500 tracking-[0.12em] uppercase"
      >
        Choose a song
      </h2>

      <div role="radiogroup" aria-label="Filter by genre" className="flex flex-wrap gap-1.5">
        {tabs.map(name => {
          const isActive = family === name
          const count = name === ALL
            ? songs.length
            : songs.filter(s => familyOf(s) === name).length
          return (
            <button
              key={name}
              role="radio"
              aria-checked={isActive}
              onClick={() => setFamily(name)}
              className={`px-3 py-1.5 rounded-full border text-[13px] font-medium
                transition-all duration-150 active:scale-95
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terra-500
                focus-visible:ring-offset-1 focus-visible:ring-offset-stone-950
                ${isActive
                  ? 'bg-terra-500 border-terra-400 text-stone-100'
                  : 'bg-stone-800/60 border-stone-200/10 text-stone-400 hover:text-stone-200 hover:border-stone-200/25'
                }`}
            >
              {name}
              <span className={isActive ? 'text-terra-100/80 ml-1.5' : 'text-stone-600 ml-1.5'}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Capped so rows don't stretch to a wide desktop column, which leaves a
          gulf of dead space between the title and the genre tag. */}
      <div
        role="radiogroup"
        aria-labelledby="song-picker-label"
        className="flex flex-col gap-1 max-w-2xl"
      >
        {visible.map(({ song, index }) => {
          const isActive = index === selectedIndex
          return (
            <button
              key={song.title}
              role="radio"
              aria-checked={isActive}
              onClick={() => onSelect(index)}
              // The song's "what to listen for" note lives here rather than
              // taking up a block of the page.
              title={song.note}
              className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl border
                transition-all duration-150 active:scale-[0.99]
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terra-500
                focus-visible:ring-offset-1 focus-visible:ring-offset-stone-950
                ${isActive
                  ? 'bg-terra-500 border-terra-400'
                  : 'bg-stone-800/40 border-stone-200/[0.07] hover:bg-stone-800 hover:border-stone-200/20'
                }`}
            >
              <span className="w-4 shrink-0" aria-hidden="true">
                {isActive && <Check size={16} strokeWidth={1.5} className="text-stone-100" />}
              </span>

              <span className="min-w-0 flex-1">
                <span className={`block text-[15px] font-semibold leading-snug truncate
                  ${isActive ? 'text-stone-100' : 'text-stone-200'}`}
                >
                  {song.title}
                </span>
                <span className={`block text-[12px] leading-snug truncate
                  ${isActive ? 'text-terra-100' : 'text-stone-500'}`}
                >
                  {song.artist} · <span className="font-mono">{shortKeyLabel(song)}</span>
                </span>
              </span>

              <span
                className={`hidden sm:inline-block shrink-0 text-[9px] leading-none uppercase tracking-wide
                  px-1.5 py-1 rounded
                  ${isActive ? 'bg-stone-900/25 text-terra-100' : 'bg-stone-200/[0.06] text-stone-500'}`}
              >
                {song.genre}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
