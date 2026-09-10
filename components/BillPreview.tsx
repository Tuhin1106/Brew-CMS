import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from '../constants/theme';
import { formatInr } from '../lib/format';
import type { CafeProfile, GSTConfig, OrderBill } from '../types/cms';

type BillPreviewProps = {
  bill: OrderBill;
  cafe: CafeProfile;
  gst: GSTConfig;
};

export default function BillPreview({ bill, cafe, gst }: BillPreviewProps) {
  const paidAt = new Date(bill.settledAt).toLocaleString('en-IN');

  return (
    <View style={styles.paper}>
      <Text style={styles.cafe}>{cafe.name}</Text>
      <Text style={styles.meta}>
        {cafe.address}, {cafe.city}
      </Text>
      <Text style={styles.meta}>
        Phone {cafe.phone} · {cafe.email}
      </Text>
      {gst.enabled ? <Text style={styles.meta}>GSTIN {gst.gstin}</Text> : null}

      <View style={styles.rule} />

      <Text style={styles.billNo}>{bill.billNumber}</Text>
      <Text style={styles.meta}>
        {bill.tableName} · {paidAt}
      </Text>
      <Text style={styles.meta}>Paid by {bill.paymentMethod}</Text>

      <View style={styles.tableHead}>
        <Text style={[styles.headCell, styles.itemCol]}>Item</Text>
        <Text style={[styles.headCell, styles.qtyCol]}>Qty</Text>
        <Text style={[styles.headCell, styles.amtCol]}>Amount</Text>
      </View>
      {bill.items.map((item) => (
        <View key={item.id} style={styles.tableRow}>
          <View style={styles.itemCol}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemMeta}>
              {item.portion === 'HALF' ? 'Half' : 'Full'} · {formatInr(item.unitPrice)}
            </Text>
          </View>
          <Text style={[styles.cell, styles.qtyCol]}>{item.quantity}</Text>
          <Text style={[styles.cell, styles.amtCol]}>
            {formatInr(item.unitPrice * item.quantity)}
          </Text>
        </View>
      ))}

      <View style={styles.rule} />

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Subtotal</Text>
        <Text style={styles.totalValue}>{formatInr(bill.subtotal)}</Text>
      </View>
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>CGST</Text>
        <Text style={styles.totalValue}>{formatInr(bill.cgstAmount)}</Text>
      </View>
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>SGST</Text>
        <Text style={styles.totalValue}>{formatInr(bill.sgstAmount)}</Text>
      </View>
      <View style={styles.totalRow}>
        <Text style={styles.grandLabel}>Total</Text>
        <Text style={styles.grandValue}>{formatInr(bill.total)}</Text>
      </View>

      <Text style={styles.thanks}>Thank you for visiting {cafe.name}.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  paper: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  cafe: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  billNo: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    marginTop: spacing.sm,
  },
  meta: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  rule: {
    height: 1,
    backgroundColor: colors.surface,
    marginVertical: spacing.sm,
  },
  tableHead: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  headCell: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  itemCol: {
    flex: 1,
  },
  qtyCol: {
    width: 36,
    textAlign: 'center',
  },
  amtCol: {
    width: 88,
    textAlign: 'right',
  },
  itemName: {
    color: colors.text,
    fontWeight: '700',
  },
  itemMeta: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
  },
  cell: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 13,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    color: colors.textMuted,
    fontWeight: '600',
  },
  totalValue: {
    color: colors.text,
    fontWeight: '700',
  },
  grandLabel: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 16,
  },
  grandValue: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 16,
  },
  thanks: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: spacing.md,
    fontWeight: '600',
  },
});
