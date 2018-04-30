import { assert } from 'chai';
import { describe, it } from 'mocha';
import { run, generateMeta } from '@syncano/test';
import 'dotenv/config';
import config from './utils/helpers';

const { COLLECTION_ID: collectionId } = process.env;

describe('create-collection', () => {
  const meta = generateMeta('create-collection');
  const args = { collectionId };

  it('should create collection if valid collectionId parameter supplied', async () => {
    const { data, code } = await run('create-collection', { args, meta, config });
    assert.strictEqual(code, 200);
    assert.propertyVal(data, 'statusCode', 200);
  });

  it('should fail if collectionId is already existing', async () => {
    const { data, code } = await run('create-collection', { args, meta, config });
    assert.strictEqual(code, 400);
    assert.property(data, 'message');
    assert.propertyVal(data, 'code', 'ResourceAlreadyExistsException');
  });

  it('should return message "Validation error(s)" if collectionId is empty', async () => {
    const argsWithoutCollectionId = { ...args, collectionId: '' };
    const { data, code } = await run('create-collection', { args: argsWithoutCollectionId, meta, config });
    assert.strictEqual(code, 400);
    assert.property(data, 'message');
    assert.propertyVal(data, 'message', 'Validation error(s)');
  });
});
