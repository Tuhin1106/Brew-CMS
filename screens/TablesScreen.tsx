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
  CheckCircle2,
  Clock,
  Link2,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  type LucideIcon,
} from 'lucide-react-native';

import BackButton from '../components/BackButton';
import { colors, radii, spacing, touchTarget } from '../constants/theme';
import { formatElapsed, formatInr } from '../lib/format';
import { useTabNav } from '../navigation/TabNavContext';
import { useCafeStore } from '../store/useCafeStore';
import type { KOTTicket, Table, TableStatus } from '../types/cms';

type StatusFilter = 'ALL' | TableStatus;
type Sheet =
  | { kind: 'detail'; tableId: string }
  | { kind: 'form'; tableId?: string };

const FILTERS: { id: StatusFilter; label: string }[] = [
  { id: 'ALL', label: 'All' },
  { id: 'AVAILABLE', label: 'Available' },
  { id: 'OCCUPIED', label: 'Occupied' },
  { id: 'NEEDS_CLEANING', label: 'Need reset' },
];

const SEAT_OPTIONS = [2, 3, 4, 6];

const STATUS_META: Record<
  TableStatus,
  { label: string; color: string; Icon: LucideIcon }
> = {
  AVAILABLE: { label: 'Available', color: colors.tableAvailable, Icon: CheckCircle2 },
  OCCUPIED: { label: 'Occupied', color: colors.tableOccupied, Icon: Clock },
  NEEDS_CLEANING: { label: 'Need reset', color: colors.tableReset, Icon: Sparkles },
};

const KOT_LABELS: Record<KOTTicket['status'], string> = {
  RECEIVED: 'Received',
  IN_PREP: 'In Prep',
  READY: 'Ready',
  COMPLETED: 'Completed',
};

export default function TablesScreen() {
  const insets = useAppInsets();
  const { navigate, navOptions } = useTabNav();
  const tables = useCafeStore((state) => state.tables);
  const tickets = useCafeStore((state) => state.kotTickets);
  const setActiveTable = useCafeStore((state) => state.setActiveTable);
  const markTableClean = useCafeStore((state) => state.markTableClean);
  const addTable = useCafeStore((state) => state.addTable);
  const updateTable = useCafeStore((state) => state.updateTable);
  const deleteTable = useCafeStore((state) => state.deleteTable);

  const [filter, setFilter] = useState<StatusFilter>(navOptions?.floorFilter ?? 'ALL');
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [now, setNow] = useState(Date.now());
  const [formName, setFormName] = useState('');
  const [formSeats, setFormSeats] = useState(4);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const filtered = useMemo(
    () => tables.filter((table) => (filter === 'ALL' ? true : table.status === filter)),
    [tables, filter],
  );

  const selectedTable = tables.find(
    (table) => sheet && 'tableId' in sheet && sheet.tableId === table.id,
  );

  const openPos = (tableId: string, settle = false) => {
    setActiveTable(tableId);
    setSheet(null);
    navigate('POS', settle ? { posAction: 'settle' } : undefined);
  };

  const openAdd = () => {
    const nextNumber = tables.length + 1;
    setFormName(`Table ${nextNumber}`);
    setFormSeats(4);
    setNotice('');
    setSheet({ kind: 'form' });
  };

  const openEdit = (table: Table) => {
    setFormName(table.name);
    setFormSeats(table.seats);
    setNotice('');
    setSheet({ kind: 'form', tableId: table.id });
  };

  const saveForm = () => {
    const name = formName.trim();
    if (!name) {
      setNotice('Enter a table name.');
      return;
    }
    if (sheet?.kind === 'form' && sheet.tableId) {
      updateTable(sheet.tableId, { name, seats: formSeats });
      setSheet({ kind: 'detail', tableId: sheet.tableId });
      return;
    }
    addTable(name, formSeats);
    setSheet(null);
  };

  const removeTable = (table: Table) => {
    const ok = deleteTable(table.id);
    if (!ok) {
      setNotice('Occupied tables cannot be deleted.');
      return;
    }
    setSheet(null);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.toolbar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {FILTERS.map((item) => {
            const selected = item.id === filter;
            const count =
              item.id === 'ALL'
                ? tables.length
                : tables.filter((table) => table.status === item.id).length;
            return (
              <Pressable
                key={item.id}
                onPress={() => setFilter(item.id)}
                style={[styles.filterChip, selected && styles.filterChipSelected]}
                accessibilityRole="button"
                accessibilityState={{ selected }}
              >
                {item.id !== 'ALL' ? (
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: selected ? colors.onAccent : STATUS_META[item.id].color },
                    ]}
                  />
                ) : null}
                <Text style={[styles.filterText, selected && styles.filterTextSelected]}>
                  {item.label} · {count}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
        <Pressable
          onPress={openAdd}
          style={styles.addButton}
          accessibilityRole="button"
          accessibilityLabel="Add table"
        >
          <Plus size={18} color={colors.onAccent} />
          <Text style={styles.addButtonText}>Add Table</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.grid}>
        {filtered.length === 0 ? (
          <Text style={styles.empty}>No tables match this filter.</Text>
        ) : (
          filtered.map((table) => {
            const meta = STATUS_META[table.status];
            const StatusIcon = meta.Icon;
            const linked = tables.find((entry) => entry.id === table.mergedIntoTableId);
            return (
              <View key={table.id} style={styles.cardWrap}>
                <Pressable
                  onPress={() => {
                    setNotice('');
                    setSheet({ kind: 'detail', tableId: table.id });
                  }}
                  style={[styles.card, { borderColor: meta.color }]}
                  accessibilityRole="button"
                  accessibilityLabel={`${table.name}, ${meta.label}`}
                >
                  <View style={styles.cardTop}>
                    <Text style={styles.tableName}>{table.name}</Text>
                    <View style={styles.seatBadge}>
                      <Text style={styles.seatText}>{table.seats} Seats</Text>
                    </View>
                  </View>
                  <View style={[styles.statusRow, { backgroundColor: `${meta.color}22` }]}>
                    <View style={[styles.statusDot, { backgroundColor: meta.color }]} />
                    <StatusIcon size={16} color={meta.color} />
                    <Text style={[styles.statusText, { color: meta.color }]}>
                      {table.status === 'OCCUPIED'
                        ? `${meta.label} · ${formatElapsed(table.occupiedAt, now)}`
                        : meta.label}
                    </Text>
                  </View>
                  {linked ? (
                    <View style={styles.linkRow}>
                      <Link2 size={14} color={colors.textMuted} />
                      <Text style={styles.linkText}>Linked to {linked.name}</Text>
                    </View>
                  ) : null}
                  {table.mergedTableIds.length > 0 ? (
                    <Text style={styles.linkText}>
                      Merged with {table.mergedTableIds.length} table
                      {table.mergedTableIds.length === 1 ? '' : 's'}
                    </Text>
                  ) : null}
                </Pressable>
              </View>
            );
          })
        )}
      </ScrollView>

      <Modal
        visible={sheet !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSheet(null)}
      >
        <View style={[styles.sheet, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          <View style={styles.sheetHeader}>
            <BackButton
              onPress={() => {
                if (sheet?.kind === 'form' && sheet.tableId) {
                  setSheet({ kind: 'detail', tableId: sheet.tableId });
                  return;
                }
                setSheet(null);
              }}
            />
            <Text style={styles.sheetTitle}>
              {sheet?.kind === 'form'
                ? sheet.tableId
                  ? 'Edit Table'
                  : 'Add Table'
                : selectedTable?.name ?? 'Table'}
            </Text>
          </View>

          {sheet?.kind === 'detail' && selectedTable ? (
            <TableDetail
              table={selectedTable}
              tables={tables}
              tickets={tickets}
              now={now}
              notice={notice}
              onEdit={() => openEdit(selectedTable)}
              onDelete={() => removeTable(selectedTable)}
              onCreateOrder={() =>
                openPos(selectedTable.mergedIntoTableId ?? selectedTable.id)
              }
              onSettle={() =>
                openPos(selectedTable.mergedIntoTableId ?? selectedTable.id, true)
              }
              onClean={() => {
                markTableClean(selectedTable.id);
                setSheet(null);
              }}
            />
          ) : null}

          {sheet?.kind === 'form' ? (
            <View style={styles.sheetBody}>
              <Text style={styles.label}>Table name</Text>
              <TextInput
                value={formName}
                onChangeText={(value) => {
                  setFormName(value);
                  setNotice('');
                }}
                placeholder="Table 9"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
              />
              <Text style={styles.label}>Seat capacity</Text>
              <View style={styles.seatRow}>
                {SEAT_OPTIONS.map((seats) => {
                  const selected = seats === formSeats;
                  return (
                    <Pressable
                      key={seats}
                      onPress={() => setFormSeats(seats)}
                      style={[styles.seatChip, selected && styles.seatChipSelected]}
                    >
                      <Text style={[styles.seatChipText, selected && styles.seatChipTextSelected]}>
                        {seats}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {notice ? <Text style={styles.notice}>{notice}</Text> : null}
              <Pressable onPress={saveForm} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>
                  {sheet.tableId ? 'Save changes' : 'Add table'}
                </Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </Modal>
    </View>
  );
}

function TableDetail({
  table,
  tables,
  tickets,
  now,
  notice,
  onEdit,
  onDelete,
  onCreateOrder,
  onSettle,
  onClean,
}: {
  table: Table;
  tables: Table[];
  tickets: KOTTicket[];
  now: number;
  notice: string;
  onEdit: () => void;
  onDelete: () => void;
  onCreateOrder: () => void;
  onSettle: () => void;
  onClean: () => void;
}) {
  const meta = STATUS_META[table.status];
  const orderTableId = table.mergedIntoTableId ?? table.id;
  const activeTickets = tickets.filter(
    (ticket) => ticket.tableId === orderTableId && ticket.status !== 'COMPLETED',
  );
  const linkedParent = tables.find((entry) => entry.id === table.mergedIntoTableId);
  const mergedNames = tables
    .filter((entry) => table.mergedTableIds.includes(entry.id))
    .map((entry) => entry.name)
    .join(', ');

  return (
    <ScrollView contentContainerStyle={styles.sheetBody}>
      <View style={styles.detailMeta}>
        <View style={[styles.statusRow, { backgroundColor: `${meta.color}22` }]}>
          <View style={[styles.statusDot, { backgroundColor: meta.color }]} />
          <meta.Icon size={16} color={meta.color} />
          <Text style={[styles.statusText, { color: meta.color }]}>
            {table.status === 'OCCUPIED'
              ? `${meta.label} · ${formatElapsed(table.occupiedAt, now)}`
              : meta.label}
          </Text>
        </View>
        <View style={styles.seatBadge}>
          <Text style={styles.seatText}>{table.seats} Seats</Text>
        </View>
      </View>

      {linkedParent ? (
        <Text style={styles.helper}>This table is linked to {linkedParent.name}.</Text>
      ) : null}
      {mergedNames ? <Text style={styles.helper}>Merged with {mergedNames}.</Text> : null}

      <View style={styles.iconRow}>
        <Pressable onPress={onEdit} style={styles.secondaryButton} accessibilityLabel="Edit table">
          <Pencil size={16} color={colors.text} />
          <Text style={styles.secondaryButtonText}>Edit</Text>
        </Pressable>
        <Pressable
          onPress={onDelete}
          style={[styles.secondaryButton, styles.dangerOutline]}
          accessibilityLabel="Delete table"
        >
          <Trash2 size={16} color={colors.accent} />
          <Text style={[styles.secondaryButtonText, { color: colors.accent }]}>Delete</Text>
        </Pressable>
      </View>

      {table.status === 'AVAILABLE' ? (
        <Pressable onPress={onCreateOrder} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Create New Order</Text>
        </Pressable>
      ) : null}

      {table.status === 'NEEDS_CLEANING' ? (
        <Pressable onPress={onClean} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Mark Clean & Ready</Text>
        </Pressable>
      ) : null}

      {table.status === 'OCCUPIED' ? (
        <View style={styles.occupiedBlock}>
          <Text style={styles.sectionTitle}>Active ticket preview</Text>
          {activeTickets.length === 0 ? (
            <Text style={styles.helper}>No kitchen tickets yet. Add items from POS.</Text>
          ) : (
            activeTickets.map((ticket) => (
              <View key={ticket.id} style={styles.ticket}>
                <Text style={styles.ticketHead}>
                  #{ticket.ticketNumber} · {KOT_LABELS[ticket.status]}
                </Text>
                {ticket.items.map((item) => (
                  <Text key={item.id} style={styles.ticketLine}>
                    {item.quantity}× {item.name}
                    {item.portion === 'HALF' ? ' (Half)' : ''}
                    {item.kitchenNotes ? ` — ${item.kitchenNotes}` : ''} · {formatInr(item.unitPrice)}
                  </Text>
                ))}
              </View>
            ))
          )}
          <Pressable onPress={onCreateOrder} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Add More Items</Text>
          </Pressable>
          <Pressable onPress={onSettle} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Proceed to Settle Bill</Text>
          </Pressable>
        </View>
      ) : null}

      {notice ? <Text style={styles.notice}>{notice}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  toolbar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  filters: {
    gap: spacing.sm,
    paddingRight: spacing.sm,
    alignItems: 'center',
  },
  filterChip: {
    minHeight: touchTarget,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
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
  addButton: {
    minHeight: touchTarget,
    borderRadius: radii.md,
    backgroundColor: colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  addButtonText: {
    color: colors.onAccent,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.xl,
  },
  empty: {
    color: colors.textMuted,
    padding: spacing.xl,
  },
  cardWrap: {
    width: '50%',
    padding: spacing.sm,
  },
  card: {
    borderWidth: 1,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    padding: spacing.md,
    minHeight: 128,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tableName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  seatBadge: {
    backgroundColor: colors.background,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  seatText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  statusText: {
    fontWeight: '700',
    fontSize: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
  },
  linkText: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: spacing.sm,
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
    flex: 1,
  },
  iconButton: {
    minWidth: touchTarget,
    minHeight: touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetBody: {
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  detailMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  helper: {
    color: colors.textMuted,
    fontSize: 13,
  },
  iconRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  occupiedBlock: {
    gap: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 16,
  },
  ticket: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.lg,
    gap: 6,
  },
  ticketHead: {
    color: colors.accent,
    fontWeight: '700',
    marginBottom: 4,
  },
  ticketLine: {
    color: colors.text,
    fontSize: 14,
  },
  label: {
    color: colors.text,
    fontWeight: '600',
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
  seatRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  seatChip: {
    flex: 1,
    minHeight: touchTarget,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seatChipSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  seatChipText: {
    color: colors.textMuted,
    fontWeight: '700',
  },
  seatChipTextSelected: {
    color: colors.onAccent,
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
    fontWeight: '700',
    fontSize: 16,
  },
  secondaryButton: {
    minHeight: touchTarget,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    flex: 1,
  },
  secondaryButtonText: {
    color: colors.text,
    fontWeight: '700',
  },
  dangerOutline: {
    borderColor: colors.accent,
  },
  notice: {
    color: colors.accent,
  },
});
