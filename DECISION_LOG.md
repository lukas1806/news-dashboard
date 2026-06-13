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

### Decision 023 - Add Raw Feed Inspection As Internal View Only

Decision:

Add `/raw` as an internal Phase-2 view for visually inspecting normalized live feed articles.

Reason:

Before real content is allowed into the executive dashboard, source quality, freshness, noise level, and category fit need to be reviewed in context.

Tradeoff:

There is now an additional route, but it is not exposed as a primary navigation item.

Consequence:

`/raw` may be temporarily linked in the bottom navigation while reviewing sources. It remains a development and editorial inspection tool, not a product surface for daily use.

Status:

active

### Decision 024 - Add Pre-Ranking Focus Filters

Decision:

Add category-specific focus filters before any ranking or dashboard integration.

Reason:

Raw feeds contain useful articles but too much noise for the product. The dashboard must later stay limited to 3-5 high-value items per category, otherwise it becomes a generic news feed.

Tradeoff:

Simple keyword rules can accidentally remove useful articles or keep weak ones.

Consequence:

Filters live in `src/lib/article-filter.ts` and should be iterated through `/raw` review before any final relevance engine is built.

Status:

active

### Decision 025 - Keep International Wirtschaft And Politik In Scope

Decision:

Do not limit Wirtschaft and Politik to German domestic news. International developments from the USA, China, Russia, Europe, and global markets remain in scope.

Reason:

The user explicitly finds international economic and political context useful. The later dashboard may need national/international grouping rather than narrower sourcing.

Tradeoff:

Broader scope increases source volume and filtering complexity.

Consequence:

Future dashboard design should consider Germany/Europe vs international substructure while still limiting visible items strongly.

Status:

active

### Decision 026 - Add ECB And Fed As Active Free Wirtschaft Sources

Decision:

Add official free ECB and Federal Reserve RSS feeds as active Wirtschaft sources.

Reason:

Current Wirtschaft feed quality is good, but central banking topics were under-covered. ECB and Fed are core topics in the PRD.

Tradeoff:

Official central-bank feeds are primary-source heavy and may be technical or not written like news articles.

Consequence:

These feeds need later summarization, deduplication, and relevance scoring before dashboard use.

Status:

active

### Decision 027 - Filter Central Bank Feeds To Rate Decisions

Decision:

Keep ECB and Federal Reserve feeds active, but only pass items related to interest-rate or policy-rate decisions into review.

Reason:

The raw feeds contain too many speeches, technical releases, and institutional notices. The user only wants these sources surfaced for actual rate changes or directly related monetary-policy decisions.

Tradeoff:

Some useful central-bank context may be filtered out.

Consequence:

Central-bank filtering is stricter than general Wirtschaft filtering and is implemented in `src/lib/article-filter.ts`.

Status:

active

### Decision 028 - Treat Preference Tuning As Continuous Quality Work

Decision:

Preference tuning is an ongoing product-quality workflow, not a one-time configuration task.

Reason:

The value of the app depends on reducing noise and selecting only the most relevant items. Feed quality, user interest, and source behavior will change over time, so filters and preferences must be reviewed repeatedly.

Tradeoff:

Requires recurring editorial review instead of fully automatic ingestion.

Consequence:

Every review cycle should use `/raw`, update `src/lib/article-filter.ts` when patterns are clear, and document preference changes in `PROJECT_DOCUMENTATION.md` and this Decision Log when they affect product behavior.

Status:

active

## 2026-06-08

### Decision 029 - Add A Small Transparent Candidate Layer Before Dashboard Integration

Decision:

Add a deterministic candidate-selection layer that scores filtered raw articles and returns at most 5 candidates per category.

Reason:

The product must not become a newsfeed. A visible candidate layer lets us test whether free RSS sources can be reduced to a small, high-signal set before any final dashboard integration, AI summarization, or storage is added.

Tradeoff:

Keyword and source weights are simple and can miss nuance. They need continued review in `/raw`.

Consequence:

Candidate scoring lives in `src/lib/article-candidates.ts`, `/raw` shows candidate scores and reasons, and `/api/candidates/[category]` exposes the internal candidate set for validation.

Status:

active

### Decision 030 - Tune Candidate Preferences From First Raw Review

Decision:

Update focus filters and candidate weights based on the first reviewed `/raw` candidate set.

Reason:

The user marked concrete keep/exclude examples across Wirtschaft, Politik, and Handball. These examples showed that the candidate layer should favor trade, infrastructure, geopolitical conflict, top-team handball, Champions League, league-wide statistics, and structural season topics, while filtering low-impact process, local, NGO, disaster, central-bank personnel, and individual match/player stories.

Tradeoff:

Keyword tuning remains imperfect and can over-filter edge cases.

Consequence:

`src/lib/article-filter.ts` now excludes additional reviewed noise patterns, while `src/lib/article-candidates.ts` boosts the newly confirmed keep patterns.

Status:

active

### Decision 031 - Add Browser-Local Raw Review Controls

Decision:

Add local review controls to `/raw` so articles can be marked as good, higher, lower, or exclude directly in the app.

Reason:

Repeatedly copying raw article lists into chat is slower than reviewing in context. Browser-local ratings make the preference tuning loop faster while keeping the feature scoped to internal Phase-2 source quality work.

Tradeoff:

Ratings are not shared across devices or sessions beyond the same browser storage.

Consequence:

`/raw` now stores review marks in `localStorage`, can hide excluded articles, can apply review sorting, and can export a text summary for further tuning. No database, AI, accounts, or dashboard behavior are introduced.

Status:

active

### Decision 032 - Tune Handball Candidate Ranking From Review Controls

Decision:

Boost review-confirmed Handball candidate patterns and demote lower-priority match, interview, farewell, and transfer-adjacent stories.

Reason:

The first browser-local review marked Champions League participation, structural top-team topics, league-wide statistics, top goalkeeper, and top scorer rankings as useful. It also marked single-match reports, minute-format pieces, player farewell items, local season interviews, and minor transfer-adjacent stories as lower priority.

Tradeoff:

Lower-priority items remain visible in raw review instead of being fully excluded, so some noise can still appear below stronger candidates.

Consequence:

`src/lib/article-candidates.ts` now gives stronger Handball boosts for confirmed top themes and applies a review-based score penalty to weaker Handball patterns.

Status:

active

### Decision 033 - Add Candidate Diversity Guardrails

Decision:

Avoid duplicate or near-duplicate candidate stories in the small top-candidate set.

Reason:

The dashboard target is only 3-5 items per category. Repeating the same story angle, such as multiple Handball items about the same team/person topic, wastes limited attention even when each individual article is relevant.

Tradeoff:

A second good article on the same topic may be held back when enough other strong candidates exist.

Consequence:

`src/lib/article-candidates.ts` now deduplicates candidate titles and applies topic diversity for recurring top-team, league-wide, trade, China, and energy topic clusters. This is a selection-quality rule, not a source exclusion.

Status:

active

### Decision 034 - Tune Wirtschaft Candidate Diversity

Decision:

Apply the same small-set diversity principle to Wirtschaft candidates.

Reason:

The user confirmed that multiple candidate cards for the same tariff/trade topic or the same Germany/China topic are too repetitive. One strong card per economic topic cluster is enough in the top candidate set.

Tradeoff:

A second useful article on the same economic topic may be held back while other strong topic clusters are available.

Consequence:

`src/lib/article-candidates.ts` now clusters Wirtschaft candidates by trade/tariffs, China, energy/commodities, Russia currency, climate costs, and infrastructure. It also boosts reviewed Africa/OPEC/China-growth examples, demotes reviewed lower-priority examples, and `src/lib/article-filter.ts` excludes the reviewed Trump-tariff repayment item.

Status:

active

### Decision 035 - Tune Politik Candidate Diversity

Decision:

Tune Politik candidate scoring and add topic diversity for recurring political story clusters.

Reason:

The user marked Middle East/Iran-Israel, Ukraine funding, border controls, tax/social reform, Stuttgart 21, media censorship, and economic conflict effects as useful, while weather, religion/community-abuse features, broad study/process items, single lower-impact Ukraine attack events, and agricultural water-use items should be filtered or demoted. The user also wants duplicate politics candidates avoided.

Tradeoff:

Some lower-priority international or policy items remain in raw review for visibility, but should rank below stronger candidate clusters.

Consequence:

`src/lib/article-filter.ts` excludes reviewed weather and religion/community-abuse noise. `src/lib/article-candidates.ts` boosts reviewed politics themes, demotes lower-priority patterns, and clusters politics candidates by Middle East/Iran-Israel, Ukraine, border controls, reform/tax/social policy, Stuttgart 21, media censorship, and economic conflict effects.

Status:

active

### Decision 036 - Add Tagesschau Finance And Technology Feeds For Wirtschaft Gaps

Decision:

Activate Tagesschau Finanzen and Tagesschau Technologie as free Wirtschaft sources.

Reason:

The reviewed candidate set is now broadly good, but Wirtschaft still lacks AI, major technology-company, and larger stock-market coverage. Tagesschau provides official RSS feeds for finance and technology, which are less likely to be company-marketing content than a vendor-owned AI blog.

Tradeoff:

Additional active feeds can increase raw volume and may introduce duplicate market or technology stories.

Consequence:

`src/data/feed-sources.ts` now includes the two active Tagesschau feeds. `src/lib/article-candidates.ts` boosts AI, chips, large tech companies, stock-market, and equities terms while clustering AI/chip and stock-market topics so only one top candidate per theme is selected when enough other strong Wirtschaft topics are available.

Status:

active

### Decision 037 - Boost Reviewed AI And Equity Economy Topics

Decision:

Boost reviewed Wirtschaft examples around AI governance, AI stocks, portfolio risk, Eurozone inflation, euro/dollar relevance, and tariff threats.

Reason:

After activating Tagesschau Finanzen and Technologie, the user confirmed that AI and larger stock-market news are interesting and marked several concrete examples as higher priority.

Tradeoff:

Market and AI stories can be frequent, so topic clustering must continue to prevent them from crowding out trade, macro, and energy candidates.

Consequence:

`src/lib/article-candidates.ts` now gives additional weight to reviewed AI/stock/euro/inflation examples and clusters currency and inflation items separately from generic stock-market and AI/chip topics.

Status:

active

### Decision 038 - Keep Raw Review Reset State Consistent

Decision:

The `/raw` review reset must clear both browser storage and all in-memory category review state.

Reason:

The review workflow depends on clean rounds. A bug allowed old ratings to be written back after reset when a category component still held stale React state and the user marked a new card.

Tradeoff:

The review tool remains browser-local and intentionally does not persist historical review sessions.

Consequence:

`RawFeedSection` listens for review update events and reloads current storage state. It also reads current `localStorage` before saving a new rating. `RawReviewSummary` clears its own state immediately on reset. A reset round now exports only ratings added after the reset.

Status:

active

## 2026-06-11

### Decision 039 - Add A Separate Phase-2 Candidate Dashboard Preview

Decision:

Add `/preview` as a small dashboard-like surface that shows at most 5 deterministic RSS candidates per category while keeping the existing Phase-1 dashboard unchanged.

Reason:

The candidate quality is strong enough to test a compact real-content experience, but the system does not yet create reviewed summaries or a finished Executive Briefing. A separate preview makes that boundary explicit.

Tradeoff:

Feed failures can leave a category without live candidates, and source excerpts are less polished than editorial summaries.

Consequence:

`/preview` fetches the existing free RSS sources, applies the current focus and diversity rules, and displays source metadata plus candidate reasons. If no live candidates are available for a category, it uses clearly labeled Phase-1 mock data. No AI, database, paid API, or persistence is added.

Status:

active

### Decision 040 - Enforce A 72-Hour Candidate Window

Decision:

Only articles with a valid publication date from the last 72 hours may enter the candidate set.

Reason:

The preview surfaced otherwise relevant Wirtschaft articles from June 2 and June 5 on June 11. The dashboard is intended as a current briefing, so older stories should not displace recent developments.

Tradeoff:

A category may temporarily show fewer than 5 live candidates. The labeled mock fallback is used when no live candidates remain.

Consequence:

`src/lib/article-candidates.ts` applies the hard freshness rule before scoring and diversity selection. Older items remain available in `/raw` for source inspection.

Status:

active

### Decision 041 - Treat Reuters As A Priority Source Pending Reliable Access

Decision:

Treat Reuters as a high-priority source for future Wirtschaft and Politik coverage, but do not activate an unofficial or unverified feed.

Reason:

Reuters provides important international, business, market, and technology reporting. Current public RSS endpoints tested for the project were unavailable, while direct website scraping would add reliability and reuse-term risks.

Tradeoff:

Some Reuters stories, such as major IPO or geopolitical developments, can remain missing from automated candidates until a permitted reliable source path is available.

Consequence:

Reuters examples guide topic tuning now, including major IPO/capital-market coverage. A direct Reuters integration remains source-development work and requires access and terms validation before activation.

Status:

active

### Decision 042 - Start Phase 3 In A Separate Briefing Preview

Decision:

Add `/briefing-preview` for AI-generated executive briefings while keeping the existing dashboard unchanged.

Reason:

Generated text needs a dedicated quality-review period before it can replace the curated Phase-1 experience.

Tradeoff:

The project temporarily has separate candidate and briefing preview surfaces.

Consequence:

The main dashboard is not replaced until the user explicitly approves the generated briefing quality.

Status:

active

### Decision 043 - Use One Daily Grounded OpenAI Generation Run

Decision:

Use deterministic candidate selection followed by one combined OpenAI request per day. Generate normally 3 and never more than 5 briefings per category.

Reason:

One daily request is sufficient for a morning briefing and keeps expected API cost within a small monthly budget. The model can translate English sources, synthesize multiple sources about the same event, and discard weak candidates.

Tradeoff:

Breaking news after the morning run is not reflected until the next day, and a single failed request affects all categories.

Consequence:

The default model is `gpt-5-mini`, the initial output limit was 8,000 tokens, and same-day automatic retries reuse the existing snapshot without another model request. Decision 050 later adds protected manual review runs, and Decision 051 raises the output allowance for longer detail reports. The OpenAI project should keep a budget alert near EUR 5, with the understanding that project budgets are soft thresholds rather than hard caps.

Status:

active

### Decision 044 - Store Only The Latest Briefing In Private Vercel Blob

Decision:

Store the last successful briefing snapshot as one private JSON object in Vercel Blob.

Reason:

Phase 3 needs durable daily output but not database queries, user records, or briefing history. A single private object is the smallest reliable persistence layer for this stage.

Tradeoff:

There is no history or rollback beyond the currently stored snapshot.

Consequence:

A failed run leaves the previous successful snapshot intact. It remains visible with a warning for up to 48 hours, after which the UI hides it and shows an error state. Storage is isolated behind a module so it can later move to a database.

Status:

active

### Decision 045 - Ground Briefing Sources Outside The Model

Decision:

The model returns only source article IDs. The server reconstructs source names, URLs, and publication times from the selected candidate set.

Reason:

Visible source attribution must not depend on model-generated URLs or names.

Tradeoff:

Any generated item without at least one valid candidate ID is discarded.

Consequence:

The stored snapshot contains only server-verified source references and transparently marks uncertainty.

Status:

active

### Decision 046 - Use A Dedicated Restricted OpenAI Project And Connected Private Blob Store

Decision:

Run the Phase-3 preview with a dedicated OpenAI project restricted to `gpt-5-mini`, a USD 5 monthly budget alert, sensitive Vercel secrets, and a private Vercel Blob Store connected directly to the deployment project.

Reason:

The preview needs production credentials and durable output without broad model access, a database, publicly readable briefing files, or secret values stored in the repository. A dedicated provider project also separates usage and cost from unrelated applications.

Tradeoff:

OpenAI project budgets are soft thresholds rather than hard caps, and the connected Vercel Blob setup depends on Vercel system environment variables. Operations therefore still require usage monitoring and a correctly connected deployment environment.

Consequence:

The OpenAI project `news-dashboard` allows only `gpt-5-mini`, has a USD 5 budget with 50% and 100% alerts, and uses a dedicated API key stored as sensitive `OPENAI_API_KEY`. Vercel stores only the latest snapshot in the private Frankfurt Blob Store `news-dashboard-briefings-blob`, accessed through `BLOB_STORE_ID`. `CRON_SECRET` is a separate sensitive random 32-byte secret that authorizes the daily endpoint. Production and Preview receive the configuration, and secret values must never be committed or shared.

Status:

active

## 2026-06-13

### Decision 047 - Enforce Briefing Diversity Before And After Generation

Decision:

Do not refill candidate slots with articles from an event cluster already selected, and validate generated output again for reused sources and duplicate or mixed event clusters.

Reason:

The first production run produced overlapping Nahost and Final4 briefings and mixed a SpaceX IPO reference into an unrelated DAX market report. Prompt instructions alone were not sufficient to preserve event boundaries.

Tradeoff:

Some categories may contain fewer than three briefings when the available source set lacks three strong, distinct events.

Consequence:

Candidate diversity remains strict, Final4 and IPO topics receive explicit event keys, source articles cannot be reused across generated items, and output that combines different known event clusters is discarded. Fewer strong items are preferred over filling the category with duplicates.

Status:

active

### Decision 048 - Reject Weak Attributed Claims And Require Exact Names

Decision:

Require names to be copied exactly from source material and discard high-uncertainty political items that rely on a single attributed report when no stronger grounding is available.

Reason:

The first production run combined person names incorrectly and elevated a single-source military claim despite explicitly acknowledging that it lacked independent verification.

Tradeoff:

Some genuinely important breaking developments may be omitted until stronger reporting enters the feeds.

Consequence:

The prompt forbids combining name components or adding meta-comments, and the server rejects high-uncertainty single-source political claims with attribution language. The preview remains under quality review.

Status:

active

### Decision 049 - Keep The Daily Mini-Model Run After Initial Cost Validation

Decision:

Retain the single daily `gpt-5-mini` generation schedule after the first production usage measurement.

Reason:

The first two Responses API requests used 7,209 tokens and cost approximately USD 0.01 in total, which is well below the intended monthly budget.

Tradeoff:

The observed cost is only an early estimate and can increase if candidate payloads, generated output, or provider pricing change.

Consequence:

No additional cost optimization or reduced schedule is required now. Continue monitoring OpenAI Usage during quality iteration; the current observed rate projects to approximately USD 0.15-0.30 per month for one daily request.

Status:

active

### Decision 050 - Add Password-Protected Manual Full Refreshes

Decision:

Add a manual refresh control to the Phase-3 preview, protected by a separate admin password and limited to five attempts per Berlin calendar day without a cooldown.

Reason:

Quality iteration should not require waiting for the next morning cron run, while an unprotected endpoint would allow external callers to create avoidable OpenAI cost.

Tradeoff:

The application gains a second private Blob object and a small authentication surface. Failed attempts consume one daily slot even when no new report is saved.

Consequence:

`BRIEFING_ADMIN_PASSWORD` is stored as a sensitive Vercel variable. The client keeps it only in session storage, all categories refresh together, the previous report stays visible during generation, and any failure discards the complete new report. The private attempt state is stored at `briefings/manual-run-state.json`.

Status:

active

### Decision 051 - Separate Scan Cards From Detailed Briefing Routes

Decision:

Show up to five compact cards per category and move the full content to dedicated `/briefing-preview/[category]/[id]` routes.

Reason:

Fifteen full reports cannot be scanned in 2-3 minutes. Short cards preserve overview speed while individual reports can become more substantial.

Tradeoff:

Reading a full item requires one additional navigation step, and stored items need stable IDs, teasers, creation times, and relevance scores.

Consequence:

Detail reports target approximately 250-450 German words. Navigation uses browser history with a fallback to the preview root so it continues to work as an iPhone home-screen web app. The main dashboard remains unchanged until explicit quality approval.

Status:

active

### Decision 052 - Do Not Activate Reuters Without A Free Permitted Access Path

Decision:

Keep Reuters as a priority source gap but do not scrape reuters.com, guess RSS endpoints, or pay for a discovery service within the current phase.

Reason:

Reuters Connect is the official content marketplace, but the review did not identify a documented free official general-news API or stable feed. Reliability, attribution, reuse terms, and the EUR 5 monthly budget all matter.

Tradeoff:

Important Reuters-exclusive or Reuters-leading stories such as major capital-market events may remain missing from automated selection.

Consequence:

Reuters remains inactive until a stable, free, explicitly permitted mechanism is verified. Direct Reuters links can still guide editorial review and reveal coverage gaps.

Status:

active
