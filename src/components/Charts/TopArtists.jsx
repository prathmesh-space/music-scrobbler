export default function TopArtists({ items = [] }) {
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
      <h2 className="text-lg font-semibold text-white">Top Artists</h2>
      {items.length ? (
        <ul className="mt-4 space-y-2 text-gray-300">
          {items.map((artist, index) => (
            <li key={`${artist.name}-${index}`}>
              {index + 1}. {artist.name}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-gray-400">No artist data yet.</p>
      )}
    </div>
  );
}
