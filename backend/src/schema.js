function toString(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function toInteger(value) {
  const n = Number(value)
  return Number.isFinite(n) ? Math.trunc(n) : 0
}

export function normalizeScrobble(record) {
  const artist = toString(record.artist)
  const track = toString(record.track)
  const album = toString(record.album)
  const listenedAt = toInteger(record.listenedAt ?? record.timestamp)

  if (!artist || !track || listenedAt <= 0) {
    return null
  }

  return {
    artist,
    track,
    album,
    listenedAt
  }
}
