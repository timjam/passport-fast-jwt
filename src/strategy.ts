import Express from "express"
import FastJWT from "fast-jwt"
import Passport from "passport"
import { Strategy } from "passport-strategy"

import { TokenExtractor } from "./extractors"

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
    tokenExtractor: TokenExtractor,
    afterVerifiedCb: AfterVerifiedCallback,
  ) {
    super()
    this.name = "jwt"

    this.extractToken = tokenExtractor
    this.afterVerifiedCb = afterVerifiedCb
    this.verifyJwt = jwtVerifier
  }

  async authenticate(req: Express.Request): Promise<void> {
    const token = this.extractToken(req)

    /**
     * If this is not defined here and is defined as a class method instead
     * all the calls to this. or super.error/fail/success fail with error i.e.
     * TypeError: (intermediate value).success is not a function
     * This is because of some really weird prototype inheritance error. Even if
     * this was defined correctly as class method without arrow syntax.
     */
    const doneAuth: Passport.AuthenticateCallback = (
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

    if (!token) {
      return this.error(new Error("Auth token not found from request"))
    }

    if (typeof this.verifyJwt === typeof FastJWT.VerifierAsync) {
      this.verifyJwt(token)
        .then((sections: JwtSections) => {
          this.afterVerifiedCb(sections, doneAuth, req)
        })
        .catch((error: Error) => this.fail({ error }, 401))
    } else {
      try {
        const sections = this.verifyJwt(token)
        this.afterVerifiedCb(sections, doneAuth, req)
      } catch (error) {
        this.fail({ error }, 401)
      }
    }
  }
}
