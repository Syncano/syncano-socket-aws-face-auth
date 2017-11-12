import AWS from 'aws-sdk';
import fs from 'fs';

/**
 * Rekognition Class
 * @class
 */
class Rekognition {
  /**
   * Constructor initializes AWS Rekognition
   * @param {object} AWSParameters
   * @constructor
   */
  constructor(AWSParameters) {
    this.rekognition = new AWS.Rekognition({
      accessKeyId: AWSParameters.AWS_ACCESS_KEY_ID,
      secretAccessKey: AWSParameters.AWS_SECRET_ACCESS_KEY,
      region: AWSParameters.AWS_REGION
    });
  }

  /**
   * Do the request to AWS Rekognition
   *
   * @param {string} endpoint
   * @param {Object} params
   * @returns {Promise} response object
   */
  doCall(endpoint, params) {
    return new Promise((resolve, reject) => {
      this.rekognition[endpoint](params)
        .promise()
        .then((data) => {
          resolve(data);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  /**
   * Utility to get image params for s3 object or Bytes
   *
   * @param {string} image
   * @param {?string} bucket
   * @returns {Object} image params for Rekognition
   */
  static getImageParams(image, bucket) {
    return bucket !== null
      ? {
        S3Object: {
          Bucket: bucket,
          Name: image
        }
      }
      :
      {
        Bytes: fs.readFileSync(image)
      };
  }

  /**
   * Creates a collection
   *
   * @param {string} collectionId
   * @returns {Promise} object response
   */
  createCollection(collectionId) {
    const params = {
      CollectionId: collectionId
    };
    return this.doCall('createCollection', params);
  }

  /**
   * Deletes a collection
   *
   * @param {string} collectionId
   * @returns {Promise} object response
   */
  deleteCollection(collectionId) {
    const params = {
      CollectionId: collectionId
    };

    return this.doCall('deleteCollection', params);
  }

  /**
   * List collections
   *
   * @returns {Promise} object response
   */
  listCollections() {
    return this.doCall('listCollections', {});
  }

  /**
   * Detects faces in the input image and adds them to the specified collection
   *
   * @param {string} collectionId
   * @param {string} image
   * @param {?string} externalImageId
   * @param {?string} bucket
   * @returns {Promise} object response
   */
  indexFaces(collectionId, image, externalImageId = null, bucket = null) {
    const params = {
      CollectionId: collectionId,
      Image: Rekognition.getImageParams(image, bucket)
    };
    if (externalImageId) {
      params.ExternalImageId = externalImageId;
    }
    return this.doCall('indexFaces', params);
  }

  /**
   * searches the specified collection for matching faces
   *
   * @param {string} collectionId
   * @param {string} image
   * @param {?string} bucket
   * @param {number} threshold
   * @returns {Promise} object response
   */
  searchFacesByImage(collectionId, image, bucket = null, threshold = 90) {
    const params = {
      CollectionId: collectionId,
      Image: Rekognition.getImageParams(image, bucket),
      FaceMatchThreshold: threshold,
      MaxFaces: 1 // We only need the face with the most resemblance
    };

    return this.doCall('searchFacesByImage', params);
  }
}

export default Rekognition;
