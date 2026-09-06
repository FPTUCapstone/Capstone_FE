'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { FormEvent } from 'react';

import { PartnerShell } from '@/components/layout/PartnerShell';
import { ActionButton } from '@/components/ui/ActionButton';
import { FeedbackAlert } from '@/components/ui/FeedbackAlert';
import { CheckboxField, PasswordField, TextField, fieldClassName } from '@/components/ui/FormControls';
import { simulateMockRequest } from '@/data/batchOneMock';
import { ApplicationSubmitted } from '@/features/operator/application/ApplicationSubmitted';
import { ROUTES } from '@/lib/routes';

type Values = {
  email: string;
  password: string;
  confirmPassword: string;
  companyName: string;
  licenceNumber: string;
  taxCode: string;
  businessAddress: string;
  contactPerson: string;
  contactPhone: string;
};

const initialValues: Values = {
  email: '', password: '', confirmPassword: '', companyName: '', licenceNumber: '', taxCode: '', businessAddress: '', contactPerson: '', contactPhone: '',
};

export function OperatorRegistrationForm() {
  const [values, setValues] = useState(initialValues);
  const [documents, setDocuments] = useState(false);
  const [agreements, setAgreements] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof Values | 'documents' | 'agreements', string>>>({});
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function update<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: typeof errors = {};
    for (const key of Object.keys(values) as (keyof Values)[]) {
      if (!values[key].trim()) nextErrors[key] = 'This field is required.';
    }
    if (values.email && !/^\S+@\S+\.\S+$/.test(values.email)) nextErrors.email = 'Invalid email format. Please enter a valid email address (e.g., user@example.com).';
    if (values.password && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(values.password)) nextErrors.password = 'Password must be at least 8 characters, containing uppercase, lowercase, number, and special character.';
    if (values.confirmPassword && values.confirmPassword !== values.password) nextErrors.confirmPassword = 'Passwords do not match. Please re-enter.';
    if (!documents) nextErrors.documents = 'At least one required business document must be provided.';
    if (!agreements) nextErrors.agreements = 'This field is required.';
    setErrors(nextErrors);
    setFeedback('');
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    await simulateMockRequest();
    setLoading(false);
    if (values.email.toLowerCase() === 'system@tripmate.test') {
      setFeedback('TripMate is temporarily unable to process your request. Please check your connection and try again.');
      return;
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <PartnerShell title="Tour Operator Registration" description="Application Submitted is the completion state of this registration flow; it is not a separate route.">
        <ApplicationSubmitted />
      </PartnerShell>
    );
  }

  return (
    <PartnerShell title="Tour Operator Registration" description="Submit the required business information and documents for Administrator review. Partner workspace functions remain locked until approval.">
      <form className="rounded-3xl border border-[#d8dadd] bg-white p-5 shadow-[0_16px_45px_rgba(0,21,42,0.08)] sm:p-8" noValidate onSubmit={handleSubmit}>
        <FeedbackAlert>Approval is required before Tour Operator workspace functions become available.</FeedbackAlert>

        <fieldset className="mt-8 border-0 p-0">
          <legend className="text-xl font-extrabold text-[#00152a]">1. Account Information</legend>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <TextField label="Email Address" name="email" type="email" autoComplete="email" value={values.email} disabled={loading} error={errors.email} onChange={(event) => update('email', event.target.value)} />
            <div className="hidden sm:block" />
            <PasswordField label="Password" name="password" autoComplete="new-password" value={values.password} disabled={loading} error={errors.password} help="At least 8 characters with uppercase, lowercase, number, and special character." onChange={(event) => update('password', event.target.value)} />
            <PasswordField label="Confirm Password" name="confirmPassword" autoComplete="new-password" value={values.confirmPassword} disabled={loading} error={errors.confirmPassword} onChange={(event) => update('confirmPassword', event.target.value)} />
          </div>
        </fieldset>

        <fieldset className="mt-8 border-0 border-t border-[#d8dadd] p-0 pt-8">
          <legend className="text-xl font-extrabold text-[#00152a]">2. Company Information</legend>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <TextField label="Company Name" name="companyName" value={values.companyName} disabled={loading} error={errors.companyName} onChange={(event) => update('companyName', event.target.value)} />
            <TextField label="Business Licence Number" name="licenceNumber" value={values.licenceNumber} disabled={loading} error={errors.licenceNumber} onChange={(event) => update('licenceNumber', event.target.value)} />
            <TextField label="Tax Code" name="taxCode" value={values.taxCode} disabled={loading} error={errors.taxCode} onChange={(event) => update('taxCode', event.target.value)} />
            <TextField label="Business Address" name="businessAddress" autoComplete="street-address" value={values.businessAddress} disabled={loading} error={errors.businessAddress} onChange={(event) => update('businessAddress', event.target.value)} />
          </div>
        </fieldset>

        <fieldset className="mt-8 border-0 border-t border-[#d8dadd] p-0 pt-8">
          <legend className="text-xl font-extrabold text-[#00152a]">3. Contact Information</legend>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <TextField label="Contact Person" name="contactPerson" autoComplete="name" value={values.contactPerson} disabled={loading} error={errors.contactPerson} onChange={(event) => update('contactPerson', event.target.value)} />
            <TextField label="Contact Phone Number" name="contactPhone" type="tel" autoComplete="tel" value={values.contactPhone} disabled={loading} error={errors.contactPhone} onChange={(event) => update('contactPhone', event.target.value)} />
          </div>
        </fieldset>

        <fieldset className="mt-8 border-0 border-t border-[#d8dadd] p-0 pt-8">
          <legend className="text-xl font-extrabold text-[#00152a]">4. Business Documents</legend>
          <label className="mt-5 block rounded-2xl border border-dashed border-[#4fdbc8] bg-[#f3fbf9] p-6 text-center text-sm font-bold text-[#005048]">
            <span className="material-symbols-outlined mb-2 block text-3xl" aria-hidden="true">upload_file</span>
            Add business documents
            <input type="file" name="documents" multiple disabled={loading} className={`${fieldClassName} text-left normal-case tracking-normal`} onChange={(event) => setDocuments(Boolean(event.target.files?.length))} />
          </label>
          {errors.documents ? <p className="mt-2 text-xs font-semibold text-[#ba1a1a]">{errors.documents}</p> : null}
        </fieldset>

        <div className="mt-8 border-t border-[#d8dadd] pt-8">
          <CheckboxField name="agreements" checked={agreements} disabled={loading} error={errors.agreements} onChange={(event) => setAgreements(event.target.checked)}>
            I accept the <a href="#terms" className="font-bold text-[#006b5f] underline">Terms of Service</a>, <a href="#privacy" className="font-bold text-[#006b5f] underline">Privacy Policy</a>, and Partner Agreement.
          </CheckboxField>
          {feedback ? <div className="mt-5"><FeedbackAlert tone="error">{feedback}</FeedbackAlert></div> : null}
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link href={ROUTES.signIn} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#9aa1aa] px-5 py-3 text-sm font-bold text-[#00152a] hover:bg-[#f2f4f7]">Back to Sign In</Link>
            <ActionButton type="submit" loading={loading}>Submit Application</ActionButton>
          </div>
        </div>
        <p className="mt-6 rounded-lg bg-[#f2f4f7] px-3 py-2 text-center text-[11px] leading-relaxed text-[#59616b]">Interactive prototype: document selection and submission are local only; nothing is uploaded or stored.</p>
      </form>
    </PartnerShell>
  );
}
