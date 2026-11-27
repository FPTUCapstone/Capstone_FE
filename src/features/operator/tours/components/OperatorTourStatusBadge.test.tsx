import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { isLivePublishedTour, OperatorTourStatusBadge } from './OperatorTourStatusBadge';

describe('isLivePublishedTour', () => {
  it('treats Published and past-publishedAtUtc Approved tours as live', () => {
    expect(isLivePublishedTour('Published', null)).toBe(true);
    expect(isLivePublishedTour('Approved', '2020-01-01T00:00:00Z')).toBe(true);
    expect(isLivePublishedTour('Approved', '2999-01-01T00:00:00Z')).toBe(false);
    expect(isLivePublishedTour('Approved', null)).toBe(false);
    expect(isLivePublishedTour('Draft', '2020-01-01T00:00:00Z')).toBe(false);
  });
});

describe('OperatorTourStatusBadge', () => {
  it('shows an approved tour as public only after its publication instant', () => {
    const { rerender } = render(
      <OperatorTourStatusBadge status="Approved" publishedAtUtc="2020-01-01T00:00:00Z" />,
    );
    expect(screen.getByText('Đã xuất bản')).toBeTruthy();

    rerender(<OperatorTourStatusBadge status="Approved" publishedAtUtc="2999-01-01T00:00:00Z" />);
    expect(screen.getByText('Đã duyệt (chưa xuất bản)')).toBeTruthy();
  });
});
