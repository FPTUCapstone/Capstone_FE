import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { preferenceMessages } from '../resources/messages';
import { TravelPreferencesForm } from '../TravelPreferencesForm';
import * as api from '../travelPreferencesApi';
import {
  EMPTY_PREFERENCES,
  PREFERENCE_ERROR_CODES,
  type TravelPreferenceOptions,
  type TravelPreferences,
} from '../travelPreferencesTypes';

vi.mock('../travelPreferencesApi', () => ({
  updateTravelPreferences: vi.fn(),
}));

const options: TravelPreferenceOptions = {
  interests: [
    { key: 'Beach', source: 'Category' },
    { key: 'Culture', source: 'Category' },
    { key: 'street food', source: 'Tag' },
  ],
  preferredTransportModes: ['Walking', 'Motorbike', 'Car', 'PublicTransit'],
  travelPaces: ['Relaxed', 'Moderate', 'Fast'],
  foodPreferences: ['NoRestriction', 'Vegetarian', 'Vegan', 'Halal', 'NoSeafood'],
  riskTolerances: ['Low', 'Medium', 'High'],
};

const saved: TravelPreferences = {
  interests: ['Beach'],
  preferredTransportMode: 'Motorbike',
  travelPace: null,
  riskTolerance: null,
  foodPreferences: [],
  updatedAtUtc: '2026-10-13T06:00:00Z',
};

function renderForm(initial: TravelPreferences = EMPTY_PREFERENCES, extra: Partial<Parameters<typeof TravelPreferencesForm>[0]> = {}) {
  return render(<TravelPreferencesForm options={options} initialPreferences={initial} {...extra} />);
}

const saveButton = () => screen.getByRole('button', { name: /Lưu sở thích/ });

describe('TravelPreferencesForm', () => {
  beforeEach(() => {
    vi.mocked(api.updateTravelPreferences).mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders exactly the five UC-09 dimensions with labels from the resource file', () => {
    renderForm();

    expect(screen.getByRole('group', { name: /Sở thích trải nghiệm/ })).toBeDefined();
    expect(screen.getByRole('group', { name: /Phương tiện ưa chuộng/ })).toBeDefined();
    expect(screen.getByRole('group', { name: /Nhịp độ tham quan/ })).toBeDefined();
    expect(screen.getByRole('group', { name: /Chế độ ăn uống/ })).toBeDefined();
    expect(screen.getByRole('group', { name: /Mức chấp nhận rủi ro/ })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Beach' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'street food' })).toBeDefined();
    expect(screen.queryByText(/Phong cách chuyến đi/)).toBeNull();
    expect(screen.queryByText(/Tự động áp dụng/)).toBeNull();
  });

  it('pre-selects nothing when the server returned no preferences', () => {
    renderForm();

    expect(screen.queryAllByRole('button', { pressed: true })).toHaveLength(0);
  });

  it('shows saved values as selected', () => {
    renderForm(saved);

    expect(screen.getByRole('button', { name: 'Beach' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'Motorbike' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('saves the complete empty state and shows MSG21 only after 200', async () => {
    vi.mocked(api.updateTravelPreferences).mockResolvedValue({ ok: true, data: EMPTY_PREFERENCES });
    renderForm();

    fireEvent.click(saveButton());

    await waitFor(() => expect(screen.getByText(preferenceMessages.locked.MSG21)).toBeDefined());
    expect(api.updateTravelPreferences).toHaveBeenCalledWith({
      interests: [],
      preferredTransportMode: null,
      travelPace: null,
      riskTolerance: null,
      foodPreferences: [],
    });
  });

  it('sends selected keys (not labels) and toggles single selections off', async () => {
    vi.mocked(api.updateTravelPreferences).mockResolvedValue({ ok: true, data: saved });
    renderForm();

    fireEvent.click(screen.getByRole('button', { name: 'Beach' }));
    fireEvent.click(screen.getByRole('button', { name: 'Car / Taxi' }));
    fireEvent.click(screen.getByRole('button', { name: 'Fast' }));
    fireEvent.click(screen.getByRole('button', { name: 'Fast' }));
    fireEvent.click(saveButton());

    await waitFor(() => expect(api.updateTravelPreferences).toHaveBeenCalled());
    expect(vi.mocked(api.updateTravelPreferences).mock.calls[0][0]).toMatchObject({
      interests: ['Beach'],
      preferredTransportMode: 'Car',
      travelPace: null,
    });
  });

  it('keeps NoRestriction exclusive in the food selection', async () => {
    vi.mocked(api.updateTravelPreferences).mockResolvedValue({ ok: true, data: saved });
    renderForm();

    fireEvent.click(screen.getByRole('button', { name: 'Vegan' }));
    fireEvent.click(screen.getByRole('button', { name: 'No restriction' }));
    expect(screen.getByRole('button', { name: 'Vegan' }).getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(screen.getByRole('button', { name: 'Halal' }));
    expect(screen.getByRole('button', { name: 'No restriction' }).getAttribute('aria-pressed')).toBe('false');

    fireEvent.click(saveButton());
    await waitFor(() => expect(api.updateTravelPreferences).toHaveBeenCalled());
    expect(vi.mocked(api.updateTravelPreferences).mock.calls[0][0].foodPreferences).toEqual(['Halal']);
  });

  it('blocks an 11th interest with the catalog message', () => {
    const many: TravelPreferenceOptions = {
      ...options,
      interests: Array.from({ length: 11 }, (_, index) => ({ key: `Interest ${index}`, source: 'Tag' as const })),
    };
    render(<TravelPreferencesForm options={many} initialPreferences={EMPTY_PREFERENCES} />);

    for (let index = 0; index < 11; index += 1) {
      fireEvent.click(screen.getByRole('button', { name: `Interest ${index}` }));
    }

    expect(screen.getByText(preferenceMessages.catalog.errors[PREFERENCE_ERROR_CODES.tooManyInterests])).toBeDefined();
    expect(screen.getByRole('button', { name: 'Interest 10' }).getAttribute('aria-pressed')).toBe('false');
  });

  it('shows backend field errors under the field and keeps the selection', async () => {
    vi.mocked(api.updateTravelPreferences).mockResolvedValue({
      ok: false,
      kind: 'validation',
      fieldErrors: { interests: PREFERENCE_ERROR_CODES.invalidOption },
    });
    renderForm();

    fireEvent.click(screen.getByRole('button', { name: 'Culture' }));
    fireEvent.click(saveButton());

    expect(
      await screen.findByText(preferenceMessages.catalog.errors[PREFERENCE_ERROR_CODES.invalidOption]),
    ).toBeDefined();
    expect(screen.getByRole('button', { name: 'Culture' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.queryByText(preferenceMessages.locked.MSG21)).toBeNull();
  });

  it('uses the catalog fallback for a 400 without a known field', async () => {
    vi.mocked(api.updateTravelPreferences).mockResolvedValue({ ok: false, kind: 'validation', fieldErrors: {} });
    renderForm();

    fireEvent.click(saveButton());

    expect(await screen.findByText(preferenceMessages.catalog.unknownField)).toBeDefined();
  });

  it('shows MSG127 on failure and never claims success', async () => {
    vi.mocked(api.updateTravelPreferences).mockResolvedValue({ ok: false, kind: 'failure' });
    renderForm();

    fireEvent.click(saveButton());

    expect(await screen.findByText(preferenceMessages.locked.MSG127)).toBeDefined();
    expect(screen.queryByText(preferenceMessages.locked.MSG21)).toBeNull();
  });

  it('reports 401/403 to the page', async () => {
    const onAccessProblem = vi.fn();
    vi.mocked(api.updateTravelPreferences).mockResolvedValue({ ok: false, kind: 'sessionExpired' });
    renderForm(EMPTY_PREFERENCES, { onAccessProblem });

    fireEvent.click(saveButton());

    await waitFor(() => expect(onAccessProblem).toHaveBeenCalledWith('sessionExpired'));
  });

  it('prevents a duplicate submit while the request is pending', async () => {
    let resolve: (value: Awaited<ReturnType<typeof api.updateTravelPreferences>>) => void = () => {};
    vi.mocked(api.updateTravelPreferences).mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    renderForm();

    fireEvent.click(saveButton());
    fireEvent.click(saveButton());

    expect(api.updateTravelPreferences).toHaveBeenCalledTimes(1);
    resolve({ ok: true, data: EMPTY_PREFERENCES });
    await waitFor(() => expect(screen.getByText(preferenceMessages.locked.MSG21)).toBeDefined());
  });

  it('clears all values only after confirmation and sends nothing until Save', async () => {
    vi.mocked(api.updateTravelPreferences).mockResolvedValue({ ok: true, data: EMPTY_PREFERENCES });
    renderForm(saved);

    fireEvent.click(screen.getByRole('button', { name: /Xóa tất cả sở thích/ }));
    expect(screen.getByText(preferenceMessages.catalog.clearConfirm)).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận xóa' }));

    expect(screen.getByRole('button', { name: 'Beach' }).getAttribute('aria-pressed')).toBe('false');
    expect(api.updateTravelPreferences).not.toHaveBeenCalled();

    fireEvent.click(saveButton());
    await waitFor(() => expect(api.updateTravelPreferences).toHaveBeenCalled());
    expect(vi.mocked(api.updateTravelPreferences).mock.calls[0][0].interests).toEqual([]);
  });

  it('asks MSG23 before following a link with unsaved changes', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(
      <>
        <a href="/account/profile">Hồ sơ</a>
        <TravelPreferencesForm options={options} initialPreferences={EMPTY_PREFERENCES} />
      </>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Beach' }));
    const allowed = fireEvent.click(screen.getByRole('link', { name: 'Hồ sơ' }));

    expect(confirmSpy).toHaveBeenCalledWith(preferenceMessages.locked.MSG23);
    expect(allowed).toBe(false);
  });

  it('does not ask MSG23 when nothing changed', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(
      <>
        <a href="#profile">Hồ sơ</a>
        <TravelPreferencesForm options={options} initialPreferences={saved} />
      </>,
    );

    fireEvent.click(screen.getByRole('link', { name: 'Hồ sơ' }));

    expect(confirmSpy).not.toHaveBeenCalled();
  });

  it('shows the empty-catalogue hint and keeps the rest usable', () => {
    render(<TravelPreferencesForm options={{ ...options, interests: [] }} initialPreferences={EMPTY_PREFERENCES} />);

    expect(screen.getByText(preferenceMessages.catalog.emptyInterests)).toBeDefined();
    expect(screen.getByRole('button', { name: 'Walking' })).toBeDefined();
  });
});
