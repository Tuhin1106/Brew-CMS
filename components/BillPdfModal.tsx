import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { FileText, Share2 } from 'lucide-react-native';

import BackButton from './BackButton';
import BillPreview from './BillPreview';
import { colors, spacing, touchTarget } from '../constants/theme';
import { useAppInsets } from '../hooks/useAppInsets';
import type { CafeProfile, GSTConfig, OrderBill } from '../types/cms';

type BillPdfModalProps = {
  visible: boolean;
  bill: OrderBill | null;
  cafe: CafeProfile;
  gst: GSTConfig;
  sharing?: boolean;
  onClose: () => void;
  onShare: () => void;
};

export default function BillPdfModal({
  visible,
  bill,
  cafe,
  gst,
  sharing = false,
  onClose,
  onShare,
}: BillPdfModalProps) {
  const insets = useAppInsets();

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={[styles.shell, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <BackButton onPress={onClose} />
          <View style={styles.fileMeta}>
            <FileText size={16} color={colors.accent} />
            <Text style={styles.fileName} numberOfLines={1}>
              {bill ? `${bill.billNumber}.pdf` : 'Bill.pdf'}
            </Text>
          </View>
          <Pressable
            onPress={onShare}
            disabled={sharing || !bill}
            style={styles.shareBtn}
            accessibilityRole="button"
            accessibilityLabel="Share PDF"
          >
            <Share2 size={18} color={colors.accent} />
          </Pressable>
        </View>
        <Text style={styles.pageLabel}>PDF preview · Page 1 of 1</Text>
        <ScrollView
          style={styles.canvas}
          contentContainerStyle={styles.canvasBody}
          showsVerticalScrollIndicator={false}
        >
          {bill ? (
            <View style={styles.page}>
              <BillPreview bill={bill} cafe={cafe} gst={gst} />
            </View>
          ) : null}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    minHeight: touchTarget,
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  fileMeta: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  fileName: {
    flex: 1,
    color: colors.text,
    fontWeight: '800',
  },
  shareBtn: {
    minWidth: touchTarget,
    minHeight: touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    paddingVertical: spacing.sm,
  },
  canvas: {
    flex: 1,
    backgroundColor: '#E8D7B8',
  },
  canvasBody: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  page: {
    backgroundColor: colors.background,
    borderRadius: 2,
    shadowColor: colors.accent,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
});
