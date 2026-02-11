
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

/**
 * TrueShare Entry Point
 * Рендеринг приложения с использованием React 19.
 */

const container = document.getElementById('root');

if (container) {
  try {
    const root = ReactDOM.createRoot(container);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (error) {
    console.error("Critical Render Error:", error);
  }
}
