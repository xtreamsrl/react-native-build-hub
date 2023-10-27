# @rn-buildhub/azure-storage

A storage implementation for **React Native Build Hub** that uses Azure Blob Storage to save native builds.

## Setup

```
npm install --save-dev @rn-buildhub/azure-storage
```

### Configuration Details
Just use a `.env` file in the root of your project to set some of the following environment variables
or populate the `remote.config` object in your `rn-buildhub.json` file.

| Parameter         | Description                                                  | Environment Variable / .env    |
|-------------------|--------------------------------------------------------------|--------------------------------|
| Connection String | Connect to Azure Storage blob with a single URL.             | `RNBH_AZURE_CONNECTION_STRING` |
| Container SAS URL | Connect to Azure Storage blob using a container SAS URL.     | `RNBH_AZURE_SAS_URL`           |
| Account Name      | Pair with Account Key for Azure Credentials Authentication.  | `RNBH_AZURE_ACCOUNT_NAME`      |
| Account Key       | Pair with Account Name for Azure Credentials Authentication. | `RNBH_AZURE_ACCOUNT_KEY`       |
| Container         | Specify the container for storing the cache.                 | `RNBH_AZURE_CONTAINER`         |
| Azure URL         | For local debugging, an optional Azure URL override.         | `RNBH_AZURE_URL`               |
| Azure AD Auth     | Pair with Account Name for Azure AD Authentication.          | `RNBH_AZURE_AD_AUTH`           |


## Guides

[🔗 _How to create and configure an Azure Blob
Storage_](https://docs.microsoft.com/en-us/azure/storage/blobs/storage-quickstart-blobs-portal)

[🔗 Create SAS tokens for your storage containers](https://learn.microsoft.com/en-us/azure/ai-services/translator/document-translation/how-to-guides/create-sas-tokens?tabs=Containers)


## See Also

| Package                                                          | Storage               |
|------------------------------------------------------------------|-----------------------|
| [@rn-buildhub/s3-storage](../storage-s3/README.md)               | Amazon Web Services   |
| [@rn-buildhub/gcp-storage](../storage-gcp/README.md)             | Google Cloud Platform |
| [@rn-buildhub/storage-interface](../storage-interface/README.md) | Abstract storage      |
