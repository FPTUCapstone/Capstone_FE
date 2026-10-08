'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import type { User } from 'firebase/auth';

import { PartnerShell } from '@/components/layout/PartnerShell';
import { ActionButton } from '@/components/ui/ActionButton';
import { FeedbackAlert } from '@/components/ui/FeedbackAlert';
import { CheckboxField, PasswordField, TextField, fieldClassName } from '@/components/ui/FormControls';
import { ApplicationSubmitted } from '@/features/operator/application/ApplicationSubmitted';
import { OperatorRegistrationError, registerOperator } from '@/features/operator/application/registerOperator';
import { operatorMessage, operatorMessages } from '@/features/operator/application/operatorMessages';
import { mapFirebaseAuthError } from '@/lib/authErrorMapper';
import { getFirebaseAuth } from '@/lib/firebase';
import { validatePassword } from '@/lib/passwordPolicy';
import { ROUTES } from '@/lib/routes';

type Values = {
  email: string; password: string; confirmPassword: string; companyName: string;
  licenceNumber: string; taxCode: string; businessAddress: string;
  contactPerson: string; contactPhone: string;
};
type ErrorKey = keyof Values | 'businessLicenseDocument' | 'supportingDocuments' | 'agreements';
const initialValues: Values = {
  email: '', password: '', confirmPassword: '', companyName: '', licenceNumber: '',
  taxCode: '', businessAddress: '', contactPerson: '', contactPhone: '',
};
const maxFileSize = 5 * 1024 * 1024;
const allowedTypes = new Set(['application/pdf', 'image/jpeg', 'image/png']);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validFile(file: File): boolean {
  const extension = file.name.split('.').pop()?.toLowerCase();
  return file.size > 0 && file.size <= maxFileSize && allowedTypes.has(file.type) &&
    ((file.type === 'application/pdf' && extension === 'pdf') ||
      (file.type === 'image/jpeg' && (extension === 'jpg' || extension === 'jpeg')) ||
      (file.type === 'image/png' && extension === 'png'));
}

function validate(values: Values, licence: File | null, supporting: File[], agreements: boolean): Partial<Record<ErrorKey, string>> {
  const errors: Partial<Record<ErrorKey, string>> = {};
  for (const key of ['email', 'companyName', 'licenceNumber', 'taxCode', 'contactPerson'] as const) {
    if (!values[key].trim()) errors[key] = operatorMessages.MSG01;
  }
  if (values.email.trim() && (values.email.length > 254 || !emailPattern.test(values.email.trim()))) errors.email = operatorMessages.MSG02;
  if (!values.password) errors.password = operatorMessages.MSG01;
  else if (validatePassword(values.password)) errors.password = operatorMessages.MSG05;
  if (!values.confirmPassword) errors.confirmPassword = operatorMessages.MSG01;
  else if (values.confirmPassword !== values.password) errors.confirmPassword = operatorMessages.MSG06;
  if (values.contactPhone.trim() && !/^0\d{9}$/.test(values.contactPhone.replace(/\s/g, ''))) errors.contactPhone = operatorMessages.MSG04;
  if (values.taxCode.trim() && !/^[0-9]{10}(?:-[0-9]{3})?$/.test(values.taxCode.trim())) errors.taxCode = operatorMessages.OPERATOR_TAX_CODE_INVALID;
  if (values.licenceNumber.trim() && !/^[0-9]{2}-[0-9]+\/[0-9]{4}\/(?:TCDL-GPLHQT|SDL-GPLHND)$/.test(values.licenceNumber.trim())) errors.licenceNumber = operatorMessages.OPERATOR_TRAVEL_LICENSE_INVALID;
  for (const [key, limit] of [['companyName', 200], ['licenceNumber', 100], ['taxCode', 50], ['contactPerson', 150], ['businessAddress', 300]] as const) {
    if (values[key].trim().length > limit) errors[key] = `This field must not exceed ${limit} characters.`;
  }
  if (!licence) errors.businessLicenseDocument = operatorMessages.MSG157;
  else if (!validFile(licence)) errors.businessLicenseDocument = operatorMessages.MSG158;
  if (supporting.length > 5) errors.supportingDocuments = 'No more than five supporting documents are allowed.';
  else if (supporting.some((file) => !validFile(file))) errors.supportingDocuments = operatorMessages.MSG158;
  if (!agreements) errors.agreements = operatorMessages.MSG_TOS;
  return errors;
}

export function OperatorRegistrationForm() {
  const [values, setValues] = useState(initialValues);
  const [licence, setLicence] = useState<File | null>(null);
  const [supporting, setSupporting] = useState<File[]>([]);
  const [agreements, setAgreements] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<ErrorKey, string>>>({});
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [deliveryFailed, setDeliveryFailed] = useState(false);
  const [retryLocked, setRetryLocked] = useState(false);
  const retryUser = useRef<User | null>(null);
  const retryEmail = useRef('');
  const outcomeUnknown = useRef(false);
  const submitting = useRef(false);

  function update<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const nextErrors = validate(values, licence, supporting, agreements);
    setErrors(nextErrors);
    setFeedback('');
    if (Object.keys(nextErrors).length || !licence) return;
    const email = values.email.trim().toLowerCase();
    if (retryUser.current && retryEmail.current !== email) {
      setFeedback('Finish or recover the previous registration before using a different email.');
      return;
    }
    submitting.current = true;
    setLoading(true);
    let user = retryUser.current;
    let createdNow = false;
    let backendCalled = false;
    try {
      if (!user) {
        user = (await createUserWithEmailAndPassword(getFirebaseAuth(), email, values.password)).user;
        retryUser.current = user;
        retryEmail.current = email;
        createdNow = true;
      }
      const token = await user.getIdToken(true);
      backendCalled = true;
      await registerOperator({
        firebaseIdToken: token, email, password: values.password,
        confirmPassword: values.confirmPassword, companyName: values.companyName.trim(),
        businessLicenseNo: values.licenceNumber.trim(), taxCode: values.taxCode.trim(),
        contactPerson: values.contactPerson.trim(), businessAddress: values.businessAddress.trim(),
        contactPhone: values.contactPhone.replace(/\s/g, ''), businessLicenseDocument: licence,
        supportingDocuments: supporting, acceptTerms: agreements,
      });
      retryUser.current = null;
      outcomeUnknown.current = false;
      setSubmitted(true);
      try {
        await sendEmailVerification(user, {
          url: `${window.location.origin}/verify-email?flow=operator`,
          handleCodeInApp: true,
        });
      } catch {
        setDeliveryFailed(true);
      }
    } catch (error: unknown) {
      if (error instanceof OperatorRegistrationError) {
        const fieldErrors: Partial<Record<ErrorKey, string>> = {};
        const fieldMap: Record<string, ErrorKey> = {
          email: 'email', password: 'password', confirmPassword: 'confirmPassword',
          companyName: 'companyName', businessLicenseNo: 'licenceNumber', taxCode: 'taxCode',
          contactPerson: 'contactPerson', businessAddress: 'businessAddress',
          contactPhone: 'contactPhone', businessLicenseDocument: 'businessLicenseDocument',
          supportingDocuments: 'supportingDocuments', acceptTerms: 'agreements',
        };
        for (const [field, code] of Object.entries(error.fields)) {
          const key = fieldMap[field];
          if (key) fieldErrors[key] = operatorMessage(code);
        }
        if (error.code === 'MSG03') fieldErrors.email = operatorMessages.MSG03;
        setErrors(fieldErrors);
        setFeedback(operatorMessage(error.code ?? Object.values(error.fields)[0]));
        if (outcomeUnknown.current && error.status === 409) {
          setFeedback('A prior request may already have registered your account. Keep this Firebase account and use the verification or sign-in recovery flow.');
        } else if (createdNow && user && !outcomeUnknown.current &&
          !['AUTH_TOKEN_MISSING', 'AUTH_TOKEN_INVALID', 'AUTH_EMAIL_MISMATCH'].includes(error.code ?? '') &&
          !['AUTH_TOKEN_MISSING', 'AUTH_TOKEN_INVALID', 'AUTH_EMAIL_MISMATCH'].includes(error.fields.firebaseIdToken ?? '')) {
          try { await user.delete(); retryUser.current = null; retryEmail.current = ''; } catch { /* best effort */ }
        }
      } else {
        if (backendCalled) outcomeUnknown.current = true;
        if (backendCalled) setRetryLocked(true);
        // A network failure or malformed success response may follow a DB commit.
        // Keep the Firebase identity so Retry uses the same token and email.
        if (!backendCalled && createdNow && user) {
          try { await user.delete(); retryUser.current = null; retryEmail.current = ''; } catch { /* best effort */ }
        }
        setFeedback(backendCalled ? operatorMessages.MSG127 : mapFirebaseAuthError(error, operatorMessages.MSG127));
      }
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  }

  if (submitted) return (
    <PartnerShell title="Tour Operator Registration" description="Your application has been submitted for review.">
      <ApplicationSubmitted email={values.email.trim()} deliveryFailed={deliveryFailed} />
    </PartnerShell>
  );

  return (
    <PartnerShell title="Tour Operator Registration" description="Submit your business information and documents for Administrator review.">
      <form className="rounded-3xl border border-[#d8dadd] bg-white p-5 shadow-[0_16px_45px_rgba(0,21,42,0.08)] sm:p-8" noValidate onSubmit={handleSubmit}>
        <FeedbackAlert>Approval is required before Tour Operator workspace functions become available.</FeedbackAlert>
        <div className="mt-5 rounded-xl border border-[#9edbd2] bg-[#f0faf8] p-4 text-sm text-[#00152a]">
          <p>Already submitted your application but have not verified your email?</p>
          <Link href={`${ROUTES.verifyAccount}?flow=operator`} className="mt-2 inline-flex min-h-11 items-center font-bold text-[#007d6e] underline underline-offset-2 hover:text-[#005f54]">
            Continue email verification
          </Link>
        </div>
        <fieldset className="mt-8 border-0 p-0">
          <legend className="text-xl font-extrabold text-[#00152a]">1. Account Information</legend>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <TextField label="Email Address" name="email" type="email" autoComplete="email" value={values.email} disabled={loading || retryLocked} error={errors.email} onChange={(event) => update('email', event.target.value)} />
            <div className="hidden sm:block" />
            <PasswordField label="Password" name="password" autoComplete="new-password" value={values.password} disabled={loading || retryLocked} error={errors.password} help="At least 8 characters with uppercase, lowercase, number, and special character." onChange={(event) => update('password', event.target.value)} />
            <PasswordField label="Confirm Password" name="confirmPassword" autoComplete="new-password" value={values.confirmPassword} disabled={loading || retryLocked} error={errors.confirmPassword} onChange={(event) => update('confirmPassword', event.target.value)} />
          </div>
        </fieldset>
        <fieldset className="mt-8 border-0 border-t border-[#d8dadd] p-0 pt-8">
          <legend className="text-xl font-extrabold text-[#00152a]">2. Company Information</legend>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <TextField label="Company Name" name="companyName" value={values.companyName} disabled={loading || retryLocked} error={errors.companyName} onChange={(event) => update('companyName', event.target.value)} />
            <TextField label="Business Licence Number" name="licenceNumber" value={values.licenceNumber} disabled={loading || retryLocked} error={errors.licenceNumber} help="For example: 79-0123/2026/TCDL-GPLHQT or 01-0456/2025/SDL-GPLHND." onChange={(event) => update('licenceNumber', event.target.value)} />
            <TextField label="Tax Code" name="taxCode" value={values.taxCode} disabled={loading || retryLocked} error={errors.taxCode} help="10 digits, or 10 digits-3 digits for a branch (e.g. 0315678901-001)." onChange={(event) => update('taxCode', event.target.value)} />
            <TextField label="Business Address" name="businessAddress" optional autoComplete="street-address" value={values.businessAddress} disabled={loading || retryLocked} error={errors.businessAddress} onChange={(event) => update('businessAddress', event.target.value)} />
          </div>
        </fieldset>
        <fieldset className="mt-8 border-0 border-t border-[#d8dadd] p-0 pt-8">
          <legend className="text-xl font-extrabold text-[#00152a]">3. Contact Information</legend>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <TextField label="Contact Person" name="contactPerson" autoComplete="name" value={values.contactPerson} disabled={loading || retryLocked} error={errors.contactPerson} onChange={(event) => update('contactPerson', event.target.value)} />
            <TextField label="Contact Phone Number" name="contactPhone" optional type="tel" autoComplete="tel" value={values.contactPhone} disabled={loading || retryLocked} error={errors.contactPhone} onChange={(event) => update('contactPhone', event.target.value)} />
          </div>
        </fieldset>
        <fieldset className="mt-8 border-0 border-t border-[#d8dadd] p-0 pt-8">
          <legend className="text-xl font-extrabold text-[#00152a]">4. Business Documents</legend>
          <label htmlFor="businessLicenseDocument" className="mt-5 block text-sm font-bold text-[#005048]">Business Licence (required; PDF, JPG, PNG; max 5 MB)</label>
          <input id="businessLicenseDocument" type="file" name="businessLicenseDocument" accept=".pdf,.jpg,.jpeg,.png" disabled={loading || retryLocked} aria-invalid={Boolean(errors.businessLicenseDocument)} className={fieldClassName} onChange={(event) => setLicence(event.target.files?.[0] ?? null)} />
          {errors.businessLicenseDocument && <p role="alert" className="mt-2 text-xs font-semibold text-red-600">{errors.businessLicenseDocument}</p>}
          <label htmlFor="supportingDocuments" className="mt-5 block text-sm font-bold text-[#005048]">Supporting documents (optional; up to 5)</label>
          <input id="supportingDocuments" type="file" name="supportingDocuments" multiple accept=".pdf,.jpg,.jpeg,.png" disabled={loading || retryLocked} aria-invalid={Boolean(errors.supportingDocuments)} className={fieldClassName} onChange={(event) => setSupporting(Array.from(event.target.files ?? []))} />
          {errors.supportingDocuments && <p role="alert" className="mt-2 text-xs font-semibold text-red-600">{errors.supportingDocuments}</p>}
        </fieldset>
        <div className="mt-8 border-t border-[#d8dadd] pt-8">
          <CheckboxField name="agreements" checked={agreements} disabled={loading || retryLocked} error={errors.agreements} onChange={(event) => setAgreements(event.target.checked)}>
            I accept the Terms of Service, Privacy Policy, and Partner Agreement.
          </CheckboxField>
          {feedback && <div className="mt-5"><FeedbackAlert tone="error">{feedback}</FeedbackAlert></div>}
          {retryLocked && <p className="mt-3 text-sm text-[#59616b]">Your previous request may have been saved. Retry with the same details; the fields are locked to prevent a second account with different data.</p>}
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link href={ROUTES.signIn} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#9aa1aa] px-5 py-3 text-sm font-bold text-[#00152a] hover:bg-[#f2f4f7]">Back to Sign In</Link>
            <ActionButton type="submit" loading={loading}>Submit Application</ActionButton>
          </div>
        </div>
      </form>
    </PartnerShell>
  );
}
