# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.


## ACRCloud song recognition setup

Add these Vite environment variables in a `.env` file:

```bash
VITE_ACR_ACCESS_KEY=your_access_key
VITE_ACR_ACCESS_SECRET=your_access_secret
VITE_ACR_HOST=identify-eu-west-1.acrcloud.com
```

Then start the app and open the **Recognition** page from the navbar to upload an audio clip and identify a song.


## Spotify artist image fallback (optional)

If Last.fm does not return usable artist artwork, the app can fetch artist images from Spotify.

Add these Vite environment variables in a `.env` file:

```bash
VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id
VITE_SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
```

You can create these credentials in the Spotify Developer Dashboard by creating an app and using the **Client ID** and **Client Secret**.
