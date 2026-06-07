import type { FeedSource } from "@/types/source";

export const feedSources: FeedSource[] = [
  {
    id: "tagesschau-alle-meldungen",
    name: "Tagesschau · Alle Meldungen",
    category: "politik",
    url: "https://www.tagesschau.de/infoservices/alle-meldungen-100~rss2.xml",
    free: true,
    official: true,
    status: "active",
    language: "de",
    notes: "Offizieller RSS-Feed; private, nicht-kommerzielle Nutzung laut Tagesschau-Hinweis.",
  },
  {
    id: "tagesschau-weltwirtschaft",
    name: "Tagesschau · Weltwirtschaft",
    category: "wirtschaft",
    url: "https://www.tagesschau.de/wirtschaft/weltwirtschaft/index~rss2.xml",
    free: true,
    official: true,
    status: "active",
    language: "de",
  },
  {
    id: "ecb-press",
    name: "Europäische Zentralbank · Press",
    category: "wirtschaft",
    url: "https://www.ecb.europa.eu/rss/press.html",
    free: true,
    official: true,
    status: "active",
    language: "en",
    notes: "Kostenlose offizielle EZB-Pressemitteilungen; wichtig für Geldpolitik und Eurozone.",
  },
  {
    id: "federal-reserve-press",
    name: "Federal Reserve · Press Releases",
    category: "wirtschaft",
    url: "https://www.federalreserve.gov/feeds/press_all.xml",
    free: true,
    official: true,
    status: "active",
    language: "en",
    notes: "Kostenloser offizieller Fed-Feed; wichtig für US-Geldpolitik.",
  },
  {
    id: "nvidia-blog",
    name: "NVIDIA Blog",
    category: "wirtschaft",
    url: "https://blogs.nvidia.com/feed/",
    free: true,
    official: true,
    status: "candidate",
    language: "en",
    notes: "Kostenloser KI-/Chip-Kandidat; vor Aktivierung auf Relevanz und Marketing-Rauschen prüfen.",
  },
  {
    id: "deutschlandfunk-nachrichten",
    name: "Deutschlandfunk · Nachrichten",
    category: "politik",
    url: "https://www.deutschlandfunk.de/nachrichten-100.rss",
    free: true,
    official: true,
    status: "active",
    language: "de",
  },
  {
    id: "handball-world",
    name: "handball-world.news",
    category: "handball",
    url: "https://www.handball-world.news/feed.xml",
    free: true,
    official: true,
    status: "active",
    language: "de",
  },
  {
    id: "politico-europe",
    name: "Politico Europe",
    category: "politik",
    url: "https://www.politico.eu/feed/",
    free: true,
    official: true,
    status: "candidate",
    language: "en",
    notes: "Kostenloser Kandidat für EU-Politik; vor Aktivierung Nutzungsbedingungen und Feed-Stabilität prüfen.",
  },
];

export function getActiveFeedSources() {
  return feedSources.filter((source) => source.status === "active");
}

export function getFeedSources() {
  return feedSources;
}
