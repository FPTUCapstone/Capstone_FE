import type { BannerContent, ContentErrors } from '../landingContent';
import { landingContentEn } from '../resources/en';
import { ImageField } from './ImageField';
import { TextField } from './TextField';

interface BannerBlockProps {
  value: BannerContent;
  errors: ContentErrors;
  onChange: (next: BannerContent) => void;
  disabled: boolean;
}

export function BannerBlock({ value, errors, onChange, disabled }: BannerBlockProps) {
  const copy = landingContentEn.editor.banner;

  return (
    <section aria-label={copy.title} className="rounded-2xl border border-[#d0d7de] bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-extrabold text-[#00152a]">{copy.title}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <ImageField
          label={copy.image}
          value={value.image}
          error={errors['banner.image']}
          disabled={disabled}
          onChange={(image) => onChange({ ...value, image })}
        />
        <TextField
          label={copy.link}
          value={value.link}
          error={errors['banner.link']}
          disabled={disabled}
          onChange={(link) => onChange({ ...value, link })}
        />
        <TextField
          label={copy.displayStart}
          type="date"
          value={value.displayStart}
          error={errors['banner.displayStart']}
          disabled={disabled}
          onChange={(displayStart) => onChange({ ...value, displayStart })}
        />
        <TextField
          label={copy.displayEnd}
          type="date"
          value={value.displayEnd}
          error={errors['banner.displayEnd']}
          disabled={disabled}
          onChange={(displayEnd) => onChange({ ...value, displayEnd })}
        />
      </div>
    </section>
  );
}
