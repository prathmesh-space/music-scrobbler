export default function TopAlbums({ items = [] }) {
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
      <h2 className="text-lg font-semibold text-white">Top Albums</h2>
      {items.length ? (
        <ul className="mt-4 space-y-2 text-gray-300">
          {items.map((album, index) => (
            <li key={`${album.name}-${index}`}>
              {index + 1}. {album.name}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-gray-400">No album data yet.</p>
      )}
    </div>
  );
}
