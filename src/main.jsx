import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { escucharSesion } from './lib/supabase';
import './index.css';

// Mantiene codecup_token con el access token vigente de Supabase (spec 0019).
escucharSesion();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
