function bump(map, key, value = 1) {
  map.set(key, (map.get(key) ?? 0) + value)
}

function topEntries(map, limit = 20) {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }))
}

export function buildAnalytics(scrobbles) {
  const byDay = new Map()
  const byArtist = new Map()
  const byTrack = new Map()

  let firstListen = null
  let latestListen = null

  for (const item of scrobbles) {
    const date = new Date(item.listenedAt * 1000)
    const day = date.toISOString().slice(0, 10)

    bump(byDay, day)
    bump(byArtist, item.artist)
    bump(byTrack, `${item.artist} — ${item.track}`)

    if (!firstListen || item.listenedAt < firstListen) firstListen = item.listenedAt
    if (!latestListen || item.listenedAt > latestListen) latestListen = item.listenedAt
  }

  return {
    generatedAt: new Date().toISOString(),
    totals: {
      scrobbles: scrobbles.length,
      uniqueArtists: byArtist.size,
      uniqueTracks: byTrack.size
    },
    range: {
      firstListen,
      latestListen
    },
    topArtists: topEntries(byArtist),
    topTracks: topEntries(byTrack),
    activityByDay: [...byDay.entries()]
      .sort((a, b) => (a[0] > b[0] ? 1 : -1))
      .map(([day, count]) => ({ day, count }))
  }
}
