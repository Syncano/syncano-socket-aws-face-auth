import AWS from 'aws-sdk';
import fs from 'fs';
import request from 'request';

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
   * @returns {Promise}
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
   * @param {string} bucketName
   * @returns {Object} image params for Rekognition
   */
  static async getImageParams(image, bucketName) {
    if (bucketName !== null) {
      return {
        S3Object: {
          Bucket: bucketName,
          Name: image
        }
      };
    }
    try {
      return {
        Bytes: await Buffer.from(image, 'base64')
      };
    } catch (err) {
      return { Bytes: [] };
    }
  }

  /**
   * Creates a collection
   *
   * @param {string} collectionId
   * @returns {Promise}
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
   * @returns {Promise}
   */
  deleteCollection(collectionId) {
    const params = {
      CollectionId: collectionId
    };

    return this.doCall('deleteCollection', params);
  }

  /**
   * Detects faces in the input image and adds them to the specified collection
   *
   * @param {string} collectionId
   * @param {string} image
   * @param {?string} externalImageId
   * @param {?string} bucket
   * @returns {Promise}
   */
  async indexFaces(collectionId, image, externalImageId = null, bucket = null) {
    const params = {
      CollectionId: collectionId,
      Image: await Rekognition.getImageParams(image, bucket)
    };
    if (externalImageId) {
      params.ExternalImageId = externalImageId;
    }
    return this.doCall('indexFaces', params);
  }

  /**
   * searches the specified collection for matching faces using image
   *
   * @param {string} collectionId
   * @param {string} image
   * @param {?string} bucket
   * @param {number} threshold
   * @returns {Promise}
   */
  async searchFacesByImage(collectionId, image, bucket = null, threshold) {
    const params = {
      CollectionId: collectionId,
      Image: await Rekognition.getImageParams(image, bucket),
      FaceMatchThreshold: threshold,
    };

    return this.doCall('searchFacesByImage', params);
  }

  /**
   * deletes faces from collection matching the faceId(s)
   *
   * @param {string} collectionId
   * @param {array} faceId
   * @returns {Promise}
   */
  deleteFaces(collectionId, faceId) {
    const params = {
      CollectionId: collectionId,
      FaceIds: faceId
    };

    return this.doCall('deleteFaces', params);
  }
}

export default Rekognition;
