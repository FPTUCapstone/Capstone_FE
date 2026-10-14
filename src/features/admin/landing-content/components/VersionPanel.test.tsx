import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { LandingContentState } from '../landingContent';
import { emptyContent } from '../landingContent';
import { formatVersionDate, VersionPanel } from './VersionPanel';

const published: LandingContentState['published'] = {
  versionId: 'v3',
  versionNumber: 3,
  publishedByName: 'Linh Admin',
  publishedAtUtc: '2026-10-01T18:00:00Z',
  content: emptyContent(),
};
const history = [
  { versionId: 'v2', versionNumber: 2, publishedByName: 'Khanh Staff', publishedAtUtc: '2026-09-20T03:00:00Z' },
  { versionId: 'v1', versionNumber: 1, publishedByName: 'Linh Admin', publishedAtUtc: '2026-09-01T03:00:00Z' },
];

describe('formatVersionDate', () => {
  it('formats a UTC instant as dd/MM/yyyy in Asia/Ho_Chi_Minh', () => {
    // 18:00 UTC on 1 Oct is already 2 Oct in Vietnam (UTC+7).
    expect(formatVersionDate('2026-10-01T18:00:00Z')).toContain('02/10/2026');
  });
});

describe('VersionPanel', () => {
  it('shows the published version, publisher and local publication date', () => {
    render(<VersionPanel published={published} history={history} onRestore={() => {}} disabled={false} />);
    expect(screen.getByText('Version 3')).toBeTruthy();
    expect(screen.getAllByText(/Linh Admin/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/02\/10\/2026/).length).toBeGreaterThan(0);
  });

  it('lists each history version with a restore button that reports its id', () => {
    const onRestore = vi.fn();
    render(<VersionPanel published={published} history={history} onRestore={onRestore} disabled={false} />);
    fireEvent.click(screen.getByRole('button', { name: 'Restore Previous Version 2' }));
    expect(onRestore).toHaveBeenCalledWith('v2');
    expect(screen.getAllByRole('button', { name: /Restore Previous Version/ })).toHaveLength(2);
  });

  it('disables every restore button while busy', () => {
    render(<VersionPanel published={published} history={history} onRestore={() => {}} disabled />);
    for (const button of screen.getAllByRole('button', { name: /Restore Previous Version/ })) {
      expect((button as HTMLButtonElement).disabled).toBe(true);
    }
  });

  it('says so when there is no earlier version', () => {
    render(<VersionPanel published={published} history={[]} onRestore={() => {}} disabled={false} />);
    expect(screen.getByText('No earlier versions.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Restore Previous Version/ })).toBeNull();
  });
});
