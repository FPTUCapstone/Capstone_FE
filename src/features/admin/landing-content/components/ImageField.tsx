import { createContext, useContext, useId, useState } from 'react';

import { validateImageFile, type ImageRef } from '../landingContent';
import { LandingContentError, uploadImage } from '../landingContentService';
import { landingContentEn, type ContentErrorKey } from '../resources/en';

/**
 * The screen provides this so it can lock the editor while any upload runs: an upload writes back
 * through the onChange of the render that started it, so other edits during that time would be lost.
 */
export const UploadStatusContext = createContext<{ track: (delta: 1 | -1) => void; onUnauthorized: () => void }>({
  track: () => {},
  onUnauthorized: () => {},
});

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
  const { track, onUnauthorized } = useContext(UploadStatusContext);
  const [failedFile, setFailedFile] = useState<File | null>(null);
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
    setFailedFile(null);
    setUploading(true);
    track(1);
    try {
      onChange(await uploadImage(file));
    } catch (failure) {
      if (failure instanceof LandingContentError && failure.status === 401) {
        onUnauthorized();
      } else {
        setFileError('unavailable');
        setFailedFile(file);
      }
    } finally {
      setUploading(false);
      track(-1);
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
      {failedFile && !uploading && (
        <button
          type="button"
          disabled={disabled}
          onClick={() => void handleFile(failedFile)}
          className="mt-2 rounded-lg border border-[#b42318] px-2.5 py-1 text-xs font-bold text-[#b42318] disabled:opacity-50"
        >
          {copy.editor.image.retry}
        </button>
      )}
    </div>
  );
}
