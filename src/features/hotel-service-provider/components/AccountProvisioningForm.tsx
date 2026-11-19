'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ROUTES } from '@/lib/routes';
import { StaffProviderService } from '../services/staffProviderService';
import type { CommercialPoiItem, ProvisionedAccount, ServiceCategory } from '../types';
import { WorkflowError } from '../services/workflowClient';
import { hotelProviderEn } from '../resources/en';

const INPUT =
  'mt-1.5 min-h-11 w-full rounded-xl border border-[#DCE5E2] bg-white px-3.5 py-2.5 text-sm text-[#1D2D2B] placeholder:text-[#61736F] transition focus:border-[#0D5754] focus:ring-2 focus:ring-[#0D5754]/20 focus:outline-hidden disabled:bg-slate-50 disabled:cursor-not-allowed';
const PRIMARY_BUTTON =
  'inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#0D5754] px-5 py-2.5 text-sm font-bold text-white shadow-xs transition hover:bg-[#094743] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D5754] disabled:cursor-not-allowed disabled:opacity-50';
const SECONDARY_BUTTON =
  'inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl border border-[#DCE5E2] bg-white px-5 py-2.5 text-sm font-bold text-[#61736F] transition hover:bg-[#F5F7F6] hover:text-[#1D2D2B] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D5754]';

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
    StaffProviderService.fetchCommercialPois()
      .then((items) => {
        if (active) {
          setPois(items);
          setPoiState('ready');
        }
      })
      .catch(() => {
        if (active) setPoiState('error');
      });
    return () => {
      active = false;
    };
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
    for (const [name, value] of Object.entries({
      fullName,
      email,
      phoneNumber,
      ...(provider ? { businessName } : {}),
    })) {
      if (!value) next[name] = hotelProviderEn.messages.MSG01;
    }

    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      next.email = hotelProviderEn.messages.MSG143;
    }

    if (phoneNumber) {
      const sanitizedPhone = phoneNumber.replace(/[\s\-()]/g, '');
      if (!/^\+?\d{8,15}$/.test(sanitizedPhone)) {
        next.phoneNumber = 'Please enter a valid phone number with 8 to 15 digits.';
      }
    }

    if (provider && !selectedIds.length) {
      next.pois = 'Please link at least one commercial point of interest.';
    }

    setErrors(next);
    setMessage('');
    if (Object.keys(next).length) return;

    submitting.current = true;
    setBusy(true);
    try {
      const result = provider
        ? await StaffProviderService.createServiceProviderAccount({
            fullName,
            email,
            phoneNumber,
            businessName,
            category,
            linkedPoiIds: selectedIds,
          })
        : await StaffProviderService.createStaffAccount({ fullName, email, phoneNumber });
      setAccount(result.account);
    } catch (error) {
      const failure = error instanceof WorkflowError ? error : new WorkflowError();
      const codeKey = failure.code as keyof typeof hotelProviderEn.messages;
      const englishMsg = typeof hotelProviderEn.messages[codeKey] === 'string'
        ? (hotelProviderEn.messages[codeKey] as string)
        : failure.message;
      setMessage(englishMsg);
      if (failure.code === 'MSG05') setErrors({ email: englishMsg });
      if (failure.code === 'MSG_PHONE_DUP') setErrors({ phoneNumber: englishMsg });
      if (failure.code === 'MSG34' || failure.code === 'MSG202') {
        setErrors({ pois: englishMsg });
        setSelectedIds([]);
        setPoiRetry((value) => value + 1);
      }
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  const roleName = provider ? 'Service Provider' : 'Staff';

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-6 text-[#1D2D2B]">
      {/* Clean Breadcrumbs */}
      <nav aria-label="Breadcrumb">
        <ol className="flex items-center gap-1.5 text-xs text-[#61736F]">
          <li>
            <Link href="/admin" className="transition hover:text-[#1D2D2B]">
              Administration
            </Link>
          </li>
          <li>
            <span className="material-symbols-outlined text-xs" aria-hidden="true">
              chevron_right
            </span>
          </li>
          <li>
            <Link href={ROUTES.admin.users} className="transition hover:text-[#1D2D2B]">
              User Accounts
            </Link>
          </li>
          <li>
            <span className="material-symbols-outlined text-xs" aria-hidden="true">
              chevron_right
            </span>
          </li>
          <li className="font-semibold text-[#1D2D2B]" aria-current="page">
            Create {roleName} Account
          </li>
        </ol>
      </nav>

      {/* Header */}
      <header>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1D2D2B]">
          Create {roleName} Account
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-[#61736F]">
          {provider
            ? 'Provision a commercial service provider account and link active points of interest.'
            : 'Provision a new internal Staff account with operational and moderation privileges.'}
        </p>
      </header>

      {/* Global Alert */}
      {message && (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs sm:text-sm font-semibold text-red-800 shadow-xs"
        >
          <span className="material-symbols-outlined text-base text-red-600" aria-hidden="true">
            error
          </span>
          <p>{message}</p>
        </div>
      )}

      {/* Success Confirmation Card */}
      {account ? (
        <div
          role="status"
          className="rounded-2xl border border-[#DCE5E2] bg-white p-6 sm:p-8 shadow-xs space-y-5"
        >
          <div className="flex items-center gap-3">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E8F0EA] text-[#0D5754]"
              aria-hidden="true"
            >
              <span className="material-symbols-outlined text-xl">check_circle</span>
            </span>
            <div>
              <h2 className="text-lg font-bold text-[#1D2D2B]">
                {roleName} account created successfully
              </h2>
              <p className="text-xs text-[#61736F]">
                {account.fullName} · {account.email}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-[#DCE5E2] bg-[#F5F7F6] p-4 text-xs sm:text-sm space-y-2">
            <p className="text-[#1D2D2B]">
              {account.emailDeliveryStatus === 'Delivered'
                ? 'The temporary password email has been sent.'
                : account.emailDeliveryStatus === 'DefiniteFailure'
                  ? 'The account was created, but the temporary password email could not be sent. Ask the account holder to use Forgot password at sign-in.'
                  : 'The account was created. Email delivery could not be confirmed. Check the inbox and spam folder, or use Forgot password at sign-in.'}
            </p>
            <p className="text-[#61736F]">
              The account holder is required to set a permanent password upon first sign-in. Passwords are securely hashed per BR-03.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link href={ROUTES.admin.users} className={PRIMARY_BUTTON}>
              Return to User Accounts
            </Link>
            <button
              type="button"
              onClick={() => {
                setAccount(null);
                setErrors({});
                setMessage('');
              }}
              className={SECONDARY_BUTTON}
            >
              Create another account
            </button>
          </div>
        </div>
      ) : (
        /* Form Experience */
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
          {/* Main Form Card */}
          <form
            noValidate
            onSubmit={submit}
            className={`rounded-2xl border border-[#DCE5E2] bg-white p-6 sm:p-8 shadow-xs ${
              provider ? 'lg:col-span-12' : 'lg:col-span-7'
            }`}
          >
            <fieldset disabled={busy} className="space-y-5">
              <div className="flex items-center justify-between border-b border-[#DCE5E2] pb-3 mb-2">
                <h2 className="text-sm font-bold text-[#1D2D2B]">Account Credentials</h2>
                <span className="text-[11px] text-[#61736F]">
                  Fields with <span className="text-red-600 font-bold">*</span> are required
                </span>
              </div>

              {/* Full Name */}
              <div>
                <label htmlFor="fullName" className="block text-xs font-bold text-[#1D2D2B]">
                  {provider ? 'Representative Full Name' : 'Full Name'}{' '}
                  <span className="text-red-600">*</span>
                </label>
                <input
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  id="fullName"
                  required
                  maxLength={150}
                  placeholder="e.g. Nguyen Van A"
                  aria-invalid={!!errors.fullName}
                  aria-describedby={errors.fullName ? 'fullName-error' : 'fullName-hint'}
                  className={INPUT}
                />
                <p id="fullName-hint" className="mt-1 text-[11px] text-[#61736F]">
                  Full legal name of the account holder.
                </p>
                {errors.fullName && (
                  <p id="fullName-error" role="alert" className="mt-1 text-xs font-semibold text-red-600">
                    {errors.fullName}
                  </p>
                )}
              </div>

              {/* Account Email Address */}
              <div>
                <label htmlFor="email" className="block text-xs font-bold text-[#1D2D2B]">
                  Account Email Address <span className="text-red-600">*</span>
                </label>
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  id="email"
                  required
                  maxLength={provider ? 200 : 256}
                  placeholder="staff@tripmate.com"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'email-error' : 'email-hint'}
                  className={INPUT}
                />
                <p id="email-hint" className="mt-1 text-[11px] text-[#61736F]">
                  Used for sign-in and system notifications. Must be unique.
                </p>
                {errors.email && (
                  <p id="email-error" role="alert" className="mt-1 text-xs font-semibold text-red-600">
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Contact Phone Number */}
              <div>
                <label htmlFor="phoneNumber" className="block text-xs font-bold text-[#1D2D2B]">
                  Contact Phone Number <span className="text-red-600">*</span>
                </label>
                <input
                  name="phoneNumber"
                  type="tel"
                  autoComplete="tel"
                  id="phoneNumber"
                  required
                  maxLength={20}
                  placeholder="e.g. 0912345678"
                  aria-invalid={!!errors.phoneNumber}
                  aria-describedby={errors.phoneNumber ? 'phoneNumber-error' : 'phoneNumber-hint'}
                  className={INPUT}
                />
                <p id="phoneNumber-hint" className="mt-1 text-[11px] text-[#61736F]">
                  Primary phone string preserving leading zeros (e.g. 09... or +84...).
                </p>
                {errors.phoneNumber && (
                  <p id="phoneNumber-error" role="alert" className="mt-1 text-xs font-semibold text-red-600">
                    {errors.phoneNumber}
                  </p>
                )}
              </div>

              {/* Service Provider specific fields */}
              {provider && (
                <>
                  <div>
                    <label htmlFor="businessName" className="block text-xs font-bold text-[#1D2D2B]">
                      Business / Property Name <span className="text-red-600">*</span>
                    </label>
                    <input
                      name="businessName"
                      type="text"
                      autoComplete="organization"
                      id="businessName"
                      required
                      maxLength={150}
                      className={INPUT}
                    />
                    {errors.businessName && (
                      <p id="businessName-error" role="alert" className="mt-1 text-xs font-semibold text-red-600">
                        {errors.businessName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1D2D2B]">
                      Service Category
                      <select
                        value={category}
                        onChange={(event) => setCategory(event.target.value as ServiceCategory)}
                        className={INPUT}
                      >
                        <option value="Hotel">Hotel</option>
                        <option value="VehicleRental">Vehicle Rental</option>
                        <option value="Restaurant">Restaurant</option>
                      </select>
                    </label>
                  </div>

                  <fieldset className="space-y-3 pt-2">
                    <legend className="text-xs font-bold text-[#1D2D2B]">
                      Select Active Commercial POI <span className="text-red-600">*</span>
                    </legend>
                    {poiState === 'loading' && (
                      <p role="status" className="text-xs text-[#61736F]">
                        Loading available points of interest…
                      </p>
                    )}
                    {poiState === 'error' && (
                      <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                        <p>{hotelProviderEn.messages.MSG127}</p>
                        <button
                          type="button"
                          className="mt-2 text-xs font-bold underline"
                          onClick={() => {
                            setPoiState('loading');
                            setPoiRetry((value) => value + 1);
                          }}
                        >
                          Retry
                        </button>
                      </div>
                    )}
                    {poiState === 'ready' && (
                      <>
                        <input
                          type="search"
                          placeholder="Search available points of interest..."
                          value={keyword}
                          onChange={(event) => setKeyword(event.target.value)}
                          className={INPUT}
                        />
                        {!pois.length && (
                          <p className="text-xs text-[#61736F]">No available commercial points of interest.</p>
                        )}
                        <div className="grid max-h-56 gap-2 overflow-y-auto sm:grid-cols-2 pt-1">
                          {pois
                            .filter((poi) => poi.name.toLowerCase().includes(keyword.toLowerCase()))
                            .map((poi) => (
                              <label
                                key={poi.id}
                                className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-[#DCE5E2] p-3 text-xs transition hover:bg-[#F5F7F6]"
                              >
                                <input
                                  type="checkbox"
                                  aria-label={`Select ${poi.name}`}
                                  checked={selectedIds.includes(poi.id)}
                                  onChange={(event) =>
                                    setSelectedIds((ids) =>
                                      event.target.checked ? [...ids, poi.id] : ids.filter((id) => id !== poi.id),
                                    )
                                  }
                                />
                                <span>
                                  <strong className="block text-[#1D2D2B]">{poi.name}</strong>
                                  <span className="text-[11px] text-[#61736F]">{poi.category}</span>
                                </span>
                              </label>
                            ))}
                        </div>
                      </>
                    )}
                    {errors.pois && (
                      <p role="alert" className="text-xs font-semibold text-red-600">
                        {errors.pois}
                      </p>
                    )}
                  </fieldset>
                </>
              )}

              {/* Form CTA Buttons */}
              <div className="flex flex-wrap items-center gap-3 border-t border-[#DCE5E2] pt-5">
                <button
                  type="submit"
                  disabled={busy || (provider && poiState !== 'ready')}
                  className={PRIMARY_BUTTON}
                >
                  {busy ? (
                    <>
                      <span
                        className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent"
                        aria-hidden="true"
                      />
                      <span>Creating…</span>
                    </>
                  ) : provider ? (
                    'Create Provider Account'
                  ) : (
                    'Create Staff Account'
                  )}
                </button>
                <Link href={ROUTES.admin.users} className={SECONDARY_BUTTON}>
                  Cancel
                </Link>
              </div>
            </fieldset>
          </form>

          {/* Contextual Guidance Panel (Desktop) */}
          {!provider && (
            <aside
              role="region"
              aria-label="Staff account information"
              className="lg:col-span-5 rounded-2xl border border-[#DCE5E2] bg-[#F5F7F6] p-6 space-y-5"
            >
              <div className="flex items-center gap-2 text-[#0D5754]">
                <span className="material-symbols-outlined text-xl" aria-hidden="true">
                  shield_person
                </span>
                <h2 className="text-sm font-extrabold tracking-tight uppercase">
                  Staff Role Privileges
                </h2>
              </div>

              <div className="space-y-4 text-xs text-[#61736F]">
                <div>
                  <h3 className="font-bold text-[#1D2D2B]">Operational Scope</h3>
                  <p className="mt-1 leading-relaxed">
                    Staff accounts hold operational governance permissions including reviewing Tour Operator
                    applications, moderating submitted tour packages, inspecting bookings, and monitoring active trips.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-[#1D2D2B]">Activation & Password</h3>
                  <p className="mt-1 leading-relaxed">
                    TripMate automatically generates an activation email containing temporary credentials. The staff member is required to set a permanent password upon first sign-in, while all stored credentials remain hashed and protected per{' '}
                    <strong>BR-03</strong>.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-[#1D2D2B]">Account Identity</h3>
                  <p className="mt-1 leading-relaxed">
                    Both the email address and contact phone number must be unique across the platform. Stored passwords
                    are never viewable or retrievable.
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-[#0D5754]/20 bg-[#E8F0EA] p-3 text-[11px] text-[#0D5754]">
                <p className="font-bold">Administrator Notice</p>
                <p className="mt-0.5">
                  Only Administrators have authorization to provision internal Staff accounts. Staff users cannot provision other staff.
                </p>
              </div>
            </aside>
          )}
        </div>
      )}
    </main>
  );
}
