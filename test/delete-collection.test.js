import { expect, assert } from 'chai';
import { run } from 'syncano-test';
import { config, collectionId } from './utils/helpers';

describe('delete-collection', () => {
  const { AWS_ACCESS_KEY_ID: accessKeyId, AWS_SECRET_ACCESS_KEY: secretAccessKey } = config;
  const args = { collectionId, accessKeyId, secretAccessKey };

  it('with valid collection name', (done) => {
    run('delete-collection', { args, config })
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

  it('with collection name that does not exist', (done) => {
    const argsWithNonExistingName = { ...args, collectionId: 'nonExistingName' };

    run('delete-collection', { args: argsWithNonExistingName, config })
      .then((res) => {
        assert.propertyVal(res, 'code', 400);
        assert.propertyVal(res, 'mimetype', 'application/json');
        assert.propertyVal(res.data, 'code', 'ResourceNotFoundException');
        assert.propertyVal(res.data, 'message',
          'The collection id: nonExistingName does not exist');
        done();
      })
      .catch((err) => {
        done(err);
      });
  });

  it('should return message "Validation error(s)" if collectionId is empty',
    (done) => {
      const argsWithoutCollectionId = { ...args, collectionId: '' };
      run('delete-collection', { args: argsWithoutCollectionId, config })
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
      run('delete-collection', { args: argsWithoutCollectionId, config })
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
