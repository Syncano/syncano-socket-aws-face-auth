import { expect, assert } from 'chai';
import { run } from 'syncano-test';

import dotenv from 'dotenv';

dotenv.config();

describe('create_collection', () => {
  const config = {
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    AWS_REGION: process.env.AWS_REGION,
  };

  const args = {collectionId: 'collectionTest'};

  it('with valid collection name', (done) => {
    run('create_collection', {args, config})
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

  it('without collection name', (done) => {
    const argsWithoutData = {};

    run('create_collection', {args: argsWithoutData, config})
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
