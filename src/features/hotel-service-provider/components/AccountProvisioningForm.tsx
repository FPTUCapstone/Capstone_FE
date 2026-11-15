'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ROUTES } from '@/lib/routes';
import { StaffProviderService } from '../services/staffProviderService';
import type { CommercialPoiItem, ProvisionedAccount, ServiceCategory } from '../types';
import { WorkflowError } from '../services/workflowClient';
import { hotelProviderEn } from '../resources/en';

const INPUT = 'mt-2 min-h-11 w-full rounded-lg border border-[#DCE2DD] bg-white px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-blue-600';
const BUTTON = 'inline-flex min-h-11 items-center justify-center rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50';

export function AccountProvisioningForm({ kind }: { kind: 'staff' | 'provider' }) {
  const provider = kind === 'provider';
  const [pois, setPois] = useState<CommercialPoiItem[]>([]);
  const [poiState, setPoiState] = useState<'loading' | 'ready' | 'error'>(provider ? 'loading' : 'ready');
  const [poiRetry, setPoiRetry] = useState(0);
  const [category, setCategory] = useState<ServiceCategory>('Hotel');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [keyword, setKeyword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [account, setAccount] = useState<ProvisionedAccount | null>(null);
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);

  useEffect(() => {
    if (!provider) return;
    let active = true;
    StaffProviderService.fetchCommercialPois().then(items => {
      if (active) { setPois(items); setPoiState('ready'); }
    }).catch(() => { if (active) setPoiState('error'); });
    return () => { active = false; };
  }, [provider, poiRetry]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current || account) return;
    const values = new FormData(event.currentTarget);
    const fullName = String(values.get('fullName') ?? '').trim();
    const email = String(values.get('email') ?? '').trim();
    const phoneNumber = String(values.get('phoneNumber') ?? '').trim();
    const businessName = String(values.get('businessName') ?? '').trim();
    const next: Record<string, string> = {};
    for (const [name, value] of Object.entries({ fullName, email, phoneNumber, ...(provider ? { businessName } : {}) })) {
      if (!value) next[name] = hotelProviderEn.messages.MSG01;
    }
    if (email && !/^\S+@\S+\.\S+$/.test(email)) next.email = hotelProviderEn.messages.MSG143;
    if (provider && !selectedIds.length) next.pois = 'Please link at least one commercial point of interest.';
    setErrors(next);
    setMessage('');
    if (Object.keys(next).length) return;
    submitting.current = true;
    setBusy(true);
    try {
      const result = provider
        ? await StaffProviderService.createServiceProviderAccount({ fullName, email, phoneNumber, businessName, category, linkedPoiIds: selectedIds })
        : await StaffProviderService.createStaffAccount({ fullName, email, phoneNumber });
      setAccount(result.account);
    } catch (error) {
      const failure = error instanceof WorkflowError ? error : new WorkflowError();
      setMessage(failure.message);
      if (failure.code === 'MSG05') setErrors({ email: failure.message });
      if (failure.code === 'MSG_PHONE_DUP') setErrors({ phoneNumber: failure.message });
      if (failure.code === 'MSG34' || failure.code === 'MSG202') {
        setErrors({ pois: failure.message });
        setSelectedIds([]);
        setPoiRetry(value => value + 1);
      }
    } finally { submitting.current = false; setBusy(false); }
  }

  return (
    <section className="mx-auto max-w-5xl space-y-6 text-[#1C2928]">
      <Link href={ROUTES.admin.users} className="inline-flex min-h-11 items-center text-sm text-blue-700 hover:underline">User Management</Link>
      <header>
        <h1 className="text-2xl font-bold">Create {provider ? 'Service Provider' : 'Staff'} Account</h1>
        <p className="mt-2 text-sm text-[#5B6E69]">{provider ? 'Link an account to active commercial points of interest.' : 'Create an internal Staff account.'}</p>
      </header>
      {message && <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-800">{message}</p>}
      {account ? (
        <div role="status" className="space-y-3 rounded-xl border border-[#DCE2DD] bg-white p-6">
          <h2 className="text-lg font-semibold">{provider ? 'Service Provider' : 'Staff'} account created</h2>
          <p>{account.fullName} · {account.email}</p>
          <p className="text-sm">{account.emailDeliveryStatus === 'Delivered'
            ? 'The temporary password email has been sent.'
            : account.emailDeliveryStatus === 'DefiniteFailure'
              ? 'The account was created, but the temporary password email could not be sent. Ask the account holder to use Forgot password at sign-in.'
              : 'The account was created. Email delivery could not be confirmed. Check the inbox and spam folder, or use Forgot password at sign-in.'}</p>
          <p className="text-sm text-[#5B6E69]">The account must change its temporary password at first sign-in.</p>
          <Link href={ROUTES.admin.users} className={BUTTON}>Return to User Management</Link>
        </div>
      ) : (
        <form noValidate onSubmit={submit} className="rounded-xl border border-[#DCE2DD] bg-white p-5 shadow-xs sm:p-8">
          <fieldset disabled={busy} className="grid gap-5 sm:grid-cols-2">
            {[
              { name: 'fullName', label: provider ? 'Representative Full Name' : 'Full Name', type: 'text', autoComplete: 'name', maxLength: 150 },
              { name: 'email', label: 'Account Email Address', type: 'email', autoComplete: 'email', maxLength: provider ? 200 : 256 },
              { name: 'phoneNumber', label: 'Contact Phone Number', type: 'tel', autoComplete: 'tel', maxLength: 20 },
              ...(provider ? [{ name: 'businessName', label: 'Business / Property Name', type: 'text', autoComplete: 'organization', maxLength: 150 }] : []),
            ].map(field => (
              <div key={field.name}>
                <label htmlFor={field.name} className="text-sm font-semibold">{field.label}</label>
                <input name={field.name} type={field.type} autoComplete={field.autoComplete} id={field.name} required maxLength={field.maxLength} aria-invalid={!!errors[field.name]} aria-describedby={errors[field.name] ? `${field.name}-error` : undefined} className={INPUT} />
                {errors[field.name] && <p id={`${field.name}-error`} className="mt-1 text-sm text-red-700">{errors[field.name]}</p>}
              </div>
            ))}
            {provider && <>
              <label className="text-sm font-semibold">Service Category
                <select value={category} onChange={event => setCategory(event.target.value as ServiceCategory)} className={INPUT}>
                  <option value="Hotel">Hotel</option><option value="VehicleRental">Vehicle Rental</option><option value="Restaurant">Restaurant</option>
                </select>
              </label>
              <fieldset className="space-y-3 sm:col-span-2">
                <legend className="text-sm font-semibold">Select Active Commercial POI</legend>
                {poiState === 'loading' && <p role="status">Loading available points of interest…</p>}
                {poiState === 'error' && <div role="alert"><p>{hotelProviderEn.messages.MSG127}</p><button type="button" className={BUTTON} onClick={() => { setPoiState('loading'); setPoiRetry(value => value + 1); }}>Retry</button></div>}
                {poiState === 'ready' && <>
                  <label className="block text-sm">Search available points of interest<input type="search" value={keyword} onChange={event => setKeyword(event.target.value)} className={INPUT} /></label>
                  {!pois.length && <p className="text-sm text-[#5B6E69]">No available commercial points of interest.</p>}
                  <div className="grid max-h-64 gap-2 overflow-y-auto sm:grid-cols-2">
                    {pois.filter(poi => poi.name.toLowerCase().includes(keyword.toLowerCase())).map(poi => (
                      <label key={poi.id} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-[#DCE2DD] p-3 text-sm">
                        <input type="checkbox" aria-label={`Select ${poi.name}`} checked={selectedIds.includes(poi.id)} onChange={event => setSelectedIds(ids => event.target.checked ? [...ids, poi.id] : ids.filter(id => id !== poi.id))} />
                        <span>{poi.name}<span className="block text-xs text-[#5B6E69]">{poi.category}</span></span>
                      </label>
                    ))}
                  </div>
                </>}
                {errors.pois && <p role="alert" className="text-sm text-red-700">{errors.pois}</p>}
              </fieldset>
            </>}
            <div className="flex flex-wrap gap-3 border-t border-[#DCE2DD] pt-5 sm:col-span-2">
              <button type="submit" disabled={busy || (provider && poiState !== 'ready')} className={BUTTON}>{busy ? 'Creating…' : provider ? 'Create Provider Account' : 'Create Account'}</button>
              <Link href={ROUTES.admin.users} className="inline-flex min-h-11 items-center rounded-lg border border-[#DCE2DD] px-4 text-sm font-semibold">Cancel</Link>
            </div>
          </fieldset>
        </form>
      )}
    </section>
  );
}
