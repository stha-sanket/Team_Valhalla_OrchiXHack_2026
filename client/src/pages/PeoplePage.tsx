import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearchUsersQuery } from '../store/api/userApi';
import { useGetLeaderboardQuery } from '../store/api/arApi';
import type { LeaderboardSort } from '../store/api/arApi';
import { useDebounce } from '../hooks/useDebounce';

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div
    className={`bg-white/70 dark:bg-black/60 backdrop-blur-2xl rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.4)] border border-white/50 dark:border-white/10 ${className}`}
  >
    {children}
  </div>
);

const SearchIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z" />
  </svg>
);

const FlagIcon = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2z" />
  </svg>
);

const Avatar = ({ name, avatar, size = 'w-11 h-11' }: { name: string; avatar: string | null; size?: string }) =>
  avatar ? (
    <img src={avatar} alt="" className={`shrink-0 ${size} rounded-full object-cover`} />
  ) : (
    <div className={`shrink-0 ${size} rounded-full bg-gradient-to-br from-crimson-400 to-crimson-600 flex items-center justify-center text-white font-bold`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );

const SORT_OPTIONS: { key: LeaderboardSort; label: string }[] = [
  { key: 'milestones', label: 'Milestones' },
  { key: 'places', label: 'Places' },
  { key: 'side_quests', label: 'Side quests' },
];

const rankStyle = (rank: number) =>
  rank === 0
    ? 'bg-crimson-500 text-white'
    : rank === 1
      ? 'bg-navy-400 text-white'
      : rank === 2
        ? 'bg-stone-400 dark:bg-stone-500 text-white'
        : 'bg-stone-100 dark:bg-white/5 text-stone-500 dark:text-stone-400';

const PeoplePage = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<LeaderboardSort>('milestones');
  const debouncedQuery = useDebounce(query.trim(), 300);

  const canSearch = debouncedQuery.length >= 2;
  const { data: searchData, isFetching } = useSearchUsersQuery(debouncedQuery, { skip: !canSearch });
  const { data: board, isLoading: boardLoading } = useGetLeaderboardQuery(sortBy, { skip: canSearch });

  const results = canSearch ? searchData?.users ?? [] : [];
  // The debounced value lagging behind the input also counts as "still searching".
  const searching = canSearch && (isFetching || debouncedQuery !== query.trim());

  const metricOf = (entry: { milestones: number; places: number; side_quests: number }) =>
    sortBy === 'places' ? entry.places : sortBy === 'side_quests' ? entry.side_quests : entry.milestones;

  return (
    <div className="max-w-md mx-auto px-5 pt-10 pb-32">
      <header className="mb-6">
        <p className="text-sm text-stone-500 dark:text-stone-400">Community</p>
        <h1 className="text-2xl font-bold text-stone-900 dark:text-white">Explorers</h1>
      </header>

      <div className="relative mb-5">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none">
          <SearchIcon />
        </span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or email"
          className="w-full pl-11 pr-4 py-3 rounded-full bg-white/70 dark:bg-black/60 border border-stone-200 dark:border-white/10 text-sm text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-crimson-400/50"
        />
      </div>

      {canSearch ? (
        /* ---- Search results replace the leaderboard ---- */
        searching ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 rounded-2xl bg-stone-200/60 dark:bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : results.length > 0 ? (
          <Card className="divide-y divide-stone-100 dark:divide-white/5">
            {results.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => navigate(`/people/${u.id}`)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left active:bg-stone-50 dark:active:bg-white/5 first:rounded-t-2xl last:rounded-b-2xl"
              >
                <Avatar name={u.name} avatar={u.avatar} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-stone-900 dark:text-white truncate">{u.name}</p>
                  <p className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1">
                    <FlagIcon />
                    {u.milestone_count} milestone{u.milestone_count === 1 ? '' : 's'}
                  </p>
                </div>
                <svg className="shrink-0 w-4 h-4 text-stone-300 dark:text-stone-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </Card>
        ) : (
          <Card className="p-6 text-center">
            <p className="text-sm text-stone-500 dark:text-stone-400">No explorers match “{debouncedQuery}”.</p>
          </Card>
        )
      ) : (
        /* ---- Leaderboard (default view) ---- */
        <>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 mr-auto">
              Leaderboard
            </h2>
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setSortBy(opt.key)}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-full transition-colors ${
                  sortBy === opt.key
                    ? 'bg-crimson-500 text-white'
                    : 'bg-stone-100 dark:bg-white/5 text-stone-500 dark:text-stone-400'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {boardLoading ? (
            <div className="space-y-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-2xl bg-stone-200/60 dark:bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : (board?.entries.length ?? 0) > 0 ? (
            <Card className="divide-y divide-stone-100 dark:divide-white/5">
              {board!.entries.map((entry, rank) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => navigate(`/people/${entry.id}`)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left active:bg-stone-50 dark:active:bg-white/5 first:rounded-t-2xl last:rounded-b-2xl"
                >
                  <span className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold tabular-nums ${rankStyle(rank)}`}>
                    {rank + 1}
                  </span>
                  <Avatar name={entry.name} avatar={entry.avatar} size="w-10 h-10" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-stone-900 dark:text-white truncate">{entry.name}</p>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      {entry.milestones} milestones · {entry.places} places · {entry.side_quests} side quests
                    </p>
                  </div>
                  <span className="shrink-0 text-lg font-bold text-crimson-600 dark:text-crimson-400 tabular-nums">
                    {metricOf(entry)}
                  </span>
                </button>
              ))}
            </Card>
          ) : (
            <Card className="p-8 text-center">
              <p className="text-sm text-stone-500 dark:text-stone-400">No explorers on the board yet — get out there!</p>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default PeoplePage;
