import { assert } from 'chai';
import { describe, it } from 'mocha';
import { run, generateMeta } from '@syncano/test';
import 'dotenv/config';
import config from './utils/helpers';

const { COLLECTION_ID: collectionId } = process.env;

describe('create-collection', () => {
  const meta = generateMeta('create-collection');
  const args = { collectionId };

  it('should create collection if valid collectionId parameter supplied', (done) => {
    run('create-collection', { args, meta, config })
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
    run('create-collection', { args, meta, config })
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
      run('create-collection', { args: argsWithoutCollectionId, meta, config })
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

  // it('should return permission error if admin token not sent with request',
  //   (done) => {
  //     const nonAdminMeta = { ...meta, token: null };
  //     console.log(nonAdminMeta, 'iiiiii');
  //     console.log(meta, '>>>>>>>');
  //     run('create-collection', { args, config })
  //       .then((res) => {
  //         console.log(res, 'a');
  //         assert.propertyVal(res, 'code', 400);
  //         assert.propertyVal(res.data, 'detail',
  //           'You do not have permission to perform this action.');
  //         done();
  //       })
  //       .catch((err) => {
  //         done(err);
  //       });
  //   });
});
