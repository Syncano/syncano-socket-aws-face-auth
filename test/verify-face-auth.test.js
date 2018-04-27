import request from 'supertest';
import { assert } from 'chai';
import { run, generateMeta } from '@syncano/test';
import 'dotenv/config';
import config from './utils/helpers';

describe('verify-face-auth', () => {
  const meta = generateMeta('remove-face-auth');
  const {
    SYNCANO_INSTANCE_NAME: INSTANCE_NAME, TEST_USER_EMAIL1: firstUserEmail,
    TEST_USER_EMAIL2: secondUserEmail, TEST_USER_PASSWORD: userPassword
  } = process.env;

  const LOGIN_URL = `https://api.syncano.io/v2/instances/${INSTANCE_NAME}/` +
    'endpoints/sockets/rest-auth/login/';
  const loginUrl = request(LOGIN_URL);

  let firstUserToken, secondUserToken = '';

  before((done) => {
    loginUrl.post('/')
      .send({ username: firstUserEmail, password: userPassword })
      .then((res) => {
        // if first user login successful set firstUserToken
        if (res.status === 200) {
          firstUserToken = res.body.token;
        }
        return loginUrl.post('/')
          .send({ username: secondUserEmail, password: userPassword });
      })
      .then((res) => {
        // if second user login successful set secondUserToken
        if (res.status === 200) {
          secondUserToken = res.body.token;
        }
        done();
      })
      .catch((err) => {
        done(err);
      });
  });

  describe('with valid user credentials', () => {
    it('should return "is_face_auth" false if user not registered for face authentication',
      async () => {
        const argsFaceNotRegistered = { username: secondUserEmail, token: secondUserToken };
        const { data, code } =
          await run('verify-face-auth', { args: argsFaceNotRegistered, meta, config });

        assert.strictEqual(code, 200);
        assert.propertyVal(data, 'is_face_auth', false);
        assert.property(data, 'message');
      });

    it('should return "is_face_auth" true if user registered for face authentication', async () => {
      const argsFaceRegistered = { username: firstUserEmail, token: firstUserToken };
      const { data, code } =
        await run('verify-face-auth', { args: argsFaceRegistered, meta, config });
      assert.strictEqual(code, 200);
      assert.propertyVal(data, 'is_face_auth', true);
      assert.property(data, 'message');
    });
  });

  describe('with invalid user credentials', () => {
    it('should show "Given credentials does not match any user account." if username not existing',
      async () => {
        const argsInvalidUsername = {
          username: 'you22lllll@gmail.com', token: '11e118aa4eefeff12ab6d1'
        };
        const { data, code } =
          await run('verify-face-auth', { args: argsInvalidUsername, meta, config });
        assert.strictEqual(code, 401);
        assert.propertyVal(data, 'message', 'Given credentials does not match any user account.');
      });

    it('should show "Given credentials does not match any user account." if token not for user',
      async () => {
        const argsInvalidUserToken = {
          username: firstUserEmail, token: '11e118aa4ee12ab6d18a6de930787'
        };
        const { data, code } =
          await run('verify-face-auth', { args: argsInvalidUserToken, meta, config });
        assert.strictEqual(code, 401);
        assert.propertyVal(data, 'message', 'Given credentials does not match any user account.');
      });


    it('should return message "Validation error(s)" if token parameter is empty', async () => {
      const argsValidation = { username: firstUserEmail, token: '' };
      const { data, code } =
        await run('verify-face-auth', { args: argsValidation, meta, config });
      assert.strictEqual(code, 400);
      assert.propertyVal(data, 'message', 'Validation error(s)');
    });
  });
});
