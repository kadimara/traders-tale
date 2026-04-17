import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
} from '@tanstack/react-router';
import { MonthProvider } from '@lib/context/MonthContext';
import { TradesProvider } from '@lib/context/TradesContext';
import Layout from './routes/Layout';
import Auth from './routes/Auth';
import Home from './routes/Home';
import Spot from './routes/Spot';
import Futures from './routes/Futures';
import Trade from './routes/Trade';

const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

const authRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth',
  component: Auth,
});

// Pathless layout route — wraps all authenticated routes with providers + Layout
const layoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'layout',
  component: () => (
    <MonthProvider>
      <TradesProvider>
        <Layout>
          <Outlet />
        </Layout>
      </TradesProvider>
    </MonthProvider>
  ),
});

const homeRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/',
  component: Home,
});

const spotRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/spot',
  component: Spot,
});

const futuresRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/futures',
  component: Futures,
});

const tradeRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/trade/$id',
  component: Trade,
});

const routeTree = rootRoute.addChildren([
  authRoute,
  tradeRoute,
  layoutRoute.addChildren([homeRoute, spotRoute, futuresRoute, tradeRoute]),
]);

export const router = createRouter({
  routeTree,
  basepath: '/traders-tale',
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
