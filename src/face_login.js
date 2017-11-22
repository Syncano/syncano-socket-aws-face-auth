import Syncano from 'syncano-server';

import Rekognition from './utils/Rekognition';

export default (ctx) => {
  const {response, users, logger} = Syncano(ctx);

  const awsRekognitionClass = new Rekognition(ctx.config);

  const {collectionId, image} = ctx.args;
  const bucketName = (ctx.args.bucketName || ctx.args.bucketName.trim() !== '')
    ? ctx.args.bucketName : null;

  const log = logger('Socket scope');

  const handleSearchFacesByImageResult = (res) => {
    if (res.FaceMatches.length === 0) {
      return Promise.reject({ message: 'User does not exist', code: 400 });
    }
    return res;
  };

  /**
   * Get user based on face match externalID
   * @param {object} res
   * @returns {Promise.<*>} promise
   */
  const getUser = (res) => {
    if (res.type === 'error') {
      return Promise.reject(res);
    }
    const faceIds = res.FaceMatches.map(record => record.Face.FaceId);
    log.info('Get USer >>>>>>', faceIds);
    return users.where('external_image_id', res.FaceMatches[0].Face.ExternalImageId)
      .firstOrFail()
      .then(data => response.json({token: data.user_key, username: data.username}))
      .catch((err) => {
        log.info('Oppsss Eyaaa');
        const message = 'Authentication fail.';
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
    return response.json({ message: 'Authentication fail.' }, 400);
  };


  return awsRekognitionClass.searchFacesByImage(collectionId, image, bucketName)
    .then(handleSearchFacesByImageResult)
    .then(getUser)
    .catch(err => handleError(err));
};
