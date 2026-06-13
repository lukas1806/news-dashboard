"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { LockKeyhole, RefreshCw, X } from "lucide-react";

const SESSION_PASSWORD_KEY = "briefing-admin-password";

export function BriefingManualRefresh() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<string>();

  useEffect(() => {
    setPassword(sessionStorage.getItem(SESSION_PASSWORD_KEY) ?? "");
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRunning(true);
    setMessage(undefined);

    try {
      const response = await fetch("/api/briefing/manual-refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const payload = (await response.json()) as {
        error?: string;
        attemptsRemaining?: number;
      };

      if (!response.ok) {
        if (response.status === 401) {
          sessionStorage.removeItem(SESSION_PASSWORD_KEY);
        }
        throw new Error(payload.error ?? "Die Aktualisierung ist fehlgeschlagen.");
      }

      sessionStorage.setItem(SESSION_PASSWORD_KEY, password);
      setMessage(`Report aktualisiert. Heute verbleiben ${payload.attemptsRemaining ?? 0} manuelle Versuche.`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Die Aktualisierung ist fehlgeschlagen.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <>
      <button
        className="inline-flex min-h-11 items-center gap-2 rounded-md border border-slate-500/50 bg-slate-200 px-4 text-sm font-semibold text-slate-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
        disabled={running}
        onClick={() => {
          setMessage(undefined);
          setOpen(true);
        }}
        type="button"
      >
        <RefreshCw aria-hidden="true" className={`h-4 w-4 ${running ? "animate-spin" : ""}`} />
        Report aktualisieren
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-4 sm:items-center" role="presentation">
          <div aria-labelledby="manual-refresh-title" aria-modal="true" className="w-full max-w-md rounded-xl border border-line bg-panel p-5 shadow-2xl" role="dialog">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Geschützter Testlauf</p>
                <h2 className="mt-1 text-xl font-semibold text-ink" id="manual-refresh-title">Report jetzt aktualisieren?</h2>
              </div>
              <button
                aria-label="Dialog schließen"
                className="grid h-10 w-10 place-items-center rounded-md border border-line text-muted transition hover:text-ink"
                disabled={running}
                onClick={() => setOpen(false)}
                type="button"
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-300">
              Dieser Lauf aktualisiert alle drei Kategorien und verursacht einen kleinen OpenAI-Verbrauch. Pro Berliner Kalendertag sind höchstens fünf manuelle Versuche möglich. Bei einem Fehler bleibt der bisherige Report vollständig erhalten.
            </p>

            <form className="mt-5 space-y-4" onSubmit={submit}>
              <label className="block text-sm font-medium text-ink" htmlFor="briefing-admin-password">
                Admin-Passwort
                <span className="relative mt-2 block">
                  <LockKeyhole aria-hidden="true" className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted" />
                  <input
                    autoComplete="current-password"
                    autoFocus
                    className="min-h-11 w-full rounded-md border border-line bg-canvas py-2 pl-10 pr-3 text-base text-ink outline-none transition focus:border-slate-400"
                    id="briefing-admin-password"
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    type="password"
                    value={password}
                  />
                </span>
              </label>

              {message ? <p className="rounded-md border border-line bg-canvas p-3 text-sm leading-6 text-slate-300">{message}</p> : null}

              <button
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-slate-100 px-4 text-sm font-semibold text-slate-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                disabled={running || !password}
                type="submit"
              >
                <RefreshCw aria-hidden="true" className={`h-4 w-4 ${running ? "animate-spin" : ""}`} />
                {running ? "Report wird vollständig erzeugt …" : "Hinweis bestätigen und aktualisieren"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
