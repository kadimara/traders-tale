/// <reference path="../pb_data/types.d.ts" />

// OKX integration. Each logged-in user works with their own OKX connection from
// the okx_connections collection (see okx_lib.js). Only /api/okx/order and
// /api/okx/cancel write to OKX; everything else reads.

// Encrypt the API key, secret and passphrase whenever a connection is saved,
// including when a superuser types them into the dashboard.
onRecordCreate((e) => {
  require(`${__hooks}/okx_lib.js`).encryptConnection(e.record);
  e.next();
}, 'okx_connections');

onRecordUpdate((e) => {
  require(`${__hooks}/okx_lib.js`).encryptConnection(e.record);
  e.next();
}, 'okx_connections');

// Encrypt connections that were stored before encryption existed.
onBootstrap((e) => {
  e.next();
  const okx = require(`${__hooks}/okx_lib.js`);
  for (const record of e.app.findAllRecords('okx_connections')) {
    if (okx.encryptConnection(record)) e.app.save(record);
  }
});

// The user's current OKX account equity in USD, used as the account of new trades.
routerAdd(
  'GET',
  '/api/okx/balance',
  (e) => {
    const okx = require(`${__hooks}/okx_lib.js`);
    return e.json(200, { totalEq: okx.accountEquity(okx.connectionFor($app, e.auth.id)) });
  },
  $apis.requireAuth('users'),
);

// Imports closed OKX positions into the user's trades. Without {"apply": true}
// it only returns what would change, so the app can ask for confirmation first.
routerAdd(
  'POST',
  '/api/okx/sync',
  (e) => {
    const sync = require(`${__hooks}/okx_sync.js`);
    const body = e.requestInfo().body || {};
    const result = sync.plan($app, e.auth.id);
    if (body.apply === true) sync.apply($app, e.auth.id, result);
    return e.json(200, { applied: body.apply === true, ...result });
  },
  $apis.requireAuth('users'),
);

// Sends a planned trade to OKX as a limit order with an attached stop-loss (see
// okx_order.js). Without {"apply": true} it only returns the order it would place;
// with it, the body must repeat the previewed price and size, so the order placed
// is the one that was confirmed.
routerAdd(
  'POST',
  '/api/okx/order',
  (e) => {
    const okxOrder = require(`${__hooks}/okx_order.js`);
    const body = e.requestInfo().body || {};
    const result = okxOrder.plan($app, e.auth.id, String(body.tradeId || ''));
    if (body.apply !== true) return e.json(200, { placed: false, ...result });
    if (body.px !== result.order.px || body.sz !== result.order.sz) {
      throw new BadRequestError('The trade changed since the preview; send it again.');
    }
    const ordId = okxOrder.place($app, e.auth.id, result);
    return e.json(200, { placed: true, ordId, ...result });
  },
  $apis.requireAuth('users'),
);

// Cancels the OKX order of a live trade and returns the trade's new status.
routerAdd(
  'POST',
  '/api/okx/cancel',
  (e) => {
    const okxOrder = require(`${__hooks}/okx_order.js`);
    const body = e.requestInfo().body || {};
    return e.json(200, { status: okxOrder.cancel($app, e.auth.id, String(body.tradeId || '')) });
  },
  $apis.requireAuth('users'),
);
