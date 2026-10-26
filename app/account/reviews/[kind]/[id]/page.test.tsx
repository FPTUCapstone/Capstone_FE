import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockNotFound = vi.fn();

vi.mock('next/navigation', () => ({
  notFound: () => {
    mockNotFound();
    throw new Error('NEXT_NOT_FOUND');
  },
}));

vi.mock('@/features/reviews/components/CanonicalTripReviewPage', () => ({
  CanonicalTripReviewPage: ({ reference }: { reference: { kind: string; id: string } }) => (
    <div data-testid="canonical-review-page">
      <span>{reference.kind}</span>
      <span>{reference.id}</span>
    </div>
  ),
}));

import ReviewPage, { metadata } from './page';

describe('/account/reviews/[kind]/[id] Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exposes valid page metadata', () => {
    expect(metadata.title).toBeTruthy();
    expect(metadata.description).toBeTruthy();
  });

  it('renders CanonicalTripReviewPage for valid commerceBooking with positive int64 ID', async () => {
    const component = await ReviewPage({
      params: Promise.resolve({ kind: 'commerceBooking', id: '123' }),
    });

    render(component);

    expect(screen.getByTestId('canonical-review-page')).toBeTruthy();
    expect(screen.getByText('commerceBooking')).toBeTruthy();
    expect(screen.getByText('123')).toBeTruthy();
    expect(mockNotFound).not.toHaveBeenCalled();
  });

  it('renders CanonicalTripReviewPage for valid serviceBooking with positive int64 ID', async () => {
    const component = await ReviewPage({
      params: Promise.resolve({ kind: 'serviceBooking', id: '9223372036854775807' }),
    });

    render(component);

    expect(screen.getByTestId('canonical-review-page')).toBeTruthy();
    expect(screen.getByText('serviceBooking')).toBeTruthy();
    expect(screen.getByText('9223372036854775807')).toBeTruthy();
    expect(mockNotFound).not.toHaveBeenCalled();
  });

  it('triggers notFound when kind is invalid', async () => {
    await expect(
      ReviewPage({
        params: Promise.resolve({ kind: 'invalidKind', id: '123' }),
      }),
    ).rejects.toThrow('NEXT_NOT_FOUND');

    expect(mockNotFound).toHaveBeenCalled();
  });

  it('triggers notFound when id is not a positive int64 string', async () => {
    await expect(
      ReviewPage({
        params: Promise.resolve({ kind: 'commerceBooking', id: 'not-a-number' }),
      }),
    ).rejects.toThrow('NEXT_NOT_FOUND');

    expect(mockNotFound).toHaveBeenCalled();
  });

  it('triggers notFound when id is negative or zero', async () => {
    await expect(
      ReviewPage({
        params: Promise.resolve({ kind: 'commerceBooking', id: '0' }),
      }),
    ).rejects.toThrow('NEXT_NOT_FOUND');

    expect(mockNotFound).toHaveBeenCalled();
  });
});
