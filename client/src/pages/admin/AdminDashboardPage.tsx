import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetMeQuery } from '../../store/api/authApi';
import { useGetAdminStatsQuery, useGetAdminAnalyticsQuery } from '../../store/api/adminApi';
import type { DayCount } from '../../store/api/adminApi';

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

const StatTile = ({ label, value }: { label: string; value: number | undefined }) => (
  <Card className="p-4 text-center">
    <p className="text-2xl font-bold text-stone-900 dark:text-white tabular-nums">{value ?? '—'}</p>
    <p className="text-[11px] font-medium text-stone-500 dark:text-stone-400 mt-0.5">{label}</p>
  </Card>
);

const shortDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' });

/** Single-series area chart with a tap/hover crosshair tooltip. */
const TrendChart = ({ data, colorClass }: { data: DayCount[]; colorClass: string }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  const W = 340;
  const H = 120;
  const PAD = { top: 14, right: 10, bottom: 20, left: 10 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const max = Math.max(1, ...data.map((d) => d.count));
  const x = (i: number) => PAD.left + (data.length > 1 ? (i / (data.length - 1)) * plotW : plotW / 2);
  const y = (v: number) => PAD.top + plotH - (v / max) * plotH;

  const linePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(d.count).toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L${x(data.length - 1).toFixed(1)},${PAD.top + plotH} L${x(0).toFixed(1)},${PAD.top + plotH} Z`;

  const handlePointer = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect || data.length === 0) return;
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const i = Math.round(((px - PAD.left) / plotW) * (data.length - 1));
    setHover(Math.min(data.length - 1, Math.max(0, i)));
  };

  const last = data[data.length - 1];

  return (
    <div className={`relative ${colorClass}`}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full touch-none select-none"
        onPointerMove={handlePointer}
        onPointerDown={handlePointer}
        onPointerLeave={() => setHover(null)}
        role="img"
        aria-label="Trend over the last 30 days"
      >
        {/* recessive gridlines */}
        {[0.5, 1].map((f) => (
          <line
            key={f}
            x1={PAD.left}
            x2={W - PAD.right}
            y1={y(max * f)}
            y2={y(max * f)}
            className="stroke-stone-200 dark:stroke-white/10"
            strokeWidth={1}
          />
        ))}
        <path d={areaPath} fill="currentColor" opacity={0.12} />
        <path d={linePath} fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {/* direct label on the latest point */}
        {last && hover === null && (
          <>
            <circle cx={x(data.length - 1)} cy={y(last.count)} r={3.5} fill="currentColor" className="stroke-white dark:stroke-[#1E1A14]" strokeWidth={2} />
            <text x={x(data.length - 1) - 6} y={y(last.count) - 7} textAnchor="end" className="fill-stone-600 dark:fill-stone-300" fontSize={10} fontWeight={600}>
              {last.count}
            </text>
          </>
        )}
        {hover !== null && data[hover] && (
          <>
            <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + plotH} className="stroke-stone-300 dark:stroke-white/20" strokeWidth={1} />
            <circle cx={x(hover)} cy={y(data[hover].count)} r={4} fill="currentColor" className="stroke-white dark:stroke-[#1E1A14]" strokeWidth={2} />
          </>
        )}
        {/* sparse x labels */}
        {data.length > 0 && (
          <>
            <text x={PAD.left} y={H - 5} className="fill-stone-400 dark:fill-stone-500" fontSize={9}>
              {shortDate(data[0].date)}
            </text>
            <text x={W - PAD.right} y={H - 5} textAnchor="end" className="fill-stone-400 dark:fill-stone-500" fontSize={9}>
              {shortDate(data[data.length - 1].date)}
            </text>
          </>
        )}
      </svg>
      {hover !== null && data[hover] && (
        <div
          className="absolute -top-1 pointer-events-none px-2 py-1 rounded-lg bg-stone-900/90 dark:bg-white/90 text-white dark:text-stone-900 text-[11px] font-medium whitespace-nowrap"
          style={{ left: `${(x(hover) / W) * 100}%`, transform: `translateX(${hover > data.length / 2 ? '-100%' : '0'})` }}
        >
          {shortDate(data[hover].date)} · {data[hover].count}
        </div>
      )}
    </div>
  );
};

/** Two-segment horizontal split bar with inline labeled counts (identity never color-alone). */
const SplitBar = ({
  a,
  b,
  aLabel,
  bLabel,
}: {
  a: number;
  b: number;
  aLabel: string;
  bLabel: string;
}) => {
  const total = a + b;
  const aPct = total > 0 ? (a / total) * 100 : 0;
  return (
    <div>
      <div className="flex h-3 rounded-full overflow-hidden bg-stone-200 dark:bg-white/10 gap-[2px]">
        {a > 0 && <div className="bg-crimson-500 dark:bg-crimson-400 rounded-full" style={{ width: `${aPct}%` }} />}
        {b > 0 && <div className="bg-navy-400 dark:bg-navy-300 rounded-full flex-1" />}
      </div>
      <div className="flex items-center justify-between mt-1.5 text-xs">
        <span className="flex items-center gap-1.5 text-stone-600 dark:text-stone-300">
          <span className="w-2 h-2 rounded-full bg-crimson-500 dark:bg-crimson-400" />
          {aLabel} · <span className="font-semibold tabular-nums">{a}</span>
        </span>
        <span className="flex items-center gap-1.5 text-stone-600 dark:text-stone-300">
          <span className="w-2 h-2 rounded-full bg-navy-400 dark:bg-navy-300" />
          {bLabel} · <span className="font-semibold tabular-nums">{b}</span>
        </span>
      </div>
    </div>
  );
};

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const { data: me } = useGetMeQuery();
  const { data: statsData, isLoading: statsLoading } = useGetAdminStatsQuery();
  const { data: analytics, isLoading: analyticsLoading } = useGetAdminAnalyticsQuery();

  const stats = statsData?.stats;
  const isLoading = statsLoading || analyticsLoading;

  const totals = useMemo(() => {
    const registrations = analytics?.registrations.reduce((sum, d) => sum + d.count, 0) ?? 0;
    const milestones = analytics?.milestones.reduce((sum, d) => sum + d.count, 0) ?? 0;
    return { registrations, milestones };
  }, [analytics]);

  return (
    <div className="max-w-md mx-auto px-5 pt-10 pb-32">
      <header className="mb-8">
        <p className="text-sm text-stone-500 dark:text-stone-400">Admin dashboard</p>
        <h1 className="text-2xl font-bold text-stone-900 dark:text-white truncate">{me?.user.email}</h1>
      </header>

      {isLoading ? (
        <div className="space-y-4">
          <div className="h-24 rounded-2xl bg-stone-200/60 dark:bg-white/5 animate-pulse" />
          <div className="h-44 rounded-2xl bg-stone-200/60 dark:bg-white/5 animate-pulse" />
          <div className="h-44 rounded-2xl bg-stone-200/60 dark:bg-white/5 animate-pulse" />
        </div>
      ) : (
        <>
          {/* Headline stats */}
          <section className="mb-8">
            <SectionTitle>Users</SectionTitle>
            <div className="grid grid-cols-3 gap-3">
              <StatTile label="Total" value={stats?.totalUsers} />
              <StatTile label="Active" value={stats?.activeUsers} />
              <StatTile label="Verified" value={stats?.verifiedUsers} />
            </div>
            <button
              onClick={() => navigate('/admin/users')}
              className="w-full mt-3 py-2.5 rounded-full bg-gradient-to-r from-crimson-500 to-crimson-700 text-white text-sm font-semibold shadow-lg shadow-crimson-500/30 active:scale-95 transition-transform"
            >
              Manage users
            </button>
          </section>

          {/* Registrations trend */}
          <section className="mb-8">
            <SectionTitle>New users · last 30 days</SectionTitle>
            <Card className="p-4">
              <p className="text-xs text-stone-500 dark:text-stone-400 mb-2">
                <span className="font-semibold text-stone-900 dark:text-white">{totals.registrations}</span> signed up in this period
              </p>
              <TrendChart data={analytics?.registrations ?? []} colorClass="text-crimson-500 dark:text-crimson-400" />
            </Card>
          </section>

          {/* Milestones trend */}
          <section className="mb-8">
            <SectionTitle>Milestones earned · last 30 days</SectionTitle>
            <Card className="p-4">
              <p className="text-xs text-stone-500 dark:text-stone-400 mb-2">
                <span className="font-semibold text-stone-900 dark:text-white">{totals.milestones}</span> checkpoints confirmed as milestones
              </p>
              <TrendChart data={analytics?.milestones ?? []} colorClass="text-navy-400 dark:text-navy-300" />
            </Card>
          </section>

          {/* Community breakdown */}
          <section className="mb-8">
            <SectionTitle>Community</SectionTitle>
            <Card className="p-4 space-y-5">
              <SplitBar a={analytics?.status.active ?? 0} b={analytics?.status.suspended ?? 0} aLabel="Active" bLabel="Suspended" />
              <SplitBar a={analytics?.status.verified ?? 0} b={analytics?.status.unverified ?? 0} aLabel="Verified" bLabel="Unverified" />
              <div className="flex flex-wrap gap-2 pt-1">
                {(analytics?.roles ?? []).map((r) => (
                  <span
                    key={r.role}
                    className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-stone-100 dark:bg-white/5 text-stone-600 dark:text-stone-300"
                  >
                    {r.count} {r.role}
                    {r.count === 1 ? '' : 's'}
                  </span>
                ))}
              </div>
            </Card>
          </section>

          {/* Trip completion */}
          <section>
            <SectionTitle>Trip completion</SectionTitle>
            {(analytics?.places ?? []).length > 0 ? (
              <Card className="divide-y divide-stone-100 dark:divide-white/5">
                {(analytics?.places ?? []).map((p) => {
                  const pct = p.started > 0 ? Math.round((p.completed / p.started) * 100) : 0;
                  return (
                    <div key={p.id} className="px-4 py-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-sm font-medium text-stone-900 dark:text-white truncate">{p.name}</p>
                        <p className="text-xs text-stone-500 dark:text-stone-400 shrink-0 ml-2 tabular-nums">
                          {p.completed} of {p.started} finished
                        </p>
                      </div>
                      <div className="h-2 rounded-full bg-stone-200 dark:bg-white/10">
                        <div
                          className="h-full rounded-full bg-navy-400 dark:bg-navy-300 transition-[width] duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </Card>
            ) : (
              <Card className="p-6 text-center">
                <p className="text-sm text-stone-500 dark:text-stone-400">No visiting places yet.</p>
              </Card>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default AdminDashboardPage;
