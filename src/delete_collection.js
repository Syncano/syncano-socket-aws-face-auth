import Syncano from 'syncano-server';

import Rekognition from './utils/Rekognition';

export default (ctx) => {
  const {response, logger} = Syncano(ctx);

  const config = {
    AWS_ACCESS_KEY_ID: ctx.config.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: ctx.config.AWS_SECRET_ACCESS_KEY,
    AWS_REGION: ctx.config.AWS_REGION,
  };

  const awsRekognitionClass = new Rekognition(config);

  return awsRekognitionClass.deleteCollection(ctx.args.collectionId)
    .then((res) => {
      response.json({
        statusCode: res.StatusCode
      });
    })
    .catch((err) => {
      response.json({
        statusCode: err.statusCode,
        code: err.code,
        message: err.message
      }, 400);
    });
};
