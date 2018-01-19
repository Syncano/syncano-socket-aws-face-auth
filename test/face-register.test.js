import request from 'supertest';
import { assert } from 'chai';
import 'dotenv/config';

describe('face-register', () => {
  const {
    INSTANCE_NAME, AWS_BUCKET_NAME: bucketName, AWS_S3_USER_IMAGE_KEY: userImage,
    TEST_USER_EMAIL1: firstUserEmail, TEST_USER_EMAIL2: secondUserEmail,
    TEST_USER_PASSWORD: userPassword
  } = process.env;

  const VERIFY_URL = `https://api.syncano.io/v2/instances/${INSTANCE_NAME}/` +
    'endpoints/sockets/aws-face-auth/face-register/';
  const requestUrl = request(VERIFY_URL);

  const REGISTER_URL = `https://api.syncano.io/v2/instances/${INSTANCE_NAME}/` +
    'endpoints/sockets/rest-auth/register/';
  const registerUrl = request(REGISTER_URL);

  const LOGIN_URL = `https://api.syncano.io/v2/instances/${INSTANCE_NAME}/` +
    'endpoints/sockets/rest-auth/login/';
  const loginrUrl = request(LOGIN_URL);

  before((done) => {
    loginrUrl.post('/')
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
    loginrUrl.post('/')
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

  it('should register face to user account if all user credentials and image valid',
    (done) => {
      const argsWithValidDetails = {
        username: firstUserEmail,
        password: userPassword,
        image: userImage,
        bucketName,
      };
      requestUrl.post('/')
        .send(argsWithValidDetails)
        .expect(200)
        .end((err, res) => {
          if (err) {
            console.log(err);
            return done(err);
          }
          assert.propertyVal(res.body,
            'message', 'User face registered for face authentication.');
          done();
        });
    });

  it('should prevent two accounts from using same face',
    (done) => {
      const argsWithUsedImage = {
        username: secondUserEmail,
        password: userPassword,
        image: userImage,
        bucketName,
      };
      requestUrl.post('/')
        .send(argsWithUsedImage)
        .expect(400)
        .end((err, res) => {
          if (err) return done(err);
          assert.propertyVal(res.body,
            'message', 'Image tied to another user account.');
          done();
        });
    });

  it('should return status "401" if wrong username or password',
    (done) => {
      const argsInvalidUser = {
        username: firstUserEmail,
        password: '11e118aa4esdkdkskdk',
        image: userImage,
        bucketName,
      };
      requestUrl.post('/')
        .send(argsInvalidUser)
        .expect(401)
        .end((err, res) => {
          if (err) return done(err);
          assert.propertyVal(res.body,
            'message', 'Username or password does not match any user account.');
          done();
        });
    });

  it('should return message "Image must consist of only one person\'s face" if image parameter ' +
    'consist of more than one face.',
  (done) => {
    const argsMultipleFaces = {
      username: firstUserEmail,
      password: userPassword,
      image: 'https://i2-prod.mirror.co.uk/incoming/article7030947.ece/ALTERNATES/s615/Chelsea-main.jpg',
      bucketName: '',
    };
    requestUrl.post('/')
      .send(argsMultipleFaces)
      .expect(400)
      .end((err, res) => {
        if (err) return done(err);
        assert.propertyVal(res.body,
          'message', 'Image must consist of only one person\'s face');
        done();
      });
  });

  it('should return message "Validation error(s)" if username parameter is empty', (done) => {
    const argsValidation = { username: '', password: userPassword };
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
