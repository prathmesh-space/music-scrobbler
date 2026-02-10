import { useCallback, useEffect, useRef, useState } from 'react';
import { getTopAlbums, getTopArtists, getTopTracks } from '../services/lastfm';
import { Download, Grid3x3, Loader2 } from 'lucide-react';
import { getLastFmImageUrl } from '../utils/lastfmImage.js';

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

const Collage = ({ username }) => {
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

      const itemsWithImages = rawItems
        .map((item) => ({ ...item, imageUrl: getLastFmImageUrl(item.image) }))
        .filter((item) => item.imageUrl)
        .slice(0, total);
      setItems(itemsWithImages);
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
    <div className="min-h-screen bg-gray-900 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-8 text-4xl font-bold text-white">Music Collage Generator</h1>

        <div className="mb-8 rounded-lg border border-gray-700 bg-gray-800 p-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div>
              <label className="mb-3 block font-semibold text-gray-400">Collage Type</label>
              <select
                value={collageType}
                onChange={(e) => setCollageType(e.target.value)}
                className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
              >
                {collageTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-3 block font-semibold text-gray-400">Grid Size</label>
              <div className="flex gap-3">
                {gridSizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setGridSize(size)}
                    className={`flex-1 rounded-lg px-4 py-3 font-semibold transition ${
                      gridSize === size
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <Grid3x3 className="mr-2 inline h-5 w-5" />
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-3 block font-semibold text-gray-400">Time Period</label>
              <select
                value={timePeriod}
                onChange={(e) => setTimePeriod(e.target.value)}
                className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
              >
                {periods.map((period) => (
                  <option key={period.value} value={period.value}>
                    {period.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={generateCollage}
            disabled={loading || generating}
            className="mt-6 flex w-full items-center justify-center space-x-2 rounded-lg bg-purple-600 py-4 font-bold text-white transition hover:bg-purple-700 disabled:bg-gray-600"
          >
            {loading || generating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>{generating ? 'Generating...' : `Loading ${selectedTypeLabel.toLowerCase()}...`}</span>
              </>
            ) : (
              <>
                <Grid3x3 className="h-5 w-5" />
                <span>Generate Collage</span>
              </>
            )}
          </button>
        </div>

        {items.length > 0 && (
          <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Your {selectedTypeLabel} Collage</h2>
              <button
                onClick={downloadCollage}
                disabled={generating}
                className="flex items-center space-x-2 rounded-lg bg-green-600 px-6 py-2 font-semibold text-white transition hover:bg-green-700 disabled:bg-gray-600"
              >
                <Download className="h-5 w-5" />
                <span>Download PNG</span>
              </button>
            </div>

            <div className="flex justify-center">
              <canvas
                ref={canvasRef}
                className="h-auto max-w-full rounded-lg border border-gray-600 shadow-2xl"
              />
            </div>

            <p className="mt-4 text-center text-gray-400">
              {gridSize} collage from your top {selectedTypeLabel.toLowerCase()} ({timePeriod})
            </p>
          </div>
        )}

        {items.length === 0 && !loading && (
          <div className="rounded-lg border border-gray-700 bg-gray-800 p-8 text-center">
            <Grid3x3 className="mx-auto mb-4 h-16 w-16 text-gray-600" />
            <h3 className="mb-2 text-xl font-semibold text-white">No Collage Yet</h3>
            <p className="text-gray-400">
              Pick artists, albums, or tracks, then choose a grid and time period to generate a collage.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Collage;
