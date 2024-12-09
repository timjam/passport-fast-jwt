# Passport-Fast-JWT

> [!WARNING]
> This is still very new module. There might be a lot of issues and this might not work in every use case. If something does not work just let me know and raise an issue.

![Build status](https://github.com/timjam/passport-fast-jwt/actions/workflows/runTests.yml/badge.svg?branch=main)

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

The first argument is a JWT verifier function created with fast-jwt `createVerifier`.

```typescript
type TokenExtractor = (request: Request) => string | undefined | null

type AfterVerifiedCallback = (
  jwtSections:
    | (FastJWT.DecodedJwt & { input: string })
    | FastJWT.DecodedJwt["payload"],
  doneAuth: Passport.AuthenticateCallback,
  request?: Express.Request,
) => void
```

The constructor has two overloads

```typescript
  constructor(
    jwtVerifier: typeof FastJWT.VerifierAsync | typeof FastJWT.VerifierSync,
    tokenExtractor: TokenExtractor,
    afterVerifiedCb: AfterVerifiedCallback,
  )
```

```typescript

const tokenExtractor = Extractors.fromAuthHeaderAsBearerToken()
const jwtVerifier = createVerifier(fastJwtOptions)

passport.use(new JwtStrategy(jwtVerifier, tokenExtractor, (sections, done, request) => {
  try {
    const user = wait User.findone({ id: sections.payload.sub })

    // You can also do something with request here, but it's not required

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

All [Fast-JWT verifier options](https://github.com/nearform/fast-jwt?tab=readme-ov-file#createverifier) can be passed as the `fastJwtOptions`. However, all options combinations haven't been tested, so proceed with caution. If you find any problems with some options, please raise an issue.

### Strategy options

| Option         | Type                                                      | Required | Description                                                                                                                                                                                                                                                  |
| -------------- | --------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| jwtVerifier    | FastJWT.VerifierAsync \| FastJWT.VerifierSync             | required | Verifier function created with fast-jwt `createVerifier` function                                                                                                                                                                                            |
| tokenExtractor | (request: Express.Request) => string \| undefined \| null | required | Function to extract the token from the request. There are some predefined token extractors in the module `fromHeader`, `fromBodyField`, `fromQueryParam`, `fromAuthHeaderAsBearerToken (=== fromAuthHeaderWithScheme("bearer"))`, `fromAuthHeaderWithScheme` |

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
