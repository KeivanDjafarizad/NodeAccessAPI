/**
 * Create and export configuration variables
 */

//  General container for environments
const environments = {};

// Staging (default) environment
environments.staging = {
  httpPort: 3000,
  httpsPort: 3001,
  envName: 'staging',
  hashingSecret: 'testSecretMate',
  maxChecks: 5,
  twilio: {
    accountSid: '',
    authToken: '',
    fromPhone: ''
  }
};

// Production environment
environments.production = {
  httpPort: 5000,
  httpsPort: 5001,
  envName: 'production',
  hashingSecret: 'testSecretMateDude',
  maxChecks: 5,
  twilio: {
    accountSid: '',
    authToken: '',
    fromPhone: ''
  }
};

// Logic of export in CLI
const currentEnv = typeof (process.env.NODE_ENV) === 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// Current Environment exists
const environmentToExport = typeof (environments[currentEnv]) === 'object' ? environments[currentEnv] : environments.staging;

// Export module

// eslint-disable-next-line eol-last
module.exports = environmentToExport;