'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ActionButton } from '@/components/ui/ActionButton';
import { PrivacyContent, TermsContent } from '@/components/ui/LegalModal';
import { ROUTES } from '@/lib/routes';

interface GoogleConsentModalProps {
  onCancel: () => void;
  onAgree: () => void;
}

export function GoogleConsentModal({ onCancel, onAgree }: GoogleConsentModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [content, setContent] = useState<'consent' | 'terms' | 'privacy'>('consent');
  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => { if (dialog?.open) dialog.close(); };
  }, []);

  return (
    <dialog ref={dialogRef} aria-labelledby="google-consent-title"
      onCancel={(event) => { event.preventDefault(); onCancel(); }}
      className="m-auto max-h-[85vh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl bg-white p-6 text-sm text-[#314863] shadow-xl backdrop:bg-black/40">
      <h2 id="google-consent-title" className="mb-4 text-lg font-bold text-[#00152a]">
        {content === 'terms' ? 'Terms of Service' : content === 'privacy' ? 'Privacy Policy' : 'Continue with Google'}
      </h2>
      {content === 'terms' ? <TermsContent /> : content === 'privacy' ? <PrivacyContent /> : (
        <>
          <p>If your Google email is new to TripMate, continuing creates a Traveler account, not a TourOperator account.</p>
          <p className="mt-3">By continuing, you agree to our{' '}
            <a href="#google-terms" className="font-semibold text-[#007D6E] underline" onClick={(event) => { event.preventDefault(); setContent('terms'); }}>Terms of Service</a>{' '}and{' '}
            <a href="#google-privacy" className="font-semibold text-[#007D6E] underline" onClick={(event) => { event.preventDefault(); setContent('privacy'); }}>Privacy Policy</a>.
          </p>
          <div className="mt-5 space-y-3">
            <ActionButton type="button" variant="teal" className="w-full" onClick={onAgree}>Agree and continue with Google</ActionButton>
            <Link href={ROUTES.partner.register} onClick={onCancel} className="block py-2 text-center font-semibold text-[#007D6E]">Register as TourOperator</Link>
          </div>
        </>
      )}
      {content !== 'consent' ? <ActionButton type="button" variant="outline" className="mt-4 w-full" onClick={() => setContent('consent')}>Back to consent</ActionButton> : null}
      <ActionButton type="button" variant="outline" className="mt-3 w-full" onClick={onCancel}>Cancel</ActionButton>
    </dialog>
  );
}
