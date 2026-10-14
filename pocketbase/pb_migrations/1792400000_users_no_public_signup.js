/// <reference path="../pb_data/types.d.ts" />

// The server is public (api.traders-tale.com), so nobody may create an account
// through the API anymore. New users are added by a superuser in the dashboard.

migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users');
    users.createRule = null;
    app.save(users);
  },
  (app) => {
    const users = app.findCollectionByNameOrId('users');
    users.createRule = '';
    app.save(users);
  },
);
