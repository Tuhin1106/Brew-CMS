import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, touchTarget } from '../constants/theme';

type NoticeDialogProps = {
  visible: boolean;
  title: string;
  message: string;
  actionLabel?: string;
  onClose: () => void;
};

export default function NoticeDialog({
  visible,
  title,
  message,
  actionLabel = 'OK',
  onClose,
}: NoticeDialogProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <Pressable onPress={onClose} style={styles.okBtn} accessibilityLabel={actionLabel}>
            <Text style={styles.okText}>{actionLabel}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    gap: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  message: {
    color: colors.textMuted,
    lineHeight: 20,
  },
  okBtn: {
    minHeight: touchTarget,
    borderRadius: radii.md,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  okText: {
    color: colors.onAccent,
    fontWeight: '800',
  },
});
