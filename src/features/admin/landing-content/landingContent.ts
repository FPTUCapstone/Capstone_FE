import type { ContentErrorKey } from './resources/en';

export interface ImageRef {
  mediaId: string;
  url: string;
}

export interface HeroContent {
  headline: string;
  subHeadline: string;
  backgroundImage: ImageRef | null;
  ctaLabel: string;
  ctaTarget: string;
}

export interface DestinationEntry {
  id: string;
  name: string;
  image: ImageRef | null;
  description: string;
}

export interface BannerContent {
  image: ImageRef | null;
  link: string;
  displayStart: string;
  displayEnd: string;
}

export interface LandingContent {
  hero: HeroContent;
  destinations: DestinationEntry[];
  featuredTourIds: string[];
  banner: BannerContent;
}

export interface VersionSummary {
  versionId: string;
  versionNumber: number;
  publishedByName: string;
  publishedAtUtc: string;
}

export interface LandingContentState {
  published: VersionSummary & { content: LandingContent };
  draft: { baseVersion: number; content: LandingContent } | null;
  history: VersionSummary[];
}

export interface TourOption {
  tourId: string;
  title: string;
}

/** Maps a dotted field path (for example `hero.headline`) to an error key. */
export type ContentErrors = Record<string, ContentErrorKey>;

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES: readonly string[] = ['image/jpeg', 'image/png', 'image/webp'];

export function emptyContent(): LandingContent {
  return {
    hero: { headline: '', subHeadline: '', backgroundImage: null, ctaLabel: '', ctaTarget: '' },
    destinations: [],
    featuredTourIds: [],
    banner: { image: null, link: '', displayStart: '', displayEnd: '' },
  };
}

export function validateImageFile(file: {
  size: number;
  type: string;
}): 'tooLarge' | 'unsupportedType' | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return 'unsupportedType';
  if (file.size > MAX_IMAGE_BYTES) return 'tooLarge';
  return null;
}

const isBlank = (value: string) => value.trim() === '';

export function validateContent(content: LandingContent): ContentErrors {
  const errors: ContentErrors = {};

  const { hero } = content;
  if (isBlank(hero.headline)) errors['hero.headline'] = 'required';
  if (isBlank(hero.ctaLabel)) errors['hero.ctaLabel'] = 'required';
  if (isBlank(hero.ctaTarget)) errors['hero.ctaTarget'] = 'required';

  content.destinations.forEach((destination, index) => {
    if (isBlank(destination.name)) errors[`destinations.${index}.name`] = 'required';
    if (isBlank(destination.description)) errors[`destinations.${index}.description`] = 'required';
    if (!destination.image) errors[`destinations.${index}.image`] = 'required';
  });

  const { banner } = content;
  const bannerInUse =
    banner.image !== null || !isBlank(banner.link) || !isBlank(banner.displayStart) || !isBlank(banner.displayEnd);
  if (bannerInUse) {
    if (!banner.image) errors['banner.image'] = 'required';
    if (isBlank(banner.link)) errors['banner.link'] = 'required';
    if (isBlank(banner.displayStart)) errors['banner.displayStart'] = 'required';
    if (isBlank(banner.displayEnd)) {
      errors['banner.displayEnd'] = 'required';
    } else if (!isBlank(banner.displayStart) && banner.displayEnd < banner.displayStart) {
      errors['banner.displayEnd'] = 'invalidPeriod';
    }
  }

  return errors;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isImageRef(value: unknown): value is ImageRef {
  return isRecord(value) && typeof value.mediaId === 'string' && typeof value.url === 'string';
}

function isNullableImageRef(value: unknown): value is ImageRef | null {
  return value === null || isImageRef(value);
}

export function isLandingContent(value: unknown): value is LandingContent {
  if (!isRecord(value)) return false;
  const { hero, destinations, featuredTourIds, banner } = value;
  if (
    !isRecord(hero) ||
    typeof hero.headline !== 'string' ||
    typeof hero.subHeadline !== 'string' ||
    !isNullableImageRef(hero.backgroundImage) ||
    typeof hero.ctaLabel !== 'string' ||
    typeof hero.ctaTarget !== 'string'
  ) {
    return false;
  }
  if (
    !Array.isArray(destinations) ||
    !destinations.every(
      (entry) =>
        isRecord(entry) &&
        typeof entry.id === 'string' &&
        typeof entry.name === 'string' &&
        typeof entry.description === 'string' &&
        isNullableImageRef(entry.image),
    )
  ) {
    return false;
  }
  if (!Array.isArray(featuredTourIds) || !featuredTourIds.every((id) => typeof id === 'string')) {
    return false;
  }
  return (
    isRecord(banner) &&
    isNullableImageRef(banner.image) &&
    typeof banner.link === 'string' &&
    typeof banner.displayStart === 'string' &&
    typeof banner.displayEnd === 'string'
  );
}

export function isVersionSummary(value: unknown): value is VersionSummary {
  return (
    isRecord(value) &&
    typeof value.versionId === 'string' &&
    typeof value.versionNumber === 'number' &&
    typeof value.publishedByName === 'string' &&
    typeof value.publishedAtUtc === 'string'
  );
}

export function isLandingContentState(value: unknown): value is LandingContentState {
  if (!isRecord(value)) return false;
  const { published, draft, history } = value;
  if (!isVersionSummary(published) || !isLandingContent((published as unknown as Record<string, unknown>).content)) {
    return false;
  }
  if (draft !== null) {
    if (!isRecord(draft) || typeof draft.baseVersion !== 'number' || !isLandingContent(draft.content)) {
      return false;
    }
  }
  return Array.isArray(history) && history.every(isVersionSummary);
}

export function isTourOptionList(value: unknown): value is TourOption[] {
  return (
    Array.isArray(value) &&
    value.every((entry) => isRecord(entry) && typeof entry.tourId === 'string' && typeof entry.title === 'string')
  );
}
