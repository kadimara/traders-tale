/// <reference path="../pb_data/types.d.ts" />

// One OKX API connection per user, added by a superuser in the PocketBase
// dashboard. All API rules stay null (superusers only), so no browser can read
// these records; only pb_hooks/okx_lib.js uses them.

migrate(
  (app) => {
    const usersId = app.findCollectionByNameOrId('users').id;

    const connections = new Collection({
      type: 'base',
      name: 'okx_connections',
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        {
          name: 'user',
          type: 'relation',
          collectionId: usersId,
          maxSelect: 1,
          cascadeDelete: true,
          required: true,
        },
        { name: 'api_key', type: 'text', required: true, max: 200 },
        { name: 'secret', type: 'text', required: true, max: 200 },
        { name: 'passphrase', type: 'text', required: true, max: 200 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_okx_connections_user ON okx_connections (user)'],
    });
    app.save(connections);
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('okx_connections'));
  },
);
