import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DEMO_PENDING_TOUR_POSTS } from './demo/demoTourModerationFixtures';
import { tourModerationEn } from './resources/en';
import { TOUR_QUEUE_PAGE_SIZE } from './services/tourModerationService';
import { TourReview } from './TourReview';
import { TourReviewQueue } from './TourReviewQueue';
import { formatDisplayDate, formatDisplayDateTime, formatDisplayTime, formatVnd } from './utils/format';

const navigation = vi.hoisted(() => ({
  params: new URLSearchParams(),
  push: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useSearchParams: () => navigation.params,
  useRouter: () => ({ push: navigation.push, replace: vi.fn(), back: vi.fn() }),
}));

const VIETNAMESE = /[ăâđêôơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹĐ]/i;
const FIRST_TOUR = DEMO_PENDING_TOUR_POSTS[0];

function setQuery(query: string) {
  navigation.params = new URLSearchParams(query);
}

function enableDemoBuild() {
  vi.stubEnv('NODE_ENV', 'development');
  vi.stubEnv('NEXT_PUBLIC_ENABLE_DEMO_FIXTURES', 'true');
}

function queueItems() {
  return within(screen.getByRole('list', { name: tourModerationEn.queue.listLabel })).getAllByRole('listitem');
}

beforeEach(() => {
  navigation.push.mockReset();
  setQuery('');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('Tour moderation production boundary (NO_BACKEND)', () => {
  it('renders no fixture rows in a production build even with ?demo=1', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_ENABLE_DEMO_FIXTURES', 'true');
    setQuery('demo=1');

    const { container } = render(<TourReviewQueue />);

    expect(screen.getByRole('status').textContent).toContain(tourModerationEn.pendingIntegration.queueBody);
    expect(screen.queryByRole('list', { name: tourModerationEn.queue.listLabel })).toBeNull();
    expect(screen.queryByRole('search')).toBeNull();
    expect(screen.queryByText(tourModerationEn.demoBanner.body)).toBeNull();
    for (const tour of DEMO_PENDING_TOUR_POSTS) {
      expect(container.textContent).not.toContain(tour.tourName);
    }
  });

  it('requires both the environment flag and the explicit demo parameter', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('NEXT_PUBLIC_ENABLE_DEMO_FIXTURES', 'false');
    setQuery('demo=1');
    const first = render(<TourReviewQueue />);
    expect(screen.getByText(tourModerationEn.pendingIntegration.title)).toBeTruthy();
    first.unmount();

    enableDemoBuild();
    setQuery('');
    render(<TourReviewQueue />);
    expect(screen.getByText(tourModerationEn.pendingIntegration.title)).toBeTruthy();
  });

  it('renders no fake detail and no decision actions in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_ENABLE_DEMO_FIXTURES', 'true');
    setQuery('demo=1');

    const { container } = render(<TourReview id={FIRST_TOUR.id} />);

    expect(screen.getByText(tourModerationEn.pendingIntegration.detailBody)).toBeTruthy();
    expect(container.textContent).not.toContain(FIRST_TOUR.tourName);
    expect(screen.queryByRole('button', { name: tourModerationEn.decision.approveButton })).toBeNull();
    expect(screen.queryByRole('button', { name: tourModerationEn.decision.rejectButton })).toBeNull();
    expect(container.textContent).not.toContain(tourModerationEn.decision.approvedResult);
    expect(container.textContent).not.toContain(tourModerationEn.decision.rejectedResult);
  });
});

describe('Pending Tour Posts list (Screen #13) in demo mode', () => {
  beforeEach(enableDemoBuild);

  it('shows 20 records per page with the total record count (CR-01)', () => {
    setQuery('demo=1');
    render(<TourReviewQueue />);

    expect(TOUR_QUEUE_PAGE_SIZE).toBe(20);
    expect(queueItems()).toHaveLength(20);
    expect(screen.getByText(tourModerationEn.queue.totalCount(DEMO_PENDING_TOUR_POSTS.length))).toBeTruthy();
    expect(screen.getByText(tourModerationEn.pagination.pageOf(1, 2))).toBeTruthy();
    expect(screen.getByRole('link', { name: tourModerationEn.pagination.next }).getAttribute('href')).toBe(
      '/admin/tours/reviews?demo=1&page=2',
    );
    expect(screen.getByText(tourModerationEn.demoBanner.body)).toBeTruthy();
  });

  it('serves the remaining records on page 2', () => {
    setQuery('demo=1&page=2');
    render(<TourReviewQueue />);
    expect(queueItems()).toHaveLength(DEMO_PENDING_TOUR_POSTS.length - 20);
  });

  it('applies the search only on explicit submit (CR-02)', () => {
    setQuery('demo=1');
    render(<TourReviewQueue />);

    const input = screen.getByRole('searchbox', { name: tourModerationEn.queue.searchLabel });
    fireEvent.change(input, { target: { value: 'Ba Na' } });
    expect(navigation.push).not.toHaveBeenCalled();
    expect(queueItems()).toHaveLength(20);

    fireEvent.click(screen.getByRole('button', { name: tourModerationEn.queue.searchButton }));
    expect(navigation.push).toHaveBeenCalledWith('/admin/tours/reviews?demo=1&q=Ba+Na');
  });

  it('renders the filtered result and preserves context in detail links', () => {
    setQuery('demo=1&q=Ba Na');
    render(<TourReviewQueue />);

    const items = queueItems();
    expect(items).toHaveLength(4);
    const detailLink = within(items[0]).getByRole('link');
    expect(detailLink.getAttribute('href')).toBe('/admin/tours/reviews/demo-tour-05?demo=1&q=Ba+Na');
  });

  it('shows an explicit empty-result state instead of an empty table', () => {
    setQuery('demo=1&q=no-such-tour');
    render(<TourReviewQueue />);

    expect(screen.getByText(tourModerationEn.queue.emptyTitle)).toBeTruthy();
    expect(screen.queryByRole('list', { name: tourModerationEn.queue.listLabel })).toBeNull();
  });

  it('resets the search through an explicit action', () => {
    setQuery('demo=1&q=Ba Na');
    render(<TourReviewQueue />);
    fireEvent.click(screen.getByRole('button', { name: tourModerationEn.queue.resetButton }));
    expect(navigation.push).toHaveBeenCalledWith('/admin/tours/reviews?demo=1');
  });
});

describe('Tour Content & Pricing Details (Screen #14) and rejection (Screen #15) in demo mode', () => {
  beforeEach(() => {
    enableDemoBuild();
    setQuery('demo=1&page=2&q=Hoi');
  });

  it('returns to the queue with the applied page and search', () => {
    render(<TourReview id={FIRST_TOUR.id} />);
    expect(screen.getByRole('link', { name: tourModerationEn.detail.backToQueue }).getAttribute('href')).toBe(
      '/admin/tours/reviews?demo=1&page=2&q=Hoi',
    );
  });

  it('renders five review criteria, all unchecked, and an empty reviewer note', () => {
    render(<TourReview id={FIRST_TOUR.id} />);

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(5);
    for (const label of Object.values(tourModerationEn.decision.criteria)) {
      expect((screen.getByRole('checkbox', { name: label }) as HTMLInputElement).checked).toBe(false);
    }
    expect((screen.getByLabelText(tourModerationEn.decision.noteLabel) as HTMLTextAreaElement).value).toBe('');
  });

  it('blocks approval until every criterion passes, then confirms through a dialog', () => {
    render(<TourReview id={FIRST_TOUR.id} />);
    const approve = screen.getByRole('button', { name: tourModerationEn.decision.approveButton });

    fireEvent.click(approve);
    expect(screen.getByRole('alert').textContent).toBe(tourModerationEn.decision.checklistIncomplete);
    expect(screen.queryByRole('dialog')).toBeNull();

    for (const label of Object.values(tourModerationEn.decision.criteria)) {
      fireEvent.click(screen.getByRole('checkbox', { name: label }));
    }
    fireEvent.click(approve);

    const dialog = screen.getByRole('dialog', { name: tourModerationEn.approveDialog.title });
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-describedby')).toBe('approve-tour-description');
    expect(screen.queryByText(tourModerationEn.decision.approvedResult)).toBeNull();
    expect(document.activeElement).toBe(within(dialog).getByRole('button', { name: tourModerationEn.approveDialog.cancel }));

    fireEvent.click(within(dialog).getByRole('button', { name: tourModerationEn.approveDialog.confirm }));
    const result = screen.getByRole('status');
    expect(result.textContent).toContain(tourModerationEn.decision.approvedResult);
    expect(result.textContent).toContain('Demo mode');
    expect(document.activeElement).toBe(result);
    expect((approve as HTMLButtonElement).disabled).toBe(true);
  });

  it('closes the approval dialog with Escape without recording a decision', () => {
    render(<TourReview id={FIRST_TOUR.id} />);
    for (const label of Object.values(tourModerationEn.decision.criteria)) {
      fireEvent.click(screen.getByRole('checkbox', { name: label }));
    }
    fireEvent.click(screen.getByRole('button', { name: tourModerationEn.decision.approveButton }));
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.queryByText(tourModerationEn.decision.approvedResult)).toBeNull();
  });

  it('requires a detailed reason and a confirmation before a demo rejection', () => {
    render(<TourReview id={FIRST_TOUR.id} />);
    fireEvent.click(screen.getByRole('button', { name: tourModerationEn.decision.rejectButton }));

    const reasonDialog = screen.getByRole('dialog', { name: tourModerationEn.rejectDialog.title });
    fireEvent.click(within(reasonDialog).getByRole('button', { name: tourModerationEn.rejectDialog.confirmRejection }));

    const reason = within(reasonDialog).getByLabelText(tourModerationEn.rejectDialog.reasonLabel);
    expect(within(reasonDialog).getByRole('alert').textContent).toBe(tourModerationEn.rejectDialog.reasonRequired);
    expect(reason.getAttribute('aria-invalid')).toBe('true');
    expect(reason.getAttribute('aria-describedby')).toContain('reject-tour-reason-error');

    fireEvent.change(within(reasonDialog).getByLabelText(tourModerationEn.rejectDialog.categoryLabel), {
      target: { value: 'pricing' },
    });
    fireEvent.change(reason, { target: { value: 'Price does not match the included services.' } });
    fireEvent.click(within(reasonDialog).getByRole('button', { name: tourModerationEn.rejectDialog.confirmRejection }));

    const confirmDialog = screen.getByRole('dialog', { name: tourModerationEn.rejectDialog.confirmTitle });
    expect(screen.queryByText(tourModerationEn.decision.rejectedResult)).toBeNull();
    fireEvent.click(within(confirmDialog).getByRole('button', { name: tourModerationEn.rejectDialog.confirmReject }));

    const result = screen.getByRole('status');
    expect(result.textContent).toContain(tourModerationEn.decision.rejectedResult);
    expect(result.textContent).toContain('Price does not match the included services.');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('describes the demo rejection consistently as local-only, never as delivered to the operator', () => {
    render(<TourReview id={FIRST_TOUR.id} />);
    fireEvent.click(screen.getByRole('button', { name: tourModerationEn.decision.rejectButton }));

    const reasonDialog = screen.getByRole('dialog', { name: 'Reject tour post' });
    const descriptionId = reasonDialog.getAttribute('aria-describedby') ?? '';
    expect(document.getElementById(descriptionId)?.textContent).toBe(
      'Provide a reason for this simulated rejection. No message will be sent to the operator.',
    );
    expect(within(reasonDialog).getByText('Required. This reason is recorded for this demo only.')).toBeTruthy();
    expect(document.body.textContent).not.toContain('The operator will see this reason');

    const reason = within(reasonDialog).getByLabelText('Detailed reason / revision notes');
    expect(reason.getAttribute('aria-describedby')).toBe('reject-tour-reason-hint');
    expect(document.getElementById('reject-tour-reason-hint')?.textContent).toBe(
      'Required. This reason is recorded for this demo only.',
    );

    fireEvent.change(reason, { target: { value: '   ' } });
    fireEvent.click(within(reasonDialog).getByRole('button', { name: 'Confirm Rejection' }));
    expect(within(reasonDialog).getByRole('alert').textContent).toBe('This field is required.');
    expect(reason.getAttribute('aria-invalid')).toBe('true');
    expect(screen.queryByRole('dialog', { name: 'Reject this tour post?' })).toBeNull();

    fireEvent.change(reason, { target: { value: 'Itinerary timing is not feasible.' } });
    fireEvent.click(within(reasonDialog).getByRole('button', { name: 'Confirm Rejection' }));

    const confirmDialog = screen.getByRole('dialog', { name: 'Reject this tour post?' });
    expect(confirmDialog.getAttribute('aria-modal')).toBe('true');
    expect(confirmDialog.textContent).toContain(
      'In Demo mode the rejection is simulated in this browser only. Nothing is stored and the operator is not notified.',
    );
    fireEvent.click(within(confirmDialog).getByRole('button', { name: 'Reject tour post' }));

    const result = screen.getByRole('status');
    expect(result.textContent).toContain(
      'Tour rejected in Demo mode. No changes were sent to the server and no notification was delivered.',
    );
    expect(result.textContent).toContain('Reason (demo only)');
    expect(result.textContent).toContain('Itinerary timing is not feasible.');
    expect(document.body.textContent).not.toMatch(/operator will see|has been notified|notification sent|rejection saved/i);
  });

  it('discards the demo rejection reason when the dialog is closed with Escape', () => {
    render(<TourReview id={FIRST_TOUR.id} />);
    fireEvent.click(screen.getByRole('button', { name: tourModerationEn.decision.rejectButton }));
    fireEvent.change(screen.getByLabelText('Detailed reason / revision notes'), {
      target: { value: 'Missing images.' },
    });
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.queryByRole('status')).toBeNull();
    expect(document.body.textContent).not.toContain('Missing images.');
  });

  it('formats dates in Asia/Ho_Chi_Minh and money in whole VND', () => {
    render(<TourReview id={FIRST_TOUR.id} />);
    expect(screen.getByText(formatVnd(FIRST_TOUR.priceVnd))).toBeTruthy();
    expect(screen.getByText(formatDisplayDate(FIRST_TOUR.departureAtUtc))).toBeTruthy();
  });

  it('renders no Vietnamese text and no raw message or rule identifiers', () => {
    const { container } = render(<TourReview id={FIRST_TOUR.id} />);
    expect(container.textContent).not.toMatch(VIETNAMESE);
    expect(container.textContent).not.toMatch(/\b(MSG|BR)-?\d+/);
  });
});

describe('CR-07 and CR-08 formatting', () => {
  it('formats UTC timestamps as dd/MM/yyyy HH:mm in Asia/Ho_Chi_Minh', () => {
    expect(formatDisplayDateTime('2026-10-01T17:05:00.000Z')).toBe('02/10/2026 00:05');
    expect(formatDisplayDate('2026-10-01T17:05:00.000Z')).toBe('02/10/2026');
    expect(formatDisplayTime('2026-10-01T13:30:00.000Z')).toBe('20:30');
  });

  it('formats money as whole dong with a thousands separator', () => {
    expect(formatVnd(1450000)).toBe('1,450,000 VND');
    expect(formatVnd(1234.6)).toBe('1,235 VND');
  });
});

describe('CR-09 and accessibility source checks', () => {
  const featureRoot = path.join(process.cwd(), 'src', 'features', 'admin', 'tour-reviews');
  const dashboardRoot = path.join(process.cwd(), 'src', 'features', 'admin', 'dashboard');

  function sourceFiles(root: string): string[] {
    return readdirSync(root).flatMap((entry) => {
      const full = path.join(root, entry);
      if (statSync(full).isDirectory()) return entry === 'demo' ? [] : sourceFiles(full);
      return /\.tsx$/.test(entry) && !entry.includes('.test.') ? [full] : [];
    });
  }

  const components = [...sourceFiles(featureRoot), ...sourceFiles(dashboardRoot)];

  it('keeps user-facing component text in resource files', () => {
    expect(components.length).toBeGreaterThan(0);
    for (const file of components) {
      // Material Symbols ligatures inside aria-hidden icons are not rendered text.
      const source = readFileSync(file, 'utf8').replace(/aria-hidden="true">\s*[a-z_]+\s*</g, '><');
      const jsxText = source.match(/>\s*[A-Za-z][^<>{}]*</g) ?? [];
      const literalAttributes =
        source.match(/\b(aria-label|placeholder|title|alt)="[^"]*[A-Za-z][^"]*"/g) ?? [];
      expect(jsxText, `${file} has hard-coded JSX text`).toEqual([]);
      expect(literalAttributes, `${file} has hard-coded attributes`).toEqual([]);
      expect(source, `${file} contains Vietnamese text`).not.toMatch(VIETNAMESE);
    }
  });

  it('never removes keyboard focus visibility', () => {
    for (const file of components) {
      const source = readFileSync(file, 'utf8');
      expect(source).not.toMatch(/outline-none|focus:ring-0/);
    }
  });

  it('keeps resources free of Vietnamese and raw message or rule identifiers', () => {
    const resources = readFileSync(path.join(featureRoot, 'resources', 'en.ts'), 'utf8');
    const dashboardResources = readFileSync(path.join(dashboardRoot, 'resources', 'en.ts'), 'utf8');
    for (const source of [resources, dashboardResources]) {
      expect(source).not.toMatch(VIETNAMESE);
      expect(source).not.toMatch(/\b(MSG|BR)-?\d+/);
    }
  });
});
