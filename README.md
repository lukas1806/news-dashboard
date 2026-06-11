# Executive News Dashboard

Phase-1-Demo für ein persönliches Executive News Dashboard mit Phase-2-Content-Engine und separater Phase-3-Briefing-Preview.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Mockdaten
- kostenlose RSS-Feeds für interne Phase-2-Validierung
- OpenAI Responses API für einen täglichen Phase-3-Briefing-Lauf
- private Vercel-Blob-Datei für den letzten erfolgreichen Snapshot
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

Interne Phase-2-Oberflächen:

- `/raw` für Quellen- und Kandidatenreview
- `/preview` für eine kompakte Vorschau mit maximal 5 Kandidaten pro Kategorie und gekennzeichnetem Mock-Fallback
- `/briefing-preview` für täglich erzeugte KI-Briefings mit Quellen und Unsicherheitskennzeichnung

## Phase-3-Konfiguration

Benötigte Vercel-Umgebungsvariablen:

```txt
OPENAI_API_KEY
OPENAI_BRIEFING_MODEL=gpt-5-mini
BRIEFING_AI_PROVIDER=openai
CRON_SECRET
BLOB_READ_WRITE_TOKEN
BRIEFING_STORAGE_DRIVER=blob
```

`vercel.json` plant den geschützten Lauf täglich um `03:00 UTC`. Für lokale Tests können `BRIEFING_AI_PROVIDER=mock` und `BRIEFING_STORAGE_DRIVER=file` verwendet werden, ohne API-Kosten zu erzeugen.

Die OpenAI-Projektbudget-Einstellung ist nur eine Warnschwelle. Der Code verhindert deshalb zusätzliche Modellaufrufe am selben UTC-Tag und gibt bei Cron-Wiederholungen den vorhandenen Snapshot zurück.
