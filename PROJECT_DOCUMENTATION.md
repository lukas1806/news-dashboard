# Project Documentation

## Current Phase

Phase 3 preview: AI Briefing Generation, built on the Phase-2 Content Engine.

The app still uses the Phase-1 mock dashboard for the main user experience. Real feeds are available through the source layer, internal APIs, `/raw`, and a separate Phase-2 candidate preview. AI-generated output is isolated in `/briefing-preview` until its quality is approved.

### Current Handoff On 2026-06-14

The intended next milestone is to make the Phase-3 briefing experience reliable and polished enough to replace the Phase-1 mock dashboard as the normal start page. This replacement has not been approved or implemented yet.

Latest production findings:

- the first compact-card manual refresh completed but returned only 2 reports per category
- broad post-generation event clustering was identified as the cause and removed
- the briefing-only candidate reserve was increased from 5 to 8 while the visible candidate API remains capped at 5
- strong reports from the previous 48 hours now remain eligible and compete with new reports by relevance, then freshness
- the next manual attempt was aborted by the former 55-second application timeout
- briefing functions now allow the Vercel Hobby maximum of 300 seconds and abort the OpenAI request after 270 seconds with a controlled error
- the previous successful Blob snapshot remained intact during failed attempts, as designed
- the longer 300-second configuration completed a manual production refresh on 2026-06-14 in approximately 90 seconds
- the refresh produced 4 Wirtschaft, 5 Politik, and 5 Handball reports after cross-run retention
- mobile layout and overview-to-detail back navigation worked at an iPhone-sized 390 x 844 viewport without horizontal overflow
- content quality did not pass: a report changed Mathias Gidsel to `Emil Gidsel`, a market report mixed in a secondary IPO topic, a Handball report referred to club football, and several detail texts extrapolated unsupported consequences from short RSS excerpts
- the main-dashboard promotion remains blocked until a corrected production run passes the full content review

Do not replace the main dashboard until the production run confirms that the system normally reaches 5 useful reports per category or has a clearly justified quality-based shortage.

### Second Production Review On 2026-06-14

Production deployment `8YvwSfgjKgrgWYwCvybhu5udkea3` was `Ready`, assigned to `news-dashboard-blue.vercel.app`, and built from commit `defa8f3`, matching local `main` and `origin/main` before the review changes.

The protected manual run completed successfully at 16:14 German time after approximately 90 seconds. It used one of the five Berlin-day manual attempts and replaced the Blob snapshot only after full generation. The resulting category counts were:

- Wirtschaft: 4
- Politik: 5
- Handball: 5

Retention worked mechanically: useful older reports kept their original creation times and competed with new reports. The new set also removed the previous duplicate pair about the same Hormuz drone event. The category count alone was not a quality pass, however.

Blocking findings:

- a Gidsel report invented `Emil Gidsel`; the linked source names Mathias Gidsel, while the RSS candidate supplied only the surname and another candidate supplied `Emil Bak`
- the Wirtschaft market report again included a secondary IPO topic even though SpaceX already had a separate report
- a Handball detail referred to German club football instead of Handball
- several detail reports added unsupported implications about transfers, contracts, audience figures, tactics, suspensions, or market reactions that were not present in the supplied RSS title or excerpt
- the retained single-source Hormuz military claim remained despite explicitly noting that independent confirmation was missing
- Wirtschaft had only three fresh visible candidates, including the unsuitable market report, so five strong reports were not supported by the available source set

Resulting safeguards:

- generic daily market reports and Youth Trophy items are excluded before candidate scoring
- generated full names are rejected when the exact first-name/surname combination does not occur in the assigned source title or excerpt
- Handball output containing football terminology is rejected
- single-source political reports that explicitly acknowledge missing independent confirmation are rejected and are not retained
- known malformed Gidsel names, wrong-sport reports, market reports, and weak unconfirmed political reports are not retained across runs
- the generation prompt now treats the input explicitly as RSS metadata, forbids unsupported consequences, requires surname-only wording when no first name is supplied, and targets concise 120-220 word reports instead of padding thin excerpts to 250-450 words

The production UI passed the mobile structural check at 390 x 844 pixels: cards showed title, teaser, source, source time, uncertainty, and reading time without horizontal overflow. Detail sections and source links were present, and the back control returned from a detail report to `/briefing-preview`. Content approval remains outstanding.

OpenAI Usage for the `news-dashboard` project after the run showed:

- USD 0.08 total spend for the selected May 30-June 14 range
- USD 0.06 aggregated spend on June 14
- 25,649 input tokens and 28,967 output tokens on June 14
- 8 project requests across the selected range

The Usage dashboard aggregates all June 14 requests and did not expose a separate dollar amount for only the successful 16:14 manual run in the reviewed view. USD 0.06 is therefore a conservative upper bound for that run rather than an exact per-request cost. Even that upper bound would project to approximately USD 1.80 for 30 daily runs, comfortably below the intended EUR 5 monthly ceiling. Actual scheduled-only cost should be lower because the June 14 aggregate includes multiple requests made during testing.

### Controlled Promotion Plan

After an explicit `Freigabe` or `Go für die Hauptseite`:

1. Reuse the existing briefing overview at `/` instead of duplicating it.
2. Move permanent detail URLs to `/briefing/[category]/[id]`.
3. Add permanent redirects from `/briefing-preview/[category]/[id]` to the new detail URLs.
4. Keep `/briefing-preview` temporarily as a redirect to `/` for saved links and installed web-app sessions.
5. Keep `/raw` as the internal review tool and do not promote `/preview` into primary navigation.
6. Keep the mobile bottom navigation limited to the daily briefing, internal raw review where needed, and archive.
7. Re-test direct detail entry and back fallback in the installed iPhone home-screen web app before removing compatibility routes.

No promotion route changes are part of the current quality fixes.

### Main Dashboard Promotion Checklist

Before `/briefing-preview` replaces `/`, verify:

1. A manual or scheduled production run completes within the configured timeout.
2. Each category normally contains 5 useful reports; fewer items have an understandable source-quality reason.
3. Retained reports remain when they are still among the strongest items and keep their original creation time.
4. No near-duplicate event, reused source, malformed person name, mixed-event report, or low-value market report appears.
5. Compact cards can be scanned across all categories in approximately 2-3 minutes.
6. Detail pages are informative, grounded, readable in under 5 minutes, and navigate correctly in the iPhone home-screen web app.
7. Sources, publication times, uncertainty, model, and `KI-generiert` remain visible.
8. Stale, expired, failed-run, and empty states remain understandable.
9. OpenAI usage after the longer 15-report run remains comfortably below the EUR 5 monthly ceiling.
10. The user explicitly approves the content quality and replacement.

After approval, prefer reusing the briefing components and routes rather than duplicating them. `/` should become the briefing overview, detail URLs should move or redirect cleanly, the bottom navigation should remain simple, and `/raw` should stay an internal review tool. Keep `/briefing-preview` temporarily as a redirect or compatibility route during the transition.

## Phase 3 Preview Scope

Build:

- One automatic briefing generation run per day
- Deterministic candidate selection before AI generation
- One combined OpenAI request for all categories when possible
- Target 5 finished briefings per category, with fewer items when quality or source diversity is insufficient
- German summaries, including translation of English source material
- Multi-source synthesis only for the same event
- Visible sources, source publication times, uncertainty, model, and generation time
- Private storage of the latest successful snapshot in Vercel Blob
- Continue showing the previous snapshot when it is 24-48 hours old
- Hide snapshots older than 48 hours and show a clear error state
- Provider and storage interfaces that can later support Claude or another persistence layer

Do not build yet:

- Replacement of the main dashboard before the promotion checklist and explicit quality approval are complete
- Briefing history or archive persistence
- User accounts or per-user personalization
- Multiple scheduled AI runs per day

### Briefing Shape

Each generated briefing contains:

- title
- one-sentence overview teaser
- 6-9 sentence description
- 2-3 sentences explaining why it matters
- 2-3 sentences describing concrete impact
- uncertainty level and optional explanation
- one or more verified source references
- item creation time and estimated reading time
- visible `KI-generiert` label

The model may discard a candidate when the available source information is too thin or uncertain. Source names, URLs, and publication times are never accepted directly from model output; the model returns article IDs and the server reconstructs source metadata from the actual candidate set.

### Cost Controls

- Default model: `gpt-5-mini`, configurable through `OPENAI_BRIEFING_MODEL`
- Exactly one scheduled endpoint call per day
- Same-day retries return the existing snapshot without another model request
- One combined model request for all categories
- Maximum output: 14,000 tokens for up to 15 detailed reports
- Low reasoning effort for the daily writing task
- Password-protected manual review endpoint with 5 attempts per Berlin calendar day
- Recommended OpenAI project budget alert: approximately EUR 5 per month

OpenAI project budgets are soft alert thresholds and do not stop API requests after the threshold is crossed. The application therefore keeps one automatic request per UTC day, uses one combined request and low reasoning effort, and limits manual review runs to five attempts per Berlin calendar day. Usage alerts should still be configured near the intended monthly limit.

### Scheduling And Storage

Vercel Cron calls `/api/cron/daily-briefing` at `03:00 UTC` every day. This corresponds to 04:00 in German winter time and 05:00 in German summer time. The route requires `Authorization: Bearer <CRON_SECRET>`.

Production stores the current report privately at `briefings/latest.json` and the manual daily attempt counter at `briefings/manual-run-state.json` in Vercel Blob. The report is overwritten only after a complete successful generation. Local development uses equivalent files below `.briefing-data/` when no Blob credentials are present.

### Production Setup Completed On 2026-06-11

OpenAI configuration:

- dedicated project: `news-dashboard`
- Prototype API credits funded with USD 5
- monthly project budget set to USD 5
- usage alerts configured at 50% and 100%
- project model allowlist restricted to `gpt-5-mini`
- dedicated project API key stored only in Vercel as sensitive `OPENAI_API_KEY`

The OpenAI project budget is an alerting threshold, not a hard spending cap. Application-level idempotency, the single daily schedule, the model allowlist, and the output limit are the effective cost controls.

Vercel configuration:

- private Blob Store: `news-dashboard-briefings-blob`
- Blob region: Frankfurt (`fra1`)
- Blob Store connected to the `news-dashboard` Vercel project
- access provided through Vercel system environment variables, including `BLOB_STORE_ID`
- system environment variable access enabled
- production redeployed after adding the variables

Manually configured for Production and Preview:

- `OPENAI_API_KEY` as sensitive
- `OPENAI_BRIEFING_MODEL=gpt-5-mini`
- `BRIEFING_AI_PROVIDER=openai`
- `BRIEFING_STORAGE_DRIVER=blob`
- `CRON_SECRET` as sensitive, generated as a random 32-byte secret
- `BRIEFING_ADMIN_PASSWORD` as sensitive for manual review runs

The connected Blob integration also exposes `BLOB_STORE_ID` and `BLOB_WEBHOOK_PUBLIC_KEY`. The current `@vercel/blob` setup uses the connected store and does not require a manually copied `BLOB_READ_WRITE_TOKEN`. That token name remains supported by the storage selection code for legacy or local token-based setups.

Secret policy:

- never commit, document, log, or share secret values
- keep `OPENAI_API_KEY`, `CRON_SECRET`, and `BRIEFING_ADMIN_PASSWORD` marked sensitive
- rotate a secret immediately if its value is exposed
- do not expose an unprotected production generation endpoint; manual runs require the separate admin password, explicit confirmation, and daily attempt limit

First-run verification:

- before the first successful cron run, `/briefing-preview` correctly shows that no briefing is available
- after the run, `briefings/latest.json` must exist in the private Blob Store
- the Vercel function response should report `ok: true`, generation time, model, and category counts
- the preview must be reviewed for content quality, source grounding, publication times, German translation, and uncertainty labels
- OpenAI Usage must be checked after the first run to establish the real daily and projected monthly cost

### First Production Review On 2026-06-13

The first scheduled production run completed successfully at 05:51 German time. Vercel Blob contained `briefings/latest.json`, and `/briefing-preview` rendered three items per category with model, sources, times, and uncertainty labels.

Quality findings:

- the EZB rate item and US tariff item were useful and understandable
- a low-value DAX market report incorrectly mixed the market move with a secondary SpaceX IPO topic
- SpaceX should be a separate capital-market briefing only when a dedicated source article is available; Reuters remains the important missing source path
- politics contained too much Middle East / Iran coverage and a weak single-source Russian military claim
- Handball contained two overlapping Final4 items
- the model incorrectly combined person names into `Mikkel Hansen Gidsel`

Resulting guardrails:

- candidate diversity is no longer relaxed merely to fill all available slots
- daily market reports receive an additional score penalty
- IPO / SpaceX is a separate event cluster from general stock-market reporting
- EHF Final4 is one Handball event cluster even when articles emphasize different participating teams
- generated items may not reuse source articles; the prompt remains responsible for merging only sources about the same concrete event
- high-uncertainty political claims based on one attributed report may be discarded
- the generation prompt requires exact source names, one main event per item, no internal notes, and targets five items while permitting fewer only when the sources do not support them

The Phase-3 preview is technically stable but not yet approved to replace the main dashboard.

### First Production Cost Measurement

OpenAI Usage for the `news-dashboard` project on 2026-06-13 showed:

- 2 Responses API requests
- 7,209 total tokens shown by the usage dashboard
- approximately USD 0.01 total spend

At the observed rate, one scheduled request per day would project to roughly USD 0.15-0.30 per month. This is an estimate based on the first two requests, not a guaranteed fixed cost; candidate volume, input length, output length, and model pricing can change it. The measured result is nevertheless comfortably below the target ceiling of EUR 5 per month.

The detailed 5-item target can use more output tokens than the first measurement. Costs must be checked again after the first production run with the longer format.

### Manual Review Runs And Detail Navigation

The Phase-3 review surface supports complete password-protected refreshes without waiting for the next cron run.

- `BRIEFING_ADMIN_PASSWORD` is a separate sensitive Vercel variable
- the password is submitted only to `/api/briefing/manual-refresh`
- successful browser authentication is remembered only in `sessionStorage` for the current web-app session
- every attempt, including a failed generation, counts toward the daily limit of 5
- the private state file is `briefings/manual-run-state.json`
- no cooldown is imposed between attempts
- all three categories are generated in one request
- any failure discards the complete new report while preserving the last successful snapshot
- manual refresh remains available even when the visible report has expired

Automatic and manual runs merge new output with still-useful items from the previous 48 hours. Retained events keep their original `createdAt` and compete with new items by relevance, then freshness. Only shared source IDs or near-identical titles count as cross-run duplicates; broad topic labels such as Middle East or Final4 do not remove otherwise distinct reports. Known low-quality legacy market reports, malformed names, and high-uncertainty single-source political claims are not retained.

The briefing generator receives up to 8 diverse candidates per category while the visible candidate API remains limited to 5. This reserve lets the model target 5 finished reports even when individual candidates are rejected for weak sourcing or insufficient substance.

The expanded 15-report format can take longer than one minute. Both briefing routes use the Vercel Hobby maximum of 300 seconds, while the OpenAI request aborts after 270 seconds so the route still has time to return a controlled error. The previous Blob snapshot remains unchanged on a timeout.

The overview is designed for a 2-3 minute scan and shows compact cards with title, teaser, source, publication time, uncertainty, and reading time. Each card opens `/briefing-preview/[category]/[id]`. The detail view contains the description, why it matters, concrete impact, uncertainty, and sources, with a web-app-friendly back action.

### Reuters Access Review On 2026-06-13

Reuters remains a high-priority editorial source, but it is not activated yet.

- Reuters Connect is the official content marketplace and delivery platform: https://www.reutersagency.com/en/platforms/reuters-connect/
- no documented free official Reuters news API or stable free official general-news RSS feed was verified
- direct Reuters website scraping is not accepted as a durable source because of reliability and reuse-term risk
- unofficial or guessed RSS endpoints remain prohibited
- paid discovery services remain outside the EUR 5 monthly budget

Reuters may be activated only after a stable, free, explicitly permitted discovery or feed mechanism is verified. Until then, direct Reuters links remain editorial reference examples and source-gap indicators.

## Phase 2 Scope

Build:

- Free source discovery
- RSS feed ingestion
- Raw article normalization
- Source health checks
- Basic source documentation
- Simple candidate selection from filtered raw articles
- Browser-local raw article review controls
- Small dashboard preview with up to 5 real candidates per category

Do not build yet:

- AI summaries
- Database storage
- Final relevance engine
- Push notifications
- User accounts
- Paywalled source integrations

## Free Source Strategy

Phase 2 starts with public RSS feeds because they are free, simple, and available without credentials.

Active sources:

- Tagesschau · Weltwirtschaft
- Tagesschau · Finanzen
- Tagesschau · Technologie
- Europäische Zentralbank · Press
- Federal Reserve · Press Releases
- Tagesschau · Alle Meldungen
- Deutschlandfunk · Nachrichten
- handball-world.news

Candidate sources:

- NVIDIA Blog
- Politico Europe
- Reuters

Candidate sources are listed but not used for the main category fetch until terms, reliability, and practical value are verified.

Reuters is a high-priority future source for international politics, business, markets, and technology. It must not be integrated through guessed, unofficial, or unstable RSS endpoints. Activation requires a reliable permitted access method and a review of reuse terms; direct article links remain useful as editorial reference examples meanwhile.

## Editorial Preferences From Source Review

### Wirtschaft

Current Tagesschau world-economy feed is broadly useful. International business and macro items from China, Russia, the USA, and Europe should remain in scope.

Keep or prioritize:

- international trade and tariff conflicts, especially USA/EU/China
- German industry in international markets
- aviation fuel and conflict-driven commodity effects
- digital infrastructure and telecom investment when economically material
- major energy and commodity-market shifts such as OPEC exits and refinery investments
- broad China growth / macro data when economically material
- AI risk and governance items when tied to major companies or market implications
- major equity / portfolio-risk stories, especially when linked to dollar, US risk, AI stocks, or large indices
- major IPO and capital-market stories, including companies such as SpaceX when the market impact is material
- Euro, dollar, inflation, and Eurozone macro signals

Exclude or deprioritize:

- central-bank personnel speculation unless tied to an actual rate decision
- ministerial trip/process items without clear economic consequence
- tariff repayment/legal cleanup items without forward-looking market impact
- narrower Russia currency or climate-cost items when stronger macro/trade/energy candidates are available

Candidate selection should avoid duplicate Wirtschaft stories in the top set. One tariff/trade item, one China item, or one energy/commodity item is enough when other strong topics are available.

Short candidate keywords such as `KI`, `EU`, and `Öl` are matched as standalone tokens so names or longer words do not create false topic reasons.

Dashboard candidates must have a valid publication date and must not be older than 72 hours. Older articles can remain visible in `/raw` for source review but cannot enter `/preview` or the candidate API.

Candidate selection evaluates up to 60 filtered articles per category so relevant items are not lost behind the 20-item `/raw` display limit.

Known gaps:

- AI / major technology companies are now covered experimentally through Tagesschau Technologie and need `/raw` review.
- larger stock-market / equities news is now covered experimentally through Tagesschau Finanzen and needs `/raw` review.

Newly added Wirtschaft source review points:

- Tagesschau Finanzen should improve large stock-market, DAX, Nasdaq, Wall Street, and major equity coverage.
- Tagesschau Technologie should improve AI, chip, and major technology-company coverage without relying on company-owned marketing feeds.
- Candidate selection should still keep one market/stock item and one AI/tech item at most when other strong Wirtschaft topics are available.
- Confirmed high-value examples include Euro global relevance, US dollar/depot risk with AI stocks, Eurozone inflation, US/EU tariff threats, and Anthropic/AI-risk governance.

ECB and Fed are active sources, but their feeds are heavily filtered. Only interest-rate / policy-rate decision items should pass into review. Routine speeches, technical notices, and institutional statements are considered too noisy for the dashboard.

The dashboard should later show a strict maximum of 3-5 focused items per category. Raw article volume must not become the user experience.

Future structure to consider:

- Wirtschaft Deutschland / Europa
- Wirtschaft International

### Politik

Exclude or deprioritize:

- ADFC / cyclist interest-group items
- local election results with low national relevance
- Kosovo-only items unless geopolitically important
- Lohntransparenz
- Heizungsgesetz / low-impact climate-policy process items
- Junge Union process debate
- Peru election items
- sport politics
- religion
- local accidents, fires, and crime items
- single-opposition court cases without broader geopolitical impact
- climate-conference process items
- local/municipal capacity warnings
- natural disasters without direct political consequence
- NGO protest actions such as Greenpeace traffic-sign actions
- defense-program process items when they are too narrow for the personal dashboard
- routine weather reports
- religion/community-abuse features without direct political consequence
- lower-priority study/process items about oceans, peace research, drones, atom weapons, single Ukraine attack events, or agriculture water use

Future structure to consider:

- Politik Deutschland
- Weltpolitik / Internationale Beziehungen

Prioritize:

- tax/social reform with direct impact for Germany
- large infrastructure projects such as Stuttgart 21
- Ukraine funding and strategic geopolitical support
- Middle East / Iran / Israel developments, but only once per top candidate set when stories overlap
- Strait of Hormuz closures or shipping-security developments as a separate strategic cluster when materially relevant
- border-control policy when nationally relevant
- economic consequences of geopolitical conflict
- major European technology investments with strategic industrial relevance

Candidate selection should avoid duplicate Politik stories in the top set. One Middle East/Iran-Israel item is enough when other strong political topics are available.

### Handball

Exclude or deprioritize:

- too many individual match reports
- women's handball for the personal dashboard scope
- videos and slideshows
- local farewell / weak-season / player-interview pieces
- last-second single-match result reports

Prioritize:

- top teams
- relegation battle
- Champions League
- structural season developments
- league-wide statistics and top-player rankings
- Champions League qualification and European-cup participation
- structural reset / coach / restart topics for top teams such as Füchse Berlin, SC Magdeburg, and THW Kiel
- HBL top goalkeeper and top scorer rankings

Candidate selection should avoid duplicate stories in the top set. For example, the same Handball candidate group should not contain multiple near-identical team/person items about Kiel/Jicha when other strong topics are available.

## Focus Filtering

`src/lib/article-filter.ts` contains the first editorial noise-reduction layer.

This is not the final relevance engine. It is a pre-ranking filter to make raw feeds reviewable and to reduce obvious noise before later deduplication and scoring.

## Candidate Selection

`src/lib/article-candidates.ts` contains a first deterministic candidate layer.

It scores already-filtered raw articles with transparent source, topic, and freshness rules, then selects at most 5 candidates per category. Candidate reasons are shown in `/raw` to support preference review.

This is still not the final dashboard relevance engine. It does not summarize, deduplicate, store, personalize, or use AI. Its job is to prove that the app can reduce raw feed volume to a small reviewable set before any curated dashboard integration.

## Preference Tuning Workflow

Preference tuning is an ongoing Phase-2 quality process. It should happen repeatedly while reviewing `/raw`, especially after adding or changing sources.

Recommended review loop:

1. Open `/raw` on the deployed app.
2. Review each category separately: Wirtschaft, Politik, Handball.
3. Mark examples as:
   - keep
   - exclude
   - too noisy
   - missing topic
   - source gap
4. Translate clear patterns into `src/lib/article-filter.ts`.
5. Document preference changes in this file.
6. Add or update a decision in `DECISION_LOG.md` when the preference affects product behavior.
7. Run `npm run check` and `npm run build`.
8. Push to GitHub and validate on Vercel/iPhone.

Quality rule:

The raw feed can contain many items for inspection, but the future dashboard must stay limited to 3-5 items per category. More articles should only improve selection quality, not increase reading burden.

Current preference tuning backlog:

- Reduce Wirtschaft source volume before dashboard integration.
- Keep ECB/Fed only for real rate decisions.
- Add better free AI / major-tech coverage without marketing noise.
- Continue filtering low-impact politics process items.
- Separate possible future views for Germany/Europe vs international scope.
- Reduce Handball match-report noise while keeping top teams, relegation battle, and Champions League.

## Internal APIs

### `/api/live/[category]`

Returns normalized live articles for one category:

- `/api/live/wirtschaft`
- `/api/live/politik`
- `/api/live/handball`

The route returns raw normalized article metadata only. It does not generate summaries or scores.

### `/api/candidates/[category]`

Returns a small scored candidate set for one category:

- `/api/candidates/wirtschaft`
- `/api/candidates/politik`
- `/api/candidates/handball`

The route uses the same free RSS source layer and focus filters as `/api/live/[category]`, then applies deterministic candidate scoring. It returns article metadata, `candidateScore`, and `candidateReasons`.

### `/api/sources/health`

Checks all configured sources and returns:

- source id
- source name
- category
- configured status
- article count
- latest publication date
- fetch status
- error if unavailable

This is a development and operations endpoint for validating the free feed setup.

## Internal Views

### `/briefing-preview`

Phase-3 quality-review surface for the most recent generated briefing snapshot. It remains separate from the main dashboard until the user approves generated text quality.

Display rules:

- up to 24 hours old: current
- 24-48 hours old: visible with a stale warning
- older than 48 hours: hidden with a clear error state
- no snapshot: setup/unavailable state
- manual refresh remains visible in every state
- compact cards link to dedicated detail routes

### `/preview`

Phase-2 dashboard preview for testing the candidate layer in a compact reading surface.

Rules:

- shows at most 5 candidates per category
- uses the existing deterministic RSS candidate selection
- shows source titles, excerpts, dates, and transparent candidate reasons
- does not generate summaries or claim to be an Executive Briefing
- uses Phase-1 mock items as a clearly labeled fallback when a category has no available live candidates
- adds no AI, database, paid API, or server-side persistence

The existing Phase-1 dashboard remains the primary experience until the content engine can produce reviewed briefing-quality output.

### `/raw`

Internal Phase-2 view for inspecting live feed articles by category.

Purpose:

- visually review free source quality
- spot noisy feeds
- compare source freshness
- validate category coverage
- inspect the current top candidates and their rule-based reasons
- mark raw articles as good, higher, lower, or exclude for iterative preference tuning

It is temporarily visible in the bottom navigation during Phase 2 source review.

The product target still has only two primary areas: Dashboard and Archive. The raw view must not become a generic news feed. It is a development tool for source validation before curated dashboard integration.

Raw review controls:

- Ratings are stored only in browser `localStorage`.
- No database, server write, user account, AI, or persistent backend state is involved.
- The review summary can be copied and pasted into the tuning chat.
- `Raus ausblenden` and `Review-Sortierung` are local inspection tools only.
- `Zurücksetzen` must fully clear the review state across the summary and all category sections before a new review round starts.
- After reset, the next rating must export only the new review round and must not reintroduce ratings from a previous round.

## Reliability Rules

- Every feed request has an 8 second timeout.
- One failing feed must not block a whole category.
- Feed results are normalized into `LiveArticle`.
- The main dashboard remains on curated mock data until source quality is good enough; `/preview` may show live candidates with a labeled mock fallback.
