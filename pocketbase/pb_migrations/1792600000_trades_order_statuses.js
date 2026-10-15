/// <reference path="../pb_data/types.d.ts" />

// Trade statuses follow the OKX order: planned -> live (order placed) -> filled
// (position open) -> closed (position closed), or canceled. missed stays for
// setups that weren't taken; taken becomes closed.

const OLD = ['planned', 'taken', 'missed'];
const NEW = ['planned', 'live', 'filled', 'canceled', 'closed', 'missed'];

function setStatuses(app, values, from, to) {
  const trades = app.findCollectionByNameOrId('trades');
  // Allow both values while the records are converted.
  trades.fields.getByName('status').values = [...new Set([...values, from, to])];
  app.save(trades);
  app.db().newQuery('UPDATE trades SET status = {:to} WHERE status = {:from}').bind({ from, to }).execute();
  trades.fields.getByName('status').values = values;
  app.save(trades);
}

migrate(
  (app) => {
    setStatuses(app, NEW, 'taken', 'closed');
    // Trades already sent to OKX; the next sync moves them on if the order filled or was cancelled.
    app.db().newQuery("UPDATE trades SET status = 'live' WHERE status = 'planned' AND okx_order != ''").execute();
  },
  (app) => {
    // Closest old status for each order state.
    const back = { live: 'planned', filled: 'closed', canceled: 'missed' };
    for (const [from, to] of Object.entries(back)) {
      app.db().newQuery('UPDATE trades SET status = {:to} WHERE status = {:from}').bind({ from, to }).execute();
    }
    setStatuses(app, OLD, 'closed', 'taken');
  },
);
