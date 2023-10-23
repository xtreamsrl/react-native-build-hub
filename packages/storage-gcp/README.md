# @rn-buildhub/gcp-storage

A storage implementation for **React Native Build Hub** that uses Google Cloud Storage to save native builds.

## Setup

```
npm install --save-dev @rn-buildhub/gcp-storage
```

### Service Account Creation

It's recommended to generate a service account with exclusive permissions.

## Configuration

Keep in mind that environment variables take precedence over configuration settings.

In addition to the above, all parameters outlined in [rn-buildhub-storage-interface](https://www.npmjs.com/package/rn-buildhub-storage-interface) apply here.

| Parameter              | Description                                   | Environment Variable / .env | `rn-buildhub.json`    |
|------------------------|-----------------------------------------------|-----------------------------|-----------------------|
| Google Project         | The name of the Google Cloud project.         | `RNBH_GCP_PROJECT`          | `googleProject`       |
| Bucket Name            | Name of the bucket for cache storage.         | `RNBH_GCP_BUCKET_NAME`      | `bucketName`          |
| Read from Remote Cache | Toggle to permit reading from the remote cache.| `RNBH_READ`                 | `read` (true/false)   |
| Write to Remote Cache  | Toggle to allow writing to the remote cache.  | `RNBH_WRITE`                | `write` (true/false)  |

### Sample Configuration
```json
{
   "tasksRunnerOptions": {
      "default": {
         "runner": "@rn-buildhub/gcp-storage",
         "options": {
            "googleProject": "my-google-project-id",
            "bucketName": "my-rn-buildhub-cache-bucket",
            "read": true,
            "write": false
         }
      }
   }
}
```

## Running 🚀

Upon executing tasks, the console will show activity indicating storage or retrieval from the Google Cloud bucket:

```
------------------------------------------------------------------------------
Remote cache hit: Google Cloud Bucket
File: 1fb268062785d739b5a43c1e4032fd7731c6080e2249e87a00e568b3c41acf9c.tar.gz
------------------------------------------------------------------------------
```
