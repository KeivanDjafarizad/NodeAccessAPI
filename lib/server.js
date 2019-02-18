/**
 * Server related tasks
 * 
 */

//  Dependencies
const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./config');
const handlers = require('./handlers');
const helpers = require('./helpers');
const p = require('path');

let server = {};



// Instantiating HTTP Server
server.httpServer = http.createServer((req, res) => {
  serverLogic(req, res);
});

// Instantiating HTTPS Server
server.httpsServerOptions = {
  key: fs.readFileSync(p.join(__dirname, '/../https/key.pem')),
  cert: fs.readFileSync(p.join(__dirname, '/../https/cert.pem'))
};

server.httpsServer = https.createServer(server.httpsServerOptions, (req, res) => {
  server.serverLogic(req, res);
});

// Server Logic
server.serverLogic = function (req, res) {
  // Get Url and parse
  let parsedUrl = url.parse(req.url, true);

  // Get Path
  let path = parsedUrl.pathname;
  let trimmedPath = path.replace(/^\/+|\/+$/g, '');

  // Get the query string as an object
  let queryStringObject = parsedUrl.query;

  // Get HTTP Method
  let method = req.method.toLowerCase();

  // Get headers as an object
  let headers = req.headers;

  // Get the payload, if any
  let decoder = new StringDecoder('utf-8');
  let buffer = '';
  req.on('data', data => {
    buffer += decoder.write(data);
  });
  req.on('end', () => {
    buffer += decoder.end();

    // Choose handler this request goes to, if not found go with not found
    let choseHandler =
      typeof server.router[trimmedPath] !== 'undefined' ?
      server.router[trimmedPath] :
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
server.router = {
  ping: handlers.pings,
  users: handlers.users,
  tokens: handlers.tokens,
  checks: handlers.checks
};

server.init = () => {
  // Start HTTP Server and the listening
  server.httpServer.listen(config.httpPort, () => {
    console.log(
      `The server is listening on port ${config.httpPort}, in ${
      config.envName
    } mode...\n`
    );
  });

  // Start HTTPS Server and the listening
  server.httpsServer.listen(config.httpsPort, () => {
    console.log(
      `The server is listening on port ${config.httpsPort}, in ${
      config.envName
    } mode...\n`
    );
  });
}

module.exports = server;