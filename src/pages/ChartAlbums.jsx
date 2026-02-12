import Charts from './Charts';

export default function ChartAlbums({ username }) {
  return (
    <Charts
      username={username}
      initialTab="albums"
      lockTab
      title="Top Albums"
      subtitle="Your album ranking in stacked, shadowed cards with small artwork."
    />
  );
}
