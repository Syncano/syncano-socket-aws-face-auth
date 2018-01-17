import Syncano from 'syncano-server';

import Rekognition from './utils/Rekognition';

export default (ctx) => {
  const { response } = Syncano(ctx);

  const awsRekognitionClass = new Rekognition(ctx.config);

  return awsRekognitionClass.deleteCollection(ctx.args.collectionId)
    .then((res) => {
      return response.json({
        statusCode: res.StatusCode
      });
    })
    .catch((err) => {
      return response.json({
        statusCode: err.statusCode,
        code: err.code,
        message: err.message
      }, 400);
    });
};
