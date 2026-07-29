import { shortKeyLabel, type Song } from '../utils/songs'

interface SongPickerProps {
  songs: readonly Song[]
  selectedIndex: number
  onSelect: (index: number) => void
}

/** Group songs by genre, keeping each one's index into the original array. */
function byGenre(songs: readonly Song[]) {
  const lanes: Array<{ genre: string; entries: Array<{ song: Song; index: number }> }> = []
  songs.forEach((song, index) => {
    const lane = lanes.find(l => l.genre === song.genre)
    if (lane) lane.entries.push({ song, index })
    else lanes.push({ genre: song.genre, entries: [{ song, index }] })
  })
  return lanes
}

/**
 * The song chooser: every song visible at once as a card, grouped by genre.
 * Lives below the neck because choosing what to play over is the main thing
 * you do on this page.
 */
export default function SongPicker({ songs, selectedIndex, onSelect }: SongPickerProps) {
  return (
    <div className="space-y-5">
      <p className="text-[11px] font-semibold text-stone-500 tracking-[0.12em] uppercase">
        Choose a song
      </p>

      {byGenre(songs).map(({ genre, entries }) => (
        <div key={genre} className="space-y-2">
          <h2 className="text-[11px] font-medium text-stone-600 tracking-[0.08em] uppercase">
            {genre}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {entries.map(({ song, index }) => {
              const isActive = index === selectedIndex
              return (
                <button
                  key={song.title}
                  onClick={() => onSelect(index)}
                  aria-current={isActive ? 'true' : undefined}
                  // The song's "what to listen for" note lives here rather than
                  // taking up the page.
                  title={song.note}
                  className={`text-left px-3 py-2.5 rounded-xl border min-h-[68px]
                    flex flex-col gap-0.5
                    transition-all duration-150 active:scale-95
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terra-500
                    focus-visible:ring-offset-1 focus-visible:ring-offset-stone-950
                    ${isActive
                      ? 'bg-terra-500 border-terra-400'
                      : 'bg-stone-800 border-stone-200/10 hover:border-stone-200/25 hover:bg-stone-800/70'
                    }`}
                >
                  <span className={`text-[13px] font-semibold leading-tight
                    ${isActive ? 'text-stone-100' : 'text-stone-200'}`}
                  >
                    {song.title}
                  </span>
                  <span className={`text-[11px] leading-tight
                    ${isActive ? 'text-terra-100' : 'text-stone-500'}`}
                  >
                    {song.artist}
                  </span>
                  <span className={`font-mono text-[10px] leading-tight mt-auto
                    ${isActive ? 'text-terra-100/80' : 'text-stone-600'}`}
                  >
                    {shortKeyLabel(song)}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
