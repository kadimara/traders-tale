/// <reference path="../pb_data/types.d.ts" />

// One living markdown plan per user (big picture, calendar, technical
// analysis), updated as the week goes on. New trades copy it into their journal.

migrate(
  (app) => {
    const usersId = app.findCollectionByNameOrId('users').id;

    const weeklyPlan = new Collection({
      type: 'base',
      name: 'weekly_plan',
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
      indexes: [
        'CREATE UNIQUE INDEX idx_weekly_plan_user ON weekly_plan (user)',
      ],
    });
    app.save(weeklyPlan);
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('weekly_plan'));
  },
);
