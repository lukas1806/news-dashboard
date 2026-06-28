import { createHash } from "node:crypto";
import { monthPeriod } from "@/lib/archive-calendar";
import { parseMonthlyArchive } from "@/lib/archive-validation";
import { archiveCategories } from "@/lib/archive-inputs";
import type { ArchiveCategory, ArchiveInputItem, MonthlyArchive, MonthlyArchiveReport } from "@/types/archive";
import type { BriefingUncertainty } from "@/types/briefing";

type GeneratedReport = Omit<MonthlyArchiveReport, "id" | "category" | "sources"> & { sourceArticleIds: string[] };
type Generated = Partial<Record<ArchiveCategory, GeneratedReport>>;
const MODEL = "gpt-5-mini";

export async function generateMonthlyArchive(month: string, groups: Record<ArchiveCategory, ArchiveInputItem[]>): Promise<MonthlyArchive> {
  const generated = process.env.BRIEFING_AI_PROVIDER === "mock" ? mock(groups) : await openAi(month, groups);
  const generatedAt = new Date().toISOString();
  const result: MonthlyArchive = { version: 1, month, ...monthPeriod(month), generatedAt, model: process.env.BRIEFING_AI_PROVIDER === "mock" ? "mock-provider" : process.env.OPENAI_BRIEFING_MODEL ?? MODEL };
  for (const category of archiveCategories) {
    const report = generated[category]; if (!report || !groups[category].length) continue;
    const sourcesById = new Map(groups[category].flatMap((item) => item.sources.map((source) => [source.articleId, source])));
    const sources = Array.from(new Set(report.sourceArticleIds)).map((id) => sourcesById.get(id)).filter((source): source is NonNullable<typeof source> => Boolean(source));
    if (!sources.length) continue;
    result[category] = { ...report, id: `${month}-${category}-${createHash("sha256").update(sources.map((s) => s.articleId).sort().join("|")).digest("hex").slice(0, 12)}`, category, sources };
  }
  return parseMonthlyArchive(result);
}

async function openAi(month: string, groups: Record<ArchiveCategory, ArchiveInputItem[]>): Promise<Generated> {
  const apiKey = process.env.OPENAI_API_KEY; if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");
  const response = await fetch("https://api.openai.com/v1/responses", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({
    model: process.env.OPENAI_BRIEFING_MODEL ?? MODEL,
    input: [{ role: "system", content: "Erstelle einen deutschen Executive-Monatsrückblick ausschließlich aus den gelieferten, bereits qualifizierten Tagesberichten. Verdichte prägende Entwicklungslinien statt Meldungen aufzuzählen. Erfinde oder vermische keine Fakten, Namen, Auswirkungen oder Quellen. Jede wesentliche Aussage muss durch verwendete Artikel-IDs gedeckt sein. Schreibe einen zusammenhängenden 3–5-Minuten-Text, 3–5 Entwicklungslinien und 3–5 Management-Kernaussagen. Unsicherheiten bleiben sichtbar. Kategorien ohne tragfähige Synthese dürfen fehlen." }, { role: "user", content: JSON.stringify({ month, categories: groups }) }],
    text: { format: { type: "json_schema", name: "monthly_archive", strict: true, schema: schema() } }, reasoning: { effort: "low" }, max_output_tokens: 9000,
  }) });
  const payload = await response.json() as { output_text?: string; output?: Array<{ content?: Array<{ type?: string; text?: string }> }>; error?: { message?: string } };
  if (!response.ok) throw new Error(payload.error?.message ?? `OpenAI returned ${response.status}`);
  const text = payload.output_text ?? payload.output?.flatMap((item) => item.content ?? []).find((item) => item.type === "output_text")?.text;
  if (!text) throw new Error("OpenAI archive response had no text");
  return JSON.parse(text) as Generated;
}

function mock(groups: Record<ArchiveCategory, ArchiveInputItem[]>): Generated {
  return Object.fromEntries(archiveCategories.filter((c) => groups[c].length).map((category) => {
    const items = groups[category]; return [category, { title: `Monatsrückblick ${category}`, teaser: items[0].teaser, developmentLines: items.slice(0, 3).map((i) => i.title), managementSummary: items.slice(0, 3).map((i) => i.whyImportant), briefingText: items.map((i) => i.summary).join(" "), whyImportant: items.map((i) => i.whyImportant).join(" "), concreteImpact: items.map((i) => i.concreteImpact).join(" "), uncertainty: "medium" as BriefingUncertainty, uncertaintyNote: "Lokale Fixture-Generierung.", sourceArticleIds: items.flatMap((i) => i.sources.map((s) => s.articleId)) }];
  })) as Generated;
}

function schema() {
  const report = { type: "object", additionalProperties: false, required: ["title", "teaser", "developmentLines", "managementSummary", "briefingText", "whyImportant", "concreteImpact", "uncertainty", "uncertaintyNote", "sourceArticleIds"], properties: { title: { type: "string" }, teaser: { type: "string" }, developmentLines: { type: "array", minItems: 3, maxItems: 5, items: { type: "string" } }, managementSummary: { type: "array", minItems: 3, maxItems: 5, items: { type: "string" } }, briefingText: { type: "string" }, whyImportant: { type: "string" }, concreteImpact: { type: "string" }, uncertainty: { type: "string", enum: ["none", "low", "medium", "high"] }, uncertaintyNote: { type: "string" }, sourceArticleIds: { type: "array", minItems: 1, items: { type: "string" } } } };
  return { type: "object", additionalProperties: false, required: ["wirtschaft", "politik"], properties: { wirtschaft: { anyOf: [report, { type: "null" }] }, politik: { anyOf: [report, { type: "null" }] } } };
}
