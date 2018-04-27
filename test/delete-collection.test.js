import { assert } from 'chai';
import { run, generateMeta } from '@syncano/test';
import 'dotenv/config';
import config from './utils/helpers';

const { COLLECTION_ID: collectionId } = process.env;

describe('delete-collection', () => {
  const meta = generateMeta('delete-collection');
  const args = { collectionId };

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

  // it('should return permission error if admin token not sent with request', (done) => {
  //   const nonAdminMeta = { ...meta, token: '' };
  //   run('delete-collection', { args, config, meta: nonAdminMeta })
  //     .then((res) => {
  //       console.log(res, 'b');
  //       assert.propertyVal(res, 'code', 400);
  //       assert.propertyVal(res.data, 'detail',
  //         'You do not have permission to perform this action.');
  //       done();
  //     })
  //     .catch((err) => {
  //       done(err);
  //     });
  // });
});
