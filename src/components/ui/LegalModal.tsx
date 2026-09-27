'use client';

import { useEffect } from 'react';
import type { ReactNode } from 'react';

interface LegalModalProps {
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function LegalModal({ onClose, title, children }: LegalModalProps) {
  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative flex max-h-[80vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e2e5ea] px-6 py-4">
          <h2 id="legal-modal-title" className="text-base font-extrabold text-[#00152a]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1 text-[#59616b] hover:bg-[#eceef1] hover:text-[#00152a]"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto px-6 py-5 text-sm leading-relaxed text-[#314863]">
          {children}
        </div>

        {/* Footer */}
        <div className="border-t border-[#e2e5ea] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-[#007d6e] px-5 py-3 text-sm font-bold text-white hover:bg-[#006b5f]"
          >
            I understand
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Content Components ───────────────────────────────────────────────────────

export function TermsContent() {
  return (
    <>
      <p className="mb-4 text-xs text-[#74777e]">Last updated: September 2026</p>

      <h3 className="mb-2 font-bold text-[#00152a]">1. Acceptance of Terms</h3>
      <p className="mb-4">
        By creating a TripMate account, you agree to these Terms of Service. If you do not agree,
        you may not use the service.
      </p>

      <h3 className="mb-2 font-bold text-[#00152a]">2. Account Responsibilities</h3>
      <p className="mb-4">
        You are responsible for maintaining the confidentiality of your credentials. You must
        provide accurate information during registration. You may not register on behalf of another
        person without their consent.
      </p>

      <h3 className="mb-2 font-bold text-[#00152a]">3. Permitted Use</h3>
      <p className="mb-4">
        TripMate is intended for personal travel planning. Commercial use, scraping, or automated
        access without written permission is prohibited.
      </p>

      <h3 className="mb-2 font-bold text-[#00152a]">4. Intellectual Property</h3>
      <p className="mb-4">
        All content, branding, and software on TripMate is owned by TripMate or its licensors.
        User-submitted content remains yours; you grant TripMate a limited licence to display it
        within the service.
      </p>

      <h3 className="mb-2 font-bold text-[#00152a]">5. Termination</h3>
      <p className="mb-4">
        TripMate reserves the right to suspend or terminate accounts that violate these terms.
      </p>

      <h3 className="mb-2 font-bold text-[#00152a]">6. Limitation of Liability</h3>
      <p>
        TripMate is provided &quot;as is&quot;. We are not liable for indirect, incidental, or consequential
        damages arising from your use of the service.
      </p>
    </>
  );
}

export function PrivacyContent() {
  return (
    <>
      <p className="mb-4 text-xs text-[#74777e]">Last updated: September 2026</p>

      <h3 className="mb-2 font-bold text-[#00152a]">1. Information We Collect</h3>
      <p className="mb-4">
        We collect your full name, email address, and optionally your phone number during
        registration. We also collect usage data and device information to improve the service.
      </p>

      <h3 className="mb-2 font-bold text-[#00152a]">2. How We Use Your Information</h3>
      <p className="mb-4">
        Your information is used to create and manage your account, send verification codes, and
        provide TripMate services. We do not sell your personal data to third parties.
      </p>

      <h3 className="mb-2 font-bold text-[#00152a]">3. Data Storage & Security</h3>
      <p className="mb-4">
        Passwords are hashed using industry-standard algorithms (Argon2/BCrypt). Verification codes
        are stored in encrypted form with a short expiry. We use HTTPS for all data in transit.
      </p>

      <h3 className="mb-2 font-bold text-[#00152a]">4. Third-Party Services</h3>
      <p className="mb-4">
        We use Firebase Authentication and Google Sign-In as secure identity providers. When using
        these services, Google&apos;s privacy policy also applies.
      </p>

      <h3 className="mb-2 font-bold text-[#00152a]">5. Your Rights</h3>
      <p className="mb-4">
        You may request access to, correction of, or deletion of your personal data by contacting
        us. Account deletion removes all associated personal information within 30 days.
      </p>

      <h3 className="mb-2 font-bold text-[#00152a]">6. Contact</h3>
      <p>
        For privacy enquiries, contact us at{' '}
        <a href="mailto:privacy@tripmate.io" className="font-bold text-[#006b5f] underline">
          privacy@tripmate.io
        </a>
        .
      </p>
    </>
  );
}
