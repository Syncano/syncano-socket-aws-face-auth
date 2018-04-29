import Syncano from '@syncano/core';
import axios from 'axios';
import uuidv1 from 'uuid/v1';
import validateRequired from './utils/helpers';
import Rekognition from './utils/Rekognition';

export default async (ctx) => {
  const { users, response } = new Syncano(ctx);

  const { username, password, image, bucketName } = ctx.args;
  const { COLLECTION_ID: collectionId, FACE_MATCH_THRESHOLD: faceMatchThreshold } = ctx.config;

  const s3bucket = (!bucketName || bucketName.trim() === '') ? null : bucketName;

  const AUTH_URL = `https://api.syncano.io/v2/instances/${ctx.meta.instance}/users/auth/`;

  const awsRekognitionClass = new Rekognition(ctx.config);

  /**
   * Delete faces
   * @param {object} res
   * @param {string} message
   * @returns {Promise.<*>}
   */
  const deleteFaces = async (res, message) => {
    try {
      const faceIds = res.FaceRecords.map(record => record.Face.FaceId);
      await awsRekognitionClass.deleteFaces(collectionId, faceIds);
      return Promise.reject({ message, statusCode: 400 });
    } catch (err) {
      return Promise.reject({ message: err.message, statusCode: 400 });
    }
  };

  const updateUserSchema = async (res) => {
    try {
      await users.where('username', username)
        .update({ face_auth: true, external_image_id: res.FaceRecords[0].Face.ExternalImageId });
    } catch (err) {
      const message = (err.data) ? err.data : err.message;
      return deleteFaces(res, message);
    }
  };

  try {
    validateRequired({ username, password, image });

    const { data } = await axios.post(AUTH_URL, { username, password },
      {
        headers: { 'Content-Type': 'application/json', 'X-API-KEY': ctx.meta.token }
      });

    const searchUserFaceResult = await awsRekognitionClass
      .searchFacesByImage(collectionId, image, s3bucket, faceMatchThreshold);

    // Check if face match not for current user
    if (searchUserFaceResult.FaceMatches.length > 0
      && searchUserFaceResult.FaceMatches[0].Face.ExternalImageId !== data.external_image_id) {
      return response.json({ message: 'Image tied to another user account.' }, 400);
    }

    const externalImageId = (data.external_image_id === null || data.external_image_id === '')
      ? uuidv1() : data.external_image_id;

    const indexUserFaceResult = await awsRekognitionClass.indexFaces(collectionId, image, externalImageId, s3bucket);

    // handle successful image indexed
    if (indexUserFaceResult.FaceRecords.length === 1) {
      await updateUserSchema(indexUserFaceResult);
      return response.json({ message: 'User face registered for face authentication.' });
    } else if (indexUserFaceResult.FaceRecords.length > 1) {
      const message = 'Image must consist of only one person\'s face';
      await deleteFaces(indexUserFaceResult, message);
    }
    return response.json({ message: 'Fail to register face.' }, 400);
  } catch (err) {
    if (err.statusCode || err.code) {
      return response.json(err, err.statusCode || 400);
    }
    return response.json({ message: 'Username or password does not match any user account.' }, 401);
  }
};
