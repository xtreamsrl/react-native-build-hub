oclif-hello-world
=================

oclif example Hello World CLI

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/oclif-hello-world.svg)](https://npmjs.org/package/oclif-hello-world)
[![CircleCI](https://circleci.com/gh/oclif/hello-world/tree/main.svg?style=shield)](https://circleci.com/gh/oclif/hello-world/tree/main)
[![Downloads/week](https://img.shields.io/npm/dw/oclif-hello-world.svg)](https://npmjs.org/package/oclif-hello-world)
[![License](https://img.shields.io/npm/l/oclif-hello-world.svg)](https://github.com/oclif/hello-world/blob/main/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g react-native-engine
$ react-native-engine COMMAND
running command...
$ react-native-engine (--version)
react-native-engine/0.0.0 darwin-arm64 node-v16.18.1
$ react-native-engine --help [COMMAND]
USAGE
  $ react-native-engine COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`react-native-engine build [FILE]`](#react-native-engine-build-file)
* [`react-native-engine help [COMMANDS]`](#react-native-engine-help-commands)
* [`react-native-engine plugins`](#react-native-engine-plugins)
* [`react-native-engine plugins:install PLUGIN...`](#react-native-engine-pluginsinstall-plugin)
* [`react-native-engine plugins:inspect PLUGIN...`](#react-native-engine-pluginsinspect-plugin)
* [`react-native-engine plugins:install PLUGIN...`](#react-native-engine-pluginsinstall-plugin-1)
* [`react-native-engine plugins:link PLUGIN`](#react-native-engine-pluginslink-plugin)
* [`react-native-engine plugins:uninstall PLUGIN...`](#react-native-engine-pluginsuninstall-plugin)
* [`react-native-engine plugins:uninstall PLUGIN...`](#react-native-engine-pluginsuninstall-plugin-1)
* [`react-native-engine plugins:uninstall PLUGIN...`](#react-native-engine-pluginsuninstall-plugin-2)
* [`react-native-engine plugins update`](#react-native-engine-plugins-update)
* [`react-native-engine run [FILE]`](#react-native-engine-run-file)

## `react-native-engine build [FILE]`

Create native builds for android and ios

```
USAGE
  $ react-native-engine build [FILE] [-i] [-a] [--all]

ARGUMENTS
  FILE  file to read

FLAGS
  -a, --android  Generate android native build
  -i, --ios      Generate ios native build
  --all

DESCRIPTION
  Create native builds for android and ios

EXAMPLES
  $ react-native-engine build -i

  $ react-native-engine build -a

  $ react-native-engine build -all
```

_See code: [dist/commands/build.ts](https://github.com/xtreamsrl/react-native-engine/blob/v0.0.0/dist/commands/build.ts)_

## `react-native-engine help [COMMANDS]`

Display help for react-native-engine.

```
USAGE
  $ react-native-engine help [COMMANDS] [-n]

ARGUMENTS
  COMMANDS  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for react-native-engine.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v5.2.5/src/commands/help.ts)_

## `react-native-engine plugins`

List installed plugins.

```
USAGE
  $ react-native-engine plugins [--core]

FLAGS
  --core  Show core plugins.

DESCRIPTION
  List installed plugins.

EXAMPLES
  $ react-native-engine plugins
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v2.3.2/src/commands/plugins/index.ts)_

## `react-native-engine plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ react-native-engine plugins:install PLUGIN...

ARGUMENTS
  PLUGIN  Plugin to install.

FLAGS
  -f, --force    Run yarn install with force flag.
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Installs a plugin into the CLI.
  Can be installed from npm or a git url.

  Installation of a user-installed plugin will override a core plugin.

  e.g. If you have a core plugin that has a 'hello' command, installing a user-installed plugin with a 'hello' command
  will override the core plugin implementation. This is useful if a user needs to update core plugin functionality in
  the CLI without the need to patch and update the whole CLI.


ALIASES
  $ react-native-engine plugins add

EXAMPLES
  $ react-native-engine plugins:install myplugin 

  $ react-native-engine plugins:install https://github.com/someuser/someplugin

  $ react-native-engine plugins:install someuser/someplugin
```

## `react-native-engine plugins:inspect PLUGIN...`

Displays installation properties of a plugin.

```
USAGE
  $ react-native-engine plugins:inspect PLUGIN...

ARGUMENTS
  PLUGIN  [default: .] Plugin to inspect.

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Displays installation properties of a plugin.

EXAMPLES
  $ react-native-engine plugins:inspect myplugin
```

## `react-native-engine plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ react-native-engine plugins:install PLUGIN...

ARGUMENTS
  PLUGIN  Plugin to install.

FLAGS
  -f, --force    Run yarn install with force flag.
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Installs a plugin into the CLI.
  Can be installed from npm or a git url.

  Installation of a user-installed plugin will override a core plugin.

  e.g. If you have a core plugin that has a 'hello' command, installing a user-installed plugin with a 'hello' command
  will override the core plugin implementation. This is useful if a user needs to update core plugin functionality in
  the CLI without the need to patch and update the whole CLI.


ALIASES
  $ react-native-engine plugins add

EXAMPLES
  $ react-native-engine plugins:install myplugin 

  $ react-native-engine plugins:install https://github.com/someuser/someplugin

  $ react-native-engine plugins:install someuser/someplugin
```

## `react-native-engine plugins:link PLUGIN`

Links a plugin into the CLI for development.

```
USAGE
  $ react-native-engine plugins:link PLUGIN

ARGUMENTS
  PATH  [default: .] path to plugin

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Links a plugin into the CLI for development.
  Installation of a linked plugin will override a user-installed or core plugin.

  e.g. If you have a user-installed or core plugin that has a 'hello' command, installing a linked plugin with a 'hello'
  command will override the user-installed or core plugin implementation. This is useful for development work.


EXAMPLES
  $ react-native-engine plugins:link myplugin
```

## `react-native-engine plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ react-native-engine plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ react-native-engine plugins unlink
  $ react-native-engine plugins remove
```

## `react-native-engine plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ react-native-engine plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ react-native-engine plugins unlink
  $ react-native-engine plugins remove
```

## `react-native-engine plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ react-native-engine plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ react-native-engine plugins unlink
  $ react-native-engine plugins remove
```

## `react-native-engine plugins update`

Update installed plugins.

```
USAGE
  $ react-native-engine plugins update [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Update installed plugins.
```

## `react-native-engine run [FILE]`

describe the command here

```
USAGE
  $ react-native-engine run [FILE] [-n <value>] [-f]

ARGUMENTS
  FILE  file to read

FLAGS
  -f, --force
  -n, --name=<value>  name to print

DESCRIPTION
  describe the command here

EXAMPLES
  $ react-native-engine run
```

_See code: [dist/commands/run.ts](https://github.com/xtreamsrl/react-native-engine/blob/v0.0.0/dist/commands/run.ts)_
<!-- commandsstop -->
