import fs from 'node:fs';
import path from 'node:path';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ActionButton } from './ActionButton';

function getLuminance(hex: string): number {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));

  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = getLuminance(hex1);
  const l2 = getLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('ActionButton Coastal Heritage Accessibility & Contrast', () => {
  it('renders coral variant with accessible dark coral background and white text', () => {
    render(<ActionButton variant="coral">Resubmit Application</ActionButton>);

    const button = screen.getByRole('button', { name: 'Resubmit Application' });
    expect(button.className).toContain('bg-[#995436]');
    expect(button.className).toContain('text-white');
    expect(button.className).toContain('hover:bg-[#803F25]');
    expect(button.className).toContain('focus-visible:outline-[#995436]');
    expect(button.className).not.toContain('bg-[#B96D4C]');
  });

  it('verifies default coral button achieves WCAG 2.2 AA normal-text contrast (>= 4.5:1)', () => {
    const contrastRatio = getContrastRatio('#FFFFFF', '#995436');
    expect(contrastRatio).toBeGreaterThanOrEqual(4.5);
    // Exact ratio ~5.71:1
    expect(contrastRatio).toBeCloseTo(5.71, 1);
  });

  it('verifies hover coral button achieves WCAG 2.2 AA normal-text contrast (>= 4.5:1)', () => {
    const hoverContrastRatio = getContrastRatio('#FFFFFF', '#803F25');
    expect(hoverContrastRatio).toBeGreaterThanOrEqual(4.5);
    // Exact ratio ~7.91:1
    expect(hoverContrastRatio).toBeCloseTo(7.91, 1);
  });

  it('verifies legacy #B96D4C failed normal-text contrast on white', () => {
    const legacyRatio = getContrastRatio('#FFFFFF', '#B96D4C');
    expect(legacyRatio).toBeLessThan(4.5);
    expect(legacyRatio).toBeCloseTo(3.92, 1);
  });

  it('verifies app/globals.css secondary token uses accessible #995436 paired with white', () => {
    const cssPath = path.resolve(process.cwd(), 'app/globals.css');
    const css = fs.readFileSync(cssPath, 'utf8');

    expect(css).toMatch(/--color-secondary:\s*#995436;/);
    expect(css).toMatch(/--color-on-secondary:\s*#FFFFFF;/);
    expect(css).toMatch(/--color-secondary-hover:\s*#803F25;/);
  });

  it('renders primary variant with accessible forest green token', () => {
    render(<ActionButton variant="primary">Confirm</ActionButton>);
    const button = screen.getByRole('button', { name: 'Confirm' });
    expect(button.className).toContain('bg-[#174B4A]');
    expect(button.className).toContain('text-white');
    expect(button.className).toContain('hover:bg-[#103B39]');
  });
});
