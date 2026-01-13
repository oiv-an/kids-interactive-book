import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import './App.css';
import type { KidsLang, KidsStory, KidsStoryManifest, KidsStoryManifestItem, KidsZone } from './types/kidsStory';
import { loadKidsStoryByUrl, loadKidsStoryManifest } from './helpers/storyApi';
import { kidsAudioManager } from './helpers/audioManager';
import StoryPickerOverlay from './components/StoryPickerOverlay';
import SceneView from './components/SceneView';

type LoadState = 'idle' | 'loading' | 'loaded' | 'error';

function normalizeKidsLang(lng: string): KidsLang {
  return lng.startsWith('en') ? 'en' : 'ru';
}

function App() {
  const { t, i18n } = useTranslation();

  const [manifestState, setManifestState] = useState<LoadState>('idle');
  const [manifest, setManifest] = useState<KidsStoryManifest | null>(null);

  const [isPickerOpen, setIsPickerOpen] = useState<boolean>(false);

  const [activeStoryItem, setActiveStoryItem] = useState<KidsStoryManifestItem | null>(null);
  const [activeStoryState, setActiveStoryState] = useState<LoadState>('idle');
  const [activeStory, setActiveStory] = useState<KidsStory | null>(null);

  const [sceneIndex, setSceneIndex] = useState<number>(0);

  const kidsLang = useMemo(() => normalizeKidsLang(i18n.language), [i18n.language]);

  const hasUnlockedAudioRef = useRef<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      setManifestState('loading');
      try {
        const data = await loadKidsStoryManifest();
        if (!isMounted) return;
        setManifest(data);
        setManifestState('loaded');

        // Auto-open picker on first load for kid-friendly UX
        setIsPickerOpen(true);
      } catch {
        if (!isMounted) return;
        setManifestState('error');
      }
    };

    run();

    return () => {
      isMounted = false;
    };
  }, []);

  const onAnyUserGestureCapture = useCallback(() => {
    if (hasUnlockedAudioRef.current) return;
    hasUnlockedAudioRef.current = true;
    kidsAudioManager.unlockByUserGesture();
  }, []);

  const selectStory = useCallback(async (storyItem: KidsStoryManifestItem) => {
    kidsAudioManager.stop('story_change');

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

  const stories = manifest?.stories ?? [];

  return (
    <div className="App" onPointerDownCapture={onAnyUserGestureCapture}>
      <div className="KidsTopBar">
        <button
          className="KidsButton"
          type="button"
          onClick={() => setIsPickerOpen(true)}
          disabled={manifestState !== 'loaded'}
        >
          {t('kids.ui.selectStory')}
        </button>

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

      <div className="KidsMain">
        {manifestState === 'loading' ? <div className="KidsLoading">{t('kids.ui.loading')}</div> : null}
        {manifestState === 'error' ? <div className="KidsLoading">Manifest error</div> : null}

        {activeStoryState === 'idle' ? <div className="KidsLoading">{t('kids.ui.selectStory')}</div> : null}
        {activeStoryState === 'loading' ? <div className="KidsLoading">{t('kids.ui.loading')}</div> : null}
        {activeStoryState === 'error' ? <div className="KidsLoading">Story error</div> : null}

        {activeScene ? (
          <div className="KidsStoryStage">
            <SceneView scene={activeScene} onZoneInteract={onZoneInteract} />

            <div className="KidsSceneNav">
              <button className="KidsNavButton" type="button" onClick={prevScene} disabled={!canPrevScene}>
                ‹
              </button>
              <div className="KidsSceneDots" aria-hidden="true">
                {activeStory?.scenes.map((s, idx) => (
                  <span key={s.id} className={`KidsDot ${idx === sceneIndex ? 'isActive' : ''}`} />
                ))}
              </div>
              <button className="KidsNavButton" type="button" onClick={nextScene} disabled={!canNextScene}>
                ›
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <StoryPickerOverlay
        isOpen={isPickerOpen}
        stories={stories}
        onClose={() => setIsPickerOpen(false)}
        onSelectStory={(story) => void selectStory(story)}
      />

      {/* Keep for now: show what is selected (minimal text, can be removed later) */}
      {activeStoryItem ? <div className="KidsCurrentStory">{t(activeStoryItem.titleKey)}</div> : null}
    </div>
  );
}

export default App;