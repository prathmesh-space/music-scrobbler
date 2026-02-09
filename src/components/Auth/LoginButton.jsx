import React from 'react';

const LoginButton = ({ onClick }) => {
  return (
    <div style={{ height: '100vh', display: 'grid', placeItems: 'center' }}>
      <button onClick={onClick}>Login with Last.fm</button>
      </div>
  );
};

export default LoginButton;
