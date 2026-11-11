import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import BrandIcon, { type BrandIconProps } from './BrandIcon';
import SharedBrandLogo, { type BrandLogoIconProps } from '../BrandLogo';
import RegistrationBrandLogo, { type RegistrationBrandLogoProps } from '../registration/BrandLogo';
import { TRIPMATE_SYMBOL_PATH } from './tripMateLogoPaths';

const variants = [
  ['canonical icon', BrandIcon],
  ['shared compatibility export', SharedBrandLogo],
  ['registration compatibility export', RegistrationBrandLogo],
] as const;

const customProps: BrandIconProps & BrandLogoIconProps & RegistrationBrandLogoProps = {
  size: 37,
  inverse: true,
  className: 'shrink-0 custom-brand',
};

describe.each(variants)('%s', (_name, Icon) => {
  it('renders the decorative official vector at its default dimensions and inherited color', () => {
    const { container } = render(<Icon />);
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('width')).toBe('44');
    expect(svg.getAttribute('height')).toBe('24');
    expect(svg.getAttribute('viewBox')).toBe('0 0 334 182');
    expect(svg.getAttribute('fill')).toBe('currentColor');
    expect(svg.getAttribute('fill-rule')).toBe('evenodd');
    expect(svg.getAttribute('clip-rule')).toBe('evenodd');
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.classList.contains('currentColor')).toBe(true);
    expect(svg.querySelector('path')?.getAttribute('d')).toBe(TRIPMATE_SYMBOL_PATH);
    expect(container.textContent).toBe('');
  });

  it('preserves custom sizing, inverse color and caller classes', () => {
    const { container } = render(<Icon {...customProps} />);
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('width')).toBe('68');
    expect(svg.getAttribute('height')).toBe('37');
    expect(svg.classList.contains('text-white')).toBe(true);
    expect(svg.classList.contains('shrink-0')).toBe(true);
    expect(svg.classList.contains('custom-brand')).toBe(true);
    expect(svg.getAttribute('fill')).toBe('currentColor');
  });
});
