import Syncano from 'syncano-server';

import Rekognition from './utils/Rekognition';

export default (ctx) => {
  const {response, users } = Syncano(ctx);

  const awsRekognitionClass = new Rekognition(ctx.config);

  const {collectionId, image} = ctx.args;
  const bucketName = (!ctx.args.bucketName || ctx.args.bucketName.trim() === '')
    ? null : ctx.args.bucketName;

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
        return response.json({token: user_key, username});
      })
      .catch(() => {
        const message = 'Authentication fail.';
        return Promise.reject({ message, statusCode: 401 });
      });
  };

  return awsRekognitionClass.searchFacesByImage(collectionId, image, bucketName,
    ctx.config.FACE_MATCH_THRESHOLD)
    .then(handleSearchFacesByImageResult)
    .then(getUser)
    .catch((err) => {
      if (err.statusCode) {
        return response.json(err, err.statusCode);
      }
      return response.json({ message: 'Authentication fail.' }, 401);
    });
};
