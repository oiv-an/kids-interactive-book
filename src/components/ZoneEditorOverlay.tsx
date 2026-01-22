/* eslint-disable no-unused-vars */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { KidsZone } from '../types/kidsStory';

export {};

type Props = {
  isEnabled: boolean;
  sceneId: string;
  imageUrl: string;
  zones: KidsZone[];
  onChangeZones: (zones: KidsZone[]) => void;
};

type DragKind =
  | { type: 'move'; zoneId: string; startX: number; startY: number; startZone: KidsZone }
  | { type: 'resize'; zoneId: string; handle: 'nw' | 'ne' | 'se' | 'sw'; startX: number; startY: number; startZone: KidsZone };

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function to01Compat(v: number): number {
  // Backward compatibility: 0..100 -> 0..1
  const n = v > 1.001 ? v / 100 : v;
  return clamp(n, 0, 1);
}

function toUiNumber(v01: number): number {
  // For exporting to JSON (keep decent precision)
  return Math.round(v01 * 10000) / 10000;
}

function normalizeZone01(z: KidsZone): KidsZone {
  return {
    ...z,
    x: to01Compat(z.x),
    y: to01Compat(z.y),
    width: to01Compat(z.width),
    height: to01Compat(z.height),
  };
}

function zonesToExport(zones01: KidsZone[]): KidsZone[] {
  // Export normalized 0..1 (not %)
  return zones01.map((z) => ({
    ...z,
    x: toUiNumber(to01Compat(z.x)),
    y: toUiNumber(to01Compat(z.y)),
    width: toUiNumber(to01Compat(z.width)),
    height: toUiNumber(to01Compat(z.height)),
  }));
}

function getPointerPos01(e: PointerEvent, layerEl: HTMLElement): { x01: number; y01: number } {
  const r = layerEl.getBoundingClientRect();
  const x01 = (e.clientX - r.left) / r.width;
  const y01 = (e.clientY - r.top) / r.height;
  return { x01, y01 };
}

export default function ZoneEditorOverlay({ isEnabled, sceneId, imageUrl, zones, onChangeZones }: Props) {
  const { t } = useTranslation();

  const layerRef = useRef<HTMLDivElement | null>(null);
  const [drag, setDrag] = useState<DragKind | null>(null);

  const zones01 = useMemo(() => zones.map(normalizeZone01), [zones]);

  // Apply changes from drag (with raf to keep it smooth)
  const rafRef = useRef<number | null>(null);
  const pendingZonesRef = useRef<KidsZone[] | null>(null);

  const commitZones = useCallback(
    (next: KidsZone[]) => {
      pendingZonesRef.current = next;
      if (rafRef.current !== null) return;
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null;
        if (pendingZonesRef.current) {
          onChangeZones(pendingZonesRef.current);
          pendingZonesRef.current = null;
        }
      });
    },
    [onChangeZones]
  );

  useEffect(() => {
    if (!isEnabled) return;

    const onMove = (e: PointerEvent) => {
      if (!drag) return;
      const layerEl = layerRef.current;
      if (!layerEl) return;

      const { x01, y01 } = getPointerPos01(e, layerEl);

      const dx = x01 - drag.startX;
      const dy = y01 - drag.startY;

      const start = normalizeZone01(drag.startZone);

      let nextZone: KidsZone = start;

      if (drag.type === 'move') {
        // keep whole rect inside 0..1
        nextZone = {
          ...start,
          x: clamp(start.x + dx, 0, 1 - start.width),
          y: clamp(start.y + dy, 0, 1 - start.height),
        };
      } else {
        // Resize from corners
        let left = start.x;
        let top = start.y;
        let right = start.x + start.width;
        let bottom = start.y + start.height;

        if (drag.handle === 'nw') {
          left = clamp(left + dx, 0, right - 0.01);
          top = clamp(top + dy, 0, bottom - 0.01);
        }
        if (drag.handle === 'ne') {
          right = clamp(right + dx, left + 0.01, 1);
          top = clamp(top + dy, 0, bottom - 0.01);
        }
        if (drag.handle === 'se') {
          right = clamp(right + dx, left + 0.01, 1);
          bottom = clamp(bottom + dy, top + 0.01, 1);
        }
        if (drag.handle === 'sw') {
          left = clamp(left + dx, 0, right - 0.01);
          bottom = clamp(bottom + dy, top + 0.01, 1);
        }

        nextZone = {
          ...start,
          x: left,
          y: top,
          width: clamp(right - left, 0.01, 1),
          height: clamp(bottom - top, 0.01, 1),
        };
      }

      const nextZones = zones01.map((z) => (z.id === drag.zoneId ? nextZone : z));
      commitZones(nextZones);
    };

    const onUp = () => {
      setDrag(null);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);

    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [commitZones, drag, isEnabled, zones01]);

  const copyZonesJson = useCallback(async () => {
    const exportZones = zonesToExport(zones01);
    const json = JSON.stringify(exportZones, null, 2);
    await navigator.clipboard.writeText(json);
  }, [zones01]);

  const copySceneJson = useCallback(async () => {
    const exportZones = zonesToExport(zones01);
    const json = JSON.stringify(
      {
        id: sceneId,
        imageUrl,
        zones: exportZones,
      },
      null,
      2
    );
    await navigator.clipboard.writeText(json);
  }, [imageUrl, sceneId, zones01]);

  if (!isEnabled) return null;

  return (
    <div className="KidsZonesEditor" aria-hidden="true">
      <div className="KidsZonesEditorBar">
        <button className="KidsButton KidsButton--small" type="button" onClick={() => void copyZonesJson()}>
          {t('kids.editor.copyZones')}
        </button>
        <button className="KidsButton KidsButton--small" type="button" onClick={() => void copySceneJson()}>
          {t('kids.editor.copyScene')}
        </button>
        <div className="KidsZonesEditorHint">{t('kids.editor.hint')}</div>
      </div>

      <div className="KidsZonesEditorLayer" ref={layerRef}>
        {zones01.map((z) => {
          const left = `${z.x * 100}%`;
          const top = `${z.y * 100}%`;
          const width = `${z.width * 100}%`;
          const height = `${z.height * 100}%`;

          return (
            <div
              key={z.id}
              className={`KidsZoneEditorRect ${drag?.zoneId === z.id ? 'isActive' : ''}`}
              style={{ left, top, width, height }}
              onPointerDown={(e) => {
                const layerEl = layerRef.current;
                if (!layerEl) return;
                const { x01, y01 } = getPointerPos01(e.nativeEvent, layerEl);
                setDrag({ type: 'move', zoneId: z.id, startX: x01, startY: y01, startZone: z });
              }}
            >
              <div className="KidsZoneEditorLabel">{z.id}</div>

              {(
                [
                  { h: 'nw' as const },
                  { h: 'ne' as const },
                  { h: 'se' as const },
                  { h: 'sw' as const },
                ]
              ).map(({ h }) => (
                <div
                  key={h}
                  className={`KidsZoneEditorHandle KidsZoneEditorHandle--${h}`}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    const layerEl = layerRef.current;
                    if (!layerEl) return;
                    const { x01, y01 } = getPointerPos01(e.nativeEvent, layerEl);
                    setDrag({ type: 'resize', zoneId: z.id, handle: h, startX: x01, startY: y01, startZone: z });
                  }}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
