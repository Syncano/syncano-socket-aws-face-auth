import { expect, assert } from 'chai';
import { run } from 'syncano-test';
import config from './utils/helpers';

describe('delete-collection', () => {
  const meta = {
    admin: { id: 1, email: 'testEmail@gmail.com' }
  };
  const args = { collectionId: 'testCollection' };

  it('should delete collection if valid collectionId parameter is valid', (done) => {
    run('delete-collection', { args, meta, config })
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

  it('should return "ResourceNotFoundException" error if collectionId does not exist', (done) => {
    const argsWithNonExistingName = { ...args, collectionId: 'nonExistingName' };

    run('delete-collection', { args: argsWithNonExistingName, meta, config })
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
      run('delete-collection', { args: argsWithoutCollectionId, meta, config })
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

  it('should return unauthorized error if admin token not sent with request',
    (done) => {
      run('create-collection', { args, config })
        .then((res) => {
          assert.propertyVal(res, 'code', 403);
          assert.propertyVal(res.data, 'message',
            'You are not authorised for this action');
          done();
        })
        .catch((err) => {
          done(err);
        });
    });
});
