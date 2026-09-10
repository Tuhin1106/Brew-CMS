import { StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { colors, radii, spacing } from '../constants/theme';

type UpiQrCodeProps = {
  value: string;
  size?: number;
};

export default function UpiQrCode({ value, size = 196 }: UpiQrCodeProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.frame}>
        <QRCode value={value} size={size} backgroundColor={colors.background} color={colors.accent} />
      </View>
      <Text style={styles.caption}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: spacing.md,
  },
  frame: {
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  caption: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
  },
});
