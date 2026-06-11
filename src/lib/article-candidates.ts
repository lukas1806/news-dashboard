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
  "tagesschau-finanzen": { score: 12, reason: "starke Finanzmarktquelle" },
  "tagesschau-technologie": { score: 12, reason: "starke Technologiequelle" },
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
      terms: [
        "ki",
        "künstliche intelligenz",
        "artificial intelligence",
        "chip",
        "chips",
        "halbleiter",
        "nvidia",
        "microsoft",
        "apple",
        "google",
        "alphabet",
        "amazon",
        "meta",
        "openai",
        "tesla",
        "anthropic",
        "ki-pause",
        "gefahren künstlicher intelligenz",
      ],
      score: 18,
      reason: "KI oder großer Tech-Konzern",
    },
    {
      terms: ["aktien", "börse", "dax", "nasdaq", "s&p", "wall street", "marktbericht", "börsen", "anleger", "tech-aktien", "chip-rally", "depot"],
      score: 18,
      reason: "Aktien- oder Börsenrelevanz",
    },
    {
      terms: ["leitzins", "zinsentscheidung", "zinssenkung", "zinserhöhung", "interest rate", "federal funds rate", "ezb-analyse", "euro gewinnt weltweit", "eurozone"],
      score: 20,
      reason: "Zentralbank oder Währungsrelevanz",
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
    {
      terms: ["raffinerie", "ostafrika", "afrikas reichster mann", "opec", "vereinigte arabische emirate", "stärker als erwartet"],
      score: 16,
      reason: "review-bestätigtes Wirtschaftstopthema",
    },
    {
      terms: [
        "euro gewinnt weltweit an bedeutung",
        "werden die usa zum risiko im depot",
        "inflation in der eurozone steigt",
        "anthropic für weltweite ki-pause",
        "usa drohen mit zusätzlichen zöllen",
      ],
      score: 16,
      reason: "review-bestätigtes Wirtschaftstopthema",
    },
  ],
  politik: [
    {
      terms: ["bundestag", "bundesregierung", "kanzler", "koalition", "minister", "regierung", "arbeitsministerin", "steuerreform", "entlastung"],
      score: 14,
      reason: "bundespolitische Relevanz",
    },
    {
      terms: ["eu", "europa", "nato", "ukraine", "russland", "china", "usa", "vereinigte staaten", "iran", "israel", "naher osten"],
      score: 15,
      reason: "internationale oder geopolitische Relevanz",
    },
    {
      terms: ["krieg", "sanktionen", "sicherheit", "verteidigung", "migration", "haushalt", "grenzkontrollen", "zensurvorgaben", "tanker", "golf von oman"],
      score: 12,
      reason: "strategisches Politikthema",
    },
    {
      terms: ["stuttgart 21", "bahnprojekt"],
      score: 11,
      reason: "großes Infrastrukturprojekt",
    },
    {
      terms: ["eu überweist", "milliarden an die ukraine", "angriffswelle", "vorsichtiges aufatmen", "auftragsschwund", "nahost- und zinssorgen"],
      score: 14,
      reason: "review-bestätigtes Politiktopthema",
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
      terms: ["saison", "lizenz", "wechsel", "trainer", "kader", "tabelle", "jicha", "europapokal", "restart", "totalschaden", "siewert", "parrondo"],
      score: 13,
      reason: "strukturelle Saisonentwicklung",
    },
    {
      terms: ["statistiken", "top-torschützen", "top-torhüter", "krone", "ludwig auf der eins"],
      score: 15,
      reason: "Ligaweite Einordnung",
    },
    {
      terms: [
        "diese mannschaften spielen nächste saison",
        "spielt nicht im europapokal",
        "wollen revanche",
        "wie geht es in kiel mit jicha",
        "siewert folgt bei melsungen",
      ],
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

const economyLowerPriorityTerms = [
  "rubel-rally",
  "putin zum problem",
  "hitze kostet deutschlands wirtschaft",
  "klimafolgen",
];

const politicsLowerPriorityTerms = [
  "digitalminister wildberger will mehr tempo",
  "ökosystem",
  "ozeane",
  "friedensgutachten",
  "militärische gewalt ist normales mittel",
  "drohnensichtungen",
  "millionenkosten für flugbranche",
  "xi jinping bei kim jong un",
  "nordkorea",
  "friedensforschungsinstitut",
  "sipri",
  "atomwaffen",
  "ukraine greift zug auf der krim",
  "ein toter",
  "weniger wasserverbrauch",
  "landwirtschaft",
];

export function selectArticleCandidates(
  category: NewsCategory,
  articles: LiveArticle[],
  limit = MAX_CANDIDATES_PER_CATEGORY,
): CandidateArticle[] {
  const sortedCandidates = articles
    .map((article) => scoreArticleCandidate(category, article))
    .filter((article) => article.candidateScore > 0)
    .sort(sortCandidates);

  return selectDiverseCandidates(category, sortedCandidates, limit);
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

  if (category === "wirtschaft" && containsAny(haystack, economyLowerPriorityTerms)) {
    score -= 10;
    reasons.add("Review-Abzug");
  }

  if (category === "politik" && containsAny(haystack, politicsLowerPriorityTerms)) {
    score -= 12;
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

function selectDiverseCandidates(category: NewsCategory, candidates: CandidateArticle[], limit: number): CandidateArticle[] {
  const selected: CandidateArticle[] = [];
  const selectedIds = new Set<string>();
  const selectedTitleKeys = new Set<string>();
  const selectedTopicKeys = new Set<string>();

  for (const candidate of candidates) {
    if (shouldSkipCandidate(category, candidate, selectedIds, selectedTitleKeys, selectedTopicKeys)) {
      continue;
    }

    selected.push(candidate);
    selectedIds.add(candidate.id);
    selectedTitleKeys.add(createTitleKey(candidate.title));

    const topicKey = getCandidateTopicKey(category, candidate);
    if (topicKey) {
      selectedTopicKeys.add(topicKey);
    }

    if (selected.length >= limit) {
      return selected;
    }
  }

  for (const candidate of candidates) {
    const titleKey = createTitleKey(candidate.title);

    if (selectedIds.has(candidate.id) || selectedTitleKeys.has(titleKey)) {
      continue;
    }

    selected.push(candidate);
    selectedIds.add(candidate.id);
    selectedTitleKeys.add(titleKey);

    if (selected.length >= limit) {
      return selected;
    }
  }

  return selected;
}

function shouldSkipCandidate(
  category: NewsCategory,
  candidate: CandidateArticle,
  selectedIds: Set<string>,
  selectedTitleKeys: Set<string>,
  selectedTopicKeys: Set<string>,
): boolean {
  if (selectedIds.has(candidate.id) || selectedTitleKeys.has(createTitleKey(candidate.title))) {
    return true;
  }

  const topicKey = getCandidateTopicKey(category, candidate);

  return Boolean(topicKey && selectedTopicKeys.has(topicKey));
}

function getCandidateTopicKey(category: NewsCategory, article: LiveArticle): string | undefined {
  const haystack = articleText(article);

  if (category === "wirtschaft") {
    return getEconomyTopicKey(haystack);
  }

  if (category === "politik") {
    return getPoliticsTopicKey(haystack);
  }

  if (category !== "handball") {
    return undefined;
  }

  if (containsAny(haystack, ["statistiken", "top-torschützen", "top-torhüter", "ewige hbl-torschützenliste"])) {
    return "handball-ligaweite-einordnung";
  }

  if (containsAny(haystack, ["diese mannschaften spielen nächste saison"])) {
    return "handball-champions-league-overview";
  }

  if (containsAny(haystack, ["jicha", "kiel", "thw", "europapokal", "restart", "totalschaden"])) {
    return "handball-team-kiel";
  }

  if (containsAny(haystack, ["füchse", "fuechse", "berlin", "gidsel"])) {
    return "handball-team-fuechse-berlin";
  }

  if (containsAny(haystack, ["magdeburg", "scm"])) {
    return "handball-team-magdeburg";
  }

  return undefined;
}

function getEconomyTopicKey(haystack: string): string | undefined {
  if (containsAny(haystack, ["zoll", "zölle", "zollabkommen", "handelspartner", "handelskonflikt", "trump-zölle"])) {
    return "wirtschaft-handel-zoelle";
  }

  if (containsAny(haystack, ["ki", "künstliche intelligenz", "artificial intelligence", "openai", "nvidia", "anthropic", "ki-pause", "chip", "chips", "halbleiter"])) {
    return "wirtschaft-ki-chips";
  }

  if (containsAny(haystack, ["aktien", "börse", "dax", "nasdaq", "s&p", "wall street", "marktbericht", "anleger", "tech-aktien", "chip-rally", "depot"])) {
    return "wirtschaft-boerse-aktien";
  }

  if (containsAny(haystack, ["euro gewinnt weltweit", "ezb-analyse", "dollar", "währungs", "waehrungs"])) {
    return "wirtschaft-waehrung-euro-dollar";
  }

  if (containsAny(haystack, ["inflation", "eurozone", "verbraucherpreise"])) {
    return "wirtschaft-inflation";
  }

  if (containsAny(haystack, ["china", "peking", "automesse", "deutsche autos", "faire wettbewerb", "wächst stärker als erwartet"])) {
    return "wirtschaft-china";
  }

  if (containsAny(haystack, ["iran-krieg", "flugbenzin", "opec", "vereinigte arabische emirate", "öl", "raffinerie", "ostafrika"])) {
    return "wirtschaft-energie-rohstoffe";
  }

  if (containsAny(haystack, ["rubel", "russland", "putin"])) {
    return "wirtschaft-russland-waehrung";
  }

  if (containsAny(haystack, ["klimafolgen", "hitze kostet", "deutschlands wirtschaft milliarden"])) {
    return "wirtschaft-klima-kosten";
  }

  if (containsAny(haystack, ["telekommunikationsnetze", "digitalministerium", "milliardeninvestitionen"])) {
    return "wirtschaft-infrastruktur";
  }

  return undefined;
}

function getPoliticsTopicKey(haystack: string): string | undefined {
  if (containsAny(haystack, ["iran", "israel", "naher osten", "golf von oman", "tanker", "angriffswelle", "vorsichtiges aufatmen"])) {
    return "politik-nahost-iran-israel";
  }

  if (containsAny(haystack, ["ukraine", "russischer angriffskrieg", "krim"])) {
    return "politik-ukraine";
  }

  if (containsAny(haystack, ["grenzkontrollen", "dpolg", "teggartz"])) {
    return "politik-grenzkontrollen";
  }

  if (containsAny(haystack, ["arbeitsministerin", "bas", "steuerreform", "entlastung der deutschen", "middelberg"])) {
    return "politik-reform-steuern-soziales";
  }

  if (containsAny(haystack, ["stuttgart 21", "bahnprojekt"])) {
    return "politik-infrastruktur-stuttgart21";
  }

  if (containsAny(haystack, ["auftragsschwund", "statistisches bundesamt", "marktbericht", "nahost- und zinssorgen"])) {
    return "politik-wirtschaftsfolgen";
  }

  if (containsAny(haystack, ["zensurvorgaben", "kriegsberichterstattung", "medien"])) {
    return "politik-medien-zensur";
  }

  if (containsAny(haystack, ["digitalminister", "modernisierung"])) {
    return "politik-digitalprozess";
  }

  return undefined;
}

function createTitleKey(title: string): string {
  return title
    .toLowerCase()
    .replace(/["'„“”‚‘’]/g, "")
    .replace(/[^a-z0-9äöüß]+/g, " ")
    .replace(/\b(der|die|das|ein|eine|und|oder|mit|nach|vor|zur|zum|im|in|am|an|auf)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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
  return terms.some((term) => {
    if (term.length > 2) {
      return value.includes(term);
    }

    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(^|[^a-z0-9äöüß])${escapedTerm}([^a-z0-9äöüß]|$)`).test(value);
  });
}
