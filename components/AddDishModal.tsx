import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAppInsets } from '../hooks/useAppInsets';

import BackButton from './BackButton';
import FoodImage from './FoodImage';
import { FOOD_IMAGE_KEYS } from '../constants/foodImages';
import { colors, radii, spacing, touchTarget } from '../constants/theme';
import type { MenuItem } from '../types/cms';

type AddDishModalProps = {
  visible: boolean;
  categories: string[];
  defaultCategory: string;
  onClose: () => void;
  onSave: (item: Omit<MenuItem, 'id'>) => void;
};

export default function AddDishModal({
  visible,
  categories,
  defaultCategory,
  onClose,
  onSave,
}: AddDishModalProps) {
  const insets = useAppInsets();
  const [name, setName] = useState('');
  const [category, setCategory] = useState(defaultCategory);
  const [fullPrice, setFullPrice] = useState('');
  const [halfPrice, setHalfPrice] = useState('');
  const [isMeal, setIsMeal] = useState(false);
  const [imageKey, setImageKey] = useState('default');
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      setCategory(defaultCategory);
      setError('');
    }
  }, [visible, defaultCategory]);

  const reset = () => {
    setName('');
    setCategory(defaultCategory);
    setFullPrice('');
    setHalfPrice('');
    setIsMeal(false);
    setImageKey('default');
    setError('');
  };

  const save = () => {
    const fullPlatePrice = Number.parseFloat(fullPrice);
    const halfPlatePrice = Number.parseFloat(halfPrice);
    if (!name.trim()) {
      setError('Enter a dish name.');
      return;
    }
    if (!Number.isFinite(fullPlatePrice) || fullPlatePrice <= 0) {
      setError('Enter a valid full plate price.');
      return;
    }
    if (isMeal && (!Number.isFinite(halfPlatePrice) || halfPlatePrice <= 0)) {
      setError('Meals need a half plate price.');
      return;
    }
    onSave({
      name: name.trim(),
      category,
      description: '',
      imageKey,
      isMeal,
      fullPlatePrice,
      halfPlatePrice: isMeal ? halfPlatePrice : undefined,
      isOutOfStock: false,
    });
    reset();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        enabled={Platform.OS === 'ios'}
      >
        <View style={[styles.sheet, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          <View style={styles.header}>
            <BackButton onPress={onClose} />
            <Text style={styles.title}>Add new dish</Text>
          </View>
          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            <Field label="Name" value={name} onChangeText={setName} />
            <Text style={styles.label}>Category</Text>
            <View style={styles.wrapRow}>
              {categories.map((entry) => {
                const selected = entry === category;
                return (
                  <Pressable
                    key={entry}
                    onPress={() => setCategory(entry)}
                    style={[styles.chip, selected && styles.chipSelected]}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{entry}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Field
              label="Full plate price (₹)"
              value={fullPrice}
              onChangeText={setFullPrice}
              keyboardType="decimal-pad"
            />
            <View style={styles.switchRow}>
              <Text style={styles.labelInline}>Is meal (half / full)</Text>
              <Switch
                value={isMeal}
                onValueChange={setIsMeal}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor={colors.onAccent}
                accessibilityLabel="Is meal"
              />
            </View>
            {isMeal ? (
              <Field
                label="Half plate price (₹)"
                value={halfPrice}
                onChangeText={setHalfPrice}
                keyboardType="decimal-pad"
              />
            ) : null}
            <Text style={styles.label}>Dish photo</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.photoRow}
            >
              {FOOD_IMAGE_KEYS.map((key) => {
                const selected = key === imageKey;
                return (
                  <Pressable
                    key={key}
                    onPress={() => setImageKey(key)}
                    style={[styles.photoChip, selected && styles.photoChipSelected]}
                    accessibilityLabel={`Photo ${key}`}
                  >
                    <FoodImage imageKey={key} size={56} />
                  </Pressable>
                );
              })}
            </ScrollView>
            {error ? <Text style={styles.notice}>{error}</Text> : null}
            <Pressable onPress={save} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Save dish</Text>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Field({
  label,
  value,
  onChangeText,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: 'default' | 'decimal-pad';
}) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor={colors.textMuted}
        keyboardType={keyboardType}
        style={styles.input}
        accessibilityLabel={label}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  sheet: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: touchTarget,
    paddingHorizontal: spacing.lg,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
  },
  body: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  label: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  labelInline: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  input: {
    minHeight: touchTarget,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
    paddingHorizontal: spacing.lg,
  },
  wrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    minHeight: touchTarget,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  chipText: {
    color: colors.textMuted,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: colors.onAccent,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    minHeight: 64,
  },
  photoRow: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  photoChip: {
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: 'transparent',
    padding: 2,
  },
  photoChipSelected: {
    borderColor: colors.accent,
  },
  notice: {
    color: colors.accent,
    fontWeight: '600',
  },
  primaryButton: {
    minHeight: touchTarget,
    borderRadius: radii.md,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: colors.onAccent,
    fontWeight: '800',
    fontSize: 16,
  },
});
