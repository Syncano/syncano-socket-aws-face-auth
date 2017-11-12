import { expect, assert } from 'chai';
import {run, generateMeta} from 'syncano-test';

import dotenv from 'dotenv';

dotenv.config({ silent: process.env.NODE_ENV === 'production' });

describe('delete_collection', () => {
  const meta = generateMeta();

  const config = {
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    AWS_REGION: process.env.AWS_REGION,
  };

  const args = {
    collectionId: 'collectionTest'
  };

  before((done) => {
    run('create_collection', {args, meta, config})
      .then(() => {
        done();
      });
  });

  it('with valid collection name', (done) => {
    run('delete_collection', {args, meta, config})
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
    const argsWithNonExistingName = {collectionId: 'nonExistingName'};

    run('delete_collection', {args: argsWithNonExistingName, meta, config})
      .then((res) => {
        assert.propertyVal(res, 'code', 400);
        assert.propertyVal(res, 'mimetype', 'application/json');
        assert.propertyVal(res.data, 'code', 'ResourceNotFoundException');
        assert.propertyVal(
          res.data,
          'message',
          'The collection id: nonExistingName does not exist'
        );
        done();
      })
      .catch((err) => {
        done(err);
      });
  });

  it('without collection name', (done) => {
    const argsWithoutData = {};

    run('delete_collection', {args: argsWithoutData, meta, config})
      .then((res) => {
        assert.propertyVal(res, 'code', 400);
        assert.propertyVal(res, 'mimetype', 'application/json');
        assert.propertyVal(res.data, 'code', 'MissingRequiredParameter');
        assert.propertyVal(res.data, 'message', 'Missing required key \'CollectionId\' in params');
        done();
      })
      .catch((err) => {
        done(err);
      });
  });
});
