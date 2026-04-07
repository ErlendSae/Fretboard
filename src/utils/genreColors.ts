/**
 * Maps musical genre names to Tailwind color classes for genre tag chips.
 * Color choices follow musical character: amber = blues/soul, rose = rock,
 * violet = jazz/fusion, emerald = folk/country, sky = classical.
 */
const GENRE_COLORS: Record<string, string> = {
  // Blues & Soul — warm amber
  'Blues':          'bg-amber-950/80 text-amber-300',
  'Soul':           'bg-amber-950/80 text-amber-300',
  // R&B, Funk — orange
  'R&B':            'bg-orange-950/80 text-orange-300',
  'Funk':           'bg-orange-950/80 text-orange-300',
  // Rock — rose (matches app accent)
  'Rock':           'bg-rose-950/80 text-rose-300',
  // Metal — deeper red
  'Metal':          'bg-red-950/80 text-red-300',
  // Jazz, Fusion, Avant-garde — violet
  'Jazz':           'bg-violet-950/80 text-violet-300',
  'Fusion':         'bg-violet-950/80 text-violet-300',
  'Avant-garde':    'bg-violet-950/80 text-violet-300',
  // Country, Folk — emerald
  'Country':        'bg-emerald-950/80 text-emerald-300',
  'Folk':           'bg-emerald-950/80 text-emerald-300',
  // Pop — teal
  'Pop':            'bg-teal-950/80 text-teal-300',
  // Classical, Film scores — sky blue
  'Classical':      'bg-sky-950/80 text-sky-300',
  'Film scores':    'bg-sky-950/80 text-sky-300',
  // Prog — indigo
  'Prog':           'bg-indigo-950/80 text-indigo-300',
  // Latin, Flamenco — warm orange/amber
  'Latin':          'bg-orange-950/80 text-orange-300',
  'Flamenco':       'bg-amber-950/80 text-amber-300',
  // Middle-Eastern — yellow
  'Middle-Eastern': 'bg-yellow-950/80 text-yellow-300',
}

export function genreColorClass(genre: string): string {
  return GENRE_COLORS[genre] ?? 'bg-stone-700 text-stone-300'
}
