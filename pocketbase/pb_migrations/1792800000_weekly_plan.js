/// <reference path="../pb_data/types.d.ts" />

// One markdown plan per user per week (big picture, calendar, technical
// analysis), shown on every trade made in that week. week_start is the Monday
// the week starts on, in UTC, matching the BTC weekly candle.

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
        // "YYYY-MM-DD", a Monday
        { name: 'week_start', type: 'text', required: true, pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
        { name: 'content', type: 'text', max: 1000000 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_weekly_plan_user_week ON weekly_plan (user, week_start)',
      ],
    });
    app.save(weeklyPlan);
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('weekly_plan'));
  },
);
