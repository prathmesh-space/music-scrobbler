import { useEffect, useState } from 'react';

const formatArtists = (artists) => {
  if (!artists) return '';
  if (typeof artists === 'string') return artists;
  if (!Array.isArray(artists)) return '';

  return artists
    .map((artist) => (typeof artist === 'string' ? artist : artist?.name))
    .filter(Boolean)
    .join(', ');
};

const getSpotifyTrackId = (result) =>
  result?.external_ids?.spotify?.track?.id || result?.externalIds?.spotify?.track?.id;

const getYoutubeVideoId = (result) =>
  result?.external_ids?.youtube?.vid || result?.externalIds?.youtube?.vid;

export default function ResultCard({ result }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  if (!result) {
    return (
      <div className="result-card error">
        <div className="error-icon">⚠</div>
        <p>No song detected</p>
      </div>
    );
  }

  const artists = formatArtists(result.artists);
  const album = result.album?.name || result.album;
  const score = result.score ?? result.confidence;
  const spotifyTrackId = getSpotifyTrackId(result);
  const youtubeVideoId = getYoutubeVideoId(result);

  return (
    <div className={`result-card success ${isVisible ? 'visible' : ''}`}>
      <div className="result-header">
        <div className="vinyl-icon">
          <div className="vinyl-spin"></div>
        </div>
        <div className="confidence-badge">
          {Math.round(score || 0)}% Match
        </div>
      </div>

      <div className="result-content">
        <h2 className="song-title">{result.title}</h2>
        <p className="artist-name">{artists || 'Unknown artist'}</p>
        
        {album && (
          <div className="album-info">
            <span className="label">Album:</span>
            <span className="value">{album}</span>
          </div>
        )}

        {result.releaseDate && (
          <div className="release-info">
            <span className="label">Released:</span>
            <span className="value">{result.releaseDate}</span>
          </div>
        )}

        {result.genres && result.genres.length > 0 && (
          <div className="genres">
            {result.genres.map((genre, i) => (
              <span key={i} className="genre-tag">{genre}</span>
            ))}
          </div>
        )}

        {(result.externalIds || result.external_ids) && (
          <div className="external-links">
            {spotifyTrackId && (
              <a 
                href={`https://open.spotify.com/track/${spotifyTrackId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="platform-link spotify"
              >
                <span>🎵</span> Spotify
              </a>
            )}
            {youtubeVideoId && (
              <a 
                href={`https://youtube.com/watch?v=${youtubeVideoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="platform-link youtube"
              >
                <span>▶</span> YouTube
              </a>
            )}
          </div>
        )}
      </div>

      <div className="scan-lines"></div>
    </div>
  );
}
