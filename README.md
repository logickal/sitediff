sitediff
=================

A new CLI generated with oclif


[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/sitediff.svg)](https://npmjs.org/package/sitediff)
[![Downloads/week](https://img.shields.io/npm/dw/sitediff.svg)](https://npmjs.org/package/sitediff)


<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g sitediff
$ sitediff COMMAND
running command...
$ sitediff (--version)
sitediff/0.0.0 darwin-arm64 node-v22.17.1
$ sitediff --help [COMMAND]
USAGE
  $ sitediff COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`sitediff hello PERSON`](#sitediff-hello-person)
* [`sitediff hello world`](#sitediff-hello-world)
* [`sitediff help [COMMAND]`](#sitediff-help-command)
* [`sitediff plugins`](#sitediff-plugins)
* [`sitediff plugins add PLUGIN`](#sitediff-plugins-add-plugin)
* [`sitediff plugins:inspect PLUGIN...`](#sitediff-pluginsinspect-plugin)
* [`sitediff plugins install PLUGIN`](#sitediff-plugins-install-plugin)
* [`sitediff plugins link PATH`](#sitediff-plugins-link-path)
* [`sitediff plugins remove [PLUGIN]`](#sitediff-plugins-remove-plugin)
* [`sitediff plugins reset`](#sitediff-plugins-reset)
* [`sitediff plugins uninstall [PLUGIN]`](#sitediff-plugins-uninstall-plugin)
* [`sitediff plugins unlink [PLUGIN]`](#sitediff-plugins-unlink-plugin)
* [`sitediff plugins update`](#sitediff-plugins-update)

## `sitediff hello PERSON`

Say hello

```
USAGE
  $ sitediff hello PERSON -f <value>

ARGUMENTS
  PERSON  Person to say hello to

FLAGS
  -f, --from=<value>  (required) Who is saying hello

DESCRIPTION
  Say hello

EXAMPLES
  $ sitediff hello friend --from oclif
  hello friend from oclif! (./src/commands/hello/index.ts)
```

_See code: [src/commands/hello/index.ts](https://github.com/logickal/sitediff/blob/v0.0.0/src/commands/hello/index.ts)_

## `sitediff hello world`

Say hello world

```
USAGE
  $ sitediff hello world

DESCRIPTION
  Say hello world

EXAMPLES
  $ sitediff hello world
  hello world! (./src/commands/hello/world.ts)
```

_See code: [src/commands/hello/world.ts](https://github.com/logickal/sitediff/blob/v0.0.0/src/commands/hello/world.ts)_

## `sitediff help [COMMAND]`

Display help for sitediff.

```
USAGE
  $ sitediff help [COMMAND...] [-n]

ARGUMENTS
  COMMAND...  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for sitediff.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v6.2.31/src/commands/help.ts)_

## `sitediff plugins`

List installed plugins.

```
USAGE
  $ sitediff plugins [--json] [--core]

FLAGS
  --core  Show core plugins.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  List installed plugins.

EXAMPLES
  $ sitediff plugins
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.45/src/commands/plugins/index.ts)_

## `sitediff plugins add PLUGIN`

Installs a plugin into sitediff.

```
USAGE
  $ sitediff plugins add PLUGIN... [--json] [-f] [-h] [-s | -v]

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Force npm to fetch remote resources even if a local copy exists on disk.
  -h, --help     Show CLI help.
  -s, --silent   Silences npm output.
  -v, --verbose  Show verbose npm output.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Installs a plugin into sitediff.

  Uses npm to install plugins.

  Installation of a user-installed plugin will override a core plugin.

  Use the SITEDIFF_NPM_LOG_LEVEL environment variable to set the npm loglevel.
  Use the SITEDIFF_NPM_REGISTRY environment variable to set the npm registry.

ALIASES
  $ sitediff plugins add

EXAMPLES
  Install a plugin from npm registry.

    $ sitediff plugins add myplugin

  Install a plugin from a github url.

    $ sitediff plugins add https://github.com/someuser/someplugin

  Install a plugin from a github slug.

    $ sitediff plugins add someuser/someplugin
```

## `sitediff plugins:inspect PLUGIN...`

Displays installation properties of a plugin.

```
USAGE
  $ sitediff plugins inspect PLUGIN...

ARGUMENTS
  PLUGIN...  [default: .] Plugin to inspect.

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Displays installation properties of a plugin.

EXAMPLES
  $ sitediff plugins inspect myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.45/src/commands/plugins/inspect.ts)_

## `sitediff plugins install PLUGIN`

Installs a plugin into sitediff.

```
USAGE
  $ sitediff plugins install PLUGIN... [--json] [-f] [-h] [-s | -v]

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Force npm to fetch remote resources even if a local copy exists on disk.
  -h, --help     Show CLI help.
  -s, --silent   Silences npm output.
  -v, --verbose  Show verbose npm output.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Installs a plugin into sitediff.

  Uses npm to install plugins.

  Installation of a user-installed plugin will override a core plugin.

  Use the SITEDIFF_NPM_LOG_LEVEL environment variable to set the npm loglevel.
  Use the SITEDIFF_NPM_REGISTRY environment variable to set the npm registry.

ALIASES
  $ sitediff plugins add

EXAMPLES
  Install a plugin from npm registry.

    $ sitediff plugins install myplugin

  Install a plugin from a github url.

    $ sitediff plugins install https://github.com/someuser/someplugin

  Install a plugin from a github slug.

    $ sitediff plugins install someuser/someplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.45/src/commands/plugins/install.ts)_

## `sitediff plugins link PATH`

Links a plugin into the CLI for development.

```
USAGE
  $ sitediff plugins link PATH [-h] [--install] [-v]

ARGUMENTS
  PATH  [default: .] path to plugin

FLAGS
  -h, --help          Show CLI help.
  -v, --verbose
      --[no-]install  Install dependencies after linking the plugin.

DESCRIPTION
  Links a plugin into the CLI for development.

  Installation of a linked plugin will override a user-installed or core plugin.

  e.g. If you have a user-installed or core plugin that has a 'hello' command, installing a linked plugin with a 'hello'
  command will override the user-installed or core plugin implementation. This is useful for development work.


EXAMPLES
  $ sitediff plugins link myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.45/src/commands/plugins/link.ts)_

## `sitediff plugins remove [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ sitediff plugins remove [PLUGIN...] [-h] [-v]

ARGUMENTS
  PLUGIN...  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ sitediff plugins unlink
  $ sitediff plugins remove

EXAMPLES
  $ sitediff plugins remove myplugin
```

## `sitediff plugins reset`

Remove all user-installed and linked plugins.

```
USAGE
  $ sitediff plugins reset [--hard] [--reinstall]

FLAGS
  --hard       Delete node_modules and package manager related files in addition to uninstalling plugins.
  --reinstall  Reinstall all plugins after uninstalling.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.45/src/commands/plugins/reset.ts)_

## `sitediff plugins uninstall [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ sitediff plugins uninstall [PLUGIN...] [-h] [-v]

ARGUMENTS
  PLUGIN...  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ sitediff plugins unlink
  $ sitediff plugins remove

EXAMPLES
  $ sitediff plugins uninstall myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.45/src/commands/plugins/uninstall.ts)_

## `sitediff plugins unlink [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ sitediff plugins unlink [PLUGIN...] [-h] [-v]

ARGUMENTS
  PLUGIN...  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ sitediff plugins unlink
  $ sitediff plugins remove

EXAMPLES
  $ sitediff plugins unlink myplugin
```

## `sitediff plugins update`

Update installed plugins.

```
USAGE
  $ sitediff plugins update [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Update installed plugins.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.45/src/commands/plugins/update.ts)_
<!-- commandsstop -->
