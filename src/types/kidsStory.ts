export type KidsLang = 'ru' | 'en';
export type KidsStoryId = string;

export type KidsStoryManifest = {
  version: number;
  stories: KidsStoryManifestItem[];
};

export type KidsStoryManifestItem = {
  id: KidsStoryId;
  titleKey: string;
  coverImageUrl: string;
  storyUrl: string;
  isPlaceholder?: boolean;
};

export type KidsStory = {
  id: KidsStoryId;
  scenes: KidsScene[];
  audioSprite: Record<KidsLang, KidsAudioSpriteLang>;
};

export type KidsScene = {
  id: string;
  imageUrl: string;
  zones: KidsZone[];
};

export type KidsZone = {
  id: string;
  // geometry in percentages of the scene viewport
  x: number; // 0..100
  y: number; // 0..100
  width: number; // 0..100
  height: number; // 0..100
  radius?: number; // 0..50 (css border-radius %, optional)
  audioCueId: string;

  /**
   * Prefer using i18n keys for TTS to avoid hardcoded RU/EN strings in content files.
   * If provided, app will call `t(ttsKey)` based on current language.
   */
  ttsKey?: string;

  /**
   * Backward compatible fallback (MVP1 initial stories).
   */
  tts?: Record<KidsLang, string>;
};

export type KidsAudioSpriteLang = {
  /**
   * When null => use TTS (MVP1 baseline).
   * Later will point to /stories/<id>/audio/<lang>.mp3
   */
  url: string | null;
  cues: KidsAudioCue[];
};

export type KidsAudioCue = {
  id: string;
  startMs: number;
};

// Ensures this file is treated as a module under `isolatedModules` in CRA/Babel builds.
export {};