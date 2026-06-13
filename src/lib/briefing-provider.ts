import { categories } from "@/lib/news";
import { createHash } from "node:crypto";
import type { BriefingItem, BriefingSnapshot, BriefingUncertainty } from "@/types/briefing";
import type { NewsCategory } from "@/types/news";
import type { CandidateArticle } from "@/types/source";

type CandidateGroups = Record<NewsCategory, CandidateArticle[]>;

type GeneratedItem = {
  title: string;
  teaser: string;
  summary: string;
  whyImportant: string;
  concreteImpact: string;
  uncertainty: BriefingUncertainty;
  uncertaintyNote: string;
  sourceArticleIds: string[];
};

type GeneratedBriefing = Record<NewsCategory, GeneratedItem[]>;

type GroundedGeneratedItem = {
  item: GeneratedItem;
  sources: CandidateArticle[];
  eventKey?: string;
};

type OpenAiResponse = {
  output_text?: string;
  output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
  error?: { message?: string };
};

const MAX_ITEMS_PER_CATEGORY = 5;
const DEFAULT_MODEL = "gpt-5-mini";

export async function generateBriefingSnapshot(candidateGroups: CandidateGroups): Promise<BriefingSnapshot> {
  const provider = process.env.BRIEFING_AI_PROVIDER ?? (process.env.NODE_ENV === "production" ? "openai" : "mock");

  if (provider !== "openai" && provider !== "mock") {
    throw new Error(`Unknown briefing AI provider: ${provider}`);
  }

  const generated = provider === "mock" ? createMockBriefing(candidateGroups) : await generateOpenAiBriefing(candidateGroups);
  const model = provider === "mock" ? "mock-provider" : process.env.OPENAI_BRIEFING_MODEL ?? DEFAULT_MODEL;

  const generatedAt = new Date().toISOString();

  return {
    version: 1,
    generatedAt,
    model,
    categories: groundGeneratedBriefing(generated, candidateGroups, generatedAt),
  };
}

async function generateOpenAiBriefing(candidateGroups: CandidateGroups): Promise<GeneratedBriefing> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55_000);

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_BRIEFING_MODEL ?? DEFAULT_MODEL,
      input: [
        {
          role: "system",
          content:
            "Du erstellst ein deutsches Executive News Briefing. Nutze ausschließlich ausdrücklich in den gelieferten Artikeln enthaltene Fakten. Erfinde, ergänze oder extrapoliere keine Fakten, Namen, Ereignisse oder Quellen. Übernimm Personen- und Organisationsnamen exakt aus den Quellen; kombiniere niemals Namensbestandteile. Behandle pro Briefing genau ein Hauptereignis. Nebenthemen aus einem Marktbericht, etwa ein IPO, dürfen nicht in das Briefing zum Hauptereignis gemischt werden. Erzeuge ein Nebenthema nur als eigenes Briefing, wenn ein gelieferter Artikel dieses Thema selbst als Hauptereignis behandelt. Fasse mehrere Artikel nur zusammen, wenn sie eindeutig dasselbe konkrete Ereignis behandeln. Verwende denselben Artikel nicht für mehrere Briefings. Verwirf Kandidaten mit zu wenig Substanz, bloße Tagesmarktberichte und einseitige militärische Behauptungen ohne ausreichende Bestätigung. Strebe 5 eigenständige Briefings pro Kategorie an, aber erzeuge lieber weniger als schwache, doppelte oder gemischte Meldungen. Der Teaser ist genau ein kurzer, informativer Satz für die Übersicht. Die Beschreibung soll 6 bis 9 informative Sätze enthalten. Warum wichtig und konkrete Auswirkungen sollen jeweils 2 bis 3 gehaltvolle Sätze umfassen. Ein vollständiger Detailbericht soll ungefähr 250 bis 450 deutsche Wörter enthalten und in weniger als 5 Minuten lesbar sein. Markiere Unsicherheit transparent. Schreibe keine internen Anmerkungen oder Meta-Kommentare in den Text.",
        },
        {
          role: "user",
          content: JSON.stringify(candidateGroups),
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "daily_executive_briefing",
          strict: true,
          schema: createBriefingSchema(),
        },
      },
      reasoning: { effort: "low" },
      max_output_tokens: 14_000,
    }),
    signal: controller.signal,
  }).finally(() => clearTimeout(timeout));

  const payload = (await response.json()) as OpenAiResponse;

  if (!response.ok) {
    throw new Error(payload.error?.message ?? `OpenAI returned ${response.status}`);
  }

  const outputText = extractOutputText(payload);
  return parseGeneratedBriefing(JSON.parse(outputText) as unknown);
}

function groundGeneratedBriefing(
  generated: GeneratedBriefing,
  candidateGroups: CandidateGroups,
  generatedAt: string,
): Record<NewsCategory, BriefingItem[]> {
  return Object.fromEntries(
    categories.map(({ id: category }) => {
      const candidates = new Map(candidateGroups[category].map((candidate) => [candidate.id, candidate]));
      const usedSourceIds = new Set<string>();
      const usedEventKeys = new Set<string>();
      const items = generated[category]
        .slice(0, MAX_ITEMS_PER_CATEGORY)
        .map<GroundedGeneratedItem | null>((item) => {
          const sourceArticles = Array.from(new Set(item.sourceArticleIds))
            .map((articleId) => candidates.get(articleId))
            .filter((article): article is CandidateArticle => Boolean(article?.publishedAt));
          const eventKeys = new Set(sourceArticles.map((article) => getBriefingEventKey(category, article)).filter(Boolean));

          if (
            !sourceArticles.length ||
            sourceArticles.some((source) => usedSourceIds.has(source.id)) ||
            eventKeys.size > 1 ||
            shouldRejectWeakClaim(category, item, sourceArticles)
          ) {
            return null;
          }

          const eventKey = Array.from(eventKeys)[0];
          if (eventKey && usedEventKeys.has(eventKey)) {
            return null;
          }

          if (!item.title.trim() || !item.summary.trim() || !item.whyImportant.trim() || !item.concreteImpact.trim()) {
            return null;
          }

          sourceArticles.forEach((source) => usedSourceIds.add(source.id));
          if (eventKey) {
            usedEventKeys.add(eventKey);
          }

          return { item, sources: sourceArticles, eventKey };
        })
        .filter((item): item is GroundedGeneratedItem => item !== null)
        .map<BriefingItem | null>(({ item, sources: sourceArticles }) => {
          const title = item.title.trim();
          const teaser = item.teaser.trim();
          const summary = item.summary.trim();
          const whyImportant = item.whyImportant.trim();
          const concreteImpact = item.concreteImpact.trim();
          const sources = sourceArticles.map((article) => ({
              articleId: article.id,
              name: article.sourceName,
              url: article.url,
              publishedAt: article.publishedAt as string,
            }));

          if (!title || !teaser || !summary || !whyImportant || !concreteImpact || !sources.length) {
            return null;
          }

          const relevanceScore = Math.min(100, Math.max(...sourceArticles.map((article) => article.candidateScore)));

          return {
            id: createBriefingItemId(category, sourceArticles),
            category,
            title,
            teaser,
            summary,
            whyImportant,
            concreteImpact,
            createdAt: generatedAt,
            relevanceScore,
            uncertainty: item.uncertainty,
            ...(item.uncertaintyNote.trim() ? { uncertaintyNote: item.uncertaintyNote.trim() } : {}),
            sources,
          } satisfies BriefingItem;
        })
        .filter((item): item is BriefingItem => item !== null);

      return [category, items];
    }),
  ) as Record<NewsCategory, BriefingItem[]>;
}

function createBriefingItemId(category: NewsCategory, sources: CandidateArticle[]): string {
  const sourceKey = sources.map((source) => source.id).sort().join("|");
  const digest = createHash("sha256").update(`${category}|${sourceKey}`).digest("hex").slice(0, 16);
  return `${category}-${digest}`;
}

function getBriefingEventKey(category: NewsCategory, article: CandidateArticle): string | undefined {
  const text = [article.title, article.excerpt].filter(Boolean).join(" ").toLowerCase();
  const title = article.title.toLowerCase();

  if (category === "wirtschaft") {
    if (containsAny(title, ["ipo", "börsengang", "spacex"])) return "wirtschaft-ipo";
    if (containsAny(text, ["zoll", "zölle", "handelskonflikt"])) return "wirtschaft-zoelle";
    if (containsAny(text, ["leitzins", "zinswende", "zinserhöhung", "zinssenkung", "ezb"])) return "wirtschaft-zinsen";
    if (containsAny(text, ["marktbericht", "dax", "wall street", "börsen"])) return "wirtschaft-marktbericht";
  }

  if (category === "politik") {
    if (containsAny(text, ["straße von hormus", "strasse von hormus", "golf von oman", "schifffahrt"])) return "politik-hormus";
    if (containsAny(text, ["iran", "israel", "nahost", "waffenruhe", "friedensabkommen"])) return "politik-nahost";
    if (containsAny(text, ["ukraine", "russland", "russisch", "drohnen"])) return "politik-ukraine-russland";
  }

  if (category === "handball") {
    if (containsAny(text, ["final4", "final four", "lanxess arena"])) return "handball-final4";
    if (containsAny(text, ["torschützenliste", "top-torschützen", "top-torhüter", "statistik"])) return "handball-statistik";
  }

  return undefined;
}

function shouldRejectWeakClaim(category: NewsCategory, item: GeneratedItem, sources: CandidateArticle[]): boolean {
  if (category !== "politik" || item.uncertainty !== "high" || sources.length !== 1) {
    return false;
  }

  const text = [sources[0].title, sources[0].excerpt].filter(Boolean).join(" ").toLowerCase();
  return containsAny(text, ["meldet", "nach angaben", "teilte mit", "berichtet", "zufolge"]);
}

function containsAny(value: string, terms: string[]): boolean {
  return terms.some((term) => value.includes(term));
}

function createMockBriefing(candidateGroups: CandidateGroups): GeneratedBriefing {
  return Object.fromEntries(
    categories.map(({ id: category }) => [
      category,
      candidateGroups[category].slice(0, 5).map((candidate) => ({
        title: candidate.title,
        teaser: candidate.excerpt?.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim() || candidate.title,
        summary: candidate.excerpt
          ? `${candidate.excerpt} Diese lokale Vorschau nutzt den vorhandenen Quellenauszug und noch keine KI-generierte Einordnung.`
          : "Für diese lokale Vorschau liegt nur der Quellentitel vor. Eine KI-generierte Zusammenfassung wurde nicht erzeugt.",
        whyImportant: candidate.candidateReasons.slice(0, 2).join(" und ") || "Der Artikel wurde von der Candidate-Logik ausgewählt.",
        concreteImpact: "Die konkrete Auswirkung wird erst im produktiven OpenAI-Lauf bewertet.",
        uncertainty: "medium" as const,
        uncertaintyNote: "Lokaler Mock-Provider: Inhalt wurde nicht durch ein KI-Modell verdichtet.",
        sourceArticleIds: [candidate.id],
      })),
    ]),
  ) as GeneratedBriefing;
}

function createBriefingSchema() {
  const itemSchema = {
    type: "object",
    additionalProperties: false,
    required: ["title", "teaser", "summary", "whyImportant", "concreteImpact", "uncertainty", "uncertaintyNote", "sourceArticleIds"],
    properties: {
      title: { type: "string" },
      teaser: { type: "string" },
      summary: { type: "string" },
      whyImportant: { type: "string" },
      concreteImpact: { type: "string" },
      uncertainty: { type: "string", enum: ["none", "low", "medium", "high"] },
      uncertaintyNote: { type: "string" },
      sourceArticleIds: { type: "array", minItems: 1, items: { type: "string" } },
    },
  };

  return {
    type: "object",
    additionalProperties: false,
    required: categories.map(({ id }) => id),
    properties: Object.fromEntries(
      categories.map(({ id }) => [id, { type: "array", maxItems: MAX_ITEMS_PER_CATEGORY, items: itemSchema }]),
    ),
  };
}

function extractOutputText(payload: OpenAiResponse): string {
  if (payload.output_text) {
    return payload.output_text;
  }

  for (const output of payload.output ?? []) {
    for (const content of output.content ?? []) {
      if (content.type === "output_text" && content.text) {
        return content.text;
      }
    }
  }

  throw new Error("OpenAI response did not contain structured output");
}

function parseGeneratedBriefing(value: unknown): GeneratedBriefing {
  if (!isRecord(value)) {
    throw new Error("OpenAI returned invalid briefing JSON");
  }

  return Object.fromEntries(
    categories.map(({ id }) => {
      const items = value[id];

      if (!Array.isArray(items)) {
        throw new Error(`OpenAI omitted category ${id}`);
      }

      return [id, items.map(parseGeneratedItem)];
    }),
  ) as GeneratedBriefing;
}

function parseGeneratedItem(value: unknown): GeneratedItem {
  if (
    !isRecord(value) ||
    !isString(value.title) ||
    !isString(value.teaser) ||
    !isString(value.summary) ||
    !isString(value.whyImportant) ||
    !isString(value.concreteImpact) ||
    !isUncertainty(value.uncertainty) ||
    !isString(value.uncertaintyNote) ||
    !Array.isArray(value.sourceArticleIds) ||
    !value.sourceArticleIds.every(isString)
  ) {
    throw new Error("OpenAI returned an invalid briefing item");
  }

  return {
    title: value.title,
    teaser: value.teaser,
    summary: value.summary,
    whyImportant: value.whyImportant,
    concreteImpact: value.concreteImpact,
    uncertainty: value.uncertainty,
    uncertaintyNote: value.uncertaintyNote,
    sourceArticleIds: value.sourceArticleIds,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isUncertainty(value: unknown): value is BriefingUncertainty {
  return value === "none" || value === "low" || value === "medium" || value === "high";
}
