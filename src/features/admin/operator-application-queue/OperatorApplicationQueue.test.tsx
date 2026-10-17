import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DEMO_PENDING_OPERATOR_APPLICATIONS } from './demo/demoOperatorApplicationFixtures';
import { OperatorApplicationQueue } from './OperatorApplicationQueue';
import { operatorApplicationQueueEn } from './resources/en';
import { formatSubmittedAt } from './utils/format';

const navigation = vi.hoisted(() => ({
  params: new URLSearchParams(),
  push: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useSearchParams: () => navigation.params,
  useRouter: () => ({ push: navigation.push, replace: vi.fn(), back: vi.fn() }),
}));

const copy = operatorApplicationQueueEn.queue;
const VIETNAMESE = /[ăâđêôơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹĐ]/i;
const FIRST = DEMO_PENDING_OPERATOR_APPLICATIONS[0];
const NO_DATE = DEMO_PENDING_OPERATOR_APPLICATIONS.find((item) => item.submittedAtUtc === null)!;

function setQuery(query: string) {
  navigation.params = new URLSearchParams(query);
}

function enableDemoBuild() {
  vi.stubEnv('NODE_ENV', 'development');
  vi.stubEnv('NEXT_PUBLIC_ENABLE_DEMO_FIXTURES', 'true');
}

function rows() {
  return within(screen.getByRole('list', { name: copy.listLabel })).getAllByRole('listitem');
}

beforeEach(() => {
  navigation.push.mockReset();
  setQuery('');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('Pending operator applications production boundary (NO_BACKEND)', () => {
  it('renders no fixture rows in a production build even with ?demo=1', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_ENABLE_DEMO_FIXTURES', 'true');
    setQuery('demo=1');

    render(<OperatorApplicationQueue />);

    expect(screen.getByRole('status').textContent).toContain(operatorApplicationQueueEn.pendingIntegration.body);
    expect(screen.queryByRole('list', { name: copy.listLabel })).toBeNull();
    expect(screen.queryByRole('search')).toBeNull();
    expect(screen.queryByText(FIRST.companyName)).toBeNull();
  });

  it('renders no fixture rows without the demo flag', () => {
    enableDemoBuild();

    render(<OperatorApplicationQueue />);

    expect(screen.getByRole('status')).toBeTruthy();
    expect(screen.queryByText(FIRST.companyName)).toBeNull();
  });
});

describe('Pending operator applications demo list', () => {
  beforeEach(() => {
    enableDemoBuild();
    setQuery('demo=1');
  });

  it('shows the demo banner, the total and 20 rows with accessible labels', () => {
    render(<OperatorApplicationQueue />);

    expect(screen.getByLabelText(operatorApplicationQueueEn.demoBanner.label)).toBeTruthy();
    expect(screen.getByText(copy.totalCount(DEMO_PENDING_OPERATOR_APPLICATIONS.length))).toBeTruthy();
    expect(rows()).toHaveLength(20);
    expect(screen.getByRole('heading', { level: 1, name: copy.title })).toBeTruthy();
  });

  it('links every row to the Screen #11 detail route for that application', () => {
    render(<OperatorApplicationQueue />);

    const link = screen.getByRole('link', { name: copy.reviewApplicationFor(FIRST.companyName) });
    expect(link.getAttribute('href')).toBe(`/admin/tour-operator-applications/${FIRST.userId}`);
  });

  it('shows the formatted submission date, and "Not available" when the contract has none', () => {
    render(<OperatorApplicationQueue />);

    const dated = rows().find((row) => row.textContent?.includes(FIRST.companyName))!;
    expect(dated.textContent).toContain(formatSubmittedAt(FIRST.submittedAtUtc));
    const undated = rows().find((row) => row.textContent?.includes(NO_DATE.companyName))!;
    expect(undated.textContent).toContain(operatorApplicationQueueEn.format.unavailable);
  });

  it('applies the keyword only on submit and returns to page 1', () => {
    setQuery('demo=1&page=2');
    render(<OperatorApplicationQueue />);

    fireEvent.change(screen.getByLabelText(copy.searchLabel), { target: { value: ' Hoi An ' } });
    expect(navigation.push).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: copy.searchButton }));
    expect(navigation.push).toHaveBeenCalledWith('/admin/tour-operator-applications?demo=1&q=Hoi+An');
  });

  it('resets the search to the bare demo list', () => {
    setQuery('demo=1&q=Hoi');
    render(<OperatorApplicationQueue />);

    fireEvent.click(screen.getByRole('button', { name: copy.resetButton }));
    expect(navigation.push).toHaveBeenCalledWith('/admin/tour-operator-applications?demo=1');
  });

  it('paginates with links that keep the demo flag and the keyword', () => {
    render(<OperatorApplicationQueue />);

    const nav = screen.getByRole('navigation', { name: operatorApplicationQueueEn.pagination.label });
    expect(within(nav).getByText(operatorApplicationQueueEn.pagination.previous).getAttribute('aria-disabled')).toBe('true');
    expect(within(nav).getByRole('link', { name: operatorApplicationQueueEn.pagination.next }).getAttribute('href')).toBe(
      '/admin/tour-operator-applications?demo=1&page=2',
    );
  });

  it('shows the remaining rows and an active previous link on page 2', () => {
    setQuery('demo=1&page=2');
    render(<OperatorApplicationQueue />);

    expect(rows()).toHaveLength(DEMO_PENDING_OPERATOR_APPLICATIONS.length - 20);
    const nav = screen.getByRole('navigation', { name: operatorApplicationQueueEn.pagination.label });
    expect(within(nav).getByRole('link', { name: operatorApplicationQueueEn.pagination.previous }).getAttribute('href')).toBe(
      '/admin/tour-operator-applications?demo=1',
    );
    expect(within(nav).getByText(operatorApplicationQueueEn.pagination.next).getAttribute('aria-disabled')).toBe('true');
  });

  it('shows an empty state, keeps the search form and hides pagination when nothing matches', () => {
    setQuery('demo=1&q=zzz-no-match');
    render(<OperatorApplicationQueue />);

    // CR-02: every list that has no domain-specific empty message uses MSG128, worded exactly as in the SRS.
    expect(screen.getByRole('status').textContent).toContain('No records found matching your criteria.');
    expect(copy.emptyTitle).toBe('No records found matching your criteria.');
    expect(screen.getByRole('search')).toBeTruthy();
    expect(screen.queryByRole('navigation', { name: operatorApplicationQueueEn.pagination.label })).toBeNull();
  });

  it('renders English only', () => {
    const { container } = render(<OperatorApplicationQueue />);
    expect(container.textContent).not.toMatch(VIETNAMESE);
  });
});
