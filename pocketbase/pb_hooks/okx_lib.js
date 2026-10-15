/// <reference path="../pb_data/types.d.ts" />

// OKX REST helpers for pb_hooks/okx.pb.js. Route handlers run in an isolated
// scope, so each handler loads this module with require(`${__hooks}/okx_lib.js`).
//
// Every user has their own OKX connection: a record in the locked
// `okx_connections` collection (superusers add it in the PocketBase dashboard).
// The keys never reach the browser, and okx.pb.js encrypts them whenever a
// connection is saved (AES-256-GCM, stored as "enc:<ciphertext>").

// The OKX platform the API keys are created on (EEA). Keys only work there.
const BASE_URL = 'https://eea.okx.com';

const SECRET_FIELDS = ['api_key', 'secret', 'passphrase'];
const ENC_PREFIX = 'enc:';

// The encryption key lives next to pb_data (gitignored), not inside it, so a copy
// of the database alone doesn't reveal the OKX keys. Created on first use.
function encryptionKey() {
  const path = $filepath.join(__hooks, '..', 'okx.key');
  try {
    const key = toString($os.readFile(path)).trim();
    if (key.length === 32) return key;
  } catch (_) {
    // missing: create below
  }
  if (encryptedConnectionsExist()) {
    // A new key could never decrypt the stored connections.
    throw new ApiError(500, 'pocketbase/okx.key is missing or invalid; OKX connections cannot be decrypted.');
  }
  const key = $security.randomString(32);
  $os.writeFile(path, key, 0o600);
  return key;
}

function encryptedConnectionsExist() {
  return $app
    .findAllRecords('okx_connections')
    .some((r) => SECRET_FIELDS.some((f) => r.getString(f).startsWith(ENC_PREFIX)));
}

/** Encrypts any secret field that isn't encrypted yet; returns true if anything changed. */
function encryptConnection(record) {
  let changed = false;
  for (const field of SECRET_FIELDS) {
    const value = record.getString(field).trim();
    if (value && !value.startsWith(ENC_PREFIX)) {
      record.set(field, ENC_PREFIX + $security.encrypt(value, encryptionKey()));
      changed = true;
    }
  }
  return changed;
}

function decryptField(record, field) {
  const value = record.getString(field);
  if (!value.startsWith(ENC_PREFIX)) return value.trim();
  try {
    return toString($security.decrypt(value.slice(ENC_PREFIX.length), encryptionKey()));
  } catch (_) {
    throw new ApiError(500, 'Could not decrypt the OKX connection; re-enter its keys in the dashboard.');
  }
}

/** The user's OKX connection record, or null. */
function findConnection(app, userId) {
  try {
    return app.findFirstRecordByData('okx_connections', 'user', userId);
  } catch (_) {
    return null;
  }
}

/** Credentials of the user's connection; throws when there is none. */
function connectionFor(app, userId) {
  const record = findConnection(app, userId);
  if (!record) throw new BadRequestError('No OKX connection for this account.');
  return {
    key: decryptField(record, 'api_key'),
    secret: decryptField(record, 'secret'),
    passphrase: decryptField(record, 'passphrase'),
  };
}

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

// $security.hs256 returns hex; OKX wants the raw HMAC bytes base64-encoded.
function hexToBase64(hex) {
  const bytes = [];
  for (let i = 0; i < hex.length; i += 2) bytes.push(parseInt(hex.substr(i, 2), 16));
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b1 = bytes[i + 1];
    const b2 = bytes[i + 2];
    const n = (bytes[i] << 16) | ((b1 || 0) << 8) | (b2 || 0);
    out += B64[(n >> 18) & 63] + B64[(n >> 12) & 63];
    out += b1 === undefined ? '=' : B64[(n >> 6) & 63];
    out += b2 === undefined ? '=' : B64[n & 63];
  }
  return out;
}

function sign(prehash, secret) {
  return hexToBase64($security.hs256(prehash, secret));
}

/**
 * Sends a request to OKX and returns `data`; throws with OKX's message on
 * failure. Unsigned when `signed` is false (public data).
 */
function request(conn, method, path, body, signed) {
  const bodyStr = body ? JSON.stringify(body) : '';
  const headers = { 'Content-Type': 'application/json' };
  if (signed) {
    const timestamp = new Date().toISOString();
    headers['OK-ACCESS-KEY'] = conn.key;
    headers['OK-ACCESS-SIGN'] = sign(timestamp + method + path + bodyStr, conn.secret);
    headers['OK-ACCESS-TIMESTAMP'] = timestamp;
    headers['OK-ACCESS-PASSPHRASE'] = conn.passphrase;
  }

  const res = $http.send({
    url: BASE_URL + path,
    method,
    body: bodyStr || undefined,
    headers,
    timeout: 15,
  });
  const json = res.json;
  if (!json || json.code !== '0') {
    // Some endpoints put the real reason in data[0].sMsg
    const detail = json && json.data && json.data[0] && json.data[0].sMsg;
    const msg = detail || (json && json.msg) || 'HTTP ' + res.statusCode;
    throw new BadRequestError('OKX: ' + msg);
  }
  return json.data;
}

/** All closed positions OKX still returns (about 3 months), newest first. */
function closedPositions(conn) {
  const all = [];
  let after = '';
  for (let page = 0; page < 20; page++) {
    const rows = request(
      conn,
      'GET',
      '/api/v5/account/positions-history?limit=100' + (after ? '&after=' + after : ''),
      null,
      true,
    );
    all.push(...rows);
    if (rows.length < 100) break;
    after = rows[rows.length - 1].uTime;
  }
  return all;
}

/** Total equity of the trading account in USD, including unrealized PnL. */
function accountEquity(conn) {
  const data = request(conn, 'GET', '/api/v5/account/balance', null, true);
  return Number(data[0].totalEq);
}

/** Contract value (coins per contract) of an instrument, from OKX's public list. */
function contractValue(conn, instType, instId, cache) {
  const key = instType + ':' + instId;
  if (!(key in cache)) {
    const data = request(
      conn,
      'GET',
      '/api/v5/public/instruments?instType=' + instType + '&instId=' + encodeURIComponent(instId),
      null,
      false,
    );
    if (!data.length) throw new BadRequestError('Unknown OKX instrument ' + instId + '.');
    cache[key] = Number(data[0].ctVal);
  }
  return cache[key];
}

/** "BTC-USD_UM_XPERP-310404" or "BTC-USDT-SWAP" -> "BTC" */
function symbolOf(instId) {
  return String(instId).split('-')[0].toUpperCase();
}

module.exports = {
  hexToBase64,
  request,
  connectionFor,
  encryptConnection,
  closedPositions,
  accountEquity,
  contractValue,
  symbolOf,
};
