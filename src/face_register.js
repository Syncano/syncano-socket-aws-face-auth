import Syncano from 'syncano-server';
import uuidv1 from 'uuid/v1';

import Rekognition from './utils/Rekognition';

export default (ctx) => {
  const {response, logger} = Syncano(ctx);

  const config = {
    AWS_ACCESS_KEY_ID: ctx.config.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: ctx.config.AWS_SECRET_ACCESS_KEY,
    AWS_REGION: ctx.config.AWS_REGION,
  };

  const awsRekognitionClass = new Rekognition(config);

  const {collectionId, image } = ctx.args;
  const bucketName = (ctx.args.bucketName || ctx.args.bucketName.trim() !== '')
    ? ctx.args.bucketName : null;
  const externalImageId = uuidv1();

  return awsRekognitionClass.searchFacesByImage(collectionId, image, bucketName)
    .then((res) => {
      // if face match not found
      if (res.FaceMatches.length === 0) {
        return awsRekognitionClass.indexFaces(collectionId, image, externalImageId, bucketName)
          .then((res) => {
            response.json({
              userId: res.FaceRecords[0].Face.ExternalImageId
            });
          })
          .catch((err) => {
            response.json({
              statusCode: err.statusCode,
              code: err.code,
              message: err.message
            }, 400);
          });
      }
      return response.json({
        message: 'User already exist'
      }, 201);
    })
    .catch((err) => {
      response.json({
        statusCode: err.statusCode,
        code: err.code,
        message: err.message
      }, 400);
    });
};
