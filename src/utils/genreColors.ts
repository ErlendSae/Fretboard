const GENRE_COLORS: Record<string, string> = {
  // Blues & Soul — warm sun gold
  'Blues':          'bg-sun-900/80 text-sun-400',
  'Soul':           'bg-sun-900/80 text-sun-400',
  // R&B, Funk — terra orange
  'R&B':            'bg-terra-900/80 text-terra-300',
  'Funk':           'bg-terra-900/80 text-terra-300',
  // Rock — terra (app primary)
  'Rock':           'bg-terra-950/80 text-terra-300',
  // Metal — brick (deepest red)
  'Metal':          'bg-brick-950/80 text-brick-300',
  // Jazz, Fusion, Avant-garde — plum
  'Jazz':           'bg-plum-950/80 text-plum-300',
  'Fusion':         'bg-plum-950/80 text-plum-300',
  'Avant-garde':    'bg-plum-950/80 text-plum-300',
  // Country, Folk — sage
  'Country':        'bg-sage-950/80 text-sage-300',
  'Folk':           'bg-sage-950/80 text-sage-300',
  // Pop — neutral stone
  'Pop':            'bg-stone-700/80 text-stone-300',
  // Classical, Film scores — stone (no blues in the palette)
  'Classical':      'bg-stone-700/80 text-stone-300',
  'Film scores':    'bg-stone-700/80 text-stone-300',
  // Prog — plum (warm purple)
  'Prog':           'bg-plum-900/80 text-plum-300',
  // Latin, Flamenco — terra warm
  'Latin':          'bg-terra-900/80 text-terra-300',
  'Flamenco':       'bg-terra-900/80 text-terra-300',
  // Middle-Eastern — sun gold
  'Middle-Eastern': 'bg-sun-900/80 text-sun-400',
}

export function genreColorClass(genre: string): string {
  return GENRE_COLORS[genre] ?? 'bg-stone-700 text-stone-300'
}
