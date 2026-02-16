import { useCallback, useEffect, useRef, useState } from 'react';
import { getTopAlbums, getTopArtists, getTopTracks } from '../services/lastfm';
import { Download, Grid3x3, Loader2 } from 'lucide-react';
import { getLastFmImageUrl } from '../utils/lastfmImage.js';
import { getSpotifyAlbumImage, getSpotifyArtistImage, getSpotifyTrackImage } from '../services/spotify';

const collageTypes = [
  { value: 'albums', label: 'Albums' },
  { value: 'artists', label: 'Artists' },
  { value: 'tracks', label: 'Tracks' },
];

const gridSizes = ['3x3', '4x4', '5x5'];

const periods = [
  { value: '7day', label: '7 Days' },
  { value: '1month', label: '1 Month' },
  { value: '3month', label: '3 Months' },
  { value: '6month', label: '6 Months' },
  { value: '12month', label: '1 Year' },
  { value: 'overall', label: 'All Time' },
];

const fetchByType = {
  albums: { fetcher: getTopAlbums, key: 'album' },
  artists: { fetcher: getTopArtists, key: 'artist' },
  tracks: { fetcher: getTopTracks, key: 'track' },
};

const Collage = ({ username, embedded = false }) => {
  const [gridSize, setGridSize] = useState('3x3');
  const [timePeriod, setTimePeriod] = useState('7day');
  const [collageType, setCollageType] = useState('albums');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const canvasRef = useRef(null);

  const getGridDimensions = () => {
    const [rows, cols] = gridSize.split('x').map(Number);
    return { cols, total: rows * cols };
  };

  const generateCollage = async () => {
    setLoading(true);
    setGenerating(false);

    try {
      const { total } = getGridDimensions();
      const { fetcher, key } = fetchByType[collageType] || fetchByType.albums;
      const response = await fetcher(username, timePeriod, total);
      const rawItems = response[key] || [];

      const itemsWithImages = await Promise.all(
        rawItems.map(async (item) => {
          const lastFmImageUrl = getLastFmImageUrl(item.image);
          if (lastFmImageUrl) {
            return { ...item, imageUrl: lastFmImageUrl };
          }

          const artistName = item.artist?.name || item.artist?.['#text'] || '';

          if (collageType === 'artists') {
            const spotifyImageUrl = await getSpotifyArtistImage(item.name || '');
            return { ...item, imageUrl: spotifyImageUrl };
          }

          if (collageType === 'albums') {
            const spotifyImageUrl = await getSpotifyAlbumImage({
              albumName: item.name || '',
              artistName,
            });
            return { ...item, imageUrl: spotifyImageUrl };
          }

          if (collageType === 'tracks') {
            const spotifyImageUrl = await getSpotifyTrackImage({
              trackName: item.name || '',
              artistName,
            });
            return { ...item, imageUrl: spotifyImageUrl };
          }

          return { ...item, imageUrl: '' };
        })
      );

      setItems(itemsWithImages.filter((item) => item.imageUrl).slice(0, total));
    } catch (error) {
      console.error('Error generating collage:', error);
    } finally {
      setLoading(false);
    }
  };

  const createCollageImage = useCallback(async (collageItems) => {
    setGenerating(true);
    const cols = Number(gridSize.split('x')[1]);
    const tileSize = 300;
    const canvasSize = tileSize * cols;

    const canvas = canvasRef.current;
    if (!canvas) {
      setGenerating(false);
      return;
    }

    canvas.width = canvasSize;
    canvas.height = canvasSize;
    const ctx = canvas.getContext('2d');

    const imagePromises = collageItems.map(
      (item) =>
        new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = item.imageUrl;
        })
    );

    try {
      const images = await Promise.all(imagePromises);

      images.forEach((img, index) => {
        const row = Math.floor(index / cols);
        const col = index % cols;
        ctx.drawImage(img, col * tileSize, row * tileSize, tileSize, tileSize);
      });
    } catch (error) {
      console.error('Error loading collage images:', error);
    } finally {
      setGenerating(false);
    }
  }, [gridSize]);

  const downloadCollage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `collage-${collageType}-${gridSize}-${timePeriod}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  useEffect(() => {
    if (items.length === 0 || !canvasRef.current) return;
    createCollageImage(items);
  }, [items, createCollageImage]);

  const selectedTypeLabel = collageTypes.find((type) => type.value === collageType)?.label || 'Albums';

  return (
    <div className={embedded ? "" : "min-h-screen p-8"} style={{ background: embedded ? 'transparent' : 'transparent' }}>
      <div className="mx-auto max-w-6xl">
        {!embedded && (
          <header className="mb-8">
            <h1 className="font-['Amiri_Quran'] text-7xl font-normal text-[#3E3D1A] md:text-8xl">
              Collage
            </h1>
            <p className="mt-3 font-['Inter_Display'] text-lg font-light text-[#2D2D2D] md:text-xl">
              Create beautiful collages from your music taste
            </p>
          </header>
        )}

        {/* Controls Section */}
        <div className="mb-8 rounded-[30px] bg-white/70 p-6 shadow-lg backdrop-blur-sm ring-1 ring-[#CFD0B9]/30">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Collage Type */}
            <div>
              <label className="mb-3 block font-['Inter'] text-sm font-semibold text-[#3E3D1A]/70">
                Collage Type
              </label>
              <select
                value={collageType}
                onChange={(e) => setCollageType(e.target.value)}
                className="w-full rounded-[20px] border-2 border-[#CFD0B9] bg-white px-5 py-3 font-['Inter'] text-base text-[#3E3D1A] shadow-sm transition-all focus:border-[#6B5A2A] focus:outline-none focus:ring-2 focus:ring-[#6B5A2A]/20"
              >
                {collageTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Grid Size */}
            <div>
              <label className="mb-3 block font-['Inter'] text-sm font-semibold text-[#3E3D1A]/70">
                Grid Size
              </label>
              <div className="flex gap-2">
                {gridSizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setGridSize(size)}
                    className={`flex-1 rounded-[20px] px-4 py-3 font-['Inter'] text-sm font-semibold transition-all ${
                      gridSize === size
                        ? 'bg-[#6B5A2A] text-white shadow-md'
                        : 'bg-[#EECEA4]/30 text-[#3E3D1A] hover:bg-[#EECEA4]/50'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Period */}
            <div>
              <label className="mb-3 block font-['Inter'] text-sm font-semibold text-[#3E3D1A]/70">
                Time Period
              </label>
              <select
                value={timePeriod}
                onChange={(e) => setTimePeriod(e.target.value)}
                className="w-full rounded-[20px] border-2 border-[#CFD0B9] bg-white px-5 py-3 font-['Inter'] text-base text-[#3E3D1A] shadow-sm transition-all focus:border-[#6B5A2A] focus:outline-none focus:ring-2 focus:ring-[#6B5A2A]/20"
              >
                {periods.map((period) => (
                  <option key={period.value} value={period.value}>
                    {period.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={generateCollage}
            disabled={loading || generating}
            className="mt-6 flex w-full items-center justify-center gap-3 rounded-[25px] bg-[#6B5A2A] py-4 font-['Inter'] text-lg font-semibold text-white shadow-md transition-all hover:bg-[#55491A] disabled:bg-[#CFD0B9] disabled:text-[#6B5A2A]/50"
          >
            {loading || generating ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>{generating ? 'Generating...' : `Loading ${selectedTypeLabel.toLowerCase()}...`}</span>
              </>
            ) : (
              <>
                <Grid3x3 className="h-6 w-6" />
                <span>Generate Collage</span>
              </>
            )}
          </button>
        </div>

        {/* Collage Display */}
        {items.length > 0 && (
          <div className="rounded-[30px] bg-white/70 p-6 shadow-lg backdrop-blur-sm ring-1 ring-[#CFD0B9]/30">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="font-['Amiri_Quran'] text-4xl font-normal text-[#3E3D1A]">
                Your {selectedTypeLabel} Collage
              </h2>
              <button
                onClick={downloadCollage}
                disabled={generating}
                className="flex items-center justify-center gap-2 rounded-[25px] bg-green-600 px-6 py-3 font-['Inter'] text-base font-semibold text-white shadow-md transition-all hover:bg-green-700 disabled:bg-[#CFD0B9] disabled:text-[#6B5A2A]/50"
              >
                <Download className="h-5 w-5" />
                <span>Download PNG</span>
              </button>
            </div>

            <div className="flex justify-center">
              <canvas
                ref={canvasRef}
                className="h-auto max-w-full rounded-[20px] shadow-2xl ring-2 ring-[#CFD0B9]/50"
              />
            </div>

            <p className="mt-6 text-center font-['Inter'] text-base text-[#6B5A2A]">
              {gridSize} collage from your top {selectedTypeLabel.toLowerCase()} ({periods.find(p => p.value === timePeriod)?.label})
            </p>
          </div>
        )}

        {/* Empty State */}
        {items.length === 0 && !loading && (
          <div className="rounded-[30px] bg-white/70 p-12 text-center shadow-lg backdrop-blur-sm ring-1 ring-[#CFD0B9]/30">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[#EECEA4]/30">
              <Grid3x3 className="h-12 w-12 text-[#6B5A2A]" />
            </div>
            <h3 className="mb-3 font-['Amiri_Quran'] text-3xl font-normal text-[#3E3D1A]">
              No Collage Yet
            </h3>
            <p className="font-['Inter'] text-base text-[#6B5A2A]">
              Pick artists, albums, or tracks, then choose a grid and time period to generate your collage
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Collage;