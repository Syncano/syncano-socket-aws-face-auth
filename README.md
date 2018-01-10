# Syncano Socket aws-face-auth
[![CircleCI](https://circleci.com/gh/Syncano/syncano-socket-aws-face-auth.svg?style=svg)](https://circleci.com/gh/Syncano/syncano-socket-aws-face-auth)

This socket integrates face authentication with aws rekognition to Syncano.

### Install

```
syncano-cli add aws-face-auth
```

### Dependencies
* **rest-auth socket**
    
    Since there can be no authentication without first registering to a system, it is important to use the `rest-auth` socket for basic registration.

    [Link to rest-auth socket documentation](https://syncano.io/#/sockets/two-factor-auth)

### Socket Documentation
[Link to aws-face-auth socket documentation](https://syncano.io/#/sockets/aws-face-auth)


## Endpoints

#### create-collection

This endpoint creates a collection where face indexes will be stored in AWS Rekognition.

*_Parameters_*

| Name          | Type      | Description  | Example
| ------------- |----------| ------------| ---------
| collectionId  | string   | ID for the collection that you are creating | SyncanoFaces

*_Response_*

```
{
  "collectionArn": "12345",
  "statusCode": 200
}
```

#### delete-collection

This endpoint deletes a collection in AWS Rekognition.

*_Parameters_*


| Name          | Type      | Description  | Example
| ------------- |-----------| ------------| ---------
| collectionId  | string   | ID for the collection that you are deleting | SyncanoFaces

*_Response_*

```
{
  "statusCode": 200
}
```

#### face-register

This endpoint register's a face to an existing user account for face authentication.

*_Parameters_*

User required to input password as extra check when registering face to account.

| Name          | Type      | Description  | Example
| ------------- |-----------| ------------| ---------
| username      | string   | User email   | you@domain.com
| password     | string    | User password | user-password
| collectionId | string    | Id collection to keep indexed image | SyncanoFaces
| image        | string    | Path to image or an S3 object key | image.jpg
| bucketName   | string    | Name of s3 bucket. Leave empty if image not on s3 bucket  | s3-bucket.

*_Response_*

```
{
  message: "User face registered for face authentication."
}
```

#### face-login

This endpoint login a user using face image.

*_Parameters_*


| Name          | Type      | Description  | Example
| ------------- |-----------| ------------| ---------
| collectionId | string    | Id collection to keep indexed image | SyncanoFaces
| image        | string    | Path to image or an S3 object key | image.jpg
| bucketName   | string    | Name of s3 bucket. Leave empty if image not on s3 bucket  | s3-bucket.

*_Response_*

```
{
  token: "cb21ff98ac8c7dda8fcd01",
  username: "you@domain.com"
}
```

#### remove-face-auth

This endpoint removes face authentication on user account

*_Parameters_*


| Name          | Type      | Description  | Example
| ------------- |-----------| ------------| ---------
| username      | string   | User email   | you@domain.com
| token     | string    | User token | cb21fac8c7dda8fcd0129b0adb0254dea5c8e
| collectionId | string    | Id collection to keep indexed image | SyncanoFaces
| image        | string    | Path to image or an S3 object key | image.jpg
| bucketName   | string    | Name of s3 bucket. Leave empty if image not on s3 bucket  | s3-bucket.


*Response*

```
{
  message: "User account removed from face authentication."
}
```

#### verify-face-auth

This endpoint checks if face authentication is enabled on user account

*_Parameters_*


| Name          | Type      | Description  | Example
| ------------- |-----------| ------------| ---------
| username      | string   | User email   | you@domain.com
| token     | string    | User token | cb21fac8c7dda8fcd0129b0adb0254dea5c8e


*Response*

```
{
  message: "Face auth enabled on user account.",
  is_face_auth: true
}
```

### Contributing

#### How to Contribute
  * Fork this repository
  * Clone from your fork
  * Make your contributions (Make sure your work is well tested)
  * Create Pull request from the fork to this repo

#### Setting up environment variables
  * Create a `.env` on parent folder
  * Copy contents of `.env-sample` file to newly created `.env` file and assign appropriate values to the listed variables.

#### Testing
  * Ensure all your test are written on the `test` directory
  * Use the command `npm test` to run test

