import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import HeroPanel from './HeroPanel';
import RegistrationHeroPanel from './registration/HeroPanel';

const description = 'Công cụ dành riêng cho traveler Việt — tối ưu lịch trình, khám phá điểm đến và đồng hành cùng bạn trên mọi chuyến đi.';

describe('auth hero compatibility wrappers', () => {
  it.each([
    ['generic', HeroPanel, 'Lên kế hoạch du lịch chỉ trong vài phút.', 'relative hidden lg:flex hero-bg text-white overflow-hidden'],
    ['registration', RegistrationHeroPanel, 'Lên kế hoạch du lịch chỉ trong vài phút.', 'relative hidden lg:flex lg:sticky lg:top-0 lg:h-screen hero-bg text-white overflow-hidden'],
  ] as const)('preserves default content and responsive positioning for %s', (_name, Panel, title, classes) => {
    const { container } = render(<Panel />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(title);
    expect(container.querySelector('aside')?.className).toBe(classes);
    expect(screen.getByText(description)).not.toBeNull();
    for (const text of ['TripMate', 'Lịch trình thông minh', 'CSP Engine tối ưu giờ đi', 'Cảnh báo thời tiết', 'Tự động điều chỉnh kế hoạch', 'Đồng hành nhóm', 'Chia sẻ vị trí GPS thời gian thực', '120+', 'Điểm đến nổi bật', '15K+', 'Traveler đang dùng', '4.9★', 'Đánh giá trung bình']) {
      expect(screen.getByText(text)).not.toBeNull();
    }
  });

  it('renders caller-owned title markup and description', () => {
    render(<HeroPanel title={<>Welcome <em>traveler</em></>} description="Custom description" />);
    expect(screen.getByRole('heading', { level: 1 }).innerHTML).toBe('Welcome <em>traveler</em>');
    expect(screen.getByText('Custom description')).not.toBeNull();
  });

  it.each([null, ''])('preserves an explicitly empty title (%s) and description', (title) => {
    const { container } = render(<HeroPanel title={title} description="" />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('');
    expect(container.querySelector('p')?.textContent).toBe('');
  });
});
