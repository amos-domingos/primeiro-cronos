
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

console.log("CRONOS: Iniciando renderização React...");

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<App />);
  console.log("CRONOS: App renderizado com sucesso.");
} else {
  console.error("CRONOS: Elemento root não encontrado!");
}
