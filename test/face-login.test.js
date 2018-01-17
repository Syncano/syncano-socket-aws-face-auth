import request from 'supertest';
import { assert } from 'chai';
import 'dotenv/config';

describe('face-login', () => {
  const {
    INSTANCE_NAME, AWS_BUCKET_NAME, AWS_S3_USER_IMAGE_KEY, USER_IMAGE_PATH,
    INAVLID_USER_AWS_S3_IMAGE_KEY
  } = process.env;

  const LOGIN_URL = `https://api.syncano.io/v2/instances/${INSTANCE_NAME}/` +
    'endpoints/sockets/aws-face-auth/face-login/';
  const requestUrl = request(LOGIN_URL);

  const args = {
    collectionId: 'collectionTest1',
    image: AWS_S3_USER_IMAGE_KEY,
    bucketName: AWS_BUCKET_NAME
  };

  it('should login with s3 bucket image', (done) => {
    requestUrl.post('/')
      .send(args)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        assert.property(res.body, 'token');
        assert.property(res.body, 'username');
        done();
      });
  });

  it('should login with base64-encoded bytes', (done) => {
    const base64Image = USER_IMAGE_PATH;
    const argsWithBase64Image = Object.assign({}, args, { image: base64Image, bucketName: '' });
    requestUrl.post('/')
      .send(argsWithBase64Image)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        assert.property(res.body, 'token');
        assert.property(res.body, 'username');
        done();
      });
  });

  it('should fail if user does not exist user', (done) => {
    const invalidUserImage = INAVLID_USER_AWS_S3_IMAGE_KEY;
    const argsWithInvalidUserImage = Object.assign({}, args, { image: invalidUserImage });
    requestUrl.post('/')
      .send(argsWithInvalidUserImage)
      .expect(401)
      .end((err, res) => {
        if (err) return done(err);
        assert.propertyVal(res.body, 'message', 'User does not exist');
        done();
      });
  });

  it('should fail with non existing bucketName for s3 bucket image', (done) => {
    const argsWrongBucketName = Object.assign({}, args, { bucketName: 'wrongBucketName' });
    requestUrl.post('/')
      .send(argsWrongBucketName)
      .expect(400)
      .end((err, res) => {
        if (err) return done(err);
        assert.property(res.body, 'message');
        assert.propertyVal(res.body, 'code', 'InvalidS3ObjectException');
        done();
      });
  });
});
