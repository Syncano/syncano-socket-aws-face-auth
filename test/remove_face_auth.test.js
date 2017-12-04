import request from 'supertest';
import { assert } from 'chai';

import dotenv from 'dotenv';

dotenv.config();

describe('remove_face_auth', () => {
  const REMOVE_URL = `https://api.syncano.io/v2/instances/${process.env.INSTANCE_NAME}/` +
    'endpoints/sockets/aws-face-auth/remove_face_auth/';
  const requestUrl = request(REMOVE_URL);

  const LOGIN_URL = `https://api.syncano.io/v2/instances/${process.env.INSTANCE_NAME}/` +
    'endpoints/sockets/rest-auth/login/';
  const loginrUrl = request(LOGIN_URL);

  const bucketName = process.env.AWS_BUCKET_NAME;
  const userImage = process.env.AWS_S3_USER_IMAGE_KEY;
  const wrongImage = process.env.INAVLID_USER_AWS_S3_IMAGE_KEY;
  const collectionId = 'collectionTest';

  const firstUserEmail = process.env.TEST_USER_EMAIL1;
  const secondUserEmail = process.env.TEST_USER_EMAIL2;
  const userPassword = process.env.TEST_USER_PASSWORD;
  let firstUserToken = '';
  let secondUserToken = '';

  before((done) => {
    loginrUrl.post('/')
      .send({username: firstUserEmail, password: userPassword})
      .then((res) => {
        // if first user login successful set firstUserToken
        if (res.status === 200) {
          firstUserToken = res.body.token;
        }
        return loginrUrl.post('/')
          .send({username: secondUserEmail, password: userPassword});
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
    (done) => {
      const argsUserFaceAuthNotRegistered = {
        username: secondUserEmail,
        token: secondUserToken,
        collectionId,
        image: userImage,
        bucketName,
      };
      requestUrl.post('/')
        .send(argsUserFaceAuthNotRegistered)
        .expect(400)
        .end((err, res) => {
          if (err) return done(err);
          assert.propertyVal(res.body, 'message',
            'Face authentication not enabled for user account.'
          );
          done();
        });
    });

    it('should return "Face image not tied to this account." if image parameter not for user',
      (done) => {
        const argsUserFaceRegisteredWrongImage = {
          username: firstUserEmail,
          token: firstUserToken,
          collectionId,
          image: wrongImage,
          bucketName,
        };
        requestUrl.post('/')
          .send(argsUserFaceRegisteredWrongImage)
          .expect(400)
          .end((err, res) => {
            if (err) return done(err);
            assert.propertyVal(res.body, 'message', 'Face image not tied to this account.');
            done();
          });
      });

    it('should remove user account from face authentication if all parameters for user valid',
      (done) => {
        const argsUserFaceRegistered = {
          username: firstUserEmail,
          token: firstUserToken,
          collectionId,
          image: userImage,
          bucketName,
        };
        requestUrl.post('/')
          .send(argsUserFaceRegistered)
          .expect(200)
          .end((err, res) => {
            if (err) return done(err);
            assert.propertyVal(res.body, 'message',
              'User account removed from face authentication.'
            );
            done();
          });
      });
  });

  describe('with invalid user credentials', () => {
    it('should show "Given credentials does not match any user account." if username not existing',
      (done) => {
        const argsInvalidUsername = {
          username: 'you22lllll@gmail.com',
          token: '11e118aa4eefeff12ab6d1',
          collectionId,
          image: userImage,
          bucketName,
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
          username: firstUserEmail,
          token: '11e118aa4eefeff12ab6d18a6de930787',
          collectionId,
          image: userImage,
          bucketName,
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
  });
});
