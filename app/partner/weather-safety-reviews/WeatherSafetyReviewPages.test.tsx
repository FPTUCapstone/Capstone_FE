import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ListPage from './page';
import DetailPage from './[reviewId]/page';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock('@/features/operator/weather-safety/weatherSafetyApi', () => ({
  getWeatherSafetyReviewBadgeCount: vi.fn().mockResolvedValue(0),
}));
vi.mock('@/features/operator/weather-safety/components/WeatherSafetyReviewListPage', () => ({
  WeatherSafetyReviewListPage: () => <div>review list</div>,
}));
vi.mock('@/features/operator/weather-safety/components/WeatherSafetyReviewDetailPage', () => ({
  WeatherSafetyReviewDetailPage: ({ reviewId }: { reviewId: number }) => <div>review {reviewId}</div>,
}));

function expectSharedWorkspace(content: string) {
  const activeLink = screen.getByRole('link', { name: /Cảnh báo an toàn/i, current: 'page' });
  expect(activeLink.closest('nav')?.getAttribute('aria-label')).toBe('Điều hướng không gian làm việc đối tác');
  expect(screen.getByRole('button', { name: 'Mở menu quản lý' })).toBeDefined();
  const main = screen.getByRole('main');
  expect(main.textContent).toContain(content);
}

describe('UC-70 partner pages', () => {
  it('shows the inbox inside the shared partner workspace', () => {
    render(<ListPage />);

    expectSharedWorkspace('review list');
  });

  it('shows a review inside the shared partner workspace', async () => {
    render(await DetailPage({ params: Promise.resolve({ reviewId: '15' }) }));

    expectSharedWorkspace('review 15');
  });
});
