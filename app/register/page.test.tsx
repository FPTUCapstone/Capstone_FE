import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

import RegisterPage from './page';

describe('/register production route', () => {
  it('uses email-only identity, keeps phone optional and requires explicit terms consent', () => {
    render(<RegisterPage />);

    expect(screen.getByRole('textbox', { name: /^Email\s*\*?$/i })).toBeDefined();
    expect(screen.getByRole('textbox', { name: /Số điện thoại \(không bắt buộc\)/i })).toBeDefined();

    const terms = screen.getByRole('checkbox') as HTMLInputElement;
    const submit = screen.getByRole('button', { name: 'Đăng ký' }) as HTMLButtonElement;
    expect(terms.checked).toBe(false);
    expect(submit.disabled).toBe(true);
  });
});
