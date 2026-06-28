import { del, get, list, put } from "@vercel/blob";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArchiveCollectionState, parseArchiveIndex, parseArchiveInput, parseArchiveRunState, parseMonthlyArchive } from "@/lib/archive-validation";
import type { ArchiveCollectionState, ArchiveDailyInput, ArchiveIndex, ArchiveRunState, MonthlyArchive } from "@/types/archive";

export const archivePaths = {
  month: (month: string) => `briefings/archive/${month}.json`,
  index: "briefings/archive/index.json",
  runState: "briefings/archive/run-state.json",
  collectionState: "briefings/archive/collection-state.json",
  input: (date: string) => `briefings/archive-inputs/${date}.json`,
};
const LOCAL = path.join(process.cwd(), ".briefing-data");

export async function loadArchiveMonth(month: string) { return load(archivePaths.month(month), parseMonthlyArchive); }
export async function saveArchiveMonth(value: MonthlyArchive) { await save(archivePaths.month(value.month), parseMonthlyArchive(value)); }
export async function loadArchiveIndex(): Promise<ArchiveIndex> { return (await load(archivePaths.index, parseArchiveIndex)) ?? { version: 1, months: [] }; }
export async function saveArchiveIndex(value: ArchiveIndex) { await save(archivePaths.index, parseArchiveIndex(value)); }
export async function loadArchiveRunState(): Promise<ArchiveRunState> { return (await load(archivePaths.runState, parseArchiveRunState)) ?? { version: 1, months: {} }; }
export async function saveArchiveRunState(value: ArchiveRunState) { await save(archivePaths.runState, parseArchiveRunState(value)); }
export async function loadArchiveCollectionState() { return load(archivePaths.collectionState, parseArchiveCollectionState); }
export async function saveArchiveCollectionState(value: ArchiveCollectionState) { await save(archivePaths.collectionState, parseArchiveCollectionState(value)); }
export async function saveArchiveInput(value: ArchiveDailyInput) { await save(archivePaths.input(value.date), parseArchiveInput(value)); }

export async function listArchiveInputs(month: string): Promise<ArchiveDailyInput[]> {
  const prefix = `briefings/archive-inputs/${month}-`;
  const names = await listNames(prefix);
  const values = await Promise.all(names.map((name) => load(name, parseArchiveInput)));
  return values.filter((value): value is ArchiveDailyInput => value !== null);
}

export async function cleanupArchiveInputs(beforeDate: string): Promise<void> {
  const names = await listNames("briefings/archive-inputs/");
  const stale = names.filter((name) => name.slice(-15, -5) < beforeDate);
  if (local()) await Promise.all(stale.map((name) => rm(localPath(name), { force: true })));
  else if (stale.length) await del(stale);
}

async function load<T>(pathname: string, parse: (value: unknown) => T): Promise<T | null> {
  const raw = local() ? await readLocal(pathname) : await readBlob(pathname);
  return raw ? parse(JSON.parse(raw) as unknown) : null;
}

async function save(pathname: string, value: unknown) {
  const serialized = JSON.stringify(value, null, 2);
  if (local()) { const target = localPath(pathname); await mkdir(path.dirname(target), { recursive: true }); await writeFile(target, serialized, "utf8"); return; }
  await put(pathname, serialized, { access: "private", allowOverwrite: true, addRandomSuffix: false, contentType: "application/json; charset=utf-8", cacheControlMaxAge: 60 });
}

async function listNames(prefix: string): Promise<string[]> {
  if (local()) {
    const dir = localPath(path.dirname(prefix));
    try { return (await readdir(dir)).filter((name) => name.endsWith(".json")).map((name) => `${path.dirname(prefix)}/${name}`); } catch (error) { if (missing(error)) return []; throw error; }
  }
  const names: string[] = []; let cursor: string | undefined;
  do { const result = await list({ prefix, cursor, limit: 1000 }); names.push(...result.blobs.map((blob) => blob.pathname)); cursor = result.hasMore ? result.cursor : undefined; } while (cursor);
  return names;
}

function local() { if (process.env.BRIEFING_STORAGE_DRIVER === "file") return true; if (process.env.BRIEFING_STORAGE_DRIVER === "blob") return false; return process.env.NODE_ENV !== "production" && !process.env.BLOB_READ_WRITE_TOKEN && !process.env.BLOB_STORE_ID; }
function localPath(pathname: string) { return path.join(LOCAL, pathname.replace(/^briefings\//, "")); }
async function readLocal(pathname: string) { try { return await readFile(localPath(pathname), "utf8"); } catch (error) { if (missing(error)) return null; throw error; } }
async function readBlob(pathname: string) { const result = await get(pathname, { access: "private", useCache: false }); return result?.statusCode === 200 ? new Response(result.stream).text() : null; }
function missing(error: unknown) { return error instanceof Error && "code" in error && error.code === "ENOENT"; }
