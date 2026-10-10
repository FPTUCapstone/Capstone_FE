'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';

import { PartnerShell } from '@/components/layout/PartnerShell';
import { ActionButton } from '@/components/ui/ActionButton';
import { FeedbackAlert } from '@/components/ui/FeedbackAlert';
import { TextField, fieldClassName } from '@/components/ui/FormControls';
import { webRefresh } from '@/lib/authApi';
import { ROUTES } from '@/lib/routes';
import {
  getOperatorApplication,
  OperatorApplicationError,
  resubmitOperatorApplication,
  type OperatorApplication,
} from './operatorApplicationApi';
import { operatorMessage, operatorFieldMessage } from './operatorMessages';

type Values = {
  companyName: string; businessLicenseNo: string; taxCode: string;
  businessAddress: string; contactPerson: string; contactPhone: string;
};
type ErrorKey = keyof Values | 'businessLicenseDocument' | 'supportingDocuments';

const TAX = /^\d{10}(?:-\d{3})?$/;
const LICENCE = /^\d{2}-\d+\/\d{4}\/(?:TCDL-GPLHQT|SDL-GPLHND)$/;
const PHONE = /^0\d{9}$/;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const EXTENSION = /\.(?:pdf|jpe?g|png)$/i;

function validFile(file: File): boolean {
  return file.size > 0 && file.size <= MAX_FILE_SIZE && EXTENSION.test(file.name);
}

function initialValues(application: OperatorApplication): Values {
  return {
    companyName: application.companyName,
    businessLicenseNo: application.businessLicenseNo,
    taxCode: application.taxCode,
    businessAddress: application.businessAddress ?? '',
    contactPerson: application.contactPerson,
    contactPhone: application.contactPhone ?? '',
  };
}

export function ResubmitApplicationForm() {
  const router = useRouter();
  const [application, setApplication] = useState<OperatorApplication | null>(null);
  const [values, setValues] = useState<Values | null>(null);
  const [licence, setLicence] = useState<File | undefined>();
  const [supporting, setSupporting] = useState<File[]>([]);
  const [errors, setErrors] = useState<Partial<Record<ErrorKey, string>>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    void getOperatorApplication(controller.signal).then((result) => {
      if (result.approvalStatus !== 'Rejected' || result.userStatus !== 'Rejected') {
        router.replace(ROUTES.partner.application);
        return;
      }
      setApplication(result);
      setValues(initialValues(result));
    }).catch((reason: unknown) => {
      if (controller.signal.aborted) return;
      if (reason instanceof OperatorApplicationError && reason.status === 401) {
        window.location.assign(`${ROUTES.signIn}?returnUrl=${encodeURIComponent(ROUTES.partner.application)}`);
      } else setGlobalError(operatorMessage('MSG127'));
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [router]);

  function update(key: keyof Values, value: string) {
    setValues((current) => current ? { ...current, [key]: value } : current);
  }

  function validate(current: Values): Partial<Record<ErrorKey, string>> {
    const next: Partial<Record<ErrorKey, string>> = {};
    const required: Array<[keyof Values, number]> = [
      ['companyName', 200], ['businessLicenseNo', 100], ['taxCode', 50], ['contactPerson', 150],
    ];
    for (const [key, max] of required) {
      const text = current[key].trim();
      if (!text) next[key] = operatorMessage('MSG01');
      else if (text.length > max) next[key] = `Must not exceed ${max} characters.`;
    }
    if (current.businessAddress.trim().length > 300) next.businessAddress = 'Must not exceed 300 characters.';
    if (current.taxCode.trim() && !TAX.test(current.taxCode.trim())) next.taxCode = operatorMessage('OPERATOR_TAX_CODE_INVALID');
    if (current.businessLicenseNo.trim() && !LICENCE.test(current.businessLicenseNo.trim())) next.businessLicenseNo = operatorMessage('OPERATOR_TRAVEL_LICENSE_INVALID');
    if (current.contactPhone.trim() && !PHONE.test(current.contactPhone.trim())) next.contactPhone = operatorMessage('MSG04');
    if (licence && !validFile(licence)) next.businessLicenseDocument = operatorMessage('MSG158');
    if (supporting.length > 5 || supporting.some((file) => !validFile(file))) next.supportingDocuments = operatorMessage('MSG158');
    return next;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!values || submitting) return;
    const next = validate(values);
    setErrors(next);
    setGlobalError(null);
    if (Object.keys(next).length) return;

    setSubmitting(true);
    try {
      await resubmitOperatorApplication({ ...values, businessLicenseDocument: licence, supportingDocuments: supporting });
      await webRefresh();
      router.replace(`${ROUTES.partner.application}?resubmitted=1`);
      router.refresh();
    } catch (reason) {
      if (reason instanceof OperatorApplicationError) {
        if (reason.status === 401) {
          window.location.assign(`${ROUTES.signIn}?returnUrl=${encodeURIComponent(ROUTES.partner.application)}`);
          return;
        }
        if (reason.status === 409 && reason.code === 'MSG161') {
          await webRefresh().catch(() => undefined);
          router.replace(ROUTES.partner.application);
          return;
        }
        const fieldErrors: Partial<Record<ErrorKey, string>> = {};
        for (const [field, code] of Object.entries(reason.fields ?? {})) {
          fieldErrors[field as ErrorKey] = operatorFieldMessage(field, code);
        }
        setErrors(fieldErrors);
        setGlobalError(operatorMessage(reason.code));
      } else setGlobalError(operatorMessage('MSG127'));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !application || !values) {
    return <PartnerShell title="Correct and resubmit application" description="Loading your rejected application."><div role="status" className="h-40 animate-pulse rounded-3xl bg-white"><span className="sr-only">Loading application</span></div>{globalError && <FeedbackAlert tone="error">{globalError}</FeedbackAlert>}</PartnerShell>;
  }

  return (
    <PartnerShell title="Correct and resubmit application" description="Update the rejected application without creating another account.">
      <div className="mb-6"><FeedbackAlert tone="error" title="Latest rejection reason">{application.rejectionReason || 'No reason recorded.'}</FeedbackAlert></div>
      <form className="rounded-3xl border border-[#d8dadd] bg-white p-5 shadow-[0_16px_45px_rgba(0,21,42,0.08)] sm:p-8" noValidate onSubmit={handleSubmit}>
        <fieldset disabled={submitting} className="border-0 p-0"><legend className="text-xl font-extrabold text-[#00152a]">Company and contact information</legend><div className="mt-5 grid gap-5 sm:grid-cols-2">
          <TextField label="Company Name" name="companyName" value={values.companyName} error={errors.companyName} onChange={(e) => update('companyName', e.target.value)} />
          <TextField label="Business Licence Number" name="businessLicenseNo" value={values.businessLicenseNo} error={errors.businessLicenseNo} onChange={(e) => update('businessLicenseNo', e.target.value)} />
          <TextField label="Tax Code" name="taxCode" value={values.taxCode} error={errors.taxCode} onChange={(e) => update('taxCode', e.target.value)} />
          <TextField label="Business Address" name="businessAddress" value={values.businessAddress} error={errors.businessAddress} onChange={(e) => update('businessAddress', e.target.value)} />
          <TextField label="Contact Person" name="contactPerson" value={values.contactPerson} error={errors.contactPerson} onChange={(e) => update('contactPerson', e.target.value)} />
          <TextField label="Contact Phone Number" name="contactPhone" type="tel" value={values.contactPhone} error={errors.contactPhone} onChange={(e) => update('contactPhone', e.target.value)} />
        </div></fieldset>

        <fieldset disabled={submitting} className="mt-8 border-0 border-t border-[#d8dadd] p-0 pt-8"><legend className="text-xl font-extrabold text-[#00152a]">Documents</legend>
          <div className="mt-4 space-y-2">{application.documents.map((document) => <div key={document.documentId} className="rounded-xl border p-3 text-sm font-semibold">{document.documentType} #{document.documentId} · {document.status}</div>)}</div>
          <label className="mt-4 block font-bold text-[#00152a]">Replacement Business Licence (optional)<input className={fieldClassName} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(event) => setLicence(event.target.files?.[0])} /></label>
          <p className="mt-1 text-xs text-[#59616b]">Leave empty to submit the latest existing licence for review again.</p>{errors.businessLicenseDocument && <p className="mt-2 text-xs font-semibold text-[#ba1a1a]">{errors.businessLicenseDocument}</p>}
          <label className="mt-4 block font-bold text-[#00152a]">Supporting documents (optional, up to 5)<input className={fieldClassName} type="file" multiple accept=".pdf,.jpg,.jpeg,.png" onChange={(event) => setSupporting(Array.from(event.target.files ?? []))} /></label>{errors.supportingDocuments && <p className="mt-2 text-xs font-semibold text-[#ba1a1a]">{errors.supportingDocuments}</p>}
        </fieldset>

        {globalError && <div className="mt-5"><FeedbackAlert tone="error">{globalError}</FeedbackAlert></div>}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Link href={ROUTES.partner.application} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#9aa1aa] px-5 py-3 text-sm font-bold text-[#00152a]">Cancel</Link><ActionButton type="submit" loading={submitting} variant="coral">Resubmit Application</ActionButton></div>
      </form>
    </PartnerShell>
  );
}
