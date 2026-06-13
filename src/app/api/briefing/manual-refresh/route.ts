import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { generateAndSaveDailyBriefing } from "@/lib/briefing-generation";
import { loadManualBriefingRunState, saveManualBriefingRunState } from "@/lib/briefing-storage";
import { categories } from "@/lib/news";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_DAILY_ATTEMPTS = 5;

export async function POST(request: Request) {
  const configuredPassword = process.env.BRIEFING_ADMIN_PASSWORD;
  if (!configuredPassword) {
    return NextResponse.json({ error: "Manuelle Aktualisierung ist noch nicht eingerichtet." }, { status: 503 });
  }

  const body = await readBody(request);
  if (!body || !passwordsMatch(body.password, configuredPassword)) {
    return NextResponse.json({ error: "Admin-Passwort ist nicht korrekt." }, { status: 401 });
  }

  const date = getBerlinDateKey();
  const storedState = await loadManualBriefingRunState();
  const attempts = storedState?.date === date ? storedState.attempts : 0;

  if (attempts >= MAX_DAILY_ATTEMPTS) {
    return NextResponse.json({ error: "Das Limit von 5 manuellen Versuchen für heute ist erreicht." }, { status: 429 });
  }

  const nextAttempts = attempts + 1;
  await saveManualBriefingRunState({ date, attempts: nextAttempts });

  try {
    const { snapshot } = await generateAndSaveDailyBriefing({ force: true });
    return NextResponse.json({
      ok: true,
      generatedAt: snapshot.generatedAt,
      attemptsUsed: nextAttempts,
      attemptsRemaining: MAX_DAILY_ATTEMPTS - nextAttempts,
      counts: Object.fromEntries(categories.map(({ id }) => [id, snapshot.categories[id].length])),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Der neue Report konnte nicht vollständig erzeugt werden.",
        attemptsUsed: nextAttempts,
        attemptsRemaining: MAX_DAILY_ATTEMPTS - nextAttempts,
      },
      { status: 500 },
    );
  }
}

async function readBody(request: Request): Promise<{ password: string } | null> {
  try {
    const value = (await request.json()) as unknown;
    return typeof value === "object" && value !== null && "password" in value && typeof value.password === "string"
      ? { password: value.password }
      : null;
  } catch {
    return null;
  }
}

function passwordsMatch(provided: string, configured: string): boolean {
  const providedBuffer = Buffer.from(provided);
  const configuredBuffer = Buffer.from(configured);
  return providedBuffer.length === configuredBuffer.length && timingSafeEqual(providedBuffer, configuredBuffer);
}

function getBerlinDateKey(): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
