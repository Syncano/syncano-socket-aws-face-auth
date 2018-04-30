import Syncano from '@syncano/core';
import validateRequired from './utils/helpers';
import Rekognition from './utils/Rekognition';

export default async (ctx) => {
  const { response, users } = new Syncano(ctx);

  const { image, bucketName } = ctx.args;
  const { COLLECTION_ID: collectionId, FACE_MATCH_THRESHOLD: faceMatchThreshold } = ctx.config;
  const s3Bucket = (!bucketName || bucketName.trim() === '') ? null : bucketName;

  const awsRekognitionClass = new Rekognition(ctx.config);

  try {
    validateRequired({ image });

    const { FaceMatches } = await awsRekognitionClass
      .searchFacesByImage(collectionId, image, s3Bucket, faceMatchThreshold);

    if (FaceMatches.length === 0) {
      return response.json({ message: 'User does not exist' }, 401);
    }

    const { user_key, username } =
      await users.where('external_image_id', FaceMatches[0].Face.ExternalImageId).firstOrFail();
    return response.json({ token: user_key, username });
  } catch (err) {
    if (err.statusCode || err.code) {
      return response.json(err, err.statusCode || 400);
    }
    return response.json({ message: 'Authentication failed.' }, 401);
  }
};
