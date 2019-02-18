/**
 * Helpers for various tasks
 */

// Dependencies
const crypto = require('crypto');
const config = require('./config');
const https = require('https');
const querystring = require('querystring');

let helpers = {};

// Create a SHA256 hash
helpers.hash = (stringToHash) => {
  if (typeof (stringToHash) == 'string' && stringToHash.length > 0) {
    let hash = crypto.createHmac('sha256', config.hashingSecret).update(stringToHash).digest('hex');
    return hash;
  } else {
    return false;
  }
};

helpers.parseJSONToObject = (jsonString) => {
  try {
    let obj = JSON.parse(jsonString);
    return obj;
  } catch (e) {
    return {};
  }
};

helpers.createRandomString = (lenghtOfString) => {
  lenghtOfString = typeof (lenghtOfString) == 'number' && lenghtOfString > 0 ? lenghtOfString : false;
  if (lenghtOfString) {
    const possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let str = '';
    for (let i = 1; i <= lenghtOfString; i++) {
      let rnd = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
      str += rnd;
    }
    console.log(str);
    return str;
  } else {
    return false;
  }
};

// Send sms with Twilio

helpers.sendTwilioSms = (phone, msg, callback) => {
  phone = typeof (phone) == 'string' && phone.trim().length == 10 ? phone.trim() : false;
  msg = typeof (msg) == 'string' && msg.trim().length > 0 && msg.trim().length <= 1600 ? msg.trim() : false;
  if (phone && msg) {
    // Setup the request body and data
    let payload = {
      'From': config.twilio.fromPhone,
      'To': '+39' + phone,
      'Body': msg
    };
    let stringPayload = querystring.stringify(payload);
    let requestDetails = {
      'protocol': 'https:',
      'hostname': 'api.twilio.com',
      'method': 'POST',
      'path': `/2010-04-01/Accounts/${config.twilio.accountSid}/Messages.json`,
      'auth': `${config.twilio.accountSid}:${config.twilio.authToken}`,
      'headers': {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Lenght': Buffer.byteLength(stringPayload)
      }
    };
    // Setup the actual request
    let req = https.request(requestDetails, res => {
      let status = res.statusCode;
      if (status == 200 || status == 201) {
        callback(false);
      } else {
        callback(`Status code returned was: ${status}`);
      }
    });
    req.on('error', e => {
      callback(e);
    });
    req.write(stringPayload);
    req.end();
  } else {
    callback('Given parameters were missing or invalid');
  }
};

module.exports = helpers;