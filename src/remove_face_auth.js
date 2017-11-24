/* eslint arrow-body-style: 0 */
import Syncano from 'syncano-server';

import Rekognition from './utils/Rekognition';

export default (ctx) => {
  const {response, logger, users} = Syncano(ctx);

  const {
    username, token, collectionId, image, bucketName
  } = ctx.args;

  const s3bucket = (bucketName || bucketName.trim() !== '') ? bucketName : null;

  const log = logger('Socket scope');

  const awsRekognitionClass = new Rekognition(ctx.config);

  /**
   * Check if face auth is enabled in user account
   * @param {object} data
   * @returns {*} response
   */
  const verifyUserFaceAuthRegistered = (data) => {
    if (data.user_key !== token) {
      return Promise.reject({
        message: 'User credentials does not match any user account.', code: 400
      });
    }
    if (data.face_auth === false || data.face_auth === null) {
      return Promise.reject({
        message: 'Face authentication not enabled for user account.', code: 400
      });
    }
    return data;
  };

  /**
   * Check for faces tied to user account
   * @returns {Promise.<*>} promise
   */
  const searchUserFaces = () => {
    return awsRekognitionClass.searchFacesByImage(collectionId, image, s3bucket)
      .then((res) => {
        return res;
      })
      .catch(err => Promise.reject({ message: err.message, code: 400 }));
  };


  /**
   * Delete faces
   * @param {object} res
   * @returns {Promise.<*>} return
   */
  const deleteFaces = (res) => {
    const faceIds = res.FaceMatches.map(record => record.Face.FaceId);
    log.info('faceIds to delete!', faceIds);
    return awsRekognitionClass.deleteFaces(collectionId, faceIds)
      .then((delRes) => {
        log.info('Hey>>>>>>>>>>>', delRes);
        return delRes;
      }).catch(err => Promise.reject({ message: err.message, code: 400 }));
  };

  const updateUserSchema = () => {
    log.info('Oya update Schema');
    users.where('username', username)
      .update({face_auth: false, external_image_id: '' })
      .then(() => response.json({ message: 'User account removed from face authentication.' }))
      .catch((err) => {
        log.info('Oppsss Eyaaa');
        const message = (err.data) ? err.data : err.message;
        return Promise.reject({ message, code: 400 });
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
    return response.json({ message: 'Fail to remove user face authentication' }, 400);
  };

  users.where('username', username)
    .first()
    .then(verifyUserFaceAuthRegistered)
    .then(searchUserFaces)
    .then(deleteFaces)
    .then(updateUserSchema)
    .catch(err => handleError(err));
};
