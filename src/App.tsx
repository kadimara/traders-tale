import { Router } from './components/Router';
import { SessionProvider } from './context/SessionContext';
import { TradesProvider } from './context/TradesContext';
import Auth from './routes/Auth';
import Futures from './routes/Futures';
import Home from './routes/Home';
import Layout from './routes/Layout';
import Spot from './routes/Spot';

export default function App() {
  return (
    <SessionProvider>
      <Router>
        <TradesProvider>
          <Layout>
            <Router path="" element={<Home />} />
            <Router path="spot" element={<Spot />} />
            <Router path="futures" element={<Futures />} />
          </Layout>
        </TradesProvider>
      </Router>
      <Router path="auth" element={<Auth />} />
    </SessionProvider>
  );
}
