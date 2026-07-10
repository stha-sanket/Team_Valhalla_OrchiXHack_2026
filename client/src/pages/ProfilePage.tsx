import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useGetProfileQuery, useUpdateProfileMutation } from '../store/api/userApi';

interface ApiErrorResponse {
  data?: { error?: string };
}

const ProfilePage = () => {
  const { data, isLoading } = useGetProfileQuery();
  const [updateProfile, { isLoading: isSaving, isSuccess, error }] = useUpdateProfileMutation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (data?.user) {
      setName(data.user.name ?? '');
      setEmail(data.user.email ?? '');
    }
  }, [data]);

  const errorMessage = error ? (error as ApiErrorResponse).data?.error ?? 'Failed to save profile' : null;

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    await updateProfile({ name, email }).catch(() => {});
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 pb-28">
      <div className="bg-white/70 dark:bg-black/60 backdrop-blur-2xl p-6 rounded-xl shadow-[0_8px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.4)] w-full max-w-md border border-white/50 dark:border-white/10">
        <h1 className="text-xl font-bold text-stone-900 dark:text-white mb-1 text-center">Profile</h1>
        <p className="text-stone-500 dark:text-stone-400 text-sm mb-6 text-center capitalize">{data?.user.role}</p>

        {errorMessage && (
          <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-md px-3 py-2 mb-4">
            {errorMessage}
          </p>
        )}
        {isSuccess && (
          <p className="text-sm text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-md px-3 py-2 mb-4">
            Profile updated
          </p>
        )}

        <form className="space-y-4" onSubmit={handleSave}>
          <div className="space-y-1.5">
            <label className="block text-stone-700 dark:text-stone-300 text-sm font-semibold ml-1" htmlFor="name">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              className="w-full bg-white/50 dark:bg-white/5 border border-stone-200 dark:border-white/10 text-stone-900 dark:text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:border-highlight1 focus:ring-2 focus:ring-highlight1/50 transition-all shadow-sm"
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
              disabled={isLoading}
              className="w-full bg-white/50 dark:bg-white/5 border border-stone-200 dark:border-white/10 text-stone-900 dark:text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:border-highlight1 focus:ring-2 focus:ring-highlight1/50 transition-all shadow-sm"
            />
          </div>
          <button
            type="submit"
            disabled={isSaving || isLoading}
            className="w-full bg-highlight1 text-white font-medium text-sm py-2 rounded-md shadow-lg shadow-highlight1/30 hover:shadow-highlight1/50 transition-all duration-300 disabled:opacity-60"
          >
            {isSaving ? 'Saving...' : 'Save changes'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
