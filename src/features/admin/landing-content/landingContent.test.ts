import { describe, expect, it } from 'vitest';
import {
  emptyContent,
  isLandingContentState,
  validateContent,
  validateImageFile,
  type LandingContent,
  type LandingContentState,
} from './landingContent';

const MB = 1024 * 1024;
const image = { mediaId: 'm1', url: '/media/m1.png' };

function validContent(): LandingContent {
  return {
    hero: {
      headline: 'Discover Central Vietnam',
      subHeadline: '',
      backgroundImage: null,
      ctaLabel: 'Explore',
      ctaTarget: '/tours',
    },
    destinations: [],
    featuredTourIds: [],
    banner: { image: null, link: '', displayStart: '', displayEnd: '' },
  };
}

function validState(): LandingContentState {
  return {
    published: {
      versionId: 'v1',
      versionNumber: 1,
      publishedByName: 'Admin',
      publishedAtUtc: '2026-10-01T00:00:00Z',
      content: validContent(),
    },
    draft: null,
    history: [],
  };
}

describe('validateImageFile', () => {
  it('accepts a PNG of exactly 5 MB', () => {
    expect(validateImageFile({ size: 5 * MB, type: 'image/png' })).toBeNull();
  });

  it('rejects an image one byte over 5 MB', () => {
    expect(validateImageFile({ size: 5 * MB + 1, type: 'image/png' })).toBe('tooLarge');
  });

  it('rejects an unsupported image type', () => {
    expect(validateImageFile({ size: 1000, type: 'image/gif' })).toBe('unsupportedType');
  });
});

describe('validateContent', () => {
  it('requires the hero headline and call-to-action on empty content', () => {
    const errors = validateContent(emptyContent());
    expect(errors['hero.headline']).toBe('required');
    expect(errors['hero.ctaLabel']).toBe('required');
    expect(errors['hero.ctaTarget']).toBe('required');
    expect(Object.keys(errors).some((key) => key.startsWith('banner.'))).toBe(false);
  });

  it('treats a whitespace-only headline as empty', () => {
    const content = validContent();
    content.hero.headline = '   ';
    expect(validateContent(content)['hero.headline']).toBe('required');
  });

  it('returns no errors for valid content', () => {
    expect(validateContent(validContent())).toEqual({});
  });

  it('requires description and image of a destination that only has a name', () => {
    const content = validContent();
    content.destinations = [{ id: 'd1', name: 'Hue', image: null, description: '' }];
    const errors = validateContent(content);
    expect(errors['destinations.0.description']).toBe('required');
    expect(errors['destinations.0.image']).toBe('required');
    expect(errors['destinations.0.name']).toBeUndefined();
  });

  it('requires the other banner fields when only the link is filled', () => {
    const content = validContent();
    content.banner.link = 'https://example.com';
    const errors = validateContent(content);
    expect(errors['banner.image']).toBe('required');
    expect(errors['banner.displayStart']).toBe('required');
    expect(errors['banner.displayEnd']).toBe('required');
    expect(errors['banner.link']).toBeUndefined();
  });

  it('rejects a banner whose end is before its start', () => {
    const content = validContent();
    content.banner = { image, link: '/promo', displayStart: '2026-10-20', displayEnd: '2026-10-19' };
    expect(validateContent(content)['banner.displayEnd']).toBe('invalidPeriod');
  });

  it('accepts a banner whose start equals its end', () => {
    const content = validContent();
    content.banner = { image, link: '/promo', displayStart: '2026-10-20', displayEnd: '2026-10-20' };
    expect(validateContent(content)).toEqual({});
  });
});

describe('isLandingContentState', () => {
  it('rejects an empty object', () => {
    expect(isLandingContentState({})).toBe(false);
  });

  it('rejects a state whose published hero is missing', () => {
    const state = validState() as unknown as { published: { content: Record<string, unknown> } };
    delete state.published.content.hero;
    expect(isLandingContentState(state)).toBe(false);
  });

  it('accepts a complete state with no draft', () => {
    expect(isLandingContentState(validState())).toBe(true);
  });
});
