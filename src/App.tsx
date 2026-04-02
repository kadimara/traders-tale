import { MonthProvider } from '@lib/context/MonthContext';
import { Router } from './lib/components/Router';
import { SessionProvider } from './lib/context/SessionContext';
import { TradesProvider } from './lib/context/TradesContext';
import Auth from './routes/Auth';
import Futures from './routes/Futures';
import Home from './routes/Home';
import Layout from './routes/Layout';
import Spot from './routes/Spot';

export default function App() {
  return (
    <SessionProvider>
      <Router>
        <MonthProvider>
          <TradesProvider>
            <Layout>
              <Router path="" element={<Home />} />
              <Router path="spot" element={<Spot />} />
              <Router path="futures" element={<Futures />} />
            </Layout>
          </TradesProvider>
        </MonthProvider>
      </Router>
      <Router path="auth" element={<Auth />} />
    </SessionProvider>
  );
}
