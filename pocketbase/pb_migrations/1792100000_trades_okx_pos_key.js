/// <reference path="../pb_data/types.d.ts" />

// Links a trade to the closed OKX position it was synced from ("<posId>-<openTime>";
// OKX reuses posId across positions on the same instrument). Only the OKX sync hook
// (pb_hooks/okx.pb.js) writes it; the create/update rules stop clients from setting it.

const OWNER_CREATE_RULE = '@request.auth.id != "" && @request.body.user = @request.auth.id';
const OWNER_UPDATE_RULE =
  '@request.auth.id != "" && user = @request.auth.id && (@request.body.user:isset = false || @request.body.user = @request.auth.id)';
const NO_POS_KEY = ' && @request.body.okx_pos_key:isset = false';

migrate(
  (app) => {
    const trades = app.findCollectionByNameOrId('trades');
    trades.fields.add(new TextField({ name: 'okx_pos_key', max: 64 }));
    trades.addIndex(
      'idx_trades_user_okx_pos_key',
      true,
      'user, okx_pos_key',
      "okx_pos_key != ''",
    );
    trades.createRule = OWNER_CREATE_RULE + NO_POS_KEY;
    trades.updateRule = OWNER_UPDATE_RULE + NO_POS_KEY;
    app.save(trades);
  },
  (app) => {
    const trades = app.findCollectionByNameOrId('trades');
    trades.removeIndex('idx_trades_user_okx_pos_key');
    trades.fields.removeByName('okx_pos_key');
    trades.createRule = OWNER_CREATE_RULE;
    trades.updateRule = OWNER_UPDATE_RULE;
    app.save(trades);
  },
);
