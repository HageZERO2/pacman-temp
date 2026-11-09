import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/bungee';
import '@fontsource/bungee-shade';
import '@fontsource/press-start-2p';
import '@fontsource-variable/fredoka';
import './styles/main.scss';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
