import request from 'supertest';
import { assert } from 'chai';
import { run, generateMeta } from '@syncano/test';
import 'dotenv/config';
import config from './utils/helpers';

const meta = generateMeta('face-login');

describe('face-login', () => {
  const {
    AWS_BUCKET_NAME, AWS_S3_USER_IMAGE_KEY, USER_IMAGE_PATH, INAVLID_USER_AWS_S3_IMAGE_KEY
  } = process.env;

  const args = { image: AWS_S3_USER_IMAGE_KEY, bucketName: AWS_BUCKET_NAME };

  it('should login with s3 bucket image', async () => {
    const { data, code } = await run('face-login', { args, meta, config });
    assert.strictEqual(code, 200);
    assert.property(data, 'token');
    assert.property(data, 'username');
  });

  it('should login with base64-encoded bytes', async () => {
    const argsWithBase64Image = { ...args, image: USER_IMAGE_PATH, bucketName: '' };
    const { data, code } = await run('face-login', { args: argsWithBase64Image, meta, config });
    assert.strictEqual(code, 200);
    assert.property(data, 'token');
    assert.property(data, 'username');
  });

  it('should fail if user does not exist user', async () => {
    const argsInvalidUserImage = { ...args, image: INAVLID_USER_AWS_S3_IMAGE_KEY };
    const { data, code } = await run('face-login', { args: argsInvalidUserImage, meta, config });
    assert.strictEqual(code, 401);
    assert.propertyVal(data, 'message', 'User does not exist');
  });

  it('should fail with non existing bucketName for s3 bucket image', async () => {
    const argsWrongBucketName = { ...args, bucketName: 'wrongBucketName' };
    const { data, code } = await run('face-login', { args: argsWrongBucketName, meta, config });
    assert.strictEqual(code, 400);
    assert.property(data, 'message');
    assert.propertyVal(data, 'code', 'InvalidS3ObjectException');
  });

  it('should return message "Validation error(s)" if image parameter is empty', async () => {
    const argsValidation = { ...args, image: '' };
    const { data, code } = await run('face-login', { args: argsValidation, meta, config });
    assert.strictEqual(code, 400);
    assert.propertyVal(data, 'message', 'Validation error(s)');
  });
});
