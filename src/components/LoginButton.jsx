import React from "react";

const LoginButton = () => {
  const API_KEY = import.meta.env.VITE_LASTFM_API_KEY;
  const CALLBACK_URL = "http://localhost:5173/callback";

  const handleLogin = () => {
    if (!API_KEY) {
      alert("API key missing");
      return;
    }

    const authUrl = `https://www.last.fm/api/auth/?api_key=${API_KEY}&cb=${CALLBACK_URL}`;
    window.location.href = authUrl;
  };

  return (
    <div style={{ height: "100vh", display: "grid", placeItems: "center" }}>
      <button onClick={handleLogin}>Login with Last.fm</button>
    </div>
  );
};

export default LoginButton;
