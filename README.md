# Bånd

An interactive web app for learning the guitar fretboard — scale positions, ear training, and chord progressions, with a backing track in any key.

Built for the player who knows their open chords but stalls when the conversation turns to "play the b7 of D". The fretboard itself is the hero of every screen; everything else recedes around it.

## What's inside

Five practice modes:

- **Explorer** — pick a root and a scale; every position lights up across the neck. A backing track in the chosen key plays underneath, so you can hear what each note sounds like in context.
- **Note Quiz** — the app calls out a note; you play it on your guitar; the mic listens and scores you.
- **Scale Quiz** — a position lights up on the fretboard; you name the note.
- **Intervals** — two notes play; you name the interval between them.
- **Progressions** — diatonic chord builder. Pick a key and a feel, get a progression with playable voicings and one-tap playback.

Stats and preferences persist locally. Sign in (optional) to sync across devices.

## Stack

- **React 19** + **TypeScript 5.8** (strict mode)
- **Vite 6** for the dev server and bundle
- **Tailwind 3.4** with a custom warm palette (no off-system colors)
- **React Router 7**
- **Tone.js 15** for the backing track
- **Web Audio API** for the Karplus–Strong plucked-string synth and mic pitch detection
- **Supabase** (optional) for cross-device sync

## Getting started

You'll need Node 20+ and npm.

```sh
git clone <this-repo>
cd Fretboard
npm install
npm run dev
```

The dev server runs on `http://localhost:5173`. The app works offline out of the box — no environment variables required.

### Optional: cross-device sync

To enable Supabase sync (so your preferences and stats follow you across browsers), copy `.env.example` to `.env` and fill in:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Without these, the app silently runs in local-only mode.

## Commands

```sh
npm run dev       # vite dev server
npm run build     # tsc + vite build (must pass clean)
npm run lint      # eslint
npm run preview   # serve the production build locally
```

## Project structure

```
Fretboard/
├── src/
│   ├── App.tsx                  # router + sidebar nav (desktop) + bottom tabs (mobile)
│   ├── main.tsx
│   ├── components/              # Fretboard, NoteMarker, RootPicker
│   ├── pages/                   # Landing, Explorer, Quiz, Progressions, Stats, Auth
│   ├── hooks/                   # useBackingTrack and friends
│   ├── lib/                     # store, supabase client, types
│   └── utils/                   # notes, scales, chords, audio, pitchDetection
├── design/                      # canonical design system — tokens, type, UI kit
├── docs/                        # engineering reference (storage, browsers, launch QA)
├── public/                      # static assets, OG image, favicon
└── supabase/                    # schema for the optional sync layer
```

## Design system

The visual language lives in [`design/`](./design/README.md) — warm walnut surfaces, parchment ink, terracotta primary, honey-gold secondary. Tokens in [`design/colors_and_type.css`](./design/colors_and_type.css) are the single source of truth; the same values are mirrored into Tailwind via `tailwind.config.js`.

The fretboard's amber wood gradient is sacred and never used in chrome. The rest of the UI stays warm and recedes. Anti-reference: tabs websites — no yellow-on-black density, no clinical greys.

## Browser support

Chrome, Firefox, and Safari (desktop + iOS) are all supported. The mic-based features need HTTPS or localhost. Full matrix in [`docs/BROWSER_SUPPORT.md`](./docs/BROWSER_SUPPORT.md).

## Storage

Every read goes to localStorage first; sync to Supabase happens in the background when you're authenticated. Schema and migration notes live in [`docs/STORAGE.md`](./docs/STORAGE.md).

## License

Personal project. No license granted yet — please don't redistribute the source until one is added.
