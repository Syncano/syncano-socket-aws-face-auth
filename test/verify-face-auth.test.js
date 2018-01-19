import request from 'supertest';
import { assert } from 'chai';
import 'dotenv/config';

describe('verify-face-auth', () => {
  const {
    INSTANCE_NAME, TEST_USER_EMAIL1: firstUserEmail, TEST_USER_EMAIL2: secondUserEmail,
    TEST_USER_PASSWORD: userPassword } = process.env;

  const VERIFY_URL = `https://api.syncano.io/v2/instances/${INSTANCE_NAME}/` +
    'endpoints/sockets/aws-face-auth/verify-face-auth/';
  const requestUrl = request(VERIFY_URL);

  const LOGIN_URL = `https://api.syncano.io/v2/instances/${INSTANCE_NAME}/` +
    'endpoints/sockets/rest-auth/login/';
  const loginrUrl = request(LOGIN_URL);

  let firstUserToken, secondUserToken = '';

  before((done) => {
    loginrUrl.post('/')
      .send({ username: firstUserEmail, password: userPassword })
      .then((res) => {
        // if first user login successful set firstUserToken
        if (res.status === 200) {
          firstUserToken = res.body.token;
        }
        return loginrUrl.post('/')
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
      (done) => {
        const argsUserFaceAuthNotRegistered = { username: secondUserEmail, token: secondUserToken };
        requestUrl.post('/')
          .send(argsUserFaceAuthNotRegistered)
          .expect(200)
          .end((err, res) => {
            if (err) return done(err);
            assert.propertyVal(res.body, 'is_face_auth', false);
            assert.property(res.body, 'message');
            done();
          });
      });

    it('should return "is_face_auth" true if user registered for face authentication',
      (done) => {
        const argsUserFaceRegistered = {
          username: firstUserEmail, token: firstUserToken
        };
        requestUrl.post('/')
          .send(argsUserFaceRegistered)
          .expect(200)
          .end((err, res) => {
            if (err) return done(err);
            assert.propertyVal(res.body, 'is_face_auth', true);
            assert.property(res.body, 'message');
            done();
          });
      });
  });

  describe('with invalid user credentials', () => {
    it('should show "Given credentials does not match any user account." if username not existing',
      (done) => {
        const argsInvalidUsername = {
          username: 'you22lllll@gmail.com', token: '11e118aa4eefeff12ab6d1'
        };
        requestUrl.post('/')
          .send(argsInvalidUsername)
          .expect(401)
          .end((err, res) => {
            if (err) return done(err);
            assert.propertyVal(res.body,
              'message', 'Given credentials does not match any user account.');
            done();
          });
      });

    it('should show "Given credentials does not match any user account." if token not for user',
      (done) => {
        const argsInvalidUserToken = {
          username: firstUserEmail, token: '11e118aa4ee12ab6d18a6de930787'
        };
        requestUrl.post('/')
          .send(argsInvalidUserToken)
          .expect(401)
          .end((err, res) => {
            if (err) return done(err);
            assert.propertyVal(res.body,
              'message', 'Given credentials does not match any user account.');
            done();
          });
      });


    it('should return message "Validation error(s)" if token parameter is empty', (done) => {
      const argsValidation = { username: firstUserEmail, token: '' };
      requestUrl.post('/')
        .send(argsValidation)
        .expect(400)
        .end((err, res) => {
          if (err) return done(err);
          assert.propertyVal(res.body, 'message', 'Validation error(s)');
          done();
        });
    });
  });
});
