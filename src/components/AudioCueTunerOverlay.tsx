import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { KidsAudioCue, KidsLang, KidsStory, KidsZone } from '../types/kidsStory';
import { kidsAudioManager } from '../helpers/audioManager';

// Ensures this file is treated as a module under `isolatedModules` in CRA/Babel builds.
export {};

type Props = {
  isOpen: boolean;
  story: KidsStory;
  lang: KidsLang;
  onClose: () => void;
  onApplyCues: (nextCues: KidsAudioCue[]) => void;
};

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function pad3(n: number): string {
  return String(n).padStart(3, '0');
}

function msToTime(ms: number): string {
  const safe = Math.max(0, Math.round(ms));
  const mm = Math.floor(safe / 60000);
  const rest = safe - mm * 60000;
  const ss = Math.floor(rest / 1000);
  const mmm = rest - ss * 1000;
  return `${pad2(mm)}:${pad2(ss)}.${pad3(mmm)}`;
}

function parseTimeToMs(input: string): number | null {
  const raw = input.trim();
  if (!raw) return null;

  // Supported:
  // - mm:ss
  // - mm:ss.mmm
  // - ss
  // - ss.mmm
  // Also allow comma as decimal separator.
  const normalized = raw.replace(',', '.');

  const withColon = normalized.match(/^(\d+):(\d{1,2})(?:\.(\d{1,3}))?$/);
  if (withColon) {
    const mm = Number(withColon[1]);
    const ss = Number(withColon[2]);
    const frac = withColon[3] ?? '0';
    const mmm = Number(frac.padEnd(3, '0').slice(0, 3));
    if (!Number.isFinite(mm) || !Number.isFinite(ss) || !Number.isFinite(mmm)) return null;
    if (ss < 0 || ss > 59) return null;
    return mm * 60000 + ss * 1000 + mmm;
  }

  const secondsOnly = normalized.match(/^(\d+)(?:\.(\d{1,3}))?$/);
  if (secondsOnly) {
    const ss = Number(secondsOnly[1]);
    const frac = secondsOnly[2] ?? '0';
    const mmm = Number(frac.padEnd(3, '0').slice(0, 3));
    if (!Number.isFinite(ss) || !Number.isFinite(mmm)) return null;
    return ss * 1000 + mmm;
  }

  return null;
}

function sortCuesByStartMs(cues: KidsAudioCue[]): KidsAudioCue[] {
  return [...cues].sort((a, b) => a.startMs - b.startMs);
}

function buildZoneByCueId(story: KidsStory): Record<string, KidsZone> {
  const map: Record<string, KidsZone> = {};
  for (const scene of story.scenes) {
    for (const zone of scene.zones) {
      map[zone.audioCueId] = zone;
    }
  }
  return map;
}

export default function AudioCueTunerOverlay({ isOpen, story, lang, onClose, onApplyCues }: Props) {
  const { t } = useTranslation();

  const spriteLang = story.audioSprite[lang];
  const zoneByCueId = useMemo(() => buildZoneByCueId(story), [story]);

  const [selectedCueId, setSelectedCueId] = useState<string | null>(null);
  const [cues, setCues] = useState<KidsAudioCue[]>(() => sortCuesByStartMs(spriteLang.cues));
  const [filterText, setFilterText] = useState<string>('');

  const originalCuesRef = useRef<KidsAudioCue[]>([]);

  const [shiftAfterMsInput, setShiftAfterMsInput] = useState<string>('0');
  const [globalShiftMsInput, setGlobalShiftMsInput] = useState<string>('0');

  useEffect(() => {
    if (!isOpen) return;

    const next = sortCuesByStartMs(spriteLang.cues);
    setCues(next);
    originalCuesRef.current = next;

    setSelectedCueId(next[0]?.id ?? null);
    setShiftAfterMsInput('0');
    setGlobalShiftMsInput('0');
    setFilterText('');

    // Best-effort preload to reduce first-play latency.
    if (kidsAudioManager.canPlaySprite(spriteLang)) {
      kidsAudioManager.preloadSpriteUrl(spriteLang.url);
    }
  }, [isOpen, spriteLang, spriteLang.cues]);

  const canPlay = useMemo(() => kidsAudioManager.canPlaySprite(spriteLang), [spriteLang]);

  const selectedIndex = useMemo(() => {
    if (!selectedCueId) return -1;
    return cues.findIndex((c) => c.id === selectedCueId);
  }, [cues, selectedCueId]);

  const applyAndPreview = useCallback(
    (next: KidsAudioCue[]) => {
      const sorted = sortCuesByStartMs(next).map((c) => ({ ...c, startMs: Math.max(0, Math.round(c.startMs)) }));
      setCues(sorted);
      onApplyCues(sorted);
    },
    [onApplyCues]
  );

  const nudgeCue = useCallback(
    (cueId: string, deltaMs: number) => {
      applyAndPreview(
        cues.map((c) => (c.id === cueId ? { ...c, startMs: clamp(c.startMs + deltaMs, 0, 24 * 60 * 60 * 1000) } : c))
      );
    },
    [applyAndPreview, cues]
  );

  const setCueStartFromText = useCallback(
    (cueId: string, text: string) => {
      const ms = parseTimeToMs(text);
      if (ms === null) return;
      applyAndPreview(cues.map((c) => (c.id === cueId ? { ...c, startMs: clamp(ms, 0, 24 * 60 * 60 * 1000) } : c)));
    },
    [applyAndPreview, cues]
  );

  const shiftAfterSelected = useCallback(
    (deltaMs: number) => {
      if (selectedIndex < 0) return;
      const selected = cues[selectedIndex];
      if (!selected) return;

      applyAndPreview(
        cues.map((c) => (c.startMs >= selected.startMs && c.id !== selected.id ? { ...c, startMs: c.startMs + deltaMs } : c))
      );
    },
    [applyAndPreview, cues, selectedIndex]
  );

  const shiftAll = useCallback(
    (deltaMs: number) => {
      applyAndPreview(cues.map((c) => ({ ...c, startMs: c.startMs + deltaMs })));
    },
    [applyAndPreview, cues]
  );

  const normalizeStartToZero = useCallback(() => {
    if (cues.length === 0) return;
    const min = Math.min(...cues.map((c) => c.startMs));
    if (!Number.isFinite(min)) return;
    shiftAll(-min);
  }, [cues, shiftAll]);

  const resetToOriginal = useCallback(() => {
    applyAndPreview(originalCuesRef.current);
  }, [applyAndPreview]);

  const copyCuesJson = useCallback(async () => {
    const json = JSON.stringify(cues, null, 2);
    await navigator.clipboard.writeText(json);
  }, [cues]);

  const playCue = useCallback(
    async (cueId: string) => {
      if (!canPlay || !spriteLang.url) return;
      await kidsAudioManager.playSpriteCue({
        sprite: {
          lang,
          url: spriteLang.url,
          cues,
        },
        cueId,
      });
    },
    [canPlay, cues, lang, spriteLang.url]
  );

  const stop = useCallback(() => {
    kidsAudioManager.stop('manual_stop');
  }, []);

  const total = useMemo(() => {
    if (cues.length === 0) return 0;
    return Math.max(...cues.map((c) => c.startMs));
  }, [cues]);

  const filteredCues = useMemo(() => {
    const q = filterText.trim().toLowerCase();
    if (!q) return cues;

    return cues.filter((cue) => {
      const zone = zoneByCueId[cue.id];
      const text =
        zone?.ttsKey && zone.ttsKey.length > 0
          ? String(t(zone.ttsKey))
          : zone?.tts?.[lang] ?? '';

      return cue.id.toLowerCase().includes(q) || text.toLowerCase().includes(q);
    });
  }, [cues, filterText, lang, t, zoneByCueId]);

  if (!isOpen) return null;

  return (
    <div className="KidsOverlay" role="dialog" aria-modal="true">
      <div className="KidsOverlayHeader">
        <div className="KidsOverlayTitle">{t('kids.tuner.title')}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="KidsButton" type="button" onClick={() => void copyCuesJson()}>
            {t('kids.tuner.copyJson')}
          </button>
          <button className="KidsButton" type="button" onClick={onClose}>
            {t('kids.ui.close')}
          </button>
        </div>
      </div>

      <div className="KidsTunerMeta">
        <div className="KidsTunerMetaRow">
          <div className="KidsTunerMetaLabel">{t('kids.tuner.lang')}</div>
          <div className="KidsTunerMetaValue">{lang.toUpperCase()}</div>
          <div className="KidsTunerMetaLabel">{t('kids.tuner.cuesCount')}</div>
          <div className="KidsTunerMetaValue">{cues.length}</div>
          <div className="KidsTunerMetaLabel">{t('kids.tuner.lastCue')}</div>
          <div className="KidsTunerMetaValue">{msToTime(total)}</div>

          <div className="KidsTunerMetaLabel">{t('kids.tuner.filter')}</div>
          <input
            className="KidsTunerInput"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder={t('kids.tuner.filterPlaceholder') as string}
            style={{ width: 220 }}
          />
        </div>

        {!canPlay ? (
          <div className="KidsTunerWarn">{t('kids.tuner.noSprite')}</div>
        ) : (
          <div className="KidsTunerMetaRow">
            <button className="KidsButton KidsButton--small" type="button" onClick={stop}>
              {t('kids.tuner.stop')}
            </button>

            <button
              className="KidsButton KidsButton--small"
              type="button"
              onClick={() => {
                if (!selectedCueId) return;
                void playCue(selectedCueId);
              }}
              disabled={!selectedCueId}
            >
              {t('kids.tuner.playSelected')}
            </button>

            <button className="KidsButton KidsButton--small" type="button" onClick={normalizeStartToZero}>
              {t('kids.tuner.normalizeZero')}
            </button>

            <button className="KidsButton KidsButton--small" type="button" onClick={resetToOriginal}>
              {t('kids.tuner.reset')}
            </button>

            <div className="KidsTunerShiftBox">
              <div className="KidsTunerShiftTitle">{t('kids.tuner.shiftAfter')}</div>
              <input
                className="KidsTunerInput"
                value={shiftAfterMsInput}
                onChange={(e) => setShiftAfterMsInput(e.target.value)}
                inputMode="numeric"
              />
              <button
                className="KidsButton KidsButton--small"
                type="button"
                onClick={() => {
                  const v = parseInt(shiftAfterMsInput, 10);
                  if (!Number.isFinite(v)) return;
                  shiftAfterSelected(v);
                }}
              >
                {t('kids.tuner.applyMs')}
              </button>
            </div>

            <div className="KidsTunerShiftBox">
              <div className="KidsTunerShiftTitle">{t('kids.tuner.shiftAll')}</div>
              <input
                className="KidsTunerInput"
                value={globalShiftMsInput}
                onChange={(e) => setGlobalShiftMsInput(e.target.value)}
                inputMode="numeric"
              />
              <button
                className="KidsButton KidsButton--small"
                type="button"
                onClick={() => {
                  const v = parseInt(globalShiftMsInput, 10);
                  if (!Number.isFinite(v)) return;
                  shiftAll(v);
                }}
              >
                {t('kids.tuner.applyMs')}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="KidsTunerTableWrap" role="region" aria-label={t('kids.tuner.tableAria') as string}>
        <table className="KidsTunerTable">
          <thead>
            <tr>
              <th>#</th>
              <th>{t('kids.tuner.cueId')}</th>
              <th>{t('kids.tuner.text')}</th>
              <th>{t('kids.tuner.start')}</th>
              <th>{t('kids.tuner.nudge')}</th>
              <th>{t('kids.tuner.play')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredCues.map((cue, idx) => {
              const zone = zoneByCueId[cue.id];
              const text =
                zone?.ttsKey && zone.ttsKey.length > 0
                  ? t(zone.ttsKey)
                  : zone?.tts?.[lang] ?? '';

              const isSelected = cue.id === selectedCueId;

              return (
                <tr key={cue.id} className={isSelected ? 'isSelected' : ''}>
                  <td>{idx + 1}</td>
                  <td>
                    <button
                      className="KidsTunerCueButton"
                      type="button"
                      onClick={() => setSelectedCueId(cue.id)}
                      title={t('kids.tuner.select') as string}
                    >
                      {cue.id}
                    </button>
                  </td>
                  <td className="KidsTunerText">{text}</td>
                  <td>
                    <input
                      key={`${cue.id}-${cue.startMs}`}
                      className="KidsTunerInput"
                      defaultValue={msToTime(cue.startMs)}
                      onBlur={(e) => setCueStartFromText(cue.id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          (e.target as HTMLInputElement).blur();
                        }
                      }}
                    />
                  </td>
                  <td>
                    <div className="KidsTunerNudge">
                      <button className="KidsButton KidsButton--small" type="button" onClick={() => nudgeCue(cue.id, -1000)}>
                        -1000
                      </button>
                      <button className="KidsButton KidsButton--small" type="button" onClick={() => nudgeCue(cue.id, -250)}>
                        -250
                      </button>
                      <button className="KidsButton KidsButton--small" type="button" onClick={() => nudgeCue(cue.id, -100)}>
                        -100
                      </button>
                      <button className="KidsButton KidsButton--small" type="button" onClick={() => nudgeCue(cue.id, +100)}>
                        +100
                      </button>
                      <button className="KidsButton KidsButton--small" type="button" onClick={() => nudgeCue(cue.id, +250)}>
                        +250
                      </button>
                      <button className="KidsButton KidsButton--small" type="button" onClick={() => nudgeCue(cue.id, +1000)}>
                        +1000
                      </button>
                    </div>
                  </td>
                  <td>
                    <button
                      className="KidsButton KidsButton--small"
                      type="button"
                      onClick={() => {
                        setSelectedCueId(cue.id);
                        void playCue(cue.id);
                      }}
                      disabled={!canPlay}
                    >
                      {t('kids.tuner.play')}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="KidsTunerFooter">
        <div className="KidsTunerHint">
          {t('kids.tuner.hintLine1')}
          <br />
          {t('kids.tuner.hintLine2')}
        </div>
      </div>
    </div>
  );
}
