
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

console.log("Index: Script started");

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error("Index: Root element not found.");
} else {
  try {
    console.log("Index: React rendering start");
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("Index: React rendering initiated");
  } catch (err) {
    console.error("Index: Critical rendering error", err);
    rootElement.innerHTML = `
      <div style="height: 100vh; display: flex; align-items: center; justify-content: center; background: black; color: white; font-family: sans-serif; text-align: center; padding: 20px;">
        <div>
          <h1 style="font-size: 20px; margin-bottom: 10px;">Startup Error</h1>
          <p style="font-size: 14px; opacity: 0.5; max-width: 300px; margin: 0 auto;">Failed to mount the application. This might be a version conflict.</p>
          <button onclick="window.location.reload()" style="margin-top: 24px; background: white; color: black; border: none; padding: 12px 24px; border-radius: 12px; font-weight: bold; cursor: pointer;">Retry</button>
        </div>
      </div>
    `;
  }
}
