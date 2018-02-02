import Syncano from 'syncano-server';

import validateRequired from './utils/helpers';
import Rekognition from './utils/Rekognition';

export default async (ctx) => {
  const { response } = Syncano(ctx);
  const { collectionId } = ctx.args;
  try {
    if (!ctx.meta.admin) {
      return response.json({ message: 'You are not authorised for this action' }, 403);
    }
    validateRequired({ collectionId });

    const awsRekognitionClass = new Rekognition(ctx.config);
    const result = await awsRekognitionClass.createCollection(collectionId);
    return response.json({ collectionArn: result.CollectionArn, statusCode: result.StatusCode });
  } catch (err) {
    const { customMessage, details, statusCode, code, message } = err;
    if (customMessage) {
      return response.json({ message: customMessage, details }, 400);
    }
    if (code) {
      return response.json({ statusCode, code, message },
        400);
    }
    return response.json({ message }, 400);
  }
};
