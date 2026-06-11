import { get, put } from "@vercel/blob";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseBriefingSnapshot } from "@/lib/briefing-validation";
import type { BriefingSnapshot } from "@/types/briefing";

const BLOB_PATHNAME = "briefings/latest.json";
const LOCAL_DIRECTORY = ".briefing-data";
const LOCAL_PATHNAME = path.join(process.cwd(), LOCAL_DIRECTORY, "latest.json");

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
  try {
    return await readFile(LOCAL_PATHNAME, "utf8");
  } catch (error) {
    if (isMissingFileError(error)) {
      return null;
    }

    throw error;
  }
}

async function readBlobSnapshot(): Promise<string | null> {
  const result = await get(BLOB_PATHNAME, { access: "private", useCache: false });

  if (!result || result.statusCode !== 200) {
    return null;
  }

  return new Response(result.stream).text();
}

function isMissingFileError(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}
