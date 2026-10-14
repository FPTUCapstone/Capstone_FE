import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const router = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));

const service = vi.hoisted(() => ({
  getLandingContent: vi.fn(),
  getApprovedTours: vi.fn(),
  saveDraft: vi.fn(),
  publishDraft: vi.fn(),
  restoreVersion: vi.fn(),
  uploadImage: vi.fn(),
}));

vi.mock('./landingContentService', async () => {
  const actual = await vi.importActual<typeof import('./landingContentService')>('./landingContentService');
  return { ...actual, ...service };
});

import { emptyContent, type LandingContent, type LandingContentState } from './landingContent';
import { LandingContentScreen } from './LandingContentScreen';
import { LandingContentError } from './landingContentService';

function content(headline = 'Discover Central Vietnam', tourIds: string[] = []): LandingContent {
  const value = emptyContent();
  value.hero = { headline, subHeadline: '', backgroundImage: null, ctaLabel: 'Explore', ctaTarget: '/tours' };
  value.featuredTourIds = tourIds;
  return value;
}

function stateWith(tourIds: string[] = [], hasDraft = true): LandingContentState {
  return {
    published: {
      versionId: 'v3',
      versionNumber: 3,
      publishedByName: 'Linh Admin',
      publishedAtUtc: '2026-10-01T18:00:00Z',
      content: content(),
    },
    draft: hasDraft ? { baseVersion: 3, content: content('Draft headline', tourIds) } : null,
    history: [{ versionId: 'v2', versionNumber: 2, publishedByName: 'Khanh Staff', publishedAtUtc: '2026-09-20T03:00:00Z' }],
  };
}

const headline = () => screen.getByLabelText('Headline') as HTMLInputElement;
const saveButton = () => screen.getByRole('button', { name: 'Save Draft' }) as HTMLButtonElement;
const edit = (value: string) => fireEvent.change(headline(), { target: { value } });

beforeEach(() => {
  vi.resetAllMocks();
  service.getApprovedTours.mockResolvedValue([]);
});

afterEach(() => cleanup());

describe('retry and recovery', () => {
  it('offers Retry after a failed save and saves on retry', async () => {
    service.getLandingContent.mockResolvedValue(stateWith());
    service.saveDraft.mockRejectedValueOnce(new LandingContentError(503)).mockResolvedValueOnce({ baseVersion: 3, content: content('Edited') });
    render(<LandingContentScreen />);
    await screen.findByText('Version 3');
    edit('Edited');
    fireEvent.click(saveButton());
    fireEvent.click(await screen.findByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Operation completed successfully.')).toBeTruthy();
    expect(service.saveDraft).toHaveBeenCalledTimes(2);
  });

  it('offers Retry after a failed restore and restores the same version on retry', async () => {
    service.getLandingContent.mockResolvedValue(stateWith());
    service.restoreVersion.mockRejectedValueOnce(new LandingContentError(503)).mockResolvedValueOnce({ baseVersion: 3, content: content('Restored') });
    render(<LandingContentScreen />);
    await screen.findByText('Version 3');
    fireEvent.click(screen.getByRole('button', { name: 'Restore Previous Version 2' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Retry' }));
    await waitFor(() => expect(headline().value).toBe('Restored'));
    expect(service.restoreVersion).toHaveBeenNthCalledWith(2, 'v2');
  });

  it('announces the pending banner as a status and lets the user retry loading', async () => {
    service.getLandingContent.mockRejectedValueOnce(new LandingContentError(503)).mockResolvedValueOnce(stateWith());
    render(<LandingContentScreen />);
    const banner = (await screen.findByText('Backend integration pending')).closest('[role="status"]') as HTMLElement;
    expect(banner).not.toBeNull();
    fireEvent.click(within(banner).getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Version 3')).toBeTruthy();
    expect(service.getLandingContent).toHaveBeenCalledTimes(2);
  });
});

describe('tour verification gate', () => {
  it('blocks saving selected tours until the approved list has loaded', async () => {
    service.getLandingContent.mockResolvedValue(stateWith(['t1']));
    service.getApprovedTours.mockReturnValue(new Promise(() => {}));
    render(<LandingContentScreen />);
    await screen.findByText('Version 3');
    edit('Edited');
    expect(saveButton().disabled).toBe(true);
    expect(screen.getByText('Checking that the selected tours are still approved…')).toBeTruthy();
  });

  it('shows a failure with Retry and unblocks saving once the list loads', async () => {
    service.getLandingContent.mockResolvedValue(stateWith(['t1']));
    service.getApprovedTours
      .mockRejectedValueOnce(new Error('down'))
      .mockResolvedValueOnce([{ tourId: 't1', title: 'Hue heritage' }]);
    render(<LandingContentScreen />);
    await screen.findByText('Approved tours could not be loaded.');
    edit('Edited');
    expect(saveButton().disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Retry loading tours' }));
    await screen.findByLabelText('Hue heritage');
    await waitFor(() => expect(saveButton().disabled).toBe(false));
  });
});

describe('publish follow-through', () => {
  async function openPublishDialog() {
    fireEvent.click(screen.getByRole('button', { name: 'Publish' }));
    return screen.findByRole('dialog', { name: 'Publish landing page content' });
  }
  const newPublished = {
    versionId: 'v4',
    versionNumber: 4,
    publishedByName: 'Khanh Staff',
    publishedAtUtc: '2026-10-14T03:00:00Z',
    content: content('Draft headline'),
  };

  it('moves focus to the confirmation after a successful publish', async () => {
    service.getLandingContent.mockResolvedValue(stateWith());
    service.publishDraft.mockResolvedValue(newPublished);
    render(<LandingContentScreen />);
    await screen.findByText('Version 3');
    const dialog = await openPublishDialog();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Publish' }));
    const message = (await screen.findByText('The landing page content was published.')).closest('[tabindex="-1"]');
    expect(message).not.toBeNull();
    await waitFor(() => expect(document.activeElement).toBe(message));
  });

  it('sends one request when the confirm button is activated twice before React re-renders', async () => {
    service.getLandingContent.mockResolvedValue(stateWith());
    service.publishDraft.mockReturnValue(new Promise(() => {}));
    render(<LandingContentScreen />);
    await screen.findByText('Version 3');
    const dialog = await openPublishDialog();
    const confirm = within(dialog).getByRole('button', { name: 'Publish' });
    act(() => {
      confirm.click();
      confirm.click();
    });
    expect(service.publishDraft).toHaveBeenCalledTimes(1);
  });
});

describe('restore with unsaved edits', () => {
  it('asks first and restores only after confirmation', async () => {
    service.getLandingContent.mockResolvedValue(stateWith());
    service.restoreVersion.mockResolvedValue({ baseVersion: 3, content: content('Restored') });
    render(<LandingContentScreen />);
    await screen.findByText('Version 3');
    edit('Unsaved edit');
    fireEvent.click(screen.getByRole('button', { name: 'Restore Previous Version 2' }));
    const dialog = await screen.findByRole('dialog', { name: 'Restore this version?' });
    expect(service.restoreVersion).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Restore' }));
    await waitFor(() => expect(headline().value).toBe('Restored'));
    expect(service.restoreVersion).toHaveBeenCalledWith('v2');
  });

  it('keeps the unsaved edits when the user declines', async () => {
    service.getLandingContent.mockResolvedValue(stateWith());
    render(<LandingContentScreen />);
    await screen.findByText('Version 3');
    edit('Unsaved edit');
    fireEvent.click(screen.getByRole('button', { name: 'Restore Previous Version 2' }));
    const dialog = await screen.findByRole('dialog', { name: 'Restore this version?' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(service.restoreVersion).not.toHaveBeenCalled();
    expect(headline().value).toBe('Unsaved edit');
  });
});
