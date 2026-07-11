import { useNavigate, useParams } from 'react-router-dom';
import { useGetPublicProfileQuery } from '../store/api/userApi';

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

const FlagIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2z" />
  </svg>
);

const MedalIcon = ({ className = 'w-8 h-8' }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <circle cx="12" cy="9" r="6" strokeWidth={2} />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14.5L7 21l5-2.5L17 21l-2-6.5M10 9l1.5 1.5L14.5 7" />
  </svg>
);

const PublicProfilePage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError } = useGetPublicProfileQuery(id!, { skip: !id });

  const user = data?.user;
  const trips = data?.trips ?? [];
  const earnedBadges = trips.filter((t) => t.badge_earned);
  const joined = user?.joined
    ? new Date(user.joined).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    : null;

  return (
    <div className="max-w-md mx-auto px-5 pt-10 pb-32">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-stone-500 dark:text-stone-400 mb-6 active:scale-95 transition-transform"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      {isLoading ? (
        <div className="space-y-4">
          <div className="h-24 rounded-2xl bg-stone-200/60 dark:bg-white/5 animate-pulse" />
          <div className="h-32 rounded-2xl bg-stone-200/60 dark:bg-white/5 animate-pulse" />
        </div>
      ) : isError || !user ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-stone-500 dark:text-stone-400">This profile doesn’t exist or isn’t available.</p>
        </Card>
      ) : (
        <>
          {/* Identity */}
          <header className="flex items-center gap-4 mb-8">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-full object-cover border-2 border-crimson-500/40" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-crimson-400 to-crimson-600 flex items-center justify-center text-white text-2xl font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-stone-900 dark:text-white truncate">{user.name}</h1>
              {joined && <p className="text-sm text-stone-500 dark:text-stone-400">Exploring since {joined}</p>}
            </div>
          </header>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            <Card className="p-3 text-center">
              <p className="text-xl font-bold text-stone-900 dark:text-white tabular-nums">{trips.length}</p>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">Trips</p>
            </Card>
            <Card className="p-3 text-center">
              <p className="text-xl font-bold text-stone-900 dark:text-white tabular-nums">{user.milestones.length}</p>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">Milestones</p>
            </Card>
            <Card className="p-3 text-center">
              <p className="text-xl font-bold text-stone-900 dark:text-white tabular-nums">{earnedBadges.length}</p>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">Badges</p>
            </Card>
          </div>

          {/* Badges */}
          <section className="mb-8">
            <SectionTitle>Badges</SectionTitle>
            {earnedBadges.length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {earnedBadges.map((t) => (
                  <div key={t.place.id} className="flex flex-col items-center gap-1">
                    {t.place.badge ? (
                      <img src={t.place.badge} alt={`${t.place.name} badge`} className="w-20 h-20 object-contain" />
                    ) : (
                      <MedalIcon className="w-16 h-16 text-crimson-500" />
                    )}
                    <p className="text-[10px] text-center text-stone-500 dark:text-stone-400 line-clamp-2">{t.place.name}</p>
                  </div>
                ))}
              </div>
            ) : (
              <Card className="p-6 text-center">
                <MedalIcon className="w-8 h-8 mx-auto mb-2 text-stone-300 dark:text-stone-600" />
                <p className="text-sm text-stone-500 dark:text-stone-400">No badges earned yet.</p>
              </Card>
            )}
          </section>

          {/* Milestones */}
          <section>
            <SectionTitle>Milestones</SectionTitle>
            {user.milestones.length > 0 ? (
              <Card className="divide-y divide-stone-100 dark:divide-white/5">
                {user.milestones.map((m) => (
                  <div key={`${m.name}-${m.earned_at}`} className="flex items-center gap-3 px-4 py-3">
                    <div className="shrink-0 w-9 h-9 rounded-full bg-navy-50 dark:bg-navy-500/25 text-navy-500 dark:text-navy-200 flex items-center justify-center">
                      <FlagIcon />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-stone-900 dark:text-white truncate">{m.name}</p>
                      <p className="text-xs text-stone-500 dark:text-stone-400">
                        {new Date(m.earned_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                ))}
              </Card>
            ) : (
              <Card className="p-6 text-center">
                <p className="text-sm text-stone-500 dark:text-stone-400">No milestones reached yet.</p>
              </Card>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default PublicProfilePage;
