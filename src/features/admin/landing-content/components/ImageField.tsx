import { createContext, useContext, useId, useState } from 'react';

import { validateImageFile, type ImageRef } from '../landingContent';
import { uploadImage } from '../landingContentService';
import { landingContentEn, type ContentErrorKey } from '../resources/en';

/**
 * The screen provides this so it can lock the editor while any upload runs: an upload writes back
 * through the onChange of the render that started it, so other edits during that time would be lost.
 */
export const UploadStatusContext = createContext<(delta: 1 | -1) => void>(() => {});

interface ImageFieldProps {
  label: string;
  value: ImageRef | null;
  onChange: (next: ImageRef | null) => void;
  error?: ContentErrorKey;
  disabled: boolean;
}

export function ImageField({ label, value, onChange, error, disabled }: ImageFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const copy = landingContentEn;
  const [fileError, setFileError] = useState<ContentErrorKey | null>(null);
  const [uploading, setUploading] = useState(false);
  const trackUpload = useContext(UploadStatusContext);
  const shownError = fileError ?? error;

  async function handleFile(file: File | undefined) {
    if (!file) return;
    const problem = validateImageFile(file);
    if (problem) {
      // The rejected file is dropped; everything else the user entered stays untouched.
      setFileError(problem === 'tooLarge' ? 'imageTooLarge' : 'imageUnsupportedType');
      return;
    }
    setFileError(null);
    setUploading(true);
    trackUpload(1);
    try {
      onChange(await uploadImage(file));
    } catch {
      setFileError('unavailable');
    } finally {
      setUploading(false);
      trackUpload(-1);
    }
  }

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-bold text-[#1d2939]">
        {label}
      </label>
      <input
        id={id}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        disabled={disabled || uploading}
        aria-invalid={shownError ? true : undefined}
        aria-describedby={shownError ? errorId : undefined}
        onChange={(event) => {
          void handleFile(event.target.files?.[0]);
          event.target.value = '';
        }}
        className="mt-2 block w-full text-sm text-[#475467] file:mr-3 file:rounded-lg file:border file:border-[#d0d7de] file:bg-white file:px-3 file:py-1.5 file:text-xs file:font-bold disabled:cursor-not-allowed"
      />
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#475467]">
        {uploading ? (
          <span role="status">{copy.editor.image.uploading}</span>
        ) : value ? (
          <>
            <span className="break-all">{value.url}</span>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange(null)}
              className="rounded-lg border border-[#d0d7de] px-2.5 py-1 font-bold text-[#00152a] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {copy.editor.image.remove}
            </button>
          </>
        ) : (
          <span>{copy.editor.image.none}</span>
        )}
      </div>
      {shownError && (
        <p id={errorId} className="mt-1 text-xs font-semibold text-[#b42318]">
          {copy.errors[shownError]}
        </p>
      )}
    </div>
  );
}
