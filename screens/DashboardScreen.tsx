import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import BackButton from '../components/BackButton';
import SettledBillsList from '../components/SettledBillsList';
import { canAccessSection, roleLabel } from '../constants/roles';
import { colors, radii, spacing, touchTarget } from '../constants/theme';
import { useAppInsets } from '../hooks/useAppInsets';
import { useTabNav } from '../navigation/TabNavContext';
import { useCafeStore } from '../store/useCafeStore';

export default function DashboardScreen() {
  const insets = useAppInsets();
  const { navigate } = useTabNav();
  const currentUser = useCafeStore((state) => state.currentUser);
  const occupiedTables = useCafeStore(
    (state) => state.tables.filter((table) => table.status === 'OCCUPIED').length,
  );
  const activeKots = useCafeStore(
    (state) => state.kotTickets.filter((ticket) => ticket.status !== 'COMPLETED').length,
  );
  const completedOrders = useCafeStore((state) => state.completedOrders);
  const [billsOpen, setBillsOpen] = useState(false);

  const bills = useMemo(
    () =>
      [...completedOrders].sort(
        (a, b) => new Date(b.settledAt).getTime() - new Date(a.settledAt).getTime(),
      ),
    [completedOrders],
  );

  const openOccupied = () => navigate('Floor', { floorFilter: 'OCCUPIED' });
  const openKots = () => navigate('Kitchen', { kitchenFilter: 'OPEN' });
  const openBills = () => {
    if (canAccessSection(currentUser?.role, 'Reports')) {
      navigate('Reports', { reportsRange: 'ALL', reportsFocus: 'bills' });
      return;
    }
    setBillsOpen(true);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.hello}>Welcome back</Text>
      <Text style={styles.name}>{currentUser?.name ?? 'Staff'}</Text>
      <Text style={styles.role}>
        {currentUser ? roleLabel(currentUser.role) : ''} · Offline shift
      </Text>

      <View style={styles.metrics}>
        <MetricChip
          value={occupiedTables}
          label="Occupied tables"
          onPress={openOccupied}
        />
        <MetricChip value={activeKots} label="Active KOTs" onPress={openKots} />
        <MetricChip value={bills.length} label="Settled bills" onPress={openBills} />
      </View>

      <Modal
        visible={billsOpen}
        animationType="slide"
        onRequestClose={() => setBillsOpen(false)}
      >
        <View style={[styles.sheet, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          <View style={styles.sheetHeader}>
            <BackButton onPress={() => setBillsOpen(false)} />
            <Text style={styles.sheetTitle}>Settled bills</Text>
          </View>
          <ScrollView contentContainerStyle={styles.sheetBody}>
            <SettledBillsList bills={bills} />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

function MetricChip({
  value,
  label,
  onPress,
}: {
  value: number;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.metric, pressed && styles.metricPressed]}
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${value}`}
    >
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  hello: {
    color: colors.accent,
    fontSize: 13,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  name: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
  },
  role: {
    color: colors.textMuted,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  metrics: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  metric: {
    flex: 1,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.lg,
    minHeight: Math.max(88, touchTarget),
    justifyContent: 'center',
  },
  metricPressed: {
    opacity: 0.82,
  },
  metricValue: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  metricLabel: {
    color: colors.textMuted,
    fontSize: 12,
  },
  sheet: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: touchTarget,
  },
  sheetTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
  },
  sheetBody: {
    paddingBottom: spacing.xxl,
  },
});
