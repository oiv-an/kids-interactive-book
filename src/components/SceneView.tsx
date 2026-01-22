/* eslint-disable no-unused-vars */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { KidsScene, KidsZone } from '../types/kidsStory';
import InteractiveZone from './InteractiveZone';
import ZoneEditorOverlay from './ZoneEditorOverlay';

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
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [wrapSize, setWrapSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [imgNaturalSize, setImgNaturalSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setWrapSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const minPxSize = useMemo(() => getMinZonePx(wrapSize.width), [wrapSize.width]);

  const zonesLayerStyle = useMemo((): React.CSSProperties => {
    const cw = wrapSize.width;
    const ch = wrapSize.height;
    const iw = imgNaturalSize.width;
    const ih = imgNaturalSize.height;

    if (!cw || !ch || !iw || !ih) {
      return { left: 0, top: 0, width: '100%', height: '100%' };
    }

    // object-fit: contain => calculate actual rendered image rect inside container.
    const imgRatio = iw / ih;
    const containerRatio = cw / ch;

    let renderW = cw;
    let renderH = ch;
    let offsetX = 0;
    let offsetY = 0;

    if (containerRatio > imgRatio) {
      // container is wider => image fits by height
      renderH = ch;
      renderW = Math.round(renderH * imgRatio);
      offsetX = Math.round((cw - renderW) / 2);
      offsetY = 0;
    } else {
      // container is taller => image fits by width
      renderW = cw;
      renderH = Math.round(renderW / imgRatio);
      offsetX = 0;
      offsetY = Math.round((ch - renderH) / 2);
    }

    return {
      left: `${offsetX}px`,
      top: `${offsetY}px`,
      width: `${renderW}px`,
      height: `${renderH}px`,
    };
  }, [imgNaturalSize.height, imgNaturalSize.width, wrapSize.height, wrapSize.width]);

  const isEditMode = useMemo(() => {
    try {
      return new URLSearchParams(window.location.search).get('edit') === '1';
    } catch {
      return false;
    }
  }, []);

  const [draftZones, setDraftZones] = useState<KidsZone[] | null>(null);

  useEffect(() => {
    // Reset draft when switching scenes
    setDraftZones(null);
  }, [scene.id]);

  const zonesForRender = draftZones ?? scene.zones;

  return (
    <div className="KidsSceneWrap" ref={wrapRef}>
      <img
        ref={imgRef}
        className="KidsSceneImage"
        src={scene.imageUrl}
        alt=""
        draggable={false}
        onLoad={(e) => {
          const img = e.currentTarget;
          setImgNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
        }}
      />

      <div className="KidsZonesLayer" aria-hidden="true" style={zonesLayerStyle}>
        {zonesForRender.map((zone) => (
          <InteractiveZone
            key={zone.id}
            zone={zone}
            minPxSize={minPxSize}
            onInteract={onZoneInteract}
          />
        ))}

        <ZoneEditorOverlay
          isEnabled={isEditMode}
          sceneId={scene.id}
          imageUrl={scene.imageUrl}
          zones={zonesForRender}
          onChangeZones={(next) => setDraftZones(next)}
        />
      </div>
    </div>
  );
}