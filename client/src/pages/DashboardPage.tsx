import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetMeQuery } from '../store/api/authApi';
import { useGetProgressSummaryQuery } from '../store/api/userProgressApi';
import { useGetMyPointsQuery } from '../store/api/arApi';
import { Lock } from 'lucide-react';
import type { TripSummary } from '../store/api/userProgressApi';

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};

const FlagIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2z" />
  </svg>
);

const CheckIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
  </svg>
);

const MedalIcon = ({ className = 'w-8 h-8' }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <circle cx="12" cy="9" r="6" strokeWidth={2} />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14.5L7 21l5-2.5L17 21l-2-6.5M10 9l1.5 1.5L14.5 7" />
  </svg>
);

/** Progress bar with milestone markers pinned along the track. */
const TripProgressBar = ({ trip }: { trip: TripSummary }) => {
  const percent = trip.total_points > 0 ? Math.round((trip.visited_points / trip.total_points) * 100) : 0;

  const markerPosition = (index: number) => {
    if (trip.total_points <= 1) return 92;
    const raw = ((index + 1) / trip.total_points) * 100;
    return Math.min(Math.max(raw, 8), 92);
  };

  return (
    <div>
      <div className="relative h-3 rounded-full bg-stone-200 dark:bg-white/10">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-crimson-500 to-crimson-700 transition-[width] duration-700"
          style={{ width: `${percent}%` }}
        />
        {trip.milestones.map((m) => (
          <div
            key={m.id}
            className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
              m.visited
                ? 'bg-navy-500 border-white dark:border-[#17140F] text-white'
                : 'bg-stone-100 dark:bg-stone-700 border-stone-300 dark:border-stone-500'
            }`}
            style={{ left: `${markerPosition(m.index)}%` }}
            title={m.name}
          >
            {m.visited && <CheckIcon className="w-2.5 h-2.5" />}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-2">
        <p className="text-xs text-stone-500 dark:text-stone-400">
          {trip.visited_points} of {trip.total_points} stops visited
        </p>
        <p className="text-xs font-semibold text-crimson-600 dark:text-crimson-400">{percent}%</p>
      </div>
    </div>
  );
};

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

const DashboardPage = () => {
  const navigate = useNavigate();
  const { data: me } = useGetMeQuery();
  const { data: summary, isLoading } = useGetProgressSummaryQuery();
  const { data: points } = useGetMyPointsQuery();
  const [selectedBadge, setSelectedBadge] = useState<TripSummary | null>(null);

  const trips = summary?.trips ?? [];
  // Completed trips live on the Explore page (revisit / quiz); the dashboard
  // spotlights the newest trip that still has stops left.
  const recentTrip = trips.find((t) => t.total_points === 0 || t.visited_points < t.total_points);
  const allTripsCompleted = !recentTrip && trips.length > 0;
  const milestones = trips.flatMap((t) => t.milestones.map((m) => ({ ...m, placeName: t.place.name })));
  const achievedCount = milestones.filter((m) => m.visited).length;
  const earnedBadges = trips.filter((t) => t.badge_earned);
  const displayName = summary?.user?.name ?? me?.user.email ?? 'Explorer';

  return (
    <div className="max-w-md mx-auto px-5 pt-10 pb-32">
      {/* Welcome header */}
      <header className="flex items-center gap-4 mb-8">
        {summary?.user?.avatar ? (
          <img src={summary.user.avatar} alt={displayName} className="w-14 h-14 rounded-full object-cover border-2 border-crimson-500/40" />
        ) : (
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-crimson-400 to-crimson-600 flex items-center justify-center text-white text-xl font-bold">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm text-stone-500 dark:text-stone-400">{greeting()},</p>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-white truncate">{displayName}</h1>
        </div>
        {/* AR points are private — only the owner ever sees this. */}
        <div className="shrink-0 text-center px-3 py-1.5 rounded-2xl bg-gradient-to-br from-crimson-500 to-crimson-700 text-white shadow-lg shadow-crimson-500/30">
          <p className="text-lg font-bold leading-tight tabular-nums">{points?.total ?? 0}</p>
          <p className="text-[9px] font-semibold uppercase tracking-wide opacity-90">AR points</p>
        </div>
      </header>

      {isLoading ? (
        <div className="space-y-4">
          <div className="h-36 rounded-2xl bg-stone-200/60 dark:bg-white/5 animate-pulse" />
          <div className="h-24 rounded-2xl bg-stone-200/60 dark:bg-white/5 animate-pulse" />
          <div className="h-24 rounded-2xl bg-stone-200/60 dark:bg-white/5 animate-pulse" />
        </div>
      ) : (
        <>
          {/* Recent trip */}
          <section className="mb-8">
            <SectionTitle>Recent trip</SectionTitle>
            {recentTrip ? (
              <Card className="p-5">
                <div className="flex items-start justify-between gap-3 mb-1">
                  <h3 className="text-lg font-bold text-stone-900 dark:text-white">{recentTrip.place.name}</h3>
                  {recentTrip.badge_earned && (
                    <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-full bg-navy-50 dark:bg-navy-500/25 text-navy-500 dark:text-navy-200">
                      Badge earned
                    </span>
                  )}
                </div>
                <p className="text-sm text-stone-500 dark:text-stone-400 line-clamp-2 mb-4">{recentTrip.place.description}</p>
                <TripProgressBar trip={recentTrip} />
                {recentTrip.total_points > 0 && recentTrip.visited_points === recentTrip.total_points ? (
                  <button
                    onClick={() => navigate(`/quiz/${recentTrip.place.id}`)}
                    className="w-full mt-4 py-2.5 rounded-full border border-crimson-500/40 text-crimson-600 dark:text-crimson-400 text-sm font-semibold active:scale-95 transition-transform"
                  >
                    Take the quiz · earn AR points
                  </button>
                ) : (
                  <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-stone-400 dark:text-stone-500">
                    <Lock className="w-3.5 h-3.5" /> Finish the trip to unlock the quiz
                  </p>
                )}
              </Card>
            ) : (
              <Card className="p-6 text-center">
                <p className="text-sm text-stone-500 dark:text-stone-400 mb-4">
                  {allTripsCompleted
                    ? 'All trips completed — revisit a place or take its quiz from Explore!'
                    : 'No trips yet — your next adventure awaits.'}
                </p>
                <button
                  onClick={() => navigate('/explore')}
                  className="px-5 py-2.5 rounded-full bg-gradient-to-r from-crimson-500 to-crimson-700 text-white text-sm font-semibold active:scale-95 transition-transform"
                >
                  {allTripsCompleted ? 'Go to Explore' : 'Start exploring'}
                </button>
              </Card>
            )}
          </section>

          {/* Milestone achievements */}
          <section className="mb-8">
            <SectionTitle>
              Milestones {milestones.length > 0 && `· ${achievedCount}/${milestones.length}`}
            </SectionTitle>
            {milestones.length > 0 ? (
              <Card className="divide-y divide-stone-100 dark:divide-white/5">
                {milestones.map((m) => (
                  <div key={m.id} className={`flex items-center gap-3 px-4 py-3 ${m.visited ? '' : 'opacity-45'}`}>
                    <div
                      className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${
                        m.visited
                          ? 'bg-navy-50 dark:bg-navy-500/25 text-navy-500 dark:text-navy-200'
                          : 'bg-stone-100 dark:bg-white/5 text-stone-400'
                      }`}
                    >
                      <FlagIcon />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-stone-900 dark:text-white truncate">{m.name}</p>
                      <p className="text-xs text-stone-500 dark:text-stone-400 truncate">{m.placeName}</p>
                    </div>
                    {m.visited && (
                      <div className="shrink-0 w-6 h-6 rounded-full bg-navy-500 text-white flex items-center justify-center">
                        <CheckIcon className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                ))}
              </Card>
            ) : (
              <Card className="p-6 text-center">
                <p className="text-sm text-stone-500 dark:text-stone-400">Milestones you reach on your trips will show up here.</p>
              </Card>
            )}
          </section>

          {/* Earned badges */}
          <section>
            <SectionTitle>Earned badges</SectionTitle>
            {earnedBadges.length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {earnedBadges.map((t) => (
                  <button
                    key={t.place.id}
                    type="button"
                    onClick={() => setSelectedBadge(t)}
                    aria-label={`${t.place.name} badge details`}
                    className="flex items-center justify-center active:scale-95 transition-transform"
                  >
                    {t.place.badge ? (
                      <img src={t.place.badge} alt={`${t.place.name} badge`} className="w-20 h-20 object-contain" />
                    ) : (
                      <MedalIcon className="w-16 h-16 text-crimson-500" />
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <Card className="p-6 text-center">
                <MedalIcon className="w-8 h-8 mx-auto mb-2 text-stone-300 dark:text-stone-600" />
                <p className="text-sm text-stone-500 dark:text-stone-400">Complete every milestone on a trip to earn its badge.</p>
              </Card>
            )}
          </section>
        </>
      )}

      {/* Badge details */}
      {selectedBadge && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setSelectedBadge(null)}
        >
          <div
            className="w-full max-w-md bg-white/95 dark:bg-[#1E1A14]/95 backdrop-blur-2xl rounded-t-3xl shadow-[0_-8px_40px_rgba(0,0,0,0.3)] border-t border-white/50 dark:border-white/10 px-6 pt-3 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full bg-stone-300 dark:bg-white/20 mx-auto mb-5" />
            {selectedBadge.place.badge ? (
              <img
                src={selectedBadge.place.badge}
                alt={`${selectedBadge.place.name} badge`}
                className="w-28 h-28 object-contain mx-auto mb-4"
              />
            ) : (
              <MedalIcon className="w-24 h-24 mx-auto mb-4 text-crimson-500" />
            )}
            <span className="inline-block text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full bg-navy-50 dark:bg-navy-500/25 text-navy-500 dark:text-navy-200 mb-2">
              Badge earned
            </span>
            <h3 className="text-xl font-bold text-stone-900 dark:text-white mb-1">{selectedBadge.place.name}</h3>
            <p className="text-sm text-stone-500 dark:text-stone-400 mb-4">{selectedBadge.place.description}</p>
            <p className="text-xs text-stone-400 dark:text-stone-500 mb-5">
              Earned by completing{' '}
              {selectedBadge.milestones.length > 0
                ? `all ${selectedBadge.milestones.length} milestone${selectedBadge.milestones.length > 1 ? 's' : ''}`
                : `all ${selectedBadge.total_points} stops`}{' '}
              of this trip.
            </p>
            <button
              type="button"
              onClick={() => setSelectedBadge(null)}
              className="w-full py-2.5 rounded-full bg-gradient-to-r from-crimson-500 to-crimson-700 text-white text-sm font-semibold active:scale-95 transition-transform"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
