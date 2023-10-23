
[![npm package link](https://img.shields.io/npm/v/@rn-buildhub/s3-storage)](https://www.npmjs.com/package/@rn-buildhub/s3-storage)

# @rn-buildhub/s3-storage

@rn-buildhub/s3-storage is a crucial extension for React Native Build Hub, providing seamless integration with AWS S3 for distributed caching.

## Setup

Kickstart your setup with:

```bash
yarn add @rn-buildhub/s3-storage
npm i @rn-buildhub/s3-storage
```

And initialize the package:

```bash
yarn react-native-build-hub @rn-buildhub/s3-storage:init
npm run react-native-build-hub @rn-buildhub/s3-storage:init
```

This step updates the necessary configuration in your workspace for the s3-storage runner.

## Plugin Settings

Both `Environment variables` and `rn-buildhub.json` can be used for plugin settings. Here are the options available:

| Parameter         | Description                                                                                         | Environment Variable / .env     | `rn-buildhub.json`  | Example                        |
| ----------------- | --------------------------------------------------------------------------------------------------- | ------------------------------- | -------------------- | ------------------------------ |
| Access Key Id     | AWS Access Key Id.                                                                                  | `RNBH_AWS_ACCESS_KEY_ID`        | `awsAccessKeyId`     | my-id                          |
| Secret Access Key | AWS Secret Access Key.                                                                              | `RNBH_AWS_SECRET_ACCESS_KEY`    | `awsSecretAccessKey` | my-key                         |
| Profile           | Use when Access Key Id and Secret Access Key are not provided.                                      | `RNBH_AWS_PROFILE`              | `awsProfile`         | profile-1                      |
| Endpoint          | Optional custom endpoint, like MinIO.                                                               | `RNBH_AWS_ENDPOINT`             | `awsEndpoint`        | http://custom.de-eu.myhost.com |
| Region            | AWS region for your S3 bucket.                                                                      | `RNBH_AWS_REGION`               | `awsRegion`          | eu-central-1                   |
| Bucket            | S3 Bucket (and optional sub-path) for cache storage.                                                | `RNBH_AWS_BUCKET`               | `awsBucket`          | bucket-name/sub-path           |
| Force Path Style  | Force path style URLs for S3 objects (needed for MinIO).                                            | `RNBH_AWS_FORCE_PATH_STYLE`     | `awsForcePathStyle`  | true                           |

> **Important:** Environment variables take precedence over `rn-buildhub.json` options!

### `rn-buildhub.json` Example

```json
{
  "tasksRunnerOptions": {
  "default": {
    "runner": "@rn-buildhub/s3-storage",
    "options": {
      ...
      "awsAccessKeyId": "key",
      "awsSecretAccessKey": "secret",
      "awsEndpoint": "http://custom.de-eu.myhost.com",
      "awsBucket": "bucket-name/sub-path",
      "awsRegion": "eu-central-1",
      "awsForcePathStyle": true,
    }
  }
}
```

> Remember, `.env` files can set your environment variables. [dotenv documentation](https://www.npmjs.com/package/dotenv) can guide you.

## Disabling S3 Cache

For local caching, you can disable the S3 cache with:

```bash
RNBH_AWS_DISABLE=true
```

## Authentication

### Default

Setup AWS authentication following the [official AWS documentation](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/setting-credentials-node.html).

### SSO login

For SSO-based authentication:

`aws sso login`

We employ AWS SDK v3, which comes with [SSO login](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-sso.html) support.

## Building & Testing

While this package should work out-of-the-box, for contributors or advanced users:

- **Build**: `yarn react-native-build-hub s3-storage` (for production, use `--prod`).
- **Unit Tests**: Execute with [Jest](https://jestjs.io) via `yarn react-native-build-hub test s3-storage`.
- **End-to-End Tests**: Run with `yarn react-native-build-hub e2e s3-storage-e2e`.

## Kudos

Major inspiration for this repository came from the Azure integration [@nx-azure/storage-cache](https://github.com/microsoft/nx-azure) and, of course, the original Nx Cloud Plugin by [Nrwl](https://github.com/nrwl/nx).
