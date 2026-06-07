# Decision Log

## 2026-06-07

### Decision 020 - Start Phase 2 With Free RSS Sources

Decision:

Use free public RSS feeds as the first real content source layer.

Reason:

RSS is available without paid APIs, credentials, database infrastructure, or AI processing. It supports the Phase-2 goal of validating real source availability before adding ranking or summarization.

Tradeoff:

RSS quality and structure vary by publisher. Some feeds may be broad, noisy, delayed, or rate-limited.

Consequence:

The app will first build a robust source layer and health checks before replacing mock dashboard content.

Status:

active

### Decision 021 - Keep Real Feed Data Out Of The Main Dashboard Initially

Decision:

The Phase-1 dashboard continues to use curated mock data while live RSS feeds are exposed only through internal API routes.

Reason:

Raw feeds are not yet deduplicated, ranked, or converted into executive briefings. Showing them directly would create a classic news-feed experience, which conflicts with the product direction.

Tradeoff:

Real content is available technically but not yet visible in the main app.

Consequence:

Next work should focus on source quality, filtering, deduplication, and editorial shaping before UI integration.

Status:

active

### Decision 022 - Track Source Health Before Adding More Sources

Decision:

Add a source health endpoint before expanding the source list.

Reason:

Free feeds can fail, change format, or become slow. Health checks make source reliability visible and prevent silent breakage.

Tradeoff:

Adds a small internal API surface.

Consequence:

Every new source should be evaluated through `/api/sources/health` before being considered active.

Status:

active
