import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SignaturePad } from './SignaturePad';

const exports: BlobCallback[] = [];
const context = { clearRect: vi.fn(), setTransform: vi.fn(), beginPath: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(), stroke: vi.fn(), lineCap: '', lineJoin: '', lineWidth: 0, strokeStyle: '' };
let resized: ResizeObserverCallback;
class TestPointerEvent extends MouseEvent {
  readonly pointerId: number;
  readonly isPrimary: boolean;
  readonly pointerType: string;
  constructor(type: string, init: PointerEventInit = {}) {
    super(type, init); this.pointerId = init.pointerId ?? 1; this.isPrimary = init.isPrimary ?? true; this.pointerType = init.pointerType ?? 'mouse';
  }
}
beforeEach(() => {
  vi.clearAllMocks(); exports.length = 0;
  vi.stubGlobal('PointerEvent', TestPointerEvent);
  vi.stubGlobal('ResizeObserver', class { constructor(callback: ResizeObserverCallback) { resized = callback; } observe() {} disconnect() {} });
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) => { exports.push(callback); });
  vi.spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, width: 640, height: 240, right: 640, bottom: 240, x: 0, y: 0, toJSON() {} });
  HTMLCanvasElement.prototype.setPointerCapture = vi.fn();
  HTMLCanvasElement.prototype.releasePointerCapture = vi.fn();
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
function draw(canvas: HTMLElement, pointerType = 'mouse') {
  fireEvent.pointerDown(canvas, { pointerId: 1, pointerType, clientX: 40, clientY: 50, button: 0, isPrimary: true });
  fireEvent.pointerMove(canvas, { pointerId: 1, pointerType, clientX: 140, clientY: 80, buttons: 1 });
  fireEvent.pointerUp(canvas, { pointerId: 1, pointerType, clientX: 140, clientY: 80 });
}
function finishExport(index = 0, value: Blob | null = new Blob(['signature'], { type: 'image/png' })) {
  act(() => exports[index](value));
  return value;
}
describe('drawn signature capture', () => {
  it.each(['mouse', 'touch', 'pen'])('exports a PNG after completing a %s stroke', (pointerType) => {
    const onChange = vi.fn(); render(<SignaturePad onChange={onChange} />);
    const canvas = screen.getByRole('application', { name: 'Vùng vẽ chữ ký' });
    draw(canvas, pointerType);
    expect(canvas.setPointerCapture).toHaveBeenCalledWith(1);
    expect(onChange).not.toHaveBeenCalledWith(expect.any(Blob));
    const image = finishExport();
    expect(onChange).toHaveBeenLastCalledWith(image);
    expect(canvas.releasePointerCapture).toHaveBeenCalledWith(1);
  });
  it('does not turn an accidental tap or cancelled stroke into a signature', () => {
    const onChange = vi.fn(); render(<SignaturePad onChange={onChange} />);
    const canvas = screen.getByRole('application');
    fireEvent.pointerDown(canvas, { pointerId: 1, clientX: 40, clientY: 50, button: 0 });
    fireEvent.pointerUp(canvas, { pointerId: 1 });
    fireEvent.pointerDown(canvas, { pointerId: 2, clientX: 40, clientY: 50, button: 0 });
    fireEvent.pointerMove(canvas, { pointerId: 2, clientX: 140, clientY: 80 });
    fireEvent.pointerCancel(canvas, { pointerId: 2 });
    expect(exports).toHaveLength(0);
    expect(onChange).not.toHaveBeenCalledWith(expect.any(Blob));
  });
  it('clears the value and ignores an export that finishes after clearing', () => {
    const onChange = vi.fn(); render(<SignaturePad onChange={onChange} />);
    draw(screen.getByRole('application'));
    fireEvent.click(screen.getByRole('button', { name: 'Xóa chữ ký' }));
    finishExport();
    expect(onChange).toHaveBeenLastCalledWith(null);
    expect(onChange).not.toHaveBeenCalledWith(expect.any(Blob));
  });
  it('ignores stale exports and drawing while disabled', () => {
    const onChange = vi.fn(); const view = render(<SignaturePad onChange={onChange} />);
    draw(screen.getByRole('application'));
    view.rerender(<SignaturePad onChange={onChange} disabled />);
    finishExport(); draw(screen.getByRole('application'));
    expect(exports).toHaveLength(1);
    expect(onChange).not.toHaveBeenCalledWith(expect.any(Blob));
  });
  it('does not accept input from a second pointer while drawing', () => {
    render(<SignaturePad onChange={vi.fn()} />); const canvas = screen.getByRole('application');
    fireEvent.pointerDown(canvas, { pointerId: 1, clientX: 40, clientY: 50, button: 0 });
    fireEvent.pointerDown(canvas, { pointerId: 2, clientX: 200, clientY: 150, button: 0 });
    fireEvent.pointerMove(canvas, { pointerId: 2, clientX: 300, clientY: 180 });
    fireEvent.pointerUp(canvas, { pointerId: 2 });
    expect(exports).toHaveLength(0);
    fireEvent.pointerMove(canvas, { pointerId: 1, clientX: 140, clientY: 80 });
    fireEvent.pointerUp(canvas, { pointerId: 1 });
    expect(exports).toHaveLength(1);
  });
  it('redraws existing strokes after resizing without changing the signature value', () => {
    const onChange = vi.fn(); render(<SignaturePad onChange={onChange} />);
    draw(screen.getByRole('application')); const image = finishExport();
    const count = context.stroke.mock.calls.length;
    act(() => resized([], {} as ResizeObserver));
    expect(context.stroke.mock.calls.length).toBeGreaterThan(count);
    expect(exports).toHaveLength(1);
    expect(onChange).toHaveBeenLastCalledWith(image);
  });
  it('supports keyboard drawing and does not draw when moving the keyboard cursor alone', () => {
    const onChange = vi.fn(); render(<SignaturePad onChange={onChange} />);
    const canvas = screen.getByRole('application');
    fireEvent.keyDown(canvas, { key: 'ArrowRight' }); fireEvent.keyUp(canvas, { key: 'ArrowRight' });
    expect(exports).toHaveLength(0);
    fireEvent.keyDown(canvas, { key: 'ArrowRight', shiftKey: true });
    fireEvent.keyDown(canvas, { key: 'ArrowDown', shiftKey: true });
    fireEvent.keyUp(canvas, { key: 'Shift' });
    expect(exports).toHaveLength(1); finishExport();
    expect(onChange).toHaveBeenLastCalledWith(expect.any(Blob));
  });
  it('reports an export failure instead of retaining a submit-ready value', () => {
    const onChange = vi.fn(); render(<SignaturePad onChange={onChange} />);
    draw(screen.getByRole('application')); finishExport(0, null);
    expect(onChange).toHaveBeenLastCalledWith(null);
    expect(screen.getByRole('alert').textContent).toContain('Chưa thể tạo ảnh chữ ký');
  });
  it('does not replace the latest drawing with an older asynchronous export', () => {
    const onChange = vi.fn(); render(<SignaturePad onChange={onChange} />);
    const canvas = screen.getByRole('application'); draw(canvas); draw(canvas);
    const latest = finishExport(1); finishExport(0);
    expect(onChange).toHaveBeenLastCalledWith(latest);
    expect(onChange.mock.calls.filter(([value]) => value instanceof Blob)).toHaveLength(1);
  });
  it('does not deliver a signature after the input is unmounted', () => {
    const onChange = vi.fn(); const view = render(<SignaturePad onChange={onChange} />);
    draw(screen.getByRole('application')); view.unmount(); finishExport();
    expect(onChange).not.toHaveBeenCalledWith(expect.any(Blob));
  });
  it('caps the backing bitmap even when the device reports an extreme pixel ratio', () => {
    vi.stubGlobal('devicePixelRatio', 100);
    render(<SignaturePad onChange={vi.fn()} />);
    const canvas = screen.getByRole('application') as HTMLCanvasElement;
    expect(canvas.width).toBeLessThanOrEqual(1280);
    expect(canvas.height).toBeLessThanOrEqual(480);
  });
  it('keeps exported image dimensions usable in a very narrow container', () => {
    vi.mocked(HTMLCanvasElement.prototype.getBoundingClientRect).mockReturnValue({ left: 0, top: 0, width: 20, height: 7.5, right: 20, bottom: 7.5, x: 0, y: 0, toJSON() {} });
    render(<SignaturePad onChange={vi.fn()} />);
    const canvas = screen.getByRole('application') as HTMLCanvasElement;
    expect(canvas.width).toBeGreaterThanOrEqual(64);
    expect(canvas.height).toBeGreaterThanOrEqual(32);
  });
  it('rejects an unexpectedly oversized PNG export', () => {
    const onChange = vi.fn(); render(<SignaturePad onChange={onChange} />);
    draw(screen.getByRole('application'));
    finishExport(0, new Blob([new Uint8Array(512 * 1024 + 1)], { type: 'image/png' }));
    expect(onChange).toHaveBeenLastCalledWith(null);
    expect(screen.getByRole('alert').textContent).toContain('Chưa thể tạo ảnh chữ ký');
  });
  it('fails closed when keyboard drawing is attempted without a canvas context', () => {
    vi.mocked(HTMLCanvasElement.prototype.getContext).mockReturnValue(null);
    const onChange = vi.fn(); render(<SignaturePad onChange={onChange} />);
    const canvas = screen.getByRole('application');
    fireEvent.keyDown(canvas, { key: 'ArrowRight', shiftKey: true });
    fireEvent.keyUp(canvas, { key: 'Shift' });
    expect(exports).toHaveLength(0);
    expect(screen.getByRole('alert').textContent).toContain('chưa hỗ trợ vùng ký');
  });
});
