'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { FormEvent } from 'react';

import { PartnerShell } from '@/components/layout/PartnerShell';
import { ActionButton } from '@/components/ui/ActionButton';
import { FeedbackAlert } from '@/components/ui/FeedbackAlert';
import { TextField, fieldClassName } from '@/components/ui/FormControls';
import { mockOperatorApplication, simulateMockRequest } from '@/data/batchOneMock';
import { ROUTES } from '@/lib/routes';

type EditableValues = {
  companyName: string;
  licenceNumber: string;
  taxCode: string;
  businessAddress: string;
  contactPerson: string;
  contactPhone: string;
};

export function ResubmitApplicationForm() {
  const [values, setValues] = useState<EditableValues>({
    companyName: mockOperatorApplication.companyName,
    licenceNumber: mockOperatorApplication.businessLicenceNumber,
    taxCode: mockOperatorApplication.taxCode,
    businessAddress: mockOperatorApplication.businessAddress,
    contactPerson: mockOperatorApplication.contactPerson,
    contactPhone: mockOperatorApplication.contactPhone,
  });
  const [replacementSelected, setReplacementSelected] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof EditableValues | 'documents', string>>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  function update<K extends keyof EditableValues>(key: K, value: EditableValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: typeof errors = {};
    for (const key of Object.keys(values) as (keyof EditableValues)[]) {
      if (!values[key].trim()) nextErrors[key] = 'This field is required.';
    }
    if (!replacementSelected) nextErrors.documents = 'Add a replacement or additional document before resubmitting.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    await simulateMockRequest();
    setLoading(false);
    setSuccess(true);
  }

  if (success) {
    return (
      <PartnerShell title="Resubmit Application" description="This correction task is available only when the latest application is Rejected.">
        <section className="rounded-3xl border border-[#9edbd2] bg-white p-6 shadow-[0_16px_45px_rgba(0,21,42,0.08)] sm:p-8">
          <FeedbackAlert tone="success" title="Application resubmitted">The existing application has returned to Pending Review. No duplicate application was created.</FeedbackAlert>
          <Link href={`${ROUTES.partner.application}?status=pending`} className="mt-6 flex min-h-11 items-center justify-center rounded-xl bg-[#007d6e] px-5 py-3 text-sm font-bold text-white hover:bg-[#006b5f]">Return to Application Status</Link>
        </section>
      </PartnerShell>
    );
  }

  return (
    <PartnerShell title="Correct and resubmit application" description="Review the rejection context, update the prefilled business information, and replace or add supporting documents.">
      <div className="mb-6"><FeedbackAlert tone="error" title="Latest rejection reason">{mockOperatorApplication.rejectionReason}</FeedbackAlert></div>
      <dl className="mb-6 grid gap-4 rounded-2xl border border-[#d8dadd] bg-white p-5 sm:grid-cols-3">
        <div><dt className="text-xs font-bold uppercase tracking-wide text-[#74777e]">Application ID</dt><dd className="mt-2 font-mono text-sm font-bold text-[#00152a]">{mockOperatorApplication.id}</dd></div>
        <div><dt className="text-xs font-bold uppercase tracking-wide text-[#74777e]">Current Status</dt><dd className="mt-2 text-sm font-bold text-[#93000a]">Rejected</dd></div>
        <div><dt className="text-xs font-bold uppercase tracking-wide text-[#74777e]">Reviewed</dt><dd className="mt-2 text-sm font-bold text-[#00152a]">{mockOperatorApplication.reviewedAt}</dd></div>
      </dl>

      <form className="rounded-3xl border border-[#d8dadd] bg-white p-5 shadow-[0_16px_45px_rgba(0,21,42,0.08)] sm:p-8" noValidate onSubmit={handleSubmit}>
        <fieldset className="border-0 p-0">
          <legend className="text-xl font-extrabold text-[#00152a]">Company and contact information</legend>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <TextField label="Company Name" name="companyName" value={values.companyName} disabled={loading} error={errors.companyName} onChange={(event) => update('companyName', event.target.value)} />
            <TextField label="Business Licence Number" name="licenceNumber" value={values.licenceNumber} disabled={loading} error={errors.licenceNumber} onChange={(event) => update('licenceNumber', event.target.value)} />
            <TextField label="Tax Code" name="taxCode" value={values.taxCode} disabled={loading} error={errors.taxCode} onChange={(event) => update('taxCode', event.target.value)} />
            <TextField label="Business Address" name="businessAddress" value={values.businessAddress} disabled={loading} error={errors.businessAddress} onChange={(event) => update('businessAddress', event.target.value)} />
            <TextField label="Contact Person" name="contactPerson" value={values.contactPerson} disabled={loading} error={errors.contactPerson} onChange={(event) => update('contactPerson', event.target.value)} />
            <TextField label="Contact Phone Number" name="contactPhone" type="tel" value={values.contactPhone} disabled={loading} error={errors.contactPhone} onChange={(event) => update('contactPhone', event.target.value)} />
          </div>
        </fieldset>

        <fieldset className="mt-8 border-0 border-t border-[#d8dadd] p-0 pt-8">
          <legend className="text-xl font-extrabold text-[#00152a]">Existing and replacement documents</legend>
          <div className="mt-5 space-y-3">
            {mockOperatorApplication.documents.map((document) => (
              <div key={document.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#d8dadd] p-4">
                <div><p className="text-sm font-bold text-[#00152a]">{document.name}</p><p className="mt-1 text-xs text-[#59616b]">Existing version · {document.status}</p></div>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase ${document.status === 'Current' ? 'bg-[#e8f7f4] text-[#006b5f]' : 'bg-[#fff0ed] text-[#93000a]'}`}>{document.status}</span>
              </div>
            ))}
          </div>
          <label className="mt-4 block rounded-2xl border border-dashed border-[#4fdbc8] bg-[#f3fbf9] p-6 text-center text-sm font-bold text-[#005048]">
            <span className="material-symbols-outlined mb-2 block text-3xl" aria-hidden="true">drive_folder_upload</span>
            Replace or add business documents
            <input type="file" name="replacementDocuments" multiple disabled={loading} className={`${fieldClassName} text-left normal-case tracking-normal`} onChange={(event) => setReplacementSelected(Boolean(event.target.files?.length))} />
          </label>
          {errors.documents ? <p className="mt-2 text-xs font-semibold text-[#ba1a1a]">{errors.documents}</p> : null}
        </fieldset>

        <FeedbackAlert title="Resubmission result" tone="info">A successful submission updates this application to Pending Review and returns to Operator Application Status.</FeedbackAlert>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link href={`${ROUTES.partner.application}?status=rejected`} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#9aa1aa] px-5 py-3 text-sm font-bold text-[#00152a] hover:bg-[#f2f4f7]">Cancel</Link>
          <ActionButton type="submit" loading={loading} variant="coral">Resubmit Application</ActionButton>
        </div>
        <p className="mt-6 rounded-lg bg-[#f2f4f7] px-3 py-2 text-center text-[11px] leading-relaxed text-[#59616b]">Interactive prototype: updates and document selection remain local and are not persisted.</p>
      </form>
    </PartnerShell>
  );
}
