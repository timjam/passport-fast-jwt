/* eslint-disable @typescript-eslint/no-explicit-any */
import Express from "express"
import FastJWT from "fast-jwt"
import Passport from "passport"

export type TokenExtractor = (
  request: Express.Request,
) => string | undefined | null

export type JwtSections = FastJWT.DecodedJwt & { input: string }

export type CBWithoutError = (
  sections: JwtSections,
  doneAuth: Passport.AuthenticateCallback,
  request?: Express.Request,
) => void

export type CBWithError = (
  verificationError: any,
  sections: JwtSections,
  doneAuth: Passport.AuthenticateCallback,
  request?: Express.Request,
) => void

export type PassportFastJwtOpts = {
  tokenExtractor: TokenExtractor
  passReqToCallback?: boolean
}

export type PassportFastJwtChallenge = {
  message: string
  type: FastJWT.TokenValidationErrorCode
}
