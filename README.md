# Executive News Dashboard

Persönliches Executive News Dashboard mit täglichem KI-Briefing und interner RSS-Content-Engine.

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
npm test
npm run check
npm run build
```

`npm test` führt lokale Regressionstests für Candidate-Dubletten, Briefing-Grounding, Quellenwiederverwendung und Snapshot-Validierung aus. Die Tests verwenden nur Fixtures und verursachen keine RSS-, Blob- oder OpenAI-Aufrufe.

Die Tests sichern außerdem den geschützten Tagesbetrieb ab: Ein vorhandener Snapshot desselben UTC-Tages verhindert einen zweiten Lauf, und ein Generierungsfehler darf den bestehenden Snapshot nicht überschreiben.

`/raw` ist die einzige interne Oberfläche für Quellen-, Kandidaten- und Qualitätsreview. Der historische Pfad `/preview` leitet dauerhaft dorthin weiter; `/briefing-preview` bleibt separat als Kompatibilitätsredirect für frühere Briefing-Links bestehen.

Für mobile Routing-Änderungen zusätzlich bei 390 x 844 prüfen: kein horizontaler Overflow, Übersicht → Detail → Zurück, direkter Detail-Einstieg → `/` sowie die Redirects von `/briefing-preview` und alten Preview-Detail-URLs.

Dependency-Updates werden einzeln geprüft. Kein `npm audit fix --force`: Der aktuell vorgeschlagene PostCSS-Fix würde Next.js auf eine inkompatible alte Hauptversion zurücksetzen.

## Vercel Deployment

Beim Import in Vercel:

- Framework Preset: Next.js
- Root Directory: Repository Root
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: leer lassen

Die App enthält interne Phase-2-APIs für RSS-Quellenprüfung und Kandidatenauswahl. Die Hauptseite verwendet einen einzelnen täglichen OpenAI-Aufruf und einen privaten Vercel-Blob-Snapshot. Eine Datenbank wird weiterhin nicht verwendet.

Interne Phase-2-Oberflächen:

- `/raw` für Quellen- und Kandidatenreview
- `/preview` für eine kompakte Vorschau mit maximal 5 Kandidaten pro Kategorie und gekennzeichnetem Mock-Fallback
- `/` für das täglich erzeugte KI-Briefing mit Quellen und Unsicherheitskennzeichnung
- `/briefing/[category]/[id]` für permanente Detailberichte
- `/briefing-preview` als vorübergehender Kompatibilitäts-Redirect

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
BRIEFING_ADMIN_PASSWORD
BRIEFING_STORAGE_DRIVER=blob
```

Automatisch durch die Blob-Verknüpfung bereitgestellte Variablen:

```txt
BLOB_STORE_ID
BLOB_WEBHOOK_PUBLIC_KEY
```

Bei älteren oder manuell tokenbasierten Blob-Setups kann stattdessen `BLOB_READ_WRITE_TOKEN` vorhanden sein. Für das aktuell verbundene Vercel-Projekt ist kein manuell kopierter Blob-Token erforderlich.

`OPENAI_API_KEY`, `CRON_SECRET` und `BRIEFING_ADMIN_PASSWORD` bleiben immer als `Sensitive` markiert. Ihre Werte dürfen weder in Git noch in Screenshots, Logs, Dokumentation oder Chatnachrichten erscheinen. `CRON_SECRET` schützt den automatischen Generierungs-Endpunkt; das separate Admin-Passwort schützt manuelle Testläufe.

### Täglicher Lauf

`vercel.json` plant `/api/cron/daily-briefing` täglich um `03:00 UTC`. Das entspricht in Deutschland ungefähr 04:00 Uhr im Winter und 05:00 Uhr im Sommer. Vercel sendet dabei automatisch `Authorization: Bearer <CRON_SECRET>`.

Der erste erfolgreiche Lauf legt `briefings/latest.json` im privaten Blob Store an. Danach zeigt `/` die erzeugten Briefings. Vor dem ersten Lauf ist die Meldung `Noch kein Briefing verfügbar` der erwartete Zustand.

Checkliste für den ersten Produktionslauf:

1. In Vercel unter Cron Jobs oder Logs prüfen, ob `/api/cron/daily-briefing` erfolgreich ausgeführt wurde.
2. Im Blob Browser prüfen, ob `briefings/latest.json` angelegt wurde.
3. `/` öffnen und Kandidatenauswahl, deutsche Texte, Quellen, Zeiten und Unsicherheit prüfen.
4. Im OpenAI-Projekt unter Usage die Kosten des ersten Aufrufs kontrollieren.
5. Bei einem Fehler zuerst die Vercel Function Logs prüfen; keine Secrets in Fehlermeldungen oder Screenshots teilen.

Für lokale Tests können `BRIEFING_AI_PROVIDER=mock` und `BRIEFING_STORAGE_DRIVER=file` verwendet werden, ohne API-Kosten zu erzeugen.

Die OpenAI-Projektbudget-Einstellung ist nur eine Warnschwelle. Der Code verhindert deshalb zusätzliche Modellaufrufe am selben UTC-Tag und gibt bei Cron-Wiederholungen den vorhandenen Snapshot zurück.

### Manuelle Aktualisierung und Detailseiten

Die Hauptseite enthält einen passwortgeschützten Button für vollständige Testläufe aller drei Kategorien. Vor jedem Lauf muss ein Kostenhinweis bestätigt werden.

- maximal 5 manuelle Versuche pro Berliner Kalendertag
- keine künstliche Wartezeit zwischen den Versuchen
- fehlgeschlagene Versuche zählen mit
- der alte Report wird nur nach einem vollständig erfolgreichen Lauf ersetzt
- das Passwort liegt nur in der aktuellen Browser-Sitzung in `sessionStorage`
- der Versuchszähler liegt privat in `briefings/manual-run-state.json`

Die kompakte Übersicht zeigt bis zu fünf Briefings pro Kategorie. Detailberichte sind unter `/briefing/[category]/[id]` erreichbar.

### Aktueller Produktstand

Das Briefing wurde am 27.06.2026 nach ausdrücklicher Freigabe auf die Hauptseite promoted. `/raw` bleibt für spätere Quellen- und Qualitätsrunden erhalten; die ehemaligen Preview-Routen leiten aus Kompatibilitätsgründen auf die neuen Hauptseitenrouten weiter.
