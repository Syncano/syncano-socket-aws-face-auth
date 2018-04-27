import request from 'supertest';
import { assert } from 'chai';
import { run, generateMeta } from '@syncano/test';
import 'dotenv/config';
import config from './utils/helpers';

describe('face-register', () => {
  const meta = generateMeta('face-register');

  const {
    SYNCANO_INSTANCE_NAME: INSTANCE_NAME, AWS_BUCKET_NAME: bucketName,
    AWS_S3_USER_IMAGE_KEY: userImage, AWS_S3_MULTIPLE_USER_IMAGES_KEY: multipleFaces,
    TEST_USER_EMAIL1: firstUserEmail, TEST_USER_EMAIL2: secondUserEmail,
    TEST_USER_PASSWORD: userPassword
  } = process.env;

  const REGISTER_URL = `https://api.syncano.io/v2/instances/${INSTANCE_NAME}/` +
    'endpoints/sockets/rest-auth/register/';
  const registerUrl = request(REGISTER_URL);

  const LOGIN_URL = `https://api.syncano.io/v2/instances/${INSTANCE_NAME}/` +
    'endpoints/sockets/rest-auth/login/';
  const loginUrl = request(LOGIN_URL);

  const args = {
    username: firstUserEmail,
    password: userPassword,
    image: userImage,
    bucketName,
  };

  before((done) => {
    loginUrl.post('/')
      .send({ username: firstUserEmail, password: userPassword })
      .then((res) => {
        if (res.status === 400) {
          return registerUrl.post('/')
            .send({ username: firstUserEmail, password: userPassword });
        }
        return { status: true };
      })
      .then(() => {
        done();
      })
      .catch((err) => {
        done(err);
      });
  });

  before((done) => {
    loginUrl.post('/')
      .send({ username: secondUserEmail, password: userPassword })
      .then((res) => {
        if (res.status === 400) {
          return registerUrl.post('/')
            .send({ username: secondUserEmail, password: userPassword });
        }
        return { status: true };
      })
      .then(() => {
        done();
      })
      .catch((err) => {
        done(err);
      });
  });

  it('should register face to user account if all user credentials and image valid', async () => {
    const { data, code } = await run('face-register', { args, meta, config });
    assert.strictEqual(code, 200);
    assert.propertyVal(data, 'message', 'User face registered for face authentication.');
  });

  it('should prevent two accounts from using same face', async () => {
    const argsWithUsedImage = { ...args, username: secondUserEmail };
    const { data, code } = await run('face-register', { args: argsWithUsedImage, meta, config });
    assert.strictEqual(code, 400);
    assert.propertyVal(data, 'message', 'Image tied to another user account.');
  });

  it('should return status "401" if wrong username or password', async () => {
    const argsInvalidUser = { ...args, password: '11e118aa4esdkdkskdk' };
    const { data, code } = await run('face-register', { args: argsInvalidUser, meta, config });
    assert.strictEqual(code, 401);
    assert.propertyVal(data, 'message', 'Username or password does not match any user account.');
  });

  it('should return message "Image must consist of only one person\'s face" if image parameter ' +
    'consist of more than one face.',
  async () => {
    const argsMultipleFaces = { ...args, image: multipleFaces };
    const { data, code } = await run('face-register', { args: argsMultipleFaces, meta, config });
    assert.strictEqual(code, 400);
    assert.propertyVal(data, 'message', 'Image must consist of only one person\'s face');
  });

  it('should return message "Validation error(s)" if username parameter is empty', async () => {
    const argsValidation = { username: '', password: userPassword };
    const { data, code } = await run('face-register', { args: argsValidation, meta, config });
    assert.strictEqual(code, 400);
    assert.propertyVal(data, 'message', 'Validation error(s)');
  });
});
