import request from 'supertest';
import { assert } from 'chai';
import { run, generateMeta } from '@syncano/test';
import 'dotenv/config';
import config from './utils/helpers';

describe('remove-face-auth', () => {
  const meta = generateMeta('remove-face-auth');
  const {
    SYNCANO_INSTANCE_NAME: INSTANCE_NAME, AWS_BUCKET_NAME: bucketName,
    AWS_S3_USER_IMAGE_KEY: userImage, TEST_USER_EMAIL1: firstUserEmail,
    TEST_USER_EMAIL2: secondUserEmail, TEST_USER_PASSWORD: userPassword,
    INAVLID_USER_AWS_S3_IMAGE_KEY: wrongImage
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
    it('should return "Face authentication not enabled for user account." if user not ' +
    'registered for face authentication',
    async () => {
      const argsFaceNotRegistered = {
        username: secondUserEmail,
        token: secondUserToken,
        image: userImage,
        bucketName,
      };
      const { data, code } = await run('remove-face-auth', { args: argsFaceNotRegistered, meta, config });
      assert.strictEqual(code, 400);
      assert.propertyVal(data, 'message', 'Face authentication not enabled for user account.');
    });

    it('should return "Face image not tied to this account." if image parameter not for user',
      async () => {
        const argsWrongFace = {
          username: firstUserEmail,
          token: firstUserToken,
          image: wrongImage,
          bucketName,
        };
        const { data, code } = await run('remove-face-auth', { args: argsWrongFace, meta, config });
        assert.strictEqual(code, 400);
        assert.propertyVal(data, 'message', 'Face image not tied to this account.');
      });

    it('should remove user account from face authentication if all parameters for user valid',
      async () => {
        const argsFaceRegistered = {
          username: firstUserEmail,
          token: firstUserToken,
          image: userImage,
          bucketName,
        };
        const { data, code } = await run('remove-face-auth', { args: argsFaceRegistered, meta, config });
        assert.strictEqual(code, 200);
        assert.propertyVal(data, 'message', 'User account removed from face authentication.');
      });
  });

  describe('with invalid user credentials', () => {
    it('should show "Given credentials does not match any user account." if username not existing',
      async () => {
        const argsInvalidUsername = {
          username: 'you22lllll@gmail.com',
          token: '11e118aa4eefeff12ab6d1',
          image: userImage,
          bucketName,
        };
        const { data, code } = await run('remove-face-auth', { args: argsInvalidUsername, meta, config });
        assert.strictEqual(code, 401);
        assert.propertyVal(data, 'message', 'Given credentials does not match any user account.');
      });

    it('should show "Given credentials does not match any user account." if token not for user',
      async () => {
        const argsInvalidUserToken = {
          username: firstUserEmail,
          token: '11e118aa4eefeff12ab6d18a6de930787',
          image: userImage,
          bucketName,
        };
        const { data, code } =
          await run('remove-face-auth', { args: argsInvalidUserToken, meta, config });
        assert.strictEqual(code, 401);
        assert.propertyVal(data, 'message', 'Given credentials does not match any user account.');
      });

    it('should return message "Validation error(s)" if username parameter is empty', async () => {
      const argsValidation = { username: '', token: 'tokenString' };
      const { data, code } = await run('remove-face-auth', { args: argsValidation, meta, config });
      assert.strictEqual(code, 400);
      assert.propertyVal(data, 'message', 'Validation error(s)');
    });
  });
});
