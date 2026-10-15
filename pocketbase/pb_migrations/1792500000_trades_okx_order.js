/// <reference path="../pb_data/types.d.ts" />

// Links a planned trade to the OKX order placed for it ("<instId>:<ordId>"). Only
// the OKX order hook (pb_hooks/okx.pb.js) writes it; like okx_pos_key, the
// create/update rules stop clients from setting it.

const OWNER_CREATE_RULE = '@request.auth.id != "" && @request.body.user = @request.auth.id';
const OWNER_UPDATE_RULE =
  '@request.auth.id != "" && user = @request.auth.id && (@request.body.user:isset = false || @request.body.user = @request.auth.id)';
const NO_POS_KEY = ' && @request.body.okx_pos_key:isset = false';
const NO_ORDER = ' && @request.body.okx_order:isset = false';

migrate(
  (app) => {
    const trades = app.findCollectionByNameOrId('trades');
    trades.fields.add(new TextField({ name: 'okx_order', max: 128 }));
    trades.createRule = OWNER_CREATE_RULE + NO_POS_KEY + NO_ORDER;
    trades.updateRule = OWNER_UPDATE_RULE + NO_POS_KEY + NO_ORDER;
    app.save(trades);
  },
  (app) => {
    const trades = app.findCollectionByNameOrId('trades');
    trades.fields.removeByName('okx_order');
    trades.createRule = OWNER_CREATE_RULE + NO_POS_KEY;
    trades.updateRule = OWNER_UPDATE_RULE + NO_POS_KEY;
    app.save(trades);
  },
);
