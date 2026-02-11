import { kv } from "@vercel/kv";
import type { TrackingMetadata } from "./types";

/**
 * Create a tracking pixel entry in KV store.
 * Returns the tracking ID.
 */
export async function createTrackingPixel(
  metadata: Omit<TrackingMetadata, "id" | "openedAt">
): Promise<string> {
  const id = crypto.randomUUID();
  const data: TrackingMetadata = { ...metadata, id };
  await kv.set(`track:${id}`, JSON.stringify(data), { ex: 60 * 60 * 24 * 90 }); // 90 days TTL
  return id;
}

/**
 * Get tracking data from KV store.
 */
export async function getTrackingData(
  id: string
): Promise<TrackingMetadata | null> {
  const raw = await kv.get<string>(`track:${id}`);
  if (!raw) return null;
  // kv.get may return already-parsed object or string
  if (typeof raw === "object") return raw as unknown as TrackingMetadata;
  try {
    return JSON.parse(raw) as TrackingMetadata;
  } catch {
    return null;
  }
}

/**
 * Mark a tracking pixel as opened.
 */
export async function markOpened(id: string): Promise<void> {
  const data = await getTrackingData(id);
  if (!data) return;
  if (data.openedAt) return; // already marked
  data.openedAt = new Date().toISOString();
  await kv.set(`track:${id}`, JSON.stringify(data), { ex: 60 * 60 * 24 * 90 });
}
