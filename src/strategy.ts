/* eslint-disable @typescript-eslint/no-explicit-any */
import Express from "express"
import FastJWT, { TokenError } from "fast-jwt"
import Passport from "passport"
import { Strategy } from "passport-strategy"

import { createSections } from "./helpers/createSections"
import {
  AfterVerifyCallback,
  PassportFastJwtOpts,
  TokenExtractor,
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
 * ```
 */

export class JwtStrategy extends Strategy {
  name: string
  private passReqToCallback: boolean
  private extractToken: TokenExtractor
  private verifyJwt: typeof FastJWT.VerifierSync
  private afterVerifiedCb: AfterVerifyCallback

  constructor(
    jwtVerifier: typeof FastJWT.VerifierSync,
    options: PassportFastJwtOpts,
    afterVerifiedCb: AfterVerifyCallback,
  ) {
    super()
    this.name = "jwt"

    this.extractToken = options.tokenExtractor
    this.afterVerifiedCb = afterVerifiedCb
    this.verifyJwt = jwtVerifier
    this.passReqToCallback = options.passReqToCallback ?? false
  }

  // private isErrorHandler() {
  //   if (this.afterVerifiedCb.length === 4) return true
  //   if (this.afterVerifiedCb.length === 3 && !this.passReqToCallback)
  //     return true
  //   return false
  // }

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
        throw new TokenError("Auth token not found from request")
      }

      const sections = await this.verifyJwt(token)

      this.afterVerifiedCb(createSections(sections), doneAuth, req)

      // if (this.isErrorHandler()) {
      //   ;(this.afterVerifiedCb as CBWithError)(
      //     null,
      //     createSections(sections),
      //     doneAuth,
      //     req,
      //   )
      // } else {
      //   ;(this.afterVerifiedCb as CBWithoutError)(
      //     createSections(sections),
      //     doneAuth,
      //     req,
      //   )
      // }
    } catch (error) {
      // if (this.isErrorHandler()) {
      //   ;(this.afterVerifiedCb as CBWithError)(
      //     error,
      //     createSections(undefined),
      //     doneAuth,
      //     req,
      //   )
      // } else {
      if (error instanceof TokenError) {
        const message = error.message
        const code = error.code
        const name = error.name
        const stack = error.stack

        this.error({ message, code, name, stack } as any)
      } else {
        this.error(error as any)
      }
      // }
    }
  }
}
