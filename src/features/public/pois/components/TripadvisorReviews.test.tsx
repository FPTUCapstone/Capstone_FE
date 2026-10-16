import React from 'react';
import { renderToString } from 'react-dom/server';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ExternalReviewsError,
  getExternalReviews,
  translateExternalReview,
} from '../services/externalReviewsApi';
import { TripadvisorReviews } from './TripadvisorReviews';

vi.mock('../services/externalReviewsApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../services/externalReviewsApi')>()),
  getExternalReviews: vi.fn(),
  translateExternalReview: vi.fn(),
}));

const linked = {
  poiId: 42,
  translationAvailable: true,
  source: 'Tripadvisor' as const,
  rating: 4.5,
  reviewCount: 1234,
  ratingImageUrl: 'https://static.tacdn.com/img2/ratings/traveler/4.5.svg',
  url: 'https://www.tripadvisor.com/Attraction_Review-42',
  reviews: [
    {
      id: 900,
      rating: 5,
      title: 'Amazing view',
      text: 'Worth the climb.',
      language: 'en',
      publishedAt: '2026-09-01T10:00:00Z',
      travelDate: null,
      author: 'Anna',
      url: 'https://www.tripadvisor.com/ShowUserReviews-900',
      ratingImageUrl: 'https://static.tacdn.com/img2/ratings/traveler/5.0.svg',
    },
  ],
};

describe('TripadvisorReviews (D6, §3.6)', () => {
  beforeEach(() => {
    vi.mocked(getExternalReviews).mockReset();
    vi.mocked(translateExternalReview).mockReset();
  });

  it('keeps review text out of the server-rendered HTML (Terra policy)', () => {
    vi.mocked(getExternalReviews).mockResolvedValue(linked);

    const html = renderToString(<TripadvisorReviews poiId={42} />);

    expect(html).not.toContain('Worth the climb.');
    expect(html).not.toContain('Amazing view');
  });

  it('shows the rating and count as plain text, with no Tripadvisor image at all', async () => {
    vi.mocked(getExternalReviews).mockResolvedValue({ ...linked, rating: 4.2, reviewCount: 717 });
    const { container } = render(<TripadvisorReviews poiId={42} />);

    expect(await screen.findByText('Worth the climb.')).toBeDefined();
    expect(screen.getByText('4,2/5 · 717 đánh giá')).toBeDefined();
    // Neither the API bubble images (overall or per review) nor any self-drawn rating icon.
    expect(container.querySelector('img')).toBeNull();
    expect(screen.queryByRole('img')).toBeNull();
    expect(document.body.textContent).not.toMatch(/[★☆]/);
  });

  it('groups the count with a dot and omits the score when there is no rating', async () => {
    vi.mocked(getExternalReviews).mockResolvedValue({ ...linked, rating: null });
    render(<TripadvisorReviews poiId={42} />);

    expect(await screen.findByText('1.234 đánh giá')).toBeDefined();
  });

  it('shows each review rating as text out of 5', async () => {
    vi.mocked(getExternalReviews).mockResolvedValue(linked);
    render(<TripadvisorReviews poiId={42} />);

    await screen.findByText('Worth the climb.');
    expect(screen.getByText('5/5')).toBeDefined();
  });

  it('never links out to Tripadvisor: neither the attribution nor a single review', async () => {
    vi.mocked(getExternalReviews).mockResolvedValue(linked);
    const { container } = render(<TripadvisorReviews poiId={42} />);

    await screen.findByText('Worth the climb.');
    expect(screen.queryByRole('link')).toBeNull();
    expect(container.querySelector('a')).toBeNull();
    expect(screen.queryByText('Đọc trên Tripadvisor')).toBeNull();
  });

  it('shows only the rating attribution and a neutral note when there are no recent reviews', async () => {
    vi.mocked(getExternalReviews).mockResolvedValue({ ...linked, reviewCount: 19, reviews: [] });
    render(<TripadvisorReviews poiId={42} />);

    expect(await screen.findByText('Chưa có đánh giá gần đây để hiển thị.')).toBeDefined();
    expect(screen.getByText('4,5/5 · 19 đánh giá')).toBeDefined();
    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.queryByRole('list')).toBeNull();
    expect(screen.queryByText('Chưa có đánh giá gần đây trên Tripadvisor.')).toBeNull();
  });

  it('renders nothing when the POI is not linked to Tripadvisor', async () => {
    vi.mocked(getExternalReviews).mockResolvedValue({
      ...linked,
      source: null,
      rating: null,
      reviewCount: 0,
      ratingImageUrl: null,
      url: null,
      reviews: [],
    });
    const { container } = render(<TripadvisorReviews poiId={42} />);

    await vi.waitFor(() => expect(getExternalReviews).toHaveBeenCalled());
    await vi.waitFor(() => expect(container.textContent).toBe(''));
  });

  it('translates a review on demand and can show the original again', async () => {
    vi.mocked(getExternalReviews).mockResolvedValue(linked);
    vi.mocked(translateExternalReview).mockResolvedValue({
      reviewId: 900,
      language: 'vi',
      title: 'Cảnh tuyệt đẹp',
      text: 'Đáng để leo.',
      machineTranslated: true,
    });
    render(<TripadvisorReviews poiId={42} />);

    fireEvent.click(await screen.findByRole('button', { name: 'Dịch sang tiếng Việt' }));

    expect(await screen.findByText('Đáng để leo.')).toBeDefined();
    expect(screen.getByText(/Bản dịch tự động/)).toBeDefined();
    expect(translateExternalReview).toHaveBeenCalledWith(42, 900);

    fireEvent.click(screen.getByRole('button', { name: 'Xem bản gốc' }));
    expect(screen.getByText('Worth the climb.')).toBeDefined();
  });

  it('offers no translation when it is switched off', async () => {
    vi.mocked(getExternalReviews).mockResolvedValue({ ...linked, translationAvailable: false });
    render(<TripadvisorReviews poiId={42} />);

    await screen.findByText('Worth the climb.');
    expect(screen.queryByRole('button', { name: 'Dịch sang tiếng Việt' })).toBeNull();
  });

  it('says so when reviews cannot be loaded', async () => {
    vi.mocked(getExternalReviews).mockRejectedValue(
      new ExternalReviewsError('Không tải được đánh giá Tripadvisor lúc này.', 500),
    );
    render(<TripadvisorReviews poiId={42} />);

    expect(await screen.findByText('Không tải được đánh giá Tripadvisor lúc này.')).toBeDefined();
  });
});

describe('TripadvisorReviews URL safety (FEC §12)', () => {
  it('never renders an API URL, safe or not, as an image or a link', async () => {
    vi.mocked(getExternalReviews).mockResolvedValue({
      ...linked,
      url: 'javascript:alert(1)',
      ratingImageUrl: 'http://static.tacdn.com/bubble.svg',
      reviews: [{ ...linked.reviews[0], url: 'javascript:alert(2)', ratingImageUrl: 'data:image/svg+xml,x' }],
    });
    const { container } = render(<TripadvisorReviews poiId={42} />);

    await screen.findByText('Worth the climb.');
    expect(container.querySelector('a[href^="javascript"]')).toBeNull();
    expect(container.querySelector('img')).toBeNull();
    expect(screen.queryByRole('link', { name: 'Đọc trên Tripadvisor' })).toBeNull();
    expect(screen.getByText('4,5/5 · 1.234 đánh giá')).toBeDefined();
  });
});
