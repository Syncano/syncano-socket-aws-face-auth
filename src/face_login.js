import Syncano from 'syncano-server';

import Rekognition from './utils/Rekognition';

export default (ctx) => {
  const {response, logger} = Syncano(ctx);

  const log = logger('Socket scope');

  const config = {
    AWS_ACCESS_KEY_ID: ctx.config.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: ctx.config.AWS_SECRET_ACCESS_KEY,
    AWS_REGION: ctx.config.AWS_REGION,
  };

  const awsRekognitionClass = new Rekognition(config);

  const {collectionId, image} = ctx.args;
  const bucketName = (ctx.args.bucketName) ? ctx.args.bucketName : null;

  return awsRekognitionClass.searchFacesByImage(collectionId, image, bucketName)
    .then((res) => {
      log.info('success', res);
      if (res.FaceMatches.length === 0) {
        response.json({
          message: 'User does not exist'
        }, 400);
      } else {
        response.json({
          userId: res.FaceMatches[0].Face.ExternalImageId
        }, 400);
      }
    })
    .catch((err) => {
      log.info('fail', err);
      response.json({
        statusCode: err.statusCode,
        code: err.code,
        message: err.message
      }, 400);
    });
};
