import Syncano from 'syncano-server';

import { validateRequired } from './utils/helpers';
import Rekognition from './utils/Rekognition';

export default (ctx) => {
  const { response, users } = Syncano(ctx);

  const { image, bucketName } = ctx.args;
  const { COLLECTION_ID: collectionId, FACE_MATCH_THRESHOLD: faceMatchThreshold } = ctx.config;
  const s3Bucket = (!bucketName || bucketName.trim() === '') ? null : bucketName;

  try {
    validateRequired({ image });
  } catch (err) {
    const { customMessage, details } = err;
    return response.json({ message: customMessage, details }, 400);
  }

  const awsRekognitionClass = new Rekognition(ctx.config);

  const handleSearchFacesByImageResult = (res) => {
    if (res.FaceMatches.length === 0) {
      return Promise.reject({ message: 'User does not exist', statusCode: 401 });
    }
    return res;
  };

  /**
   * Get user based on face match externalID
   * @param {object} res
   * @returns {Promise.<*>} promise
   */
  const getUser = (res) => {
    return users.where('external_image_id', res.FaceMatches[0].Face.ExternalImageId)
      .firstOrFail()
      .then(({ user_key, username }) => {
        return response.json({ token: user_key, username });
      })
      .catch(() => {
        const message = 'Authentication fail.';
        return Promise.reject({ message, statusCode: 401 });
      });
  };

  return awsRekognitionClass.searchFacesByImage(collectionId, image, s3Bucket, faceMatchThreshold)
    .then(handleSearchFacesByImageResult)
    .then(getUser)
    .catch((err) => {
      if (err.statusCode) {
        return response.json(err, err.statusCode);
      }
      return response.json({ message: 'Authentication fail.' }, 401);
    });
};
