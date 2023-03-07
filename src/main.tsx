import React from 'react';
import { createRoot } from 'react-dom/client';

import App from './components/App';

import './styles.css';

// import * as loadingTest from './loadingTest';
// console.log(loadingTest);

const rootElement = document.getElementById('root')!;
const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
