const assert = require('assert');

const {
  setConsent, consent, consentAccessToken, consentAccountRequestId, filterConsented,
} = require('../../app/authorise');
const { AUTH_SERVER_USER_CONSENTS_COLLECTION } = require('../../app/authorise/consents');

const { drop } = require('../../app/storage.js');

const username = 'testUsername';
const authorisationServerId = 'a123';
const scope = 'accounts';
const keys = { username, authorisationServerId, scope };

const accountRequestId = 'xxxxxx-xxxx-43c6-9c75-eaf01821375e';
const authorisationCode = 'spoofAuthCode';
const token = 'testAccessToken';
const tokenPayload = {
  access_token: token,
  expires_in: 3600,
  token_type: 'bearer',
};

const consentPayload = {
  username,
  authorisationServerId,
  scope,
  accountRequestId,
  expirationDateTime: null,
  authorisationCode,
  token: tokenPayload,
};

describe('set and get Consents', () => {
  beforeEach(async () => {
    await drop(AUTH_SERVER_USER_CONSENTS_COLLECTION);
  });

  afterEach(async () => {
    await drop(AUTH_SERVER_USER_CONSENTS_COLLECTION);
  });

  it('stores payload and allows consent to be retrieved by keys id', async () => {
    await setConsent(keys, consentPayload);
    const stored = await consent(keys);
    assert.equal(stored.id, `${username}:::${authorisationServerId}:::${scope}`);
  });

  it('stores payload and allows consent access_token to be retrieved', async () => {
    await setConsent(keys, consentPayload);
    const storedAccessToken = await consentAccessToken(keys);
    assert.equal(storedAccessToken, token);
  });

  it('stores payload and allows consent accountRequestId to be retrieved', async () => {
    await setConsent(keys, consentPayload);
    const storedAccountRequestId = await consentAccountRequestId(keys);
    assert.equal(storedAccountRequestId, accountRequestId);
  });
});

describe('filterConsented', () => {
  afterEach(async () => {
    await drop(AUTH_SERVER_USER_CONSENTS_COLLECTION);
  });

  describe('given authorisationServerId with authorisationCode in config', () => {
    beforeEach(async () => {
      await setConsent(keys, consentPayload);
    });

    it('returns array containing authorisationServerId', async () => {
      const consented = await filterConsented(username, scope, [authorisationServerId]);
      assert.deepEqual(consented, [authorisationServerId]);
    });
  });

  describe('given authorisationServerId with no authorisationCode in config', () => {
    beforeEach(async () => {
      await setConsent(keys, Object.assign(consentPayload, { authorisationCode: null }));
    });

    it('returns empty array', async () => {
      const consented = await filterConsented(username, scope, [authorisationServerId]);
      assert.deepEqual(consented, []);
    });
  });

  describe('given authorisationServerId without config', () => {
    it('returns empty array', async () => {
      const consented = await filterConsented(username, scope, [authorisationServerId]);
      assert.deepEqual(consented, []);
    });
  });
});
