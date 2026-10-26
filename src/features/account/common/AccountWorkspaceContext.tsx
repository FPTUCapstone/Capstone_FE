'use client';

import { createContext, useContext } from 'react';
import type { AccountTabKey } from './AccountWorkspaceNav';

export interface AccountWorkspaceContextValue {
  isInsideShell: boolean;
  activeTab: AccountTabKey;
}

export const AccountWorkspaceContext = createContext<AccountWorkspaceContextValue>({
  isInsideShell: false,
  activeTab: 'profile',
});

export function useAccountWorkspace() {
  return useContext(AccountWorkspaceContext);
}
