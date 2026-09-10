import { useState, type ComponentType } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  Armchair,
  BarChart3,
  ChefHat,
  LayoutDashboard,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react-native';

import AppHeader from '../components/AppHeader';
import NoticeDialog from '../components/NoticeDialog';
import { canAccessSection, homeSection } from '../constants/roles';
import { colors, spacing, touchTarget } from '../constants/theme';
import { useAppInsets } from '../hooks/useAppInsets';
import { TabNavContext, type MainTabName, type NavOptions } from './TabNavContext';
import DashboardScreen from '../screens/DashboardScreen';
import KDSScreen from '../screens/KDSScreen';
import POSScreen from '../screens/POSScreen';
import ReportsScreen from '../screens/ReportsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import TablesScreen from '../screens/TablesScreen';
import { useCafeStore } from '../store/useCafeStore';

const TABS: { name: MainTabName; label: string; icon: LucideIcon }[] = [
  { name: 'Dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { name: 'Floor', label: 'Floor', icon: Armchair },
  { name: 'POS', label: 'Food', icon: UtensilsCrossed },
  { name: 'Kitchen', label: 'Kitchen', icon: ChefHat },
  { name: 'Reports', label: 'Reports', icon: BarChart3 },
];

const SCREENS: Record<MainTabName, ComponentType> = {
  Dashboard: DashboardScreen,
  Floor: TablesScreen,
  POS: POSScreen,
  Kitchen: KDSScreen,
  Reports: ReportsScreen,
};

export default function RootNavigator() {
  const insets = useAppInsets();
  const role = useCafeStore((state) => state.currentUser?.role);
  const [activeTab, setActiveTab] = useState<MainTabName>(homeSection(role));
  const [navOptions, setNavOptions] = useState<NavOptions | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [deniedOpen, setDeniedOpen] = useState(false);
  const Screen = SCREENS[activeTab];

  const selectTab = (tab: MainTabName, options?: NavOptions) => {
    if (!canAccessSection(role, tab)) {
      setDeniedOpen(true);
      return;
    }
    setNavOptions(options ?? null);
    setActiveTab(tab);
  };

  return (
    <TabNavContext.Provider value={{ activeTab, navOptions, navigate: selectTab }}>
      <View style={styles.shell}>
        <AppHeader onOpenSettings={() => setSettingsOpen(true)} />
        <View style={styles.scene}>
          <Screen />
        </View>
        <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
          {TABS.filter((tab) => canAccessSection(role, tab.name)).map((tab) => {
            const focused = tab.name === activeTab;
            const Icon = tab.icon;
            const color = focused ? colors.accent : colors.textMuted;
            return (
              <Pressable
                key={tab.name}
                onPress={() => selectTab(tab.name)}
                style={styles.tabItem}
                accessibilityRole="tab"
                accessibilityState={{ selected: focused }}
                accessibilityLabel={tab.label}
              >
                <Icon size={22} color={color} strokeWidth={focused ? 2.4 : 1.8} />
                <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{tab.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <Modal
          visible={settingsOpen}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setSettingsOpen(false)}
        >
          <SettingsScreen onClose={() => setSettingsOpen(false)} />
        </Modal>
        <NoticeDialog
          visible={deniedOpen}
          title="Access denied"
          message="You don't have authorization to open this section."
          onClose={() => setDeniedOpen(false)}
        />
      </View>
    </TabNavContext.Provider>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    minHeight: 0,
    backgroundColor: colors.background,
  },
  scene: {
    flex: 1,
    minHeight: 0,
  },
  tabBar: {
    flexDirection: 'row',
    flexShrink: 0,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  tabItem: {
    flex: 1,
    minHeight: touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tabLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: colors.accent,
  },
});
