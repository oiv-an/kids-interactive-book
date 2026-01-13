/* eslint-disable no-unused-vars */
import React, { useMemo, useRef } from 'react';
import type { KidsZone } from '../types/kidsStory';

// Ensures this file is treated as a module under `isolatedModules` in CRA/Babel builds.
export {};

type InteractionType = 'tap' | 'longpress' | 'doubletap';

type Props = {
  zone: KidsZone;
  minPxSize: number;
  onInteract: (...args: [InteractionType, KidsZone]) => void;
};

function clampNumber(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export default function InteractiveZone({ zone, minPxSize, onInteract }: Props) {
  const longPressTimerRef = useRef<number | null>(null);
  const lastTapAtRef = useRef<number>(0);
  const pointerDownAtRef = useRef<number>(0);

  const style = useMemo(() => {
    // Zone geometry in % of container. We also enforce min px size by using CSS `min-width/height`
    // (actual visual size can grow beyond % geometry on small screens, but in MVP1 it's OK).
    const x = clampNumber(zone.x, 0, 100);
    const y = clampNumber(zone.y, 0, 100);
    const w = clampNumber(zone.width, 0, 100);
    const h = clampNumber(zone.height, 0, 100);
    const radius = clampNumber(zone.radius ?? 0, 0, 50);

    return {
      left: `${x}%`,
      top: `${y}%`,
      width: `${w}%`,
      height: `${h}%`,
      minWidth: `${minPxSize}px`,
      minHeight: `${minPxSize}px`,
      borderRadius: `${radius}%`,
      transform: 'translate(-50%, -50%)',
    } as React.CSSProperties;
  }, [zone.height, zone.radius, zone.width, zone.x, zone.y, minPxSize]);

  const clearLongPress = () => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const onPointerDown: React.PointerEventHandler<HTMLButtonElement> = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointerDownAtRef.current = Date.now();

    clearLongPress();
    longPressTimerRef.current = window.setTimeout(() => {
      onInteract('longpress', zone);
      longPressTimerRef.current = null;
    }, 550);
  };

  const onPointerUp: React.PointerEventHandler<HTMLButtonElement> = () => {
    const now = Date.now();
    const downDuration = now - pointerDownAtRef.current;

    clearLongPress();

    // If long press already fired, do nothing on release
    if (downDuration >= 550) return;

    // Double tap detection
    const sinceLastTap = now - lastTapAtRef.current;
    lastTapAtRef.current = now;

    if (sinceLastTap > 0 && sinceLastTap < 320) {
      onInteract('doubletap', zone);
      return;
    }

    onInteract('tap', zone);
  };

  const onPointerCancel: React.PointerEventHandler<HTMLButtonElement> = () => {
    clearLongPress();
  };

  return (
    <button
      className="KidsZone"
      type="button"
      style={style}
      data-zone-id={zone.id}
      aria-label=""
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    />
  );
}