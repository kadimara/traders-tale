/// <reference path="../pb_data/types.d.ts" />

// missed merges into canceled: a setup that wasn't taken and an order that was
// cancelled both end without a position.

const WITH_MISSED = ['planned', 'live', 'filled', 'canceled', 'closed', 'missed'];
const WITHOUT_MISSED = ['planned', 'live', 'filled', 'canceled', 'closed'];

migrate(
  (app) => {
    app.db().newQuery("UPDATE trades SET status = 'canceled' WHERE status = 'missed'").execute();
    const trades = app.findCollectionByNameOrId('trades');
    trades.fields.getByName('status').values = WITHOUT_MISSED;
    app.save(trades);
  },
  (app) => {
    // Missed and cancelled trades can't be told apart any more; they stay canceled.
    const trades = app.findCollectionByNameOrId('trades');
    trades.fields.getByName('status').values = WITH_MISSED;
    app.save(trades);
  },
);
