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

Future structure to consider:

- Politik Deutschland
- Weltpolitik / Internationale Beziehungen

### Handball

Exclude or deprioritize:

- too many individual match reports
- women's handball for the personal dashboard scope
- videos and slideshows

Prioritize:

- top teams
- relegation battle
- Champions League
- structural season developments

## Focus Filtering

`src/lib/article-filter.ts` contains the first editorial noise-reduction layer.

This is not the final relevance engine. It is a pre-ranking filter to make raw feeds reviewable and to reduce obvious noise before later deduplication and scoring.

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

It is temporarily visible in the bottom navigation during Phase 2 source review.

The product target still has only two primary areas: Dashboard and Archive. The raw view must not become a generic news feed. It is a development tool for source validation before curated dashboard integration.

## Reliability Rules

- Every feed request has an 8 second timeout.
- One failing feed must not block a whole category.
- Feed results are normalized into `LiveArticle`.
- The dashboard remains on curated mock data until source quality is good enough.
