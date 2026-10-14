import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const service = vi.hoisted(() => ({ uploadImage: vi.fn() }));
vi.mock('../landingContentService', async () => {
  const actual = await vi.importActual<typeof import('../landingContentService')>('../landingContentService');
  return { ...actual, ...service };
});

import { LandingContentError } from '../landingContentService';
import { ImageField, UploadStatusContext } from './ImageField';

const MB = 1024 * 1024;

function fileOf(size: number, type: string) {
  const file = new File(['x'], 'photo', { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

function pick(file: File) {
  fireEvent.change(screen.getByLabelText('Banner Image'), { target: { files: [file] } });
}

beforeEach(() => vi.clearAllMocks());
afterEach(() => cleanup());

describe('ImageField', () => {
  it('uploads a valid image and reports the stored reference', async () => {
    service.uploadImage.mockResolvedValue({ mediaId: 'm1', url: '/m1.png' });
    const onChange = vi.fn();
    render(<ImageField label="Banner Image" value={null} onChange={onChange} disabled={false} />);
    pick(fileOf(5 * MB, 'image/png'));
    await waitFor(() => expect(onChange).toHaveBeenCalledWith({ mediaId: 'm1', url: '/m1.png' }));
    expect(service.uploadImage).toHaveBeenCalledTimes(1);
  });

  it('rejects an image one byte over 5 MB without uploading', () => {
    const onChange = vi.fn();
    render(<ImageField label="Banner Image" value={null} onChange={onChange} disabled={false} />);
    pick(fileOf(5 * MB + 1, 'image/png'));
    expect(screen.getByText('The image must not exceed 5 MB.')).toBeTruthy();
    expect(service.uploadImage).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('rejects an unsupported type without uploading', () => {
    render(<ImageField label="Banner Image" value={null} onChange={() => {}} disabled={false} />);
    pick(fileOf(1000, 'image/gif'));
    expect(screen.getByText('The image must be a JPEG, PNG or WebP file.')).toBeTruthy();
    expect(service.uploadImage).not.toHaveBeenCalled();
  });

  it('shows the unavailable message when the upload fails and keeps the value', async () => {
    service.uploadImage.mockRejectedValue(new Error('down'));
    const onChange = vi.fn();
    render(<ImageField label="Banner Image" value={null} onChange={onChange} disabled={false} />);
    pick(fileOf(1000, 'image/png'));
    expect(await screen.findByText(/temporarily unable to process your request/)).toBeTruthy();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('offers a retry after a failed upload that uploads the same file again', async () => {
    service.uploadImage.mockRejectedValueOnce(new Error('down')).mockResolvedValueOnce({ mediaId: 'm2', url: '/m2.png' });
    const onChange = vi.fn();
    render(<ImageField label="Banner Image" value={null} onChange={onChange} disabled={false} />);
    const file = fileOf(1000, 'image/png');
    pick(file);
    fireEvent.click(await screen.findByRole('button', { name: 'Retry upload' }));
    await waitFor(() => expect(onChange).toHaveBeenCalledWith({ mediaId: 'm2', url: '/m2.png' }));
    expect(service.uploadImage).toHaveBeenCalledTimes(2);
    expect(service.uploadImage.mock.calls[1][0]).toBe(file);
    expect(screen.queryByRole('button', { name: 'Retry upload' })).toBeNull();
  });

  it('tells the screen to send the user to sign in when the upload is rejected with 401', async () => {
    service.uploadImage.mockRejectedValue(new LandingContentError(401));
    const onUnauthorized = vi.fn();
    render(
      <UploadStatusContext.Provider value={{ track: () => {}, onUnauthorized }}>
        <ImageField label="Banner Image" value={null} onChange={() => {}} disabled={false} />
      </UploadStatusContext.Provider>,
    );
    pick(fileOf(1000, 'image/png'));
    await waitFor(() => expect(onUnauthorized).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole('button', { name: 'Retry upload' })).toBeNull();
  });

  it('shows the error passed by the parent and lets the user remove the current image', () => {
    const onChange = vi.fn();
    render(
      <ImageField
        label="Banner Image"
        value={{ mediaId: 'm1', url: '/m1.png' }}
        error="required"
        onChange={onChange}
        disabled={false}
      />,
    );
    expect(screen.getByText('This field is required.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Remove image' }));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('disables the controls', () => {
    render(<ImageField label="Banner Image" value={null} onChange={() => {}} disabled />);
    expect((screen.getByLabelText('Banner Image') as HTMLInputElement).disabled).toBe(true);
  });
});
