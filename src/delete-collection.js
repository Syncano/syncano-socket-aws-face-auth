import Syncano from '@syncano/core';
import validateRequired from './utils/helpers';
import Rekognition from './utils/Rekognition';

export default async (ctx) => {
  const { response } = new Syncano(ctx);
  const { collectionId } = ctx.args;
  try {
    validateRequired({ collectionId });

    const awsRekognitionClass = new Rekognition(ctx.config);
    const { StatusCode: statusCode } = await awsRekognitionClass.deleteCollection(collectionId);
    return response.json({ statusCode });
  } catch (errors) {
    return response.json(errors, 400);
  }
};
