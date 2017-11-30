import Syncano from 'syncano-server';
import axios from 'axios';
import uuidv1 from 'uuid/v1';

import Rekognition from './utils/Rekognition';

export default (ctx) => {
  const { users, response } = Syncano(ctx);

  const {
    username, password, collectionId, image
  } = ctx.args;

  const s3bucket = (!ctx.args.bucketName || ctx.args.bucketName.trim() === '')
    ? null : ctx.args.bucketName;

  const AUTH_URL = `https://api.syncano.io/v2/instances/${ctx.meta.instance}/users/auth/`;

  const awsRekognitionClass = new Rekognition(ctx.config);

  /**
   * Check if face tied to another user account
   * @param {object} data
   * @returns {Promise.<*>} promise
   */
  const searchUserFace = ({data}) => {
    return awsRekognitionClass.searchFacesByImage(collectionId, image, s3bucket,
      ctx.config.FACE_MATCH_THRESHOLD)
      .then((res) => {
        if (res.FaceMatches.length === 0) {
          return data;
        }
        // Check if face match not for current user
        if (res.FaceMatches[0].Face.ExternalImageId !== data.external_image_id) {
          return Promise.reject({
            message: 'Image tied to another user account.', statusCode: 400
          });
        }
        return data;
      })
      .catch(err => Promise.reject({ message: err.message, statusCode: 400 }));
  };

  /**
   * Index face
   * @param {object} data
   * @returns {Promise.<*>}
   */
  const indexUserFace = (data) => {
    const externalImageId = (data.external_image_id === null || data.external_image_id === '')
      ? uuidv1() : data.external_image_id;
    return awsRekognitionClass.indexFaces(collectionId, image, externalImageId, s3bucket)
      .then(res => res)
      .catch(err => Promise.reject({ message: err.message, statusCode: 400 }));
  };

  /**
   * Delete faces
   * @param {object} res
   * @param {string} message
   * @returns {Promise.<*>}
   */
  const deleteFaces = (res, message) => {
    const faceIds = res.FaceRecords.map(record => record.Face.FaceId);
    return awsRekognitionClass.deleteFaces(collectionId, faceIds)
      .then(() => {
        return Promise.reject({message, statusCode: 400});
      }).catch(err => Promise.reject({ message: err.message, statusCode: 400 }));
  };

  /**
   * handleSuccessfulIndexImage
   * @param {object} res
   * @returns {*} promise
   */
  const handleIndexImage = (res) => {
    if (res.FaceRecords.length === 1) {
      return res;
    } else if (res.FaceRecords.length > 1) {
      const message = 'Image must consist of only one person\'s face';
      return deleteFaces(res, message);
    }
    return Promise.reject({ message: 'Fail to register face.', statusCode: 400 });
  };

  const updateUserSchema = (res) => {
    users.where('username', username)
      .update({face_auth: true, external_image_id: res.FaceRecords[0].Face.ExternalImageId })
      .then(() => {
        return response.json({ message: 'User face registered for face authentication.' });
      })
      .catch((err) => {
        const message = (err.data) ? err.data : err.message;
        return deleteFaces(res, message);
      });
  };

  axios.post(AUTH_URL, { username, password },
    {
      headers: { 'Content-Type': 'application/json', 'X-API-KEY': ctx.meta.token }
    })
    .then(searchUserFace)
    .then(indexUserFace)
    .then(handleIndexImage)
    .then(updateUserSchema)
    .catch((err) => {
      if (err.statusCode) {
        return response.json(err, err.statusCode);
      }
      return response.json({message: 'Username or password does not match any user account.'}, 401);
    });
};
