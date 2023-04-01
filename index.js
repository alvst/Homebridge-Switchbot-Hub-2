let Service, Characteristic;
const packageJson = require('./package.json');
const cypto = require('crypto');
const http = require('http');

module.exports = function (homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory(
    'homebridge-switchbot-hub-2',
    'HumiditySensor',
    HumiditySensor
  );

  homebridge.registerAccessory(
    'homebridge-switchbot-hub-2',
    'TemperatureSensor',
    TemperatureSensor
  );
};

function HumiditySensor(log, config) {
  this.log = log;
  this.name = config.name;
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

  getServices: function () {
    this.informationService = new Service.AccessoryInformation();
    this.informationService
      .setCharacteristic(Characteristic.Manufacturer, this.manufacturer)
      .setCharacteristic(Characteristic.Model, this.model)
      .setCharacteristic(Characteristic.SerialNumber, this.serial)
      .setCharacteristic(Characteristic.FirmwareRevision, this.firmware);

    this.informationService.setCharacteristic(
      Characteristic.CurrentRelativeHumidity
    ),
      onGet(this.getCurrentRelativeHumidity.bind(this));

    return [this.informationService, this.service];
  },
};

function TemperatureSensor(log, config) {
  this.log = log;
  this.name = config.name;
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
      .onGet(this.getCurrentTemperature.bind(this));

    return [this.informationService, this.service];
  },
};
