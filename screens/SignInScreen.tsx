import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Check, ChevronDown, Eye, EyeOff, Square, SquareCheck } from 'lucide-react-native';

import { ROLE_LABELS, USER_ROLES } from '../constants/roles';
import { colors, radii, spacing, touchTarget } from '../constants/theme';
import { useAppInsets } from '../hooks/useAppInsets';
import { DEMO_CREDENTIALS } from '../store/seedData';
import { useCafeStore } from '../store/useCafeStore';
import type { UserRole } from '../types/cms';

const DEMO_CHIPS: { label: string; role: UserRole }[] = [
  { label: 'Admin Demo', role: 'ADMIN' },
  { label: 'Manager Demo', role: 'MANAGER' },
  { label: 'Waiter Demo', role: 'WAITER' },
  { label: 'Chef Demo', role: 'CHEF' },
];

export default function SignInScreen() {
  const insets = useAppInsets();
  const cafeName = useCafeStore((state) => state.cafeProfile.name);
  const login = useCafeStore((state) => state.login);

  const [role, setRole] = useState<UserRole>('ADMIN');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [roleOpen, setRoleOpen] = useState(false);
  const [error, setError] = useState('');

  const phoneValid = phone.length === 10;
  const canSubmit = phoneValid && password.length > 0;

  const attemptLogin = (nextRole: UserRole, nextPhone: string, nextPassword: string) => {
    const ok = login(nextPhone, nextPassword, nextRole, rememberDevice);
    if (!ok) {
      setError('Invalid phone or password for this role.');
    }
  };

  const onSubmit = () => {
    if (!canSubmit) {
      setError('Enter a 10-digit phone number and password.');
      return;
    }
    setError('');
    attemptLogin(role, phone, password);
  };

  const onDemo = (demoRole: UserRole) => {
    const creds = DEMO_CREDENTIALS[demoRole];
    setRole(demoRole);
    setPhone(creds.phone);
    setPassword(creds.password);
    setShowPassword(false);
    setError('');
    attemptLogin(demoRole, creds.phone, creds.password);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      enabled={Platform.OS === 'ios'}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top, spacing.xxl),
            paddingBottom: insets.bottom + spacing.xxl,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.kicker}>{cafeName}</Text>
          <Text style={styles.title}>Staff sign in</Text>
          <Text style={styles.subtitle}>
            Use the mobile number and password your manager set for you.
          </Text>

          <Text style={styles.label}>Role</Text>
          <View style={styles.dropdown}>
            <Pressable
              onPress={() => setRoleOpen((open) => !open)}
              style={styles.dropdownTrigger}
              accessibilityRole="button"
              accessibilityState={{ expanded: roleOpen }}
              accessibilityLabel={`Role, ${ROLE_LABELS[role]}`}
            >
              <Text style={styles.dropdownValue}>{ROLE_LABELS[role]}</Text>
              <View style={roleOpen ? styles.chevronOpen : undefined}>
                <ChevronDown size={18} color={colors.textMuted} />
              </View>
            </Pressable>
            {roleOpen ? (
              <View style={styles.dropdownMenu}>
                {USER_ROLES.map((item, index) => {
                  const selected = item === role;
                  const last = index === USER_ROLES.length - 1;
                  return (
                    <Pressable
                      key={item}
                      onPress={() => {
                        setRole(item);
                        setRoleOpen(false);
                        setError('');
                      }}
                      style={[
                        styles.dropdownItem,
                        !last && styles.dropdownItemDivider,
                        selected && styles.dropdownItemSelected,
                      ]}
                      accessibilityRole="menuitem"
                      accessibilityState={{ selected }}
                      accessibilityLabel={ROLE_LABELS[item]}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          selected && styles.dropdownItemTextSelected,
                        ]}
                      >
                        {ROLE_LABELS[item]}
                      </Text>
                      {selected ? <Check size={16} color={colors.accent} strokeWidth={2.6} /> : null}
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
          </View>

          <Text style={styles.label}>Mobile</Text>
          <TextInput
            value={phone}
            onChangeText={(value) => {
              setPhone(value.replace(/\D/g, '').slice(0, 10));
              setError('');
            }}
            placeholder="e.g. 9876543210"
            placeholderTextColor={colors.textMuted}
            keyboardType="phone-pad"
            inputMode="numeric"
            maxLength={10}
            autoCorrect={false}
            autoCapitalize="none"
            style={styles.input}
            accessibilityLabel="Mobile"
          />

          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordWrap}>
            <TextInput
              value={password}
              onChangeText={(value) => {
                setPassword(value);
                setError('');
              }}
              placeholder=""
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.passwordInput}
              accessibilityLabel="Password"
              onSubmitEditing={onSubmit}
            />
            <Pressable
              onPress={() => setShowPassword((visible) => !visible)}
              style={styles.eyeButton}
              accessibilityRole="button"
              accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff size={18} color={colors.textMuted} />
              ) : (
                <Eye size={18} color={colors.textMuted} />
              )}
            </Pressable>
          </View>

          <Pressable
            onPress={() => setRememberDevice((value) => !value)}
            style={styles.rememberRow}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: rememberDevice }}
            accessibilityLabel="Remember this device"
          >
            {rememberDevice ? (
              <SquareCheck size={20} color={colors.accent} strokeWidth={2.2} />
            ) : (
              <Square size={20} color={colors.textMuted} strokeWidth={2} />
            )}
            <Text style={styles.rememberText}>Remember this device</Text>
          </Pressable>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            onPress={onSubmit}
            disabled={!canSubmit}
            style={({ pressed }) => [
              styles.submit,
              !canSubmit && styles.submitDisabled,
              pressed && canSubmit && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Sign in"
          >
            <Text style={styles.submitText}>Sign in</Text>
          </Pressable>
        </View>

        <Text style={styles.demoHeading}>Prototype Quick-Fill</Text>
        <View style={styles.demoRow}>
          {DEMO_CHIPS.map((chip) => (
            <Pressable
              key={chip.role}
              onPress={() => onDemo(chip.role)}
              style={({ pressed }) => [styles.demoChip, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={chip.label}
            >
              <Text style={styles.demoChipText}>{chip.label}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    paddingHorizontal: spacing.xl,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    justifyContent: 'center',
    flexGrow: 1,
  },
  card: {
    backgroundColor: colors.background,
    borderRadius: 20,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    ...Platform.select({
      ios: {
        shadowColor: colors.accent,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
      },
      android: {
        elevation: 8,
      },
      default: {},
    }),
  },
  kicker: {
    color: colors.accent,
    fontSize: 28,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  label: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  dropdown: {
    zIndex: 2,
  },
  dropdownTrigger: {
    minHeight: touchTarget,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
  },
  dropdownValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  chevronOpen: {
    transform: [{ rotate: '180deg' }],
  },
  dropdownMenu: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    overflow: 'hidden',
    backgroundColor: colors.background,
  },
  dropdownItem: {
    minHeight: touchTarget,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownItemDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  dropdownItemSelected: {
    backgroundColor: colors.surface,
  },
  dropdownItemText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  dropdownItemTextSelected: {
    color: colors.accent,
  },
  input: {
    minHeight: touchTarget,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    color: colors.text,
    fontSize: 16,
    backgroundColor: colors.background,
  },
  passwordWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    minHeight: touchTarget,
    backgroundColor: colors.background,
  },
  passwordInput: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    paddingHorizontal: spacing.lg,
    minHeight: touchTarget,
  },
  eyeButton: {
    minWidth: touchTarget,
    minHeight: touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    minHeight: 40,
  },
  rememberText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
  error: {
    color: colors.accent,
    marginTop: spacing.md,
    fontSize: 13,
  },
  submit: {
    marginTop: spacing.xl,
    minHeight: 52,
    borderRadius: radii.md,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitDisabled: {
    opacity: 0.4,
  },
  submitText: {
    color: colors.onAccent,
    fontWeight: '700',
    fontSize: 16,
  },
  demoHeading: {
    color: colors.textMuted,
    fontSize: 12,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    fontWeight: '700',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  demoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  demoChip: {
    minHeight: touchTarget,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoChipText: {
    color: colors.text,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.88,
  },
});
