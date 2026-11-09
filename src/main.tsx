import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/bungee';
import '@fontsource/bungee-shade';
import '@fontsource/press-start-2p';
import '@fontsource-variable/fredoka';
// Theme fonts (OFL); browsers only download a face when a theme actually uses it.
import '@fontsource/orbitron/500.css';
import '@fontsource/orbitron/700.css';
import '@fontsource/orbitron/900.css';
import '@fontsource/rajdhani/500.css';
import '@fontsource/rajdhani/700.css';
import '@fontsource/share-tech-mono';
import '@fontsource/pixelify-sans/400.css';
import '@fontsource/pixelify-sans/700.css';
import '@fontsource/silkscreen/400.css';
import '@fontsource/silkscreen/700.css';
import '@fontsource/vt323';
import './styles/main.scss';
import App from './App';
import { themeManager } from './themes/ThemeManager';

themeManager.apply();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
