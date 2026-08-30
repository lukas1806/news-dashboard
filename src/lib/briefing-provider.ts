import { categories } from "@/lib/news";
import { createHash } from "node:crypto";
import type { BriefingItem, BriefingSnapshot, BriefingUncertainty } from "@/types/briefing";
import type { NewsCategory } from "@/types/news";
import type { CandidateArticle } from "@/types/source";

type CandidateGroups = Record<NewsCategory, CandidateArticle[]>;

export type GeneratedItem = {
  title: string;
  teaser: string;
  summary: string;
  whyImportant: string;
  concreteImpact: string;
  uncertainty: BriefingUncertainty;
  uncertaintyNote: string;
  sourceArticleIds: string[];
};

export type GeneratedBriefing = Record<NewsCategory, GeneratedItem[]>;

type GroundedGeneratedItem = {
  item: GeneratedItem;
  sources: CandidateArticle[];
};

type OpenAiResponse = {
  output_text?: string;
  output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
  error?: { message?: string };
};

const MAX_ITEMS_PER_CATEGORY = 5;
const MIN_ITEMS_PER_CATEGORY = 3;
const DEFAULT_MODEL = "gpt-5-mini";
const OPENAI_REQUEST_TIMEOUT_MS = 270_000;

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
  const timeout = setTimeout(() => controller.abort(), OPENAI_REQUEST_TIMEOUT_MS);

  let response: Response;

  try {
    response = await fetch("https://api.openai.com/v1/responses", {
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
              "Du erstellst ein deutsches Executive News Briefing aus RSS-Metadaten. Nutze ausschließlich Fakten, die im Titel oder Auszug der jeweils zugeordneten Artikel ausdrücklich stehen. Erfinde, ergänze oder extrapoliere keine Fakten, Namen, Ereignisse, Folgen oder Quellen. Wenn nur ein Nachname geliefert wird, verwende nur diesen Nachnamen und ergänze keinen Vornamen. Übernimm vollständige Personen- und Organisationsnamen exakt aus den zugeordneten Quellen; kombiniere niemals Namensbestandteile aus verschiedenen Artikeln. Behaupte keine Transfers, Vertragsfolgen, Sperren, Einschaltquoten, taktischen Details, Marktreaktionen oder anderen Auswirkungen, wenn sie nicht ausdrücklich im zugeordneten Titel oder Auszug stehen. Behandle pro Briefing genau ein Hauptereignis. Nebenthemen aus einem Artikel dürfen nicht in das Briefing zum Hauptereignis gemischt werden. Fasse mehrere Artikel nur zusammen, wenn sie eindeutig dasselbe konkrete Ereignis behandeln. Verwende denselben Artikel nicht für mehrere Briefings. Verwirf Kandidaten mit zu wenig Substanz und einseitige militärische Behauptungen ohne ausreichende Bestätigung. Erzeuge mindestens 3 und höchstens 5 eigenständige Briefings pro Kategorie, sofern mindestens 3 tragfähige Ereignisse geliefert wurden; bei fünf oder mehr tragfähigen Ereignissen sollen es fünf sein. Gib nur dann weniger als drei aus, wenn tatsächlich weniger als drei tragfähige Ereignisse geliefert wurden; fülle Texte und Listen niemals künstlich auf. Der Teaser ist genau ein kurzer, informativer Satz. Die Beschreibung soll 4 bis 7 knappe, belegte Sätze enthalten. Warum wichtig und konkrete Auswirkungen sollen jeweils 1 bis 2 vorsichtige Sätze umfassen und dürfen keine neuen Tatsachen behaupten. Ein Bericht soll typischerweise 120 bis 220 deutsche Wörter enthalten und in weniger als 5 Minuten lesbar sein. Schreibe redaktionell natürlich über den Bericht oder die Quelle; verwende im fertigen Text keine technischen Wörter wie RSS, Metadaten, Auszug, Exzerpt oder Exzerpttext. Markiere Unsicherheit transparent. Schreibe keine internen Anmerkungen oder Meta-Kommentare in den Text.",
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
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("OpenAI hat den vollständigen Report nicht innerhalb von 270 Sekunden geliefert. Der bisherige Report bleibt erhalten.");
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }

  const payload = (await response.json()) as OpenAiResponse;

  if (!response.ok) {
    throw new Error(payload.error?.message ?? `OpenAI returned ${response.status}`);
  }

  const outputText = extractOutputText(payload);
  return parseGeneratedBriefing(JSON.parse(outputText) as unknown);
}

export function groundGeneratedBriefing(
  generated: GeneratedBriefing,
  candidateGroups: CandidateGroups,
  generatedAt: string,
): Record<NewsCategory, BriefingItem[]> {
  return Object.fromEntries(
    categories.map(({ id: category }) => {
      const candidates = new Map(candidateGroups[category].map((candidate) => [candidate.id, candidate]));
      const usedSourceIds = new Set<string>();
      const generatedItems = generated[category]
        .slice(0, MAX_ITEMS_PER_CATEGORY)
        .map<GroundedGeneratedItem | null>((item) => {
          const sourceArticles = Array.from(new Set(item.sourceArticleIds))
            .map((articleId) => candidates.get(articleId))
            .filter((article): article is CandidateArticle => Boolean(article?.publishedAt));

          if (
            !sourceArticles.length ||
            sourceArticles.some((source) => usedSourceIds.has(source.id)) ||
            shouldRejectWeakClaim(category, item, sourceArticles) ||
            containsUnsupportedExpandedName(item, sourceArticles) ||
            containsWrongSport(category, item)
          ) {
            return null;
          }

          if (!item.title.trim() || !item.summary.trim() || !item.whyImportant.trim() || !item.concreteImpact.trim()) {
            return null;
          }

          sourceArticles.forEach((source) => usedSourceIds.add(source.id));

          return { item, sources: sourceArticles };
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

      return [category, fillMissingBriefings(category, generatedItems, candidateGroups[category])];
    }),
  ) as Record<NewsCategory, BriefingItem[]>;
}

/**
 * The model may deliberately omit otherwise sound reports when its longer
 * editorial format cannot be supported by a short RSS excerpt. Keep the
 * dashboard useful in that case by showing source-grounded, explicitly
 * labelled compact reports. They still use the same scored, fresh and diverse
 * candidate selection as AI-generated reports.
 */
function fillMissingBriefings(
  category: NewsCategory,
  items: BriefingItem[],
  candidates: CandidateArticle[],
): BriefingItem[] {
  if (category === "handball" || items.length >= MIN_ITEMS_PER_CATEGORY || candidates.length < MIN_ITEMS_PER_CATEGORY) {
    return items;
  }

  const selected = [...items];
  const usedSourceIds = new Set(items.flatMap((item) => item.sources.map((source) => source.articleId)));

  for (const candidate of candidates) {
    if (selected.length >= MIN_ITEMS_PER_CATEGORY) {
      break;
    }

    if (usedSourceIds.has(candidate.id) || !isSuitableFallbackCandidate(category, candidate)) {
      continue;
    }

    selected.push(createSourceGroundedFallback(category, candidate));
    usedSourceIds.add(candidate.id);
  }

  return selected;
}

function isSuitableFallbackCandidate(category: NewsCategory, candidate: CandidateArticle): boolean {
  if (category !== "politik") {
    return true;
  }

  const text = [candidate.title, candidate.excerpt].filter(Boolean).join(" ").toLowerCase();
  return !containsAny(text, [
    "militär meldet",
    "militaer meldet",
    "verteidigungsministerium berichtet",
    "nach angaben des militärs",
    "nach angaben des militaers",
  ]);
}

function createSourceGroundedFallback(category: NewsCategory, candidate: CandidateArticle): BriefingItem {
  const excerpt = candidate.excerpt?.trim();

  return {
    id: createBriefingItemId(category, [candidate]),
    category,
    title: candidate.title.trim(),
    teaser: excerpt?.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim() || candidate.title.trim(),
    summary: excerpt || "Die Quelle liefert zu dieser aktuellen Meldung keinen weiteren Auszug.",
    whyImportant: candidate.candidateReasons.slice(0, 2).join(" und ") || "Als aktuelle, relevante Meldung ausgewählt.",
    concreteImpact: "Die weitere Entwicklung sollte beobachtet werden; die Einordnung basiert auf einer einzelnen Quelle.",
    createdAt: new Date().toISOString(),
    relevanceScore: Math.min(100, candidate.candidateScore),
    uncertainty: "medium",
    uncertaintyNote: "Kompakte Quellenvorschau: Diese Meldung wurde noch nicht ausführlich durch die KI verdichtet.",
    sources: [{
      articleId: candidate.id,
      name: candidate.sourceName,
      url: candidate.url,
      publishedAt: candidate.publishedAt as string,
    }],
  };
}

function createBriefingItemId(category: NewsCategory, sources: CandidateArticle[]): string {
  const sourceKey = sources.map((source) => source.id).sort().join("|");
  const digest = createHash("sha256").update(`${category}|${sourceKey}`).digest("hex").slice(0, 16);
  return `${category}-${digest}`;
}

function shouldRejectWeakClaim(category: NewsCategory, item: GeneratedItem, sources: CandidateArticle[]): boolean {
  if (category !== "politik" || sources.length !== 1) {
    return false;
  }

  const text = [sources[0].title, sources[0].excerpt].filter(Boolean).join(" ").toLowerCase();
  const uncertaintyText = item.uncertaintyNote.toLowerCase();
  const explicitlyUnconfirmed = containsAny(uncertaintyText, [
    "keine unabhängige bestätigung",
    "keine unabhängigen bestätigungen",
    "nicht unabhängig bestätigt",
    "bestätigung fehlt",
    "bestätigungen sind im auszug nicht angegeben",
    "keine unabhängigen details",
  ]) || (uncertaintyText.includes("unabhängig") && containsAny(uncertaintyText, ["keine", "fehlt", "fehlen", "nicht vorhanden"]));

  return explicitlyUnconfirmed || (item.uncertainty === "high" && containsAny(text, ["meldet", "nach angaben", "teilte mit", "berichtet", "zufolge"]));
}

function containsUnsupportedExpandedName(item: GeneratedItem, sources: CandidateArticle[]): boolean {
  const sourceText = normalizeWords(sources.flatMap((source) => [source.title, source.excerpt ?? ""]).join(" "));
  const generatedText = [item.title, item.teaser, item.summary, item.whyImportant, item.concreteImpact].join(" ");
  const ignoredFirstWords = new Set([
    "der", "die", "das", "ein", "eine", "im", "nach", "vor", "trainer", "präsident", "premierminister",
    "innenminister", "bundeskanzler", "us", "usa", "eu", "ezb", "ehf", "sg", "mt", "fc", "sc",
  ]);

  for (const match of generatedText.matchAll(/\b([A-ZÄÖÜ][A-Za-zÄÖÜäöüß'’-]+)\s+([A-ZÄÖÜ][A-Za-zÄÖÜäöüß'’-]+)\b/g)) {
    const first = normalizeWords(match[1]);
    const second = normalizeWords(match[2]);
    if (ignoredFirstWords.has(first) || !sourceText.split(" ").includes(second)) {
      continue;
    }

    if (!sourceText.includes(`${first} ${second}`)) {
      return true;
    }
  }

  return false;
}

function containsWrongSport(category: NewsCategory, item: GeneratedItem): boolean {
  if (category !== "handball") {
    return false;
  }

  return containsAny(
    [item.title, item.teaser, item.summary, item.whyImportant, item.concreteImpact].join(" ").toLowerCase(),
    ["fußball", "fussball"],
  );
}

function normalizeWords(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9äöüß]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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
