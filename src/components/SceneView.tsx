/* eslint-disable no-unused-vars */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { KidsScene, KidsZone } from '../types/kidsStory';
import InteractiveZone from './InteractiveZone';

type InteractionType = 'tap' | 'longpress' | 'doubletap';

type Props = {
  scene: KidsScene;
  onZoneInteract: (type: InteractionType, zone: KidsZone) => void;
};

function getMinZonePx(containerWidth: number): number {
  // MVP1: keep it simple and kid-friendly
  // - recommended: 60px
  // - but on very small screens allow a bit smaller (still close to iOS 44)
  if (!containerWidth || Number.isNaN(containerWidth)) return 60;
  return Math.max(44, Math.min(80, Math.round(containerWidth * 0.12)));
}

export default function SceneView({ scene, onZoneInteract }: Props) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [wrapWidth, setWrapWidth] = useState<number>(0);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setWrapWidth(entry.contentRect.width);
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const minPxSize = useMemo(() => getMinZonePx(wrapWidth), [wrapWidth]);

  return (
    <div className="KidsSceneWrap" ref={wrapRef}>
      <img
        className="KidsSceneImage"
        src={scene.imageUrl}
        alt=""
        draggable={false}
      />

      <div className="KidsZonesLayer" aria-hidden="true">
        {scene.zones.map((zone) => (
          <InteractiveZone
            key={zone.id}
            zone={zone}
            minPxSize={minPxSize}
            onInteract={onZoneInteract}
          />
        ))}
      </div>
    </div>
  );
}