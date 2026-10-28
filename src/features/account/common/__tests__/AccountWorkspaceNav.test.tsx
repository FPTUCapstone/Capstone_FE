import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';

import { AccountWorkspaceContext } from '../AccountWorkspaceContext';
import { AccountWorkspaceNav } from '../AccountWorkspaceNav';
import { accountCommonEn } from '../resources/en';

describe('AccountWorkspaceNav', () => {
  it('renders horizontal navigation tabs by default with accessible tablist role', () => {
    render(<AccountWorkspaceNav activeTab="profile" />);

    const nav = screen.getByRole('navigation', {
      name: accountCommonEn.navigation.workspaceNavAria,
    });
    expect(nav).toBeDefined();

    const tabs = screen.getAllByRole('tab');
    expect(tabs.length).toBe(4);

    const profileTab = screen.getByRole('tab', { name: new RegExp(accountCommonEn.navigation.tabs.profile, 'i') });
    expect(profileTab.getAttribute('aria-selected')).toBe('true');

    const tripsTab = screen.getByRole('tab', { name: new RegExp(accountCommonEn.navigation.tabs.trips, 'i') });
    expect(tripsTab.getAttribute('aria-selected')).toBe('false');
  });

  it('renders vertical sidebar variant with aria-orientation vertical', () => {
    render(<AccountWorkspaceNav activeTab="preferences" variant="sidebar" />);

    const tablist = screen.getByRole('tablist');
    expect(tablist.getAttribute('aria-orientation')).toBe('vertical');

    const prefTab = screen.getByRole('tab', { name: new RegExp(accountCommonEn.navigation.tabs.preferences, 'i') });
    expect(prefTab.getAttribute('aria-selected')).toBe('true');
    expect(prefTab.textContent).toContain('UC-09');
  });

  it('suppresses rendering when invoked inside shell without explicit variant to avoid duplicates', () => {
    const { container } = render(
      <AccountWorkspaceContext.Provider value={{ isInsideShell: true, activeTab: 'security' }}>
        <AccountWorkspaceNav activeTab="security" />
      </AccountWorkspaceContext.Provider>
    );

    expect(container.firstChild).toBeNull();
  });

  it('still renders sidebar variant when inside shell when explicitly requested', () => {
    render(
      <AccountWorkspaceContext.Provider value={{ isInsideShell: true, activeTab: 'trips' }}>
        <AccountWorkspaceNav activeTab="trips" variant="sidebar" />
      </AccountWorkspaceContext.Provider>
    );

    expect(screen.getByRole('tablist')).toBeDefined();
    const tripsTab = screen.getByRole('tab', { name: new RegExp(accountCommonEn.navigation.tabs.trips, 'i') });
    expect(tripsTab.getAttribute('aria-selected')).toBe('true');
  });
});
