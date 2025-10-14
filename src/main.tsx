import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/semantic.css';
import './styles/utils.css';
import './styles/trade.css';
import App from './App.tsx';
import { SessionProvider } from './context/SessionContext.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SessionProvider>
      <App />
    </SessionProvider>
  </StrictMode>
);
