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

  output = {};
  newRefresh = false;
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
  this.runAgain = true;
  this.degreeUnits = config.degreeUnits || 0;
  this.previousTemperature = 0;

  this.service = new Service.TemperatureSensor(this.name);

  const getTemperaturePeriodically = () => {
    this.getTemperature.bind(this);

    if (this.runAgain === true) {
      this.debugLog(`Checking data again in ${this.minInterval}`);
      setTimeout(getTemperaturePeriodically, this.minInterval);
    } else {
      this.errorLog('Not running again. DeviceId not found');
    }
  };

  getTemperaturePeriodically.call(this);
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
    this.log('Get Temperature');
    callback(null, this.previousTemperature);

    return new Promise((resolve, reject) => {
      this.debugLog('Getting current data from SwitchBot API');

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
          output = response;
          newRefresh = true;
          this.debugLog('Update available. Refreshing data.');
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
        this.runAgain = false;
        return;
      }

      this.debugLog(`Current temperature is ${response.body.temperature}`);
      this.service
        .getCharacteristic(Characteristic.CurrentTemperature)
        .updateValue(response.body.temperature);

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

    // Needed
    this.service
      .getCharacteristic(Characteristic.TemperatureDisplayUnits)
      .updateValue(this.degreeUnits);

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
  this.runAgain = true;
  this.previousHumidity = 0;

  this.service = new Service.HumiditySensor(this.name);

  const getHumidityPeriodically = () => {
    this.getHumidity.bind(this)();

    setTimeout(getHumidityPeriodically, 5000);
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

  getHumidity: function () {
    if (this.runAgain && newRefresh) {
      this.debugLog('Getting current relative humidity');
      this.previousHumidity = output.body.humidity;

      this.debugLog(`Current humidity is ${output.body.humidity}`);
      this.service
        .getCharacteristic(Characteristic.CurrentRelativeHumidity)
        .updateValue(output.body.humidity);
      newRefresh = false;
    } else {
      if (Object.keys(output).length === 0) {
        this.debugLog('No Data');
      } else {
        this.debugLog('No New Data');
        this.service
          .getCharacteristic(Characteristic.CurrentRelativeHumidity)
          .updateValue(previousHumidity);
      }
    }
    return;
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
