import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

const TILE_CACHE_DIR = `${FileSystem.cacheDirectory}map-tiles/`;
const MAX_CACHE_SIZE_MB = 50;
const MAX_TILE_AGE_DAYS = 7;

let initialized = false;

async function ensureCacheDir() {
  if (initialized) return;
  const dirInfo = await FileSystem.getInfoAsync(TILE_CACHE_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(TILE_CACHE_DIR, { intermediates: true });
  }
  initialized = true;
}

function getTileKey(z: number, x: number, y: number): string {
  return `${z}/${x}/${y}.png`;
}

function getTilePath(z: number, x: number, y: number): string {
  return `${TILE_CACHE_DIR}${getTileKey(z, x, y)}`;
}

export async function getCachedTile(z: number, x: number, y: number): Promise<string | null> {
  try {
    await ensureCacheDir();
    const path = getTilePath(z, x, y);
    const info = await FileSystem.getInfoAsync(path);
    if (!info.exists) return null;

    const age = Date.now() - ((info.modificationTime as any) ?? 0);
    if (age > MAX_TILE_AGE_DAYS * 24 * 60 * 60 * 1000) {
      await FileSystem.deleteAsync(path, { idempotent: true });
      return null;
    }

    return path;
  } catch {
    return null;
  }
}

export async function downloadAndCacheTile(z: number, x: number, y: number): Promise<string | null> {
  try {
    await ensureCacheDir();
    const url = `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
    const path = getTilePath(z, x, y);

    const downloadResult = await FileSystem.downloadAsync(url, path);
    if (downloadResult.status === 200) {
      return downloadResult.uri;
    }
    return null;
  } catch {
    return null;
  }
}

export async function getOrDownloadTile(z: number, x: number, y: number): Promise<string | null> {
  const cached = await getCachedTile(z, x, y);
  if (cached) return cached;
  return downloadAndCacheTile(z, x, y);
}

export async function getCacheSize(): Promise<number> {
  try {
    await ensureCacheDir();
    const info = await FileSystem.getInfoAsync(TILE_CACHE_DIR);
    if (!info.exists) return 0;
    return info.size ?? 0;
  } catch {
    return 0;
  }
}

export async function clearTileCache(): Promise<void> {
  try {
    await ensureCacheDir();
    await FileSystem.deleteAsync(TILE_CACHE_DIR, { idempotent: true });
    initialized = false;
  } catch {
    // Silently fail
  }
}

export async function trimCache(maxSizeMB: number = MAX_CACHE_SIZE_MB): Promise<void> {
  try {
    await ensureCacheDir();
    const sizeBytes = await getCacheSize();
    const sizeMB = sizeBytes / (1024 * 1024);

    if (sizeMB <= maxSizeMB) return;

    const dirInfo = await FileSystem.getInfoAsync(TILE_CACHE_DIR);
    if (!dirInfo.exists) return;

    const entries = await FileSystem.readDirectoryAsync(TILE_CACHE_DIR);
    for (const entry of entries) {
      const entryPath = `${TILE_CACHE_DIR}${entry}`;
      const entryInfo = await FileSystem.getInfoAsync(entryPath);
      if (entryInfo.exists) {
        await FileSystem.deleteAsync(entryPath, { idempotent: true });
      }
      const newSize = await getCacheSize();
      if (newSize / (1024 * 1024) <= maxSizeMB) break;
    }
  } catch {
    // Silently fail
  }
}
