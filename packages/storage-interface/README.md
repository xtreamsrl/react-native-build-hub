## RemoteStorage Interface for React Native Build Hub :floppy_disk:

Welcome to the **RemoteStorage** interface, the backbone of **React Native Build Hub**'s storage capabilities. This
interface ensures seamless integration with any object storage

### Key Features

- **Unique Build ID**: Generate a distinct build ID instantly using `createBuildId()`.

- **Manage Latest Builds**: Record and retrieve the last build through `setLastBuild()` and `getLastBuild()`.

- **Handle Build Info**: Store and fetch detailed build information with `saveBuildInfo()` and `getBuildInfo()` tailored
  for both Android and iOS.

- **Simple File Operations**: A breeze to upload or download your builds using `upload()` and `download()`
