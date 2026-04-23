import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './styles/semantic.css';
import './styles/trade.css';
import './styles/utils.css';

// GitHub Pages SPA deep-link fix: GH Pages serves a 404 for any path it doesn't
// recognise (e.g. /traders-tale/journal). public/404.html catches that, saves the
// intended URL to sessionStorage, then redirects to /traders-tale/. This script
// runs before the router initialises — it restores the saved URL via
// history.replaceState so the router sees the correct path and renders the right page.
(function () {
  const redirect = sessionStorage.redirect;
  if (redirect) {
    delete sessionStorage.redirect;
    history.replaceState(null, '', redirect);
  }
})();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
