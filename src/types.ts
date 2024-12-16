/* eslint-disable @typescript-eslint/no-explicit-any */
import Express from "express"
import FastJWT from "fast-jwt"
import Passport from "passport"

export type TokenExtractor = (
  request: Express.Request,
) => string | undefined | null

export type AfterVerifyCallback = (
  sections: FastJWT.DecodedJwt,
  doneAuth: Passport.AuthenticateCallback,
  request?: Express.Request,
) => void

export type VerifierOptions = FastJWT.VerifierOptions & {
  key?:
    | string
    | Buffer
    | ((DecodedJwt: FastJWT.DecodedJwt) => Promise<string | Buffer>)
}

export type Verifier =
  | typeof FastJWT.VerifierSync
  | ((token: string | Buffer) => Promise<any>)

export type CArgs = [
  VerifierOptions | Verifier,
  TokenExtractor,
  AfterVerifyCallback,
]
