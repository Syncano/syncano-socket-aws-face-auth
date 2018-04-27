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
   * Check if face tied to another user account
   * @param {object} data
   * @returns {Promise.<*>} promise
   */
  const searchUserFace = async ({ data }) => {
    try {
      const result = await awsRekognitionClass
        .searchFacesByImage(collectionId, image, s3bucket, faceMatchThreshold);

      if (result.FaceMatches.length === 0) {
        return data;
      }
      // Check if face match not for current user
      if (result.FaceMatches[0].Face.ExternalImageId !== data.external_image_id) {
        return Promise.reject({
          message: 'Image tied to another user account.', statusCode: 400
        });
      }
      return data;
    } catch (err) {
      return Promise.reject({ message: err.message, statusCode: 400 });
    }
  };

  /**
   * Index face
   * @param {object} data
   * @returns {Promise.<*>}
   */
  const indexUserFace = async (data) => {
    try {
      const externalImageId = (data.external_image_id === null || data.external_image_id === '')
        ? uuidv1() : data.external_image_id;

      return await awsRekognitionClass
        .indexFaces(collectionId, image, externalImageId, s3bucket);
    } catch (err) {
      return Promise.reject({ message: err.message, statusCode: 400 });
    }
  };

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

  /**
   * handleSuccessfulIndexImage
   * @param {object} res
   * @returns {*} promise
   */
  const handleIndexImage = async (res) => {
    if (res.FaceRecords.length === 1) {
      return res;
    } else if (res.FaceRecords.length > 1) {
      const message = 'Image must consist of only one person\'s face';
      return deleteFaces(res, message);
    }
    return Promise.reject({ message: 'Fail to register face.', statusCode: 400 });
  };

  const updateUserSchema = async (res) => {
    try {
      await users.where('username', username)
        .update({ face_auth: true, external_image_id: res.FaceRecords[0].Face.ExternalImageId });
      return response.json({ message: 'User face registered for face authentication.' });
    } catch (err) {
      const message = (err.data) ? err.data : err.message;
      return deleteFaces(res, message);
    }
  };

  try {
    validateRequired({ username, password, image });

    const userDetails = await axios.post(AUTH_URL, { username, password },
      {
        headers: { 'Content-Type': 'application/json', 'X-API-KEY': ctx.meta.token }
      });
    const searchUserFaceResponse = await searchUserFace(userDetails);
    const indexUserFaceResponse = await indexUserFace(searchUserFaceResponse);
    const handleIndexImageResponse = await handleIndexImage(indexUserFaceResponse);
    await updateUserSchema(handleIndexImageResponse);
    return response.json({ message: 'User face registered for face authentication.' });
  } catch (err) {
    if (err.statusCode) {
      return response.json(err, err.statusCode);
    }
    return response.json(
      { message: 'Username or password does not match any user account.' }, 401
    );
  }
};
