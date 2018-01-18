import Syncano from 'syncano-server';

import { checkAccess, validateRequired } from './utils/helpers';
import Rekognition from './utils/Rekognition';

export default async (ctx) => {
  const { response } = Syncano(ctx);
  const { collectionId, accessKeyId, secretAccessKey } = ctx.args;
  const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } = ctx.config;
  try {
    validateRequired({ collectionId, accessKeyId, secretAccessKey });
    checkAccess(accessKeyId, secretAccessKey, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY);

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
