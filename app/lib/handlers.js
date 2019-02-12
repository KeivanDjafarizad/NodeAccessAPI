/**
 * Request Handlers
 * TODO: Refactoring needed for handlers and subhandlers
 */

// Dependencies
const _data = require('./data');
const helpers = require('./helpers');
const config = require('./config');

// Define handlers
let handlers = {};

// Users hanlder
handlers.users = (data, callback) => {
  const acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._users[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Tokens Handlers
handlers.tokens = (data, callback) => {
  const acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._tokens[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Checks Handlers
handlers.checks = (data, callback) => {
  const acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._checks[data.method](data, callback);
  } else {
    callback(405);
  }
};

/**
 * Container for user submethods
 */

handlers._users = {};

// Users - post
// Required: firstName, lastName, phone, password, tosAgreement
// Optional: none
handlers._users.post = (data, callback) => {
  // Check required fields are filled
  let firstName = typeof (data.payload.firstName) == 'string' && data.payload.firstName.length > 0 ? data.payload.firstName : false;
  let lastName = typeof (data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
  let phone = typeof (data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
  let password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  let tosAgreement = data.payload.tosAgreement === true ? true : false;

  if (firstName && lastName && phone && password && tosAgreement) {
    // Check if the user exist
    _data.read('users', phone, (err, data) => {
      if (err) {
        let hashedPassword = helpers.hash(password);
        if (hashedPassword) {
          // Create user object
          let userObject = {
            'firstName': firstName,
            'lastName': lastName,
            'phone': phone,
            'hashedPassword': hashedPassword,
            'tosAgreement': true
          }

          // Store the user
          _data.create('users', phone, userObject, (err) => {
            if (!err) {
              callback(200);
            } else {
              callback(500, {
                'Error': 'Could not create new user'
              });
            }
          });
        } else {
          callback(500, {
            'Error': 'Could not hash the user\'s password'
          })
        }
      } else {
        callback(400, {
          'Error': 'A user with that phone number already exists'
        });
      }
    });
  } else {
    callback(400, {
      'Error': 'Missing required field/s'
    });
  }
};

// Users - get
// Required: phone
// Optional: none
handlers._users.get = (data, callback) => {
  // Check the phone number validity
  let phone = typeof (data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
  let token = typeof (data.headers.token) == 'string' ? data.headers.token : false;

  if (phone) {
    handlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
      if (tokenIsValid) {
        _data.read('users', phone, (err, data) => {
          if (!err && data) {
            // Remove hashed password from user obj befor returning
            delete data.hashedPassword;
            callback(200, data);
          } else {
            callback(404);
          }
        });
      } else {
        callback(403, {
          'Error': 'Missing required token in header, or token is invalid or expired '
        });
      }
    });
  } else {
    callback(400, {
      'Error': 'Missing required field'
    });
  }
};

// Users - put
// Required:  phone
// Optional: firstName, lastName, password (at least one specified)
handlers._users.put = (data, callback) => {
  let phone = typeof (data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
  let firstName = typeof (data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
  let lastName = typeof (data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
  let password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

  let token = typeof (data.headers.token) == 'string' ? data.headers.token : false;

  if (phone) {
    handlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
      if (tokenIsValid) {
        if (firstName || lastName || password) {
          _data.read('users', phone, (err, userData) => {
            if (!err && data) {
              // Create updated info
              if (firstName) {
                userData.firstName = firstName;
              }
              if (lastName) {
                userData.lastName = lastName;
              }
              if (password) {
                userData.hashedPassword = helpers.hash(password);
              }
              // Store updated info
              _data.update('users', phone, userData, (err) => {
                if (!err) {
                  callback(200);
                } else {
                  callback(500, {
                    'Error': 'Could not update the user info'
                  });
                }
              });
            } else {
              callback(400, {
                'Error': 'The specified user does not exist'
              });
            }
          });
        } else {
          callback(400, {
            'Warning': 'No field to update'
          });
        }
      } else {
        callback(403, {
          'Error': 'Missing required token in header, or token is invalid or expired '
        });
      }
    });
  } else {
    callback(400, {
      'Error': 'Missing required field'
    });
  }
};

// Users - delete
// Required: phone
// TODO: Delete any other data files associated with this user
handlers._users.delete = (data, callback) => {
  // Check phone number valid
  let phone = typeof (data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
  let token = typeof (data.headers.token) == 'string' ? data.headers.token : false;

  if (phone) {
    handlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
      if (tokenIsValid) {
        _data.read('users', phone, (err, data) => {
          if (!err && data) {
            _data.delete('users', phone, (err) => {
              if (!err) {
                callback(200);
              } else {
                callback(500, {
                  'Error': 'Could not delete specified user'
                });
              }
            });
          } else {
            callback(400, {
              'Error': 'Could not find specified user'
            });
          }
        });
      } else {
        callback(403, {
          'Error': 'Missing required token in header, or token is invalid or expired '
        });
      }
    });
  } else {
    callback(400, {
      'Error': 'Missing required field'
    });
  }
};



/**
 * Containers for token subhandlers
 */
handlers._tokens = {};

// Check validity of id for a given user
handlers._tokens.verifyToken = (id, phone, callback) => {
  _data.read('tokens', id, (err, tokenData) => {
    if (!err && tokenData) {
      if (tokenData.phone === phone && tokenData.expires > Date.now()) {
        callback(true);
      } else {
        callback(false);
      }
    } else {
      callback(false);
    }
  });
};

/**
 * Tokens - Post
 * Required: phone, password
 */
handlers._tokens.post = (data, callback) => {
  let phone = typeof (data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
  let password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  if (phone && password) {
    // Look up the user who match the phone number
    _data.read('users', phone, (err, userData) => {
      if (!err && userData) {
        let hashedPassword = helpers.hash(password);
        if (hashedPassword == userData.hashedPassword) {
          // If user is valid create new token with 1hour expiration date
          tokenId = helpers.createRandomString(20);
          expires = Date.now() + 1000 * 60 * 60;
          let tokenObject = {
            'phone': phone,
            'id': tokenId,
            'expires': expires
          }

          // Store the token
          _data.create('tokens', tokenId, tokenObject, (err) => {
            if (!err) {
              callback(200, tokenObject);
            } else {
              callback(500, {
                'Error': 'Could not create new token'
              });
            }
          });
        } else {
          callback(400, {
            'Error': 'The password is wrong'
          });
        }
      } else {
        callback(400, {
          'Error': 'Could not find specified user'
        });
      }
    });
  } else {
    callback(400, {
      'Error': 'Missing required fields'
    });
  }
}

/**
 * Tokens - get
 * Required: id
 * Optional: none
 */
handlers._tokens.get = (data, callback) => {
  // Check the id
  let id = typeof (data.queryStringObject.id) == 'string' ? data.queryStringObject.id : false;

  if (id) {
    _data.read('tokens', id, (err, tokenData) => {
      if (!err && tokenData) {
        callback(200, tokenData);
      } else {
        callback(404);
      }
    });
  } else {
    callback(400, {
      'Error': 'Missing required field'
    });
  }
}

/**
 * Tokens - put
 * Required: id, extend
 * Optional: none
 */
handlers._tokens.put = (data, callback) => {
  let id = typeof (data.payload.id) == 'string' && data.payload.id.length == 20 ? data.payload.id : false;
  let extend = typeof (data.payload.extend) == 'boolean' && data.payload.extend == true ? true : false;

  if (id && extend) {
    _data.read('tokens', id, (err, tokenData) => {
      if (!err && tokenData) {
        if (tokenData.expires > Date.now()) {
          tokenData.expires = Date.now() + 1000 * 60 * 60;
          _data.update('tokens', id, tokenData, (err) => {
            if (!err) {
              callback(200);
            } else {
              callback(500, {
                'Error': 'Could not extend the token expiration'
              });
            }
          });
        } else {
          callback(400, {
            'Error': 'Token expired'
          });
        }
      } else {
        callback(400, {
          'Error': 'Specified Token does not exists'
        });
      }
    });
  } else {
    callback(400, {
      'Error': 'Missing required fields or fields are invalid'
    });
  }
}

/**
 * Tokens - delete
 * Required: id
 * Optional: none
 */
handlers._tokens.delete = (data, callback) => {
  let id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.length == 20 ? data.queryStringObject.id : false;

  if (id) {
    _data.read('tokens', id, (err, data) => {
      if (!err && data) {
        _data.delete('tokens', id, (err) => {
          if (!err) {
            callback(200);
          } else {
            callback(500, {
              'Error': 'Could not delete specified token'
            });
          }
        });
      } else {
        callback(400, {
          'Error': 'Could not find specified token'
        });
      }
    });
  } else {
    callback(400, {
      'Error': 'Missing required field'
    });
  }
}

/**
 * Container for checks submethod
 */

handlers._checks = {};

/**
 * Checks - post
 * Requried: protocol, url, method, sucessCodes, timeoutSeconds
 * Optional: none
 */
handlers._checks.post = (data, callback) => {
  let protocol = typeof (data.payload.protocol) == 'string' && ['https', 'http'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
  let method = typeof (data.payload.method) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
  let url = typeof (data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
  let timeoutSeconds = typeof (data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;
  let successCodes = typeof (data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;

  if (protocol && url && method && timeoutSeconds && successCodes) {
    let token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
    _data.read('tokens', token, (err, tokenData) => {
      if (!err && tokenData) {
        let userPhone = tokenData.phone;

        _data.read('users', userPhone, (err, userData) => {
          if (!err && userData) {
            let userChecks = typeof (userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
            if (userChecks.length < config.maxChecks) {
              // Create random id for the check
              let checkId = helpers.createRandomString(20);

              let checkObject = {
                id: checkId,
                userPhone,
                protocol,
                url,
                method,
                successCodes,
                timeoutSeconds
              };
              _data.create('checks', checkId, checkObject, (err) => {
                if (!err) {
                  // Add check Id to the user's object
                  userData.checks = userChecks;
                  userData.checks.push(checkId);

                  //Save new user data
                  _data.update('users', userPhone, userData, (err) => {
                    if (!err) {
                      callback(200, checkObject);
                    } else {
                      callback(500, {
                        'Error': 'Could not update the user with the new check'
                      });
                    }
                  });
                } else {
                  callback(500, {
                    'Error': 'Could not create new check'
                  });
                }
              });
            } else {
              callback(400, {
                'Error': `The user already has the maximum number of checks, {${config.maxChecks}}`
              })
            }
          } else {
            callback(403, {
              'Error': 'Invalid data read on Users'
            });
          }
        });
      } else {
        callback(403, {
          'Error': 'Invalid data read on Tokens'
        });
      }
    });
  } else {
    callback(400, {
      'Error': 'Missing required inputs, or inputs are invalid'
    });
  }
};

/**
 * Checks - get
 * Requried: checkId
 * Optional: none
 */
handlers._checks.get = (data, callback) => {
  let id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
  if (id) {
    _data.read('checks', id, (err, checkData) => {
      if (!err && checkData) {
        let token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
        handlers._tokens.verifyToken(token, checkData.userPhone, (tokenIsValid) => {
          if (tokenIsValid) {
            callback(200, checkData);
          } else {
            callback(403);
          }
        });
      } else {
        callback(404);
      }
    });
  } else {
    callback(400, {
      'Error': 'Missing required field'
    });
  }
};

/**
 * Checks - put
 * Requried: id
 * Optional: protocol, url, method, sucessCodes, timeoutSeconds (one must be sent)
 */
handlers._checks.put = (data, callback) => {
  let id = typeof (data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;

  let protocol = typeof (data.payload.protocol) == 'string' && ['https', 'http'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
  let method = typeof (data.payload.method) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
  let url = typeof (data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
  let timeoutSeconds = typeof (data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;
  let successCodes = typeof (data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;

  if (id) {
    if (protocol || url || method || successCodes || timeoutSeconds) {
      _data.read('checks', id, (err, checkData) => {
        if (!err && checkData) {
          let token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
          handlers._tokens.verifyToken(token, checkData.userPhone, (tokenIsValid) => {
            if (tokenIsValid) {
              if (protocol) {
                checkData.protocol = protocol;
              }
              if (url) {
                checkData.url = url;
              }
              if (method) {
                checkData.method = method;
              }
              if (successCodes) {
                checkData.successCodes = successCodes;
              }
              if (timeoutSeconds) {
                checkData.timeoutSeconds = timeoutSeconds;
              }
              _data.update('checks', id, checkData, (err) => {
                if (!err) {
                  callback(200);
                } else {
                  callback(500, {
                    'Error': 'Could not update the check'
                  });
                }
              });
            } else {
              callback(403);
            }
          });
        } else {
          callback(400, {
            'Error': 'Check ID do not exist'
          });
        }
      })
    } else {
      callback(400, {
        'Error': 'Missing fields to update'
      });
    }
  } else {
    callback(400, {
      'Error': 'Missing required field'
    });
  }


};

/**
 * Checks - delete
 * Requried: id
 * Optional: none
 */
handlers._checks.delete = (data, callback) => {

};

// Ping handler
handlers.ping = (data, callback) => {
  callback(200);
};

// Not found handler
handlers.notFound = (data, callback) => {
  callback(404);
};

module.exports = handlers;