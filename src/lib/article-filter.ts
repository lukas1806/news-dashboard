import type { NewsCategory } from "@/types/news";
import type { LiveArticle } from "@/types/source";

const politicsExcludeTerms = [
  "adfc",
  "fahrrad",
  "radfahrer",
  "radfahrerin",
  "kosovo",
  "sachsen",
  "oberbürgermeister",
  "lohntransparenz",
  "heizungsgesetz",
  "gebäudemodernisierungsgesetz",
  "junge union",
  "vorstoß der jungen union",
  "peru",
  "sportpolitik",
  "olympia",
  "religion",
  "tempel",
  "papst",
  "brand",
  "unfall",
  "kulturspeicher",
];

const handballExcludeTerms = ["frauen", "damen", "video", "slideshow"];

const handballFocusTerms = [
  "hbl",
  "bundesliga",
  "champions league",
  "abstieg",
  "klassenerhalt",
  "füchse",
  "berlin",
  "magdeburg",
  "flensburg",
  "kiel",
  "thw",
  "melsungen",
  "lemgo",
  "hannover",
  "gidsel",
];

const centralBankSourceIds = ["ecb-press", "federal-reserve-press"];

const centralBankRateDecisionTerms = [
  "interest rate decision",
  "interest rate decisions",
  "key interest rates",
  "monetary policy decision",
  "federal funds rate",
  "rate cut",
  "rate cuts",
  "rate hike",
  "rate hikes",
  "rate increase",
  "rate reduction",
  "leitzins",
  "zinsen",
  "zinsentscheidung",
  "zinssenkung",
  "zinserhöhung",
];

export function filterArticlesForFocus(category: NewsCategory, articles: LiveArticle[]): LiveArticle[] {
  return articles.filter((article) => isRelevantForCategory(category, article));
}

function isRelevantForCategory(category: NewsCategory, article: LiveArticle): boolean {
  const haystack = articleText(article);

  if (category === "wirtschaft" && centralBankSourceIds.includes(article.sourceId)) {
    return containsAny(haystack, centralBankRateDecisionTerms);
  }

  if (category === "politik") {
    return !containsAny(haystack, politicsExcludeTerms);
  }

  if (category === "handball") {
    if (containsAny(haystack, handballExcludeTerms)) {
      return false;
    }

    return containsAny(haystack, handballFocusTerms);
  }

  return true;
}

function articleText(article: LiveArticle): string {
  return [article.title, article.excerpt, article.url, article.sourceName].filter(Boolean).join(" ").toLowerCase();
}

function containsAny(value: string, terms: string[]): boolean {
  return terms.some((term) => value.includes(term));
}
