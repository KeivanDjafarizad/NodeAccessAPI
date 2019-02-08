/**
 * Primary file for API
 *
 */

//  Dependencies
const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./lib/config');
const handlers = require('./lib/handlers');
const helpers = require('./lib/helpers');

// Instantiating HTTP Server
const httpServer = http.createServer((req, res) => {
  serverLogic(req, res);
});

// Start HTTP Server and the listening
httpServer.listen(config.httpPort, () => {
  console.log(
    `The server is listening on port ${config.httpPort}, in ${
      config.envName
    } mode...\n`
  );
});

// Instantiating HTTPS Server
const httpsServerOptions = {
  key: fs.readFileSync('./https/key.pem'),
  cert: fs.readFileSync('./https/cert.pem')
};
const httpsServer = https.createServer(httpsServerOptions, (req, res) => {
  serverLogic(req, res);
});

// Start HTTPS Server and the listening
httpsServer.listen(config.httpsPort, () => {
  console.log(
    `The server is listening on port ${config.httpsPort}, in ${
      config.envName
    } mode...\n`
  );
});

// Server Logic
const serverLogic = function (req, res) {
  // Get Url and parse
  const parsedUrl = url.parse(req.url, true);

  // Get Path
  let path = parsedUrl.pathname;
  let trimmedPath = path.replace(/^\/+|\/+$/g, '');

  // Get the query string as an object
  let queryStringObject = parsedUrl.query;

  // Get HTTP Method
  const method = req.method.toLowerCase();

  // Get headers as an object
  const headers = req.headers;

  // Get the payload, if any
  const decoder = new StringDecoder('utf-8');
  let buffer = '';
  req.on('data', data => {
    buffer += decoder.write(data);
  });
  req.on('end', () => {
    buffer += decoder.end();

    // Choose handler this request goes to, if not found go with not found
    const choseHandler =
      typeof router[trimmedPath] !== 'undefined' ?
      router[trimmedPath] :
      handlers.notFound;

    // Construct the data object to send to the handler
    let data = {
      trimmedPath: trimmedPath,
      queryStringObject: queryStringObject,
      method: method,
      headers: headers,
      payload: helpers.parseJSONToObject(buffer)
    };

    // Route the request
    choseHandler(data, (statusCode, payload) => {
      // Use the status code called back by the handler, or default to 200
      statusCode = typeof statusCode == 'number' ? statusCode : 200;
      // Use the payload called back by the hanlder or default to an empty object
      payload = typeof payload == 'object' ? payload : {};
      // Convert payload to string
      let payloadString = JSON.stringify(payload);
      // Return the response
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(statusCode);
      res.end(payloadString);
      // Log Path
      console.log(`Returning this response: ${statusCode},${payloadString}`);
    });
  });
};

// Define a request router
const router = {
  ping: handlers.pings,
  users: handlers.users,
  tokens: handlers.tokens,
  checks: handlers.checks
};