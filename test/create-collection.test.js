import { expect, assert } from 'chai';
import { run } from 'syncano-test';
import config from './utils/helpers';

describe('create-collection', () => {
  const { AWS_ACCESS_KEY_ID: accessKeyId, AWS_SECRET_ACCESS_KEY: secretAccessKey } = config;
  const args = { collectionId: 'testCollection', accessKeyId, secretAccessKey };

  it('should create collection if valid collectionId parameter supplied', (done) => {
    run('create-collection', { args, config })
      .then((res) => {
        assert.propertyVal(res, 'code', 200);
        assert.propertyVal(res, 'mimetype', 'application/json');
        assert.propertyVal(res.data, 'statusCode', 200);
        done();
      })
      .catch((err) => {
        done(err);
      });
  });

  it('should fail if collectionId is already existing', (done) => {
    run('create-collection', { args, config })
      .then((res) => {
        assert.propertyVal(res, 'code', 400);
        assert.property(res.data, 'message');
        assert.propertyVal(res.data, 'code', 'ResourceAlreadyExistsException');
        done();
      })
      .catch((err) => {
        done(err);
      });
  });

  it('should return message "Validation error(s)" if collectionId is empty',
    (done) => {
      const argsWithoutCollectionId = { ...args, collectionId: '' };
      run('create-collection', { args: argsWithoutCollectionId, config })
        .then((res) => {
          assert.propertyVal(res, 'code', 400);
          assert.propertyVal(res, 'mimetype', 'application/json');
          assert.propertyVal(res.data, 'message', 'Validation error(s)');
          done();
        })
        .catch((err) => {
          done(err);
        });
    });

  it('should deny access to create collection if invalid `accessKeyId` or `secretAccessKey`',
    (done) => {
      const argsWithoutCollectionId = { ...args, accessKeyId: 'ghh' };
      run('create-collection', { args: argsWithoutCollectionId, config })
        .then((res) => {
          assert.propertyVal(res, 'code', 400);
          assert.propertyVal(res.data, 'message',
            'Provide valid `accessKeyId` and `secretAccessKey` to access endpoint');
          done();
        })
        .catch((err) => {
          done(err);
        });
    });
});
