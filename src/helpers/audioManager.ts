import type { KidsAudioCue, KidsAudioSpriteLang, KidsLang } from '../types/kidsStory';

// Ensures this file is treated as a module under `isolatedModules` in CRA/Babel builds.
export {};

type ActiveSprite = {
  lang: KidsLang;
  url: string;
  cues: KidsAudioCue[];
};

type PlaySpriteArgs = {
  sprite: ActiveSprite;
  cueId: string;
};

type SpeakArgs = {
  text: string;
  lang: KidsLang;
};

type StopReason = 'new_play' | 'manual_stop' | 'story_change' | 'lang_change';

type AudioContextCompat = AudioContext & { resume?: () => Promise<void> };

function getAudioContextCtor(): (new () => AudioContextCompat) | null {
  const w = window as unknown as {
    AudioContext?: new () => AudioContextCompat;
    webkitAudioContext?: new () => AudioContextCompat;
  };

  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

class KidsAudioManager {
  /**
   * Legacy HTMLAudioElement fallback (also used as a last-resort if WebAudio decode fails).
   */
  private audioEl: HTMLAudioElement | null = null;

  /**
   * WebAudio path (fastest seek/instant start once decoded).
   */
  private audioCtx: AudioContextCompat | null = null;
  private bufferCache = new Map<string, Promise<AudioBuffer>>();

  private stopTimer: number | null = null;
  private lastStopReason: StopReason | null = null;

  private currentSource: AudioBufferSourceNode | null = null;

  private ensureAudioContext(): AudioContextCompat | null {
    if (typeof window === 'undefined') return null;

    if (!this.audioCtx) {
      const Ctor = getAudioContextCtor();
      if (!Ctor) return null;

      try {
        // NOTE: Creating AudioContext without gesture is OK, it will be suspended.
        this.audioCtx = new Ctor();
      } catch {
        this.audioCtx = null;
        return null;
      }
    }

    return this.audioCtx;
  }

  private async resumeAudioContextBestEffort(): Promise<void> {
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch {
        // ignore
      }
    }
  }

  /**
   * iOS Safari won't play audio / TTS until a user interaction happened.
   * Call this on first tap/click anywhere in the app.
   */
  public unlockByUserGesture(): void {
    // 1) Prepare WebAudio (resume inside gesture)
    void this.resumeAudioContextBestEffort();

    // 2) Prepare audio element as fallback
    if (!this.audioEl) {
      this.audioEl = new Audio();
      this.audioEl.preload = 'auto';
    }

    // 3) Prime speech synthesis voices (best-effort)
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.getVoices();
      } catch {
        // ignore
      }
    }
  }

  public stop(reason: StopReason = 'manual_stop'): void {
    this.lastStopReason = reason;

    if (this.stopTimer !== null) {
      window.clearTimeout(this.stopTimer);
      this.stopTimer = null;
    }

    // WebAudio stop
    if (this.currentSource) {
      try {
        this.currentSource.stop();
      } catch {
        // ignore
      }
      try {
        this.currentSource.disconnect();
      } catch {
        // ignore
      }
      this.currentSource = null;
    }

    // HTMLAudio fallback stop
    if (this.audioEl) {
      try {
        this.audioEl.pause();
        // Do not reset to 0 (faster subsequent seeks in some browsers)
      } catch {
        // ignore
      }
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
  }

  public speak({ text, lang }: SpeakArgs): void {
    // cancel previous audio/tts
    this.stop('new_play');

    if (!text) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'ru' ? 'ru-RU' : 'en-US';
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      utterance.volume = 1.0;

      window.speechSynthesis.speak(utterance);
    } catch {
      // ignore
    }
  }

  /**
   * Preload/decode sprite audio (WebAudio) as early as possible.
   *
   * Important: call this right after story load (no gesture needed for fetch/decode).
   */
  public preloadSpriteUrl(url: string): void {
    if (!url) return;

    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    if (this.bufferCache.has(url)) return;

    const p = fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to fetch audio: ${r.status}`);
        return r.arrayBuffer();
      })
      .then(async (ab) => {
        // Some browsers require a detached ArrayBuffer
        const copy = ab.slice(0);
        return await ctx.decodeAudioData(copy);
      });

    this.bufferCache.set(url, p);

    // Also warm up HTMLAudio as fallback
    if (!this.audioEl) {
      this.audioEl = new Audio();
      this.audioEl.preload = 'auto';
    }
    try {
      if (this.audioEl.src !== new URL(url, window.location.href).toString()) {
        this.audioEl.src = url;
        this.audioEl.load();
      }
    } catch {
      // ignore
    }
  }

  /**
   * Play a cue from an audio-sprite.
   *
   * WebAudio path:
   * - instant start (no metadata wait)
   * - precise offsets
   */
  public async playSpriteCue({ sprite, cueId }: PlaySpriteArgs): Promise<boolean> {
    this.stop('new_play');

    const ctx = this.ensureAudioContext();
    if (!ctx) {
      return this.playSpriteCueHtmlAudio(sprite, cueId);
    }

    // Make sure AudioContext is running (must be in user gesture on iOS)
    await this.resumeAudioContextBestEffort();

    // Safety: always sort by startMs (JSON edits might break ordering)
    const sortedCues = [...sprite.cues].sort((a, b) => a.startMs - b.startMs);

    const cueIndex = sortedCues.findIndex((c) => c.id === cueId);
    if (cueIndex === -1) return false;

    const cue = sortedCues[cueIndex];
    const nextCue = sortedCues[cueIndex + 1];

    const startSec = Math.max(0, cue.startMs / 1000);
    const endSec = nextCue ? Math.max(startSec, nextCue.startMs / 1000) : null;
    const durationSec = endSec !== null ? Math.max(0, endSec - startSec) : null;

    // Ensure preload was scheduled (best-effort)
    if (!this.bufferCache.has(sprite.url)) {
      this.preloadSpriteUrl(sprite.url);
    }

    let buffer: AudioBuffer;
    try {
      const p = this.bufferCache.get(sprite.url);
      if (!p) return this.playSpriteCueHtmlAudio(sprite, cueId);
      buffer = await p;
    } catch {
      // If decode fails (e.g. opus not supported), fall back to HTMLAudio
      return this.playSpriteCueHtmlAudio(sprite, cueId);
    }

    try {
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);

      this.currentSource = source;

      if (durationSec !== null) {
        source.start(0, startSec, durationSec);
      } else {
        source.start(0, startSec);
      }

      // Safety stop (mostly for browsers that ignore duration param edge cases)
      if (durationSec !== null) {
        this.stopTimer = window.setTimeout(() => {
          this.stop('manual_stop');
        }, Math.ceil(durationSec * 1000));
      }

      return true;
    } catch {
      return this.playSpriteCueHtmlAudio(sprite, cueId);
    }
  }

  public canPlaySprite(spriteLang: KidsAudioSpriteLang): spriteLang is KidsAudioSpriteLang & { url: string } {
    return typeof spriteLang.url === 'string' && spriteLang.url.length > 0;
  }

  private playSpriteCueHtmlAudio(sprite: ActiveSprite, cueId: string): boolean {
    const sortedCues = [...sprite.cues].sort((a, b) => a.startMs - b.startMs);
    const cueIndex = sortedCues.findIndex((c) => c.id === cueId);
    if (cueIndex === -1) return false;

    const cue = sortedCues[cueIndex];
    const nextCue = sortedCues[cueIndex + 1];

    const startSec = Math.max(0, cue.startMs / 1000);
    const endSec = nextCue ? Math.max(startSec, nextCue.startMs / 1000) : null;

    if (!this.audioEl) {
      this.audioEl = new Audio();
      this.audioEl.preload = 'auto';
    }

    try {
      if (this.audioEl.src !== new URL(sprite.url, window.location.href).toString()) {
        this.audioEl.src = sprite.url;
        this.audioEl.load();
      }
    } catch {
      // ignore
    }

    try {
      this.audioEl.currentTime = startSec;
    } catch {
      // ignore
    }

    // IMPORTANT: do not await here (keep it within gesture).
    void this.audioEl.play().catch(() => {
      // ignore
    });

    if (endSec !== null) {
      const durationMs = Math.max(0, (endSec - startSec) * 1000);
      this.stopTimer = window.setTimeout(() => {
        this.stop('manual_stop');
      }, durationMs);
    }

    return true;
  }
}

export const kidsAudioManager = new KidsAudioManager();
