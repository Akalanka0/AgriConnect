import React from 'react';
import { createRoot } from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import App from './App.jsx';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

const root = document.getElementById('root');
if (!root) {
  throw new Error('No root element found. Make sure index.html contains <div id="root"></div>');
}

createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
