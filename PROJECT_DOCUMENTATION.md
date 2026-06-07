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
- Tagesschau · Alle Meldungen
- Deutschlandfunk · Nachrichten
- handball-world.news

Candidate sources:

- Politico Europe

Candidate sources are listed but not used for the main category fetch until terms, reliability, and practical value are verified.

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

## Reliability Rules

- Every feed request has an 8 second timeout.
- One failing feed must not block a whole category.
- Feed results are normalized into `LiveArticle`.
- The dashboard remains on curated mock data until source quality is good enough.
