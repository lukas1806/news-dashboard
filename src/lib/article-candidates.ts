import type { NewsCategory } from "@/types/news";
import type { CandidateArticle, LiveArticle } from "@/types/source";

const MAX_CANDIDATES_PER_CATEGORY = 5;

type CandidateRule = {
  terms: string[];
  score: number;
  reason: string;
};

const sourceScores: Record<string, { score: number; reason: string }> = {
  "tagesschau-weltwirtschaft": { score: 14, reason: "starke Weltwirtschaftsquelle" },
  "ecb-press": { score: 12, reason: "primäre Zentralbankquelle" },
  "federal-reserve-press": { score: 12, reason: "primäre Zentralbankquelle" },
  "deutschlandfunk-nachrichten": { score: 8, reason: "verlässliche Politikquelle" },
  "tagesschau-alle-meldungen": { score: 7, reason: "breite Nachrichtenquelle" },
  "handball-world": { score: 7, reason: "Fachquelle Handball" },
};

const categoryRules: Record<NewsCategory, CandidateRule[]> = {
  wirtschaft: [
    {
      terms: ["china", "usa", "vereinigte staaten", "russland", "europa", "eurozone", "eu", "weltwirtschaft"],
      score: 16,
      reason: "internationaler Wirtschaftskontext",
    },
    {
      terms: ["ki", "künstliche intelligenz", "artificial intelligence", "nvidia", "microsoft", "apple", "google", "amazon", "meta"],
      score: 14,
      reason: "KI oder großer Tech-Konzern",
    },
    {
      terms: ["leitzins", "zinsentscheidung", "zinssenkung", "zinserhöhung", "interest rate", "federal funds rate"],
      score: 20,
      reason: "Zentralbank-Zinsentscheidung",
    },
    {
      terms: ["handel", "zoll", "zölle", "zollabkommen", "export", "import", "inflation", "konjunktur", "wachstum", "rezession"],
      score: 14,
      reason: "Handel oder makroökonomische Relevanz",
    },
    {
      terms: ["auto", "autos", "automesse", "peking", "flugbenzin", "telekommunikationsnetze", "digitalministerium", "milliardeninvestitionen"],
      score: 12,
      reason: "Industrie- oder Infrastrukturrelevanz",
    },
  ],
  politik: [
    {
      terms: ["bundestag", "bundesregierung", "kanzler", "koalition", "minister", "regierung"],
      score: 13,
      reason: "bundespolitische Relevanz",
    },
    {
      terms: ["eu", "europa", "nato", "ukraine", "russland", "china", "usa", "vereinigte staaten", "iran", "israel", "naher osten"],
      score: 15,
      reason: "internationale oder geopolitische Relevanz",
    },
    {
      terms: ["krieg", "sanktionen", "sicherheit", "verteidigung", "migration", "haushalt", "grenzkontrollen", "zensurvorgaben"],
      score: 10,
      reason: "strategisches Politikthema",
    },
    {
      terms: ["stuttgart 21", "bahnprojekt"],
      score: 11,
      reason: "großes Infrastrukturprojekt",
    },
  ],
  handball: [
    {
      terms: ["champions league", "ehf", "final four", "cl-final4"],
      score: 22,
      reason: "internationaler Spitzenwettbewerb",
    },
    {
      terms: ["abstieg", "klassenerhalt", "abstiegskampf"],
      score: 16,
      reason: "Abstiegskampf",
    },
    {
      terms: ["füchse", "berlin", "magdeburg", "flensburg", "kiel", "thw", "melsungen", "gidsel"],
      score: 14,
      reason: "Topteam oder Schlüsselspieler",
    },
    {
      terms: ["saison", "lizenz", "wechsel", "trainer", "kader", "tabelle", "jicha", "europapokal", "restart", "totalschaden"],
      score: 13,
      reason: "strukturelle Saisonentwicklung",
    },
    {
      terms: ["statistiken", "top-torschützen", "top-torhüter", "krone", "ludwig auf der eins"],
      score: 15,
      reason: "Ligaweite Einordnung",
    },
    {
      terms: ["diese mannschaften spielen nächste saison", "spielt nicht im europapokal", "wollen revanche", "wie geht es in kiel mit jicha"],
      score: 16,
      reason: "review-bestätigtes Handball-Topthema",
    },
  ],
};

const handballMatchReportTerms = [
  "spielbericht",
  "ticker",
  "sieg gegen",
  "niederlage gegen",
  "gewann gegen",
  "verliert gegen",
];

const handballLowerPriorityTerms = [
  "58. spielminute",
  "ewige hbl-torschützenliste",
  "erst harmlos, dann dominant",
  "stuttgart besiegt erlangen",
  "möstl verdirbt",
  "bilyk-abschied",
  "hsv hamburg nach der pause",
  "christophersen über hannover-saison",
  "natürlich nicht zufrieden",
  "trotz klassenerhalt",
  "verlässt wetzlar",
];

export function selectArticleCandidates(
  category: NewsCategory,
  articles: LiveArticle[],
  limit = MAX_CANDIDATES_PER_CATEGORY,
): CandidateArticle[] {
  return articles
    .map((article) => scoreArticleCandidate(category, article))
    .filter((article) => article.candidateScore > 0)
    .sort(sortCandidates)
    .slice(0, limit);
}

function scoreArticleCandidate(category: NewsCategory, article: LiveArticle): CandidateArticle {
  const haystack = articleText(article);
  const reasons = new Set<string>();
  let score = 0;

  const sourceScore = sourceScores[article.sourceId];
  if (sourceScore) {
    score += sourceScore.score;
    reasons.add(sourceScore.reason);
  }

  for (const rule of categoryRules[category]) {
    if (containsAny(haystack, rule.terms)) {
      score += rule.score;
      reasons.add(rule.reason);
    }
  }

  const freshnessScore = getFreshnessScore(article.publishedAt);
  if (freshnessScore > 0) {
    score += freshnessScore;
    reasons.add(freshnessScore >= 8 ? "sehr frisch" : "aktuell");
  }

  if (category === "handball" && containsAny(haystack, handballMatchReportTerms)) {
    score -= 8;
    reasons.add("Matchbericht-Abzug");
  }

  if (category === "handball" && containsAny(haystack, handballLowerPriorityTerms)) {
    score -= 14;
    reasons.add("Review-Abzug");
  }

  return {
    ...article,
    candidateScore: Math.max(0, score),
    candidateReasons: Array.from(reasons),
  };
}

function sortCandidates(a: CandidateArticle, b: CandidateArticle): number {
  if (b.candidateScore !== a.candidateScore) {
    return b.candidateScore - a.candidateScore;
  }

  return new Date(b.publishedAt ?? 0).getTime() - new Date(a.publishedAt ?? 0).getTime();
}

function getFreshnessScore(publishedAt: string | undefined): number {
  if (!publishedAt) {
    return 0;
  }

  const ageMs = Date.now() - new Date(publishedAt).getTime();
  const ageHours = ageMs / (1000 * 60 * 60);

  if (ageHours <= 36) {
    return 8;
  }

  if (ageHours <= 24 * 7) {
    return 4;
  }

  return 0;
}

function articleText(article: LiveArticle): string {
  return [article.title, article.excerpt, article.url, article.sourceName].filter(Boolean).join(" ").toLowerCase();
}

function containsAny(value: string, terms: string[]): boolean {
  return terms.some((term) => value.includes(term));
}
