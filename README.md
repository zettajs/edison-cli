# Edison CLI Interface

## Install

`npm install edison-cli -g`

## Usage

```
  Usage: edison-cli [options] [command]

  Commands:

    deploy [options] [dir]  deploy node app directory to edison
    start                   start node app on edison
    stop                    stop node app on edison
    list [timeout]          find edisons on your network and list them.

  Options:

    -h, --help         output usage information
    -V, --version      output the version number
    -H, --host <host>  hostname of edison
    -q, --quite        supress logging
```

## Search for Edisons

`$ edison-cli list`

## Deploy Node App

`$ edison-cli -H myedison.local deploy .`

## Start Application

`$ edison-cli -H myedison.local start`

## Stop Application

`$ edison-cli -H myedison.local stop`
