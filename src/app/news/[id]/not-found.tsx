import Link from "next/link";
import { AppShell } from "@/components/AppShell";

export default function NewsNotFound() {
  return (
    <AppShell>
      <main className="px-4 pb-28 pt-8">
        <section className="rounded-lg border border-line bg-surface p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-muted">Nicht gefunden</p>
          <h1 className="mt-3 text-2xl font-semibold text-ink">Diese News existiert in den Mockdaten nicht.</h1>
          <Link className="mt-6 inline-flex text-sm font-medium text-slate-200 underline underline-offset-4" href="/">
            Zurück zum Dashboard
          </Link>
        </section>
      </main>
    </AppShell>
  );
}
