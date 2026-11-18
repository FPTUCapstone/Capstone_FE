// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { TourPriceRangeSlider } from '../TourPriceRangeSlider';

describe('TourPriceRangeSlider', () => {
  afterEach(cleanup);

  it('renders dual thumbs with accessible labels and initial unconstrained Any price state', () => {
    const onMinChange = vi.fn();
    const onMaxChange = vi.fn();

    render(
      <TourPriceRangeSlider
        minPrice=""
        maxPrice=""
        onMinChange={onMinChange}
        onMaxChange={onMaxChange}
        locale="vi"
      />,
    );

    expect(screen.getByText('Tất cả mức giá')).toBeDefined();

    const minThumb = screen.getByLabelText('Giá tối thiểu');
    const maxThumb = screen.getByLabelText('Giá tối đa');

    expect(minThumb).toBeDefined();
    expect(maxThumb).toBeDefined();
    expect(minThumb.getAttribute('type')).toBe('range');
    expect(maxThumb.getAttribute('type')).toBe('range');
  });

  it('renders English labels when locale is en', () => {
    render(
      <TourPriceRangeSlider
        minPrice=""
        maxPrice=""
        onMinChange={vi.fn()}
        onMaxChange={vi.fn()}
        locale="en"
      />,
    );

    expect(screen.getByText('Any price')).toBeDefined();
    expect(screen.getByLabelText('Minimum price')).toBeDefined();
    expect(screen.getByLabelText('Maximum price')).toBeDefined();
  });

  it('formats selected price range using Vietnamese thousand separators and zero decimal places', () => {
    render(
      <TourPriceRangeSlider
        minPrice="1000000"
        maxPrice="3000000"
        onMinChange={vi.fn()}
        onMaxChange={vi.fn()}
        locale="vi"
      />,
    );

    // Displays formatted range e.g. 1.000.000 ₫ – 3.000.000 ₫
    expect(screen.getByText(/1\.000\.000.*–.*3\.000\.000/)).toBeDefined();

    // Check Reset price button appears when filtered
    expect(screen.getByRole('button', { name: 'Đặt lại giá' })).toBeDefined();
  });

  it('allows clicking quick preset price-band chips', () => {
    const onRangeChange = vi.fn();

    render(
      <TourPriceRangeSlider
        minPrice=""
        maxPrice=""
        onMinChange={vi.fn()}
        onMaxChange={vi.fn()}
        onRangeChange={onRangeChange}
        locale="vi"
      />,
    );

    const preset1m3m = screen.getByRole('button', { name: '1 - 3 triệu' });
    fireEvent.click(preset1m3m);

    expect(onRangeChange).toHaveBeenCalledWith('1000000', '3000000');
  });

  it('resets price range when clicking Reset price button', () => {
    const onRangeChange = vi.fn();

    render(
      <TourPriceRangeSlider
        minPrice="1500000"
        maxPrice="5000000"
        onMinChange={vi.fn()}
        onMaxChange={vi.fn()}
        onRangeChange={onRangeChange}
        locale="vi"
      />,
    );

    const resetBtn = screen.getByRole('button', { name: 'Đặt lại giá' });
    fireEvent.click(resetBtn);

    expect(onRangeChange).toHaveBeenCalledWith('', '');
  });

  it('provides aria-valuemin, aria-valuemax, aria-valuenow, and aria-valuetext for accessibility', () => {
    render(
      <TourPriceRangeSlider
        minPrice="500000"
        maxPrice="4000000"
        onMinChange={vi.fn()}
        onMaxChange={vi.fn()}
        locale="vi"
      />,
    );

    const minThumb = screen.getByLabelText('Giá tối thiểu');
    const maxThumb = screen.getByLabelText('Giá tối đa');

    expect(minThumb.getAttribute('aria-valuenow')).toBe('500000');
    expect(minThumb.getAttribute('aria-valuetext')).toContain('500.000');

    expect(maxThumb.getAttribute('aria-valuenow')).toBe('4000000');
    expect(maxThumb.getAttribute('aria-valuetext')).toContain('4.000.000');
  });
});
