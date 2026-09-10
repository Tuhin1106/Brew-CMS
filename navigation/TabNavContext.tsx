import { createContext, useContext } from 'react';

export type MainTabName = 'Dashboard' | 'Floor' | 'POS' | 'Kitchen' | 'Reports';

export type NavOptions = {
  floorFilter?: 'ALL' | 'AVAILABLE' | 'OCCUPIED' | 'NEEDS_CLEANING';
  kitchenFilter?: 'ACTIVE' | 'READY' | 'HISTORY' | 'OPEN';
  reportsRange?: 'TODAY' | 'YESTERDAY' | 'LAST_7' | 'THIS_MONTH' | 'ALL';
  reportsFocus?: 'bills';
  posAction?: 'settle';
};

type TabNavContextValue = {
  activeTab: MainTabName;
  navOptions: NavOptions | null;
  navigate: (tab: MainTabName, options?: NavOptions) => void;
};

export const TabNavContext = createContext<TabNavContextValue>({
  activeTab: 'Dashboard',
  navOptions: null,
  navigate: () => {},
});

export function useTabNav() {
  return useContext(TabNavContext);
}
