'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AccessibleSelect } from '../common/AccessibleSelect';
import { SearchableMultiSelect } from '../common/SearchableMultiSelect';
import { useToast } from '../common/Toast';
import { StaffProviderService } from '../../services/staffProviderService';
import type { CommercialPoiItem, ServiceCategory, CreateServiceProviderPayload } from '../../types';
import { hotelProviderEn } from '../../resources/en';
import { ROUTES } from '@/lib/routes';

export function CreateServiceProviderView() {
  const router = useRouter();
  const { showToast } = useToast();

  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState<ServiceCategory>('Hotel');
  const [repName, setRepName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedPoiIds, setSelectedPoiIds] = useState<number[]>([]);

  const [pois, setPois] = useState<CommercialPoiItem[]>([]);
  const [isLoadingPois, setIsLoadingPois] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdSuccess, setCreatedSuccess] = useState(false);

  // Field errors for inline validation (CR-04)
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadPois() {
      setIsLoadingPois(true);
      try {
        const data = await StaffProviderService.fetchCommercialPois();
        setPois(data);
        // Pre-select first active available POI if exists
        const available = data.find((p) => p.status === 'Active' && !p.isLinkedToOtherProvider);
        if (available) {
          setSelectedPoiIds([available.id]);
        }
      } finally {
        setIsLoadingPois(false);
      }
    }
    loadPois();
  }, []);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!businessName.trim()) {
      newErrors.businessName = hotelProviderEn.messages.MSG01;
    }
    if (!repName.trim()) {
      newErrors.repName = hotelProviderEn.messages.MSG01;
    }
    if (!email.trim()) {
      newErrors.email = hotelProviderEn.messages.MSG01;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = hotelProviderEn.messages.MSG143;
    }
    if (!phone.trim()) {
      newErrors.phone = hotelProviderEn.messages.MSG01;
    } else if (!/^(0|\+84)[3|5|7|8|9][0-9]{8}$/.test(phone.trim().replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid Vietnamese phone number (e.g. 0905 123 456).';
    }
    if (selectedPoiIds.length === 0) {
      newErrors.pois = 'Please link at least one commercial point of interest.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      showToast(hotelProviderEn.messages.MSG01, 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateServiceProviderPayload = {
        businessName: businessName.trim(),
        serviceCategory: category,
        representativeFullName: repName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        linkedPoiIds: selectedPoiIds,
      };

      const result = await StaffProviderService.createServiceProviderAccount(payload);

      if (result.success) {
        setCreatedSuccess(true);
        showToast(hotelProviderEn.messages.MSG201, 'success');
      } else {
        const errorMsg =
          result.errorCode === 'MSG05'
            ? hotelProviderEn.messages.MSG05
            : result.errorCode === 'MSG34'
            ? hotelProviderEn.messages.MSG34
            : result.errorCode === 'MSG202'
            ? hotelProviderEn.messages.MSG202
            : result.errorMessage || hotelProviderEn.messages.MSG127;

        if (result.errorCode === 'MSG05') {
          setErrors((prev) => ({ ...prev, email: errorMsg }));
        } else if (result.errorCode === 'MSG34' || result.errorCode === 'MSG202') {
          setErrors((prev) => ({ ...prev, pois: errorMsg }));
        }
        showToast(errorMsg, 'error');
      }
    } catch {
      showToast(hotelProviderEn.messages.MSG133, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categoryOptions = [
    { value: 'Hotel' as ServiceCategory, label: hotelProviderEn.w102.serviceCategoryOptions.hotel, icon: 'hotel' },
    { value: 'VehicleRental' as ServiceCategory, label: hotelProviderEn.w102.serviceCategoryOptions.vehicleRental, icon: 'directions_car' },
    { value: 'Restaurant' as ServiceCategory, label: hotelProviderEn.w102.serviceCategoryOptions.restaurant, icon: 'restaurant' },
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-[#5B6E69] mb-1">
          <Link href={ROUTES.admin.users} className="hover:text-[#174B4A] transition-colors">
            {hotelProviderEn.w102.breadcrumb}
          </Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-[#1C2928] font-medium">{hotelProviderEn.w102.pageTitle}</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#1C2928] tracking-tight">
              {hotelProviderEn.w102.pageTitle}
            </h1>
            <p className="mt-1 text-xs text-[#5B6E69]">
              {hotelProviderEn.w102.subtitle}
            </p>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#E8F7F4] text-[#174B4A] border border-[#B2DFDB]">
            <span className="material-symbols-outlined text-[15px]">shield_person</span>
            Staff Role Boundary (UC-77)
          </span>
        </div>
      </div>

      {/* Success Notification Banner */}
      {createdSuccess && (
        <div className="p-4 bg-[#E6F7F0] border border-[#A7F3D0] rounded-xl flex items-start gap-3 text-[#065F46] animate-in fade-in duration-200">
          <span className="material-symbols-outlined text-[24px] text-[#0E9F6E] shrink-0">
            check_circle
          </span>
          <div className="flex-1 text-xs">
            <h3 className="font-bold text-sm mb-1">{hotelProviderEn.w102.successTitle}</h3>
            <p className="mb-2 leading-relaxed">
              {hotelProviderEn.messages.MSG201}
            </p>
            <p className="text-[11px] text-[#065F46]/80 font-medium">
              {hotelProviderEn.w102.successModalNote}
            </p>
            <div className="mt-3 flex items-center gap-3">
              <Link
                href={ROUTES.admin.users}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#0E9F6E] hover:bg-[#065F46] text-white font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Return to User Directory
              </Link>
              <button
                type="button"
                onClick={() => {
                  setCreatedSuccess(false);
                  setBusinessName('');
                  setRepName('');
                  setEmail('');
                  setPhone('');
                }}
                className="px-3 py-1.5 bg-white text-[#065F46] border border-[#A7F3D0] hover:bg-[#E6F7F0] font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Provision Another Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 65 / 35 Split Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (65% -> 8 cols of 12) */}
        <div className="lg:col-span-8 bg-white border border-[#DCE2DD] rounded-xl shadow-xs overflow-hidden">
          <form onSubmit={handleSubmit} noValidate className="p-6 space-y-6">
            {/* Section 1: Business Details */}
            <div>
              <div className="border-b border-[#E8ECE9] pb-2 mb-4">
                <h2 className="text-sm font-bold text-[#1C2928] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-[#174B4A]">
                    domain
                  </span>
                  {hotelProviderEn.w102.formSectionBusiness}
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Business Name */}
                <div className="sm:col-span-2">
                  <label htmlFor="w102-business-name" className="block text-xs font-semibold text-[#1C2928] mb-1">
                    {hotelProviderEn.w102.businessNameLabel}{' '}
                    <span className="text-[#DC2626]" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="w102-business-name"
                    type="text"
                    value={businessName}
                    onChange={(e) => {
                      setBusinessName(e.target.value);
                      if (errors.businessName) setErrors((prev) => ({ ...prev, businessName: '' }));
                    }}
                    placeholder={hotelProviderEn.w102.businessNamePlaceholder}
                    className={`w-full px-3 py-2 text-xs bg-white border rounded-lg text-[#1C2928] placeholder-[#8E9E9B] focus:outline-none focus:ring-2 focus:ring-[#174B4A] focus:border-[#174B4A] ${
                      errors.businessName ? 'border-[#DC2626]' : 'border-[#DCE2DD]'
                    }`}
                    aria-required="true"
                    aria-invalid={Boolean(errors.businessName)}
                  />
                  {errors.businessName && (
                    <p className="mt-1 text-xs text-[#DC2626]" role="alert">
                      {errors.businessName}
                    </p>
                  )}
                </div>

                {/* Service Category */}
                <div>
                  <AccessibleSelect
                    label={hotelProviderEn.w102.serviceCategoryLabel}
                    required
                    options={categoryOptions}
                    value={category}
                    onChange={(val) => setCategory(val)}
                  />
                </div>

                {/* Representative Full Name */}
                <div>
                  <label htmlFor="w102-rep-name" className="block text-xs font-semibold text-[#1C2928] mb-1">
                    {hotelProviderEn.w102.representativeNameLabel}{' '}
                    <span className="text-[#DC2626]" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="w102-rep-name"
                    type="text"
                    value={repName}
                    onChange={(e) => {
                      setRepName(e.target.value);
                      if (errors.repName) setErrors((prev) => ({ ...prev, repName: '' }));
                    }}
                    placeholder={hotelProviderEn.w102.representativeNamePlaceholder}
                    className={`w-full px-3 py-2 text-xs bg-white border rounded-lg text-[#1C2928] placeholder-[#8E9E9B] focus:outline-none focus:ring-2 focus:ring-[#174B4A] focus:border-[#174B4A] ${
                      errors.repName ? 'border-[#DC2626]' : 'border-[#DCE2DD]'
                    }`}
                    aria-required="true"
                    aria-invalid={Boolean(errors.repName)}
                  />
                  {errors.repName && (
                    <p className="mt-1 text-xs text-[#DC2626]" role="alert">
                      {errors.repName}
                    </p>
                  )}
                </div>

                {/* Account Email */}
                <div>
                  <label htmlFor="w102-email" className="block text-xs font-semibold text-[#1C2928] mb-1">
                    {hotelProviderEn.w102.emailLabel}{' '}
                    <span className="text-[#DC2626]" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="w102-email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                    }}
                    placeholder={hotelProviderEn.w102.emailPlaceholder}
                    className={`w-full px-3 py-2 text-xs bg-white border rounded-lg text-[#1C2928] placeholder-[#8E9E9B] focus:outline-none focus:ring-2 focus:ring-[#174B4A] focus:border-[#174B4A] ${
                      errors.email ? 'border-[#DC2626]' : 'border-[#DCE2DD]'
                    }`}
                    aria-required="true"
                    aria-invalid={Boolean(errors.email)}
                  />
                  <p className="mt-1 text-[11px] text-[#5B6E69]">
                    {hotelProviderEn.w102.emailHelpText}
                  </p>
                  {errors.email && (
                    <p className="mt-1 text-xs text-[#DC2626]" role="alert">
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Phone Number */}
                <div>
                  <label htmlFor="w102-phone" className="block text-xs font-semibold text-[#1C2928] mb-1">
                    {hotelProviderEn.w102.phoneLabel}{' '}
                    <span className="text-[#DC2626]" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="w102-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
                    }}
                    placeholder={hotelProviderEn.w102.phonePlaceholder}
                    className={`w-full px-3 py-2 text-xs bg-white border rounded-lg text-[#1C2928] placeholder-[#8E9E9B] focus:outline-none focus:ring-2 focus:ring-[#174B4A] focus:border-[#174B4A] ${
                      errors.phone ? 'border-[#DC2626]' : 'border-[#DCE2DD]'
                    }`}
                    aria-required="true"
                    aria-invalid={Boolean(errors.phone)}
                  />
                  {errors.phone && (
                    <p className="mt-1 text-xs text-[#DC2626]" role="alert">
                      {errors.phone}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 2: Linked Commercial POI */}
            <div>
              <div className="border-b border-[#E8ECE9] pb-2 mb-4">
                <h2 className="text-sm font-bold text-[#1C2928] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-[#174B4A]">
                    apartment
                  </span>
                  {hotelProviderEn.w102.formSectionPoi}
                </h2>
              </div>

              {isLoadingPois ? (
                <div className="p-4 text-center text-xs text-[#5B6E69]">
                  Loading commercial points of interest...
                </div>
              ) : (
                <SearchableMultiSelect
                  label={hotelProviderEn.w102.poiSelectionLabel}
                  required
                  pois={pois}
                  selectedIds={selectedPoiIds}
                  onChange={(ids) => {
                    setSelectedPoiIds(ids);
                    if (errors.pois) setErrors((prev) => ({ ...prev, pois: '' }));
                  }}
                  error={errors.pois}
                />
              )}

              <div className="mt-2.5 p-2.5 bg-[#FFF2EB] border border-[#FFD8C2] rounded-lg text-[11px] text-[#995436] flex items-start gap-2">
                <span className="material-symbols-outlined text-[16px] text-[#B96D4C] shrink-0 mt-0.5">
                  info
                </span>
                <span>{hotelProviderEn.w102.poiPolicyWarning}</span>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-between pt-4 border-t border-[#E8ECE9]">
              <span className="text-[11px] text-[#5B6E69]">
                {hotelProviderEn.common.mandatoryFieldNote}
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => router.push(ROUTES.admin.users)}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-[#5B6E69] hover:text-[#1C2928] hover:bg-[#F7F5EF] rounded-lg transition-colors cursor-pointer"
                >
                  {hotelProviderEn.w102.cancelButton}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#174B4A] hover:bg-[#103B39] rounded-lg transition-colors shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting && (
                    <span className="material-symbols-outlined text-[15px] animate-spin">
                      progress_activity
                    </span>
                  )}
                  <span>{hotelProviderEn.w102.submitButton}</span>
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Right Column (35% -> 4 cols of 12): Contextual Guidance */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-[#DCE2DD] rounded-xl p-5 shadow-xs">
            <h3 className="text-xs font-bold text-[#1C2928] uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-[#174B4A]">
                menu_book
              </span>
              {hotelProviderEn.w102.sidebarGuidanceTitle}
            </h3>

            <div className="space-y-3.5 divide-y divide-[#E8ECE9]">
              {hotelProviderEn.w102.sidebarGuidanceItems.map((item, idx) => (
                <div key={idx} className={idx > 0 ? 'pt-3' : ''}>
                  <h4 className="text-xs font-semibold text-[#1C2928] mb-1">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-[#5B6E69] leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Direct Security Notice Card */}
          <div className="bg-[#F7F5EF] border border-[#DCE2DD] rounded-xl p-4 text-xs text-[#5B6E69]">
            <div className="flex items-center gap-2 font-semibold text-[#1C2928] mb-1.5">
              <span className="material-symbols-outlined text-[16px] text-[#0E9F6E]">
                lock
              </span>
              No Plaintext Password Exposure
            </div>
            <p className="text-[11px] leading-relaxed">
              In accordance with SRS §3.9.1.5 and strict security governance, passwords are never entered or inspected by Staff. An automated cryptographically secure activation dispatch is delivered directly to the partner email.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
