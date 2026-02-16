const routeDefinitions = [
  {
    path: '/',
    pageKey: 'Home',
    withUsername: true,
    label: 'Home',
    mobileLabel: 'Home',
    description: 'Recent listening activity and now playing.',
  },
  {
    path: '/charts',
    pageKey: 'Charts',
    withUsername: true,
    label: 'Charts',
    mobileLabel: 'Charts',
    description: 'Your top artists, albums, and tracks.',
  },
  
  {
    path: '/statistics',
    pageKey: 'Statistics',
    withUsername: true,
    label: 'Statistics',
    mobileLabel: 'Stats',
    description: 'Listening trends and activity over time.',
  },
  {
    path: '/collage',
    pageKey: 'Collage',
    withUsername: true,
    label: 'Collage',
    mobileLabel: 'Collage',
    description: 'Generate and export album or artist collages.',
  },
  {
    path: '/friends',
    pageKey: 'Friends',
    withUsername: true,
    label: 'Friends',
    mobileLabel: 'Friends',
    description: 'Compare your listening with Last.fm friends.',
  },
  {
    path: '/profile',
    pageKey: 'Profile',
    withUsername: true,
    label: 'Profile',
    mobileLabel: 'Profile',
    description: 'Profile insights, badges, and account view.',
  },
  {
    path: '/recommendations',
    pageKey: 'Recommendations',
    withUsername: true,
    label: 'Recommendations',
    mobileLabel: 'Recs',
    description: 'Suggested songs and artists based on your taste.',
  },
  {
    path: '/recognition',
    pageKey: 'Recognition',
    withUsername: false,
    label: 'Recognition',
    mobileLabel: 'Recognize',
    description: 'Identify tracks from audio snippets.',
  },
  {
    path: '/goals',
    pageKey: 'ListeningGoals',
    withUsername: true,
    label: 'Goals',
    mobileLabel: 'Goals',
    description: 'Track listening goals and streaks.',
  },
  {
    path: '/discovery',
    pageKey: 'DiscoveryLab',
    withUsername: true,
    label: 'Discovery',
    mobileLabel: 'Discover',
    description: 'Explore related artists and deep cuts.',
  },
  {
    path: '/playlist-generator',
    pageKey: 'PlaylistGenerator',
    withUsername: true,
    label: 'Playlist Generator',
    mobileLabel: 'Playlist',
    description: 'Generate AI-curated playlists based on your listening habits.',
  },
];

export const authenticatedRoutes = routeDefinitions.map(({ path, pageKey, withUsername }) => ({
  path,
  pageKey,
  withUsername,
}));

export const navigationItems = routeDefinitions.map(({ path, label, mobileLabel, description }) => ({
  path,
  label,
  mobileLabel,
  description,
}));
