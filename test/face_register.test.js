import path from 'path';
import { assert } from 'chai';
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

  const base64Image = path.join(__dirname, './photos/conte.jpeg');
  const argsWithBase64Image = Object.assign({}, args, { image: base64Image, bucketName: ''});

  describe('with valid parameters', () => {
    it('should register with s3 bucket image', (done) => {
      run('face_register', {args, meta, config})
        .then((res) => {
          assert.propertyVal(res, 'code', 200);
          assert.propertyVal(res, 'mimetype', 'application/json');
          assert.property(res.data, 'userId');
          done();
        });
    });

    it('should register with base64-encoded bytes', (done) => {
      run('face_register', {args: argsWithBase64Image, meta, config})
        .then((res) => {
          assert.propertyVal(res, 'code', 200);
          assert.propertyVal(res, 'mimetype', 'application/json');
          assert.property(res.data, 'userId');
          done();
        });
    });

    it('should fail with already existing user', (done) => {
      run('face_register', {args: argsWithBase64Image, meta, config})
        .then((res) => {
          assert.propertyVal(res, 'code', 201);
          assert.propertyVal(res, 'mimetype', 'application/json');
          assert.propertyVal(res.data, 'message', 'User already exist');
          done();
        });
    });
  });

  describe('with wrong parameters', () => {
    it('should fail with non existing bucketName for s3 bucket image', (done) => {
      const argsWrongBucketName = Object.assign({}, args, { bucketName: 'wrongBucketName'});
      run('face_register', {args: argsWrongBucketName, meta, config})
        .then((res) => {
          assert.propertyVal(res, 'code', 400);
          assert.propertyVal(res, 'mimetype', 'application/json');
          assert.propertyVal(res.data, 'code', 'InvalidS3ObjectException');
          assert.property(res.data, 'message');
          done();
        });
    });
  });
});
