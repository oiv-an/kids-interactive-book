import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import './App.css';
import type { KidsAudioCue, KidsLang, KidsStory, KidsStoryManifest, KidsStoryManifestItem, KidsZone } from './types/kidsStory';
import { loadKidsStoryByUrl, loadKidsStoryManifest } from './helpers/storyApi';
import { kidsAudioManager } from './helpers/audioManager';
import AudioCueTunerOverlay from './components/AudioCueTunerOverlay';
import StoryPickerOverlay from './components/StoryPickerOverlay';
import SceneView from './components/SceneView';

type LoadState = 'idle' | 'loading' | 'loaded' | 'error';

const SWIPE_THRESHOLD = 50;

function normalizeKidsLang(lng: string): KidsLang {
  return lng.startsWith('en') ? 'en' : 'ru';
}

function App() {
  const { t, i18n } = useTranslation();

  const [manifestState, setManifestState] = useState<LoadState>('idle');
  const [manifest, setManifest] = useState<KidsStoryManifest | null>(null);

  const [isPickerOpen, setIsPickerOpen] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isTunerOpen, setIsTunerOpen] = useState<boolean>(false);

  const longPressTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressDurationMs = 1500;

  const [activeStoryItem, setActiveStoryItem] = useState<KidsStoryManifestItem | null>(null);
  const [activeStoryState, setActiveStoryState] = useState<LoadState>('idle');
  const [activeStory, setActiveStory] = useState<KidsStory | null>(null);

  const [sceneIndex, setSceneIndex] = useState<number>(0);

  const kidsLang = useMemo(() => normalizeKidsLang(i18n.language), [i18n.language]);

  const hasUnlockedAudioRef = useRef<boolean>(false);

  const selectStory = useCallback(async (storyItem: KidsStoryManifestItem) => {
    kidsAudioManager.stop('story_change');

    setIsTunerOpen(false);
    setActiveStoryItem(storyItem);
    setActiveStory(null);
    setSceneIndex(0);
    setActiveStoryState('loading');

    try {
      const data = await loadKidsStoryByUrl(storyItem.storyUrl);
      setActiveStory(data);
      setActiveStoryState('loaded');
      setIsPickerOpen(false);
    } catch {
      setActiveStoryState('error');
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      setManifestState('loading');
      try {
        const data = await loadKidsStoryManifest();
        if (!isMounted) return;
        setManifest(data);
        setManifestState('loaded');

        // Always try to load the first story on refresh
        if (data.stories && data.stories.length > 0) {
          await selectStory(data.stories[0]);
        } else {
          setIsPickerOpen(true);
        }
      } catch (err) {
        console.error('Failed to load manifest:', err);
        if (!isMounted) return;
        setManifestState('error');
      }
    };

    run();

    return () => {
      isMounted = false;
    };
  }, [selectStory]); // eslint-disable-line

  const onAnyUserGestureCapture = useCallback(() => {
    if (hasUnlockedAudioRef.current) return;
    hasUnlockedAudioRef.current = true;

    kidsAudioManager.unlockByUserGesture();

    // Preload current story sprite (if available) to reduce first-play latency.
    if (activeStory) {
      const spriteLang = activeStory.audioSprite[kidsLang];
      if (kidsAudioManager.canPlaySprite(spriteLang)) {
        kidsAudioManager.preloadSpriteUrl(spriteLang.url);
      }
    }
  }, [activeStory, kidsLang]);


  const setLanguage = useCallback(
    async (lang: KidsLang) => {
      if (normalizeKidsLang(i18n.language) === lang) return;
      kidsAudioManager.stop('lang_change');
      await i18n.changeLanguage(lang);
    },
    [i18n]
  );

  const canPrevScene = useMemo(() => {
    if (!activeStory) return false;
    return sceneIndex > 0;
  }, [activeStory, sceneIndex]);

  const canNextScene = useMemo(() => {
    if (!activeStory) return false;
    return sceneIndex < activeStory.scenes.length - 1;
  }, [activeStory, sceneIndex]);

  const prevScene = useCallback(() => {
    if (!canPrevScene) return;
    kidsAudioManager.stop('manual_stop');
    setSceneIndex((v) => Math.max(0, v - 1));
  }, [canPrevScene]);

  const nextScene = useCallback(() => {
    if (!canNextScene) return;
    kidsAudioManager.stop('manual_stop');
    setSceneIndex((v) => v + 1);
  }, [canNextScene]);

  const onZoneInteract = useCallback(
    async (type: 'tap' | 'longpress' | 'doubletap', zone: KidsZone) => {
      if (type === 'doubletap') {
        kidsAudioManager.stop('manual_stop');
        return;
      }

      // tap & longpress => play
      if (!activeStory) return;

      const spriteLang = activeStory.audioSprite[kidsLang];

      if (kidsAudioManager.canPlaySprite(spriteLang)) {
        await kidsAudioManager.playSpriteCue({
          sprite: {
            lang: kidsLang,
            url: spriteLang.url,
            cues: spriteLang.cues,
          },
          cueId: zone.audioCueId,
        });
        return;
      }

      const ttsText =
        typeof zone.ttsKey === 'string' && zone.ttsKey.length > 0
          ? t(zone.ttsKey)
          : zone.tts?.[kidsLang] ?? '';

      kidsAudioManager.speak({ text: ttsText, lang: kidsLang });
    },
    [activeStory, kidsLang, t]
  );

  const activeScene = useMemo(() => {
    if (!activeStory) return null;
    return activeStory.scenes[sceneIndex] ?? null;
  }, [activeStory, sceneIndex]);

  // Dev-only: audio cue tuner UI (hide by default)
  const isTunerEnabled = useMemo(() => {
    try {
      return new URLSearchParams(window.location.search).get('tuner') === '1';
    } catch {
      return false;
    }
  }, []);

  const canTuneAudio = useMemo(() => {
    if (!activeStory) return false;
    const spriteLang = activeStory.audioSprite[kidsLang];
    return kidsAudioManager.canPlaySprite(spriteLang);
  }, [activeStory, kidsLang]);

  const applyTunedCues = useCallback(
    (nextCues: KidsAudioCue[]) => {
      setActiveStory((prev) => {
        if (!prev) return prev;
        const prevLang = prev.audioSprite[kidsLang];
        return {
          ...prev,
          audioSprite: {
            ...prev.audioSprite,
            [kidsLang]: {
              ...prevLang,
              cues: nextCues,
            },
          },
        };
      });
    },
    [kidsLang]
  );

  const stories = manifest?.stories ?? [];

  const touchStartRef = useRef<number | null>(null);

  const onTouchStartLocal = useCallback((e: React.TouchEvent) => {
    touchStartRef.current = e.targetTouches[0].clientX;
  }, []);

  const onTouchEndLocal = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartRef.current === null) return;
      const touchEnd = e.changedTouches[0].clientX;
      const diff = touchStartRef.current - touchEnd;

      if (Math.abs(diff) > SWIPE_THRESHOLD) {
        if (diff > 0) {
          nextScene();
        } else {
          prevScene();
        }
      }
      touchStartRef.current = null;
    },
    [nextScene, prevScene]
  );

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      void document.documentElement.requestFullscreen().catch((err) => {
        console.warn(`Error attempting to enable full-screen mode: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      void document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  const handleCloseFsMouseDown = useCallback(() => {
    longPressTimeoutRef.current = setTimeout(() => {
      if (document.fullscreenElement) {
        void document.exitFullscreen();
        setIsFullscreen(false);
      }
    }, longPressDurationMs);
  }, []);

  const handleCloseFsMouseUp = useCallback(() => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
  }, []);

  const handleCloseFsTouchStart = useCallback(() => {
    longPressTimeoutRef.current = setTimeout(() => {
      if (document.fullscreenElement) {
        void document.exitFullscreen();
        setIsFullscreen(false);
      }
    }, longPressDurationMs);
  }, []);

  const handleCloseFsTouchEnd = useCallback(() => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
  }, []);

  return (
    <div className={`App ${isFullscreen ? 'App--fullscreen' : ''}`} onPointerDownCapture={onAnyUserGestureCapture}>
      {!isFullscreen && (
        <div className="KidsTopBar">
          <button className="KidsButton" type="button" onClick={toggleFullscreen}>
            {t('kids.ui.fullscreen')}
          </button>

          <button
            className="KidsButton"
            type="button"
            onClick={() => setIsPickerOpen(true)}
            disabled={manifestState !== 'loaded'}
          >
            {t('kids.ui.selectStory')}
          </button>

          {isTunerEnabled ? (
            <button
              className="KidsButton"
              type="button"
              onClick={() => setIsTunerOpen(true)}
              disabled={!canTuneAudio}
            >
              {t('kids.ui.tuneAudio')}
            </button>
          ) : null}

          <div className="KidsTopBarSpacer" />

          <div className="KidsLangSwitch" role="group" aria-label="Language">
            <button
              className={`KidsLangButton ${kidsLang === 'ru' ? 'isActive' : ''}`}
              type="button"
              onClick={() => void setLanguage('ru')}
            >
              {t('kids.ui.languageRu')}
            </button>
            <button
              className={`KidsLangButton ${kidsLang === 'en' ? 'isActive' : ''}`}
              type="button"
              onClick={() => void setLanguage('en')}
            >
              {t('kids.ui.languageEn')}
            </button>
          </div>
        </div>
      )}

      {isFullscreen && (
        <button
          className="KidsCloseFs"
          type="button"
          onMouseDown={handleCloseFsMouseDown}
          onMouseUp={handleCloseFsMouseUp}
          onMouseLeave={handleCloseFsMouseUp}
          onTouchStart={handleCloseFsTouchStart}
          onTouchEnd={handleCloseFsTouchEnd}
          aria-label="Close fullscreen (long press)"
        >
          ✕
        </button>
      )}

      <div className="KidsMain">
        {manifestState === 'loading' ? <div className="KidsLoading">{t('kids.ui.loading')}</div> : null}
        {manifestState === 'error' ? <div className="KidsLoading">Manifest error</div> : null}

        {activeStoryState === 'idle' ? <div className="KidsLoading">{t('kids.ui.selectStory')}</div> : null}
        {activeStoryState === 'loading' ? <div className="KidsLoading">{t('kids.ui.loading')}</div> : null}
        {activeStoryState === 'error' ? <div className="KidsLoading">Story error</div> : null}

        {activeScene && !isFullscreen ? (
          <div
            className="KidsStoryStage"
            onTouchStart={onTouchStartLocal}
            onTouchEnd={onTouchEndLocal}
          >
            <SceneView scene={activeScene} onZoneInteract={onZoneInteract} />

            <button
              className="KidsNavSide KidsNavSide--prev"
              type="button"
              onClick={prevScene}
              disabled={!canPrevScene}
            >
              ‹
            </button>
            <button
              className="KidsNavSide KidsNavSide--next"
              type="button"
              onClick={nextScene}
              disabled={!canNextScene}
            >
              ›
            </button>
          </div>
        ) : activeScene && isFullscreen ? (
          <div
            className="KidsStoryStage"
            onTouchStart={onTouchStartLocal}
            onTouchEnd={onTouchEndLocal}
          >
            <SceneView scene={activeScene} onZoneInteract={onZoneInteract} />
          </div>
        ) : null}
      </div>

      <StoryPickerOverlay
        isOpen={isPickerOpen}
        stories={stories}
        onClose={() => setIsPickerOpen(false)}
        onSelectStory={(story) => void selectStory(story)}
      />

      {isTunerEnabled && activeStory ? (
        <AudioCueTunerOverlay
          isOpen={isTunerOpen}
          story={activeStory}
          lang={kidsLang}
          onClose={() => setIsTunerOpen(false)}
          onApplyCues={applyTunedCues}
        />
      ) : null}

      {/* Keep for now: show what is selected (minimal text, can be removed later) */}
      {activeStoryItem ? <div className="KidsCurrentStory">{t(activeStoryItem.titleKey)}</div> : null}
    </div>
  );
}

export default App;