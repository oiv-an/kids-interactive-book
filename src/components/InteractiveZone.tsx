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

function to01(v: number): number {
  // Backward compatibility:
  // - old content used 0..100 (% of image)
  // - new editor will output 0..1 (normalized)
  const n = v > 1.001 ? v / 100 : v;
  return clampNumber(n, 0, 1);
}

export default function InteractiveZone({ zone, minPxSize, onInteract }: Props) {
  const longPressTimerRef = useRef<number | null>(null);
  const lastTapAtRef = useRef<number>(0);
  const pointerDownAtRef = useRef<number>(0);

  const style = useMemo(() => {
    // Zone geometry is normalized (0..1) relative to the *visible image rect*.
    // We also enforce min px size (kid-friendly) via CSS min-width/height.
    const x01 = to01(zone.x);
    const y01 = to01(zone.y);
    const w01 = to01(zone.width);
    const h01 = to01(zone.height);
    const radius = clampNumber(zone.radius ?? 0, 0, 50);

    return {
      left: `${x01 * 100}%`,
      top: `${y01 * 100}%`,
      width: `${w01 * 100}%`,
      height: `${h01 * 100}%`,
      minWidth: `${minPxSize}px`,
      minHeight: `${minPxSize}px`,
      borderRadius: `${radius}%`,
      transformOrigin: 'center center',
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