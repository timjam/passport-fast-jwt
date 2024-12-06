import Express from "express"
import FastJWT from "fast-jwt"
import Passport from "passport"
import { Strategy } from "passport-strategy"

import { TokenExtractor } from "./extractors"
import { jwtVerifier } from "./verifier"

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

/**
 * @example
 * ```typescript
 * passport.use(new JwtStrategy(fastJwtOpts, strategyOptions, (sections, done, req) => {
 *   User.findOne({ id: sections.payload.sub }, (error, user) => {
 *     if (error) {
 *       return done(err, false)
 *     }
 *     if (!user) {
 *       return done(null, false, "User not found", 404)
 *     }
 *     return done(null, user)
 *   })
 * }))
 * ```
 */
export class JwtStrategy extends Strategy {
  name: string
  private extractToken: TokenExtractor
  private verifyJwt: typeof FastJWT.VerifierAsync | typeof FastJWT.VerifierSync
  private afterVerifiedCb: AfterVerifiedCallback

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
  constructor(
    ...args: [
      (
        | Omit<FastJWT.VerifierOptions, "complete">
        | typeof FastJWT.VerifierAsync
        | typeof FastJWT.VerifierSync
      ),
      StrOptions,
      AfterVerifiedCallback,
    ]
  ) {
    super()
    this.name = "jwt"

    const strOpts = args[1] as StrOptions
    const verifiedCb = args[2] as AfterVerifiedCallback

    this.extractToken = strOpts.tokenExtractor

    this.afterVerifiedCb = verifiedCb

    if (typeof args[0] === "function") {
      this.verifyJwt = args[0]
    } else if (args[0].constructor.name === "Object") {
      this.verifyJwt = jwtVerifier(
        args[0],
        strOpts.secretOrKey,
        strOpts.keyFetcher,
      )
    } else {
      throw new Error(
        "First argument must be either object containing fast-jwt options except 'complete' or a verfier function created with fast-jwt createVerifier",
      )
    }
  }

  private doneAuth: Passport.AuthenticateCallback = (
    error,
    user,
    info,
    status,
  ) => {
    if (error) {
      return this.error(error)
    }

    if (!user) {
      if (status && Array.isArray(status)) {
        return this.fail({ info, status }, 401)
      }
      return this.fail(info, status ?? 401)
    }

    return this.success(user, info)
  }

  async authenticate(req: Express.Request): Promise<void> {
    const token = this.extractToken(req)

    if (!token) {
      return this.error(new Error("Auth token not found from request"))
    }

    this.verifyJwt(token)
      .then((sections: JwtSections) => {
        this.afterVerifiedCb(sections, this.doneAuth, req)
      })
      .catch((error: Error) => this.fail({ error }, 401))
  }
}
