
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

console.log("TrueShare: Initializing entry point...");

const container = document.getElementById('root');

if (container) {
  try {
    const root = ReactDOM.createRoot(container);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("TrueShare: React render called successfully");
  } catch (error) {
    console.error("TrueShare: Fatal render error:", error);
    container.innerHTML = `<div style="color: white; padding: 40px; text-align: center;"><h1>Initialization Failed</h1><p>${error}</p></div>`;
  }
} else {
  console.error("TrueShare: Root container not found!");
}
