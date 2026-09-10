import { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  AlertTriangle,
  CheckCircle2,
  ChefHat,
  Clock,
  History,
  Inbox,
  type LucideIcon,
} from 'lucide-react-native';

import FoodImage from '../components/FoodImage';
import { colors, radii, spacing, touchTarget } from '../constants/theme';
import { formatElapsed } from '../lib/format';
import { useTabNav } from '../navigation/TabNavContext';
import { useCafeStore } from '../store/useCafeStore';
import type { CartItem, KOTStatus, KOTTicket } from '../types/cms';

type BoardFilter = 'OPEN' | 'ACTIVE' | 'READY' | 'HISTORY';

const FILTERS: { id: BoardFilter; label: string; Icon: LucideIcon }[] = [
  { id: 'OPEN', label: 'Open Tickets', Icon: ChefHat },
  { id: 'ACTIVE', label: 'In Prep', Icon: Clock },
  { id: 'READY', label: 'Ready for Pickup', Icon: CheckCircle2 },
  { id: 'HISTORY', label: 'History', Icon: History },
];

const STATUS_LABEL: Record<KOTStatus, string> = {
  RECEIVED: 'Received',
  IN_PREP: 'In Prep',
  READY: 'Ready for Pickup',
  COMPLETED: 'Completed',
};

const NEXT_ACTION: Record<KOTStatus, string | null> = {
  RECEIVED: 'In Prep',
  IN_PREP: 'Ready for Pickup',
  READY: 'Complete & Dismiss',
  COMPLETED: null,
};

const STATUS_COLOR: Record<KOTStatus, string> = {
  RECEIVED: colors.accent,
  IN_PREP: colors.accent,
  READY: colors.accent,
  COMPLETED: colors.textMuted,
};

function elapsedMinutes(fromIso: string, now: number) {
  return Math.max(0, Math.floor((now - new Date(fromIso).getTime()) / 60000));
}

function timerTone(minutes: number) {
  if (minutes < 10) {
    return { color: colors.accent, warn: false };
  }
  if (minutes < 15) {
    return { color: colors.accent, warn: false };
  }
  return { color: colors.accent, warn: true };
}

function matchesFilter(ticket: KOTTicket, filter: BoardFilter) {
  if (filter === 'OPEN') {
    return ticket.status !== 'COMPLETED';
  }
  if (filter === 'ACTIVE') {
    return ticket.status === 'RECEIVED' || ticket.status === 'IN_PREP';
  }
  if (filter === 'READY') {
    return ticket.status === 'READY';
  }
  return ticket.status === 'COMPLETED';
}

function portionLabel(portion: CartItem['portion']) {
  return portion === 'HALF' ? 'Half' : 'Full';
}

export default function KDSScreen() {
  const { width } = useWindowDimensions();
  const { navOptions } = useTabNav();
  const tickets = useCafeStore((state) => state.kotTickets);
  const cycleKOTStatus = useCafeStore((state) => state.cycleKOTStatus);
  const toggleKOTItemStruck = useCafeStore((state) => state.toggleKOTItemStruck);

  const [filter, setFilter] = useState<BoardFilter>(navOptions?.kitchenFilter ?? 'ACTIVE');
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const counts = useMemo(
    () => ({
      OPEN: tickets.filter((ticket) => matchesFilter(ticket, 'OPEN')).length,
      ACTIVE: tickets.filter((ticket) => matchesFilter(ticket, 'ACTIVE')).length,
      READY: tickets.filter((ticket) => matchesFilter(ticket, 'READY')).length,
      HISTORY: tickets.filter((ticket) => matchesFilter(ticket, 'HISTORY')).length,
    }),
    [tickets],
  );

  const visible = useMemo(() => {
    const filtered = tickets.filter((ticket) => matchesFilter(ticket, filter));
    if (filter === 'HISTORY') {
      return [...filtered].sort(
        (a, b) =>
          new Date(b.completedAt ?? b.createdAt).getTime() -
          new Date(a.completedAt ?? a.createdAt).getTime(),
      );
    }
    return [...filtered].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }, [tickets, filter]);

  const columns = width >= 720 ? 2 : 1;
  const emptyCopy =
    filter === 'OPEN'
      ? 'No open tickets. New KOTs from POS will land here.'
      : filter === 'ACTIVE'
      ? 'No tickets in prep. New KOTs from POS will land here.'
      : filter === 'READY'
        ? 'Nothing is waiting for pickup.'
        : 'Completed tickets will appear in history.';

  return (
    <View style={styles.screen}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterBar}
        contentContainerStyle={styles.filters}
      >
        {FILTERS.map((entry) => {
          const selected = entry.id === filter;
          return (
            <Pressable
              key={entry.id}
              onPress={() => setFilter(entry.id)}
              style={[styles.filterChip, selected && styles.filterChipSelected]}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={entry.label}
            >
              <entry.Icon
                size={16}
                color={selected ? colors.onAccent : colors.textMuted}
                strokeWidth={2.2}
              />
              <Text style={[styles.filterText, selected && styles.filterTextSelected]}>
                {entry.label} ({counts[entry.id]})
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView
        style={styles.boardScroll}
        contentContainerStyle={[
          styles.board,
          visible.length === 0 && styles.boardEmpty,
          { paddingBottom: spacing.xl },
        ]}
      >
        {visible.length === 0 ? (
          <EmptyBoard
            copy={emptyCopy}
            counts={counts}
            activeFilter={filter}
            onSelectFilter={setFilter}
          />
        ) : (
          visible.map((ticket) => (
            <View
              key={ticket.id}
              style={[styles.cardWrap, { width: columns === 2 ? '50%' : '100%' }]}
            >
              <TicketCard
                ticket={ticket}
                now={now}
                readOnly={ticket.status === 'COMPLETED'}
                onToggleItem={(itemId) => toggleKOTItemStruck(ticket.id, itemId)}
                onAdvance={() => cycleKOTStatus(ticket.id)}
              />
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const FLOW_STEPS: { title: string; detail: string; Icon: LucideIcon }[] = [
  { title: 'Receive', detail: 'New KOTs from POS land as open tickets.', Icon: Inbox },
  { title: 'Prep', detail: 'Strike items as you plate them.', Icon: Clock },
  { title: 'Hand off', detail: 'Mark ready so waiters can pick up.', Icon: CheckCircle2 },
];

function EmptyBoard({
  copy,
  counts,
  activeFilter,
  onSelectFilter,
}: {
  copy: string;
  counts: Record<BoardFilter, number>;
  activeFilter: BoardFilter;
  onSelectFilter: (id: BoardFilter) => void;
}) {
  const elsewhere = FILTERS.filter((entry) => entry.id !== activeFilter && counts[entry.id] > 0);

  return (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyHero}>
        <View style={styles.emptyIcon}>
          <ChefHat size={24} color={colors.accent} strokeWidth={1.8} />
        </View>
        <Text style={styles.emptyTitle}>Kitchen is clear</Text>
        <Text style={styles.emptyCopy}>{copy}</Text>
      </View>

      {elsewhere.length > 0 ? (
        <View style={styles.emptyElsewhere}>
          {elsewhere.map((entry) => (
            <Pressable
              key={entry.id}
              onPress={() => onSelectFilter(entry.id)}
              style={styles.elsewhereChip}
              accessibilityRole="button"
              accessibilityLabel={`Show ${entry.label}`}
            >
              <entry.Icon size={16} color={colors.accent} />
              <Text style={styles.elsewhereText}>
                {counts[entry.id]} in {entry.label.toLowerCase()}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <Text style={styles.emptySection}>Station snapshot</Text>
      <View style={styles.stationGrid}>
        {FILTERS.map((entry) => {
          const selected = entry.id === activeFilter;
          return (
            <Pressable
              key={entry.id}
              onPress={() => onSelectFilter(entry.id)}
              style={[styles.stationTile, selected && styles.stationTileSelected]}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`${entry.label}, ${counts[entry.id]}`}
            >
              <entry.Icon
                size={18}
                color={selected ? colors.onAccent : colors.accent}
                strokeWidth={2.2}
              />
              <Text style={[styles.stationValue, selected && styles.stationValueSelected]}>
                {counts[entry.id]}
              </Text>
              <Text style={[styles.stationLabel, selected && styles.stationLabelSelected]} numberOfLines={1}>
                {entry.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.emptySection}>Ticket flow</Text>
      <View style={styles.flowCard}>
        {FLOW_STEPS.map((step, index) => (
          <View
            key={step.title}
            style={[styles.flowRow, index < FLOW_STEPS.length - 1 && styles.flowRowDivider]}
          >
            <View style={styles.flowIcon}>
              <step.Icon size={18} color={colors.accent} />
            </View>
            <View style={styles.flowCopy}>
              <Text style={styles.flowTitle}>
                {index + 1}. {step.title}
              </Text>
              <Text style={styles.flowDetail}>{step.detail}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.ghostLane}>
        <Text style={styles.ghostCaption}>Board lanes</Text>
        <View style={styles.ghostCard}>
          <View style={styles.ghostBar} />
          <Text style={styles.ghostTitle}>Waiting for KOT</Text>
          <Text style={styles.ghostCopy}>Tickets from POS will appear in this lane.</Text>
        </View>
        <View style={styles.ghostCard}>
          <View style={styles.ghostBar} />
          <Text style={styles.ghostTitle}>Next ticket slot</Text>
          <Text style={styles.ghostCopy}>Keep this board open during service.</Text>
        </View>
      </View>
    </View>
  );
}

function TicketCard({
  ticket,
  now,
  readOnly,
  onToggleItem,
  onAdvance,
}: {
  ticket: KOTTicket;
  now: number;
  readOnly: boolean;
  onToggleItem: (itemId: string) => void;
  onAdvance: () => void;
}) {
  const minutes = elapsedMinutes(ticket.createdAt, now);
  const tone = ticket.status === 'COMPLETED' ? { color: colors.textMuted, warn: false } : timerTone(minutes);
  const nextLabel = NEXT_ACTION[ticket.status];
  const remaining = ticket.items.filter((item) => !ticket.struckItemIds.includes(item.id)).length;
  const statusColor = STATUS_COLOR[ticket.status];

  return (
    <View style={[styles.card, { borderColor: `${statusColor}66` }]}>
      <View style={[styles.statusBar, { backgroundColor: statusColor }]} />

      <View style={styles.cardHead}>
        <View style={styles.headCopy}>
          <Text style={styles.ticketNumber}>#{ticket.ticketNumber}</Text>
          <Text style={styles.tableName}>{ticket.tableName}</Text>
        </View>
        <View style={[styles.timerBadge, { backgroundColor: `${tone.color}22` }]}>
          {tone.warn ? (
            <AlertTriangle size={14} color={tone.color} />
          ) : (
            <Clock size={14} color={tone.color} />
          )}
          <Text style={[styles.timerText, { color: tone.color }]}>
            {ticket.status === 'COMPLETED'
              ? formatElapsed(ticket.completedAt ?? ticket.createdAt, now)
              : formatElapsed(ticket.createdAt, now)}
          </Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={[styles.statusChip, { backgroundColor: `${statusColor}22` }]}>
          <Text style={[styles.statusChipText, { color: statusColor }]}>
            {STATUS_LABEL[ticket.status]}
          </Text>
        </View>
        <Text style={styles.metaCopy}>
          {ticket.items.reduce((sum, item) => sum + item.quantity, 0)} items
          {readOnly ? '' : ` · ${remaining} remaining`}
        </Text>
      </View>

      <View style={styles.itemList}>
        {ticket.items.map((item) => {
          const struck = ticket.struckItemIds.includes(item.id);
          return (
            <Pressable
              key={item.id}
              onPress={() => {
                if (!readOnly) {
                  onToggleItem(item.id);
                }
              }}
              disabled={readOnly}
              style={[styles.itemRow, struck && styles.itemRowStruck]}
              accessibilityRole="button"
              accessibilityState={{ checked: struck, disabled: readOnly }}
              accessibilityLabel={`${item.quantity} ${item.name} ${portionLabel(item.portion)}`}
            >
              <Text style={styles.itemQty}>{item.quantity}×</Text>
              <FoodImage imageKey={item.imageKey} size={40} />
              <View style={styles.itemBody}>
                <Text style={[styles.itemName, struck && styles.itemNameStruck]}>
                  {item.name}
                </Text>
                <Text style={[styles.itemPortion, struck && styles.itemNameStruck]}>
                  {portionLabel(item.portion)} plate
                </Text>
                {item.kitchenNotes ? (
                  <Text style={styles.itemNotes}>{item.kitchenNotes}</Text>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>

      {nextLabel ? (
        <Pressable
          onPress={onAdvance}
          style={[
            styles.advanceButton,
            ticket.status === 'READY' && styles.advanceButtonReady,
          ]}
          accessibilityLabel={nextLabel}
        >
          <Text style={styles.advanceButtonText}>{nextLabel}</Text>
        </Pressable>
      ) : (
        <Text style={styles.dismissed}>Complete & dismissed</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  filterBar: {
    flexGrow: 0,
    flexShrink: 0,
  },
  filters: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
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
    gap: spacing.sm,
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
  boardScroll: {
    flex: 1,
  },
  board: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.sm,
  },
  boardEmpty: {
    flexGrow: 0,
    flexDirection: 'column',
    flexWrap: 'nowrap',
  },
  emptyWrap: {
    width: '100%',
    paddingHorizontal: spacing.sm,
    paddingTop: 0,
    gap: spacing.sm,
  },
  emptyHero: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  emptyCopy: {
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  emptyElsewhere: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  elsewhereChip: {
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
  elsewhereText: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 13,
  },
  emptySection: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginTop: 0,
  },
  stationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  stationTile: {
    width: '48%',
    flexGrow: 1,
    minHeight: 92,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
    gap: 4,
  },
  stationTileSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  stationValue: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
  },
  stationValueSelected: {
    color: colors.onAccent,
  },
  stationLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  stationLabelSelected: {
    color: colors.onAccent,
  },
  flowCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  flowRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  flowRowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  flowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flowCopy: {
    flex: 1,
  },
  flowTitle: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 14,
  },
  flowDetail: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  ghostLane: {
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  ghostCaption: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  ghostCard: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: radii.lg,
    backgroundColor: colors.background,
    padding: spacing.lg,
    minHeight: 96,
  },
  ghostBar: {
    width: 48,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
  },
  ghostTitle: {
    color: colors.textMuted,
    fontWeight: '800',
    fontSize: 15,
  },
  ghostCopy: {
    color: colors.textMuted,
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
  },
  cardWrap: {
    padding: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderRadius: radii.lg,
    overflow: 'hidden',
    padding: spacing.lg,
    minHeight: 220,
  },
  statusBar: {
    height: 4,
    marginHorizontal: -spacing.lg,
    marginTop: -spacing.lg,
    marginBottom: spacing.md,
  },
  cardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  headCopy: {
    flex: 1,
  },
  ticketNumber: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  tableName: {
    color: colors.textMuted,
    fontWeight: '600',
    marginTop: 2,
  },
  timerBadge: {
    minHeight: 32,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timerText: {
    fontWeight: '800',
    fontSize: 13,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statusChip: {
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  metaCopy: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  itemList: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  itemRow: {
    minHeight: touchTarget,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  itemRowStruck: {
    opacity: 0.55,
  },
  itemQty: {
    color: colors.accent,
    fontWeight: '800',
    fontSize: 16,
    minWidth: 28,
    paddingTop: 2,
  },
  itemBody: {
    flex: 1,
  },
  itemName: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 15,
  },
  itemNameStruck: {
    textDecorationLine: 'line-through',
    color: colors.textMuted,
  },
  itemPortion: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  itemNotes: {
    marginTop: 4,
    color: colors.accent,
    backgroundColor: colors.surface,
    alignSelf: 'flex-start',
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    fontWeight: '700',
    fontSize: 12,
  },
  advanceButton: {
    minHeight: touchTarget,
    borderRadius: radii.md,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  advanceButtonReady: {
    backgroundColor: colors.accent,
  },
  advanceButtonText: {
    color: colors.onAccent,
    fontWeight: '800',
  },
  dismissed: {
    color: colors.textMuted,
    textAlign: 'center',
    fontWeight: '600',
    paddingVertical: spacing.sm,
  },
});
