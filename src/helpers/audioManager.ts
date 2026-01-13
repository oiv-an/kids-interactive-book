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

class KidsAudioManager {
  private audioEl: HTMLAudioElement | null = null;
  private stopTimer: number | null = null;
  private lastStopReason: StopReason | null = null;

  /**
   * Safari iOS won't play audio / TTS until a user interaction happened.
   * Call this on first tap/click anywhere in the app.
   */
  public unlockByUserGesture(): void {
    // 1) Prepare audio element (for future mp3-sprite)
    if (!this.audioEl) {
      this.audioEl = new Audio();
      this.audioEl.preload = 'auto';
    }

    // 2) Prime speech synthesis voices (best-effort)
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        // Accessing voices list may trigger initialization in some browsers
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

    if (this.audioEl) {
      try {
        this.audioEl.pause();
        // Reset to start to avoid "continuing" if play() is called quickly again.
        this.audioEl.currentTime = 0;
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
   * Play a cue from an mp3 audio-sprite.
   * End time is computed as the next cue start or audio.duration for the last cue.
   */
  public async playSpriteCue({ sprite, cueId }: PlaySpriteArgs): Promise<void> {
    this.stop('new_play');

    const cueIndex = sprite.cues.findIndex((c) => c.id === cueId);
    if (cueIndex === -1) return;

    const cue = sprite.cues[cueIndex];
    const nextCue = sprite.cues[cueIndex + 1];

    const startSec = cue.startMs / 1000;
    const endSec = nextCue ? nextCue.startMs / 1000 : null;

    if (!this.audioEl) {
      this.audioEl = new Audio();
      this.audioEl.preload = 'auto';
    }

    // Ensure correct src
    if (this.audioEl.src !== new URL(sprite.url, window.location.href).toString()) {
      this.audioEl.src = sprite.url;
      this.audioEl.load();
    }

    // Wait until metadata is available (duration/currentTime)
    await this.waitForMetadata(this.audioEl);

    // Start playback at cue start
    try {
      this.audioEl.currentTime = Math.max(0, startSec);
    } catch {
      // ignore
    }

    try {
      // play() can reject on iOS if not unlocked; caller should call unlockByUserGesture().
      await this.audioEl.play();
    } catch {
      return;
    }

    // Schedule stop at end of segment (if endSec known)
    if (endSec !== null) {
      const durationMs = Math.max(0, (endSec - startSec) * 1000);

      // Primary stop mechanism: timeout
      this.stopTimer = window.setTimeout(() => {
        this.stop('manual_stop');
      }, durationMs);

      // Safety mechanism: timeupdate check (some browsers delay timers in background)
      const onTimeUpdate = () => {
        if (!this.audioEl) return;
        if (this.audioEl.currentTime >= endSec - 0.02) {
          this.audioEl.removeEventListener('timeupdate', onTimeUpdate);
          this.stop('manual_stop');
        }
      };

      this.audioEl.addEventListener('timeupdate', onTimeUpdate);
    }
  }

  public canPlaySprite(spriteLang: KidsAudioSpriteLang): spriteLang is KidsAudioSpriteLang & { url: string } {
    return typeof spriteLang.url === 'string' && spriteLang.url.length > 0;
  }

  private waitForMetadata(audio: HTMLAudioElement): Promise<void> {
    if (!Number.isNaN(audio.duration) && audio.duration > 0) return Promise.resolve();

    return new Promise((resolve) => {
      const done = () => {
        audio.removeEventListener('loadedmetadata', done);
        audio.removeEventListener('canplay', done);
        resolve();
      };
      audio.addEventListener('loadedmetadata', done);
      audio.addEventListener('canplay', done);
    });
  }
}

export const kidsAudioManager = new KidsAudioManager();