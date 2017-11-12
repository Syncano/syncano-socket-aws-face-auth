import path from 'path';
import { expect, assert } from 'chai';
import {run, generateMeta} from 'syncano-test';

import dotenv from 'dotenv';

dotenv.config({ silent: process.env.NODE_ENV === 'production' });

describe('face_register', () => {
  const meta = generateMeta();

  const config = {
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    AWS_REGION: process.env.AWS_REGION,
  };

  const args = {
    collectionId: 'collectionTest',
    image: process.env.AWS_S3_IMAGE_KEY,
    bucketName: process.env.AWS_BUCKET_NAME
  };

  const base64ImageOne = path.join(__dirname, './photos/conte.jpeg');
  const base64ImageTwo = path.join(__dirname, './photos/hazard.jpeg');
  const argsWithBase64ImageOne = Object.assign({}, args, { image: base64ImageOne, bucketName: ''});
  const argsWithBase64ImageTwo = Object.assign({}, args, { image: base64ImageTwo, bucketName: ''});

  before((done) => {
    run('create_collection', {args: {collectionId: 'collectionTest'}, meta, config})
      .then(() => run('face_register', {args: argsWithBase64ImageOne, meta, config}))
      .then(() => {
        done();
      })
      .catch((err) => {
        done(err);
      });
  });

  describe('with valid parameters', () => {
    it('should register with s3 bucket image', (done) => {
      run('face_register', {args, meta, config})
        .then((res) => {
          console.log(res, 'bucket>>>>>>>>>');
          assert.propertyVal(res, 'code', 200);
          assert.propertyVal(res, 'mimetype', 'application/json');
          assert.property(res.data, 'userId');
          done();
        });
    });

    it('should register with base64-encoded bytes', (done) => {
      run('face_register', {args: argsWithBase64ImageTwo, meta, config})
        .then((res) => {
          assert.propertyVal(res, 'code', 200);
          assert.propertyVal(res, 'mimetype', 'application/json');
          assert.property(res.data, 'userId');
          done();
        })
        .catch((err) => {
          done(err);
        });
    });
  });

  it('with already existing user', (done) => {
    run('face_register', {args: argsWithBase64ImageOne, meta, config})
      .then((res) => {
        assert.propertyVal(res, 'code', 201);
        assert.propertyVal(res, 'mimetype', 'application/json');
        assert.propertyVal(res.data, 'message', 'User already exist');
        done();
      })
      .catch((err) => {
        done(err);
      });
  });

  it('with non existing bucketName for s3 bucket image', (done) => {
    const argsWrongBucketName = Object.assign({}, args, { bucketName: 'wrongBucketName'});
    run('face_register', {args: argsWrongBucketName, meta, config})
      .then((res) => {
        assert.propertyVal(res, 'code', 400);
        assert.propertyVal(res, 'mimetype', 'application/json');
        assert.propertyVal(res.data, 'code', 'InvalidS3ObjectException');
        assert.property(res.data, 'message');
        done();
      })
      .catch((err) => {
        done(err);
      });
  });
});
