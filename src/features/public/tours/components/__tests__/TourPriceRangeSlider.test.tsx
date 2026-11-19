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

    const minThumb = screen.getByLabelText('Giá tối thiểu') as HTMLInputElement;
    const maxThumb = screen.getByLabelText('Giá tối đa') as HTMLInputElement;

    expect(minThumb).toBeDefined();
    expect(maxThumb).toBeDefined();
    expect(minThumb.type).toBe('range');
    expect(maxThumb.type).toBe('range');
    expect(minThumb.value).toBe('0');
    expect(maxThumb.value).toBe('10000000');
    expect(screen.queryByRole('button', { name: 'Đặt lại giá' })).toBeNull();
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

    expect(screen.getByText(/1\.000\.000.*–.*3\.000\.000/)).toBeDefined();
    expect(screen.getByRole('button', { name: 'Đặt lại giá' })).toBeDefined();
  });

  it('clamps minimum thumb when approaching or attempting to cross maximum thumb', () => {
    const onMinChange = vi.fn();
    const onMaxChange = vi.fn();

    render(
      <TourPriceRangeSlider
        minPrice="1000000"
        maxPrice="3000000"
        onMinChange={onMinChange}
        onMaxChange={onMaxChange}
        locale="vi"
      />,
    );

    const minThumb = screen.getByLabelText('Giá tối thiểu');

    // Attempt to drag min thumb to 4,000,000 (past max of 3,000,000)
    fireEvent.change(minThumb, { target: { value: '4000000' } });
    expect(onMinChange).toHaveBeenCalledWith('3000000');

    // Valid change below max
    fireEvent.change(minThumb, { target: { value: '2500000' } });
    expect(onMinChange).toHaveBeenCalledWith('2500000');
  });

  it('clamps maximum thumb when approaching or attempting to cross minimum thumb', () => {
    const onMinChange = vi.fn();
    const onMaxChange = vi.fn();

    render(
      <TourPriceRangeSlider
        minPrice="2000000"
        maxPrice="4000000"
        onMinChange={onMinChange}
        onMaxChange={onMaxChange}
        locale="vi"
      />,
    );

    const maxThumb = screen.getByLabelText('Giá tối đa');

    // Attempt to drag max thumb to 1,000,000 (below min of 2,000,000)
    fireEvent.change(maxThumb, { target: { value: '1000000' } });
    expect(onMaxChange).toHaveBeenCalledWith('2000000');

    // Valid change above min
    fireEvent.change(maxThumb, { target: { value: '3500000' } });
    expect(onMaxChange).toHaveBeenCalledWith('3500000');
  });

  it('handles equal minimum and maximum price boundaries gracefully', () => {
    render(
      <TourPriceRangeSlider
        minPrice="2500000"
        maxPrice="2500000"
        onMinChange={vi.fn()}
        onMaxChange={vi.fn()}
        locale="vi"
      />,
    );

    // Displays single value without redundant range dash
    expect(screen.getByText('2.500.000 ₫')).toBeDefined();

    const minThumb = screen.getByLabelText('Giá tối thiểu') as HTMLInputElement;
    const maxThumb = screen.getByLabelText('Giá tối đa') as HTMLInputElement;

    expect(minThumb.value).toBe('2500000');
    expect(maxThumb.value).toBe('2500000');
  });

  it('handles open-ended upper price limit when maxPrice is empty', () => {
    render(
      <TourPriceRangeSlider
        minPrice="3000000"
        maxPrice=""
        onMinChange={vi.fn()}
        onMaxChange={vi.fn()}
        locale="vi"
      />,
    );

    expect(screen.getByText(/≥ 3\.000\.000/)).toBeDefined();

    const minThumb = screen.getByLabelText('Giá tối thiểu') as HTMLInputElement;
    const maxThumb = screen.getByLabelText('Giá tối đa') as HTMLInputElement;

    expect(minThumb.value).toBe('3000000');
    expect(maxThumb.value).toBe('10000000');
    expect(maxThumb.getAttribute('aria-valuetext')).toBe('Không giới hạn trên');
  });

  it('handles open-ended lower price limit when minPrice is empty', () => {
    render(
      <TourPriceRangeSlider
        minPrice=""
        maxPrice="2000000"
        onMinChange={vi.fn()}
        onMaxChange={vi.fn()}
        locale="vi"
      />,
    );

    expect(screen.getByText(/≤ 2\.000\.000/)).toBeDefined();

    const minThumb = screen.getByLabelText('Giá tối thiểu') as HTMLInputElement;
    const maxThumb = screen.getByLabelText('Giá tối đa') as HTMLInputElement;

    expect(minThumb.value).toBe('0');
    expect(maxThumb.value).toBe('2000000');
    expect(minThumb.getAttribute('aria-valuetext')).toBe('Không giới hạn dưới');
  });

  it('allows clicking quick preset price-band chips with accurate inclusive labels', () => {
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

    // Inclusive label: ≤ 1 triệu
    const presetUnder1m = screen.getByRole('button', { name: '≤ 1 triệu' });
    fireEvent.click(presetUnder1m);
    expect(onRangeChange).toHaveBeenCalledWith('', '1000000');

    // 1 - 3 triệu
    const preset1m3m = screen.getByRole('button', { name: '1 - 3 triệu' });
    fireEvent.click(preset1m3m);
    expect(onRangeChange).toHaveBeenCalledWith('1000000', '3000000');

    // 3 - 5 triệu
    const preset3m5m = screen.getByRole('button', { name: '3 - 5 triệu' });
    fireEvent.click(preset3m5m);
    expect(onRangeChange).toHaveBeenCalledWith('3000000', '5000000');

    // Inclusive label: ≥ 5 triệu
    const presetOver5m = screen.getByRole('button', { name: '≥ 5 triệu' });
    fireEvent.click(presetOver5m);
    expect(onRangeChange).toHaveBeenCalledWith('5000000', '');

    // Reset via All / Tất cả
    const presetAll = screen.getByRole('button', { name: 'Tất cả' });
    fireEvent.click(presetAll);
    expect(onRangeChange).toHaveBeenCalledWith('', '');
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

  it('supports keyboard interaction and stepping on range thumbs', () => {
    const onMinChange = vi.fn();

    render(
      <TourPriceRangeSlider
        minPrice="1000000"
        maxPrice="5000000"
        step={100000}
        onMinChange={onMinChange}
        onMaxChange={vi.fn()}
        locale="en"
      />,
    );

    const minThumb = screen.getByLabelText('Minimum price');
    expect(minThumb.getAttribute('step')).toBe('100000');

    // Simulate stepping forward via keyboard/arrow key event
    fireEvent.change(minThumb, { target: { value: '1100000' } });
    expect(onMinChange).toHaveBeenCalledWith('1100000');
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
