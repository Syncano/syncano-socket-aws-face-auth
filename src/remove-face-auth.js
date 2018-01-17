import Syncano from 'syncano-server';

import Rekognition from './utils/Rekognition';

export default (ctx) => {
  const { response, users } = Syncano(ctx);

  const {
    username, token, collectionId, image, bucketName
  } = ctx.args;

  const s3bucket = (!ctx.args.bucketName || ctx.args.bucketName.trim() === '')
    ? null : ctx.args.bucketName;

  const awsRekognitionClass = new Rekognition(ctx.config);

  /**
   * Check if face auth is enabled in user account
   * @param {object} data
   * @returns {*} response
   */
  const verifyUserFaceAuthRegistered = (data) => {
    if (data.user_key !== token) {
      return Promise.reject({
        message: 'Given credentials does not match any user account.', statusCode: 401
      });
    }
    if (!data.face_auth) {
      return Promise.reject({
        message: 'Face authentication not enabled for user account.', statusCode: 400
      });
    }
    return data;
  };

  /**
   * Check for faces tied to user account
   * @param {object} data
   * @returns {Promise.<*>} promise
   */
  const searchUserFaces = (data) => {
    return awsRekognitionClass.searchFacesByImage(collectionId, image, s3bucket,
      ctx.config.FACE_MATCH_THRESHOLD)
      .then((res) => {
        if (res.FaceMatches.length > 0) {
          if (res.FaceMatches[0].Face.ExternalImageId !== data.external_image_id) {
            return Promise.reject({
              message: 'Face image not tied to this account.', statusCode: 400
            });
          }
          return res;
        }
        return Promise.reject({ message: 'Face image not tied to this account.', statusCode: 400 });
      })
      .catch(err => Promise.reject({ message: err.message, statusCode: 400 }));
  };

  /**
   * Delete faces
   * @param {object} res
   * @returns {*}
   */
  const deleteFaces = (res) => {
    if (res.FaceMatches.length > 0) {
      const faceIds = res.FaceMatches.map(record => record.Face.FaceId);
      return awsRekognitionClass.deleteFaces(collectionId, faceIds)
        .then((delRes) => {
          return delRes;
        }).catch(err => Promise.reject({ message: err.message, statusCode: 400 }));
    }
    return res;
  };

  const updateUserSchema = () => {
    users.where('username', username)
      .update({ face_auth: false, external_image_id: '' })
      .then(() => response.json({ message: 'User account removed from face authentication.' }))
      .catch((err) => {
        const message = (err.data) ? err.data : err.message;
        return Promise.reject({ message, statusCode: 400 });
      });
  };

  return users.where('username', username)
    .firstOrFail()
    .then(verifyUserFaceAuthRegistered)
    .then(searchUserFaces)
    .then(deleteFaces)
    .then(updateUserSchema)
    .catch((err) => {
      if (err.statusCode) {
        return response.json(err, err.statusCode);
      }
      return response.json({ message: 'Given credentials does not match any user account.' }, 401);
    });
};
