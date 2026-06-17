# Hylden 🎵

Your Spotify music as a cozy **record shelf** of album covers — for browsing and
getting inspired about what to listen to next.

Live: https://bordingcode.github.io/hylden/

## What it does
- Logs into your Spotify (safely, no password shared, no server needed) and fills a
  warm wooden shelf with the covers of every album you've **saved/hearted**.
- Tap a cover → opens the album in Spotify to play it.
- **🎲 Overrask mig** ("surprise me") picks a record for tonight.
- Sort by *recently added*, *artist*, *year*, or **colour** (a rainbow wall).
- **Til genopdagelse** ("rediscover") resurfaces a few random albums each visit.
- Installable as an app (PWA) on phone and desktop.
- **Se en demo først** — preview the shelf with sample covers before connecting.

## Setup (one-time)
See **[docs/SPOTIFY_SETUP.md](docs/SPOTIFY_SETUP.md)**. You create a free Spotify
"developer app," send the Client ID, and it gets pasted into `js/config.js`.

## Tech
Plain HTML/CSS/JS, no build step. Spotify login via OAuth **PKCE** (works on static
hosting like GitHub Pages — no secret, no backend). Cover colours for the rainbow
sort are read client-side from each image.

## Local preview
```
python3 -m http.server 8731
# open http://127.0.0.1:8731
```

## Deploy gotcha
The service worker caches the app shell. After editing `css/` or `js/`, bump the
`?v=` numbers in `index.html` **and** the `CACHE` name in `sw.js`, or browsers serve
stale files.
