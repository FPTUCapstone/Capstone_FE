import type { ContentErrors, HeroContent } from '../landingContent';
import { landingContentEn } from '../resources/en';
import { ImageField } from './ImageField';
import { TextField } from './TextField';

interface HeroBlockProps {
  value: HeroContent;
  errors: ContentErrors;
  onChange: (next: HeroContent) => void;
  disabled: boolean;
}

export function HeroBlock({ value, errors, onChange, disabled }: HeroBlockProps) {
  const copy = landingContentEn.editor.hero;

  return (
    <section aria-label={copy.title} className="rounded-2xl border border-[#d0d7de] bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-extrabold text-[#00152a]">{copy.title}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <TextField
          label={copy.headline}
          value={value.headline}
          error={errors['hero.headline']}
          disabled={disabled}
          onChange={(headline) => onChange({ ...value, headline })}
        />
        <TextField
          label={copy.subHeadline}
          value={value.subHeadline}
          disabled={disabled}
          onChange={(subHeadline) => onChange({ ...value, subHeadline })}
        />
        <TextField
          label={copy.ctaLabel}
          value={value.ctaLabel}
          error={errors['hero.ctaLabel']}
          disabled={disabled}
          onChange={(ctaLabel) => onChange({ ...value, ctaLabel })}
        />
        <TextField
          label={copy.ctaTarget}
          value={value.ctaTarget}
          error={errors['hero.ctaTarget']}
          disabled={disabled}
          onChange={(ctaTarget) => onChange({ ...value, ctaTarget })}
        />
        <div className="sm:col-span-2">
          <ImageField
            label={copy.backgroundImage}
            value={value.backgroundImage}
            disabled={disabled}
            onChange={(backgroundImage) => onChange({ ...value, backgroundImage })}
          />
        </div>
      </div>
    </section>
  );
}
