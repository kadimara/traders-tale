import { Router } from './components/Router';
import { SessionProvider } from './context/SessionContext';
import { TradesProvider } from './context/TradesContext';
import Home from './routes/Home';
import Layout from './routes/Layout';
import Login from './routes/Login';
import Trades from './routes/Trades';

export default function App() {
  return (
    <SessionProvider>
      <Router>
        <TradesProvider>
          <Layout>
            <Router path="" element={<Home />} />
            <Router path="trades" element={<Trades />} />
          </Layout>
        </TradesProvider>
      </Router>
      <Router path="login" element={<Login />} />
    </SessionProvider>
  );
}
