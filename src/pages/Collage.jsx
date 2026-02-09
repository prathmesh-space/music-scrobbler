import { useState, useRef } from 'react';
import { getTopAlbums } from '../services/lastfm';
import { Download, Grid3x3, Loader2 } from 'lucide-react';
import { useEffect } from "react";


const Collage = ({ username }) => {
  const [gridSize, setGridSize] = useState('3x3');
  const [timePeriod, setTimePeriod] = useState('7day');
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const canvasRef = useRef(null);

  const gridSizes = ['3x3', '4x4', '5x5'];
  const periods = [
    { value: '7day', label: '7 Days' },
    { value: '1month', label: '1 Month' },
    { value: '3month', label: '3 Months' },
    { value: '6month', label: '6 Months' },
    { value: '12month', label: '1 Year' },
    { value: 'overall', label: 'All Time' },
  ];

  const getGridDimensions = () => {
    const [rows, cols] = gridSize.split('x').map(Number);
    return { rows, cols, total: rows * cols };
  };

  const generateCollage = async () => {
    setLoading(true);
    setGenerating(false);

    try {
      const { total } = getGridDimensions();
      const albumsData = await getTopAlbums(username, timePeriod, total);
      const albumList = albumsData.album || [];

      // Filter albums with images
      const albumsWithImages = albumList
        .filter(album => album.image?.[3]?.['#text'])
        .slice(0, total);

      setAlbums(albumsWithImages);

    } catch (error) {
      console.error('Error generating collage:', error);
    } finally {
      setLoading(false);
    }
  };

  const createCollageImage = async (albumList) => {
    setGenerating(true);
    const { rows, cols } = getGridDimensions();
    const albumSize = 300; // Size of each album art
    const canvasSize = albumSize * cols;

    const canvas = canvasRef.current;
    if (!canvas) {
  console.error("Canvas not ready");
  setGenerating(false);
  return;
}
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    const ctx = canvas.getContext('2d');

    // Load all images
    const imagePromises = albumList.map((album) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = album.image[3]['#text'];
      });
    });

    try {
      const images = await Promise.all(imagePromises);

      // Draw images on canvas
      images.forEach((img, index) => {
        const row = Math.floor(index / cols);
        const col = index % cols;
        const x = col * albumSize;
        const y = row * albumSize;

        ctx.drawImage(img, x, y, albumSize, albumSize);
      });

      setGenerating(false);
    } catch (error) {
      console.error('Error loading images:', error);
      setGenerating(false);
    }
  };

  const downloadCollage = () => {
    const canvas = canvasRef.current;
    const link = document.createElement('a');
    link.download = `collage-${gridSize}-${timePeriod}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  useEffect(() => {
  if (albums.length === 0) return;
  if (!canvasRef.current) return;

  createCollageImage(albums);
}, [albums]);


  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Album Art Collage Generator</h1>

        {/* Controls */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8 border border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Grid Size Selector */}
            <div>
              <label className="block text-gray-400 mb-3 font-semibold">Grid Size</label>
              <div className="flex gap-3">
                {gridSizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setGridSize(size)}
                    className={`flex-1 px-4 py-3 rounded-lg font-semibold transition ${
                      gridSize === size
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <Grid3x3 className="w-5 h-5 inline mr-2" />
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Period Selector */}
            <div>
              <label className="block text-gray-400 mb-3 font-semibold">Time Period</label>
              <select
                value={timePeriod}
                onChange={(e) => setTimePeriod(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
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
            className="w-full mt-6 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white font-bold py-4 rounded-lg transition flex items-center justify-center space-x-2"
          >
            {loading || generating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{generating ? 'Generating...' : 'Loading albums...'}</span>
              </>
            ) : (
              <>
                <Grid3x3 className="w-5 h-5" />
                <span>Generate Collage</span>
              </>
            )}
          </button>
        </div>

        {/* Canvas Display */}
        {albums.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">Your Collage</h2>
              <button
                onClick={downloadCollage}
                disabled={generating}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-semibold px-6 py-2 rounded-lg transition flex items-center space-x-2"
              >
                <Download className="w-5 h-5" />
                <span>Download PNG</span>
              </button>
            </div>

            <div className="flex justify-center">
              <canvas
                ref={canvasRef}
                className="max-w-full h-auto border border-gray-600 rounded-lg shadow-2xl"
              />
            </div>

            <p className="text-gray-400 text-center mt-4">
              {gridSize} collage from your top albums ({timePeriod})
            </p>
          </div>
        )}

        {/* Instructions */}
        {albums.length === 0 && !loading && (
          <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 text-center">
            <Grid3x3 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Collage Yet</h3>
            <p className="text-gray-400">
              Select your preferred grid size and time period, then click "Generate Collage" to create your album art grid.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Collage;