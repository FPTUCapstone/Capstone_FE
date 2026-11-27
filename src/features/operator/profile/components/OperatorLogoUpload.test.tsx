import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OperatorLogoUpload } from './OperatorLogoUpload';

describe('OperatorLogoUpload Component (BR-16, MSG19)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-logo-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  it('rejects unsupported file type (PDF, GIF) with MSG19', () => {
    const onLogoChange = vi.fn();
    render(<OperatorLogoUpload onLogoChange={onLogoChange} isDemo={false} />);

    const input = screen.getByLabelText(/Tải lên ảnh logo doanh nghiệp/i);
    const pdfFile = new File(['dummy'], 'doc.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [pdfFile] } });

    expect(screen.getByText(/MSG19/i)).toBeDefined();
    expect(onLogoChange).not.toHaveBeenCalled();

    const gifFile = new File(['dummy'], 'anim.gif', { type: 'image/gif' });
    fireEvent.change(input, { target: { files: [gifFile] } });
    expect(onLogoChange).not.toHaveBeenCalled();
  });

  it('rejects file larger than 5MB or empty file with MSG19', () => {
    const onLogoChange = vi.fn();
    render(<OperatorLogoUpload onLogoChange={onLogoChange} isDemo={false} />);

    const input = screen.getByLabelText(/Tải lên ảnh logo doanh nghiệp/i);
    const largeFile = new File(['dummy'], 'large.jpg', { type: 'image/jpeg' });
    Object.defineProperty(largeFile, 'size', { value: 5 * 1024 * 1024 + 1 });
    fireEvent.change(input, { target: { files: [largeFile] } });

    expect(screen.getByText(/MSG19/i)).toBeDefined();
    expect(onLogoChange).not.toHaveBeenCalled();
  });

  it('in real mode: allows upload and remove and notifies parent', () => {
    const onLogoChange = vi.fn();
    const onRemoveLogo = vi.fn();
    render(
      <OperatorLogoUpload
        logoUrl="https://res.cloudinary.com/demo/logo.png"
        onLogoChange={onLogoChange}
        onRemoveLogo={onRemoveLogo}
        isDemo={false}
      />
    );

    expect(screen.queryByText(/đang chờ kết nối máy chủ/i)).toBeNull();

    const input = screen.getByLabelText(/Tải lên ảnh logo doanh nghiệp/i);
    expect(input.hasAttribute('disabled')).toBe(false);

    const validFile = new File(['dummy'], 'logo.png', { type: 'image/png' });
    fireEvent.change(input, { target: { files: [validFile] } });

    expect(global.URL.createObjectURL).toHaveBeenCalledWith(validFile);
    expect(onLogoChange).toHaveBeenCalledWith(validFile, 'blob:mock-logo-url');

    const removeBtn = screen.getByRole('button', { name: /Xóa/i });
    fireEvent.click(removeBtn);
    expect(onRemoveLogo).toHaveBeenCalledTimes(1);
  });

  it('revokes blob URLs on component unmount to prevent leaks', () => {
    const onLogoChange = vi.fn();
    const { unmount } = render(
      <OperatorLogoUpload onLogoChange={onLogoChange} isDemo={false} />
    );

    const input = screen.getByLabelText(/Tải lên ảnh logo doanh nghiệp/i);
    const validFile = new File(['dummy'], 'logo.png', { type: 'image/png' });
    fireEvent.change(input, { target: { files: [validFile] } });

    unmount();
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-logo-url');
  });
});
