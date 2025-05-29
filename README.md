# Passport-Fast-JWT

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

A [Passport](http://passportjs.org/) strategy for authenticating with JSON Web tokens using [fast-jwt](https://www.npmjs.com/package/fast-jwt) library.

This module takes inspiration from widely used [passport-jwt](https://www.npmjs.com/package/passport-jwt) by [Mike Nicholson](https://github.com/mikenicholson). Main difference is that this is written entirely in TypeScript, relies on using [fast-jwt](https://www.npmjs.com/package/fast-jwt) instead of [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) and most of all, thanks to fast-jwt, supports verifying tokens signed with EdDSA algorithm. Later I might change this so that you can pass in a JWT verifier created with any library, but for now only verifiers created with fast-jwt is supported and tested.

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

## Usage

The first argument is a JWT verifier function created with fast-jwt `createVerifier` or alternatively options to be used when creating one. If the options are passed, the strategy creates a verifier function using `fast-jwt` with the given options. You can read more about verifier options from [fast-jwt docs](https://github.com/nearform/fast-jwt?tab=readme-ov-file#createverifier).

```typescript
type ConstructionArgumentss = [
  VerifierOptions | Verifier,
  TokenExtractor,
  AfterVerifyCallback,
]

type VerifierOptions = FastJWT.VerifierOptions & {
  key?:
    | string
    | Buffer
    | ((DecodedJwt: FastJWT.DecodedJwt) => Promise<string | Buffer>)
}

type Verifier =
  | typeof FastJWT.VerifierSync
  | ((token: string | Buffer) => Promise<any>)

type TokenExtractor = (request: Express.Request) => string | undefined | null

type AfterVerifyCallback = (
  sections: FastJWT.DecodedJwt,
  doneAuth: Passport.AuthenticateCallback,
  request?: Express.Request,
) => void
```

```typescript
const jwtVerifier = FastJWT.createVerifier({ ...verifierOptions })
const tokenExtractor = Extractors.fromHeader("token-header")

passport.use(
  new JwtStrategy(jwtVerifier, tokenExtractor, (sections, done, req) => {
    User.findOne({ id: sections.payload.sub }, (error, user) => {
      if (error) {
        return done(err, false)
      }
      if (!user) {
        return done(null, false, "User not found", 404)
      }
      return done(null, user)
    })
  }),
)
// *-----------* OR *-----------*
const verifierOptions = { key: async () => "secret", cache: true }
const tokenExtractor1 = Extractors.fromHeader("token-header")
const tokenExtractor2 = Extractors.fromAuthHeaderWithScheme(
  "x-authorization",
  "x-bearer",
)

const tokenExtractors = fromExtractors([tokenExtractor1, tokenExtractor2])

passport.use(
  new JwtStrategy(verifierOptions, tokenExtractors, (sections, done, req) => {
    User.findOne({ id: sections.payload.sub }, (error, user) => {
      if (error) {
        return done(err, false)
      }
      if (!user) {
        return done(null, false, "User not found", 404)
      }
      return done(null, user)
    })
  }),
)
```

### Fast-JWT createVerifier options

All [Fast-JWT verifier options](https://github.com/nearform/fast-jwt?tab=readme-ov-file#createverifier) can be passed as the `fastJwtOptions`. However, all options combinations haven't been tested yet, so proceed with caution. If you find any problems with some options, please raise an issue.

### Verification callback

Verification callback is the callback function that is called after successful JSON Web Token verification. JWT token sections and a special authentication function, usually called `done`, are passed into it after succesful JWT verification. Sections are the JWT `header`, `payload`, `signature` and `input`, the original token as a string or alternatively just the JWT payload, if verifier is created with the option `{ complete: false }`. Done is function that calls the underlying passport `success`, `fail` and `error` methods depending on its arguments.

```typescript
passport.use(
  new JwtStrategy(jwtVerifier, tokenExtractor, (sections, done) => {
    User.findOne({ id: sections.payload.sub }, (error, user) => {
      if (error) {
        // error is passed --> passport error is called and errs the authentication
        return done(err, false)
      }
      if (!user) {
        // error is null and user is falsy --> passport fail is called and fails the authentication.
        // Note error must not be passed in this case!
        // Additional parameters can be passed as the info and status
        return done(null, false, "User not found", 404)
      }

      // User object is passed and error is null --> passport success is called
      // and user object is assigned into Express.user and user is authenticated
      return done(null, user)
    })
  }),
)
```

## Error handling

Like any other strategy, this also passes any internal error happening in the strategy, practically any error happening during the JWT verification, directly into the Express next function. If you like to have more control over this you can wrap the strategy into a custom middleware function

```typescript
someRouter.use("/someRoute", (req, res, next) =>
  passport.authenticate(
    "jwt",
    { session: false },
    (err: any, user: Express.User, info: any) => {
      if (err) {
        console.log("Error happened, need to do something to it")
        next(err)
      }
    },
  )(req, res, next),
)
```

## Support

Currently there's quite limited support for Fast-JWT features. As of writing this I have tested only some features.

A non-comprehensive list of supported and non-supported Fast-JWT features:

- No support for fast-jwt callback style verifier

## Secret Keys

Fast-JWT accepts the signing and verifying keys only in PEM format unless you are using secret key as a string. You can create some with `openssl`:

**RSA**

```bash
openssl genpkey -algorithm rsa -out private.pem && openssl pkey -in private.pem -pubout -out public.pem
```

**EdDSA**

```bash
openssl genpkey -algorithm ed25519 -out private.pem && openssl pkey -in private.pem -pubout -out public.pem
```

## License

The [MIT License](http://opensource.org/licenses/MIT)

Copyright (c) 2024 Timo Mätäsaho
