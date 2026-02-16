import Statistics from '../../pages/Statistics';

export default function ChartsStatisticsPanel({ username }) {
  return (
    <aside className="rounded-[30px] bg-white/30 p-4 backdrop-blur-sm ring-1 ring-[#CFD0B9]/40">
      <Statistics username={username} embedded />
    </aside>
  );
}
