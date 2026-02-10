import { useState, useEffect,useCallback } from 'react';
import { getRecentTracks } from '../../services/lastfm';
import { Loader2, Calendar } from 'lucide-react';

const BASE_DAY_STYLE = {
  width: '12px',
  height: '12px',
  borderRadius: '2px',
  border: '1px solid rgba(255, 255, 255, 0.12)',
};

const getIntensityColor = (count) => {
  if (count === 0) return '#1f2937';
  if (count < 5) return '#14532d';
  if (count < 10) return '#15803d';
  if (count < 20) return '#22c55e';
  return '#86efac';
};

const ListeningCalendar = ({ username, embedded = false }) => {

  const [heatmapData, setHeatmapData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);

  const fetchHeatmapData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch as many recent tracks as possible
      const pages = 5; // Get 5 pages of 200 tracks each = 1000 tracks
      const allTracks = [];

      for (let page = 1; page <= pages; page++) {
        const data = await getRecentTracks(username, 200, page);
        if (data.track) {
          allTracks.push(...data.track);
        }
      }

      // Group by date
      const dateMap = {};
      allTracks.forEach((track) => {
        if (track.date?.uts) {
          const date = new Date(parseInt(track.date.uts, 10) * 1000);
          const dateStr = date.toISOString().split('T')[0];
          
          if (!dateMap[dateStr]) {
            dateMap[dateStr] = {
              date: dateStr,
              count: 0,
              tracks: [],
            };
          }
          dateMap[dateStr].count++;
          dateMap[dateStr].tracks.push({
            name: track.name,
            artist: track.artist?.['#text'] || track.artist?.name,
          });
        }
      });

      // Generate last 365 days
      const heatmap = [];
      for (let i = 364; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        heatmap.push({
          date: dateStr,
          count: dateMap[dateStr]?.count || 0,
          tracks: dateMap[dateStr]?.tracks || [],
          day: date.getDay(),
        });
      }

      setHeatmapData(heatmap);
    } catch (error) {
      console.error('Error fetching heatmap data:', error);
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    fetchHeatmapData();
  }, [fetchHeatmapData]);


  const groupByWeeks = () => {
    const weeks = [];
    let currentWeek = [];

    heatmapData.forEach((day) => {
      if (day.day === 0 && currentWeek.length > 0) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      currentWeek.push(day);
    });

    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    return weeks;
  };

  if (loading) {
    return (
      <div className={embedded ? 'flex items-center justify-center py-8' : 'min-h-screen bg-gray-900 flex items-center justify-center'}>
        <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
      </div>
    );
  }

  const weeks = groupByWeeks();

  return (
    <div className={embedded ? '' : 'min-h-screen bg-gray-900 py-8 px-4'}>
      <div className={embedded ? '' : 'max-w-7xl mx-auto'}>
        <div className="flex items-center space-x-3 mb-8">
          <Calendar className="w-8 h-8 text-purple-400" />
          <h1 className="text-4xl font-bold text-white">Listening Heatmap</h1>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-6">
          <div className="overflow-x-auto">
            <div className="inline-flex gap-1">
              {week.map((day) => (
                <div key={weekIndex} className="flex flex-col gap-1">
                  {week.map((day, dayIndex) => (
                    <div
                      key={day.date}
                      onClick={() => setSelectedDay(day)}
                      className="cursor-pointer transition-all hover:ring-2 hover:ring-purple-400"
                      style={{
                        ...BASE_DAY_STYLE,
                        backgroundColor: getIntensityColor(day.count),
                      }}

                      title={`${day.date}: ${day.count} scrobbles`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between mt-6">
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <span>Less</span>
              <div className="flex gap-1">
                {[0, 1, 6, 12, 25].map((count) => (
                  <div
                    key={count}
                    style={{
                      ...BASE_DAY_STYLE,
                      backgroundColor: getIntensityColor(count),
                    }}
                  />
                ))}

              </div>
              <span>More</span>
            </div>

            <div className="text-sm text-gray-400">
              Last 365 days • {heatmapData.reduce((sum, day) => sum + day.count, 0)} total scrobbles
            </div>
          </div>
        </div>

        {selectedDay && selectedDay.count > 0 && (
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-4">
              {new Date(selectedDay.date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </h2>
            <p className="text-gray-400 mb-4">{selectedDay.count} scrobbles</p>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {selectedDay.tracks.map((track, index) => (
                <div
                  key={`${track.name}-${track.artist}-${index}`}
                  className="bg-gray-700 rounded p-3 hover:bg-gray-600 transition"
                >
                  <p className="text-white font-semibold">{track.name}</p>
                  <p className="text-gray-400 text-sm">{track.artist}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ListeningCalendar;