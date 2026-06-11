import { categories } from "@/lib/news";
import type { BriefingItem, BriefingSnapshot, BriefingUncertainty } from "@/types/briefing";
import type { NewsCategory } from "@/types/news";
import type { CandidateArticle } from "@/types/source";

type CandidateGroups = Record<NewsCategory, CandidateArticle[]>;

type GeneratedItem = {
  title: string;
  summary: string;
  whyImportant: string;
  concreteImpact: string;
  uncertainty: BriefingUncertainty;
  uncertaintyNote: string;
  sourceArticleIds: string[];
};

type GeneratedBriefing = Record<NewsCategory, GeneratedItem[]>;

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

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    model,
    categories: groundGeneratedBriefing(generated, candidateGroups),
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
            "Du erstellst ein knappes deutsches Executive News Briefing. Nutze ausschließlich die gelieferten Artikel. Erfinde keine Fakten oder Quellen. Fasse mehrere Artikel nur zusammen, wenn sie eindeutig dasselbe Ereignis behandeln. Verwirf Kandidaten mit zu wenig Substanz. Erzeuge normalerweise 3 eigenständige Briefings pro Kategorie und höchstens 5, wenn weitere Themen klar stark und voneinander verschieden sind. Jede Zusammenfassung soll 3 bis 5 informative Sätze enthalten. Markiere Unsicherheit transparent.",
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
      max_output_tokens: 8_000,
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

function groundGeneratedBriefing(generated: GeneratedBriefing, candidateGroups: CandidateGroups): Record<NewsCategory, BriefingItem[]> {
  return Object.fromEntries(
    categories.map(({ id: category }) => {
      const candidates = new Map(candidateGroups[category].map((candidate) => [candidate.id, candidate]));
      const items = generated[category]
        .slice(0, MAX_ITEMS_PER_CATEGORY)
        .map<BriefingItem | null>((item, index) => {
          const title = item.title.trim();
          const summary = item.summary.trim();
          const whyImportant = item.whyImportant.trim();
          const concreteImpact = item.concreteImpact.trim();
          const sources = Array.from(new Set(item.sourceArticleIds))
            .map((articleId) => candidates.get(articleId))
            .filter((article): article is CandidateArticle => Boolean(article?.publishedAt))
            .map((article) => ({
              articleId: article.id,
              name: article.sourceName,
              url: article.url,
              publishedAt: article.publishedAt as string,
            }));

          if (!title || !summary || !whyImportant || !concreteImpact || !sources.length) {
            return null;
          }

          return {
            id: `${category}-${Date.now()}-${index}`,
            category,
            title,
            summary,
            whyImportant,
            concreteImpact,
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

function createMockBriefing(candidateGroups: CandidateGroups): GeneratedBriefing {
  return Object.fromEntries(
    categories.map(({ id: category }) => [
      category,
      candidateGroups[category].slice(0, 3).map((candidate) => ({
        title: candidate.title,
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
    required: ["title", "summary", "whyImportant", "concreteImpact", "uncertainty", "uncertaintyNote", "sourceArticleIds"],
    properties: {
      title: { type: "string" },
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
