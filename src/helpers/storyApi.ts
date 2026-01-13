import type { KidsStory, KidsStoryManifest } from '../types/kidsStory';

const MANIFEST_URL = '/stories/manifest.json';

export async function loadKidsStoryManifest(): Promise<KidsStoryManifest> {
  const res = await fetch(MANIFEST_URL, { cache: 'no-cache' });
  if (!res.ok) {
    throw new Error(`Failed to load manifest: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as KidsStoryManifest;
}

export async function loadKidsStoryByUrl(storyUrl: string): Promise<KidsStory> {
  const res = await fetch(storyUrl, { cache: 'no-cache' });
  if (!res.ok) {
    throw new Error(`Failed to load story: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as KidsStory;
}