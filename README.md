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

## Usage

The first argument can be a JWT verifier function created with fast-jwt `createVerifier` or an object of fast-jwt `VerifierOptions`. Currently, if the options are passed, under the hood the middleware always uses the complete as true, so the developer has access to all jwt token sections in the verify callback function. This is also recommended to use when creating the verifier function manually.

```typescript
type StrOptions = {
  tokenExtractor: TokenExtractor
} & (
  | { secretOrKey: string | Buffer; keyFetcher?: undefined }
  | { secretOrKey?: undefined; keyFetcher: FastJWT.KeyFetcher }
)

type JwtSections = FastJWT.DecodedJwt & { input: string }

type AfterVerifiedCallback = (
  jwtSections: JwtSections | FastJWT.DecodedJwt["payload"],
  doneAuth: Passport.AuthenticateCallback,
  request?: Express.Request,
) => void
```

The constructor has two overloads

```typescript
  constructor(
    jwtVerifier: typeof FastJWT.VerifierAsync | typeof FastJWT.VerifierSync,
    strategyOptions: StrOptions,
    afterVerifiedCb: AfterVerifiedCallback,
  )
  constructor(
    fastJwtOptions: Omit<FastJWT.VerifierOptions, "complete">,
    strategyOptions: StrOptions,
    afterVerifiedCb: AfterVerifiedCallback,
  )
```

With options object

```typescript
passport.use(new JwtStrategy(fastJwtOptions, strategyOptions, (sections, done, request) => {
  try {
    const user = wait User.findone({ id: sections.payload.sub })

    // You can also do something with request here, if the passRequestToCallback is set to true

    if (!user) {
      return done(null, false, "User not found", 404)
    }

    return done(null, user)
  } catch (error) {
    return done(error, false)
  }
}))
```

With verifier function

```typescript

const verifier = createVerifier(fastJwtOptions)

passport.use(new JwtStrategy(verifier, strategyOptions, (sections, done, request) => {
  try {
    const user = wait User.findone({ id: sections.payload.sub })

    // You can also do something with request here, if the passRequestToCallback is set to true

    if (!user) {
      return done(null, false, "User not found", 404)
    }

    return done(null, user)
  } catch (error) {
    return done(error, false)
  }
}))
```

### Fast-JWT options

Currently all [Fast-JWT verifier options](https://github.com/nearform/fast-jwt?tab=readme-ov-file#createverifier) except `complete` can be passed as the `fastJwtOptions`. However, all options combinations haven't been tested, so proceed with caution. If you find any problems with some options, please raise an issue.

### Strategy options

| Option                | Type                                                      | Required                                | Description                                                                                                                                                                                                                                                  |
| --------------------- | --------------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| tokenExtractor        | (request: Express.Request) => string \| undefined \| null | required                                | Function to extract the token from the request. There are some predefined token extractors in the module `fromHeader`, `fromBodyField`, `fromQueryParam`, `fromAuthHeaderAsBearerToken (=== fromAuthHeaderWithScheme("bearer"))`, `fromAuthHeaderWithScheme` |
| passRequestToCallback | boolean                                                   | optional                                | Boolean that dictates whether the request object is passed into the verify callback function or not.                                                                                                                                                         |
| secretOrKey           | string \| node.Buffer                                     | required if keyFetcher is not provided  | Secret string or public key to verify the JWT token                                                                                                                                                                                                          |
| keyFetcher            | fastjwt.KeyFetcher                                        | required if secretOrKey is not provided | Function that returns the key or secret that is used to verify the JWT                                                                                                                                                                                       |

### Verification callback

Verification callback is the callback function that is called after successful JSON Web Token verification. JWT token sections and a special authentication function, usually called `done`, are passed into it after succesful JWT verification. Sections are the JWT `header`, `payload`, `signature` and `input`, the original token as a string. Done is function that calls the underlying passport `success`, `fail` and `error` methods depending on its arguments.

```typescript
passport.use(
  new JwtStrategy(fastJwtOpts, strategyOptions, (sections, done) => {
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

## Support

Currently there's quite limited support for Fast-JWT features. As of writing this I have tested only some features.

A non-comprehensive list of supported and non-supported Fast-JWT features:

- Supports only RSA and EdDSA algorithms.
- No support for Fast-Jwt callback style key fetcher

## Testing

### Keys

Fast-JWT accepts the signing and verifying keys only in PEM format. The tests need `openssl` to be installed on your machine to pass. If it's present, the tests should generate the required keys during tests. If they are not created you can create them with following commands (change the paths and names accordingly if needed):

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

Inspiration and some example taken from [passport-jwt](https://www.npmjs.com/package/passport-jwt) by [Mike Nicholson](https://github.com/mikenicholson)

PS. If someone is more aware of how to write these license sections, please reach me out, so that this can be changed and credits go to correct person in the right way, thanks. I have no intention to pretend that the original idea is completely out of my head.
