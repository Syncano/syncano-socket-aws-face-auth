import Syncano from '@syncano/core';
import validateRequired from './utils/helpers';
import Rekognition from './utils/Rekognition';

export default async (ctx) => {
  const { response } = new Syncano(ctx);
  const { collectionId } = ctx.args;
  try {
    validateRequired({ collectionId });

    const awsRekognitionClass = new Rekognition(ctx.config);
    const result = await awsRekognitionClass.createCollection(collectionId);
    return response.json({ collectionArn: result.CollectionArn, statusCode: result.StatusCode });
  } catch ({ ...errors }) {
    return response.json(errors, 400);
  }
};
