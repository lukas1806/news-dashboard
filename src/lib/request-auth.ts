import { timingSafeEqual } from "node:crypto";

export function secretsMatch(provided: string | null, configured: string | undefined): boolean {
  if (!provided || !configured) {
    return false;
  }

  const providedBuffer = Buffer.from(provided);
  const configuredBuffer = Buffer.from(configured);

  return providedBuffer.length === configuredBuffer.length && timingSafeEqual(providedBuffer, configuredBuffer);
}
