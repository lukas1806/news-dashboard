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
