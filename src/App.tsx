import { Route, Routes } from 'react-router';
import { SessionProvider } from './context/SessionContext';
import Layout from './Layout';
import Dashboard from './routes/Dashboard';
import Home from './routes/Home';
import Login from './routes/Login';

export default function App() {
  return (
    <SessionProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>
        <Route path="/login" element={<Login />} />
      </Routes>
    </SessionProvider>
  );
}
