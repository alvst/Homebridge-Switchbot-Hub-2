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

  homebridge.registerAccessory(
    'homebridge-switchbot-hub-2',
    'Temperature Sensor',
    TemperatureSensor
  );
};

function TemperatureSensor(log, config) {
  this.log = log;
  this.name = config.name;
  this.token = config.token;
  this.secret = config.secret;
  this.deviceId = config.hubId;
  this.configInterval = config.interval || 300000;
  this.minInterval =
    this.configInterval < 120000 ? 120000 : this.configInterval;
  this.debug = config.debug || false;
  console.log(this.minInterval);
  this.runAgain = true;

  this.service = new Service.TemperatureSensor(this.name);

  let result = this.getTemperature.bind(this);

  // const getTemperaturePeriodically = () => {
  //   let result = this.getTemperature.bind(this);

  //   this.errorLog(result);
  //   console.log('here');

  //   if (result != 'error') {
  //     this.debugLog(`Checking temperature again in ${this.minInterval}`);
  //     setTimeout(getTemperaturePeriodically, 15000);
  //   } else {
  //     this.debugLog('Not running again. DeviceId not found');
  //   }
  // };

  // Call the function to start getting humidity periodically
  // getTemperaturePeriodically.call(this);

  this.log('Testing Temperature Sensor');

  return;
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

  errorLog(message) {
    if (this.debug) {
      this.log.error(`[ERROR] ${message}`);
    }
  },

  getTemperature: function (callback) {
    this.debugLog('Checking Temperature');

    callback(null, 0);

    if (!this.runAgain) {
      return new Promise((resolve, reject) => {
        this.debugLog('Getting current temperature');

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
          // this.debugLog(`statusCode: ${res.statusCode}`);
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
            humidity = response.body.humidity;
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
        if (response.statusCode !== 100) {
          if (response.message.includes('no deviceId')) {
            this.errorLog(
              'No deviceId found. Please update your device ID and restart Homebridge.'
            );
          } else {
            this.errorLog(
              `DeviceId: ${this.deviceId} was not found. Please update your device ID and restart Homebridge.`
            );
          }
          console.log('error');
          return false;
        }

        this.debugLog(`Current temperature is ${response.body.temperature}`);
        this.service
          .getCharacteristic(Characteristic.CurrentTemperature)
          .updateValue(response.body.temperature);

        return;
      });
    }

    setTimeout(this.getTemperature, 15000);
  },

  getServices: function () {
    this.informationService = new Service.AccessoryInformation();
    this.informationService
      .setCharacteristic(Characteristic.Manufacturer, this.manufacturer)
      .setCharacteristic(Characteristic.Model, this.model)
      .setCharacteristic(Characteristic.SerialNumber, this.serial)
      .setCharacteristic(Characteristic.FirmwareRevision, this.firmware);

    // Needed
    this.service
      .getCharacteristic(Characteristic.TemperatureDisplayUnits)
      .updateValue(1);

    this.service
      .getCharacteristic(Characteristic.CurrentTemperature)
      .on('get', this.getTemperature.bind(this));

    return [this.informationService, this.service];
  },
};

function HumiditySensor(log, config) {
  this.log = log;
  this.name = config.name;
  this.token = config.token;
  this.secret = config.secret;
  this.deviceId = config.hubId;
  this.configInterval = config.interval || 300000;
  this.minInterval =
    this.configInterval < 120000 ? 120000 : this.configInterval;
  this.debug = config.debug || false;
  console.log(this.minInterval);

  this.service = new Service.HumiditySensor(this.name);

  const getHumidityPeriodically = () => {
    let result = this.getHumidity.bind(this);
    console.log('here');
    console.log(result);
    if (result != 'error') {
      this.debugLog(`Checking humidity again in ${this.minInterval}`);
      setTimeout(getHumidityPeriodically, this.minInterval); // Set timeout to call the function again after 4 seconds
    } else {
      this.debugLog('Not running again. DeviceId not found');
    }
  };

  // Call the function to start getting humidity periodically
  getHumidityPeriodically.call(this);

  this.log('Testing Humidity Sensor');

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

  errorLog(message) {
    if (this.debug) {
      this.log.error(`[ERROR] ${message}`);
    }
  },

  getHumidity: function (callback) {
    this.log('Get Humidity');
    callback(null, 0);

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
        // this.debugLog(`statusCode: ${res.statusCode}`);
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
          // console.log(response);
          humidity = response.body.humidity;
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
      if (response.statusCode !== 100) {
        if (response.message.includes('no deviceId')) {
          this.errorLog(
            'No Device Id found. Please update your device ID and restart Homebridge.'
          );
        } else {
          this.errorLog(
            `DeviceId: ${this.deviceId} was not found. Please update your device ID and restart Homebridge.`
          );
        }

        console.log('error');
        return 'error';
      }

      this.debugLog(`Current temperature is ${response.body.temperature}`);
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

    this.service
      .getCharacteristic(Characteristic.CurrentRelativeHumidity)
      .on('get', this.getHumidity.bind(this));

    return [this.informationService, this.service];
  },
};
