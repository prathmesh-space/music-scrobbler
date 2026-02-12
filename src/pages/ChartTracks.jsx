import Charts from './Charts';

export default function ChartTracks({ username }) {
  return (
    <Charts
      username={username}
      initialTab="tracks"
      lockTab
      title="Top Tracks"
      subtitle="Track-level component page with a layered visual style."
    />
  );
}
