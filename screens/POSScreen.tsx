import { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAppInsets } from '../hooks/useAppInsets';
import {
  Banknote,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Minus,
  Plus,
  Printer,
  QrCode,
  Search,
  Share2,
  Trash2,
} from 'lucide-react-native';

import BackButton from '../components/BackButton';
import BillPdfModal from '../components/BillPdfModal';
import BillPreview from '../components/BillPreview';
import ConfirmDialog from '../components/ConfirmDialog';
import AddDishModal from '../components/AddDishModal';
import FoodImage from '../components/FoodImage';
import UpiQrCode from '../components/UpiQrCode';
import { colors, radii, spacing, touchTarget } from '../constants/theme';
import { buildBillHtml } from '../lib/billReceipt';
import { formatInr } from '../lib/format';
import { presentBillPdf } from '../lib/presentBillPdf';
import { useTabNav } from '../navigation/TabNavContext';
import {
  buildUpiPayString,
  collectTableItems,
  computeBillBreakdown,
  useCafeStore,
} from '../store/useCafeStore';
import type { CartItem, MenuItem, OrderBill, PaymentMethod, PlatePortion } from '../types/cms';

const NOTE_CHIPS = ['Less sugar', 'Extra hot', 'No garlic'];

const TENDERS: { id: PaymentMethod; label: string; Icon: typeof Banknote }[] = [
  { id: 'CASH', label: 'Cash', Icon: Banknote },
  { id: 'CARD', label: 'Card', Icon: CreditCard },
  { id: 'UPI', label: 'UPI', Icon: QrCode },
];

export default function POSScreen() {
  const insets = useAppInsets();
  const { navOptions } = useTabNav();
  const categories = useCafeStore((state) => state.categories);
  const menuItems = useCafeStore((state) => state.menuItems);
  const tables = useCafeStore((state) => state.tables);
  const cart = useCafeStore((state) => state.cart);
  const tickets = useCafeStore((state) => state.kotTickets);
  const gstConfig = useCafeStore((state) => state.gstConfig);
  const cafeProfile = useCafeStore((state) => state.cafeProfile);
  const upiId = useCafeStore((state) => state.cafeProfile.upiId);
  const activeTableId = useCafeStore((state) => state.activeTableId);
  const setActiveTable = useCafeStore((state) => state.setActiveTable);
  const addToCart = useCafeStore((state) => state.addToCart);
  const updateCartQuantity = useCafeStore((state) => state.updateCartQuantity);
  const removeFromCart = useCafeStore((state) => state.removeFromCart);
  const fireKOT = useCafeStore((state) => state.fireKOT);
  const settleBill = useCafeStore((state) => state.settleBill);
  const addMenuItem = useCafeStore((state) => state.addMenuItem);

  const activeTable = tables.find((table) => table.id === activeTableId);

  const [category, setCategory] = useState(categories[0] ?? 'Coffee');
  const [search, setSearch] = useState('');
  const [portions, setPortions] = useState<Record<string, PlatePortion>>({});
  const [customizer, setCustomizer] = useState<{ item: MenuItem; portion: PlatePortion } | null>(
    null,
  );
  const [notes, setNotes] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [tablePicker, setTablePicker] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(() => {
    if (navOptions?.posAction !== 'settle') {
      return false;
    }
    const state = useCafeStore.getState();
    if (!state.activeTableId) {
      return false;
    }
    return collectTableItems(state.activeTableId, state.cart, state.kotTickets).length > 0;
  });
  const [tender, setTender] = useState<PaymentMethod>('CASH');
  const [banner, setBanner] = useState('');
  const [notice, setNotice] = useState('');
  const [pendingDelete, setPendingDelete] = useState<CartItem | null>(null);
  const [receipt, setReceipt] = useState<OrderBill | null>(null);
  const [addDishOpen, setAddDishOpen] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfOpen, setPdfOpen] = useState(false);

  useEffect(() => {
    if (!banner) {
      return;
    }
    const timer = setTimeout(() => setBanner(''), 4500);
    return () => clearTimeout(timer);
  }, [banner]);

  const visibleItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return menuItems.filter((item) => {
      if (query) {
        return (
          item.name.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query)
        );
      }
      return item.category === category;
    });
  }, [menuItems, category, search]);

  const cartCount = cart.reduce((sum, line) => sum + line.quantity, 0);
  const cartSubtotal = cart.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  const checkoutItems = activeTableId
    ? collectTableItems(activeTableId, cart, tickets)
    : cart;
  const breakdown = computeBillBreakdown(checkoutItems, gstConfig);
  const upiString = buildUpiPayString(upiId, breakdown.total);

  const selectableTables = tables.filter(
    (table) => table.status !== 'NEEDS_CLEANING' && !table.mergedIntoTableId,
  );

  const openCustomizer = (item: MenuItem) => {
    if (item.isOutOfStock) {
      return;
    }
    setCustomizer({
      item,
      portion: item.isMeal ? (portions[item.id] ?? 'FULL') : 'FULL',
    });
    setNotes('');
    setNotice('');
  };

  const confirmAdd = () => {
    if (!customizer) {
      return;
    }
    if (!activeTableId) {
      setTablePicker(true);
      return;
    }
    if (activeTable?.status === 'NEEDS_CLEANING') {
      setNotice('Pick a clean table before adding items.');
      return;
    }
    addToCart(customizer.item.id, customizer.portion, notes);
    setCustomizer(null);
    setCartOpen(true);
  };

  const requireTable = () => {
    if (!activeTableId || activeTable?.status === 'NEEDS_CLEANING') {
      setNotice('Assign an available or occupied table first.');
      setTablePicker(true);
      return false;
    }
    return true;
  };

  const qtyFor = (item: MenuItem, portion: PlatePortion) =>
    cart
      .filter((line) => line.menuItemId === item.id && line.portion === portion)
      .reduce((sum, line) => sum + line.quantity, 0);

  const bumpItem = (item: MenuItem, delta: number) => {
    if (item.isOutOfStock) {
      return;
    }
    if (!requireTable()) {
      return;
    }
    const portion = item.isMeal ? (portions[item.id] ?? 'FULL') : 'FULL';
    if (delta > 0) {
      addToCart(item.id, portion);
      setCartOpen(true);
      setNotice('');
      return;
    }
    const line = [...cart]
      .reverse()
      .find((entry) => entry.menuItemId === item.id && entry.portion === portion);
    if (line && line.quantity > 1) {
      updateCartQuantity(line.id, line.quantity - 1);
    }
  };

  const onFireKot = () => {
    if (!requireTable()) {
      return;
    }
    if (cart.length === 0) {
      setNotice('Add items before sending a KOT.');
      return;
    }
    const kotId = fireKOT();
    if (!kotId) {
      setNotice('Could not send KOT. Check table status and cart.');
      return;
    }
    const ticket = useCafeStore.getState().kotTickets.find((entry) => entry.id === kotId);
    setBanner(`${ticket?.ticketNumber ?? 'KOT'} sent to kitchen`);
    setCartOpen(false);
    setNotice('');
  };

  const onOpenCheckout = () => {
    if (!requireTable()) {
      return;
    }
    if (checkoutItems.length === 0) {
      setNotice('Add items or settle an active table ticket.');
      return;
    }
    setTender('CASH');
    setCheckoutOpen(true);
    setNotice('');
  };

  useEffect(() => {
    if (navOptions?.posAction !== 'settle') {
      return;
    }
    onOpenCheckout();
    // Open billing once when arriving from Floor → Settle bill.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navOptions?.posAction]);

  const onConfirmPayment = () => {
    const bill = settleBill(tender);
    if (!bill) {
      setNotice('Payment could not be completed.');
      return;
    }
    setCheckoutOpen(false);
    setCartOpen(false);
    setReceipt(bill);
    setNotice('');
    setBanner(`Payment confirmed · ${bill.billNumber}`);
    setActiveTable(null);
  };

  const printReceipt = async (mode: 'print' | 'share') => {
    if (!receipt) {
      return;
    }
    if (mode === 'print') {
      setPdfOpen(true);
      return;
    }
    if (pdfBusy) {
      return;
    }
    const html = buildBillHtml(receipt, cafeProfile, gstConfig);
    setPdfBusy(true);
    setNotice('');
    try {
      await presentBillPdf(html, receipt.billNumber);
    } catch {
      setNotice('Could not create the bill PDF.');
    } finally {
      setPdfBusy(false);
    }
  };

  return (
    <View style={styles.screen}>
      {banner ? (
        <View style={styles.banner}>
          <CheckCircle2 size={18} color={colors.accent} />
          <Text style={styles.bannerText}>{banner}</Text>
        </View>
      ) : null}

      <Pressable
        onPress={() => setTablePicker(true)}
        style={styles.tablePill}
        accessibilityRole="button"
        accessibilityLabel="Change table"
      >
        <Text style={styles.tableKicker}>Assigned table</Text>
        <Text style={styles.tableName}>{activeTable?.name ?? 'Select table'}</Text>
        <Text style={styles.changeLink}>Change</Text>
      </Pressable>

      <View style={styles.searchRow}>
        <Search size={16} color={colors.textMuted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search food items"
          placeholderTextColor={colors.textMuted}
          style={styles.searchInput}
          accessibilityLabel="Search food items"
        />
      </View>

      <View style={styles.menuControls}>
        <Pressable
          onPress={() => setAddDishOpen(true)}
          style={styles.addDishButton}
          accessibilityRole="button"
          accessibilityLabel="Add new dish"
        >
          <Plus size={18} color={colors.onAccent} />
          <Text style={styles.addDishText}>Add new dish</Text>
        </Pressable>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryRow}
        >
          {categories.map((name) => {
            const selected = name === category;
            return (
              <Pressable
                key={name}
                onPress={() => setCategory(name)}
                style={[styles.categoryChip, selected && styles.categoryChipSelected]}
              >
                <Text style={[styles.categoryText, selected && styles.categoryTextSelected]}>
                  {name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {notice ? <Text style={styles.notice}>{notice}</Text> : null}

      <ScrollView contentContainerStyle={styles.list}>
        {visibleItems.length === 0 ? (
          <Text style={styles.emptySearch}>No food items match that search.</Text>
        ) : (
          visibleItems.map((item) => {
            const selectedPortion = portions[item.id] ?? 'FULL';
            const qty = qtyFor(item, item.isMeal ? selectedPortion : 'FULL');
            return (
              <View key={item.id} style={[styles.listRow, item.isOutOfStock && styles.listRowDisabled]}>
                <Pressable
                  onPress={() => openCustomizer(item)}
                  disabled={item.isOutOfStock}
                  style={styles.listMain}
                >
                  <FoodImage imageKey={item.imageKey} size={72} />
                  <View style={styles.listCopy}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    {item.isMeal ? (
                      <View style={styles.portionRow}>
                        <Pressable
                          onPress={() => {
                            if (item.isOutOfStock) {
                              return;
                            }
                            setPortions((current) => ({ ...current, [item.id]: 'HALF' }));
                          }}
                          style={[
                            styles.portionChip,
                            selectedPortion === 'HALF' && styles.portionChipSelected,
                          ]}
                        >
                          <Text
                            style={[
                              styles.portionText,
                              selectedPortion === 'HALF' && styles.portionTextSelected,
                            ]}
                          >
                            Half {formatInr(item.halfPlatePrice ?? 0)}
                          </Text>
                        </Pressable>
                        <Pressable
                          onPress={() => {
                            if (item.isOutOfStock) {
                              return;
                            }
                            setPortions((current) => ({ ...current, [item.id]: 'FULL' }));
                          }}
                          style={[
                            styles.portionChip,
                            selectedPortion === 'FULL' && styles.portionChipSelected,
                          ]}
                        >
                          <Text
                            style={[
                              styles.portionText,
                              selectedPortion === 'FULL' && styles.portionTextSelected,
                            ]}
                          >
                            Full {formatInr(item.fullPlatePrice)}
                          </Text>
                        </Pressable>
                      </View>
                    ) : (
                      <Text style={styles.price}>{formatInr(item.fullPlatePrice)}</Text>
                    )}
                    <Text style={styles.stockHint}>
                      {item.isOutOfStock ? 'Out of stock' : 'In stock'}
                    </Text>
                  </View>
                </Pressable>
                <View style={styles.listQty}>
                  <Pressable
                    onPress={() => bumpItem(item, -1)}
                    disabled={item.isOutOfStock || qty < 2}
                    style={styles.qtyButton}
                    accessibilityLabel={`Decrease ${item.name}`}
                  >
                    <Minus size={18} color={qty < 2 ? colors.textMuted : colors.text} />
                  </Pressable>
                  <Text style={styles.qtyValue}>{qty}</Text>
                  <Pressable
                    onPress={() => bumpItem(item, 1)}
                    disabled={item.isOutOfStock}
                    style={styles.qtyButton}
                    accessibilityLabel={`Increase ${item.name}`}
                  >
                    <Plus size={18} color={colors.accent} />
                  </Pressable>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <View style={[styles.dock, { paddingBottom: spacing.sm }]}>
        {cartOpen ? (
          <ScrollView style={styles.cartList} contentContainerStyle={styles.cartListContent}>
            {cart.length === 0 ? (
              <Text style={styles.helper}>Cart is empty.</Text>
            ) : (
              cart.map((line) => (
                <View key={line.id} style={styles.cartLine}>
                  <FoodImage imageKey={line.imageKey} size={44} />
                  <View style={styles.cartLineInfo}>
                    <Text style={styles.cartLineName}>
                      {line.name}
                      {line.portion === 'HALF' ? ' · Half' : ''}
                    </Text>
                    {line.kitchenNotes ? (
                      <Text style={styles.cartNotes}>{line.kitchenNotes}</Text>
                    ) : null}
                    <Text style={styles.helper}>{formatInr(line.unitPrice * line.quantity)}</Text>
                  </View>
                  <View style={styles.qtyRow}>
                    <Pressable
                      onPress={() => updateCartQuantity(line.id, Math.max(1, line.quantity - 1))}
                      style={styles.qtyButton}
                      accessibilityLabel={`Decrease ${line.name}`}
                    >
                      <Minus size={16} color={line.quantity < 2 ? colors.textMuted : colors.text} />
                    </Pressable>
                    <Text style={styles.qtyValue}>{line.quantity}</Text>
                    <Pressable
                      onPress={() => updateCartQuantity(line.id, line.quantity + 1)}
                      style={styles.qtyButton}
                      accessibilityLabel={`Increase ${line.name}`}
                    >
                      <Plus size={16} color={colors.accent} />
                    </Pressable>
                    <Pressable
                      onPress={() => setPendingDelete(line)}
                      style={styles.qtyButton}
                      accessibilityLabel={`Delete ${line.name}`}
                    >
                      <Trash2 size={16} color={colors.accent} />
                    </Pressable>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        ) : null}

        <Pressable
          onPress={() => setCartOpen((open) => !open)}
          style={styles.cartBar}
          accessibilityRole="button"
          accessibilityLabel="Toggle cart"
        >
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{cartCount}</Text>
          </View>
          <Text style={styles.cartBarText}>Subtotal {formatInr(cartSubtotal)}</Text>
          {cartOpen ? (
            <ChevronDown size={18} color={colors.textMuted} />
          ) : (
            <ChevronUp size={18} color={colors.textMuted} />
          )}
        </Pressable>

        <View style={styles.actionRow}>
          <Pressable onPress={onFireKot} style={styles.secondaryAction}>
            <Text style={styles.secondaryActionText}>Send KOT to Kitchen</Text>
          </Pressable>
          <Pressable onPress={onOpenCheckout} style={styles.primaryAction}>
            <Text style={styles.primaryActionText}>Direct Settle / Bill</Text>
          </Pressable>
        </View>
      </View>

      <Modal visible={!!customizer} animationType="slide" onRequestClose={() => setCustomizer(null)}>
        <View style={[styles.sheet, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          <View style={styles.sheetHeader}>
            <BackButton onPress={() => setCustomizer(null)} />
            <Text style={styles.sheetTitle}>Kitchen notes</Text>
          </View>
          {customizer ? (
            <ScrollView contentContainerStyle={styles.sheetBody}>
              <FoodImage imageKey={customizer.item.imageKey} size={88} />
              <Text style={styles.itemName}>{customizer.item.name}</Text>
              {customizer.item.isMeal ? (
                <View style={styles.portionRow}>
                  {(['HALF', 'FULL'] as PlatePortion[]).map((portion) => (
                    <Pressable
                      key={portion}
                      onPress={() => setCustomizer({ ...customizer, portion })}
                      style={[
                        styles.portionChip,
                        customizer.portion === portion && styles.portionChipSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.portionText,
                          customizer.portion === portion && styles.portionTextSelected,
                        ]}
                      >
                        {portion === 'HALF' ? 'Half Plate' : 'Full Plate'}{' '}
                        {formatInr(
                          portion === 'HALF'
                            ? customizer.item.halfPlatePrice ?? 0
                            : customizer.item.fullPlatePrice,
                        )}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : (
                <Text style={styles.price}>{formatInr(customizer.item.fullPlatePrice)}</Text>
              )}
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Less sugar, Extra hot, No garlic"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
              />
              <View style={styles.noteChipRow}>
                {NOTE_CHIPS.map((chip) => (
                  <Pressable
                    key={chip}
                    onPress={() => {
                      const parts = notes
                        .split(',')
                        .map((part) => part.trim())
                        .filter(Boolean);
                      setNotes(
                        parts.includes(chip)
                          ? parts.filter((part) => part !== chip).join(', ')
                          : [...parts, chip].join(', '),
                      );
                    }}
                    style={[
                      styles.noteChip,
                      notes.includes(chip) && styles.portionChipSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.portionText,
                        notes.includes(chip) && styles.portionTextSelected,
                      ]}
                    >
                      {chip}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Pressable onPress={confirmAdd} style={styles.primaryAction}>
                <Text style={styles.primaryActionText}>Add to cart</Text>
              </Pressable>
            </ScrollView>
          ) : null}
        </View>
      </Modal>

      <Modal visible={tablePicker} animationType="slide" onRequestClose={() => setTablePicker(false)}>
        <View style={[styles.sheet, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          <View style={styles.sheetHeader}>
            <BackButton onPress={() => setTablePicker(false)} />
            <Text style={styles.sheetTitle}>Select table</Text>
          </View>
          <ScrollView contentContainerStyle={styles.sheetBody}>
            {selectableTables.map((table) => (
              <Pressable
                key={table.id}
                onPress={() => {
                  setActiveTable(table.id);
                  setTablePicker(false);
                  setNotice('');
                }}
                style={styles.pickerRow}
              >
                <Text style={styles.itemName}>{table.name}</Text>
                <Text style={styles.helper}>
                  {table.seats} Seats · {table.status.replace(/_/g, ' ')}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={checkoutOpen} animationType="slide" onRequestClose={() => setCheckoutOpen(false)}>
        <View style={[styles.sheet, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          <View style={styles.sheetHeader}>
            <BackButton onPress={() => setCheckoutOpen(false)} />
            <Text style={styles.sheetTitle}>Checkout</Text>
          </View>
          <ScrollView contentContainerStyle={styles.sheetBody}>
            <Text style={styles.helper}>{activeTable?.name ?? 'No table'} · {checkoutItems.length} lines</Text>
            <View style={styles.totals}>
              <TotalRow label="Subtotal" value={formatInr(breakdown.subtotal)} />
              <TotalRow label={`CGST ${gstConfig.cgstPercent}%`} value={formatInr(breakdown.cgstAmount)} />
              <TotalRow label={`SGST ${gstConfig.sgstPercent}%`} value={formatInr(breakdown.sgstAmount)} />
              <TotalRow label="Total payable" value={formatInr(breakdown.total)} emphasize />
            </View>

            <Text style={styles.sectionLabel}>Tender</Text>
            <View style={styles.tenderRow}>
              {TENDERS.map(({ id, label, Icon }) => {
                const selected = tender === id;
                return (
                  <Pressable
                    key={id}
                    onPress={() => setTender(id)}
                    style={[styles.tenderChip, selected && styles.portionChipSelected]}
                  >
                    <Icon size={18} color={selected ? colors.onAccent : colors.text} />
                    <Text
                      style={[
                        styles.portionText,
                        selected && styles.portionTextSelected,
                      ]}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {tender === 'UPI' ? (
              <View style={styles.upiBox}>
                <UpiQrCode value={upiString} />
                <Text style={styles.helper}>
                  Ask the guest to scan this offline UPI QR, or pay {upiId}. Confirm only after the
                  payment succeeds on their app.
                </Text>
              </View>
            ) : null}

            <Pressable onPress={onConfirmPayment} style={styles.primaryAction}>
              <Text style={styles.primaryActionText}>Confirm Payment</Text>
            </Pressable>
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={!!receipt} animationType="slide" onRequestClose={() => setReceipt(null)}>
        <View style={[styles.sheet, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          <View style={styles.sheetHeader}>
            <BackButton onPress={() => setReceipt(null)} />
            <Text style={styles.sheetTitle}>Bill</Text>
          </View>
          {receipt ? (
            <ScrollView contentContainerStyle={styles.sheetBody}>
              <BillPreview bill={receipt} cafe={cafeProfile} gst={gstConfig} />
              {notice ? <Text style={styles.notice}>{notice}</Text> : null}
              <Pressable
                onPress={() => printReceipt('print')}
                style={styles.primaryAction}
              >
                <Printer size={18} color={colors.onAccent} />
                <Text style={styles.primaryActionText}>Print bill</Text>
              </Pressable>
              <Pressable
                onPress={() => printReceipt('share')}
                disabled={pdfBusy}
                style={[styles.secondaryAction, pdfBusy && styles.submitDisabled]}
              >
                <Share2 size={18} color={colors.text} />
                <Text style={styles.secondaryActionText}>Save / share PDF</Text>
              </Pressable>
            </ScrollView>
          ) : null}
        </View>
      </Modal>

      <BillPdfModal
        visible={pdfOpen}
        bill={receipt}
        cafe={cafeProfile}
        gst={gstConfig}
        sharing={pdfBusy}
        onClose={() => setPdfOpen(false)}
        onShare={() => printReceipt('share')}
      />

      <ConfirmDialog
        visible={pendingDelete !== null}
        title="Delete item?"
        message={
          pendingDelete
            ? `Remove ${pendingDelete.name}${pendingDelete.portion === 'HALF' ? ' (Half)' : ''} from the cart?`
            : ''
        }
        confirmLabel="Delete"
        onBack={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) {
            removeFromCart(pendingDelete.id);
          }
          setPendingDelete(null);
        }}
      />
      <AddDishModal
        visible={addDishOpen}
        categories={categories}
        defaultCategory={category}
        onClose={() => setAddDishOpen(false)}
        onSave={(item) => {
          addMenuItem(item);
          setCategory(item.category);
          setAddDishOpen(false);
          setBanner(`${item.name} added to the menu`);
        }}
      />
    </View>
  );
}

function TotalRow({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <View style={styles.totalRow}>
      <Text style={[styles.helper, emphasize && styles.totalEmphasis]}>{label}</Text>
      <Text style={[styles.itemName, emphasize && styles.totalEmphasis]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  bannerText: {
    color: colors.text,
    fontWeight: '700',
    flex: 1,
  },
  tablePill: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    minHeight: touchTarget,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.accent,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  tableKicker: {
    color: colors.textMuted,
    fontSize: 11,
    textTransform: 'uppercase',
  },
  tableName: {
    color: colors.text,
    fontWeight: '700',
    flex: 1,
  },
  changeLink: {
    color: colors.accent,
    fontWeight: '700',
  },
  searchRow: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
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
  emptySearch: {
    color: colors.textMuted,
    padding: spacing.xl,
  },
  menuControls: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.lg,
  },
  addDishButton: {
    marginHorizontal: spacing.lg,
    minHeight: touchTarget,
    borderRadius: radii.md,
    backgroundColor: colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  addDishText: {
    color: colors.onAccent,
    fontWeight: '800',
  },
  listQty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  categoryScroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  categoryRow: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    alignItems: 'center',
  },
  categoryChip: {
    minHeight: touchTarget,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryChipSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  categoryText: {
    color: colors.textMuted,
    fontWeight: '600',
  },
  categoryTextSelected: {
    color: colors.onAccent,
  },
  notice: {
    color: colors.accent,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 180,
    gap: spacing.sm,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  listRowDisabled: {
    opacity: 0.45,
  },
  listMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  listCopy: {
    flex: 1,
    gap: 4,
  },
  stockHint: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  itemName: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 15,
  },
  price: {
    color: colors.accent,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  portionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  portionChip: {
    minHeight: 36,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
  },
  portionChipSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  portionText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  portionTextSelected: {
    color: colors.onAccent,
  },
  dock: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  cartList: {
    maxHeight: 220,
  },
  cartListContent: {
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  cartLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    alignItems: 'center',
  },
  cartLineInfo: {
    flex: 1,
  },
  cartLineName: {
    color: colors.text,
    fontWeight: '700',
  },
  cartNotes: {
    color: colors.accent,
    fontSize: 12,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  qtyButton: {
    minWidth: touchTarget,
    minHeight: touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyValue: {
    color: colors.text,
    fontWeight: '700',
    minWidth: 20,
    textAlign: 'center',
  },
  cartBar: {
    minHeight: touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  countBadge: {
    minWidth: 28,
    height: 28,
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeText: {
    color: colors.onAccent,
    fontWeight: '700',
  },
  cartBarText: {
    color: colors.text,
    fontWeight: '700',
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  primaryAction: {
    flex: 1,
    minHeight: touchTarget,
    borderRadius: radii.md,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  primaryActionText: {
    color: colors.onAccent,
    fontWeight: '700',
    textAlign: 'center',
  },
  submitDisabled: {
    opacity: 0.55,
  },
  secondaryAction: {
    flex: 1,
    minHeight: touchTarget,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  secondaryActionText: {
    color: colors.text,
    fontWeight: '700',
    textAlign: 'center',
  },
  sheet: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: touchTarget,
  },
  sheetTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
  },
  iconButton: {
    minWidth: touchTarget,
    minHeight: touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetBody: {
    gap: spacing.md,
    paddingBottom: spacing.xxl,
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
  noteChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  noteChip: {
    minHeight: touchTarget,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
  },
  helper: {
    color: colors.textMuted,
    fontSize: 13,
  },
  pickerRow: {
    minHeight: touchTarget,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.lg,
  },
  totals: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalEmphasis: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 16,
  },
  sectionLabel: {
    color: colors.text,
    fontWeight: '700',
  },
  tenderRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tenderChip: {
    flex: 1,
    minHeight: touchTarget,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  upiBox: {
    gap: spacing.md,
    alignItems: 'center',
  },
});
