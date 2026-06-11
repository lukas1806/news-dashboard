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

Die App enthält interne Phase-2-APIs für RSS-Quellenprüfung und Kandidatenauswahl. Die Phase-3-Preview verwendet zusätzlich einen einzelnen täglichen OpenAI-Aufruf und einen privaten Vercel-Blob-Snapshot. Eine Datenbank wird weiterhin nicht verwendet.

Interne Phase-2-Oberflächen:

- `/raw` für Quellen- und Kandidatenreview
- `/preview` für eine kompakte Vorschau mit maximal 5 Kandidaten pro Kategorie und gekennzeichnetem Mock-Fallback
- `/briefing-preview` für täglich erzeugte KI-Briefings mit Quellen und Unsicherheitskennzeichnung

## Phase-3-Konfiguration

### Eingerichteter Produktionsstand

OpenAI:

- separates OpenAI-Projekt `news-dashboard`
- API-Guthaben im Prototype-Tarif
- Projektbudget auf USD 5 pro Monat mit Warnungen bei 50 % und 100 %
- erlaubtes Modell auf `gpt-5-mini` beschränkt
- eigener Project API Key; der Schlüssel wird ausschließlich als sensitive Vercel-Variable gespeichert

Vercel:

- privater Blob Store `news-dashboard-briefings-blob`
- Region Frankfurt (`fra1`)
- Blob Store mit dem Vercel-Projekt `news-dashboard` verbunden
- Zugriff über Vercels System-Umgebungsvariablen und `BLOB_STORE_ID`
- System Environment Variables sind für das Projekt aktiviert
- täglicher geschützter Cronjob aus `vercel.json`

Manuell angelegte Vercel-Umgebungsvariablen für Production und Preview:

```txt
OPENAI_API_KEY
OPENAI_BRIEFING_MODEL=gpt-5-mini
BRIEFING_AI_PROVIDER=openai
CRON_SECRET
BRIEFING_STORAGE_DRIVER=blob
```

Automatisch durch die Blob-Verknüpfung bereitgestellte Variablen:

```txt
BLOB_STORE_ID
BLOB_WEBHOOK_PUBLIC_KEY
```

Bei älteren oder manuell tokenbasierten Blob-Setups kann stattdessen `BLOB_READ_WRITE_TOKEN` vorhanden sein. Für das aktuell verbundene Vercel-Projekt ist kein manuell kopierter Blob-Token erforderlich.

`OPENAI_API_KEY` und `CRON_SECRET` bleiben immer als `Sensitive` markiert. Ihre Werte dürfen weder in Git noch in Screenshots, Logs, Dokumentation oder Chatnachrichten erscheinen. `CRON_SECRET` ist ein zufälliger 32-Byte-Wert und schützt den Generierungs-Endpunkt vor fremden oder versehentlichen Aufrufen.

### Täglicher Lauf

`vercel.json` plant `/api/cron/daily-briefing` täglich um `03:00 UTC`. Das entspricht in Deutschland ungefähr 04:00 Uhr im Winter und 05:00 Uhr im Sommer. Vercel sendet dabei automatisch `Authorization: Bearer <CRON_SECRET>`.

Der erste erfolgreiche Lauf legt `briefings/latest.json` im privaten Blob Store an. Danach zeigt `/briefing-preview` die erzeugten Briefings. Vor dem ersten Lauf ist die Meldung `Noch kein Briefing verfügbar` der erwartete Zustand.

Checkliste für den ersten Produktionslauf:

1. In Vercel unter Cron Jobs oder Logs prüfen, ob `/api/cron/daily-briefing` erfolgreich ausgeführt wurde.
2. Im Blob Browser prüfen, ob `briefings/latest.json` angelegt wurde.
3. `/briefing-preview` öffnen und Kandidatenauswahl, deutsche Texte, Quellen, Zeiten und Unsicherheit prüfen.
4. Im OpenAI-Projekt unter Usage die Kosten des ersten Aufrufs kontrollieren.
5. Bei einem Fehler zuerst die Vercel Function Logs prüfen; keine Secrets in Fehlermeldungen oder Screenshots teilen.

Für lokale Tests können `BRIEFING_AI_PROVIDER=mock` und `BRIEFING_STORAGE_DRIVER=file` verwendet werden, ohne API-Kosten zu erzeugen.

Die OpenAI-Projektbudget-Einstellung ist nur eine Warnschwelle. Der Code verhindert deshalb zusätzliche Modellaufrufe am selben UTC-Tag und gibt bei Cron-Wiederholungen den vorhandenen Snapshot zurück.
