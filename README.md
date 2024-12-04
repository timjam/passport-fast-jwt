# Passport-Fast-JWT

A [Passport](http://passportjs.org/) strategy for authenticating with JSON Web token using [fast-jwt](https://www.npmjs.com/package/fast-jwt) library.

This module relies heavily on widely used [passport-jwt](https://www.npmjs.com/package/passport-jwt) by [Mike Nicholson](https://github.com/mikenicholson), so there are many similarities. Main difference is that this is written entirely in TypeScript, uses [fast-jwt](https://www.npmjs.com/package/fast-jwt) instead of [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) and most of all, thanks to fast-jwt, supports verifying tokens signed with EdDSA algorithm.

## Install

```bash
npm install --save passport-fast-jwt
```

```bash
pnpm add passport-fast-jwt
```

```bash
yarn add passport-fast-jwt
```

## Testing

### Keys

Fast-JWT accepts the signing and verifying keys only in PEM format. You need RSA and EdDSA key pairs for the tests to pass. You can create them by running these commands at the project root:

**RSA**

```bash
openssl genpkey -algorithm rsa -out ./test/testKeys/rsa_no_pass.pem && openssl pkey -in ./test/testKeys/rsa_no_pass.pem -pubout -out ./test/testKeys/rsa_no_pass_pub.pem
```

**EdDSA**

```bash
openssl genpkey -algorithm ed25519 -out ./test/testKeys/eddsa_no_pass.pem && openssl pkey -in ./test/testKeys/eddsa_no_pass.pem -pubout -out ./test/testKeys/eddsa_no_pass_pub.pem
```

## License

The [MIT License](http://opensource.org/licenses/MIT)

Copyright (c) 2024 Timo Mätäsaho
