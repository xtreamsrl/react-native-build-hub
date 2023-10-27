# @rn-buildhub/gcp-storage

A storage implementation for **React Native Build Hub** that uses Google Cloud Storage to save native builds.

## Setup

```
npm install --save-dev @rn-buildhub/gcp-storage
```

### Configuration Details

Just use a `.env` file in the root of your project to set some of the following environment variables
or populate the `remote.config` object in your `rn-buildhub.json` file.

| Parameter                   | Description                                      | Environment Variable / .env |
|-----------------------------|--------------------------------------------------|-----------------------------|
| Google Service Account file | The json file of the service account credentials | `RNBH_GOOGLE_APPLICATION_CREDENTIALS`          | 
| Bucket Name                 | Name of the bucket for cache storage.            | `RNBH_GCP_BUCKET`      |


## Guides

[🔗 How to create a Google Cloud Storage_Bucket](https://cloud.google.com/storage/docs/creating-buckets)
[🔗 Create a service account to access your data](https://www.bizstats.ai/_/analytics-ai/user-guide/connections/google-cloud/google-storage/grant-permission/)

## See Also

| Package                                                          | Storage              |
|------------------------------------------------------------------|----------------------|
| [@rn-buildhub/s3-storage](../storage-s3/README.md)               | Amazon Web Services  |
| [@rn-buildhub/azure-storage](../storage-azure/README.md)         | Azure Cloud Platform |
| [@rn-buildhub/storage-interface](../storage-interface/README.md) | Abstract storage     |
