import { existsSync } from 'node:fs';
import path from 'node:path';

import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AdminDashboard } from './AdminDashboard';
import { adminDashboardEn } from './resources/en';

const VIETNAMESE = /[ăâđêôơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹĐ]/i;

function collectResourceStrings(value: unknown, into: Set<string>): Set<string> {
  if (typeof value === 'string') into.add(value);
  else if (Array.isArray(value)) value.forEach((item) => collectResourceStrings(item, into));
  else if (value && typeof value === 'object') Object.values(value).forEach((item) => collectResourceStrings(item, into));
  return into;
}

function visibleTextNodes(root: HTMLElement): string[] {
  const texts: string[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (node.parentElement?.closest('[aria-hidden="true"]')) continue;
    const text = node.textContent?.trim();
    if (text) texts.push(text);
  }
  return texts;
}

function routeFileExists(href: string): boolean {
  const relative = href.replace(/^\/admin/, '');
  const candidates = [
    path.join(process.cwd(), 'app', 'admin', '(console)', relative, 'page.tsx'),
    path.join(process.cwd(), 'app', href, 'page.tsx'),
  ];
  return candidates.some((candidate) => existsSync(candidate));
}

describe('AdminDashboard (Screen #5)', () => {
  it('renders no synthetic KPI, percentage, city, map or queue figures', () => {
    const { container } = render(<AdminDashboard />);
    const text = container.textContent ?? '';

    expect(text).not.toMatch(/\d/);
    for (const removed of ['2,450', '142', '412', '98.4%', 'Super Admin', 'Hà Nội', 'Đà Nẵng', 'TP.HCM']) {
      expect(text).not.toContain(removed);
    }
    expect(container.querySelector('[style*="background-image"]')).toBeNull();
  });

  it('renders English copy that comes from the resource file only', () => {
    const { container } = render(<AdminDashboard />);
    const resourceStrings = collectResourceStrings(adminDashboardEn, new Set());

    for (const text of visibleTextNodes(container)) {
      expect(resourceStrings.has(text), `"${text}" is not resource-backed`).toBe(true);
    }
    expect(container.textContent).not.toMatch(VIETNAMESE);
    expect(container.textContent).not.toMatch(/\b(MSG|BR)-?\d+/);
  });

  it('links only to modules whose route exists on this branch', () => {
    render(<AdminDashboard />);
    const links = screen.getAllByRole('link');

    expect(links.map((link) => link.getAttribute('href')).sort()).toEqual(
      ['/admin/audit-logs', '/admin/settings/algorithm-parameters'].sort(),
    );
    for (const link of links) {
      expect(routeFileExists(link.getAttribute('href') ?? '')).toBe(true);
    }
  });

  it('labels unavailable modules truthfully without links', () => {
    render(<AdminDashboard />);

    const expectations: Record<string, string> = {
      'Statistical Reports': adminDashboardEn.statusLabels.pendingIntegration,
      'Payout Settlement': adminDashboardEn.statusLabels.pendingIntegration,
      'Platform Revenue': adminDashboardEn.statusLabels.pendingSpecification,
      'Create Staff Account': adminDashboardEn.statusLabels.pendingSpecification,
      'System Configuration': adminDashboardEn.statusLabels.available,
      'Audit Logs': adminDashboardEn.statusLabels.available,
    };

    for (const [title, status] of Object.entries(expectations)) {
      const card = screen.getByRole('article', { name: title });
      expect(within(card).getByText(status)).toBeTruthy();
      if (status !== adminDashboardEn.statusLabels.available) {
        expect(within(card).queryByRole('link')).toBeNull();
      }
    }
  });

  it('keeps Platform Revenue separate from Statistical Reports', () => {
    render(<AdminDashboard />);
    const revenue = screen.getByRole('article', { name: 'Platform Revenue' });
    expect(within(revenue).getByText(/separate from Statistical Reports/)).toBeTruthy();
  });
});
