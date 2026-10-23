import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BrandLogo } from './BrandLogo';

describe('BrandLogo component', () => {
  it('renders default main brand logo with TripMate label and official vector symbol', () => {
    const { container } = render(<BrandLogo />);
    expect(screen.getByText('TripMate')).not.toBeNull();

    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute('viewBox')).toBe('0 0 334 182');
  });

  it('renders partner context label correctly', () => {
    render(<BrandLogo context="partner" />);
    expect(screen.getByText('TripMate Partner')).not.toBeNull();
  });

  it('renders admin context label correctly', () => {
    render(<BrandLogo context="admin" />);
    expect(screen.getByText('TripMate Admin')).not.toBeNull();
  });

  it('applies inverse classes when inverse prop is true', () => {
    const { container } = render(<BrandLogo inverse />);
    const root = container.firstChild as HTMLElement;
    expect(root.className).toContain('text-white');
  });

  it('applies custom size to the SVG symbol', () => {
    const { container } = render(<BrandLogo size={32} />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute('height')).toBe('32');
  });

  it('renders icon-only variant when variant="icon" is passed', () => {
    const { container } = render(<BrandLogo variant="icon" />);
    expect(screen.queryByText('TripMate')).toBeNull();
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute('viewBox')).toBe('0 0 334 182');
  });
});
