import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

// Registro do Service Worker para suporte PWA/Offline
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(registration => {
        console.log('Cronos SW registrado com sucesso:', registration.scope);
      })
      .catch(error => {
        console.error('Falha ao registrar Cronos SW:', error);
      });
  });
}

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}