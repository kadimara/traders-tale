import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/colors.css';
import './styles/semantic.css';
import './styles/utils.css';
import App from './App.tsx';
import { SessionProvider } from './context/SessionContext.tsx';
import { TradesProvider } from './context/TradesContext.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SessionProvider>
      <TradesProvider>
        <App />
      </TradesProvider>
    </SessionProvider>
  </StrictMode>
);
