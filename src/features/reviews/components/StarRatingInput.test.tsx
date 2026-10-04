import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { StarRatingInput } from './StarRatingInput';

describe('StarRatingInput Component (REVIEW-2, REVIEW-3)', () => {
  it('REVIEW-2: Rating defaults to unselected (value 0)', () => {
    const handleChange = vi.fn();
    render(<StarRatingInput value={0} onChange={handleChange} />);

    expect(screen.getByText('Chưa chọn số sao')).toBeDefined();

    // Verify all 5 stars have aria-checked="false"
    const stars = screen.getAllByRole('radio');
    expect(stars).toHaveLength(5);
    stars.forEach((star) => {
      expect(star.getAttribute('aria-checked')).toBe('false');
    });
  });

  it('Renders accessible labels for all 5 stars', () => {
    render(<StarRatingInput value={3} onChange={vi.fn()} />);

    expect(screen.getByRole('radio', { name: '1 sao' })).toBeDefined();
    expect(screen.getByRole('radio', { name: '2 sao' })).toBeDefined();
    expect(screen.getByRole('radio', { name: '3 sao' })).toBeDefined();
    expect(screen.getByRole('radio', { name: '4 sao' })).toBeDefined();
    expect(screen.getByRole('radio', { name: '5 sao' })).toBeDefined();

    expect(screen.getByText('Hài lòng! 3/5 sao')).toBeDefined();
  });

  it('REVIEW-3: Keyboard navigation with ArrowRight increases rating and calls onChange', () => {
    const handleChange = vi.fn();
    render(<StarRatingInput value={2} onChange={handleChange} />);

    const star2 = screen.getByRole('radio', { name: '2 sao' });
    star2.focus();

    // Press ArrowRight -> should change to 3
    fireEvent.keyDown(star2, { key: 'ArrowRight' });
    expect(handleChange).toHaveBeenCalledWith(3);
  });

  it('REVIEW-3: Keyboard navigation with ArrowLeft decreases rating and calls onChange', () => {
    const handleChange = vi.fn();
    render(<StarRatingInput value={4} onChange={handleChange} />);

    const star4 = screen.getByRole('radio', { name: '4 sao' });
    star4.focus();

    // Press ArrowLeft -> should change to 3
    fireEvent.keyDown(star4, { key: 'ArrowLeft' });
    expect(handleChange).toHaveBeenCalledWith(3);
  });

  it('REVIEW-3: Enter or Space selects the focused star', () => {
    const handleChange = vi.fn();
    render(<StarRatingInput value={0} onChange={handleChange} />);

    const star5 = screen.getByRole('radio', { name: '5 sao' });
    fireEvent.keyDown(star5, { key: 'Enter' });
    expect(handleChange).toHaveBeenCalledWith(5);

    fireEvent.keyDown(star5, { key: ' ' });
    expect(handleChange).toHaveBeenCalledWith(5);
  });

  it('Clicking a star selects it', () => {
    const handleChange = vi.fn();
    render(<StarRatingInput value={0} onChange={handleChange} />);

    const star4 = screen.getByRole('radio', { name: '4 sao' });
    fireEvent.click(star4);
    expect(handleChange).toHaveBeenCalledWith(4);
  });
});
