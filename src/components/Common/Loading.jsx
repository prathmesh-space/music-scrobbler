export default function Loading({ label = 'Loading...' }) {
  return (
    <div className="flex items-center justify-center py-10 text-gray-400">
      <div className="flex items-center gap-3 rounded-lg border border-gray-700 bg-gray-800 px-4 py-3">
        <span className="h-3 w-3 animate-pulse rounded-full bg-purple-500" />
        <span className="text-sm font-medium">{label}</span>
      </div>
    </div>
  );
}
