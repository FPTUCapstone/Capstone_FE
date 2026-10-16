import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TourMediaManager } from './TourMediaManager';
import type { TourMediaItem } from '../types/tourLifecycle';

const mocks = vi.hoisted(() => ({
  upload: vi.fn(),
  setPrimary: vi.fn(),
  remove: vi.fn(),
}));

vi.mock('../services/operatorTourService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../services/operatorTourService')>()),
  uploadTourImage: mocks.upload,
  setPrimaryTourImage: mocks.setPrimary,
  removeTourImage: mocks.remove,
}));

const first: TourMediaItem = { id: '8', url: 'https://cdn.test/a.jpg', isPrimary: true };
const second: TourMediaItem = { id: '9', url: 'https://cdn.test/b.jpg', isPrimary: false };

function pick(file: File) {
  fireEvent.change(screen.getByLabelText(/Tải lên hình ảnh/i), { target: { files: [file] } });
}

describe('TourMediaManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('makes the first uploaded image the primary one and reports the refreshed list', async () => {
    const onChange = vi.fn();
    mocks.upload.mockResolvedValue([first]);
    render(<TourMediaManager tourId="42" tourTitle="Bà Nà" media={[]} onChange={onChange} />);

    pick(new File(['x'], 'cover.jpg', { type: 'image/jpeg' }));

    await waitFor(() => expect(onChange).toHaveBeenCalledWith([first]));
    const [tourId, , altText, options] = [
      mocks.upload.mock.calls[0][0],
      mocks.upload.mock.calls[0][1],
      mocks.upload.mock.calls[0][2],
      mocks.upload.mock.calls[0][3],
    ];
    expect(tourId).toBe('42');
    expect(altText).toContain('Bà Nà');
    expect(options.makePrimary).toBe(true);
    expect(typeof options.idempotencyKey).toBe('string');
  });

  it('does not make a later upload primary and reuses the key when the same file is retried after a failure', async () => {
    mocks.upload.mockRejectedValueOnce(new Error('network')).mockResolvedValueOnce([first, second]);
    render(<TourMediaManager tourId="42" tourTitle="Bà Nà" media={[first]} onChange={vi.fn()} />);
    const file = new File(['x'], 'b.jpg', { type: 'image/jpeg' });

    pick(file);
    await screen.findByRole('alert');
    pick(file);
    await waitFor(() => expect(mocks.upload).toHaveBeenCalledTimes(2));

    expect(mocks.upload.mock.calls[0][3].makePrimary).toBe(false);
    expect(mocks.upload.mock.calls[1][3].idempotencyKey).toBe(mocks.upload.mock.calls[0][3].idempotencyKey);
  });

  it('rejects a non-image locally and shows the MSG19 message without calling the server', async () => {
    render(<TourMediaManager tourId="42" tourTitle="Bà Nà" media={[]} onChange={vi.fn()} />);

    pick(new File(['x'], 'notes.txt', { type: 'text/plain' }));

    expect((await screen.findByRole('alert')).textContent).toMatch(/MSG19/);
    expect(mocks.upload).not.toHaveBeenCalled();
  });

  it('sets a different image as primary and removes an image', async () => {
    const onChange = vi.fn();
    mocks.setPrimary.mockResolvedValue([{ ...first, isPrimary: false }, { ...second, isPrimary: true }]);
    mocks.remove.mockResolvedValue([first]);
    render(<TourMediaManager tourId="42" tourTitle="Bà Nà" media={[first, second]} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: /Đặt làm ảnh đại diện/i }));
    await waitFor(() => expect(mocks.setPrimary).toHaveBeenCalledWith('42', '9'));
    fireEvent.click(screen.getAllByRole('button', { name: /Xóa ảnh/i })[1]);
    await waitFor(() => expect(mocks.remove).toHaveBeenCalledWith('42', '9'));
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('is read-only when disabled', () => {
    render(<TourMediaManager tourId="42" tourTitle="Bà Nà" media={[first]} onChange={vi.fn()} disabled />);

    expect(screen.queryByLabelText(/Tải lên hình ảnh/i)).toBeNull();
    expect(screen.queryByRole('button', { name: /Xóa ảnh/i })).toBeNull();
  });
});
