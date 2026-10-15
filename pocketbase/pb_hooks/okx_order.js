/// <reference path="../pb_data/types.d.ts" />

// Places a planned trade on OKX as a limit order at its entry, with a stop-loss
// attached at its SL (market close once triggered). Needs an OKX key with Trade
// permission; everything else in the integration only reads.
//
// The size comes from the trade's amount (USD) and entry, like the contracts shown
// in the app, with the instrument's real contract value, rounded down to whole
// lots so the order never risks more than planned.
// The order is stored on the trade as okx_order ("<instId>:<ordId>") and the
// trade's status follows it: live while it waits, filled once a position is
// open, canceled. refreshLive (a cron job in okx.pb.js) checks live orders every
// minute; the sync sets closed when the position closes.

const TD_MODE = 'isolated'; // margin mode; leverage is whatever is set on OKX for the instrument
const ACTIVE_STATES = ['live', 'partially_filled', 'filled'];

/** OKX order -> trade status. A partly filled order that was cancelled still opened a position. */
function statusOf(order) {
  if (order.state === 'live' || order.state === 'partially_filled') return 'live';
  if (order.state === 'filled' || Number(order.accFillSz) > 0) return 'filled';
  return 'canceled';
}

/** Decimal places of an OKX step such as "0.1" or "0.00001". */
const decimalsOf = (step) => (String(step).split('.')[1] || '').length;
const toStep = (value, step) => (Math.round(value / Number(step)) * Number(step)).toFixed(decimalsOf(step));

/** The live EEA perpetual of a symbol, e.g. BTC -> BTC-USD_UM_XPERP-310404. */
function instrumentFor(okx, symbol) {
  const family = symbol + '-USD_UM_XPERP';
  const data = okx.request(
    null,
    'GET',
    '/api/v5/public/instruments?instType=FUTURES&instFamily=' + encodeURIComponent(family),
    null,
    false,
  );
  const live = data.filter((i) => i.state === 'live');
  if (live.length !== 1) throw new BadRequestError('No OKX perpetual found for ' + symbol + '.');
  return live[0];
}

/** The OKX order of an okx_order value ("<instId>:<ordId>"). */
function fetchOrder(okx, conn, okxOrder) {
  const [instId, ordId] = okxOrder.split(':');
  const data = okx.request(
    conn,
    'GET',
    '/api/v5/trade/order?instId=' + encodeURIComponent(instId) + '&ordId=' + encodeURIComponent(ordId),
    null,
    true,
  );
  return data[0];
}

/** The user's trade, or a 404. */
function findTrade(app, userId, tradeId) {
  let record;
  try {
    record = app.findRecordById('trades', tradeId);
  } catch (_) {
    throw new NotFoundError('Trade not found.');
  }
  if (record.getString('user') !== userId) throw new NotFoundError('Trade not found.');
  return record;
}

/** Works out the order for a trade without placing it. */
function plan(app, userId, tradeId) {
  const okx = require(`${__hooks}/okx_lib.js`);
  const conn = okx.connectionFor(app, userId);

  const record = findTrade(app, userId, tradeId);
  if (record.getString('status') !== 'planned') throw new BadRequestError('Only planned trades can be sent to OKX.');

  const symbol = record.getString('symbol').trim().toUpperCase();
  const entry = record.getFloat('entry');
  const stop = record.getFloat('stop');
  const amount = record.getFloat('amount');
  if (!(entry > 0) || !(stop > 0) || !(amount > 0)) {
    throw new BadRequestError('The trade needs an entry, SL and size.');
  }
  const long = record.getString('long_short') === 'long';
  if (long ? stop >= entry : stop <= entry) {
    throw new BadRequestError('The SL must be ' + (long ? 'below' : 'above') + ' the entry.');
  }

  const existingState = record.getString('okx_order')
    ? fetchOrder(okx, conn, record.getString('okx_order')).state
    : null;
  if (existingState && ACTIVE_STATES.includes(existingState)) {
    throw new BadRequestError('This trade already has an OKX order (' + existingState + ').');
  }

  const inst = instrumentFor(okx, symbol);
  const ctVal = Number(inst.ctVal);
  const lotSz = Number(inst.lotSz);
  const px = toStep(entry, inst.tickSz);
  const slTriggerPx = toStep(stop, inst.tickSz);
  // amount is the app's contract count in USD, rounded to cents; allow for that
  // rounding (half a cent), or 269 contracts would come back as 268.
  const lotUsd = ctVal * entry * lotSz;
  const lots = Math.floor((amount + 0.005) / lotUsd + 1e-9);
  const sz = (lots * lotSz).toFixed(decimalsOf(inst.lotSz));
  if (Number(sz) < Number(inst.minSz)) {
    throw new BadRequestError('The size is below the OKX minimum of ' + inst.minSz + ' contract(s).');
  }

  const posMode = okx.request(conn, 'GET', '/api/v5/account/config', null, true)[0].posMode;
  const ticker = okx.request(null, 'GET', '/api/v5/market/ticker?instId=' + encodeURIComponent(inst.instId), null, false);

  const order = {
    instId: inst.instId,
    tdMode: TD_MODE,
    side: long ? 'buy' : 'sell',
    ordType: 'limit',
    px,
    sz,
    // Unique per attempt: a cancelled trade can be sent again.
    clOrdId: 'tt' + record.id + Date.now().toString(36),
    attachAlgoOrds: [{ slTriggerPx, slOrdPx: '-1', slTriggerPxType: 'last' }],
  };
  if (posMode === 'long_short_mode') order.posSide = long ? 'long' : 'short';

  const usd = Number(sz) * ctVal * Number(px);
  return {
    tradeId: record.id,
    symbol,
    long_short: long ? 'long' : 'short',
    order,
    contracts: Number(sz),
    sizeUsd: Math.round(usd * 100) / 100,
    riskUsd: Math.round(usd * Math.abs(Number(slTriggerPx) / Number(px) - 1) * 100) / 100,
    lastPx: Number(ticker[0].last),
    previousOrderState: existingState,
  };
}

/** Places a planned order on OKX, links it to the trade and makes the trade live. */
function place(app, userId, result) {
  const okx = require(`${__hooks}/okx_lib.js`);
  const conn = okx.connectionFor(app, userId);
  const ordId = okx.request(conn, 'POST', '/api/v5/trade/order', result.order, true)[0].ordId;
  const record = app.findRecordById('trades', result.tradeId);
  record.set('okx_order', result.order.instId + ':' + ordId);
  record.set('status', 'live');
  app.save(record);
  return ordId;
}

/**
 * Cancels a live trade's order (OKX cancels the attached stop-loss with it) and
 * sets the trade's status to the order's state afterwards: canceled, or filled
 * when it filled before the cancel arrived.
 */
function cancel(app, userId, tradeId) {
  const okx = require(`${__hooks}/okx_lib.js`);
  const conn = okx.connectionFor(app, userId);
  const record = findTrade(app, userId, tradeId);
  const okxOrder = record.getString('okx_order');
  if (!okxOrder || record.getString('status') !== 'live') {
    throw new BadRequestError('Only live trades have an OKX order to cancel.');
  }

  const [instId, ordId] = okxOrder.split(':');
  let cancelError = null;
  try {
    okx.request(conn, 'POST', '/api/v5/trade/cancel-order', { instId, ordId }, true);
  } catch (err) {
    cancelError = err; // e.g. already filled or cancelled on OKX; the state below tells
  }
  let status = statusOf(fetchOrder(okx, conn, okxOrder));
  if (status === 'live') {
    if (cancelError) throw cancelError;
    status = 'canceled'; // accepted, but OKX may still report it as live for a moment
  }
  record.set('status', status);
  app.save(record);
  return status;
}

/**
 * Moves every user's live trades to filled or canceled once their OKX order has.
 * Read-only towards OKX. A user whose connection fails is skipped and logged, so
 * one broken key doesn't stop the others.
 */
function refreshLive(app) {
  const okx = require(`${__hooks}/okx_lib.js`);
  const records = app.findRecordsByFilter('trades', "status = 'live' && okx_order != ''", '', 0, 0);
  const byUser = {};
  for (const r of records) (byUser[r.getString('user')] = byUser[r.getString('user')] || []).push(r);

  for (const [userId, trades] of Object.entries(byUser)) {
    try {
      const conn = okx.connectionFor(app, userId);
      for (const record of trades) {
        const status = statusOf(fetchOrder(okx, conn, record.getString('okx_order')));
        if (status === 'live') continue;
        record.set('status', status);
        app.save(record);
      }
    } catch (err) {
      app.logger().warn('OKX live order check failed', 'user', userId, 'error', String(err));
    }
  }
}

module.exports = { plan, place, cancel, refreshLive, statusOf, fetchOrder };
