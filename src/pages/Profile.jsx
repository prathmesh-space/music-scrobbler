import { UserRound, Music2, CalendarDays, ShieldCheck } from 'lucide-react';

export default function Profile({ username }) {
  const memberSince = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
  });

  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-xl border border-gray-700 bg-gradient-to-r from-gray-800 to-gray-900 p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-wide text-purple-300">Dedicated profile page</p>
              <h1 className="mt-1 text-3xl font-bold text-white">{username || 'Music Scrobbler User'}</h1>
              <p className="mt-2 text-gray-300">Review your Last.fm identity, account status, and personalization at a glance.</p>
            </div>
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-purple-500/40 bg-purple-500/10">
              <UserRound className="h-7 w-7 text-purple-300" />
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-gray-700 bg-gray-800 p-5">
            <div className="flex items-center gap-3">
              <Music2 className="h-5 w-5 text-purple-300" />
              <h2 className="text-sm font-semibold text-white">Listening Identity</h2>
            </div>
            <p className="mt-3 text-sm text-gray-400">Username</p>
            <p className="text-lg font-semibold text-gray-100">{username || 'Not available'}</p>
          </div>

          <div className="rounded-lg border border-gray-700 bg-gray-800 p-5">
            <div className="flex items-center gap-3">
              <CalendarDays className="h-5 w-5 text-purple-300" />
              <h2 className="text-sm font-semibold text-white">Profile Activity</h2>
            </div>
            <p className="mt-3 text-sm text-gray-400">Member snapshot</p>
            <p className="text-lg font-semibold text-gray-100">{memberSince}</p>
          </div>

          <div className="rounded-lg border border-gray-700 bg-gray-800 p-5">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-purple-300" />
              <h2 className="text-sm font-semibold text-white">Session Status</h2>
            </div>
            <p className="mt-3 text-sm text-gray-400">Authentication</p>
            <p className="text-lg font-semibold text-emerald-300">Connected</p>
          </div>
        </section>

        <section className="rounded-lg border border-gray-700 bg-gray-800 p-6">
          <h2 className="text-xl font-semibold text-white">Preferences</h2>
          <p className="mt-2 text-gray-400">
            Preference controls are centralized here so you can dedicate this page to account-level configuration in future updates.
          </p>
        </section>
      </div>
    </div>
  );
}
