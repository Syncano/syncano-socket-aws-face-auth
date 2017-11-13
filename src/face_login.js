import Syncano from 'syncano-server';

import Rekognition from './utils/Rekognition';

export default (ctx) => {
  const {response} = Syncano(ctx);

  const awsRekognitionClass = new Rekognition(ctx.config);

  const {collectionId, image} = ctx.args;
  const bucketName = (ctx.args.bucketName || ctx.args.bucketName.trim() !== '')
    ? ctx.args.bucketName : null;

  return awsRekognitionClass.searchFacesByImage(collectionId, image, bucketName)
    .then((res) => {
      if (res.FaceMatches.length === 0) {
        response.json({
          message: 'User does not exist'
        }, 400);
      } else {
        response.json({
          userId: res.FaceMatches[0].Face.ExternalImageId
        }, 200);
      }
    })
    .catch((err) => {
      response.json({
        statusCode: err.statusCode,
        code: err.code,
        message: err.message
      }, 400);
    });
};
