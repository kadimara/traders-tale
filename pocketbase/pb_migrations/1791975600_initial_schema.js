/// <reference path="../pb_data/types.d.ts" />

// Mirrors the Supabase tables: trades, monthly_plan, playbook.
// Every row belongs to a user; the rules below replace Supabase row-level security.

const ownerRules = {
  listRule: '@request.auth.id != "" && user = @request.auth.id',
  viewRule: '@request.auth.id != "" && user = @request.auth.id',
  createRule: '@request.auth.id != "" && @request.body.user = @request.auth.id',
  updateRule:
    '@request.auth.id != "" && user = @request.auth.id && (@request.body.user:isset = false || @request.body.user = @request.auth.id)',
  deleteRule: '@request.auth.id != "" && user = @request.auth.id',
};

function ownerField(usersId) {
  return {
    name: 'user',
    type: 'relation',
    collectionId: usersId,
    maxSelect: 1,
    cascadeDelete: true,
    required: true,
  };
}

const timestampFields = [
  { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
  { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
];

migrate(
  (app) => {
    const usersId = app.findCollectionByNameOrId('users').id;

    // Note: PocketBase treats 0 as "missing" for required number fields,
    // so numeric columns are left optional and validated in the app.
    const trades = new Collection({
      type: 'base',
      name: 'trades',
      ...ownerRules,
      fields: [
        ownerField(usersId),
        // Trade date; user-editable, used for month filtering (Supabase: created_at).
        { name: 'created_at', type: 'date', required: true },
        { name: 'symbol', type: 'text', required: true },
        { name: 'long_short', type: 'text', required: true },
        { name: 'account', type: 'number' },
        { name: 'amount', type: 'number' },
        { name: 'entry', type: 'number' },
        { name: 'stop', type: 'number' },
        { name: 'exit', type: 'number' },
        { name: 'fees', type: 'number' },
        { name: 'risk', type: 'number' },
        { name: 'pnl', type: 'number' },
        { name: 'journal', type: 'text', max: 1000000 },
        { name: 'playbook', type: 'bool' },
        {
          name: 'status',
          type: 'select',
          values: ['planned', 'taken', 'missed'],
          maxSelect: 1,
          required: true,
        },
        ...timestampFields,
      ],
      indexes: ['CREATE INDEX idx_trades_user_created_at ON trades (user, created_at)'],
    });
    app.save(trades);

    const monthlyPlan = new Collection({
      type: 'base',
      name: 'monthly_plan',
      ...ownerRules,
      fields: [
        ownerField(usersId),
        // "YYYY-MM-01"
        { name: 'month_year', type: 'text', required: true, pattern: '^\\d{4}-\\d{2}-01$' },
        { name: 'content', type: 'text', max: 1000000 },
        ...timestampFields,
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_monthly_plan_user_month ON monthly_plan (user, month_year)',
      ],
    });
    app.save(monthlyPlan);

    const playbook = new Collection({
      type: 'base',
      name: 'playbook',
      ...ownerRules,
      fields: [
        ownerField(usersId),
        { name: 'title', type: 'text' },
        { name: 'description', type: 'text', max: 1000000 },
        ...timestampFields,
      ],
    });
    app.save(playbook);
  },
  (app) => {
    for (const name of ['playbook', 'monthly_plan', 'trades']) {
      app.delete(app.findCollectionByNameOrId(name));
    }
  },
);
