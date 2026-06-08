# Executive News Dashboard

Phase-1-Demo für ein persönliches Executive News Dashboard mit begonnener Phase-2-Content-Engine.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Mockdaten
- kostenlose RSS-Feeds für interne Phase-2-Validierung
- Dark Mode only
- PWA Manifest

## Lokal starten

```bash
npm install
npm run dev
```

Danach im Browser öffnen:

```txt
http://localhost:3000
```

## Prüfen

```bash
npm run check
npm run build
```

## Vercel Deployment

Beim Import in Vercel:

- Framework Preset: Next.js
- Root Directory: Repository Root
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: leer lassen

Die App enthält interne Phase-2-APIs für RSS-Quellenprüfung und Kandidatenauswahl, aber weiterhin keine Datenbank, keine KI-Integration und keine paid APIs.
