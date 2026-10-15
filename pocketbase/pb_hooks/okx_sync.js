/// <reference path="../pb_data/types.d.ts" />

// Syncs the user's trades with OKX (read-only towards OKX).
//
// Each closed position either fills in the journal trade it belongs to, or
// becomes a new "closed" trade. A trade matches when it has the same symbol and
// direction, was created within MATCH_WINDOW_MS of the position opening, and its
// entry is within MATCH_PRICE of OKX's average open price. Pairs are assigned
// best-first (closest price and time), so an exact match is never taken by a
// neighbouring position. A live or filled trade placed as an OKX order
// (okx_order) matches a position on that instrument opened any time after the
// trade, not only within the window.
// Synced trades store okx_pos_key, so a position is never imported twice.
//
// Live trades whose order has since filled or been cancelled on OKX get the
// matching status (see statusOf in okx_order.js).

const MATCH_WINDOW_MS = 36 * 3600 * 1000;
const MATCH_PRICE = 0.003; // 0.3%

const round = (n, digits) => Math.round(n * 10 ** digits) / 10 ** digits;
const timeOf = (record) => Date.parse(record.getString('created_at').replace(' ', 'T'));

/** OKX closed position -> trade fields. pnl includes fees and funding (OKX realizedPnl). */
function positionFields(p, ctVal) {
  const entry = Number(p.openAvgPx);
  return {
    entry,
    exit: round(Number(p.closeAvgPx), 4),
    amount: round(Number(p.openMaxPos) * ctVal * entry, 2),
    // OKX reports costs as negative numbers; trades store them as a positive cost.
    fees: round(-(Number(p.fee) + Number(p.fundingFee) + Number(p.liqPenalty || 0)), 4),
    pnl: round(Number(p.realizedPnl), 4),
    status: 'closed',
  };
}

/** Works out what a sync would change, without writing anything. */
function plan(app, userId) {
  const okx = require(`${__hooks}/okx_lib.js`);
  const conn = okx.connectionFor(app, userId);
  const positions = okx.closedPositions(conn).sort((a, b) => Number(a.cTime) - Number(b.cTime));
  const records = app.findRecordsByFilter('trades', 'user = {:user}', 'created_at', 0, 0, { user: userId });

  const linked = new Set(records.map((r) => r.getString('okx_pos_key')).filter(Boolean));
  const used = new Set();
  const ctValues = {};
  const updates = [];
  const creates = [];
  let alreadySynced = 0;

  const pending = [];
  for (const p of positions) {
    const posKey = p.posId + '-' + p.cTime;
    if (linked.has(posKey)) {
      alreadySynced++;
      continue;
    }
    pending.push({
      p,
      posKey,
      symbol: okx.symbolOf(p.instId),
      direction: p.direction, // 'long' | 'short'
      openTime: Number(p.cTime),
      fields: positionFields(p, okx.contractValue(conn, p.instType, p.instId, ctValues)),
    });
  }

  // Every plausible (position, trade) pair, scored 0 (identical) to 2 (edge of both limits).
  const pairs = [];
  for (const item of pending) {
    for (const r of records) {
      if (r.getString('okx_pos_key')) continue;
      if (r.getString('symbol').trim().toUpperCase() !== item.symbol) continue;
      if (r.getString('long_short') !== item.direction) continue;
      // A trade sent to OKX as an order may fill any time after it was planned.
      const ordered =
        ['live', 'filled'].includes(r.getString('status')) &&
        r.getString('okx_order').split(':')[0] === item.p.instId &&
        item.openTime >= timeOf(r);
      const timeDiff = ordered ? 0 : Math.abs(timeOf(r) - item.openTime);
      const entry = r.getFloat('entry');
      if (timeDiff > MATCH_WINDOW_MS || !(entry > 0)) continue;
      const priceDiff = Math.abs(entry / item.fields.entry - 1);
      if (priceDiff > MATCH_PRICE) continue;
      pairs.push({ item, record: r, score: priceDiff / MATCH_PRICE + timeDiff / MATCH_WINDOW_MS });
    }
  }
  pairs.sort((a, b) => a.score - b.score);
  for (const pair of pairs) {
    if (pair.item.match || used.has(pair.record.id)) continue;
    pair.item.match = pair.record;
    used.add(pair.record.id);
  }

  for (const { p, posKey, symbol, direction, openTime, fields, match: best } of pending) {
    if (best) {
      const stop = best.getFloat('stop');
      const account = best.getFloat('account');
      const changes = { ...fields, okx_pos_key: posKey };
      if (stop > 0 && account > 0) {
        changes.risk = round((fields.amount / account) * Math.abs(stop / fields.entry - 1), 4);
      }
      updates.push({
        tradeId: best.id,
        date: new Date(timeOf(best)).toISOString(),
        symbol,
        long_short: direction,
        statusBefore: best.getString('status'),
        exitBefore: best.getFloat('exit') || null,
        pnlBefore: best.getFloat('pnl') || null,
        changes,
      });
    } else {
      creates.push({
        date: new Date(openTime).toISOString(),
        symbol,
        long_short: direction,
        instId: p.instId,
        changes: {
          ...fields,
          okx_pos_key: posKey,
          created_at: new Date(openTime).toISOString(),
          symbol,
          long_short: direction,
          stop: 0,
          risk: 0,
          playbook: false,
          journal: '_Imported from OKX (' + p.instId + '). Add your plan and review._',
        },
      });
    }
  }

  // New trades carry the account forward from the trade before them, like
  // adding a trade in the table does (account + PnL of a closed trade).
  const timeline = records
    .map((r) => {
      const update = updates.find((u) => u.tradeId === r.id);
      return {
        time: timeOf(r),
        account: r.getFloat('account'),
        status: update ? 'closed' : r.getString('status'),
        pnl: update ? update.changes.pnl : r.getFloat('pnl'),
      };
    })
    .concat(creates.map((c) => ({ time: Date.parse(c.date), create: c })))
    .sort((a, b) => a.time - b.time);
  let prev = null;
  for (const item of timeline) {
    if (item.create) {
      item.account = prev ? round(prev.account + (prev.status === 'closed' ? prev.pnl : 0), 2) : 0;
      item.status = 'closed';
      item.pnl = item.create.changes.pnl;
      item.create.changes.account = item.account;
    }
    prev = item;
  }

  // Live orders that filled or were cancelled since they were placed.
  const okxOrder = require(`${__hooks}/okx_order.js`);
  const orders = [];
  for (const r of records) {
    if (r.getString('status') !== 'live' || !r.getString('okx_order')) continue;
    if (updates.some((u) => u.tradeId === r.id)) continue; // already closed by a position
    const status = okxOrder.statusOf(okxOrder.fetchOrder(okx, conn, r.getString('okx_order')));
    if (status === 'live') continue;
    orders.push({
      tradeId: r.id,
      date: new Date(timeOf(r)).toISOString(),
      symbol: r.getString('symbol'),
      long_short: r.getString('long_short'),
      statusBefore: 'live',
      status,
    });
  }

  return { updates, creates, orders, alreadySynced, closedPositions: positions.length };
}

/** Writes a plan in one transaction. */
function apply(app, userId, result) {
  app.runInTransaction((txApp) => {
    for (const u of result.updates) {
      const record = txApp.findRecordById('trades', u.tradeId);
      if (record.getString('user') !== userId) throw new ForbiddenError('Trade does not belong to you.');
      for (const [name, value] of Object.entries(u.changes)) record.set(name, value);
      txApp.save(record);
    }
    for (const o of result.orders) {
      const record = txApp.findRecordById('trades', o.tradeId);
      if (record.getString('user') !== userId) throw new ForbiddenError('Trade does not belong to you.');
      record.set('status', o.status);
      txApp.save(record);
    }
    const collection = txApp.findCollectionByNameOrId('trades');
    for (const c of result.creates) {
      const record = new Record(collection);
      record.set('user', userId);
      for (const [name, value] of Object.entries(c.changes)) record.set(name, value);
      txApp.save(record);
    }
  });
}

module.exports = { plan, apply };
