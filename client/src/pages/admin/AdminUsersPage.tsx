import { useMemo, useState } from 'react';
import {
  useGetAdminUsersQuery,
  useUpdateAdminUserMutation,
  useDeleteAdminUserMutation,
  useSuspendUserMutation,
  useActivateUserMutation,
  useVerifyUserMutation,
} from '../../store/api/adminApi';
import type { AdminUser } from '../../store/api/adminApi';
import { useGetMeQuery } from '../../store/api/authApi';

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div
    className={`bg-white/70 dark:bg-black/60 backdrop-blur-2xl rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.4)] border border-white/50 dark:border-white/10 ${className}`}
  >
    {children}
  </div>
);

const StatusChip = ({ label, tone }: { label: string; tone: 'good' | 'muted' | 'bad' }) => {
  const tones = {
    good: 'bg-navy-50 dark:bg-navy-500/25 text-navy-500 dark:text-navy-200',
    muted: 'bg-stone-100 dark:bg-white/5 text-stone-500 dark:text-stone-400',
    bad: 'bg-crimson-50 dark:bg-crimson-500/20 text-crimson-600 dark:text-crimson-300',
  };
  return (
    <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${tones[tone]}`}>{label}</span>
  );
};

const SheetButton = ({
  children,
  onClick,
  disabled,
  destructive,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`w-full py-2.5 rounded-full text-sm font-semibold active:scale-95 transition-transform disabled:opacity-50 ${
      destructive
        ? 'bg-gradient-to-r from-crimson-500 to-crimson-700 text-white shadow-lg shadow-crimson-500/30'
        : 'border border-stone-300 dark:border-white/15 text-stone-700 dark:text-stone-300'
    }`}
  >
    {children}
  </button>
);

const AdminUsersPage = () => {
  const { data: me } = useGetMeQuery();
  const { data, isLoading } = useGetAdminUsersQuery({ page: 1, limit: 100 });
  const [updateUser, { isLoading: updating }] = useUpdateAdminUserMutation();
  const [deleteUser, { isLoading: deleting }] = useDeleteAdminUserMutation();
  const [suspendUser, { isLoading: suspending }] = useSuspendUserMutation();
  const [activateUser, { isLoading: activating }] = useActivateUserMutation();
  const [verifyUser, { isLoading: verifying }] = useVerifyUserMutation();

  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const busy = updating || deleting || suspending || activating || verifying;

  const users = useMemo(() => {
    const all = data?.users ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return all;
    return all.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }, [data, search]);

  const closeSheet = () => {
    setSelected(null);
    setConfirmingDelete(false);
  };

  const run = async (action: () => Promise<unknown>) => {
    await action();
    closeSheet();
  };

  const isSelf = selected?.id === me?.user.id;

  return (
    <div className="max-w-md mx-auto px-5 pt-10 pb-32">
      <header className="mb-6">
        <p className="text-sm text-stone-500 dark:text-stone-400">Manage users</p>
        <h1 className="text-2xl font-bold text-stone-900 dark:text-white">
          {data ? `${data.total} member${data.total === 1 ? '' : 's'}` : 'Users'}
        </h1>
      </header>

      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name or email"
        className="w-full mb-4 px-4 py-2.5 rounded-full bg-white/70 dark:bg-black/60 border border-stone-200 dark:border-white/10 text-sm text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-crimson-400/50"
      />

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-2xl bg-stone-200/60 dark:bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : users.length > 0 ? (
        <Card className="divide-y divide-stone-100 dark:divide-white/5">
          {users.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => setSelected(u)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left active:bg-stone-50 dark:active:bg-white/5 first:rounded-t-2xl last:rounded-b-2xl"
            >
              {u.avatar ? (
                <img src={u.avatar} alt="" className="shrink-0 w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-crimson-400 to-crimson-600 flex items-center justify-center text-white font-bold">
                  {u.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-stone-900 dark:text-white truncate">
                  {u.name}
                  {u.id === me?.user.id && <span className="text-stone-400 dark:text-stone-500 font-normal"> · you</span>}
                </p>
                <p className="text-xs text-stone-500 dark:text-stone-400 truncate">{u.email}</p>
              </div>
              <div className="shrink-0 flex flex-col items-end gap-1">
                <StatusChip label={u.role} tone={u.role === 'admin' ? 'good' : 'muted'} />
                {!u.isActive ? (
                  <StatusChip label="Suspended" tone="bad" />
                ) : !u.isVerified ? (
                  <StatusChip label="Unverified" tone="muted" />
                ) : null}
              </div>
            </button>
          ))}
        </Card>
      ) : (
        <Card className="p-6 text-center">
          <p className="text-sm text-stone-500 dark:text-stone-400">No users match “{search}”.</p>
        </Card>
      )}

      {/* Manage sheet */}
      {selected && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 backdrop-blur-sm" onClick={closeSheet}>
          <div
            className="w-full max-w-md bg-white/95 dark:bg-[#1E1A14]/95 backdrop-blur-2xl rounded-t-3xl shadow-[0_-8px_40px_rgba(0,0,0,0.3)] border-t border-white/50 dark:border-white/10 px-6 pt-3 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full bg-stone-300 dark:bg-white/20 mx-auto mb-5" />
            <div className="text-center mb-5">
              <h3 className="text-lg font-bold text-stone-900 dark:text-white">{selected.name}</h3>
              <p className="text-sm text-stone-500 dark:text-stone-400">{selected.email}</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <StatusChip label={selected.role} tone={selected.role === 'admin' ? 'good' : 'muted'} />
                <StatusChip label={selected.isActive ? 'Active' : 'Suspended'} tone={selected.isActive ? 'good' : 'bad'} />
                <StatusChip label={selected.isVerified ? 'Verified' : 'Unverified'} tone={selected.isVerified ? 'good' : 'muted'} />
              </div>
            </div>

            {confirmingDelete ? (
              <div className="space-y-3">
                <p className="text-sm text-center text-stone-600 dark:text-stone-300">
                  Delete <span className="font-semibold">{selected.name}</span> permanently? This can’t be undone.
                </p>
                <SheetButton onClick={() => run(() => deleteUser(selected.id).unwrap())} disabled={busy} destructive>
                  {deleting ? 'Deleting…' : 'Yes, delete this user'}
                </SheetButton>
                <SheetButton onClick={() => setConfirmingDelete(false)} disabled={busy}>
                  Cancel
                </SheetButton>
              </div>
            ) : (
              <div className="space-y-3">
                {!selected.isVerified && (
                  <SheetButton onClick={() => run(() => verifyUser(selected.id).unwrap())} disabled={busy}>
                    {verifying ? 'Verifying…' : 'Mark as verified'}
                  </SheetButton>
                )}
                {selected.isActive ? (
                  <SheetButton
                    onClick={() => run(() => suspendUser({ id: selected.id }).unwrap())}
                    disabled={busy || isSelf}
                  >
                    {suspending ? 'Suspending…' : isSelf ? 'You can’t suspend yourself' : 'Suspend account'}
                  </SheetButton>
                ) : (
                  <SheetButton onClick={() => run(() => activateUser(selected.id).unwrap())} disabled={busy}>
                    {activating ? 'Activating…' : 'Reactivate account'}
                  </SheetButton>
                )}
                <SheetButton
                  onClick={() =>
                    run(() => updateUser({ id: selected.id, role: selected.role === 'admin' ? 'user' : 'admin' }).unwrap())
                  }
                  disabled={busy || isSelf}
                >
                  {updating
                    ? 'Updating…'
                    : isSelf
                      ? 'You can’t change your own role'
                      : selected.role === 'admin'
                        ? 'Demote to user'
                        : 'Promote to admin'}
                </SheetButton>
                <SheetButton onClick={() => setConfirmingDelete(true)} disabled={busy || isSelf} destructive>
                  {isSelf ? 'You can’t delete yourself' : 'Delete user'}
                </SheetButton>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
