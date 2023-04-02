<span align="center">

# Switchbot Hub 2

</span>

## Installation

1. Install `npm install alvst/Homebridge-Switchbot-Hub-2`

## Configuration

1. Configure the accessories portion of your config.json by adding accessories for both Humidity and Temperature. (Since both are used in this plugin, use of both is required.)

```json
    "accessories": [
        {
            "accessory": "Humidity Sensor",
            "name": "Humidity Sensor",
            "token": "Secret Token",
            "secret": "Secret",
            "notice": "Note: Keep your Token & Secret a secret!",
            "hubId": "Hub DeviceID",
            "interval": 120000
        },
        {
            "accessory": "Temperature Sensor",
            "name": "Temperature Sensor",
            "token": "Secret Token",
            "secret": "Secret",
            "notice": "Note: Keep your Token & Secret a secret!",
            "hubId": "Hub DeviceID",
            "interval": 120000
        }
   ]
```

2. Add your Token and Secret from the SwitchBot App (These are the same as the ones used for the [Homebridge-SwitchBot Plugin](https://github.com/OpenWonderLabs/homebridge-switchbot))

## Required fields

| Key      | Description                                                          | Required |
| -------- | -------------------------------------------------------------------- | -------- |
| `token`  | Add your SwitchBot Token                                             | `Yes`    |
| `secret` | Add your SwitchBot Secret                                            | `Yes`    |
| `hubId`  | Add your hub ID without the ":'s" separating the numbers and letters | `Yes`    |

## Thermostat Details Optional fields

| Key        | Description                                                                                                   | Default |
| ---------- | ------------------------------------------------------------------------------------------------------------- | ------- |
| `interval` | When the the humidity and temperature will be refreshed. A minimum of 2 minutes is enforced (in milliseconds) | `3000`  |
| `debug`    | Useful for debugging                                                                                          | `false` |

## Supported Devices

This plugin is useful for SwitchBot Hub 2, released in April 2023.

## Features

- Support for displaying the Temperature and Humidity detected from the SwitchBot Hub into HomeKit/Homebridge

## Limitations

I don't plan to support this long term, just until the [Homebridge-SwitchBot Plugin](https://github.com/OpenWonderLabs/homebridge-switchbot) is updated to add this functionality. I hacked this together in a couple hours. I'll add a note to the top of plugin's README.md when this is added to that plugin at which point I'll archive this repo.
