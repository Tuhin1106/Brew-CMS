import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, touchTarget } from '../constants/theme';
import { formatInr } from '../lib/format';
import type { OrderBill } from '../types/cms';

export default function SettledBillsList({ bills }: { bills: OrderBill[] }) {
  if (bills.length === 0) {
    return <Text style={styles.empty}>No settled bills yet.</Text>;
  }

  return (
    <View style={styles.list}>
      {bills.map((bill) => {
        const paidAt = new Date(bill.settledAt).toLocaleString('en-IN', {
          day: 'numeric',
          month: 'short',
          hour: 'numeric',
          minute: '2-digit',
        });
        return (
          <View key={bill.id} style={styles.row}>
            <View style={styles.copy}>
              <Text style={styles.billNo}>{bill.billNumber}</Text>
              <Text style={styles.meta}>
                {bill.tableName} · {bill.paymentMethod} · {paidAt}
              </Text>
            </View>
            <Text style={styles.total}>{formatInr(bill.total)}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: touchTarget,
  },
  copy: {
    flex: 1,
  },
  billNo: {
    color: colors.text,
    fontWeight: '700',
  },
  meta: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
    fontWeight: '600',
  },
  total: {
    color: colors.text,
    fontWeight: '800',
  },
  empty: {
    color: colors.textMuted,
    textAlign: 'center',
  },
});
