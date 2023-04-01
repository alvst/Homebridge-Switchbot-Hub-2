let Service, Characteristic;
const packageJson = require('./package.json');
const cypto = require('crypto');
const http = require('http');

module.exports = function (homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory(
    'homebridge-switchbot-hub-2',
    'Humidity Sensor',
    HumiditySensor
  );

  homebridge.registerAccessory(
    'homebridge-switchbot-hub-2',
    'Temperature Sensor',
    TemperatureSensor
  );
};

function HumiditySensor(log, config) {
  this.log = log;
  this.name = config.name;
  this.token = config.token;
  this.secret = config.secret;
  this.hubId = config.deviceId;

  this.service = new Service.HumiditySensor(this.name);

  console.log('HumiditySensor', this.name);
  return;
}

HumiditySensor.prototype = {
  identify: function (callback) {
    this.log('Identify requested!');
    callback();
  },

  debugLog(message) {
    if (this.debug) {
      this.log.warn(`[DEBUG] ${message}`);
    }
  },

  getCurrentRelativeHumidity: function (callback) {
    this.debugLog('Getting current relative humidity');

    const body = JSON.stringify({
      command: 'turnOn',
      parameter: 'default',
      commandType: 'command',
    });

    const options = {
      hostname: 'api.switch-bot.com',
      port: 443,
      path: `/v1.1/devices/${this.deviceId}/status`,
      method: 'GET',
      headers: {
        Authorization: token,
        sign: sign,
        nonce: nonce,
        t: t,
        'Content-Type': 'application/json',
        'Content-Length': body.length,
      },
    };

    const req = https.request(options, (res) => {
      console.log(`statusCode: ${res.statusCode}`);
      res.on('data', (d) => {
        const response = JSON.parse(d); // Parse the JSON string
        console.log(response); // Access the "myObject" property of the response object
        console.log(response.body.humidity); // Access the "myObject" property of the response object
        console.log(response.body.temperature); // Access the "myObject" property of the response object
      });
    });

    req.on('error', (error) => {
      console.error(error);
    });

    req.write(body);

    req.end();

    callback(null, this.humidity);
  },

  getServices: function () {
    this.informationService = new Service.AccessoryInformation();
    this.informationService
      .setCharacteristic(Characteristic.Manufacturer, this.manufacturer)
      .setCharacteristic(Characteristic.Model, this.model)
      .setCharacteristic(Characteristic.SerialNumber, this.serial)
      .setCharacteristic(Characteristic.FirmwareRevision, this.firmware);

    this.informationService
      .setCharacteristic(Characteristic.CurrentRelativeHumidity)
      .on('get', this.getCurrentRelativeHumidity.bind(this));

    return [this.informationService, this.service];
  },
};

function TemperatureSensor(log, config) {
  this.log = log;
  this.name = config.name;
  this.token = config.token;
  this.secret = config.secret;
  this.hubId = config.deviceId;

  this.service = new Service.TemperatureSensor(this.name);
}

TemperatureSensor.prototype = {
  identify: function (callback) {
    this.log('Identify requested!');
    callback();
  },

  debugLog(message) {
    if (this.debug) {
      this.log.warn(`[DEBUG] ${message}`);
    }
  },

  getServices: function () {
    this.informationService = new Service.AccessoryInformation();
    this.informationService
      .setCharacteristic(Characteristic.Manufacturer, this.manufacturer)
      .setCharacteristic(Characteristic.Model, this.model)
      .setCharacteristic(Characteristic.SerialNumber, this.serial)
      .setCharacteristic(Characteristic.FirmwareRevision, this.firmware);

    this.informationService
      .getCharacteristic(Characteristic.CurrentTemperature)
      .on('get', this.getCurrentTemperature.bind(this));

    return [this.informationService, this.service];
  },
};
