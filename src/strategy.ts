/* eslint-disable @typescript-eslint/no-explicit-any */
import Express from "express"
import FastJWT from "fast-jwt"
import Passport from "passport"
import PassportStrategy from "passport-strategy"

import {
  AfterVerifyCallback,
  CArgs,
  TokenExtractor,
  Verifier,
  VerifierOptions,
} from "./types"

/**
 * @example
 * ```typescript
 * passport.use(new JwtStrategy(jwtVerifier, tokenExtractor, (sections, done, req) => {
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
 *
 * // *-----------* OR *-----------*
 *
 * passport.use(new JwtStrategy(verifierOptions, tokenExtractor, (sections, done, req) => {
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

export class JwtStrategy extends PassportStrategy.Strategy {
  name: string
  private extractToken: TokenExtractor
  private verifyJwt: Verifier
  private afterVerifiedCb: AfterVerifyCallback

  constructor(
    verifierOptions: VerifierOptions,
    tokenExtractor: TokenExtractor,
    afterVerifiedCb: AfterVerifyCallback,
  )
  constructor(
    jwtVerifier: Verifier,
    tokenExtractor: TokenExtractor,
    afterVerifiedCb: AfterVerifyCallback,
  )
  constructor(...args: CArgs) {
    super()
    this.name = "jwt"

    if (typeof args[0] === "function") {
      this.verifyJwt = args[0]
    } else {
      const { key, ...opts } = args[0]

      /**
       * Just making TS happy here
       *
       * If algorithms is "none", the key must not be provided
       */
      if (opts.algorithms?.includes("none")) {
        if (key) {
          console.warn(
            "Key was provided even though algorithms include none. Fast JWT says that if no algorithm is used, they key must not be provided. Thus the provided key parameter will be removed from verifier options",
          )
        }
        this.verifyJwt = FastJWT.createVerifier({ ...opts })
      } else if (typeof key === "string" || key instanceof Buffer) {
        this.verifyJwt = FastJWT.createVerifier({
          ...opts,
          key: key as string | Buffer,
        })
      } else {
        this.verifyJwt = FastJWT.createVerifier({
          ...opts,
          key: key as FastJWT.KeyFetcher,
        })
      }
    }
    this.extractToken = args[1]
    this.afterVerifiedCb = args[2]
  }

  private createSections(
    sections: FastJWT.DecodedJwt | FastJWT.DecodedJwt["payload"],
  ): FastJWT.DecodedJwt {
    return {
      header: sections?.header ?? {},
      payload: sections?.payload ?? sections,
      signature: sections?.signature ?? "",
      input: sections?.input ?? "",
    }
  }

  async authenticate(req: Express.Request): Promise<void> {
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

    // Actual implementation
    try {
      const token = this.extractToken(req)

      if (!token) {
        throw new Error("Auth token not found from request")
      }

      const sections = await this.verifyJwt(token)

      this.afterVerifiedCb(this.createSections(sections), doneAuth, req)
    } catch (error) {
      if (error instanceof FastJWT.TokenError) {
        /**
         * Without this passport strips away everything
         * except the code from TokenError. I guess it has
         * something to do with Fast-JWT TokenError
         * implementation
         *
         * Do note that after the this.error call
         * the error is no longer an instance of
         * TokenError or Error, but just a simple object
         */
        const message = error.message
        const code = error.code
        const name = error.name
        const stack = error.stack

        this.error({ message, code, name, stack } as any)
      } else {
        this.error(error as any)
      }
    }
  }
}
