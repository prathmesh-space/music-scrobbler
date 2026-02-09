export default function Profile() {
  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4">
      <div className="mx-auto max-w-4xl rounded-lg border border-gray-700 bg-gray-800 p-8">
        <h1 className="text-3xl font-bold text-white">Profile</h1>
        <p className="mt-3 text-gray-400">
          Manage your account details and profile preferences here.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-gray-700 bg-gray-900 p-4">
            <h2 className="text-lg font-semibold text-white">Account</h2>
            <p className="mt-2 text-sm text-gray-400">
              Connected Last.fm account information will be displayed.
            </p>
          </div>
          <div className="rounded-lg border border-gray-700 bg-gray-900 p-4">
            <h2 className="text-lg font-semibold text-white">Preferences</h2>
            <p className="mt-2 text-sm text-gray-400">
              Control how charts, stats, and themes behave.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
