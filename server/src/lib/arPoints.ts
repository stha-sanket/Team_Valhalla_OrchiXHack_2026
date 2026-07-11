import { ArPoints } from '../model/ArPoints.js';
import type { ArPointsEntry } from '../model/ArPoints.js';

/** AR points per number of correct quiz answers (index = correct count out of 5). */
export const QUIZ_POINTS_BY_CORRECT = [0, 10, 20, 25, 30, 35] as const;
export const SIDE_QUEST_POINTS = 25;
export const MILESTONE_POINTS = 10;
/** Awarded once per place when every checkpoint of its route has been visited. */
export const PLACE_COMPLETE_POINTS = 20;

export interface Reward {
  id: string;
  name: string;
  description: string;
  cost: number;
}

/** What AR points can be redeemed for. Virtual catalog — fulfilment is manual.
 * The client maps each id to an icon, so no visuals live here. */
export const REWARDS: Reward[] = [
  { id: 'canteen-tea', name: 'Canteen tea voucher', description: 'A free cup of tea at the campus canteen.', cost: 30 },
  { id: 'sticker-pack', name: 'Orchid sticker pack', description: 'Limited-edition Orchid campus stickers.', cost: 60 },
  { id: 'table-tennis', name: 'Table tennis session', description: '30 minutes at the table tennis table.', cost: 90 },
  { id: 'orchid-tee', name: 'Orchid T-shirt', description: 'An official Orchid College tee.', cost: 250 },
];

export async function getOrCreateLedger(userId: string) {
  const existing = await ArPoints.findOne({ user_id: userId });
  if (existing) return existing;
  return ArPoints.create({ user_id: userId, total: 0, entries: [] });
}

/**
 * Append a ledger entry and bump the total. Idempotent per (source, ref_id):
 * returns the points awarded, or null if this exact thing was already rewarded.
 */
export async function awardPoints(
  userId: string,
  entry: Omit<ArPointsEntry, 'earned_at'>,
): Promise<number | null> {
  const ledger = await getOrCreateLedger(userId);

  const alreadyAwarded = ledger.entries.some((e) => e.source === entry.source && e.ref_id === entry.ref_id);
  if (alreadyAwarded) return null;

  await ArPoints.update(ledger.id, {
    total: ledger.total + entry.points,
    entries: [...ledger.entries, { ...entry, earned_at: new Date().toISOString() }],
  });
  return entry.points;
}

/**
 * Deduct a reward's cost from the balance. Unlike awards, redemptions can
 * repeat — each gets a unique ref so the ledger keeps every one.
 */
export async function spendPoints(
  userId: string,
  reward: Reward,
): Promise<{ ok: true; total: number } | { ok: false; error: string }> {
  const ledger = await getOrCreateLedger(userId);
  if (ledger.total < reward.cost) {
    return { ok: false, error: `Not enough AR points — you need ${reward.cost} but have ${ledger.total}.` };
  }

  const total = ledger.total - reward.cost;
  await ArPoints.update(ledger.id, {
    total,
    entries: [
      ...ledger.entries,
      {
        source: 'redeem' as const,
        ref_id: `${reward.id}:${ledger.entries.length}`,
        label: `Redeemed ${reward.name}`,
        points: -reward.cost,
        earned_at: new Date().toISOString(),
      },
    ],
  });
  return { ok: true, total };
}
