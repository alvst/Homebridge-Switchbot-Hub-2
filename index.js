let Service, Characteristic;
const packageJson = require('./package.json');
const crypto = require('crypto');
const https = require('https');

module.exports = function (homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory(
    'homebridge-switchbot-hub-2',
    'Humidity Sensor',
    HumiditySensor
  );

  // homebridge.registerAccessory(
  //   'homebridge-switchbot-hub-2',
  //   'Temperature Sensor',
  //   TemperatureSensor
  // );
};

function HumiditySensor(log, config) {
  this.log = log;
  this.name = config.name;
  this.token = config.token;
  this.secret = config.secret;
  this.deviceId = config.hubId;
  this.minInterval = config.interval =
    config.interval < 120000 ? 120000 : config.interval;
  this.debug = config.debug || false;
  // this.log(this.deviceId);

  this.service = new Service.HumiditySensor(this.name);

  this.log('HumiditySensor', this.name);

  this.interval = this.minInterval || 300000;

  // Define a function to call getCurrentRelativeHumidity() every 4 seconds
  function getHumidityPeriodically() {
    let result = this.getCurrentRelativeHumidity(); // Call the function
    if (result != 'error')
      setTimeout(getHumidityPeriodically.bind(this), 300000); // Set timeout to call the function again after 4 seconds
  }

  // Call the function to start getting humidity periodically
  getHumidityPeriodically.call(this);

  return;
}

HumiditySensor.prototype = {
  debugLog(message) {
    if (this.debug) {
      this.log.warn(`[DEBUG] ${message}`);
    }
  },

  errorLog(message) {
    if (this.debug) {
      this.log.error(`[Error] ${message}`);
    }
  },

  getCurrentRelativeHumidity: function () {
    this.debugLog('Checking Humidity');

    return new Promise((resolve, reject) => {
      this.debugLog('Getting current relative humidity');

      const t = Date.now();
      const nonce = 'requestID';
      const data = this.token + t + nonce;
      const signTerm = crypto
        .createHmac('sha256', this.secret)
        .update(Buffer.from(data, 'utf-8'))
        .digest();
      const sign = signTerm.toString('base64');

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
          Authorization: this.token,
          sign: sign,
          nonce: nonce,
          t: t,
          'Content-Type': 'application/json',
          'Content-Length': body.length,
        },
      };

      const req = https.request(options, (res) => {
        this.debugLog(`statusCode: ${res.statusCode}`);
        if (res.statusCode != 200) {
          errorLog.log(
            `StatusCode: ${res.statusCode}. Could not create session. Please check your token and secret.`
          );
          reject(res.statusCode);
        }

        let data = '';
        res.on('data', (d) => {
          data += d;
        });
        res.on('end', () => {
          const response = JSON.parse(data);
          console.log(response);
          // console.log(response.body.humidity);
          humidity = response.body.humidity;
          // console.log(response.body.temperature);
          resolve(response);
        });
      });

      req.on('error', (error) => {
        errorLog(error);
        reject(error);
      });

      req.write(body);

      req.end();
    }).then((response) => {
      if (response.statusCode != 200) {
        // this.errorLog(
        //   `StatusCode: ${response.statusCode}. Please check update your device ID and try again`
        // );
        if (response.message.includes('no deviceId')) {
          this.errorLog(
            'No deviceId found. Please update your device ID and restart Homebridge.'
          );
        } else {
          this.errorLog(
            `DeviceId: ${this.deviceId} was not found. Please update your device ID and restart Homebridge.`
          );
        }

        return 'error';
      }

      this.debugLog(`Current relative humidity is ${response.body.humidity}`);
      this.service
        .getCharacteristic(Characteristic.CurrentRelativeHumidity)
        .updateValue(response.body.humidity);

      return;
    });
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
