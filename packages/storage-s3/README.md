
[![npm package link](https://img.shields.io/npm/v/@rn-buildhub/s3-storage)](https://www.npmjs.com/package/@rn-buildhub/s3-storage)

# @rn-buildhub/s3-storage

@rn-buildhub/s3-storage is a crucial extension for React Native Build Hub, providing seamless integration with AWS S3 for distributed caching.

## Setup

Kickstart your setup with:

```bash
yarn add @rn-buildhub/s3-storage
npm i @rn-buildhub/s3-storage
```

## Configuration Details

Both `Environment variables` and `rn-buildhub.json` can be used for plugin settings. Here are the options available:

| Parameter         | Description                                                                                         | Environment Variable / .env     | `rn-buildhub.json`  |
| ----------------- | --------------------------------------------------------------------------------------------------- | ------------------------------- | -------------------- |
| Access Key Id     | AWS Access Key Id.                                                                                  | `RNBH_AWS_ACCESS_KEY_ID`        | `awsAccessKeyId`     |
| Secret Access Key | AWS Secret Access Key.                                                                              | `RNBH_AWS_SECRET_ACCESS_KEY`    | `awsSecretAccessKey` | 
| Region            | AWS region for your S3 bucket.                                                                      | `RNBH_AWS_REGION`               | `awsRegion`          | 
| Bucket            | S3 Bucket (and optional sub-path) for cache storage.                                                | `RNBH_AWS_BUCKET`               | `awsBucket`          |
| Profile           | Use when Access Key Id and Secret Access Key are not provided.                                      | `RNBH_AWS_PROFILE`              | `awsProfile`         |
| Endpoint          | Optional custom endpoint, like MinIO.                                                               | `RNBH_AWS_ENDPOINT`             | `awsEndpoint`        |
| Force Path Style  | Force path style URLs for S3 objects (needed for MinIO).                                            | `RNBH_AWS_FORCE_PATH_STYLE`     | `awsForcePathStyle`  |

> **Important:** Environment variables take precedence over `rn-buildhub.json` options!

> Remember, `.env` files can set your environment variables. [dotenv documentation](https://www.npmjs.com/package/dotenv) can guide you.

## Guides

[🔗 _How to create and configure an AWS S3 bucket_](https://preventdirectaccess.com/docs/amazon-s3-quick-start-guide/)



## See Also

| Package                                                          | Storage               |
|------------------------------------------------------------------|-----------------------|
| [@rn-buildhub/azure-storage](../storage-azure/README.md)         | Azure Cloud Platform  |
| [@rn-buildhub/gcp-storage](../storage-gcp/README.md)             | Google Cloud Platform |
| [@rn-buildhub/storage-interface](../storage-interface/README.md) | Abstract storage      |
