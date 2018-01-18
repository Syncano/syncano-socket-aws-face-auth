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
    if (err.customMessage) {
      return response.json({ message: err.customMessage, details: err.details }, 400);
    }
    if (err.code) {
      return response.json({ statusCode: err.statusCode, code: err.code, message: err.message },
        400);
    }
    return response.json({ message: err.message }, 400);
  }
};
