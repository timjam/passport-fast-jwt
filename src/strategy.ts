import { Request } from "express"
import {
  DecodedJwt,
  KeyFetcher,
  VerifierAsync,
  VerifierOptions,
  VerifierSync,
} from "fast-jwt"
import { AuthenticateCallback, DoneCallback } from "passport"
import { Strategy } from "passport-strategy"

import { TokenExtractor } from "./extractors"
import { isDefined } from "./helpers/isDefined"
import { jwtVerifier } from "./verifier"

type StrOptions = {
  tokenExtractor: TokenExtractor
  passRequestToCallback?: boolean
} & (
  | { secretOrKey: string | Buffer; keyFetcher: undefined }
  | { secretOrKey: undefined; keyFetcher: KeyFetcher }
)

type JwtSections = DecodedJwt & { input: string }

type VerifyCallback =
  | ((jwtSections: JwtSections, done: DoneCallback) => void)
  | ((
      jwtSections: JwtSections,
      doneAuth: AuthenticateCallback,
      request?: Request,
    ) => void)

/**
 * @example
 * ```typescript
 * passport.use(new JwtStrategy(fastJwtOpts, strategyOptions, (sections, done) => {
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
  private passRequestToCallback: boolean
  private verifyJwt: typeof VerifierAsync | typeof VerifierSync
  private verifyCb: VerifyCallback

  constructor(
    fastJwtOptions: Omit<VerifierOptions, "complete">,
    strategyOptions: StrOptions,
    verifyCb: VerifyCallback,
  ) {
    super()
    this.name = "jwt"
    this.extractToken = strategyOptions.tokenExtractor
    this.passRequestToCallback = strategyOptions.passRequestToCallback ?? false
    this.verifyJwt = jwtVerifier(
      fastJwtOptions,
      strategyOptions.secretOrKey,
      strategyOptions.keyFetcher,
    )
    this.verifyCb = verifyCb
  }

  private doneAuth: AuthenticateCallback = (error, user, info, status) => {
    if (error) {
      return this.error(error)
    }

    if (!user) {
      if (status && Array.isArray(status)) {
        const statuses = status.filter(isDefined)
        return this.fail({ info, statuses }, 401)
      }
      return this.fail(info, status ?? 401)
    }

    return this.success(user, info)
  }

  authenticate(req: Request): void {
    const token = this.extractToken(req)

    if (!token) {
      return this.error(new Error("Auth token not found from request"))
    }

    this.verifyJwt(token)
      .then((sections: JwtSections) => {
        if (this.passRequestToCallback) {
          this.verifyCb(sections, this.doneAuth, req)
        } else {
          this.verifyCb(sections, this.doneAuth)
        }
      })
      .catch((error: Error) => this.fail({ error }, 401))
  }
}
