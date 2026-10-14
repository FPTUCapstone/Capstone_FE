import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

import { emptyContent, type LandingContentState } from './landingContent';
import { LandingContentScreen } from './LandingContentScreen';
import { LandingContentError } from './landingContentService';

const UNAVAILABLE = 'TripMate is temporarily unable to process your request. Please check your connection and try again.';
const REQUIRED = 'This field is required.';
const SUCCESS = 'Operation completed successfully.';

function validContent() {
  const content = emptyContent();
  content.hero = {
    headline: 'Discover Central Vietnam',
    subHeadline: '',
    backgroundImage: null,
    ctaLabel: 'Explore',
    ctaTarget: '/tours',
  };
  return content;
}

function editableState(): LandingContentState {
  return {
    published: {
      versionId: 'v3',
      versionNumber: 3,
      publishedByName: 'Linh Admin',
      publishedAtUtc: '2026-10-01T18:00:00Z',
      content: validContent(),
    },
    draft: null,
    history: [],
  };
}

function headline() {
  return screen.getByLabelText('Headline') as HTMLInputElement;
}

function saveButton() {
  return screen.getByRole('button', { name: 'Save Draft' }) as HTMLButtonElement;
}

beforeEach(() => {
  vi.clearAllMocks();
  service.getApprovedTours.mockResolvedValue([]);
});

afterEach(() => cleanup());

describe('LandingContentScreen editing', () => {
  it('loads the published content into the editor with Save Draft disabled', async () => {
    service.getLandingContent.mockResolvedValue(editableState());
    render(<LandingContentScreen />);
    await screen.findByText('Version 3');
    expect(headline().value).toBe('Discover Central Vietnam');
    expect(saveButton().disabled).toBe(true);
  });

  it('prefers the existing draft over the published content', async () => {
    const draftContent = validContent();
    draftContent.hero.headline = 'Draft headline';
    service.getLandingContent.mockResolvedValue({ ...editableState(), draft: { baseVersion: 3, content: draftContent } });
    render(<LandingContentScreen />);
    await screen.findByText('Version 3');
    expect(headline().value).toBe('Draft headline');
  });

  it('shows the required message and keeps Save Draft disabled when a required field is blanked', async () => {
    service.getLandingContent.mockResolvedValue(editableState());
    render(<LandingContentScreen />);
    await screen.findByText('Version 3');
    fireEvent.change(headline(), { target: { value: '   ' } });
    expect(screen.getByText(REQUIRED)).toBeTruthy();
    expect(saveButton().disabled).toBe(true);
  });

  it('saves a valid edit once and reports success only after a valid response', async () => {
    service.getLandingContent.mockResolvedValue(editableState());
    let resolve!: (value: unknown) => void;
    service.saveDraft.mockReturnValue(new Promise((r) => (resolve = r)));
    render(<LandingContentScreen />);
    await screen.findByText('Version 3');
    fireEvent.change(headline(), { target: { value: 'New headline' } });
    expect(saveButton().disabled).toBe(false);
    fireEvent.click(saveButton());
    fireEvent.click(saveButton());
    expect(service.saveDraft).toHaveBeenCalledTimes(1);
    expect(service.saveDraft.mock.calls[0][0]).toBe(3);
    expect(service.saveDraft.mock.calls[0][1].hero.headline).toBe('New headline');
    expect(screen.queryByText(SUCCESS)).toBeNull();
    const saved = validContent();
    saved.hero.headline = 'New headline';
    resolve({ baseVersion: 3, content: saved });
    expect(await screen.findByText(SUCCESS)).toBeTruthy();
    expect(saveButton().disabled).toBe(true);
  });

  it('maps a 422 response onto the fields and does not report success', async () => {
    service.getLandingContent.mockResolvedValue(editableState());
    service.saveDraft.mockRejectedValue(new LandingContentError(422, undefined, { 'hero.ctaTarget': 'required' }));
    render(<LandingContentScreen />);
    await screen.findByText('Version 3');
    fireEvent.change(headline(), { target: { value: 'Another' } });
    fireEvent.click(saveButton());
    expect(await screen.findByText(REQUIRED)).toBeTruthy();
    expect(screen.getByLabelText('Call-to-action Target').getAttribute('aria-invalid')).toBe('true');
    expect(screen.queryByText(SUCCESS)).toBeNull();
  });

  it('does not report success when the save response is malformed (status 0)', async () => {
    service.getLandingContent.mockResolvedValue(editableState());
    service.saveDraft.mockRejectedValue(new LandingContentError(0));
    render(<LandingContentScreen />);
    await screen.findByText('Version 3');
    fireEvent.change(headline(), { target: { value: 'Another' } });
    fireEvent.click(saveButton());
    expect(await screen.findByText(UNAVAILABLE)).toBeTruthy();
    expect(screen.queryByText(SUCCESS)).toBeNull();
  });

  it('shows the draft in a preview without calling any write endpoint', async () => {
    service.getLandingContent.mockResolvedValue(editableState());
    render(<LandingContentScreen />);
    await screen.findByText('Version 3');
    fireEvent.change(headline(), { target: { value: 'Previewed headline' } });
    fireEvent.click(screen.getByRole('button', { name: 'Preview' }));
    expect(screen.getByRole('region', { name: 'Preview' }).textContent).toContain('Previewed headline');
    expect(service.saveDraft).not.toHaveBeenCalled();
    expect(service.publishDraft).not.toHaveBeenCalled();
  });

  it('lists only the approved tours returned by the service', async () => {
    service.getLandingContent.mockResolvedValue(editableState());
    service.getApprovedTours.mockResolvedValue([{ tourId: 't1', title: 'Hue heritage' }]);
    render(<LandingContentScreen />);
    expect(await screen.findByLabelText('Hue heritage')).toBeTruthy();
    expect(screen.getAllByRole('checkbox')).toHaveLength(1);
  });

  it('flags a selected tour that is no longer approved', async () => {
    const content = validContent();
    content.featuredTourIds = ['gone'];
    const loaded = editableState();
    loaded.published.content = content;
    service.getLandingContent.mockResolvedValue(loaded);
    service.getApprovedTours.mockResolvedValue([{ tourId: 't1', title: 'Hue heritage' }]);
    render(<LandingContentScreen />);
    await screen.findByLabelText('Hue heritage');
    fireEvent.change(headline(), { target: { value: 'Touch' } });
    expect(screen.getByText('This tour package is currently unavailable for booking.')).toBeTruthy();
    expect(saveButton().disabled).toBe(true);
  });

  it('keeps an error on the right destination after an earlier one is removed', async () => {
    const content = validContent();
    const image = { mediaId: 'm', url: '/m.png' };
    content.destinations = [
      { id: 'a', name: 'Hue', image, description: 'Old capital' },
      { id: 'b', name: '', image, description: 'Lanterns' },
    ];
    const loaded = editableState();
    loaded.published.content = content;
    service.getLandingContent.mockResolvedValue(loaded);
    render(<LandingContentScreen />);
    await screen.findByText('Version 3');
    fireEvent.change(headline(), { target: { value: 'Touch to reveal errors' } });
    expect(screen.getAllByText(REQUIRED)).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Remove destination 1' }));
    const nameInputs = screen.getAllByLabelText('Name') as HTMLInputElement[];
    expect(nameInputs).toHaveLength(1);
    expect(nameInputs[0].getAttribute('aria-invalid')).toBe('true');
    expect(nameInputs[0].value).toBe('');
  });

  it('shows a disabled empty editor next to the pending banner', async () => {
    service.getLandingContent.mockRejectedValue(new LandingContentError(503));
    render(<LandingContentScreen />);
    await screen.findByText('Backend integration pending');
    expect(headline().value).toBe('');
    expect(headline().disabled).toBe(true);
    expect(saveButton().disabled).toBe(true);
  });

  it('restores the saved content when Cancel is chosen', async () => {
    service.getLandingContent.mockResolvedValue(editableState());
    render(<LandingContentScreen />);
    await screen.findByText('Version 3');
    fireEvent.change(headline(), { target: { value: 'Changed' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(headline().value).toBe('Discover Central Vietnam');
    expect(saveButton().disabled).toBe(true);
  });
});
