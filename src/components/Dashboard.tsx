"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { CategoryTabs } from "@/components/CategoryTabs";
import { ModeToggle, type DashboardMode } from "@/components/ModeToggle";
import { NewsCard } from "@/components/NewsCard";
import { categories, getDailyNewsByCategory, getWeeklyNewsByCategory } from "@/lib/news";
import type { NewsCategory } from "@/types/news";

export function Dashboard() {
  const [mode, setMode] = useState<DashboardMode>("today");
  const [selectedCategory, setSelectedCategory] = useState<NewsCategory>("wirtschaft");

  const items = useMemo(
    () => (mode === "today" ? getDailyNewsByCategory(selectedCategory) : getWeeklyNewsByCategory(selectedCategory)),
    [mode, selectedCategory],
  );

  const currentDate = new Intl.DateTimeFormat("de-DE", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date("2026-06-07T12:00:00"));

  return (
    <main className="px-4 pb-28 pt-6 sm:px-6 sm:pt-8">
      <header>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted">{currentDate}</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal text-ink sm:text-4xl">Executive Briefing</h1>
          </div>
          <div className="rounded-md border border-line px-2.5 py-1.5 text-right">
            <p className="text-[0.68rem] uppercase tracking-[0.16em] text-muted">Demo</p>
            <p className="text-sm font-semibold text-ink">Phase 1</p>
          </div>
        </div>
      </header>

      <Link
        className="mt-5 flex items-center justify-between gap-4 rounded-lg border border-blue-300/25 bg-blue-300/5 p-4 transition hover:border-blue-300/45 hover:bg-blue-300/10"
        href="/preview"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-200">Phase-2-Preview</p>
          <p className="mt-1 text-sm leading-6 text-slate-300">Bis zu fünf echte RSS-Kandidaten pro Kategorie ansehen.</p>
        </div>
        <ArrowRight aria-hidden="true" className="h-5 w-5 shrink-0 text-blue-200" />
      </Link>

      <section className="-mx-4 mt-6 border-y border-line bg-canvas px-4 py-3 sm:-mx-6 sm:px-6">
        <ModeToggle mode={mode} onModeChange={setMode} />
        <div className="mt-3">
          <CategoryTabs categories={categories} selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} />
        </div>
      </section>

      <section className="mt-5 space-y-3" aria-label="Aktive Kategorie">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted">{mode === "today" ? "Heute" : "Woche"}</p>
            <h2 className="mt-1 text-xl font-semibold text-ink">{categories.find((category) => category.id === selectedCategory)?.label}</h2>
          </div>
          <p className="text-sm text-muted">{items.length} Briefings</p>
        </div>

        {items.map((item) => (
          <NewsCard item={item} key={item.id} />
        ))}
      </section>
    </main>
  );
}
