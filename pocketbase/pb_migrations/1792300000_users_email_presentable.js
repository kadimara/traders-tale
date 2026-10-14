/// <reference path="../pb_data/types.d.ts" />

// Show users by email in dashboard relation pickers (e.g. okx_connections.user)
// instead of only their record id.

migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users');
    users.fields.getByName('email').presentable = true;
    app.save(users);
  },
  (app) => {
    const users = app.findCollectionByNameOrId('users');
    users.fields.getByName('email').presentable = false;
    app.save(users);
  },
);
