import React from 'react';
import { createRoot } from 'react-dom/client';

import App from './components/App';

import './styles.css';

import './loadingTest';

const rootElement = document.getElementById('root')!;
const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
