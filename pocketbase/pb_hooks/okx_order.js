/// <reference path="../pb_data/types.d.ts" />

// Places a planned trade on OKX as a limit order at its entry, with a stop-loss
// attached at its SL (market close once triggered). Needs an OKX key with Trade
// permission; everything else in the integration only reads.
//
// The size comes from the trade's amount (USD) and entry, like the contracts shown
// in the app, with the instrument's real contract value, rounded down to whole
// lots so the order never risks more than planned.
// The order is stored on the trade as okx_order ("<instId>:<ordId>"), so a trade
// is only sent again once its previous order was cancelled.

const TD_MODE = 'isolated'; // margin mode; leverage is whatever is set on OKX for the instrument
const ACTIVE_STATES = ['live', 'partially_filled', 'filled'];

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

/** The state of the order already placed for a trade, or null. */
function existingOrderState(okx, conn, okxOrder) {
  if (!okxOrder) return null;
  const [instId, ordId] = okxOrder.split(':');
  const data = okx.request(
    conn,
    'GET',
    '/api/v5/trade/order?instId=' + encodeURIComponent(instId) + '&ordId=' + encodeURIComponent(ordId),
    null,
    true,
  );
  return data[0].state;
}

/** Works out the order for a trade without placing it. */
function plan(app, userId, tradeId) {
  const okx = require(`${__hooks}/okx_lib.js`);
  const conn = okx.connectionFor(app, userId);

  let record;
  try {
    record = app.findRecordById('trades', tradeId);
  } catch (_) {
    throw new NotFoundError('Trade not found.');
  }
  if (record.getString('user') !== userId) throw new NotFoundError('Trade not found.');
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

  const existingState = existingOrderState(okx, conn, record.getString('okx_order'));
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

/** Places a planned order on OKX and links it to the trade. */
function place(app, userId, result) {
  const okx = require(`${__hooks}/okx_lib.js`);
  const conn = okx.connectionFor(app, userId);
  const ordId = okx.request(conn, 'POST', '/api/v5/trade/order', result.order, true)[0].ordId;
  const record = app.findRecordById('trades', result.tradeId);
  record.set('okx_order', result.order.instId + ':' + ordId);
  app.save(record);
  return ordId;
}

module.exports = { plan, place };
