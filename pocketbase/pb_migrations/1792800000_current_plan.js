/// <reference path="../pb_data/types.d.ts" />

// The user's current trading plan: one record per user (unique index), edited on
// the Plan page and copied into the journal of every new trade.

migrate(
  (app) => {
    const usersId = app.findCollectionByNameOrId('users').id;

    const currentPlan = new Collection({
      type: 'base',
      name: 'current_plan',
      listRule: '@request.auth.id != "" && user = @request.auth.id',
      viewRule: '@request.auth.id != "" && user = @request.auth.id',
      createRule: '@request.auth.id != "" && @request.body.user = @request.auth.id',
      updateRule:
        '@request.auth.id != "" && user = @request.auth.id && (@request.body.user:isset = false || @request.body.user = @request.auth.id)',
      deleteRule: '@request.auth.id != "" && user = @request.auth.id',
      fields: [
        {
          name: 'user',
          type: 'relation',
          collectionId: usersId,
          maxSelect: 1,
          cascadeDelete: true,
          required: true,
        },
        { name: 'content', type: 'text', max: 1000000 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_current_plan_user ON current_plan (user)'],
    });
    app.save(currentPlan);
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('current_plan'));
  },
);
