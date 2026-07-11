import { useState } from 'react';
import { Coffee, Sticker, Gamepad2, Shirt, Gift, ClipboardList, Map, Flag, Trophy, Star } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useGetMyPointsQuery, useRedeemRewardMutation } from '../store/api/arApi';
import type { Reward } from '../store/api/arApi';

interface ApiErrorResponse {
  data?: { error?: string };
}

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div
    className={`bg-white/70 dark:bg-black/60 backdrop-blur-2xl rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.4)] border border-white/50 dark:border-white/10 ${className}`}
  >
    {children}
  </div>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-3">{children}</h2>
);

const SOURCE_ICONS: Record<string, LucideIcon> = {
  quiz: ClipboardList,
  side_quest: Map,
  milestone: Flag,
  place_complete: Trophy,
  redeem: Gift,
};

const REWARD_ICONS: Record<string, LucideIcon> = {
  'canteen-tea': Coffee,
  'sticker-pack': Sticker,
  'table-tennis': Gamepad2,
  'orchid-tee': Shirt,
};

const rewardIcon = (id: string): LucideIcon => REWARD_ICONS[id] ?? Gift;

const RedeemPage = () => {
  const { data, isLoading } = useGetMyPointsQuery();
  const [redeemReward, { isLoading: redeeming }] = useRedeemRewardMutation();
  const [confirming, setConfirming] = useState<Reward | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const total = data?.total ?? 0;
  const rewards = data?.rewards ?? [];
  const entries = data?.entries ?? [];

  const handleRedeem = async (reward: Reward) => {
    try {
      const result = await redeemReward(reward.id).unwrap();
      setToast(`${result.message}! New balance: ${result.total}`);
    } catch (e) {
      setToast((e as ApiErrorResponse).data?.error ?? 'Could not redeem — try again.');
    }
    setConfirming(null);
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <div className="max-w-md mx-auto px-5 pt-10 pb-32">
      <header className="mb-6">
        <p className="text-sm text-stone-500 dark:text-stone-400">Redeem</p>
        <h1 className="text-2xl font-bold text-stone-900 dark:text-white">AR points</h1>
      </header>

      {/* Balance hero — private to the owner */}
      <div className="rounded-2xl bg-gradient-to-br from-crimson-500 to-crimson-700 text-white shadow-lg shadow-crimson-500/30 p-6 text-center mb-8">
        <p className="text-4xl font-bold tabular-nums">{isLoading ? '…' : total}</p>
        <p className="text-xs font-semibold uppercase tracking-wide opacity-90 mt-1">AR points available</p>
        <p className="text-[11px] opacity-75 mt-2">Earn more from milestones, side quests, quizzes and completed trips.</p>
      </div>

      {toast && (
        <div className="mb-5 px-4 py-3 rounded-2xl bg-navy-50 dark:bg-navy-500/25 border border-navy-100 dark:border-navy-500/30 text-sm text-navy-600 dark:text-navy-200 text-center">
          {toast}
        </div>
      )}

      {/* Rewards catalog */}
      <section className="mb-8">
        <SectionTitle>Rewards</SectionTitle>
        <Card className="divide-y divide-stone-100 dark:divide-white/5">
          {rewards.map((r) => {
            const affordable = total >= r.cost;
            const RewardIcon = rewardIcon(r.id);
            return (
              <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                <span className="shrink-0 w-10 h-10 rounded-full bg-stone-100 dark:bg-white/5 flex items-center justify-center text-stone-500 dark:text-stone-300">
                  <RewardIcon className="w-5 h-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-stone-900 dark:text-white truncate">{r.name}</p>
                  <p className="text-xs text-stone-500 dark:text-stone-400 truncate">{r.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirming(r)}
                  disabled={!affordable || redeeming}
                  className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold active:scale-95 transition-transform ${
                    affordable
                      ? 'bg-gradient-to-r from-crimson-500 to-crimson-700 text-white shadow shadow-crimson-500/30'
                      : 'bg-stone-100 dark:bg-white/5 text-stone-400 dark:text-stone-500'
                  } disabled:pointer-events-none`}
                >
                  {r.cost} pts
                </button>
              </div>
            );
          })}
        </Card>
      </section>

      {/* Ledger */}
      <section>
        <SectionTitle>History</SectionTitle>
        {entries.length > 0 ? (
          <Card className="divide-y divide-stone-100 dark:divide-white/5">
            {entries.map((e) => {
              const SourceIcon = SOURCE_ICONS[e.source] ?? Star;
              return (
              <div key={`${e.source}-${e.ref_id}`} className="flex items-center gap-3 px-4 py-3">
                <span className="shrink-0 w-9 h-9 rounded-full bg-stone-100 dark:bg-white/5 flex items-center justify-center text-stone-500 dark:text-stone-300">
                  <SourceIcon className="w-4 h-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-stone-900 dark:text-white truncate">{e.label}</p>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    {new Date(e.earned_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <span
                  className={`shrink-0 text-sm font-bold tabular-nums ${
                    e.points >= 0 ? 'text-navy-500 dark:text-navy-200' : 'text-crimson-600 dark:text-crimson-400'
                  }`}
                >
                  {e.points >= 0 ? `+${e.points}` : e.points}
                </span>
              </div>
              );
            })}
          </Card>
        ) : (
          <Card className="p-6 text-center">
            <p className="text-sm text-stone-500 dark:text-stone-400">
              No AR points yet — visit checkpoints on a trip to start earning.
            </p>
          </Card>
        )}
      </section>

      {/* Redeem confirmation */}
      {confirming && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 backdrop-blur-sm" onClick={() => setConfirming(null)}>
          <div
            className="w-full max-w-md bg-white/95 dark:bg-[#1E1A14]/95 backdrop-blur-2xl rounded-t-3xl shadow-[0_-8px_40px_rgba(0,0,0,0.3)] border-t border-white/50 dark:border-white/10 px-6 pt-3 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full bg-stone-300 dark:bg-white/20 mx-auto mb-5" />
            <span className="inline-flex w-14 h-14 rounded-full bg-stone-100 dark:bg-white/5 items-center justify-center text-crimson-500 dark:text-crimson-400">
              {(() => {
                const ConfirmIcon = rewardIcon(confirming.id);
                return <ConfirmIcon className="w-7 h-7" />;
              })()}
            </span>
            <h3 className="text-lg font-bold text-stone-900 dark:text-white mt-2 mb-1">{confirming.name}</h3>
            <p className="text-sm text-stone-500 dark:text-stone-400 mb-5">
              Spend <span className="font-semibold text-crimson-600 dark:text-crimson-400">{confirming.cost} AR points</span>?
              You'll have {total - confirming.cost} left.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirming(null)}
                disabled={redeeming}
                className="flex-1 py-2.5 rounded-full border border-stone-300 dark:border-white/15 text-stone-700 dark:text-stone-300 text-sm font-semibold active:scale-95 transition-transform disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleRedeem(confirming)}
                disabled={redeeming}
                className="flex-1 py-2.5 rounded-full bg-gradient-to-r from-crimson-500 to-crimson-700 text-white text-sm font-semibold shadow-lg shadow-crimson-500/30 active:scale-95 transition-transform disabled:opacity-60"
              >
                {redeeming ? 'Redeeming…' : 'Redeem'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RedeemPage;
