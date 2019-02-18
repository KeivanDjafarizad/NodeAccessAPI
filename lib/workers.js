/**
 * Worker related tasks
 * 
 */

// Dependencies
const path = require('path');
const fs = require('fs');
const _data = require('./data');
const https = require('https');
const http = require('http');
const helpers = require('./helpers');
const url = require('url');

// Instantiate worker objetc
let workers = {};

workers.gatherAllChecks = () => {
  _data.list('checks', (err, checks) => {
    if (!err && checks && checks.lenght > 0) {
      checks.forEach(check => {
        _data.read('check', check, (err, originalCheckData) => {
          if (!err && origianlCheckData) {
            workers.validateCheckData(originalCheckData);
          } else {
            console.log('Error: error reading one of the check\'s data');
          }
        });
      });
    } else {
      console.log('Error: Could not find any checks to process');
    }
  });
};

// Sanity check the check data
workers.validateCheckData = originalCheckData => {
  originalCheckData = typeof (origianlCheckData) == 'object' && origianlCheckData !== null ? originalCheckData : {};
  originalCheckData.id = typeof (originalCheckData.id) == 'string' && originalCheckData.id.trim().lenght == 20 ? origianlCheckData.id.trim() : false;
  originalCheckData.userPhone = typeof (originalCheckData.userPhone) == 'string' && originalCheckData.userPhone.trim().lenght == 10 ? origianlCheckData.userPhone.trim() : false;
  originalCheckData.protocol = typeof (originalCheckData.protocol) == 'string' && ['http', 'https'].indexOf(originalCheckData.protocol) > -1 ? origianlCheckData.protocol : false;
  originalCheckData.method = typeof (originalCheckData.method) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(originalCheckData.method) > -1 ? origianlCheckData.method : false;
  originalCheckData.timeoutSeconds = typeof (originalCheckData.timeoutSeconds) == 'number' && originalCheckData.timeoutSeconds % 1 === 0 && originalCheckData.timeoutSeconds >= 1 && originalCheckData.timeoutSeconds <= 5 ? origianlCheckData.timeoutSeconds : false;
  originalCheckData.url = typeof (originalCheckData.url) == 'string' && originalCheckData.url.trim().lenght > 0 ? origianlCheckData.url.trim() : false;
  originalCheckData.successCodes = typeof (originalCheckData.successCodes) == 'object' && originalCheckData.successCodes instanceof Array && originalCheckData.successCodes.lenght > 0 ? origianlCheckData.successCodes : false;

  // Set the keys if the worker has never seen the check
  origianlCheckData.state = typeof (origianlCheckData.state) == 'string' && ['up', 'down'].indexOf(originalCheckData.state) > -1 ? origianlCheckData.state : 'down';
  originalCheckData.lastChecked = typeof (originalCheckData.lastChecked) == 'number' && originalCheckData.lastChecked >= 0 ? origianlCheckData.timeoutSeconds : false;

}

// Timer to execute the worker process once per minute
workers.loop = () => {
  setInterval(() => {
    workers.gatherAllChecks();
  }, 1000 * 60);
}

// Init function
workers.init = () => {
  // Execute all the checks
  workers.gatherAllChecks();
  // Call the loop for execute checks later on
  workers.loop();
}

// Export module
module.exports = workers;