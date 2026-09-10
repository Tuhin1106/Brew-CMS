import { Pressable, StyleSheet, Text } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';

import { colors, spacing, touchTarget } from '../constants/theme';

type BackButtonProps = {
  onPress: () => void;
  label?: string;
};

export default function BackButton({ onPress, label = 'Back' }: BackButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={styles.button}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <ArrowLeft size={22} color={colors.text} />
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: touchTarget,
    minWidth: touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  label: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 16,
  },
});
