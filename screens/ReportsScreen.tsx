import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  Banknote,
  BarChart3,
  CreditCard,
  IndianRupee,
  QrCode,
  Receipt,
  ShoppingBag,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react-native';

import FoodImage from '../components/FoodImage';
import SettledBillsList from '../components/SettledBillsList';
import { colors, radii, spacing, touchTarget } from '../constants/theme';
import { formatInr } from '../lib/format';
import { useTabNav } from '../navigation/TabNavContext';
import { roundMoney, useCafeStore } from '../store/useCafeStore';
import type { OrderBill, PaymentMethod, PlatePortion } from '../types/cms';

type DateRangeId = 'TODAY' | 'YESTERDAY' | 'LAST_7' | 'THIS_MONTH' | 'ALL';

const RANGES: { id: DateRangeId; label: string }[] = [
  { id: 'TODAY', label: 'Today' },
  { id: 'YESTERDAY', label: 'Yesterday' },
  { id: 'LAST_7', label: 'Last 7 Days' },
  { id: 'THIS_MONTH', label: 'This Month' },
  { id: 'ALL', label: 'All' },
];

const PAYMENTS: {
  id: PaymentMethod;
  label: string;
  Icon: LucideIcon;
  color: string;
}[] = [
  { id: 'CASH', label: 'Cash', Icon: Banknote, color: colors.accent },
  { id: 'UPI', label: 'UPI', Icon: QrCode, color: colors.accent },
  { id: 'CARD', label: 'Card', Icon: CreditCard, color: colors.accent },
];

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function rangeBounds(id: DateRangeId, now = new Date()) {
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  if (id === 'ALL') {
    return { start: new Date(0), end: todayEnd };
  }
  if (id === 'TODAY') {
    return { start: todayStart, end: todayEnd };
  }
  if (id === 'YESTERDAY') {
    const yesterday = new Date(todayStart);
    yesterday.setDate(yesterday.getDate() - 1);
    return { start: yesterday, end: endOfDay(yesterday) };
  }
  if (id === 'LAST_7') {
    const start = new Date(todayStart);
    start.setDate(start.getDate() - 6);
    return { start, end: todayEnd };
  }
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1),
    end: todayEnd,
  };
}

function formatRangeLabel(start: Date, end: Date, range: DateRangeId) {
  if (range === 'ALL') {
    return 'All settled bills';
  }
  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();
  const day = (date: Date) =>
    date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  return sameDay ? day(start) : `${day(start)} – ${day(end)}`;
}

function portionLabel(portion: PlatePortion) {
  return portion === 'HALF' ? 'Half' : 'Full';
}

type DishRank = {
  key: string;
  name: string;
  imageKey: string;
  portion: PlatePortion;
  quantity: number;
  revenue: number;
};

function buildReport(orders: OrderBill[], range: DateRangeId, now = new Date()) {
  const bounds = rangeBounds(range, now);
  const bills = orders.filter((bill) => {
    const settled = new Date(bill.settledAt).getTime();
    return settled >= bounds.start.getTime() && settled <= bounds.end.getTime();
  });

  const gross = roundMoney(bills.reduce((sum, bill) => sum + bill.total, 0));
  const cgst = roundMoney(bills.reduce((sum, bill) => sum + bill.cgstAmount, 0));
  const sgst = roundMoney(bills.reduce((sum, bill) => sum + bill.sgstAmount, 0));
  const tax = roundMoney(cgst + sgst);
  const orderCount = bills.length;
  const aov = orderCount === 0 ? 0 : roundMoney(gross / orderCount);

  const paymentTotals: Record<PaymentMethod, number> = { CASH: 0, UPI: 0, CARD: 0 };
  bills.forEach((bill) => {
    paymentTotals[bill.paymentMethod] = roundMoney(
      paymentTotals[bill.paymentMethod] + bill.total,
    );
  });

  const dishes = new Map<string, DishRank>();
  bills.forEach((bill) => {
    bill.items.forEach((item) => {
      const key = `${item.menuItemId}:${item.portion}`;
      const existing = dishes.get(key);
      const quantity = (existing?.quantity ?? 0) + item.quantity;
      const revenue = roundMoney((existing?.revenue ?? 0) + item.unitPrice * item.quantity);
      dishes.set(key, {
        key,
        name: item.name,
        imageKey: item.imageKey,
        portion: item.portion,
        quantity,
        revenue,
      });
    });
  });

  const topDishes = [...dishes.values()]
    .sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue)
    .slice(0, 5);

  return {
    bounds,
    bills,
    gross,
    tax,
    cgst,
    sgst,
    orderCount,
    aov,
    paymentTotals,
    topDishes,
  };
}

export default function ReportsScreen() {
  const { navOptions } = useTabNav();
  const completedOrders = useCafeStore((state) => state.completedOrders);
  const [range, setRange] = useState<DateRangeId>(navOptions?.reportsRange ?? 'TODAY');
  const focusBills = navOptions?.reportsFocus === 'bills';

  const report = useMemo(
    () => buildReport(completedOrders, range),
    [completedOrders, range],
  );

  const metrics: { label: string; value: string; hint: string; Icon: LucideIcon }[] = [
    {
      label: 'Total Gross Sales',
      value: formatInr(report.gross),
      hint: `${report.orderCount} settled`,
      Icon: IndianRupee,
    },
    {
      label: 'Net Tax Collected',
      value: formatInr(report.tax),
      hint: `CGST ${formatInr(report.cgst)} · SGST ${formatInr(report.sgst)}`,
      Icon: Receipt,
    },
    {
      label: 'Total Orders',
      value: String(report.orderCount),
      hint: 'Completed bills',
      Icon: ShoppingBag,
    },
    {
      label: 'Average Order Value',
      value: formatInr(report.aov),
      hint: 'Gross / orders',
      Icon: TrendingUp,
    },
  ];

  const billsSection = (
    <>
      <Text style={styles.sectionTitle}>Settled Bills</Text>
      <View style={styles.sectionCard}>
        <SettledBillsList
          bills={[...report.bills].sort(
            (a, b) => new Date(b.settledAt).getTime() - new Date(a.settledAt).getTime(),
          )}
        />
      </View>
    </>
  );

  return (
    <View style={styles.screen}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
      >
        {RANGES.map((entry) => {
          const selected = entry.id === range;
          return (
            <Pressable
              key={entry.id}
              onPress={() => setRange(entry.id)}
              style={[styles.filterChip, selected && styles.filterChipSelected]}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={entry.label}
            >
              <Text style={[styles.filterText, selected && styles.filterTextSelected]}>
                {entry.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView
        contentContainerStyle={[
          styles.body,
          { paddingBottom: spacing.xl },
        ]}
      >
        <Text style={styles.rangeLabel}>{formatRangeLabel(report.bounds.start, report.bounds.end, range)}</Text>

        {focusBills ? billsSection : null}

        <View style={styles.metrics}>
          {metrics.map((metric) => (
            <View key={metric.label} style={styles.metricWrap}>
              <View style={styles.metricCard}>
                <View style={styles.metricIcon}>
                  <metric.Icon size={16} color={colors.accent} />
                </View>
                <Text style={styles.metricLabel}>{metric.label}</Text>
                <Text style={styles.metricValue}>{metric.value}</Text>
                <Text style={styles.metricHint}>{metric.hint}</Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Payment Breakdown</Text>
        <View style={styles.sectionCard}>
          {report.orderCount === 0 ? (
            <Text style={styles.empty}>No payments in this range.</Text>
          ) : (
            PAYMENTS.map((method) => {
              const amount = report.paymentTotals[method.id];
              const percent = report.gross === 0 ? 0 : (amount / report.gross) * 100;
              return (
                <View key={method.id} style={styles.payRow}>
                  <View style={styles.payHead}>
                    <View style={styles.payLabelRow}>
                      <method.Icon size={18} color={method.color} />
                      <Text style={styles.payLabel}>{method.label}</Text>
                    </View>
                    <Text style={styles.payAmount}>
                      {formatInr(amount)} · {percent.toFixed(0)}%
                    </Text>
                  </View>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          width: `${Math.max(percent > 0 ? 4 : 0, Math.min(100, percent))}%`,
                          backgroundColor: method.color,
                        },
                      ]}
                    />
                  </View>
                </View>
              );
            })
          )}
        </View>

        <Text style={styles.sectionTitle}>Top 5 Selling Dishes</Text>
        <View style={styles.sectionCard}>
          {report.topDishes.length === 0 ? (
            <View style={styles.emptyBlock}>
              <BarChart3 size={22} color={colors.textMuted} />
              <Text style={styles.empty}>No dish sales in this range.</Text>
            </View>
          ) : (
            report.topDishes.map((dish, index) => (
              <View key={dish.key} style={styles.dishRow}>
                <Text style={styles.rank}>{index + 1}</Text>
                <FoodImage imageKey={dish.imageKey} size={40} />
                <View style={styles.dishCopy}>
                  <Text style={styles.dishName}>{dish.name}</Text>
                  <Text style={styles.dishMeta}>
                    {portionLabel(dish.portion)} · {dish.quantity} sold
                  </Text>
                </View>
                <Text style={styles.dishRevenue}>{formatInr(dish.revenue)}</Text>
              </View>
            ))
          )}
        </View>

        {focusBills ? null : billsSection}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  filters: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    alignItems: 'center',
  },
  filterChip: {
    minHeight: touchTarget,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  filterText: {
    color: colors.textMuted,
    fontWeight: '600',
  },
  filterTextSelected: {
    color: colors.onAccent,
  },
  body: {
    paddingHorizontal: spacing.sm,
  },
  rangeLabel: {
    color: colors.textMuted,
    fontWeight: '600',
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
  },
  metrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  metricWrap: {
    width: '50%',
    padding: spacing.sm,
  },
  metricCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.lg,
    minHeight: 128,
  },
  metricIcon: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  metricLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  metricValue: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  metricHint: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  sectionCard: {
    marginHorizontal: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  emptyBlock: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  empty: {
    color: colors.textMuted,
    textAlign: 'center',
  },
  payRow: {
    gap: spacing.sm,
  },
  payHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  payLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  payLabel: {
    color: colors.text,
    fontWeight: '700',
  },
  payAmount: {
    color: colors.textMuted,
    fontWeight: '600',
    fontSize: 12,
  },
  barTrack: {
    height: 10,
    borderRadius: radii.pill,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: radii.pill,
  },
  dishRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: touchTarget,
  },
  rank: {
    width: 22,
    color: colors.accent,
    fontWeight: '800',
    fontSize: 16,
  },
  dishCopy: {
    flex: 1,
  },
  dishName: {
    color: colors.text,
    fontWeight: '700',
  },
  dishMeta: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
    fontWeight: '600',
  },
  dishRevenue: {
    color: colors.text,
    fontWeight: '800',
  },
});
