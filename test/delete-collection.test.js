import { assert } from 'chai';
import { run, generateMeta } from '@syncano/test';
import 'dotenv/config';
import config from './utils/helpers';

const { COLLECTION_ID: collectionId } = process.env;

describe('delete-collection', () => {
  const meta = generateMeta('delete-collection');
  const args = { collectionId };

  it('should delete collection if valid collectionId parameter is valid', async () => {
    const { data, code } = await run('delete-collection', { args, meta, config });
    assert.strictEqual(code, 200);
    assert.propertyVal(data, 'statusCode', 200);
  });

  it('should return "ResourceNotFoundException" error if collectionId does not exist', async () => {
    const argsWithNonExistingName = { ...args, collectionId: 'nonExistingName' };

    const { data, code } = await run('delete-collection', { args: argsWithNonExistingName, meta, config });
    assert.strictEqual(code, 400);
    assert.property(data, 'message');
    assert.propertyVal(data, 'message', 'The collection id: nonExistingName does not exist');
  });

  it('should return message "Validation error(s)" if collectionId is empty', async () => {
    const argsWithoutCollectionId = { ...args, collectionId: '' };

    const { data, code } = await run('delete-collection', { args: argsWithoutCollectionId, meta, config });
    assert.strictEqual(code, 400);
    assert.propertyVal(data, 'message', 'Validation error(s)');
  });
});
