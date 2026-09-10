import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Settings } from 'lucide-react-native';

import { roleLabel } from '../constants/roles';
import { colors, radii, spacing, touchTarget } from '../constants/theme';
import { useAppInsets } from '../hooks/useAppInsets';
import { useCafeStore } from '../store/useCafeStore';

type AppHeaderProps = {
  onOpenSettings: () => void;
};

export default function AppHeader({ onOpenSettings }: AppHeaderProps) {
  const insets = useAppInsets();
  const cafeName = useCafeStore((state) => state.cafeProfile.name);
  const role = useCafeStore((state) => state.currentUser?.role);

  return (
    <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.titles}>
        <Text style={styles.kicker}>Now serving</Text>
        <Text style={styles.cafeName} numberOfLines={1}>
          {cafeName}
        </Text>
      </View>
      {role ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{roleLabel(role)}</Text>
        </View>
      ) : null}
      <Pressable
        onPress={onOpenSettings}
        style={styles.settingsButton}
        accessibilityRole="button"
        accessibilityLabel="Open settings"
      >
        <Settings size={22} color={colors.text} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  titles: {
    flex: 1,
  },
  kicker: {
    color: colors.textMuted,
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  cafeName: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 2,
  },
  badge: {
    minHeight: 32,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '700',
  },
  settingsButton: {
    minWidth: touchTarget,
    minHeight: touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
