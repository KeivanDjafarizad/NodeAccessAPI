/**
 * Helpers for various tasks
 */

// Dependencies
const crypto = require('crypto');
const config = require('./config')

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

module.exports = helpers;