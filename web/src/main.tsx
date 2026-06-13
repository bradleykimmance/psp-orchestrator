import App from './App.tsx';
import { StrictMode } from 'react';
// eslint-disable-next-line import/no-unassigned-import
import './index.css';
import { createRoot } from 'react-dom/client';

createRoot(document.querySelector('#root') as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
