export default function TopTracks({ items = [] }) {
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
      <h2 className="text-lg font-semibold text-white">Top Tracks</h2>
      {items.length ? (
        <ul className="mt-4 space-y-2 text-gray-300">
          {items.map((track, index) => (
            <li key={`${track.name}-${index}`}>
              {index + 1}. {track.name}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-gray-400">No track data yet.</p>
      )}
    </div>
  );
}
