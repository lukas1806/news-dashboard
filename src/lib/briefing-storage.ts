import { get, put } from "@vercel/blob";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseBriefingSnapshot } from "@/lib/briefing-validation";
import type { BriefingSnapshot, ManualBriefingRunState } from "@/types/briefing";

const BLOB_PATHNAME = "briefings/latest.json";
const MANUAL_RUN_STATE_PATHNAME = "briefings/manual-run-state.json";
const LOCAL_DIRECTORY = ".briefing-data";
const LOCAL_PATHNAME = path.join(process.cwd(), LOCAL_DIRECTORY, "latest.json");
const LOCAL_MANUAL_RUN_STATE_PATHNAME = path.join(process.cwd(), LOCAL_DIRECTORY, "manual-run-state.json");

export async function loadBriefingSnapshot(): Promise<BriefingSnapshot | null> {
  const rawSnapshot = useLocalStorage() ? await readLocalSnapshot() : await readBlobSnapshot();

  if (!rawSnapshot) {
    return null;
  }

  return parseBriefingSnapshot(JSON.parse(rawSnapshot) as unknown);
}

export async function saveBriefingSnapshot(snapshot: BriefingSnapshot): Promise<void> {
  const serialized = JSON.stringify(parseBriefingSnapshot(snapshot), null, 2);

  if (useLocalStorage()) {
    await mkdir(path.dirname(LOCAL_PATHNAME), { recursive: true });
    await writeFile(LOCAL_PATHNAME, serialized, "utf8");
    return;
  }

  await put(BLOB_PATHNAME, serialized, {
    access: "private",
    allowOverwrite: true,
    addRandomSuffix: false,
    contentType: "application/json; charset=utf-8",
    cacheControlMaxAge: 60,
  });
}

export async function loadManualBriefingRunState(): Promise<ManualBriefingRunState | null> {
  const rawState = useLocalStorage()
    ? await readLocalFile(LOCAL_MANUAL_RUN_STATE_PATHNAME)
    : await readBlobFile(MANUAL_RUN_STATE_PATHNAME);

  if (!rawState) {
    return null;
  }

  const value = JSON.parse(rawState) as unknown;
  if (!isManualBriefingRunState(value)) {
    throw new Error("Invalid manual briefing run state");
  }

  return value;
}

export async function saveManualBriefingRunState(state: ManualBriefingRunState): Promise<void> {
  if (!isManualBriefingRunState(state)) {
    throw new Error("Invalid manual briefing run state");
  }

  const serialized = JSON.stringify(state, null, 2);
  if (useLocalStorage()) {
    await mkdir(path.dirname(LOCAL_MANUAL_RUN_STATE_PATHNAME), { recursive: true });
    await writeFile(LOCAL_MANUAL_RUN_STATE_PATHNAME, serialized, "utf8");
    return;
  }

  await put(MANUAL_RUN_STATE_PATHNAME, serialized, {
    access: "private",
    allowOverwrite: true,
    addRandomSuffix: false,
    contentType: "application/json; charset=utf-8",
    cacheControlMaxAge: 60,
  });
}

function useLocalStorage(): boolean {
  if (process.env.BRIEFING_STORAGE_DRIVER === "file") {
    return true;
  }

  if (process.env.BRIEFING_STORAGE_DRIVER === "blob") {
    return false;
  }

  return process.env.NODE_ENV !== "production" && !process.env.BLOB_READ_WRITE_TOKEN && !process.env.BLOB_STORE_ID;
}

async function readLocalSnapshot(): Promise<string | null> {
  return readLocalFile(LOCAL_PATHNAME);
}

async function readLocalFile(pathname: string): Promise<string | null> {
  try {
    return await readFile(pathname, "utf8");
  } catch (error) {
    if (isMissingFileError(error)) {
      return null;
    }

    throw error;
  }
}

async function readBlobSnapshot(): Promise<string | null> {
  return readBlobFile(BLOB_PATHNAME);
}

async function readBlobFile(pathname: string): Promise<string | null> {
  const result = await get(pathname, { access: "private", useCache: false });

  if (!result || result.statusCode !== 200) {
    return null;
  }

  return new Response(result.stream).text();
}

function isManualBriefingRunState(value: unknown): value is ManualBriefingRunState {
  return (
    typeof value === "object" &&
    value !== null &&
    "date" in value &&
    typeof value.date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value.date) &&
    "attempts" in value &&
    typeof value.attempts === "number" &&
    Number.isInteger(value.attempts) &&
    value.attempts >= 0
  );
}

function isMissingFileError(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}
