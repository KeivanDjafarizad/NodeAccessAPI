# HTTPS Requirements

You need to set up two keyes for https support. The best way, in a test environment, is to use OpenSSL, with the following command:

```
openssl req -newkey rsa:2048 -new -nodes -x509 -days 3650 -keyout key.pem -out cert.pem

```
