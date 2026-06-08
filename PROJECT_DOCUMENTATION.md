# Project Documentation

## Current Phase

Phase 2: Content Engine.

The app still uses the Phase-1 mock dashboard for the main user experience. Real feeds are currently introduced as a source layer and internal API only.

## Phase 2 Scope

Build:

- Free source discovery
- RSS feed ingestion
- Raw article normalization
- Source health checks
- Basic source documentation
- Simple candidate selection from filtered raw articles
- Browser-local raw article review controls

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
- Europäische Zentralbank · Press
- Federal Reserve · Press Releases
- Tagesschau · Alle Meldungen
- Deutschlandfunk · Nachrichten
- handball-world.news

Candidate sources:

- NVIDIA Blog
- Politico Europe

Candidate sources are listed but not used for the main category fetch until terms, reliability, and practical value are verified.

## Editorial Preferences From Source Review

### Wirtschaft

Current Tagesschau world-economy feed is broadly useful. International business and macro items from China, Russia, the USA, and Europe should remain in scope.

Keep or prioritize:

- international trade and tariff conflicts, especially USA/EU/China
- German industry in international markets
- aviation fuel and conflict-driven commodity effects
- digital infrastructure and telecom investment when economically material

Exclude or deprioritize:

- central-bank personnel speculation unless tied to an actual rate decision
- ministerial trip/process items without clear economic consequence

Known gaps:

- AI
- major technology companies

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

Future structure to consider:

- Politik Deutschland
- Weltpolitik / Internationale Beziehungen

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

## Reliability Rules

- Every feed request has an 8 second timeout.
- One failing feed must not block a whole category.
- Feed results are normalized into `LiveArticle`.
- The dashboard remains on curated mock data until source quality is good enough.
