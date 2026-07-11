import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetProfileQuery, useUpdateProfileMutation } from '../store/api/userApi';
import { useGetProgressSummaryQuery } from '../store/api/userProgressApi';
import { useLogoutMutation } from '../store/api/authApi';
import { Medal, Trash2 } from 'lucide-react';
import cartoonAvatar from 'cartoon-avatar';

// How many hosted images each gender gallery has. The package keeps these in
// its internal config (cartoon-avatar/config.js) and doesn't export them.
const AVATAR_COUNTS = { male: 129, female: 114 } as const;

interface ApiErrorResponse {
  data?: { error?: string };
}

const MENU_ITEMS = [
  { label: 'Settings', hint: 'Appearance, notifications', path: '/settings' },
  { label: 'Privacy policy', hint: 'What we do with your data', path: '/privacy-policy' },
];

const ProfilePage = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useGetProfileQuery();
  const { data: summary } = useGetProgressSummaryQuery(undefined, { refetchOnMountOrArgChange: true });
  const [updateProfile, { isLoading: isSaving, error, reset }] = useUpdateProfileMutation();
  const [logout, { isLoading: isSigningOut }] = useLogoutMutation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [avatarGender, setAvatarGender] = useState<'male' | 'female'>('male');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  // Deterministic catalog: generate_avatar({gender, id}) maps ids to hosted images.
  const avatarOptions = Array.from(
    { length: AVATAR_COUNTS[avatarGender] },
    (_, i) => cartoonAvatar.generate_avatar({ gender: avatarGender, id: i + 1 }),
  );

  const handleLogout = async () => {
    await logout();
    setShowSignOutConfirm(false);
    navigate('/login', { replace: true });
  };

  useEffect(() => {
    if (data?.user) {
      setName(data.user.name ?? '');
      setEmail(data.user.email ?? '');
    }
  }, [data]);

  const errorMessage = error ? (error as ApiErrorResponse).data?.error ?? 'Failed to save profile' : null;
  const displayName = data?.user.name || 'Explorer';

  const trips = summary?.trips ?? [];
  const earnedBadges = trips.filter((t) => t.badge_earned);
  const milestones = trips.flatMap((t) => t.milestones.map((m) => ({ ...m, placeName: t.place.name })));
  const achievedMilestones = milestones.filter((m) => m.visited);

  const openEditModal = () => {
    // Discard any half-typed edits and stale errors from a previous open.
    setName(data?.user.name ?? '');
    setEmail(data?.user.email ?? '');
    setAvatar(data?.user.avatar || null);
    setShowAvatarPicker(false);
    reset();
    setShowEditModal(true);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile({ name, email, avatar }).unwrap();
      setShowEditModal(false);
    } catch {
      // error surfaces inside the modal via errorMessage
    }
  };

  return (
    <div className="max-w-md mx-auto px-5 pt-10 pb-32">
      {/* Header — same shape as the home page welcome */}
      <header className="flex items-center gap-4 mb-8">
        {data?.user.avatar ? (
          <img src={data.user.avatar} alt={displayName} className="w-14 h-14 rounded-full object-cover border-2 border-crimson-500/40" />
        ) : (
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-crimson-400 to-crimson-600 flex items-center justify-center text-white text-xl font-bold">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm text-stone-500 dark:text-stone-400 capitalize">{data?.user.role ?? 'user'}</p>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-white truncate">{displayName}</h1>
        </div>
        <button
          type="button"
          onClick={openEditModal}
          disabled={isLoading}
          aria-label="Edit profile"
          className="shrink-0 w-10 h-10 rounded-full bg-white/70 dark:bg-black/60 backdrop-blur-2xl border border-white/50 dark:border-white/10 text-stone-700 dark:text-stone-300 flex items-center justify-center active:scale-95 transition-transform disabled:opacity-40"
        >
          <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      </header>

      {/* Collection — earned badges */}
      <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-3">
        Collection {earnedBadges.length > 0 && `· ${earnedBadges.length}`}
      </h2>
      {earnedBadges.length > 0 ? (
        <div className="grid grid-cols-3 gap-3 mb-8">
          {earnedBadges.map((t) => (
            <div key={t.place.id} className="flex flex-col items-center gap-1.5">
              {t.place.badge ? (
                <img src={t.place.badge} alt={`${t.place.name} badge`} className="w-16 h-16 object-contain" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-crimson-400 to-crimson-600 text-white flex items-center justify-center">
                  <Medal className="w-7 h-7" />
                </div>
              )}
              <p className="text-[10px] text-stone-500 dark:text-stone-400 text-center leading-tight line-clamp-1">{t.place.name}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white/70 dark:bg-black/60 backdrop-blur-2xl rounded-2xl border border-white/50 dark:border-white/10 p-5 text-center mb-8">
          <p className="text-sm text-stone-500 dark:text-stone-400">No badges yet — complete a trip's milestones to earn one.</p>
        </div>
      )}

      {/* Achievements — reached milestones */}
      <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-3">
        Achievements {milestones.length > 0 && `· ${achievedMilestones.length}/${milestones.length}`}
      </h2>
      {achievedMilestones.length > 0 ? (
        <div className="bg-white/70 dark:bg-black/60 backdrop-blur-2xl rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.4)] border border-white/50 dark:border-white/10 divide-y divide-stone-100 dark:divide-white/5 mb-8">
          {achievedMilestones.map((m) => (
            <div key={m.id} className="flex items-center gap-3 px-5 py-3.5">
              <div className="shrink-0 w-9 h-9 rounded-full bg-navy-50 dark:bg-navy-500/25 text-navy-500 dark:text-navy-200 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-stone-900 dark:text-white truncate">{m.name}</p>
                <p className="text-xs text-stone-500 dark:text-stone-400 truncate">{m.placeName}</p>
              </div>
              <div className="shrink-0 w-6 h-6 rounded-full bg-navy-500 text-white flex items-center justify-center">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white/70 dark:bg-black/60 backdrop-blur-2xl rounded-2xl border border-white/50 dark:border-white/10 p-5 text-center mb-8">
          <p className="text-sm text-stone-500 dark:text-stone-400">Milestones you reach on your trips will show up here.</p>
        </div>
      )}

      <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-3">
        Account details
      </h2>

      {isLoading ? (
        <div className="h-32 rounded-2xl bg-stone-200/60 dark:bg-white/5 animate-pulse" />
      ) : (
        <div className="bg-white/70 dark:bg-black/60 backdrop-blur-2xl rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.4)] border border-white/50 dark:border-white/10 divide-y divide-stone-100 dark:divide-white/5">
          <div className="flex items-center justify-between px-5 py-4">
            <p className="text-sm font-medium text-stone-900 dark:text-white">Name</p>
            <p className="text-sm text-stone-500 dark:text-stone-400 truncate max-w-[60%]">{data?.user.name}</p>
          </div>
          <div className="flex items-center justify-between px-5 py-4">
            <p className="text-sm font-medium text-stone-900 dark:text-white">Email</p>
            <p className="text-sm text-stone-500 dark:text-stone-400 truncate max-w-[60%]">{data?.user.email}</p>
          </div>
        </div>
      )}

      <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 mt-8 mb-3">
        More
      </h2>
      <div className="bg-white/70 dark:bg-black/60 backdrop-blur-2xl rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.4)] border border-white/50 dark:border-white/10 divide-y divide-stone-100 dark:divide-white/5">
        {MENU_ITEMS.map((item) => (
          <button
            key={item.path}
            type="button"
            onClick={() => navigate(item.path)}
            className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left active:scale-[0.99] transition-transform"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-stone-900 dark:text-white">{item.label}</p>
              <p className="text-xs text-stone-500 dark:text-stone-400">{item.hint}</p>
            </div>
            <svg className="w-4 h-4 shrink-0 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowSignOutConfirm(true)}
          disabled={isSigningOut}
          className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left active:scale-[0.99] transition-transform disabled:opacity-60"
        >
          <div className="min-w-0">
            <p className="text-sm font-medium text-crimson-600 dark:text-crimson-400">Sign out</p>
            <p className="text-xs text-stone-500 dark:text-stone-400">Log in again to see your trips and badges</p>
          </div>
          <svg className="w-4 h-4 shrink-0 text-crimson-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 5v1a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h5a2 2 0 012 2v1" />
          </svg>
        </button>
      </div>

      {/* Sign out confirmation */}
      {showSignOutConfirm && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setShowSignOutConfirm(false)}
        >
          <div
            className="w-full max-w-md bg-white/95 dark:bg-[#1E1A14]/95 backdrop-blur-2xl rounded-t-3xl shadow-[0_-8px_40px_rgba(0,0,0,0.3)] border-t border-white/50 dark:border-white/10 px-6 pt-3 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full bg-stone-300 dark:bg-white/20 mx-auto mb-5" />
            <h3 className="text-lg font-bold text-stone-900 dark:text-white mb-1">Sign out?</h3>
            <p className="text-sm text-stone-500 dark:text-stone-400 mb-5">
              You'll need to log in again to see your trips and badges.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowSignOutConfirm(false)}
                disabled={isSigningOut}
                className="flex-1 py-2.5 rounded-full border border-stone-300 dark:border-white/15 text-stone-700 dark:text-stone-300 text-sm font-semibold active:scale-95 transition-transform disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogout}
                disabled={isSigningOut}
                className="flex-1 py-2.5 rounded-full bg-gradient-to-r from-crimson-500 to-crimson-700 text-white text-sm font-semibold shadow-lg shadow-crimson-500/30 active:scale-95 transition-transform disabled:opacity-60"
              >
                {isSigningOut ? 'Signing out…' : 'Sign out'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit profile — bottom sheet */}
      {showEditModal && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setShowEditModal(false)}
        >
          <div
            className="w-full max-w-md bg-white/95 dark:bg-[#1E1A14]/95 backdrop-blur-2xl rounded-t-3xl shadow-[0_-8px_40px_rgba(0,0,0,0.3)] border-t border-white/50 dark:border-white/10 px-6 pt-3 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full bg-stone-300 dark:bg-white/20 mx-auto mb-5" />
            <h3 className="text-lg font-bold text-stone-900 dark:text-white mb-4 text-center">Edit profile</h3>

            {errorMessage && (
              <p className="text-sm text-crimson-600 dark:text-crimson-300 bg-crimson-50 dark:bg-crimson-500/10 border border-crimson-200 dark:border-crimson-500/30 rounded-2xl px-4 py-3 mb-4">
                {errorMessage}
              </p>
            )}

            <form className="space-y-4" onSubmit={handleSave}>
              {/* Profile picture — generated cartoon avatars */}
              <div className="space-y-2">
                <p className="text-stone-700 dark:text-stone-300 text-sm font-semibold ml-1">Profile picture</p>
                <div className="flex items-center gap-3">
                  {avatar ? (
                    <img src={avatar} alt="Avatar preview" className="w-14 h-14 rounded-full object-cover border-2 border-crimson-500/40" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-crimson-400 to-crimson-600 flex items-center justify-center text-white text-xl font-bold">
                      {(name || displayName).charAt(0).toUpperCase()}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowAvatarPicker((v) => !v)}
                    className="flex-1 py-2 rounded-full border border-crimson-500/40 text-crimson-600 dark:text-crimson-400 text-sm font-semibold active:scale-95 transition-transform"
                  >
                    {showAvatarPicker ? 'Close avatar picker' : 'Change avatar'}
                  </button>
                  {avatar && (
                    <button
                      type="button"
                      onClick={() => setAvatar(null)}
                      aria-label="Remove avatar"
                      className="shrink-0 w-9 h-9 rounded-full border border-stone-300 dark:border-white/15 text-crimson-500 flex items-center justify-center active:scale-95 transition-transform"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {showAvatarPicker && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      {(['male', 'female'] as const).map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setAvatarGender(g)}
                          className={`flex-1 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors ${
                            avatarGender === g
                              ? 'bg-crimson-500 text-white'
                              : 'bg-stone-100 dark:bg-white/5 text-stone-500 dark:text-stone-400'
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                    {/* One horizontal row — swipe sideways, each avatar in its own fixed slot. */}
                    <div className="flex gap-3 overflow-x-auto overflow-y-hidden rounded-2xl border border-stone-200 dark:border-white/10 p-3">
                      {avatarOptions.map((url) => (
                        <button
                          key={url}
                          type="button"
                          onClick={() => {
                            setAvatar(url);
                            setShowAvatarPicker(false);
                          }}
                          aria-label="Choose this avatar"
                          className={`shrink-0 w-16 h-16 rounded-full overflow-hidden active:scale-95 transition-transform ${
                            avatar === url ? 'ring-2 ring-crimson-500 ring-offset-1 ring-offset-white dark:ring-offset-[#1E1A14]' : ''
                          }`}
                        >
                          <img src={url} alt="" loading="lazy" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-stone-700 dark:text-stone-300 text-sm font-semibold ml-1" htmlFor="name">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white/50 dark:bg-white/5 border border-stone-200 dark:border-white/10 text-stone-900 dark:text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-crimson-500 focus:ring-2 focus:ring-crimson-500/40 transition-all shadow-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-stone-700 dark:text-stone-300 text-sm font-semibold ml-1" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/50 dark:bg-white/5 border border-stone-200 dark:border-white/10 text-stone-900 dark:text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-crimson-500 focus:ring-2 focus:ring-crimson-500/40 transition-all shadow-sm"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  disabled={isSaving}
                  className="flex-1 py-2.5 rounded-full border border-stone-300 dark:border-white/15 text-stone-700 dark:text-stone-300 text-sm font-semibold active:scale-95 transition-transform disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2.5 rounded-full bg-gradient-to-r from-crimson-500 to-crimson-700 text-white text-sm font-semibold shadow-lg shadow-crimson-500/30 active:scale-95 transition-transform disabled:opacity-60"
                >
                  {isSaving ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
