'use client';

import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { ActionButton } from '@/components/ui/ActionButton';

type Point = readonly [number, number];
type Stroke = Point[];
const MAXIMUM_POINTS = 10_000;
const MAXIMUM_STROKES = 100;
const clamp = (value: number) => Math.max(0, Math.min(1, value));

export interface SignaturePadProps {
  onChange: (signature: Blob | null) => void;
  disabled?: boolean;
}

/** Captures only local drawing input; contract consent, identity and submission belong to the consuming form. */
export function SignaturePad({ onChange, disabled = false }: SignaturePadProps) {
  const descriptionId = useId();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokes = useRef<Stroke[]>([]);
  const pointer = useRef<{ id: number; points: Stroke } | null>(null);
  const keyboardStroke = useRef<Stroke | null>(null);
  const keyboardCursor = useRef<Point>([0.1, 0.5]);
  const pointCount = useRef(0);
  const generation = useRef(0);
  const disabledRef = useRef(disabled);
  const [hasInk, setHasInk] = useState(false);
  const [error, setError] = useState('');
  const [cursor, setCursor] = useState<Point>([0.1, 0.5]);
  const [focused, setFocused] = useState(false);
  const cancelPendingExport = useCallback(() => { generation.current++; }, []);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const bounds = canvas.getBoundingClientRect();
    const width = Math.max(128, Math.min(640, bounds.width || 640));
    const height = width * 3 / 8;
    const ratio = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    const context = canvas.getContext('2d');
    if (!context) return;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, width, height);
    // The export has a transparent background; no labels, guides or cursor are painted into the image.
    context.strokeStyle = '#000000';
    context.lineWidth = 2;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    const pending = pointer.current?.points ?? keyboardStroke.current;
    for (const stroke of pending ? [...strokes.current, pending] : strokes.current) {
      if (stroke.length < 2) continue;
      context.beginPath();
      context.moveTo(stroke[0][0] * width, stroke[0][1] * height);
      for (const [x, y] of stroke.slice(1)) context.lineTo(x * width, y * height);
      context.stroke();
    }
  }, []);

  const exportImage = useCallback(() => {
    const canvas = canvasRef.current;
    const currentGeneration = ++generation.current;
    if (!canvas || !strokes.current.length) { onChange(null); return; }
    const complete: BlobCallback = (blob) => {
      if (generation.current !== currentGeneration || disabledRef.current) return;
      if (!blob || blob.type !== 'image/png' || blob.size > 512 * 1024) {
        onChange(null);
        setError('Chưa thể tạo ảnh chữ ký. Vui lòng xóa và ký lại.');
        return;
      }
      onChange(blob);
    };
    try { canvas.toBlob(complete, 'image/png'); }
    catch { complete(null); }
  }, [onChange]);

  useEffect(() => {
    redraw();
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(redraw) : null;
    if (canvasRef.current) observer?.observe(canvasRef.current);
    window.addEventListener('resize', redraw);
    return () => { observer?.disconnect(); window.removeEventListener('resize', redraw); cancelPendingExport(); };
  }, [redraw, cancelPendingExport]);

  useEffect(() => {
    disabledRef.current = disabled;
    if (disabled) {
      generation.current++;
      const active = pointer.current;
      pointer.current = null;
      keyboardStroke.current = null;
      if (active) {
        try { canvasRef.current?.releasePointerCapture(active.id); } catch { /* Capture may already have ended. */ }
      }
      redraw();
    }
  }, [disabled, redraw]);

  function invalidate() { generation.current++; onChange(null); setError(''); }
  function position(event: PointerEvent<HTMLCanvasElement>): Point | null {
    const bounds = event.currentTarget.getBoundingClientRect();
    if (!bounds.width || !bounds.height || !Number.isFinite(event.clientX) || !Number.isFinite(event.clientY)) return null;
    return [clamp((event.clientX - bounds.left) / bounds.width), clamp((event.clientY - bounds.top) / bounds.height)];
  }
  function available() {
    if (pointCount.current < MAXIMUM_POINTS && strokes.current.length < MAXIMUM_STROKES) return true;
    setError('Vùng ký đã đầy. Hãy xóa chữ ký và ký lại.');
    return false;
  }
  function start(event: PointerEvent<HTMLCanvasElement>) {
    if (disabled || pointer.current || keyboardStroke.current || event.button !== 0 || event.isPrimary === false || !available()) return;
    const point = position(event);
    if (!point) return;
    if (!event.currentTarget.getContext('2d')) { setError('Trình duyệt chưa hỗ trợ vùng ký. Vui lòng dùng trình duyệt khác.'); return; }
    invalidate();
    pointer.current = { id: event.pointerId, points: [point] };
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* Pointer cancellation still discards the stroke. */ }
    event.preventDefault();
  }
  function move(event: PointerEvent<HTMLCanvasElement>) {
    const active = pointer.current;
    if (disabled || !active || active.id !== event.pointerId || pointCount.current + active.points.length >= MAXIMUM_POINTS) return;
    const point = position(event);
    if (!point) return;
    const last = active.points[active.points.length - 1];
    if (Math.hypot(point[0] - last[0], point[1] - last[1]) < 0.002) return;
    active.points.push(point);
    redraw();
    event.preventDefault();
  }
  function commit(points: Stroke | null) {
    if (points && points.length >= 2) {
      strokes.current.push(points);
      pointCount.current += points.length;
      setHasInk(true);
    }
    redraw();
    exportImage();
  }
  function end(event: PointerEvent<HTMLCanvasElement>, cancelled = false) {
    const active = pointer.current;
    if (!active || active.id !== event.pointerId) return;
    pointer.current = null;
    try { event.currentTarget.releasePointerCapture(event.pointerId); } catch { /* Capture can end before pointercancel. */ }
    if (disabled) { redraw(); return; }
    commit(cancelled ? null : active.points);
  }
  function keyDown(event: KeyboardEvent<HTMLCanvasElement>) {
    if (disabled || pointer.current) return;
    const direction: Record<string, Point> = { ArrowLeft: [-0.015, 0], ArrowRight: [0.015, 0], ArrowUp: [0, -0.04], ArrowDown: [0, 0.04] };
    const delta = direction[event.key];
    if (!delta) return;
    event.preventDefault();
    const previous = keyboardCursor.current;
    const next: Point = [clamp(previous[0] + delta[0]), clamp(previous[1] + delta[1])];
    keyboardCursor.current = next; setCursor(next);
    if (!event.shiftKey || (previous[0] === next[0] && previous[1] === next[1])) return;
    if (!canvasRef.current?.getContext('2d')) { setError('Trình duyệt chưa hỗ trợ vùng ký. Vui lòng dùng trình duyệt khác.'); return; }
    if (!keyboardStroke.current) {
      if (!available()) return;
      invalidate(); keyboardStroke.current = [previous];
    }
    if (pointCount.current + keyboardStroke.current.length >= MAXIMUM_POINTS) return;
    keyboardStroke.current.push(next); redraw();
  }
  function finishKeyboard() {
    const points = keyboardStroke.current;
    keyboardStroke.current = null;
    if (points && !disabled) commit(points);
  }
  function clear() {
    invalidate();
    const active = pointer.current;
    pointer.current = null; keyboardStroke.current = null;
    if (active) { try { canvasRef.current?.releasePointerCapture(active.id); } catch { /* No remaining capture. */ } }
    strokes.current = []; pointCount.current = 0; setHasInk(false); redraw();
  }

  return <div className="space-y-3">
    <p id={descriptionId} className="text-sm text-brand-textSecondary">Vẽ bằng chuột, ngón tay hoặc bút. Với bàn phím, dùng phím mũi tên để di chuyển điểm ký, giữ Shift cùng phím mũi tên để vẽ, thả Shift để kết thúc nét.</p>
    <div className="relative w-full max-w-[640px]">
      <canvas ref={canvasRef} role="application" aria-label="Vùng vẽ chữ ký" aria-describedby={descriptionId} aria-disabled={disabled} tabIndex={disabled ? -1 : 0}
        className="block aspect-[8/3] w-full touch-none rounded-xl border border-brand-border bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerCancel={(event) => end(event, true)} onLostPointerCapture={(event) => end(event, true)}
        onKeyDown={keyDown} onKeyUp={(event) => { if (event.key === 'Shift' || !event.shiftKey) finishKeyboard(); }}
        onFocus={() => setFocused(true)} onBlur={() => { setFocused(false); finishKeyboard(); }}>Trình duyệt của bạn cần hỗ trợ canvas để vẽ chữ ký.</canvas>
      {focused && !disabled && <span aria-hidden="true" className="pointer-events-none absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary bg-soft-accent" style={{ left: `${cursor[0] * 100}%`, top: `${cursor[1] * 100}%` }} />}
    </div>
    <div className="flex flex-wrap items-center gap-3">
      <ActionButton type="button" variant="outline" disabled={disabled} onClick={clear}>Xóa chữ ký</ActionButton>
      <p role="status" className="text-sm text-brand-textSecondary">{hasInk ? 'Đã có nét ký. Bạn có thể vẽ thêm hoặc xóa để ký lại.' : 'Chưa có chữ ký.'}</p>
    </div>
    {error && <p role="alert" className="text-sm text-error">{error}</p>}
  </div>;
}
