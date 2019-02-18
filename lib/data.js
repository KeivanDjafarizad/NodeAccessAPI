/**
 * Library for storing and editing data
 */

// Dependencies
const fs = require('fs');
const path = require('path');
const helpers = require('./helpers');

// Container
let lib = {};

// Base directory
lib.basedir = path.join(__dirname, '../.data/');

// Create the file 
lib.create = (dir, file, data, callback) => {
  // Open file for writing
  fs.open(`${lib.basedir}${dir}/${file}.json`, 'wx', (err, fileDescriptor) => {
    if (!err && fileDescriptor) {
      // Convert data to string
      let stringData = JSON.stringify(data);

      // Write to file and close it
      fs.writeFile(fileDescriptor, stringData, (err) => {
        if (!err) {
          // Close the file
          fs.close(fileDescriptor, (err) => {
            if (!err) {
              callback(false);
            } else {
              callback('[Error] Could not close new file!');
            }
          });
        } else {
          callback('[Error] Writing to new file was not possible!');
        }
      });
    } else {
      callback('[Error] Could not create new file, may already exist!');
    }
  });
};

// Read data from a file
lib.read = (dir, file, callback) => {
  fs.readFile(`${lib.basedir}${dir}/${file}.json`, 'utf8', (err, data) => {
    if (!err && data) {
      callback(false, helpers.parseJSONToObject(data));
    } else {
      callback(err, data);
    }
  });
};

// Update data inside file
lib.update = (dir, file, data, callback) => {
  // Open file for writing
  fs.open(`${lib.basedir}${dir}/${file}.json`, 'r+', (err, fileDescriptor) => {
    if (!err && fileDescriptor) {
      let stringData = JSON.stringify(data);

      // Truncate the file
      fs.ftruncate(fileDescriptor, (err) => {
        if (!err) {
          // Write to the file and close it
          fs.writeFile(fileDescriptor, stringData, (err) => {
            if (!err) {
              fs.close(fileDescriptor, (err) => {
                if (!err) {
                  callback(false);
                } else {
                  callback('[Error] Could not close the file')
                }
              });
            } else {
              callback('[Error] Error writing to the existing file');
            }
          });
        } else {
          callback('[Error] Error truncating file');
        }
      });
    } else {
      callback('[Error] Could not open the file for updating, it may not exist yet');
    }
  });
};

// Delete the file
lib.delete = (dir, file, callback) => {
  // Unlink the file
  fs.unlink(`${lib.basedir}${dir}/${file}.json`, (err) => {
    if (!err) {
      callback(false);
    } else {
      callback('[Error] Could not delete the file');
    }
  });
};

lib.list = (dir, callback) => {
  fs.readdir(`${lib.basedir}${dir}/`, (err, data) => {
    if (!err && data && data.length > 0) {
      let trimmedFileNames = [];
      data.forEach(fileName => trimmedFileNames.push(fileName.replace('.json', '')));
      callback(trimmedFileNames);
    } else {
      callback(err, data);
    }
  });
}

// Export
module.exports = lib;