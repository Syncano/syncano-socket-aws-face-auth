/* eslint arrow-body-style: 0 */
import Syncano from 'syncano-server';
import fetch from 'axios';
import uuidv1 from 'uuid/v1';

import Rekognition from './utils/Rekognition';

export default (ctx) => {
  const {response, logger, users} = Syncano(ctx);

  const {
    username, password, collectionId, image, bucketName
  } = ctx.args;

  const s3bucket = (bucketName || bucketName.trim() !== '') ? bucketName : null;

  const AUTH_URL = `https://api.syncano.io/v2/instances/${META.instance}/users/auth/`;

  const log = logger('Socket scope');

  const awsRekognitionClass = new Rekognition(ctx.config);

  /**
   * Check if face tied to another user account
   * @param {object} data
   * @returns {Promise.<*>} promise
   */
  const searchUserFace = (data) => {
    log.info(data, 'data>>>>');
    return awsRekognitionClass.searchFacesByImage(collectionId, image, s3bucket)
      .then((res) => {
        if (res.FaceMatches.length === 0) {
          log.info('No one with face');
          return data;
        }
        // Check if face match not for current user
        if (res.FaceMatches[0].Face.ExternalImageId !== data.external_image_id) {
          log.info('Ahh someone with face');
          return Promise.reject({ message: 'Image tied to another user account.', code: 400 });
        }
        log.info('No one with face>>>>>');
        return {data};
      })
      .catch(err => Promise.reject({ message: err.message, code: 400 }));
  };

  /**
   * Index face
   * @param {object} data
   * @returns {Promise.<*>} promise
   */
  const indexUserFace = (data) => {
    const externalImageId = (data.external_image_id === null || data.external_image_id === '')
      ? uuidv1() : data.external_image_id;
    return awsRekognitionClass.indexFaces(collectionId, image, externalImageId, s3bucket)
      .then(res => res)
      .catch(err => Promise.reject({ message: err.message, errors: err, code: 400 }));
  };

  /**
   * Delete faces
   * @param {object} res
   * @param {string} message
   * @returns {Promise.<*>} return
   */
  const deleteFaces = (res, message) => {
    const faceIds = res.FaceRecords.map(record => record.Face.FaceId);
    log.info('faceIds to delete!', faceIds);
    return awsRekognitionClass.deleteFaces(collectionId, faceIds)
      .then((delRes) => {
        log.info('Hey>>>>>>>>>>>', delRes);
        const error = {message, code: 400};
        return Promise.reject(error);
      }).catch(err => Promise.reject({ message: err.message, code: 400 }));
  };

  /**
   * handleSuccessfulIndexImage
   * @param {object} res
   * @returns {*} promise
   */
  const handleSuccessfulIndexImage = (res) => {
    log.info('Length', res.FaceRecords.length);
    if (res.FaceRecords.length === 1) {
      return res;
    } else if (res.FaceRecords.length > 1) {
      const message = 'Image must consist of only one person\'s face';
      return deleteFaces(res, message);
    }
    return Promise.reject({ message: 'Fail to register face.', code: 400 });
  };

  const updateUserSchema = (res) => {
    log.info('Oya update Schema');
    users.where('username', username)
      .update({face_auth: true, external_image_id: res.FaceRecords[0].Face.ExternalImageId })
      .then(() => response.json({ message: 'User account registered for face authentication.' }))
      .catch((err) => {
        log.info('Oppsss Eyaaa');
        const message = (err.data) ? err.data : err.message;
        return deleteFaces(res, message);
      });
  };

  /**
   * handle all errors
   * @param {object} err
   * @returns {*} error response
   */
  const handleError = (err) => {
    if (err.code) {
      const errorMessage = { message: err.message };
      if (err.errors) {
        errorMessage.errors = err.errors;
      }
      return response.json(errorMessage, 400);
    }
    return response.json({ message: 'Username or password does not match any user account.' }, 400);
  };

  fetch({
    url: AUTH_URL,
    method: 'POST',
    data: JSON.stringify({username, password}),
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': META.token
    }
  })
    .then(searchUserFace)
    .then(indexUserFace)
    .then(handleSuccessfulIndexImage)
    .then(updateUserSchema)
    .catch(err => handleError(err));
};
