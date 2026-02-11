
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

console.log("TrueShare: Entry point starting...");

const container = document.getElementById('root');

if (container) {
  try {
    const root = ReactDOM.createRoot(container);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    // Если мы дошли до сюда, скрипт начал работу. 
    // App.tsx сам покажет свой лоадер "Initializing", если нужно.
    console.log("TrueShare: React render initiated");
  } catch (error) {
    console.error("TrueShare: Render error", error);
    container.innerHTML = `<div style="color: white; padding: 50px; text-align: center; font-family: sans-serif;">
      <h2 style="color: #ff4444">Critical System Error</h2>
      <p style="opacity: 0.5; font-size: 14px;">${error}</p>
      <button onclick="window.location.reload()" style="margin-top: 20px; background: white; color: black; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer;">Retry</button>
    </div>`;
  }
}
