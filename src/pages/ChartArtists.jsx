import Charts from './Charts';

export default function ChartArtists({ username }) {
  return (
    <Charts
      username={username}
      initialTab="artists"
      lockTab
      title="Top Artists"
      subtitle="A focused artist component page with layered cards and quick actions."
    />
  );
}
