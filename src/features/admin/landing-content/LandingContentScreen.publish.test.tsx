import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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

const UNAVAILABLE = 'TripMate is temporarily unable to process your request. Please check your connection and try again.';
const REQUIRED = 'This field is required.';

function content(headline = 'Discover Central Vietnam'): LandingContent {
  const value = emptyContent();
  value.hero = { headline, subHeadline: '', backgroundImage: null, ctaLabel: 'Explore', ctaTarget: '/tours' };
  return value;
}

function withDraft(draftContent: LandingContent = content('Draft headline')): LandingContentState {
  return {
    published: {
      versionId: 'v3',
      versionNumber: 3,
      publishedByName: 'Linh Admin',
      publishedAtUtc: '2026-10-01T18:00:00Z',
      content: content(),
    },
    draft: { baseVersion: 3, content: draftContent },
    history: [{ versionId: 'v2', versionNumber: 2, publishedByName: 'Khanh Staff', publishedAtUtc: '2026-09-20T03:00:00Z' }],
  };
}

const newPublished = {
  versionId: 'v4',
  versionNumber: 4,
  publishedByName: 'Khanh Staff',
  publishedAtUtc: '2026-10-14T03:00:00Z',
  content: content('Draft headline'),
};

function publishButton() {
  return screen.getByRole('button', { name: 'Publish' }) as HTMLButtonElement;
}

async function openDialog() {
  fireEvent.click(publishButton());
  return screen.findByRole('dialog', { name: 'Publish landing page content' });
}

function confirmInDialog() {
  const dialog = screen.getByRole('dialog');
  const button = Array.from(dialog.querySelectorAll('button')).find((b) => b.textContent === 'Publish')!;
  fireEvent.click(button);
  return button as HTMLButtonElement;
}

beforeEach(() => {
  vi.clearAllMocks();
  service.getApprovedTours.mockResolvedValue([]);
});

afterEach(() => cleanup());

describe('LandingContentScreen publish', () => {
  it('disables Publish when there is no saved draft', async () => {
    const state = withDraft();
    state.draft = null;
    service.getLandingContent.mockResolvedValue(state);
    render(<LandingContentScreen />);
    await screen.findByText('Version 3');
    expect(publishButton().disabled).toBe(true);
  });

  it('disables Publish while the form has unsaved edits', async () => {
    service.getLandingContent.mockResolvedValue(withDraft());
    render(<LandingContentScreen />);
    await screen.findByText('Version 3');
    expect(publishButton().disabled).toBe(false);
    fireEvent.change(screen.getByLabelText('Headline'), { target: { value: 'Edited' } });
    expect(publishButton().disabled).toBe(true);
  });

  it('validates first: invalid content shows field errors and opens no dialog', async () => {
    service.getLandingContent.mockResolvedValue(withDraft(emptyContent()));
    render(<LandingContentScreen />);
    await screen.findByText('Version 3');
    fireEvent.click(publishButton());
    expect(screen.getAllByText(REQUIRED).length).toBeGreaterThan(0);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(service.publishDraft).not.toHaveBeenCalled();
  });

  it('sends no request until the dialog is confirmed, and Escape cancels', async () => {
    service.getLandingContent.mockResolvedValue(withDraft());
    render(<LandingContentScreen />);
    await screen.findByText('Version 3');
    const dialog = await openDialog();
    expect(service.publishDraft).not.toHaveBeenCalled();
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(service.publishDraft).not.toHaveBeenCalled();
  });

  it('publishes exactly once when the confirm button is clicked twice', async () => {
    service.getLandingContent.mockResolvedValue(withDraft());
    service.publishDraft.mockReturnValue(new Promise(() => {}));
    render(<LandingContentScreen />);
    await screen.findByText('Version 3');
    await openDialog();
    confirmInDialog();
    confirmInDialog();
    expect(service.publishDraft).toHaveBeenCalledTimes(1);
    expect(service.publishDraft).toHaveBeenCalledWith(3);
  });

  it('shows the new version and the published message only after a valid response', async () => {
    service.getLandingContent.mockResolvedValue(withDraft());
    let resolve!: (value: unknown) => void;
    service.publishDraft.mockReturnValue(new Promise((r) => (resolve = r)));
    render(<LandingContentScreen />);
    await screen.findByText('Version 3');
    await openDialog();
    confirmInDialog();
    expect(screen.queryByText('The landing page content was published.')).toBeNull();
    resolve(newPublished);
    expect(await screen.findByText('The landing page content was published.')).toBeTruthy();
    expect(screen.getByText('Version 4')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Restore Previous Version 3' })).toBeTruthy();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(publishButton().disabled).toBe(true);
  });

  it('keeps the previous version and offers Retry after a server failure', async () => {
    service.getLandingContent.mockResolvedValue(withDraft());
    service.publishDraft.mockRejectedValueOnce(new LandingContentError(503)).mockResolvedValueOnce(newPublished);
    render(<LandingContentScreen />);
    await screen.findByText('Version 3');
    await openDialog();
    confirmInDialog();
    expect(await screen.findByText(UNAVAILABLE)).toBeTruthy();
    expect(screen.getByText('Version 3')).toBeTruthy();
    expect(screen.queryByText('The landing page content was published.')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Version 4')).toBeTruthy();
    expect(service.publishDraft).toHaveBeenCalledTimes(2);
  });

  it('shows the conflict message on 409 and reloads on demand', async () => {
    service.getLandingContent.mockResolvedValue(withDraft());
    service.publishDraft.mockRejectedValue(new LandingContentError(409));
    render(<LandingContentScreen />);
    await screen.findByText('Version 3');
    await openDialog();
    confirmInDialog();
    expect(
      await screen.findByText('The landing page content changed since you opened it. Reload to continue.'),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Reload' }));
    await waitFor(() => expect(service.getLandingContent).toHaveBeenCalledTimes(2));
  });

  it('shows the unavailable-tour message from a 422 and does not report success', async () => {
    const draft = content('Draft headline');
    draft.featuredTourIds = ['t1'];
    service.getLandingContent.mockResolvedValue(withDraft(draft));
    service.getApprovedTours.mockResolvedValue([{ tourId: 't1', title: 'Hue heritage' }]);
    service.publishDraft.mockRejectedValue(
      new LandingContentError(422, undefined, { 'featuredTourIds.t1': 'tourUnavailable' }),
    );
    render(<LandingContentScreen />);
    await screen.findByLabelText('Hue heritage');
    await openDialog();
    confirmInDialog();
    expect(await screen.findByText('This tour package is currently unavailable for booking.')).toBeTruthy();
    expect(screen.queryByText('The landing page content was published.')).toBeNull();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('treats a restored version as the stored draft: Cancel keeps it and Publish uses its base version', async () => {
    service.getLandingContent.mockResolvedValue(withDraft());
    service.restoreVersion.mockResolvedValue({ baseVersion: 5, content: content('Restored headline') });
    service.publishDraft.mockResolvedValue(newPublished);
    render(<LandingContentScreen />);
    await screen.findByText('Version 3');
    fireEvent.click(screen.getByRole('button', { name: 'Restore Previous Version 2' }));
    await waitFor(() => expect((screen.getByLabelText('Headline') as HTMLInputElement).value).toBe('Restored headline'));
    expect(service.restoreVersion).toHaveBeenCalledWith('v2');
    expect((screen.getByRole('button', { name: 'Save Draft' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect((screen.getByLabelText('Headline') as HTMLInputElement).value).toBe('Restored headline');
    await openDialog();
    confirmInDialog();
    await screen.findByText('Version 4');
    expect(service.publishDraft).toHaveBeenCalledWith(5);
  });

  it('does not let Cancel or Escape dismiss a publish that is already in flight', async () => {
    service.getLandingContent.mockResolvedValue(withDraft());
    service.publishDraft.mockReturnValue(new Promise(() => {}));
    render(<LandingContentScreen />);
    await screen.findByText('Version 3');
    const dialog = await openDialog();
    confirmInDialog();
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(screen.getByRole('dialog')).toBeTruthy();
    const dialogCancel = within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' });
    expect((dialogCancel as HTMLButtonElement).disabled).toBe(true);
  });
});
