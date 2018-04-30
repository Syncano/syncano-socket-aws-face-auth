import Syncano from '@syncano/core';
import validateRequired from './utils/helpers';
import Rekognition from './utils/Rekognition';

export default async (ctx) => {
  const { response, users } = new Syncano(ctx);

  const { username, token, image, bucketName } = ctx.args;
  const { COLLECTION_ID: collectionId, FACE_MATCH_THRESHOLD: faceMatchThreshold } = ctx.config;

  const s3bucket = (!bucketName || bucketName.trim() === '') ? null : bucketName;
  const awsRekognitionClass = new Rekognition(ctx.config);

  const updateUserSchema = async () => {
    try {
      await users.where('username', username).update({ face_auth: false, external_image_id: '' });
    } catch (err) {
      const message = (err.data) ? err.data : err.message;
      return Promise.reject({ message, statusCode: 400 });
    }
  };

  try {
    validateRequired({ username, token, image });

    const { user_key, face_auth, external_image_id } = await users.where('username', username).firstOrFail();
    if (user_key !== token) {
      return response.json({ message: 'Given credentials does not match any user account.' }, 401);
    }
    if (!face_auth) {
      return response.json({ message: 'Face authentication not enabled for user account.' }, 400);
    }

    const { FaceMatches } = await awsRekognitionClass
      .searchFacesByImage(collectionId, image, s3bucket, faceMatchThreshold);

    if (FaceMatches.length > 0 && FaceMatches[0].Face.ExternalImageId === external_image_id) {
      // delete the user faces index
      const faceIds = FaceMatches.map(record => record.Face.FaceId);
      await awsRekognitionClass.deleteFaces(collectionId, faceIds);
      await updateUserSchema();
      return response.json({ message: 'User account removed from face authentication.' });
    }
    return response.json({ message: 'Face image not tied to this account.' }, 400);
  } catch (err) {
    if (err.statusCode || err.code) {
      return response.json(err, err.statusCode || 400);
    }
    return response.json({ message: 'Given credentials does not match any user account.' }, 401);
  }
};
