import { Check } from 'lucide-react'
import { shortKeyLabel, type Song } from '../utils/songs'

interface SongPickerProps {
  songs: readonly Song[]
  selectedIndex: number
  onSelect: (index: number) => void
}

/**
 * The song chooser: every song as a card in one flat grid.
 *
 * Deliberately NOT grouped by genre — there are 16 genres across 24 songs, so
 * headings produced ten sections of a single card each, every one left-aligned
 * against three empty columns. The genre rides on the card instead, and SONGS
 * is ordered so related styles sit together.
 */
export default function SongPicker({ songs, selectedIndex, onSelect }: SongPickerProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between gap-4">
        <h2
          id="song-picker-label"
          className="text-[11px] font-semibold text-stone-500 tracking-[0.12em] uppercase"
        >
          Choose a song
        </h2>
        <span className="text-[11px] text-stone-600">{songs.length} songs</span>
      </div>

      <div
        role="radiogroup"
        aria-labelledby="song-picker-label"
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2"
      >
        {songs.map((song, index) => {
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
              className={`group relative text-left pl-3 pr-7 py-2.5 rounded-xl border
                transition-all duration-150 active:scale-95
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terra-500
                focus-visible:ring-offset-1 focus-visible:ring-offset-stone-950
                ${isActive
                  ? 'bg-terra-500 border-terra-400'
                  : 'bg-stone-800/50 border-stone-200/[0.07] hover:border-stone-200/20 hover:bg-stone-800'
                }`}
            >
              {isActive && (
                <Check
                  size={13}
                  strokeWidth={1.5}
                  aria-hidden="true"
                  className="absolute top-2.5 right-2.5 text-stone-100"
                />
              )}

              <p className={`text-[13px] font-semibold leading-tight truncate
                ${isActive ? 'text-stone-100' : 'text-stone-200'}`}
              >
                {song.title}
              </p>
              <p className={`text-[11px] leading-tight truncate mt-0.5
                ${isActive ? 'text-terra-100' : 'text-stone-500'}`}
              >
                {song.artist}
              </p>
              <p className="flex items-center gap-1.5 mt-1.5 min-w-0">
                <span className={`font-mono text-[10px] leading-none truncate
                  ${isActive ? 'text-terra-100/90' : 'text-stone-500'}`}
                >
                  {shortKeyLabel(song)}
                </span>
                <span
                  className={`text-[9px] leading-none px-1.5 py-0.5 rounded shrink-0 uppercase tracking-wide
                    ${isActive
                      ? 'bg-stone-900/25 text-terra-100'
                      : 'bg-stone-200/[0.06] text-stone-500'
                    }`}
                >
                  {song.genre}
                </span>
              </p>
            </button>
          )
        })}
      </div>
    </section>
  )
}
