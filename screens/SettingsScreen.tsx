import { useEffect, useMemo, useState, type ReactNode } from 'react';
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
import {
  Eye,
  EyeOff,
  LogOut,
  Pencil,
  Plus,
  Receipt,
  Search,
  Store,
  Trash2,
  UserRound,
  Users,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react-native';

import BackButton from '../components/BackButton';
import ConfirmDialog from '../components/ConfirmDialog';
import AddDishModal from '../components/AddDishModal';
import FoodImage from '../components/FoodImage';
import { ROLE_LABELS, USER_ROLES, roleLabel } from '../constants/roles';
import { colors, radii, spacing, touchTarget } from '../constants/theme';
import { formatInr } from '../lib/format';
import { useCafeStore } from '../store/useCafeStore';
import type { MenuItem, UserRole } from '../types/cms';

type SettingsTab = 'PROFILE' | 'ACCOUNT' | 'STAFF' | 'GST' | 'MENU';
type SettingsScreenProps = { onClose: () => void };

const TABS: { id: SettingsTab; label: string; Icon: LucideIcon }[] = [
  { id: 'PROFILE', label: 'Cafe Profile', Icon: Store },
  { id: 'ACCOUNT', label: 'Account', Icon: UserRound },
  { id: 'STAFF', label: 'Staff', Icon: Users },
  { id: 'GST', label: 'GST', Icon: Receipt },
  { id: 'MENU', label: 'Menu', Icon: UtensilsCrossed },
];

const ROLE_COLOR: Record<UserRole, string> = {
  ADMIN: colors.accent,
  MANAGER: colors.accent,
  WAITER: colors.accent,
  CHEF: colors.accent,
};

export default function SettingsScreen({ onClose }: SettingsScreenProps) {
  const insets = useAppInsets();
  const currentUser = useCafeStore((state) => state.currentUser);
  const cafeProfile = useCafeStore((state) => state.cafeProfile);
  const gstConfig = useCafeStore((state) => state.gstConfig);
  const staff = useCafeStore((state) => state.staff);
  const categories = useCafeStore((state) => state.categories);
  const menuItems = useCafeStore((state) => state.menuItems);
  const logout = useCafeStore((state) => state.logout);
  const updateCafeProfile = useCafeStore((state) => state.updateCafeProfile);
  const updateStaff = useCafeStore((state) => state.updateStaff);
  const addStaff = useCafeStore((state) => state.addStaff);
  const deleteStaff = useCafeStore((state) => state.deleteStaff);
  const updateGSTConfig = useCafeStore((state) => state.updateGSTConfig);
  const addCategory = useCafeStore((state) => state.addCategory);
  const addMenuItem = useCafeStore((state) => state.addMenuItem);
  const toggleMenuItemStock = useCafeStore((state) => state.toggleMenuItemStock);

  const [tab, setTab] = useState<SettingsTab>('PROFILE');
  const [banner, setBanner] = useState('');
  const [notice, setNotice] = useState('');

  const [cafeName, setCafeName] = useState(cafeProfile.name);
  const [address, setAddress] = useState(cafeProfile.address);
  const [city, setCity] = useState(cafeProfile.city);
  const [cafePhone, setCafePhone] = useState(cafeProfile.phone);
  const [email, setEmail] = useState(cafeProfile.email);
  const [upiId, setUpiId] = useState(cafeProfile.upiId);

  const [accountName, setAccountName] = useState(currentUser?.name ?? '');
  const [accountPhone, setAccountPhone] = useState(currentUser?.phone ?? '');
  const [accountPassword, setAccountPassword] = useState(currentUser?.password ?? '');
  const [showPassword, setShowPassword] = useState(false);

  const [gstEnabled, setGstEnabled] = useState(gstConfig.enabled);
  const [gstin, setGstin] = useState(gstConfig.gstin);
  const [cgst, setCgst] = useState(String(gstConfig.cgstPercent));
  const [sgst, setSgst] = useState(String(gstConfig.sgstPercent));

  const [staffOpen, setStaffOpen] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [staffName, setStaffName] = useState('');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffRole, setStaffRole] = useState<UserRole>('WAITER');
  const [staffPin, setStaffPin] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [showStaffPassword, setShowStaffPassword] = useState(false);
  const [staffError, setStaffError] = useState('');

  const [categoryFilter, setCategoryFilter] = useState(categories[0] ?? 'Coffee');
  const [menuSearch, setMenuSearch] = useState('');
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [categoryError, setCategoryError] = useState('');

  const [itemOpen, setItemOpen] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [pendingStaff, setPendingStaff] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    if (!banner) {
      return;
    }
    const timer = setTimeout(() => setBanner(''), 2400);
    return () => clearTimeout(timer);
  }, [banner]);

  const visibleItems = useMemo(() => {
    const query = menuSearch.trim().toLowerCase();
    return menuItems.filter((item) => {
      const inCategory = item.category === categoryFilter;
      if (!query) {
        return inCategory;
      }
      return (
        item.name.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
      );
    });
  }, [menuItems, categoryFilter, menuSearch]);

  const flash = (message: string) => {
    setNotice('');
    setBanner(message);
  };

  const saveProfile = () => {
    if (!cafeName.trim() || !upiId.trim()) {
      setNotice('Cafe name and UPI VPA are required.');
      return;
    }
    updateCafeProfile({
      name: cafeName.trim(),
      address: address.trim(),
      city: city.trim(),
      phone: cafePhone.trim(),
      email: email.trim(),
      upiId: upiId.trim(),
    });
    flash('Cafe profile saved.');
  };

  const saveAccount = () => {
    if (!currentUser) {
      setNotice('No signed-in account to update.');
      return;
    }
    if (!accountName.trim()) {
      setNotice('Enter a display name.');
      return;
    }
    if (accountPhone.length !== 10) {
      setNotice('Phone must be 10 digits.');
      return;
    }
    if (!accountPassword.trim()) {
      setNotice('Password cannot be empty.');
      return;
    }
    updateStaff(currentUser.id, {
      name: accountName.trim(),
      phone: accountPhone,
      password: accountPassword,
    });
    flash('Account updated.');
  };

  const openAddStaff = () => {
    setEditingStaffId(null);
    setStaffName('');
    setStaffPhone('');
    setStaffRole('WAITER');
    setStaffPin('');
    setStaffPassword('');
    setShowStaffPassword(false);
    setStaffError('');
    setStaffOpen(true);
  };

  const openEditStaff = (staffId: string) => {
    const member = staff.find((entry) => entry.id === staffId);
    if (!member) {
      return;
    }
    setEditingStaffId(member.id);
    setStaffName(member.name);
    setStaffPhone(member.phone);
    setStaffRole(member.role);
    setStaffPin(member.pin);
    setStaffPassword(member.password);
    setShowStaffPassword(false);
    setStaffError('');
    setStaffOpen(true);
  };

  const saveStaff = () => {
    if (staffPhone.length !== 10) {
      setStaffError('Phone must be 10 digits.');
      return;
    }
    const phoneTaken = staff.some(
      (member) => member.phone === staffPhone && member.id !== editingStaffId,
    );
    if (phoneTaken) {
      setStaffError('That phone is already on a staff account.');
      return;
    }

    if (editingStaffId) {
      if (!staffPassword.trim()) {
        setStaffError('Password cannot be empty.');
        return;
      }
      updateStaff(editingStaffId, {
        phone: staffPhone,
        password: staffPassword,
        pin: staffPassword.length === 4 ? staffPassword : staffPin,
      });
      setStaffOpen(false);
      flash(`${staffName.trim() || 'Staff'} updated.`);
      return;
    }

    if (!staffName.trim()) {
      setStaffError('Enter a staff name.');
      return;
    }
    if (staffPin.length !== 4) {
      setStaffError('PIN must be 4 digits.');
      return;
    }
    addStaff({
      name: staffName.trim(),
      phone: staffPhone,
      password: staffPin,
      pin: staffPin,
      role: staffRole,
    });
    setStaffOpen(false);
    flash(`${staffName.trim()} added.`);
  };

  const removeStaff = (staffId: string, name: string) => {
    const ok = deleteStaff(staffId);
    if (!ok) {
      setNotice('You cannot delete the signed-in account.');
      return;
    }
    flash(`${name} removed.`);
  };

  const saveTax = () => {
    const cgstPercent = Number.parseFloat(cgst);
    const sgstPercent = Number.parseFloat(sgst);
    if (!Number.isFinite(cgstPercent) || !Number.isFinite(sgstPercent) || cgstPercent < 0 || sgstPercent < 0) {
      setNotice('Enter valid CGST and SGST percentages.');
      return;
    }
    if (gstEnabled && gstin.length !== 15) {
      setNotice('GSTIN must be 15 characters.');
      return;
    }
    updateGSTConfig({
      enabled: gstEnabled,
      gstin,
      cgstPercent,
      sgstPercent,
    });
    flash('Tax rules saved.');
  };

  const saveCategory = () => {
    const ok = addCategory(newCategory);
    if (!ok) {
      setCategoryError('Enter a unique category name.');
      return;
    }
    const name = newCategory.trim();
    setCategoryFilter(name);
    setCategoryOpen(false);
    setNewCategory('');
    flash(`Category “${name}” added.`);
  };

  const openAddItem = () => {
    setItemOpen(true);
  };

  const saveItem = (item: Omit<MenuItem, 'id'>) => {
    addMenuItem(item);
    setCategoryFilter(item.category);
    setItemOpen(false);
    flash(`${item.name} added to ${item.category}.`);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      enabled={Platform.OS === 'ios'}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <BackButton onPress={onClose} />
          <Text style={styles.title}>Settings</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsScroll}
          contentContainerStyle={styles.tabs}
        >
          {TABS.map((entry) => {
            const selected = entry.id === tab;
            return (
              <Pressable
                key={entry.id}
                onPress={() => {
                  setTab(entry.id);
                  setNotice('');
                }}
                style={[styles.tabChip, selected && styles.tabChipSelected]}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                accessibilityLabel={entry.label}
              >
                <entry.Icon
                  size={16}
                  color={selected ? colors.onAccent : colors.textMuted}
                  strokeWidth={2.2}
                />
                <Text style={[styles.tabText, selected && styles.tabTextSelected]}>{entry.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {banner ? (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>{banner}</Text>
          </View>
        ) : null}
        {notice ? <Text style={styles.notice}>{notice}</Text> : null}

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {tab === 'PROFILE' ? (
            <View style={styles.form}>
              <Field label="Cafe name" value={cafeName} onChangeText={setCafeName} />
              <Field label="Address" value={address} onChangeText={setAddress} />
              <View style={styles.splitRow}>
                <View style={styles.splitField}>
                  <Field label="City" value={city} onChangeText={setCity} />
                </View>
                <View style={styles.splitField}>
                  <Field
                    label="Phone"
                    value={cafePhone}
                    onChangeText={setCafePhone}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>
              <Field
                label="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Field
                label="UPI VPA ID"
                value={upiId}
                onChangeText={setUpiId}
                autoCapitalize="none"
                placeholder="cafe@upi"
              />
              <Pressable onPress={saveProfile} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Save Profile</Text>
              </Pressable>
            </View>
          ) : null}

          {tab === 'ACCOUNT' ? (
            <View style={styles.form}>
              <Text style={styles.helper}>
                {currentUser ? ROLE_LABELS[currentUser.role] : 'Not signed in'}
              </Text>
              <Field label="Display name" value={accountName} onChangeText={setAccountName} />
              <Text style={styles.label}>Phone</Text>
              <View style={styles.phoneRow}>
                <View style={styles.prefix}>
                  <Text style={styles.prefixText}>+91</Text>
                </View>
                <TextInput
                  value={accountPhone}
                  onChangeText={(value) => setAccountPhone(value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="98765 43210"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="phone-pad"
                  maxLength={10}
                  style={styles.phoneInput}
                  accessibilityLabel="Account phone"
                />
              </View>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  value={accountPassword}
                  onChangeText={setAccountPassword}
                  placeholder="Update password"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  style={styles.passwordInput}
                  accessibilityLabel="Account password"
                />
                <Pressable
                  onPress={() => setShowPassword((visible) => !visible)}
                  style={styles.iconButton}
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff size={20} color={colors.textMuted} />
                  ) : (
                    <Eye size={20} color={colors.textMuted} />
                  )}
                </Pressable>
              </View>
              <Pressable onPress={saveAccount} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Save Account</Text>
              </Pressable>
            </View>
          ) : null}

          {tab === 'STAFF' ? (
            <View style={styles.relaxedForm}>
              <Pressable onPress={openAddStaff} style={styles.primaryButton}>
                <Plus size={18} color={colors.onAccent} />
                <Text style={styles.primaryButtonText}>Add Staff</Text>
              </Pressable>
              {staff.map((member) => {
                const isSelf = member.id === currentUser?.id;
                const tone = ROLE_COLOR[member.role];
                return (
                  <View key={member.id} style={styles.staffCard}>
                    <View style={styles.staffCopy}>
                      <Text style={styles.staffName}>{member.name}</Text>
                      <Text style={styles.helper}>+91 {member.phone} · PIN {member.pin}</Text>
                    </View>
                    <View style={[styles.roleBadge, { borderColor: tone }]}>
                      <Text style={[styles.roleBadgeText, { color: tone }]}>
                        {roleLabel(member.role)}
                      </Text>
                    </View>
                    <View style={styles.staffActions}>
                      <Pressable
                        onPress={() => openEditStaff(member.id)}
                        style={styles.iconButton}
                        accessibilityLabel={`Edit ${member.name}`}
                      >
                        <Pencil size={18} color={colors.accent} />
                      </Pressable>
                      <Pressable
                        onPress={() => setPendingStaff({ id: member.id, name: member.name })}
                        disabled={isSelf}
                        style={[styles.iconButton, isSelf && styles.disabled]}
                        accessibilityLabel={`Delete ${member.name}`}
                      >
                        <Trash2 size={18} color={isSelf ? colors.textMuted : colors.accent} />
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : null}

          {tab === 'GST' ? (
            <View style={styles.relaxedForm}>
              <View style={styles.switchRow}>
                <View>
                  <Text style={styles.labelInline}>Enable GST</Text>
                  <Text style={styles.helper}>Applies CGST and SGST on checkout.</Text>
                </View>
                <Switch
                  value={gstEnabled}
                  onValueChange={setGstEnabled}
                  trackColor={{ false: colors.border, true: colors.accent }}
                  thumbColor={colors.onAccent}
                  accessibilityLabel="Enable GST"
                />
              </View>
              <Field
                label="GSTIN"
                value={gstin}
                onChangeText={(value) =>
                  setGstin(value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15))
                }
                autoCapitalize="characters"
                maxLength={15}
              />
              <View style={styles.splitRow}>
                <View style={styles.splitField}>
                  <Field
                    label="CGST %"
                    value={cgst}
                    onChangeText={setCgst}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={styles.splitField}>
                  <Field
                    label="SGST %"
                    value={sgst}
                    onChangeText={setSgst}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
              <Pressable onPress={saveTax} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Save Tax Rules</Text>
              </Pressable>
            </View>
          ) : null}

          {tab === 'MENU' ? (
            <View style={styles.relaxedForm}>
              <View style={styles.categoryBar}>
                <Pressable
                  onPress={() => {
                    setCategoryError('');
                    setNewCategory('');
                    setCategoryOpen(true);
                  }}
                  style={styles.addChip}
                  accessibilityRole="button"
                  accessibilityLabel="Add category"
                >
                  <Plus size={16} color={colors.accent} />
                  <Text style={styles.addChipText}>Add Category</Text>
                </Pressable>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.categoryScroll}
                  contentContainerStyle={styles.categoryRow}
                >
                  {categories.map((name) => {
                    const selected = name === categoryFilter;
                    return (
                      <Pressable
                        key={name}
                        onPress={() => setCategoryFilter(name)}
                        style={[styles.filterChip, selected && styles.filterChipSelected]}
                      >
                        <Text style={[styles.filterText, selected && styles.filterTextSelected]}>
                          {name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              <View style={styles.searchRow}>
                <Search size={16} color={colors.textMuted} />
                <TextInput
                  value={menuSearch}
                  onChangeText={setMenuSearch}
                  placeholder="Search food items"
                  placeholderTextColor={colors.textMuted}
                  style={styles.searchInput}
                  accessibilityLabel="Search food items"
                />
              </View>

              <Pressable onPress={openAddItem} style={styles.primaryButton}>
                <Plus size={18} color={colors.onAccent} />
                <Text style={styles.primaryButtonText}>Add new dish</Text>
              </Pressable>

              {visibleItems.length === 0 ? (
                <Text style={styles.helper}>No items in this category yet.</Text>
              ) : (
                visibleItems.map((item) => (
                  <MenuRow
                    key={item.id}
                    item={item}
                    onToggle={() => toggleMenuItemStock(item.id)}
                  />
                ))
              )}
            </View>
          ) : null}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <Pressable
            onPress={() => setSignOutOpen(true)}
            style={styles.signOut}
            accessibilityRole="button"
            accessibilityLabel="Sign out"
          >
            <LogOut size={18} color={colors.accent} />
            <Text style={styles.signOutText}>Sign out</Text>
          </Pressable>
        </View>
      </View>

      <FormModal
        visible={staffOpen}
        title={editingStaffId ? 'Edit Staff' : 'Add Staff'}
        onClose={() => setStaffOpen(false)}
      >
        {editingStaffId ? (
          <Text style={styles.helper}>
            {staffName} · {ROLE_LABELS[staffRole]}
          </Text>
        ) : (
          <Field label="Name" value={staffName} onChangeText={setStaffName} />
        )}
        <Text style={styles.label}>Phone</Text>
        <View style={styles.phoneRow}>
          <View style={styles.prefix}>
            <Text style={styles.prefixText}>+91</Text>
          </View>
          <TextInput
            value={staffPhone}
            onChangeText={(value) => setStaffPhone(value.replace(/\D/g, '').slice(0, 10))}
            placeholder="98765 43210"
            placeholderTextColor={colors.textMuted}
            keyboardType="phone-pad"
            maxLength={10}
            style={styles.phoneInput}
          />
        </View>
        {editingStaffId ? (
          <>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                value={staffPassword}
                onChangeText={setStaffPassword}
                placeholder="Update password"
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showStaffPassword}
                autoCapitalize="none"
                style={styles.passwordInput}
                accessibilityLabel="Staff password"
              />
              <Pressable
                onPress={() => setShowStaffPassword((visible) => !visible)}
                style={styles.iconButton}
                accessibilityLabel={showStaffPassword ? 'Hide password' : 'Show password'}
              >
                {showStaffPassword ? (
                  <EyeOff size={20} color={colors.textMuted} />
                ) : (
                  <Eye size={20} color={colors.textMuted} />
                )}
              </Pressable>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.label}>Role</Text>
            <View style={styles.roleRow}>
              {USER_ROLES.map((role) => {
                const selected = role === staffRole;
                return (
                  <Pressable
                    key={role}
                    onPress={() => setStaffRole(role)}
                    style={[styles.filterChip, selected && styles.filterChipSelected]}
                  >
                    <Text style={[styles.filterText, selected && styles.filterTextSelected]}>
                      {ROLE_LABELS[role]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Field
              label="4-digit PIN"
              value={staffPin}
              onChangeText={(value) => setStaffPin(value.replace(/\D/g, '').slice(0, 4))}
              keyboardType="number-pad"
              maxLength={4}
            />
            <Text style={styles.helper}>They can sign in with this phone and PIN as the password.</Text>
          </>
        )}
        {staffError ? <Text style={styles.notice}>{staffError}</Text> : null}
        <Pressable onPress={saveStaff} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>
            {editingStaffId ? 'Save Changes' : 'Save Staff'}
          </Text>
        </Pressable>
      </FormModal>

      <FormModal visible={categoryOpen} title="Add Category" onClose={() => setCategoryOpen(false)}>
        <Field label="Category name" value={newCategory} onChangeText={setNewCategory} />
        {categoryError ? <Text style={styles.notice}>{categoryError}</Text> : null}
        <Pressable onPress={saveCategory} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Save Category</Text>
        </Pressable>
      </FormModal>

      <AddDishModal
        visible={itemOpen}
        categories={categories}
        defaultCategory={categoryFilter}
        onClose={() => setItemOpen(false)}
        onSave={saveItem}
      />

      <ConfirmDialog
        visible={signOutOpen}
        title="Sign out?"
        message="You will return to the sign-in screen. Continue?"
        confirmLabel="Sign out"
        onBack={() => setSignOutOpen(false)}
        onConfirm={() => {
          setSignOutOpen(false);
          onClose();
          logout();
        }}
      />
      <ConfirmDialog
        visible={pendingStaff !== null}
        title="Delete staff?"
        message={
          pendingStaff
            ? `Remove ${pendingStaff.name} from staff accounts? This cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        onBack={() => setPendingStaff(null)}
        onConfirm={() => {
          if (pendingStaff) {
            removeStaff(pendingStaff.id, pendingStaff.name);
          }
          setPendingStaff(null);
        }}
      />
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
  maxLength,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'phone-pad' | 'email-address' | 'decimal-pad' | 'number-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  maxLength?: number;
}) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        maxLength={maxLength}
        style={styles.input}
        accessibilityLabel={label}
      />
    </View>
  );
}

function MenuRow({ item, onToggle }: { item: MenuItem; onToggle: () => void }) {
  return (
    <View style={styles.menuRow}>
      <FoodImage imageKey={item.imageKey} size={56} />
      <View style={styles.staffCopy}>
        <Text style={styles.staffName}>{item.name}</Text>
        <Text style={styles.helper}>
          {item.isMeal
            ? `Half ${formatInr(item.halfPlatePrice ?? 0)} · Full ${formatInr(item.fullPlatePrice)}`
            : formatInr(item.fullPlatePrice)}
        </Text>
      </View>
      <View style={styles.stockBlock}>
        <Text style={styles.stockLabel}>{item.isOutOfStock ? 'Out of stock' : 'In stock'}</Text>
        <Switch
          value={!item.isOutOfStock}
          onValueChange={onToggle}
          trackColor={{ false: colors.border, true: colors.accent }}
          thumbColor={colors.onAccent}
          accessibilityLabel={`${item.name} in stock`}
        />
      </View>
    </View>
  );
}

function FormModal({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const insets = useAppInsets();
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
            <Text style={styles.title}>{title}</Text>
          </View>
          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            <View style={styles.form}>{children}</View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    minHeight: 0,
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
    minHeight: 44,
    paddingHorizontal: spacing.lg,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  iconButton: {
    minWidth: touchTarget,
    minHeight: touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsScroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  tabs: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
    alignItems: 'center',
  },
  tabChip: {
    minHeight: 40,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  tabChipSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  tabText: {
    color: colors.textMuted,
    fontWeight: '600',
  },
  tabTextSelected: {
    color: colors.onAccent,
  },
  banner: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  bannerText: {
    color: colors.text,
    fontWeight: '700',
  },
  notice: {
    color: colors.accent,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  body: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  scroll: {
    flex: 1,
  },
  form: {
    gap: spacing.sm,
  },
  relaxedForm: {
    gap: spacing.lg,
  },
  label: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  labelInline: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    minHeight: 44,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
    paddingHorizontal: spacing.md,
    fontSize: 15,
  },
  helper: {
    color: colors.textMuted,
    fontSize: 13,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.md,
    minHeight: touchTarget,
    overflow: 'hidden',
  },
  prefix: {
    minWidth: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.border,
    minHeight: touchTarget,
  },
  prefixText: {
    color: colors.textMuted,
    fontWeight: '700',
  },
  phoneInput: {
    flex: 1,
    color: colors.text,
    paddingHorizontal: spacing.lg,
    minHeight: touchTarget,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.md,
    minHeight: touchTarget,
  },
  passwordInput: {
    flex: 1,
    color: colors.text,
    paddingHorizontal: spacing.lg,
    minHeight: touchTarget,
  },
  primaryButton: {
    minHeight: 44,
    borderRadius: radii.md,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  primaryButtonText: {
    color: colors.onAccent,
    fontWeight: '800',
    fontSize: 15,
  },
  staffCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 64,
  },
  staffCopy: {
    flex: 1,
  },
  staffActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  staffName: {
    color: colors.text,
    fontWeight: '700',
  },
  roleBadge: {
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  disabled: {
    opacity: 0.4,
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
    paddingVertical: spacing.md,
    minHeight: 72,
  },
  splitRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  splitField: {
    flex: 1,
  },
  categoryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  categoryScroll: {
    flex: 1,
    flexGrow: 1,
  },
  categoryRow: {
    gap: spacing.sm,
    alignItems: 'center',
    paddingRight: spacing.sm,
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
  addChip: {
    minHeight: touchTarget,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  addChipText: {
    color: colors.accent,
    fontWeight: '700',
  },
  searchRow: {
    minHeight: touchTarget,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    minHeight: touchTarget,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  stockBlock: {
    alignItems: 'flex-end',
    gap: 4,
  },
  stockLabel: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '700',
  },
  roleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  signOut: {
    minHeight: 44,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  signOutText: {
    color: colors.accent,
    fontWeight: '700',
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
});
