import type { NewsCategory } from "@/types/news";
import type { LiveArticle } from "@/types/source";

const politicsExcludeTerms = [
  "kosovo",
  "sachsen",
  "oberbürgermeister",
  "lohntransparenz",
  "heizungsgesetz",
  "gebäudemodernisierungsgesetz",
  "junge union",
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

export function filterArticlesForFocus(category: NewsCategory, articles: LiveArticle[]): LiveArticle[] {
  return articles.filter((article) => isRelevantForCategory(category, article));
}

function isRelevantForCategory(category: NewsCategory, article: LiveArticle): boolean {
  const haystack = articleText(article);

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
