import { useEffect, useState } from 'react';

export default function ResultCard({ result }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  if (!result || !result.success) {
    return (
      <div className="result-card error">
        <div className="error-icon">⚠</div>
        <p>{result?.message || 'No song detected'}</p>
      </div>
    );
  }

  return (
    <div className={`result-card success ${isVisible ? 'visible' : ''}`}>
      <div className="result-header">
        <div className="vinyl-icon">
          <div className="vinyl-spin"></div>
        </div>
        <div className="confidence-badge">
          {Math.round(result.score)}% Match
        </div>
      </div>

      <div className="result-content">
        <h2 className="song-title">{result.title}</h2>
        <p className="artist-name">{result.artists}</p>
        
        {result.album && (
          <div className="album-info">
            <span className="label">Album:</span>
            <span className="value">{result.album}</span>
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

        {result.externalIds && (
          <div className="external-links">
            {result.externalIds.spotify && (
              <a 
                href={`https://open.spotify.com/track/${result.externalIds.spotify.track.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="platform-link spotify"
              >
                <span>🎵</span> Spotify
              </a>
            )}
            {result.externalIds.youtube && (
              <a 
                href={`https://youtube.com/watch?v=${result.externalIds.youtube.vid}`}
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
