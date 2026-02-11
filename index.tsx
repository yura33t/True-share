
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error("Critical: Root element not found.");
} else {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (err) {
    console.error("Rendering error:", err);
    rootElement.innerHTML = `
      <div style="height: 100vh; display: flex; align-items: center; justify-content: center; background: black; color: white; font-family: sans-serif; text-align: center; padding: 20px;">
        <div>
          <h1 style="font-size: 20px; margin-bottom: 10px;">Startup Error</h1>
          <p style="font-size: 14px; opacity: 0.5; max-width: 300px; margin: 0 auto;">The application could not be started due to a technical issue.</p>
          <button onclick="window.location.reload()" style="margin-top: 24px; background: white; color: black; border: none; padding: 12px 24px; border-radius: 12px; font-weight: bold; cursor: pointer;">Retry</button>
        </div>
      </div>
    `;
  }
}
